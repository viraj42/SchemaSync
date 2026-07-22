package com.schemasync.schemasync.upload;

import com.schemasync.schemasync.customerrecord.CustomerRecord;

import java.time.LocalDate;
import java.util.Map;

public class CustomerRecordColumnMapper {

    public CustomerRecord map(Map<String, String> row) {
        CustomerRecord record = new CustomerRecord();
        record.setFullName(findValue(row, "fullname", "full_name", "name"));
        record.setEmail(findValue(row, "email", "e-mail"));
        record.setPhone(findValue(row, "phone", "phone_number", "mobile"));
        record.setCompany(findValue(row, "company", "company_name"));
        record.setRole(findValue(row, "role", "job_title", "title"));

        String joinDateRaw = findValue(row, "joindate", "join_date", "joined_on");
        if (joinDateRaw != null && !joinDateRaw.isBlank()) {
            record.setJoinDate(LocalDate.parse(joinDateRaw));
        }

        return record;
    }

    private String findValue(Map<String, String> row, String... possibleKeys) {
        for (String key : possibleKeys) {
            for (Map.Entry<String, String> entry : row.entrySet()) {
                if (entry.getKey() != null && entry.getKey().trim().equalsIgnoreCase(key)) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }
}