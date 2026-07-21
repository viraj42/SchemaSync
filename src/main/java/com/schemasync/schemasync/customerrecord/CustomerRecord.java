package com.schemasync.schemasync.customerrecord;

import com.schemasync.schemasync.common.BaseAuditableEntity;
import com.schemasync.schemasync.ingestionjob.IngestionJob;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "customer_records")
public class CustomerRecord extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private IngestionJob job;

    private String fullName;

    private String email;

    private String phone;

    private String company;

    private String role;

    private LocalDate joinDate;
}