package com.schemasync.schemasync.targetschema;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TargetSchemaCacheService {

    private final TargetSchemaFieldRepository repository;
    private volatile String cachedSchemaDescription;

    public String getSchemaPromptDescription() {
        String local = cachedSchemaDescription;
        if (local == null) {
            synchronized (this) {
                local = cachedSchemaDescription;
                if (local == null) {
                    local = buildDescription();
                    cachedSchemaDescription = local;
                }
            }
        }
        return local;
    }

    private String buildDescription() {
        return repository.findAll().stream()
                .map(f -> "- " + f.getFieldName() + " (" + f.getFieldType() + ", "
                        + (f.isRequired() ? "required" : "optional") + "): " + f.getDescription())
                .collect(Collectors.joining("\n"));
    }
}