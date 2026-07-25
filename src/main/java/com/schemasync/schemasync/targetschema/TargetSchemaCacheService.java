package com.schemasync.schemasync.targetschema;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TargetSchemaCacheService {

    private final TargetSchemaFieldRepository repository;
    private volatile String cachedSchemaDescription;
    private volatile Set<String> cachedRequiredFieldNames;

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

    public Set<String> getRequiredFieldNames() {
        Set<String> local = cachedRequiredFieldNames;
        if (local == null) {
            synchronized (this) {
                local = cachedRequiredFieldNames;
                if (local == null) {
                    local = repository.findAll().stream()
                            .filter(TargetSchemaField::isRequired)
                            .map(TargetSchemaField::getFieldName)
                            .collect(Collectors.toSet());
                    cachedRequiredFieldNames = local;
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