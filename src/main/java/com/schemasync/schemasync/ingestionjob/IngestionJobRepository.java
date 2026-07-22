package com.schemasync.schemasync.ingestionjob;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface IngestionJobRepository extends JpaRepository<IngestionJob, UUID> {
}