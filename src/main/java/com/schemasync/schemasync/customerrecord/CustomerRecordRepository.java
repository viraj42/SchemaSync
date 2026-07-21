package com.schemasync.schemasync.customerrecord;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CustomerRecordRepository extends JpaRepository<CustomerRecord, UUID> {

}
