package com.schemasync.schemasync.kafka;

import com.schemasync.schemasync.dlq.DlqRecord;
import com.schemasync.schemasync.dlq.DlqRecordRepository;
import com.schemasync.schemasync.dlq.DlqStatus;
import com.schemasync.schemasync.ingestionjob.IngestionJob;
import com.schemasync.schemasync.ingestionjob.IngestionJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Optional;

import static com.schemasync.schemasync.config.KafkaTopicConfig.INGESTION_DLQ_TOPIC;

@Component
@RequiredArgsConstructor
public class DlqConsumer {

    private final ObjectMapper objectMapper;
    private final DlqRecordRepository dlqRecordRepository;
    private final IngestionJobRepository ingestionJobRepository;

    @KafkaListener(topics = INGESTION_DLQ_TOPIC)
    @Transactional
    public void consume(List<String> messageJsons, Acknowledgment acknowledgment) {
        for (String json : messageJsons) {
            DlqMessage message = objectMapper.readValue(json, DlqMessage.class);
            upsert(message);
        }
        acknowledgment.acknowledge();
    }

    private void upsert(DlqMessage message) {
        IngestionJob job = ingestionJobRepository.findById(message.jobId())
                .orElseThrow(() -> new IllegalStateException("Unknown jobId: " + message.jobId()));

        // Same row failing twice (e.g. a retry that failed again) updates the
        // existing entry rather than piling up duplicate DLQ rows for one
        // (job, rowIndex) — this is also what makes the counter-flip logic
        // in RawIngestionConsumer able to tell "still failing" apart from
        // "brand new failure".
        Optional<DlqRecord> existing = dlqRecordRepository
                .findByJob_IdAndRowIndex(message.jobId(), message.rowIndex());

        DlqRecord record = existing.orElseGet(DlqRecord::new);
        record.setJob(job);
        record.setRowIndex(message.rowIndex());
        record.setRawPayload(serializeRawPayload(message));
        record.setFailureReason(message.failureReason());
        record.setStatus(DlqStatus.PENDING_RETRY);
        record.setRetryCount(existing.map(r -> r.getRetryCount() + (existing.isPresent() ? 0 : 0)).orElse(0));
        // Note: retryCount itself is incremented explicitly by the retry
        // endpoint, not here — this consumer just reflects current failure
        // state, retry count reflects how many times a human asked for another attempt.
        dlqRecordRepository.save(record);
    }

    private String serializeRawPayload(DlqMessage message) {
        try {
            return objectMapper.writeValueAsString(message.rawPayload());
        } catch (Exception e) {
            return "{}";
        }
    }
}