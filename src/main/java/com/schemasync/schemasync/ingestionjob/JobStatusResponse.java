package com.schemasync.schemasync.ingestionjob;

import java.time.LocalDateTime;
import java.util.UUID;

public record JobStatusResponse(
        UUID jobId,
        String fileName,
        String status,
        long totalRecords,
        long processedRecords,
        long failedRecords,
        LocalDateTime createdAt
) {
    public static JobStatusResponse from(IngestionJob job) {
        return new JobStatusResponse(
                job.getId(), job.getFileName(), job.getStatus().name(),
                job.getTotalRecords(), job.getProcessedRecords(), job.getFailedRecords(),
                job.getCreatedAt());
    }
}