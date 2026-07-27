package com.syncnotes.controller;

import com.syncnotes.dto.SyncDtos.*;
import com.syncnotes.security.UserPrincipal;
import com.syncnotes.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    @GetMapping("/changes")
    public ResponseEntity<SyncResyncResponseDto> getChangesSinceCursor(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(name = "cursor", required = false, defaultValue = "0") Long lastRevision) {
        return ResponseEntity.ok(syncService.getChangesSinceCursor(userPrincipal.getId(), lastRevision));
    }

    @GetMapping("/snapshot")
    public ResponseEntity<SyncResyncResponseDto> getFullSnapshot(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(syncService.getFullSnapshot(userPrincipal.getId()));
    }
}
