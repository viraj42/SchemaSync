package com.schemasync.schemasync.kafka;

import com.schemasync.schemasync.dlq.FailureReason;

import java.util.Map;
import java.util.UUID;

public record DlqMessage(
        UUID jobId,
        long rowIndex,
        Map<String, String> rawPayload,
        FailureReason failureReason
) {
}