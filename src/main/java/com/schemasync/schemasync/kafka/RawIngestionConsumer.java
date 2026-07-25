package com.schemasync.schemasync.kafka;

import com.google.common.util.concurrent.RateLimiter;
import com.schemasync.schemasync.customerrecord.CustomerRecord;
import com.schemasync.schemasync.customerrecord.CustomerRecordRepository;
import com.schemasync.schemasync.dlq.DlqRecord;
import com.schemasync.schemasync.dlq.DlqRecordRepository;
import com.schemasync.schemasync.dlq.DlqStatus;
import com.schemasync.schemasync.dlq.FailureReason;
import com.schemasync.schemasync.ingestionjob.IngestionJob;
import com.schemasync.schemasync.ingestionjob.IngestionJobRepository;
import com.schemasync.schemasync.ingestionjob.StatusType;
import com.schemasync.schemasync.mapping.LlmRateLimitedException;
import com.schemasync.schemasync.mapping.SchemaMappingService;
import com.schemasync.schemasync.validation.RowValidationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.schemasync.schemasync.config.KafkaTopicConfig.RAW_INGESTION_TOPIC;

@Component
@RequiredArgsConstructor
public class RawIngestionConsumer {

    private static final Logger log = LoggerFactory.getLogger(RawIngestionConsumer.class);

    private final ObjectMapper objectMapper;
    private final IngestionJobRepository ingestionJobRepository;
    private final CustomerRecordRepository customerRecordRepository;
    private final SchemaMappingService schemaMappingService;
    private final RowValidationService rowValidationService;
    private final DlqProducerService dlqProducerService;
    private final DlqRecordRepository dlqRecordRepository;

    private final RateLimiter rateLimiter = RateLimiter.create(15.0 / 60.0);

    @KafkaListener(topics = RAW_INGESTION_TOPIC)
    @Transactional
    public void consumeBatch(List<String> messageJsons, Acknowledgment acknowledgment) {
        try {
            //create a batch record
            List<RawRowMessage> batch = new ArrayList<>();
            for (String json : messageJsons) {
                batch.add(objectMapper.readValue(json, RawRowMessage.class));
            }

            if (batch.isEmpty()) {
                acknowledgment.acknowledge();
                return;
            }
            //Group consumed batch by jobId
            Map<UUID, List<RawRowMessage>> byJob = batch.stream()
                    .collect(Collectors.groupingBy(RawRowMessage::jobId));

            //Process all jobs 1 by 1
            for (Map.Entry<UUID, List<RawRowMessage>> entry : byJob.entrySet()) {
                processJobBatch(entry.getKey(), entry.getValue());
            }
            acknowledgment.acknowledge();
            //If Gemini throws Rate Limit exception catch it and push current batch to DLQ
        } catch (LlmRateLimitedException e) {
            log.warn("Rate limited — routing batch to DLQ instead of retrying", e);
            routeEntireBatchToDlq(messageJsons, FailureReason.LLM_RATE_LIMITED);
            acknowledgment.acknowledge();
        } catch (Exception e) {
            log.error("Batch processing failed, initiating retry...", e);
            throw new RuntimeException("Failed to process batch", e);
        }
    }

    private void routeEntireBatchToDlq(List<String> messageJsons, FailureReason reason) {
        for (String json : messageJsons) {
            try {
                RawRowMessage msg = objectMapper.readValue(json, RawRowMessage.class);
                dlqProducerService.publishToDlq(
                        new DlqMessage(msg.jobId(), msg.rowIndex(), msg.rowData(), reason));
            } catch (Exception ignored) {
            }
        }
    }

    private void processJobBatch(UUID jobId, List<RawRowMessage> messages) {
        //validate and find job
        IngestionJob job = ingestionJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalStateException("Unknown jobId: " + jobId));

        //list all index from a job(file)
        List<Long> requestedIndexes = messages.stream()
                .map(RawRowMessage::rowIndex)
                .toList();

        //find all already persist(proceseed index from a particular job)
        Set<Long> alreadyProcessed = customerRecordRepository
                .findByJob_IdAndRowIndexIn(jobId, requestedIndexes)
                .stream()
                .map(CustomerRecord::getRowIndex)
                .collect(Collectors.toSet());

