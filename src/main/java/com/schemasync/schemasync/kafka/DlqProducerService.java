package com.schemasync.schemasync.kafka;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import static com.schemasync.schemasync.config.KafkaTopicConfig.INGESTION_DLQ_TOPIC;

@Service
@RequiredArgsConstructor
public class DlqProducerService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishToDlq(DlqMessage message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            kafkaTemplate.send(INGESTION_DLQ_TOPIC, message.jobId().toString(), json);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize/publish DlqMessage", e);
        }
    }
}