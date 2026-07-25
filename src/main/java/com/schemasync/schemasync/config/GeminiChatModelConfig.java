package com.schemasync.schemasync.config;

import com.schemasync.schemasync.mapping.SchemaMappingAssistant;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GeminiChatModelConfig {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model-name}")
    private String modelName;

    @Bean
    public ChatModel geminiChatModel() {
        return GoogleAiGeminiChatModel.builder().apiKey(apiKey).modelName(modelName).maxRetries(0).build();
    }

    @Bean
    public SchemaMappingAssistant schemaMappingAssistant(ChatModel geminiChatModel) {
        return AiServices.builder(SchemaMappingAssistant.class)
                .chatModel(geminiChatModel)
                .build();
    }
}