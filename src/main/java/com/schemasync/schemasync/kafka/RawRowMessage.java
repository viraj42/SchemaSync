package com.schemasync.schemasync.kafka;

import java.util.Map;
import java.util.UUID;
//Represent actual row present in kafka partition
public record RawRowMessage(UUID jobId, long rowIndex, Map<String, String> rowData) {
}