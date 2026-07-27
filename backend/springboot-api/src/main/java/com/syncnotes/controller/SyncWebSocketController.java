package com.syncnotes.controller;

import com.syncnotes.dto.SyncDtos.SyncAckResponseDto;
import com.syncnotes.dto.SyncDtos.SyncMutationRequestDto;
import com.syncnotes.security.UserPrincipal;
import com.syncnotes.service.SyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class SyncWebSocketController {

    private final SyncService syncService;

    @MessageMapping("/sync.mutate")
    @SendToUser("/queue/sync.ack")
    public SyncAckResponseDto processMutation(@Payload SyncMutationRequestDto mutation, Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("Unauthenticated STOMP WebSocket session");
        }

        UUID userId;
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();
            userId = userPrincipal.getId();
        } else {
            userId = UUID.fromString(principal.getName());
        }

        return syncService.processMutation(userId, mutation);
    }
}
