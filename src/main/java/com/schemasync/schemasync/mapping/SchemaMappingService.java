package com.schemasync.schemasync.mapping;

import com.schemasync.schemasync.customerrecord.CustomerRecord;
import com.schemasync.schemasync.targetschema.TargetSchemaCacheService;
import dev.langchain4j.exception.RateLimitException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SchemaMappingService {

    private final SchemaMappingAssistant schemaMappingAssistant;
    private final TargetSchemaCacheService targetSchemaCacheService;
    private final ObjectMapper objectMapper;

    // Accept a list of mapped rows containing the rowIndex and data
    public List<CustomerRecord> mapBatch(List<Map<String, Object>> batchData) {
        String schemaDescription = targetSchemaCacheService.getSchemaPromptDescription();
        //serialize entire batch
        String batchJson;
        try {
            batchJson = objectMapper.writeValueAsString(batchData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize batch for LLM", e);
        }
        //create container to store llm output
        MappedBatchResult llmWrapper;
        try {
            // One API call for the whole batch, returning our wrapper object!
            llmWrapper = schemaMappingAssistant.mapBatch(schemaDescription, batchJson);
        } catch (RateLimitException e) {
            throw new LlmRateLimitedException("Gemini rate limit hit while mapping batch", e);
        }

        List<CustomerRecord> mappedRecords = new ArrayList<>();

        // Unwrap the list here by calling .results()
        if (llmWrapper != null && llmWrapper.results() != null) {
            for (MappedRowResult result : llmWrapper.results()) {
                CustomerRecord record = new CustomerRecord();
                record.setRowIndex(result.rowIndex()); // We got the index back from the LLM
                record.setFullName(result.fullName());
                record.setEmail(result.email());
                record.setPhone(result.phone());
                record.setCompany(result.company());
                record.setRole(result.role());
                record.setJoinDate(parseDateSafely(result.joinDate()));
                mappedRecords.add(record);
            }
        }

        return mappedRecords;
    }

    private LocalDate parseDateSafely(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return LocalDate.parse(raw.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}