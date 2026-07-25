package com.schemasync.schemasync.customerrecord;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/jobs/{jobId}/records")
@RequiredArgsConstructor
public class CustomerRecordController {

    private final CustomerRecordRepository customerRecordRepository;

    @GetMapping
    public Page<CustomerRecordResponse> listRecords(@PathVariable UUID jobId, Pageable pageable) {
        return customerRecordRepository.findByJob_Id(jobId, pageable)
                .map(CustomerRecordResponse::from);
    }
}