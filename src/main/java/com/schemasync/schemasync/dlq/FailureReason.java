package com.schemasync.schemasync.dlq;

public enum FailureReason {
    PARSE_ERROR,
    MISSING_REQUIRED_FIELD,
    SCHEMA_MISMATCH,
    TYPE_INVALID,
    LLM_RATE_LIMITED,
    TRANSIENT_ERROR
}