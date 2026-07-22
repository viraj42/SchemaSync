package com.schemasync.schemasync.kafka;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;
import static com.schemasync.schemasync.config.KafkaTopicConfig.RAW_INGESTION_TOPIC;

@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String,String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    //Send a rawRowMessage to kafka topic and particular partition
    public void publishRawRow(RawRowMessage message){
        try{
            String json=objectMapper.writeValueAsString(message);//serialize the data
            kafkaTemplate.send(RAW_INGESTION_TOPIC, message.jobId().toString(), json);//send data to kafka
        }
        catch (Exception e){
            throw new RuntimeException("Failed to serialize/publish RawRowMessage", e);
        }
    }

}
