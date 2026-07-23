package com.schemasync.schemasync.mapping;

public class LlmRateLimitedException extends RuntimeException {
    public LlmRateLimitedException(String message, Throwable cause) {
        super(message, cause);
    }
}