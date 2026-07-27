package com.syncnotes.controller;

import com.syncnotes.dto.NoteDtos.NoteDto;
import com.syncnotes.security.UserPrincipal;
import com.syncnotes.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final NoteService noteService;

    @GetMapping
    public ResponseEntity<List<NoteDto>> searchNotes(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(name = "q", required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(noteService.searchNotes(userPrincipal.getId(), query));
    }
}
