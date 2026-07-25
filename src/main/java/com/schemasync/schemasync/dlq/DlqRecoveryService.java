package com.schemasync.schemasync.dlq;

import com.schemasync.schemasync.customerrecord.CustomerRecord;
import com.schemasync.schemasync.customerrecord.CustomerRecordRepository;
import com.schemasync.schemasync.customerrecord.CustomerRecordResponse;
import com.schemasync.schemasync.ingestionjob.IngestionJob;
import com.schemasync.schemasync.ingestionjob.IngestionJobRepository;
import com.schemasync.schemasync.ingestionjob.StatusType;
import com.schemasync.schemasync.kafka.KafkaProducerService;
import com.schemasync.schemasync.kafka.RawRowMessage;
import com.schemasync.schemasync.validation.RowValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DlqRecoveryService {

    private static final Set<FailureReason> RETRYABLE_REASONS =
            EnumSet.of(FailureReason.LLM_RATE_LIMITED, FailureReason.TRANSIENT_ERROR);

    private final DlqRecordRepository dlqRecordRepository;
    private final IngestionJobRepository ingestionJobRepository;
    private final CustomerRecordRepository customerRecordRepository;
    private final RowValidationService rowValidationService;
    private final KafkaProducerService kafkaProducerService;
    private final ObjectMapper objectMapper;

    public Page<DlqRecordResponse> listFailures(UUID jobId, Pageable pageable) {
        return dlqRecordRepository.findByJob_Id(jobId, pageable).map(DlqRecordResponse::from);
    }

    @Transactional
    public void retry(UUID jobId, UUID recordId) {
        DlqRecord record = getOwnedRecord(jobId, recordId);

        if (!RETRYABLE_REASONS.contains(record.getFailureReason())) {
            throw new IllegalStateException(
                    "Failure reason " + record.getFailureReason() + " is not retryable — use manual correction instead.");
        }

        Map<String, String> rawRow = deserializeRawPayload(record.getRawPayload());
        record.setRetryCount(record.getRetryCount() + 1);
        dlqRecordRepository.save(record);

        // Re-publish to raw-ingestion for a genuine second attempt through
        // the full LLM + validation pipeline — not a shortcut, an actual retry.
        kafkaProducerService.publishRawRow(new RawRowMessage(jobId, record.getRowIndex(), rawRow));
    }

    @Transactional
    public CustomerRecordResponse applyManualCorrection(UUID jobId, UUID recordId, ManualCorrectionRequest request) {
        DlqRecord dlqRecord = getOwnedRecord(jobId, recordId);
        IngestionJob job = dlqRecord.getJob();

        CustomerRecord candidate = new CustomerRecord();
        candidate.setJob(job);
        candidate.setClient(job.getClient());
        candidate.setRowIndex(dlqRecord.getRowIndex());
        candidate.setFullName(request.fullName());
        candidate.setEmail(request.email());
        candidate.setPhone(request.phone());
        candidate.setCompany(request.company());
        candidate.setRole(request.role());
        candidate.setJoinDate(parseDateSafely(request.joinDate()));

        // Same deterministic validation as the LLM path — a human-supplied
        // value that's still missing a required field fails the same way.
        var validationFailure = rowValidationService.validate(candidate);
        if (validationFailure.isPresent()) {
            throw new IllegalArgumentException(
                    "Correction still fails validation: " + validationFailure.get());
        }

        CustomerRecord saved = customerRecordRepository.save(candidate);

        dlqRecord.setStatus(DlqStatus.RESOLVED);
        dlqRecord.setResolvedAt(LocalDateTime.now());
        dlqRecordRepository.save(dlqRecord);

        job.setProcessedRecords(job.getProcessedRecords() + 1);
        job.setFailedRecords(job.getFailedRecords() - 1);
        maybeCompleteJob(job);
        ingestionJobRepository.save(job);

        return CustomerRecordResponse.from(saved);
    }

    private DlqRecord getOwnedRecord(UUID jobId, UUID recordId) {
        DlqRecord record = dlqRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown DLQ record: " + recordId));
        if (!record.getJob().getId().equals(jobId)) {
            throw new IllegalArgumentException("DLQ record does not belong to job " + jobId);
        }
        return record;
    }

    private Map<String, String> deserializeRawPayload(String rawPayload) {
        try {
            return objectMapper.readValue(rawPayload, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }

    private LocalDate parseDateSafely(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return LocalDate.parse(raw.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private void maybeCompleteJob(IngestionJob job) {
        long done = job.getProcessedRecords() + job.getFailedRecords();
        if (done >= job.getTotalRecords()) {
            job.setStatus(job.getFailedRecords() == 0 ? StatusType.COMPLETED : StatusType.PARTIAL_FAILURE);
        }
    }
}