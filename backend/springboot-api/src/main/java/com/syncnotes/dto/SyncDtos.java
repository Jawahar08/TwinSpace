package com.syncnotes.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SyncDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SyncMutationRequestDto {
        private String clientMutationId;
        private String deviceId;
        private String entityType; // NOTE, ATTACHMENT
        private UUID entityId;
        private String operation; // CREATE, UPDATE, DELETE
        private long baseVersion;
        private NoteDtos.NoteInputDto payload;
        private String clientTimestamp; // ISO-8601 string
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SyncAckResponseDto {
        private String clientMutationId;
        private UUID entityId;
        private long serverVersion;
        private String status; // ACK, REJECTED, CONFLICT_LWW_LOST
        private NoteDtos.NoteDto authoritativeNote;
        private String message;
        private Instant timestamp;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SyncChangeEventDto {
        private Long revisionId;
        private String entityType;
        private UUID entityId;
        private String operation;
        private long version;
        private Object payload;
        private Instant timestamp;
        private String originDeviceId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SyncCursorRequestDto {
        private Long lastAcknowledgedRevision;
        private Integer limit;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SnapshotDto {
        private List<NoteDtos.NoteDto> notes;
        private List<AttachmentDtos.AttachmentDto> attachments;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SyncResyncResponseDto {
        private boolean requiresSnapshot;
        private Long latestRevision;
        private List<SyncChangeEventDto> changes;
        private SnapshotDto snapshot;
    }
}
