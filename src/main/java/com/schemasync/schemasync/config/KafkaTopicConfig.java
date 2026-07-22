package com.schemasync.schemasync.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String RAW_INGESTION_TOPIC = "raw-ingestion";
    public static final String INGESTION_DLQ_TOPIC = "ingestion-dlq";

    @Bean
    public NewTopic rawIngestionTopic() {
        return TopicBuilder.name(RAW_INGESTION_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic ingestionDlqTopic() {
        return TopicBuilder.name(INGESTION_DLQ_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }
}