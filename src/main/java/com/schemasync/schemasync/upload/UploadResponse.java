package com.schemasync.schemasync.upload;

import java.util.UUID;

public record UploadResponse(UUID jobId, String status) {
}