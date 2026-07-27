package com.syncnotes.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

public class NoteDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NoteDto {
        private UUID id;
        private UUID userId;
        private String title;
        private String content;
        private boolean pinned;
        private boolean archived;
        private boolean deleted;
        private long version;
        private Instant createdAt;
        private Instant updatedAt;
        private String deviceId;
        private String clientMutationId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NoteInputDto {
        private UUID id;
        private String title;
        private String content;
        private Boolean pinned;
        private Boolean archived;
        private Boolean deleted;
        private String deviceId;
        private String clientMutationId;
    }
}
