package com.schemasync.schemasync.customerrecord;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRecordRepository extends JpaRepository<CustomerRecord, UUID> {

    //Avoid duplication of mail for a client
    Optional<CustomerRecord> findByClient_IdAndEmail(UUID clientId, String email);

    List<CustomerRecord> findByJob_IdAndRowIndexIn(UUID jobId, List<Long> rowIndexes);

    //For listing all Records of a job
    Page<CustomerRecord> findByJob_Id(UUID jobId, Pageable pageable);
}