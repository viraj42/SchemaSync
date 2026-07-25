package com.schemasync.schemasync.dlq;

import com.schemasync.schemasync.common.BaseAuditableEntity;
import com.schemasync.schemasync.ingestionjob.IngestionJob;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "dlq_records")
public class DlqRecord extends BaseAuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private IngestionJob job;

    @Column(name = "row_index", nullable = false)
    private long rowIndex;

    @Column(name = "raw_payload", columnDefinition = "TEXT")
    private String rawPayload;

    @Enumerated(EnumType.STRING)
    @Column(name = "failure_reason", nullable = false)
    private FailureReason failureReason;

    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DlqStatus status;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}