package com.schemasync.schemasync.mapping;

public record MappedRowResult(
        String fullName,
        String email,
        String phone,
        String company,
        String role,
        String joinDate
) {
}