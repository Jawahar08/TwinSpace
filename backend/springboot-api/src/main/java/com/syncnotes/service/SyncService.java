package com.syncnotes.service;

import com.syncnotes.dto.AttachmentDtos;
import com.syncnotes.dto.NoteDtos.*;
import com.syncnotes.dto.SyncDtos.*;
import com.syncnotes.entity.NoteEntity;
import com.syncnotes.entity.SyncRevisionEntity;
import com.syncnotes.repository.AttachmentRepository;
import com.syncnotes.repository.NoteRepository;
import com.syncnotes.repository.SyncRevisionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {

    private final NoteRepository noteRepository;
    private final AttachmentRepository attachmentRepository;
    private final SyncRevisionRepository syncRevisionRepository;
    private final NoteService noteService;
    private final AttachmentService attachmentService;
    private final ObjectMapper objectMapper;

    @Transactional
    public SyncAckResponseDto processMutation(UUID userId, SyncMutationRequestDto req) {
        log.info("Processing sync mutation: user={}, mutationId={}, device={}, entity={}",
                userId, req.getClientMutationId(), req.getDeviceId(), req.getEntityId());

        Optional<NoteEntity> existingMut = noteRepository.findByUserIdAndDeviceIdAndClientMutationId(
                userId, req.getDeviceId(), req.getClientMutationId());

        if (existingMut.isPresent()) {
            NoteEntity existing = existingMut.get();
            log.info("Idempotent retry detected for mutationId={}", req.getClientMutationId());
            return SyncAckResponseDto.builder()
                    .clientMutationId(req.getClientMutationId())
                    .entityId(existing.getId())
                    .serverVersion(existing.getVersion())
                    .status("ACK")
                    .authoritativeNote(noteService.mapToDto(existing))
                    .timestamp(Instant.now())
                    .build();
        }

        if (!"NOTE".equalsIgnoreCase(req.getEntityType())) {
            return SyncAckResponseDto.builder()
                    .clientMutationId(req.getClientMutationId())
                    .entityId(req.getEntityId())
                    .status("REJECTED")
                    .message("Unsupported entity type: " + req.getEntityType())
                    .timestamp(Instant.now())
                    .build();
        }

        UUID noteId = req.getEntityId();
        NoteInputDto payload = req.getPayload();
        Optional<NoteEntity> existingNoteOpt = noteRepository.findByUserIdAndId(userId, noteId);

        Instant clientTime;
        try {
            clientTime = req.getClientTimestamp() != null ? Instant.parse(req.getClientTimestamp()) : Instant.now();
        } catch (Exception e) {
            clientTime = Instant.now();
        }

        if (existingNoteOpt.isPresent()) {
            NoteEntity serverNote = existingNoteOpt.get();

            boolean clientWins = false;
            if (clientTime.isAfter(serverNote.getUpdatedAt())) {
                clientWins = true;
            } else if (clientTime.equals(serverNote.getUpdatedAt())) {
                clientWins = req.getClientMutationId().compareTo(
                        serverNote.getClientMutationId() != null ? serverNote.getClientMutationId() : ""
                ) >= 0;
            }

            if (!clientWins && !"DELETE".equalsIgnoreCase(req.getOperation())) {
                log.info("LWW lost for mutationId={}. Server updated at {} is newer than client {}",
                        req.getClientMutationId(), serverNote.getUpdatedAt(), clientTime);
                return SyncAckResponseDto.builder()
                        .clientMutationId(req.getClientMutationId())
                        .entityId(serverNote.getId())
                        .serverVersion(serverNote.getVersion())
                        .status("CONFLICT_LWW_LOST")
                        .authoritativeNote(noteService.mapToDto(serverNote))
                        .message("Server contains a newer revision")
                        .timestamp(Instant.now())
                        .build();
            }

            long newVersion = serverNote.getVersion() + 1;
            serverNote.setVersion(newVersion);
            serverNote.setDeviceId(req.getDeviceId());
            serverNote.setClientMutationId(req.getClientMutationId());

            if ("DELETE".equalsIgnoreCase(req.getOperation()) || (payload != null && Boolean.TRUE.equals(payload.getDeleted()))) {
                serverNote.setDeleted(true);
            } else if (payload != null) {
                if (payload.getTitle() != null) serverNote.setTitle(payload.getTitle());
                if (payload.getContent() != null) serverNote.setContent(payload.getContent());
                if (payload.getPinned() != null) serverNote.setPinned(payload.getPinned());
                if (payload.getArchived() != null) serverNote.setArchived(payload.getArchived());
                if (payload.getDeleted() != null) serverNote.setDeleted(payload.getDeleted());
            }

            serverNote = noteRepository.saveAndFlush(serverNote);
            NoteDto updatedDto = noteService.mapToDto(serverNote);

            noteService.recordRevisionAndBroadcast(userId, "NOTE", serverNote.getId(),
                    req.getOperation(), newVersion, updatedDto, req.getDeviceId(), req.getClientMutationId());

            return SyncAckResponseDto.builder()
                    .clientMutationId(req.getClientMutationId())
                    .entityId(serverNote.getId())
                    .serverVersion(newVersion)
                    .status("ACK")
                    .authoritativeNote(updatedDto)
                    .timestamp(Instant.now())
                    .build();
        } else {
            NoteEntity newNote = NoteEntity.builder()
                    .id(noteId)
                    .userId(userId)
                    .title(payload != null && payload.getTitle() != null ? payload.getTitle() : "")
                    .content(payload != null && payload.getContent() != null ? payload.getContent() : "")
                    .pinned(payload != null && Boolean.TRUE.equals(payload.getPinned()))
                    .archived(payload != null && Boolean.TRUE.equals(payload.getArchived()))
                    .deleted("DELETE".equalsIgnoreCase(req.getOperation()) || (payload != null && Boolean.TRUE.equals(payload.getDeleted())))
                    .version(1)
                    .deviceId(req.getDeviceId())
                    .clientMutationId(req.getClientMutationId())
                    .createdAt(clientTime)
                    .updatedAt(clientTime)
                    .build();

            newNote = noteRepository.saveAndFlush(newNote);
            NoteDto newDto = noteService.mapToDto(newNote);

            noteService.recordRevisionAndBroadcast(userId, "NOTE", newNote.getId(),
                    req.getOperation(), 1, newDto, req.getDeviceId(), req.getClientMutationId());

            return SyncAckResponseDto.builder()
                    .clientMutationId(req.getClientMutationId())
                    .entityId(newNote.getId())
                    .serverVersion(1)
                    .status("ACK")
                    .authoritativeNote(newDto)
                    .timestamp(Instant.now())
                    .build();
        }
    }

    public SyncResyncResponseDto getChangesSinceCursor(UUID userId, Long lastRevision) {
        Long cursor = lastRevision != null ? lastRevision : 0L;
        List<SyncRevisionEntity> revisions = syncRevisionRepository.findByUserIdAndIdGreaterThanOrderByIdAsc(userId, cursor);

        Optional<SyncRevisionEntity> latestOpt = syncRevisionRepository.findTopByUserIdOrderByIdDesc(userId);
        Long latestRev = latestOpt.map(SyncRevisionEntity::getId).orElse(0L);

        List<SyncChangeEventDto> changeEvents = new ArrayList<>();
        for (SyncRevisionEntity rev : revisions) {
            try {
                Object payloadObj = objectMapper.readValue(rev.getPayload(), Object.class);
                changeEvents.add(SyncChangeEventDto.builder()
                        .revisionId(rev.getId())
                        .entityType(rev.getEntityType())
                        .entityId(rev.getEntityId())
                        .operation(rev.getOperation())
                        .version(rev.getVersion())
                        .payload(payloadObj)
                        .timestamp(rev.getCreatedAt())
                        .originDeviceId(rev.getDeviceId())
                        .build());
            } catch (Exception e) {
                log.warn("Could not parse payload for revision {}", rev.getId(), e);
            }
        }

        return SyncResyncResponseDto.builder()
                .requiresSnapshot(false)
                .latestRevision(latestRev)
                .changes(changeEvents)
                .build();
    }

    public SyncResyncResponseDto getFullSnapshot(UUID userId) {
        List<NoteDto> notes = noteRepository.findByUserId(userId)
                .stream().map(noteService::mapToDto).collect(Collectors.toList());

        List<AttachmentDtos.AttachmentDto> attachments = attachmentRepository.findByUserId(userId)
                .stream().map(attachmentService::mapToDto).collect(Collectors.toList());

        Optional<SyncRevisionEntity> latestOpt = syncRevisionRepository.findTopByUserIdOrderByIdDesc(userId);
        Long latestRev = latestOpt.map(SyncRevisionEntity::getId).orElse(0L);

        SnapshotDto snapshot = SnapshotDto.builder()
                .notes(notes)
                .attachments(attachments)
                .build();

        return SyncResyncResponseDto.builder()
                .requiresSnapshot(true)
                .latestRevision(latestRev)
                .changes(Collections.emptyList())
                .snapshot(snapshot)
                .build();
    }
}
