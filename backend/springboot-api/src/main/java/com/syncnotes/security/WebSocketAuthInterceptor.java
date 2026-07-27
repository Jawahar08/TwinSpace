package com.syncnotes.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtProvider jwtProvider;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                String token = accessor.getFirstNativeHeader("Authorization");
                if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
                    token = token.substring(7);
                } else {
                    token = accessor.getFirstNativeHeader("passcode");
                }

                if (StringUtils.hasText(token) && jwtProvider.validateToken(token)) {
                    UUID userId = jwtProvider.getUserIdFromToken(token);
                    UserDetails userDetails = userDetailsService.loadUserById(userId);
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    accessor.setUser(auth);
                    log.info("WebSocket connection authenticated for user: {}", userId);
                } else {
                    log.warn("Unauthorized WebSocket connection attempt");
                    throw new IllegalArgumentException("Unauthorized STOMP connection");
                }
            } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                Principal user = accessor.getUser();
                String destination = accessor.getDestination();
                if (user == null) {
                    throw new IllegalArgumentException("Unauthenticated WebSocket session");
                }
                // Verify user-scoped destination authorization
                if (destination != null && destination.startsWith("/user/") && !destination.startsWith("/user/queue/sync.events")) {
                    log.warn("User {} attempted illegal subscription to {}", user.getName(), destination);
                    throw new IllegalArgumentException("Unauthorized subscription destination");
                }
            }
        }

        return message;
    }
}
