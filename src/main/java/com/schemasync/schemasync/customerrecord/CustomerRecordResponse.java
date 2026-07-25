package com.schemasync.schemasync.customerrecord;

import java.time.LocalDate;
import java.util.UUID;

public record CustomerRecordResponse(UUID id, String fullName, String email, String phone, String company, String role, LocalDate joinDate, long rowIndex) {
    public static CustomerRecordResponse from(CustomerRecord r) {
        return new CustomerRecordResponse(
                r.getId(), r.getFullName(), r.getEmail(), r.getPhone(),
                r.getCompany(), r.getRole(), r.getJoinDate(), r.getRowIndex());
    }
}