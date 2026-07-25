package com.schemasync.schemasync.validation;

import com.schemasync.schemasync.customerrecord.CustomerRecord;
import com.schemasync.schemasync.dlq.FailureReason;
import com.schemasync.schemasync.targetschema.TargetSchemaCacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RowValidationService {

    private final TargetSchemaCacheService targetSchemaCacheService;

    // Empty result = valid. Present result = the reason it failed, for DLQ routing.
    public Optional<FailureReason> validate(CustomerRecord candidate) {
        Set<String> requiredFields = targetSchemaCacheService.getRequiredFieldNames();

        for (String fieldName : requiredFields) {
            Object value = getFieldValue(candidate, fieldName);
            if (value == null || (value instanceof String s && s.isBlank())) {
                return Optional.of(FailureReason.MISSING_REQUIRED_FIELD);
            }
        }

        return Optional.empty();
    }

    private Object getFieldValue(CustomerRecord candidate, String fieldName) {
        return switch (fieldName) {
            case "fullName" -> candidate.getFullName();
            case "email" -> candidate.getEmail();
            case "phone" -> candidate.getPhone();
            case "company" -> candidate.getCompany();
            case "role" -> candidate.getRole();
            case "joinDate" -> candidate.getJoinDate();
            default -> null; // an unknown field name in target_schema_fields
            // has no corresponding CustomerRecord column —
            // this is the "adding a truly new field" boundary
            // named earlier, not a bug.
        };
    }
}