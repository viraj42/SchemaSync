package com.schemasync.schemasync.customerrecord;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRecordRepository extends JpaRepository<CustomerRecord, UUID> {
    //used to avoid same file duplicate row prevention
    Optional<CustomerRecord> findByJob_IdAndRowIndex(UUID jobId, long rowIndex);
    //used for same file but same row prevention but at uploaded at multiple time
    Optional<CustomerRecord> findByClient_IdAndEmail(UUID clientId, String email);
}