        //filter out unprocessed rawRows
        List<RawRowMessage> unseenMessages = messages.stream()
                .filter(m -> !alreadyProcessed.contains(m.rowIndex()))
                .toList();

        if (unseenMessages.isEmpty()) {
            return;
        }

        // Rows already sitting in the DLQ, being retried right now — needed
        Map<Long, DlqRecord> pendingDlqByRowIndex = dlqRecordRepository
                .findByJob_IdAndRowIndexInAndStatus(
                        jobId,
                        unseenMessages.stream().map(RawRowMessage::rowIndex).toList(),
                        DlqStatus.PENDING_RETRY)
                .stream()
                .collect(Collectors.toMap(DlqRecord::getRowIndex, r -> r));

        rateLimiter.acquire();

        List<Map<String, Object>> llmPayload = new ArrayList<>();
        for (RawRowMessage msg : unseenMessages) {
            Map<String, Object> rowWithIndex = new HashMap<>(msg.rowData());
            rowWithIndex.put("rowIndex", msg.rowIndex());
            llmPayload.add(rowWithIndex);
        }

        //Received Processed batch from llm
        List<CustomerRecord> mappedCandidates = schemaMappingService.mapBatch(llmPayload);

        Map<Long, Map<String, String>> rawByIndex = unseenMessages.stream()
                .collect(Collectors.toMap(RawRowMessage::rowIndex, RawRowMessage::rowData));

        //JAVA VALIDATION SANDBOX
        List<CustomerRecord> recordsToSave = new ArrayList<>();
        int newlyProcessed = 0;
        int newlyFailed = 0;
        int flippedFromFailedToProcessed = 0;

        //Perform validation for each llm processed candidate
        for (CustomerRecord candidate : mappedCandidates) {
            candidate.setJob(job);
            candidate.setClient(job.getClient());
            DlqRecord pendingDlq = pendingDlqByRowIndex.get(candidate.getRowIndex());

            var validationFailure = rowValidationService.validate(candidate);
            if (validationFailure.isPresent()) {
                Map<String, String> rawPayload = rawByIndex.get(candidate.getRowIndex());
                dlqProducerService.publishToDlq(new DlqMessage(
                        jobId, candidate.getRowIndex(), rawPayload, validationFailure.get()));
                if (pendingDlq == null) {
                    // A genuinely new failure — count it. A repeat failure on
                    newlyFailed++;
                }
                continue;
            }

            boolean isDuplicate = false;
            if (candidate.getEmail() != null) {
                Optional<CustomerRecord> duplicate = customerRecordRepository
                        .findByClient_IdAndEmail(job.getClient().getId(), candidate.getEmail());
                isDuplicate = duplicate.isPresent();
            }

            if (isDuplicate) {
                log.info("Skipping duplicate customer: {}",candidate.getEmail());
            } else {
                recordsToSave.add(candidate);
            }

            if (pendingDlq != null) {
                pendingDlq.setStatus(DlqStatus.RESOLVED);
                pendingDlq.setResolvedAt(LocalDateTime.now());
                dlqRecordRepository.save(pendingDlq);
                flippedFromFailedToProcessed++;
            } else {
                newlyProcessed++;
            }
        }
        //saveAll valide candidates at last
        customerRecordRepository.saveAll(recordsToSave);

        //update job analytics
        job.setProcessedRecords(job.getProcessedRecords()+newlyProcessed+flippedFromFailedToProcessed);
        job.setFailedRecords(job.getFailedRecords()+newlyFailed-flippedFromFailedToProcessed);
        maybeCompleteJob(job);
        ingestionJobRepository.save(job);
    }

    //If all candidates are processed update job status to completed
    private void maybeCompleteJob(IngestionJob job) {
        long done = job.getProcessedRecords() + job.getFailedRecords();
        if (done >= job.getTotalRecords()) {
            job.setStatus(job.getFailedRecords() == 0 ? StatusType.COMPLETED : StatusType.PARTIAL_FAILURE);
        }
    }
}