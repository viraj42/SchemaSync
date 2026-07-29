package com.schemasync.schemasync.upload;

import com.schemasync.schemasync.security.AuthenticatedClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<UploadResponse> upload(@RequestParam("file") MultipartFile file,
            org.springframework.security.core.Authentication authentication) {

        AuthenticatedClient principal = (AuthenticatedClient) authentication.getPrincipal();
        UploadResponse response = uploadService.processUpload(principal.clientId(), file);
        return ResponseEntity.status(202).body(response);
    }
}