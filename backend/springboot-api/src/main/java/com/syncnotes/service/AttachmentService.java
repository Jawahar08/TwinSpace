package com.syncnotes.service;

import com.syncnotes.dto.AttachmentDtos.*;
import com.syncnotes.entity.AttachmentEntity;
import com.syncnotes.entity.NoteEntity;
import com.syncnotes.exception.SyncNotesException;
import com.syncnotes.repository.AttachmentRepository;
import com.syncnotes.repository.NoteRepository;
import com.syncnotes.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {

    private static final long MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
    private static final Set<String> ALLOWED_MIME_TYPES = new HashSet<>(Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "application/pdf", "application/zip", "application/x-zip-compressed",
            "text/plain", "text/markdown", "application/json",
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "audio/mpeg", "audio/wav", "audio/aac", "video/mp4", "video/webm"
    ));

    private final AttachmentRepository attachmentRepository;
    private final NoteRepository noteRepository;
    private final StorageService storageService;

    public List<AttachmentDto> getAttachmentsForNote(UUID userId, UUID noteId) {
        return attachmentRepository.findByUserIdAndNoteIdAndDeletedFalse(userId, noteId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public AttachmentUploadInitResponse initUpload(UUID userId, AttachmentUploadInitRequest request) {
        validateFileMetadata(request.getOriginalName(), request.getMimeType(), request.getByteSize());

        // Ownership verification of note
        NoteEntity note = noteRepository.findByUserIdAndId(userId, request.getNoteId())
                .orElseThrow(() -> new SyncNotesException("NOTE_NOT_FOUND", "Associated note not found", HttpStatus.NOT_FOUND));

        UUID attachmentId = UUID.randomUUID();
        String storageKey = userId + "/" + note.getId() + "/" + attachmentId + "_" + sanitizeFilename(request.getOriginalName());

        AttachmentEntity attachment = AttachmentEntity.builder()
                .id(attachmentId)
                .noteId(note.getId())
                .userId(userId)
                .originalName(request.getOriginalName())
                .mimeType(request.getMimeType())
                .byteSize(request.getByteSize())
                .storageKey(storageKey)
                .uploadStatus("PENDING")
                .deleted(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        attachment = attachmentRepository.save(attachment);

        String uploadUrl = "/api/attachments/upload/" + attachment.getId();

        return AttachmentUploadInitResponse.builder()
                .attachment(mapToDto(attachment))
                .uploadUrl(uploadUrl)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }

    @Transactional
    public AttachmentDto processUpload(UUID userId, UUID attachmentId, MultipartFile file) {
        AttachmentEntity attachment = attachmentRepository.findByUserIdAndId(userId, attachmentId)
                .orElseThrow(() -> new SyncNotesException("ATTACHMENT_NOT_FOUND", "Attachment not found", HttpStatus.NOT_FOUND));

        validateFileMetadata(file.getOriginalFilename(), file.getContentType(), file.getSize());

        try (InputStream is = file.getInputStream()) {
            storageService.storeFile(attachment.getStorageKey(), is, file.getContentType(), file.getSize());
            attachment.setUploadStatus("COMPLETED");
            attachment.setByteSize(file.getSize());
            attachment = attachmentRepository.save(attachment);
            return mapToDto(attachment);
        } catch (Exception e) {
            attachment.setUploadStatus("FAILED");
            attachmentRepository.save(attachment);
            log.error("Failed processing file upload for attachment {}", attachmentId, e);
            throw new SyncNotesException("UPLOAD_FAILED", "Failed to process uploaded file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public InputStream downloadFile(UUID userId, UUID attachmentId) {
        AttachmentEntity attachment = attachmentRepository.findByUserIdAndId(userId, attachmentId)
                .orElseThrow(() -> new SyncNotesException("ATTACHMENT_NOT_FOUND", "Attachment not found", HttpStatus.NOT_FOUND));

        if (attachment.isDeleted()) {
            throw new SyncNotesException("ATTACHMENT_DELETED", "Attachment has been deleted", HttpStatus.GONE);
        }

        return storageService.getFile(attachment.getStorageKey());
    }

    @Transactional
    public void deleteAttachment(UUID userId, UUID attachmentId) {
        AttachmentEntity attachment = attachmentRepository.findByUserIdAndId(userId, attachmentId)
                .orElseThrow(() -> new SyncNotesException("ATTACHMENT_NOT_FOUND", "Attachment not found", HttpStatus.NOT_FOUND));

        attachment.setDeleted(true);
        attachmentRepository.save(attachment);
        storageService.deleteFile(attachment.getStorageKey());
    }

    private void validateFileMetadata(String filename, String mimeType, long byteSize) {
        if (byteSize <= 0 || byteSize > MAX_FILE_SIZE_BYTES) {
            throw new SyncNotesException("INVALID_FILE_SIZE", "File size must be between 1 byte and 50MB", HttpStatus.BAD_REQUEST);
        }
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            throw new SyncNotesException("UNSUPPORTED_FILE_TYPE", "File MIME type '" + mimeType + "' is not supported", HttpStatus.BAD_REQUEST);
        }
    }

    private String sanitizeFilename(String name) {
        if (name == null) return "file";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public AttachmentDto mapToDto(AttachmentEntity entity) {
        return AttachmentDto.builder()
                .id(entity.getId())
                .noteId(entity.getNoteId())
                .userId(entity.getUserId())
                .originalName(entity.getOriginalName())
                .mimeType(entity.getMimeType())
                .byteSize(entity.getByteSize())
                .storageKey(entity.getStorageKey())
                .previewMetadata(entity.getPreviewMetadata())
                .uploadStatus(entity.getUploadStatus())
                .deleted(entity.isDeleted())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .downloadUrl("/api/attachments/download/" + entity.getId())
                .build();
    }
}
