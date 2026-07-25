package com.schemasync.schemasync.dlq;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DlqRecordRepository extends JpaRepository<DlqRecord, UUID> {

    Page<DlqRecord> findByJob_Id(UUID jobId, Pageable pageable);

    Optional<DlqRecord> findByJob_IdAndRowIndex(UUID jobId, long rowIndex);

    List<DlqRecord> findByJob_IdAndRowIndexInAndStatus(UUID jobId, List<Long> rowIndexes, DlqStatus status);
}