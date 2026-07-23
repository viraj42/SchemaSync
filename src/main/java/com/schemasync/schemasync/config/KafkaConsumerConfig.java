package com.schemasync.schemasync.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaConsumerConfig {

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
            ConsumerFactory<String, String> consumerFactory) {

        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);

        // Must be set explicitly — this custom factory bean replaces Spring
        // Boot's auto-configured one, so application.properties' ack-mode
        // no longer applies automatically once this bean exists.
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);

        // 60s between attempts, 3 tries — gives real quota windows a chance
        // to reset instead of hammering the API in a tight loop.
        FixedBackOff backOff = new FixedBackOff(60_000L, 3L);
        factory.setCommonErrorHandler(new DefaultErrorHandler(backOff));

        return factory;
    }
}