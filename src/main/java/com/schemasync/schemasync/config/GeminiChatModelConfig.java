package com.schemasync.schemasync.config;

import com.schemasync.schemasync.mapping.SchemaMappingAssistant;
import dev.langchain4j.exception.RateLimitException;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.service.AiServices;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class GeminiChatModelConfig {

    private static final Logger log = LoggerFactory.getLogger(GeminiChatModelConfig.class);

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model-name:gemini-flash-lite-latest}")
    private String primaryModelName;

    @Value("${gemini.fallback-models:gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3.6-flash,gemini-3.8-flash}")
    private String fallbackModelsProperty;

    @Bean
    public ChatModel geminiChatModel() {
        return GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName(primaryModelName)
                .maxRetries(0)
                .build();
    }

    private record NamedAssistant(String modelName, SchemaMappingAssistant assistant) {}

    @Bean
    public SchemaMappingAssistant schemaMappingAssistant() {
        List<String> modelChain = new ArrayList<>();
        if (primaryModelName != null && !primaryModelName.isBlank()) {
            modelChain.add(primaryModelName.trim());
        }

        if (fallbackModelsProperty != null && !fallbackModelsProperty.isBlank()) {
            Arrays.stream(fallbackModelsProperty.split(","))
                    .map(String::trim)
                    .filter(m -> !m.isBlank())
                    .forEach(m -> {
                        if (!modelChain.contains(m)) {
                            modelChain.add(m);
                        }
                    });
        }

        log.info("Initialized Gemini fallback chain with models: {}", modelChain);

        List<NamedAssistant> assistants = modelChain.stream()
                .map(model -> new NamedAssistant(
                        model,
                        AiServices.builder(SchemaMappingAssistant.class)
                                .chatModel(GoogleAiGeminiChatModel.builder()
                                        .apiKey(apiKey)
                                        .modelName(model)
                                        .maxRetries(0)
                                        .build())
                                .build()
                ))
                .toList();

        return (schema, sourceBatchJson) -> {
            Exception lastException = null;
            for (int i = 0; i < assistants.size(); i++) {
                NamedAssistant candidate = assistants.get(i);
                try {
                    return candidate.assistant().mapBatch(schema, sourceBatchJson);
                } catch (Exception e) {
                    lastException = e;
                    if (i < assistants.size() - 1) {
                        NamedAssistant next = assistants.get(i + 1);
                        log.warn("Gemini model '{}' unavailable or failed ({}). Switching to next fallback model '{}'.",
                                candidate.modelName(),
                                e.getMessage() != null ? e.getMessage().trim() : e.getClass().getSimpleName(),
                                next.modelName());
                    } else {
                        log.error("Gemini model '{}' failed and no more fallback models available in chain.",
                                candidate.modelName(), e);
                    }
                }
            }

            if (lastException instanceof RateLimitException rle) {
                throw rle;
            }
            if (lastException instanceof RuntimeException re) {
                throw re;
            }
            throw new RuntimeException("All Gemini models in fallback chain failed", lastException);
        };
    }
}