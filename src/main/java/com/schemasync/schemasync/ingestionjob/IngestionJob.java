package com.schemasync.schemasync.ingestionjob;

import com.schemasync.schemasync.client.Client;
import com.schemasync.schemasync.common.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "ingestion_jobs")
public class IngestionJob extends BaseAuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusType status;

    @Column(nullable = false)
    private Long totalRecords = 0L;
    @Column(nullable = false)
    private Long processedRecords = 0L;

    @Column(nullable = false)
    private Long failedRecords = 0L;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;
}