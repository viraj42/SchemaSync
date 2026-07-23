package com.schemasync.schemasync.mapping;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface SchemaMappingAssistant {

    @SystemMessage("""
            You are a strict data-mapping engine for a customer data ingestion system.
            Map the given source row (a JSON object of columnName -> value) onto this target schema:
            {{schema}}
            
            Rules:
            - Only map a source column to a target field if you are genuinely confident they represent the same concept.
            - If no source column confidently matches a target field, return null for that field.
            - Never invent, guess, infer, or fabricate a value that is not clearly present in the source row.
            - Return dates in ISO-8601 (yyyy-MM-dd) format, or null if not confidently parseable.
            """)
    MappedRowResult mapRow(@V("schema") String schema, @UserMessage String sourceRowJson);
}