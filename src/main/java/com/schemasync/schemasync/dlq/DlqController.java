package com.schemasync.schemasync.dlq;

import com.schemasync.schemasync.customerrecord.CustomerRecordResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/jobs/{jobId}")
@RequiredArgsConstructor
public class DlqController {

    private final DlqRecoveryService dlqRecoveryService;

    @GetMapping("/failures")
    public Page<DlqRecordResponse> listFailures(@PathVariable UUID jobId, Pageable pageable) {
        return dlqRecoveryService.listFailures(jobId, pageable);
    }

    @PostMapping("/retry/{recordId}")
    public ResponseEntity<Void> retry(@PathVariable UUID jobId, @PathVariable UUID recordId) {
        dlqRecoveryService.retry(jobId, recordId);
        return ResponseEntity.accepted().build();
    }

    @PatchMapping("/failures/{recordId}")
    public CustomerRecordResponse applyCorrection(
            @PathVariable UUID jobId, @PathVariable UUID recordId,
            @RequestBody ManualCorrectionRequest request) {
        return dlqRecoveryService.applyManualCorrection(jobId, recordId, request);
    }
}