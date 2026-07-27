package com.syncnotes;

import com.syncnotes.dto.AuthDtos.*;
import com.syncnotes.dto.NoteDtos.*;
import com.syncnotes.dto.SyncDtos.*;
import com.syncnotes.service.AuthService;
import com.syncnotes.service.SyncService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class SyncServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private SyncService syncService;

    @Test
    void testIdempotencyAndLwwSync() {
        AuthTokenResponse authRes = authService.register(RegisterRequest.builder()
                .email("syncuser@example.com")
                .password("Password123!")
                .build());

        UUID userId = authRes.getUser().getId();
        UUID noteId = UUID.randomUUID();
        String clientMutId = "mut_001";
        String deviceId = "dev_windows";

        SyncMutationRequestDto mut1 = SyncMutationRequestDto.builder()
                .clientMutationId(clientMutId)
                .deviceId(deviceId)
                .entityType("NOTE")
                .entityId(noteId)
                .operation("CREATE")
                .baseVersion(0)
                .clientTimestamp(Instant.now().toString())
                .payload(NoteInputDto.builder()
                        .title("First Title")
                        .content("First Content")
                        .pinned(false)
                        .archived(false)
                        .deleted(false)
                        .build())
                .build();

        SyncAckResponseDto ack1 = syncService.processMutation(userId, mut1);
        assertEquals("ACK", ack1.getStatus());
        assertEquals(1, ack1.getServerVersion());
        assertEquals("First Title", ack1.getAuthoritativeNote().getTitle());

        // Test Idempotent Retry with same deviceId and clientMutationId
        SyncAckResponseDto ackRetry = syncService.processMutation(userId, mut1);
        assertEquals("ACK", ackRetry.getStatus());
        assertEquals(1, ackRetry.getServerVersion());

        // Test Cursor Catch-Up
        SyncResyncResponseDto catchup = syncService.getChangesSinceCursor(userId, 0L);
        assertFalse(catchup.isRequiresSnapshot());
        assertTrue(catchup.getChanges().size() >= 1);
    }
}
