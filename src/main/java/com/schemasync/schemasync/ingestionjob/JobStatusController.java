package com.schemasync.schemasync.ingestionjob;

import com.schemasync.schemasync.security.AuthenticatedClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobStatusController {

    private final IngestionJobRepository ingestionJobRepository;

    // JobStatusController
    @GetMapping("/{jobId}")
    public JobStatusResponse getStatus(
            @PathVariable UUID jobId,
            org.springframework.security.core.Authentication authentication) {

        AuthenticatedClient principal = (AuthenticatedClient) authentication.getPrincipal();
        IngestionJob job = ingestionJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown jobId: " + jobId));

        if (!job.getClient().getId().equals(principal.clientId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Job does not belong to the authenticated client");
        }

        return JobStatusResponse.from(job);
    }
}