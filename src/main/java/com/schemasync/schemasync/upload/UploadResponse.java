package com.schemasync.schemasync.upload;

import java.util.UUID;
//returned after file uploading
public record UploadResponse(UUID jobId, String status) {
}