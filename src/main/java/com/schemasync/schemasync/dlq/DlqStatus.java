package com.schemasync.schemasync.dlq;

public enum DlqStatus {
    PENDING_RETRY,
    FAILED_FINAL,
    RESOLVED
}