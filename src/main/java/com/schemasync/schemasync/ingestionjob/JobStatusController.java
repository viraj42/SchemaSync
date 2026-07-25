package com.schemasync.schemasync.ingestionjob;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobStatusController {

    private final IngestionJobRepository ingestionJobRepository;

    @GetMapping("/{jobId}")
    public JobStatusResponse getStatus(@PathVariable UUID jobId) {
        IngestionJob job = ingestionJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown jobId: " + jobId));
        return JobStatusResponse.from(job);
    }
}