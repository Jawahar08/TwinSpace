package com.syncnotes.service;

import com.syncnotes.dto.NoteDtos.*;
import com.syncnotes.entity.NoteEntity;
import com.syncnotes.entity.SyncRevisionEntity;
import com.syncnotes.exception.SyncNotesException;
import com.syncnotes.repository.NoteRepository;
import com.syncnotes.repository.SyncRevisionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoteService {

    private final NoteRepository noteRepository;
    private final SyncRevisionRepository syncRevisionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public List<NoteDto> getAllActiveNotes(UUID userId) {
        return noteRepository.findByUserIdAndArchivedFalseAndDeletedFalseOrderByPinnedDescUpdatedAtDesc(userId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<NoteDto> getArchivedNotes(UUID userId) {
        return noteRepository.findByUserIdAndArchivedTrueAndDeletedFalseOrderByUpdatedAtDesc(userId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<NoteDto> getTrashNotes(UUID userId) {
        return noteRepository.findByUserIdAndDeletedTrueOrderByUpdatedAtDesc(userId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public NoteDto getNoteById(UUID userId, UUID id) {
        NoteEntity note = noteRepository.findByUserIdAndId(userId, id)
                .orElseThrow(() -> new SyncNotesException("NOTE_NOT_FOUND", "Note not found", HttpStatus.NOT_FOUND));
        return mapToDto(note);
    }

    public List<NoteDto> searchNotes(UUID userId, String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllActiveNotes(userId);
        }
        return noteRepository.searchNotes(userId, query.trim())
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public NoteDto createOrUpdateNote(UUID userId, NoteInputDto input) {
        UUID id = input.getId() != null ? input.getId() : UUID.randomUUID();
        Optional<NoteEntity> existingOpt = noteRepository.findByUserIdAndId(userId, id);

        NoteEntity note;
        String operation;
        long newVersion = 1;

        if (existingOpt.isPresent()) {
            note = existingOpt.get();
            operation = "UPDATE";
            newVersion = note.getVersion() + 1;
            if (input.getTitle() != null) note.setTitle(input.getTitle());
            if (input.getContent() != null) note.setContent(input.getContent());
            if (input.getPinned() != null) note.setPinned(input.getPinned());
            if (input.getArchived() != null) note.setArchived(input.getArchived());
            if (input.getDeleted() != null) note.setDeleted(input.getDeleted());
            note.setVersion(newVersion);
            note.setDeviceId(input.getDeviceId());
            note.setClientMutationId(input.getClientMutationId());
        } else {
            operation = "CREATE";
            note = NoteEntity.builder()
                    .id(id)
                    .userId(userId)
                    .title(input.getTitle() != null ? input.getTitle() : "")
                    .content(input.getContent() != null ? input.getContent() : "")
                    .pinned(Boolean.TRUE.equals(input.getPinned()))
                    .archived(Boolean.TRUE.equals(input.getArchived()))
                    .deleted(Boolean.TRUE.equals(input.getDeleted()))
                    .version(1)
                    .deviceId(input.getDeviceId())
                    .clientMutationId(input.getClientMutationId())
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
        }

        note = noteRepository.saveAndFlush(note);
        NoteDto dto = mapToDto(note);

        recordRevisionAndBroadcast(userId, "NOTE", note.getId(), operation, note.getVersion(), dto, input.getDeviceId(), input.getClientMutationId());

        return dto;
    }

    @Transactional
    public NoteDto togglePinNote(UUID userId, UUID id) {
        NoteEntity note = noteRepository.findByUserIdAndId(userId, id)
                .orElseThrow(() -> new SyncNotesException("NOTE_NOT_FOUND", "Note not found", HttpStatus.NOT_FOUND));

        note.setPinned(!note.isPinned());
        note.setVersion(note.getVersion() + 1);
        note = noteRepository.saveAndFlush(note);

        NoteDto dto = mapToDto(note);
        recordRevisionAndBroadcast(userId, "NOTE", note.getId(), "UPDATE", note.getVersion(), dto, note.getDeviceId(), note.getClientMutationId());
        return dto;
    }

    @Transactional
    public NoteDto toggleArchiveNote(UUID userId, UUID id) {
        NoteEntity note = noteRepository.findByUserIdAndId(userId, id)
                .orElseThrow(() -> new SyncNotesException("NOTE_NOT_FOUND", "Note not found", HttpStatus.NOT_FOUND));

        note.setArchived(!note.isArchived());
        note.setVersion(note.getVersion() + 1);
        note = noteRepository.saveAndFlush(note);

        NoteDto dto = mapToDto(note);
        recordRevisionAndBroadcast(userId, "NOTE", note.getId(), "UPDATE", note.getVersion(), dto, note.getDeviceId(), note.getClientMutationId());
        return dto;
    }

    @Transactional
    public NoteDto softDeleteNote(UUID userId, UUID id) {
        NoteEntity note = noteRepository.findByUserIdAndId(userId, id)
                .orElseThrow(() -> new SyncNotesException("NOTE_NOT_FOUND", "Note not found", HttpStatus.NOT_FOUND));

        note.setDeleted(true);
        note.setVersion(note.getVersion() + 1);
        note = noteRepository.saveAndFlush(note);

        NoteDto dto = mapToDto(note);
        recordRevisionAndBroadcast(userId, "NOTE", note.getId(), "DELETE", note.getVersion(), dto, note.getDeviceId(), note.getClientMutationId());
        return dto;
    }

    @Transactional
    public NoteDto restoreNote(UUID userId, UUID id) {
        NoteEntity note = noteRepository.findByUserIdAndId(userId, id)
                .orElseThrow(() -> new SyncNotesException("NOTE_NOT_FOUND", "Note not found", HttpStatus.NOT_FOUND));

        note.setDeleted(false);
        note.setVersion(note.getVersion() + 1);
        note = noteRepository.saveAndFlush(note);

        NoteDto dto = mapToDto(note);
        recordRevisionAndBroadcast(userId, "NOTE", note.getId(), "UPDATE", note.getVersion(), dto, note.getDeviceId(), note.getClientMutationId());
        return dto;
    }

    public void recordRevisionAndBroadcast(UUID userId, String entityType, UUID entityId, String operation, long version, Object payload, String deviceId, String clientMutationId) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            SyncRevisionEntity rev = SyncRevisionEntity.builder()
                    .userId(userId)
                    .entityType(entityType)
                    .entityId(entityId)
                    .operation(operation)
                    .version(version)
                    .payload(jsonPayload)
                    .deviceId(deviceId != null ? deviceId : "server")
                    .clientMutationId(clientMutationId != null ? clientMutationId : "srv_" + UUID.randomUUID())
                    .createdAt(Instant.now())
                    .build();
            rev = syncRevisionRepository.saveAndFlush(rev);

            Map<String, Object> event = new HashMap<>();
            event.put("revisionId", rev.getId());
            event.put("entityType", entityType);
            event.put("entityId", entityId);
            event.put("operation", operation);
            event.put("version", version);
            event.put("payload", payload);
            event.put("timestamp", rev.getCreatedAt());
            event.put("originDeviceId", deviceId != null ? deviceId : "server");

            messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/sync.events", event);
        } catch (Exception e) {
            log.error("Failed to record revision or broadcast STOMP event", e);
        }
    }

    public NoteDto mapToDto(NoteEntity entity) {
        return NoteDto.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .pinned(entity.isPinned())
                .archived(entity.isArchived())
                .deleted(entity.isDeleted())
                .version(entity.getVersion())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .deviceId(entity.getDeviceId())
                .clientMutationId(entity.getClientMutationId())
                .build();
    }
}
