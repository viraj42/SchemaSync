package com.schemasync.schemasync.upload;

import com.schemasync.schemasync.client.Client;
import com.schemasync.schemasync.client.ClientRepository;
import com.schemasync.schemasync.customerrecord.CustomerRecord;
import com.schemasync.schemasync.customerrecord.CustomerRecordRepository;
import com.schemasync.schemasync.ingestionjob.IngestionJob;
import com.schemasync.schemasync.ingestionjob.IngestionJobRepository;
import com.schemasync.schemasync.ingestionjob.StatusType;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UploadService {

    private final ClientRepository clientRepository;
    private final IngestionJobRepository ingestionJobRepository;
    private final CustomerRecordRepository customerRecordRepository;
    private final CustomerRecordColumnMapper columnMapper = new CustomerRecordColumnMapper();

    @Transactional
    public UploadResponse processUpload(UUID clientId, MultipartFile file) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown clientId: " + clientId));

        IngestionJob job = new IngestionJob();
        job.setClient(client);
        job.setFileName(file.getOriginalFilename());
        job.setStatus(StatusType.PROCESSING);
        job = ingestionJobRepository.save(job);

        long processed = 0;
        long failed = 0;

        try (var reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {

            for (CSVRecord csvRecord : parser) {
                Map<String, String> row = new LinkedHashMap<>(csvRecord.toMap());
                try {
                    CustomerRecord record = columnMapper.map(row);
                    record.setJob(job);
                    customerRecordRepository.save(record);
                    processed++;
                } catch (Exception rowFailure) {
                    // Phase 1 has no DLQ yet — a bad row is just counted as failed.
                    // Phase 5 replaces this catch block with real failure-taxonomy routing.
                    failed++;
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded file", e);
        }

        job.setTotalRecords(processed + failed);
        job.setProcessedRecords(processed);
        job.setFailedRecords(failed);
        job.setStatus(failed == 0 ? StatusType.COMPLETED : StatusType.PARTIAL_FAILURE);
        ingestionJobRepository.save(job);

        return new UploadResponse(job.getId(), job.getStatus().name());
    }
}