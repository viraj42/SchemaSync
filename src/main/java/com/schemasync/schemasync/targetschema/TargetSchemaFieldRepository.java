package com.schemasync.schemasync.targetschema;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TargetSchemaFieldRepository extends JpaRepository<TargetSchemaField, UUID> {
}
