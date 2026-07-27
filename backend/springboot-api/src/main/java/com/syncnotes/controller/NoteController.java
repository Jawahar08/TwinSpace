package com.syncnotes.controller;

import com.syncnotes.dto.NoteDtos.*;
import com.syncnotes.security.UserPrincipal;
import com.syncnotes.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public ResponseEntity<List<NoteDto>> getActiveNotes(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(noteService.getAllActiveNotes(userPrincipal.getId()));
    }

    @GetMapping("/archived")
    public ResponseEntity<List<NoteDto>> getArchivedNotes(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(noteService.getArchivedNotes(userPrincipal.getId()));
    }

    @GetMapping("/trash")
    public ResponseEntity<List<NoteDto>> getTrashNotes(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(noteService.getTrashNotes(userPrincipal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteDto> getNoteById(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(noteService.getNoteById(userPrincipal.getId(), id));
    }

    @PostMapping
    public ResponseEntity<NoteDto> createOrUpdateNote(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody NoteInputDto input) {
        return ResponseEntity.ok(noteService.createOrUpdateNote(userPrincipal.getId(), input));
    }

    @PostMapping("/{id}/pin")
    public ResponseEntity<NoteDto> togglePinNote(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(noteService.togglePinNote(userPrincipal.getId(), id));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<NoteDto> toggleArchiveNote(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(noteService.toggleArchiveNote(userPrincipal.getId(), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NoteDto> softDeleteNote(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(noteService.softDeleteNote(userPrincipal.getId(), id));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<NoteDto> restoreNote(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        return ResponseEntity.ok(noteService.restoreNote(userPrincipal.getId(), id));
    }
}
