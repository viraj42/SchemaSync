package com.schemasync.schemasync.mapping;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface SchemaMappingAssistant {

    @SystemMessage("""
            You are a strict data-mapping engine for a customer data ingestion system.
            You will receive a JSON array containing a batch of source rows.
            Map each source row onto this target schema:
            {{schema}}
            
            Column-mapping rules:
            - Only map a source column to a target field if you are genuinely confident they represent the same concept.
            - If no source column confidently matches a target field, return null for that field.
            
            Value-quality rules — apply these even when the column mapping itself is correct:
            - Examine the actual value, not just the column name. If a value is a placeholder, test data,
              or otherwise not real (examples: "unknown@example.com", "test@test.com", "n/a", "N/A",
              "unknown", "asdf", "0000000000", "1234567890", a phone number far shorter than a real
              phone number, or any other clearly fake or garbage value), treat it as absent and return
              null for that field — even though the source column matched correctly.
            - Never invent, guess, infer, fabricate, or "correct" a value. Your only two options for any
              field are: pass through the real source value exactly as given, or return null. Do not
              reformat, normalize, or generate a replacement value under any circumstance.
            
            Output rules:
            - Return ONLY a single JSON object with a 'results' key containing an array of your mapped objects.
            - You MUST include the exact original 'rowIndex' for each object so we can correlate them.
            - Return dates in ISO-8601 (yyyy-MM-dd) format, or null if not confidently parseable.
            """)
    MappedBatchResult mapBatch(@V("schema") String schema, @UserMessage String sourceBatchJson);
}