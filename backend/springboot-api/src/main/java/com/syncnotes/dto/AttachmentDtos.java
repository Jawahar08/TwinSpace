package com.syncnotes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

public class AttachmentDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttachmentDto {
        private UUID id;
        private UUID noteId;
        private UUID userId;
        private String originalName;
        private String mimeType;
        private long byteSize;
        private String storageKey;
        private String previewMetadata;
        private String uploadStatus;
        private boolean deleted;
        private Instant createdAt;
        private Instant updatedAt;
        private String downloadUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttachmentUploadInitRequest {
        @NotNull(message = "Note ID is required")
        private UUID noteId;

        @NotBlank(message = "Original name is required")
        private String originalName;

        @NotBlank(message = "MIME type is required")
        private String mimeType;

        @Positive(message = "File size must be positive")
        private long byteSize;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttachmentUploadInitResponse {
        private AttachmentDto attachment;
        private String uploadUrl;
        private Instant expiresAt;
    }
}
