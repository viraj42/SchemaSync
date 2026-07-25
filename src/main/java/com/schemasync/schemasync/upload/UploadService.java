package com.schemasync.schemasync.upload;

import com.schemasync.schemasync.client.Client;
import com.schemasync.schemasync.client.ClientRepository;
import com.schemasync.schemasync.dlq.FailureReason;
import com.schemasync.schemasync.ingestionjob.IngestionJob;
import com.schemasync.schemasync.ingestionjob.IngestionJobRepository;
import com.schemasync.schemasync.ingestionjob.StatusType;
import com.schemasync.schemasync.kafka.DlqMessage;
import com.schemasync.schemasync.kafka.DlqProducerService;
import com.schemasync.schemasync.kafka.KafkaProducerService;
import com.schemasync.schemasync.kafka.RawRowMessage;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
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
    private final KafkaProducerService kafkaProducerService;
    private final DlqProducerService dlqProducerService;

    public UploadResponse processUpload(UUID clientId, MultipartFile file) {
        //a. Validate the client
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown clientId: " + clientId));
        //b.Create new job
        IngestionJob job = new IngestionJob();
        job.setClient(client);//set client
        job.setFileName(file.getOriginalFilename());
        job.setStatus(StatusType.PROCESSING);
        job = ingestionJobRepository.save(job);

        //c.Measure total rows to be processed in job
        long rowCount = parseAndRoute(job.getId(), file);

        job.setTotalRecords(rowCount);
        ingestionJobRepository.save(job);//save job

        return new UploadResponse(job.getId(), job.getStatus().name());
    }

    private long parseAndRoute(UUID jobId, MultipartFile file) {
        long rowIndex = 0;

        try (var reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .setAllowMissingColumnNames(true)
                     .build()
                     .parse(reader)) {

            int expectedColumnCount = parser.getHeaderMap().size();
            for (CSVRecord csvRecord : parser) {
                //if columns get mismatched then f/w to dlq
                //ellse publish to kakfa topic
                if (csvRecord.size() != expectedColumnCount) {
                    Map<String, String> rawRow = new LinkedHashMap<>();
                    for (int i = 0; i < csvRecord.size(); i++) {
                        rawRow.put("column_" + i, csvRecord.get(i));
                    }
                    dlqProducerService.publishToDlq(
                            new DlqMessage(jobId, rowIndex, rawRow, FailureReason.PARSE_ERROR));
                } else {
                    Map<String, String> row = new LinkedHashMap<>(csvRecord.toMap());
                    kafkaProducerService.publishRawRow(new RawRowMessage(jobId, rowIndex, row));
                }
                rowIndex++;
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded file", e);
        }
        return rowIndex;
    }
}