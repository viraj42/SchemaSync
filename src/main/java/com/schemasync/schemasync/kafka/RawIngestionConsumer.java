package com.schemasync.schemasync.kafka;

import com.schemasync.schemasync.customerrecord.CustomerRecord;
import com.schemasync.schemasync.customerrecord.CustomerRecordRepository;
import com.schemasync.schemasync.ingestionjob.IngestionJob;
import com.schemasync.schemasync.ingestionjob.IngestionJobRepository;
import com.schemasync.schemasync.ingestionjob.StatusType;
import com.schemasync.schemasync.mapping.SchemaMappingService;
import com.schemasync.schemasync.upload.CustomerRecordColumnMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.Optional;

import static com.schemasync.schemasync.config.KafkaTopicConfig.RAW_INGESTION_TOPIC;

@Component
@RequiredArgsConstructor
public class RawIngestionConsumer {

    private static final Logger log = LoggerFactory.getLogger(RawIngestionConsumer.class);

    private final ObjectMapper objectMapper;
    private final IngestionJobRepository ingestionJobRepository;
    private final CustomerRecordRepository customerRecordRepository;
    private final SchemaMappingService schemaMappingService;

    @KafkaListener(topics = RAW_INGESTION_TOPIC)
    @Transactional
    public void consume(String messageJson, Acknowledgment acknowledgment) {
        try {
            RawRowMessage message = objectMapper.readValue(messageJson, RawRowMessage.class);
            processRow(message);
            acknowledgment.acknowledge();
        } catch (Exception e) {
            throw new RuntimeException("Failed to process raw row message", e);
        }
    }

    private void processRow(RawRowMessage message) {
        IngestionJob job = ingestionJobRepository.findById(message.jobId())
                .orElseThrow(() -> new IllegalStateException("Unknown jobId: " + message.jobId()));

        // Check 1: is this a Kafka redelivery of a message we already processed?
        Optional<CustomerRecord> redeliveryMatch = customerRecordRepository
                .findByJob_IdAndRowIndex(message.jobId(), message.rowIndex());

        if (redeliveryMatch.isPresent()) {
            // Safe no-op — same message, already handled.
            return;
        }

        CustomerRecord candidate = schemaMappingService.mapRow(message.rowData());
        candidate.setJob(job);
        candidate.setClient(job.getClient());
        candidate.setRowIndex(message.rowIndex());

        // Check 2: does this customer already exist for this client, from a
        // different job entirely (e.g. a re-uploaded file)?
        if (candidate.getEmail() != null) {
            Optional<CustomerRecord> businessDuplicate = customerRecordRepository
                    .findByClient_IdAndEmail(job.getClient().getId(), candidate.getEmail());

            if (businessDuplicate.isPresent()) {
                // Placeholder policy for Phase 2: skip, don't overwrite, don't fail.
                // Phase 5 replaces this with real DLQ routing (e.g. DUPLICATE_RECORD)
                // and/or a deliberate update policy — not decided yet.
                log.info("Skipping duplicate customer record: client={}, email={}, job={}, row={}",
                        job.getClient().getId(), candidate.getEmail(), message.jobId(), message.rowIndex());
                job.setProcessedRecords(job.getProcessedRecords() + 1);
                maybeCompleteJob(job);
                ingestionJobRepository.save(job);
                return;
            }
        }

        customerRecordRepository.save(candidate);
        job.setProcessedRecords(job.getProcessedRecords() + 1);
        maybeCompleteJob(job);
        ingestionJobRepository.save(job);
    }

    private void maybeCompleteJob(IngestionJob job) {
        long done = job.getProcessedRecords() + job.getFailedRecords();
        if (done >= job.getTotalRecords()) {
            job.setStatus(job.getFailedRecords() == 0 ? StatusType.COMPLETED : StatusType.PARTIAL_FAILURE);
        }
    }
}