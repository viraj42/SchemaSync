package com.schemasync.schemasync.mapping;

import com.schemasync.schemasync.customerrecord.CustomerRecord;
import com.schemasync.schemasync.targetschema.TargetSchemaCacheService;
import dev.langchain4j.exception.RateLimitException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SchemaMappingService {

    private final SchemaMappingAssistant schemaMappingAssistant;
    private final TargetSchemaCacheService targetSchemaCacheService;
    private final ObjectMapper objectMapper;

    public CustomerRecord mapRow(Map<String, String> rowData) {
        String schemaDescription = targetSchemaCacheService.getSchemaPromptDescription();
        String rowJson = objectMapper.writeValueAsString(rowData);

        MappedRowResult result;
        try {
            result = schemaMappingAssistant.mapRow(schemaDescription, rowJson);
        } catch (RateLimitException e) {
            // Distinct log signal — this is a "retry later" failure, not a
            // "will never succeed" one. Phase 5's DLQ taxonomy formalizes
            // this distinction (LLM_RATE_LIMITED); for now, at minimum,
            // don't let it look identical to every other kind of failure.
            throw new LlmRateLimitedException("Gemini rate limit hit while mapping row", e);
        }

        CustomerRecord record = new CustomerRecord();
        record.setFullName(result.fullName());
        record.setEmail(result.email());
        record.setPhone(result.phone());
        record.setCompany(result.company());
        record.setRole(result.role());
        record.setJoinDate(parseDateSafely(result.joinDate()));
        return record;
    }

    private LocalDate parseDateSafely(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(raw.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}