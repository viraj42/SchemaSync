package com.schemasync.schemasync.dlq;

import java.time.LocalDateTime;
import java.util.UUID;

public record DlqRecordResponse(
        UUID id, long rowIndex, String rawPayload, String failureReason,
        int retryCount, String status, LocalDateTime createdAt, LocalDateTime resolvedAt
) {
    public static DlqRecordResponse from(DlqRecord r) {
        return new DlqRecordResponse(
                r.getId(), r.getRowIndex(), r.getRawPayload(), r.getFailureReason().name(),
                r.getRetryCount(), r.getStatus().name(), r.getCreatedAt(), r.getResolvedAt());
    }
}