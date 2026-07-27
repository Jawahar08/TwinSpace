package com.syncnotes.controller;

import com.syncnotes.dto.AttachmentDtos.*;
import com.syncnotes.security.UserPrincipal;
import com.syncnotes.service.AttachmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @GetMapping("/note/{noteId}")
    public ResponseEntity<List<AttachmentDto>> getAttachmentsForNote(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID noteId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsForNote(userPrincipal.getId(), noteId));
    }

    @PostMapping("/init")
    public ResponseEntity<AttachmentUploadInitResponse> initUpload(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AttachmentUploadInitRequest request) {
        return ResponseEntity.ok(attachmentService.initUpload(userPrincipal.getId(), request));
    }

    @PostMapping("/upload/{id}")
    public ResponseEntity<AttachmentDto> uploadFile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(attachmentService.processUpload(userPrincipal.getId(), id, file));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<InputStreamResource> downloadFile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        InputStream inputStream = attachmentService.downloadFile(userPrincipal.getId(), id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + id + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new InputStreamResource(inputStream));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttachment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        attachmentService.deleteAttachment(userPrincipal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
