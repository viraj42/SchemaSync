package com.schemasync.schemasync.dlq;

public record ManualCorrectionRequest(
        String fullName, String email, String phone,
        String company, String role, String joinDate
) {
}