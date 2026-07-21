package com.schemasync.schemasync.targetschema;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class TargetSchemaFieldSeeder implements CommandLineRunner {

    private final TargetSchemaFieldRepository repository;

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            return; // already seeded
        }

        List<TargetSchemaField> seedFields = List.of(
                field("fullName", FieldType.STRING, true, "Customer's full name"),
                field("email", FieldType.STRING, true, "Customer's primary contact email"),
                field("phone", FieldType.STRING, false, "Customer's phone number"),
                field("company", FieldType.STRING, false, "Customer's company name"),
                field("role", FieldType.STRING, false, "Customer's job role/title"),
                field("joinDate", FieldType.DATE, false, "Date the customer joined")
        );

        repository.saveAll(seedFields);
    }

    private TargetSchemaField field(String name, FieldType type, boolean required, String description) {
        TargetSchemaField f = new TargetSchemaField();
        f.setFieldName(name);
        f.setFieldType(type);
        f.setRequired(required);
        f.setDescription(description);
        return f;
    }
}