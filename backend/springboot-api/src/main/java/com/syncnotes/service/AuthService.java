package com.syncnotes.service;

import com.syncnotes.dto.AuthDtos.*;
import com.syncnotes.entity.RefreshTokenEntity;
import com.syncnotes.entity.UserEntity;
import com.syncnotes.exception.SyncNotesException;
import com.syncnotes.repository.RefreshTokenRepository;
import com.syncnotes.repository.UserRepository;
import com.syncnotes.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final NotionSyncService notionSyncService;

    @Transactional
    public AuthTokenResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new SyncNotesException("EMAIL_TAKEN", "Email address is already registered", HttpStatus.CONFLICT);
        }

        UserEntity user = UserEntity.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);

        // Record pairing session asynchronously in Notion Database
        String pairingCode = extractPairingCodeFromEmail(user.getEmail());
        notionSyncService.recordPairingSessionInNotion(user.getEmail(), pairingCode, "Windows & iPhone");

        return createAuthTokenResponse(user);
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new SyncNotesException("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new SyncNotesException("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED);
        }

        // Record pairing session asynchronously in Notion Database
        String pairingCode = extractPairingCodeFromEmail(user.getEmail());
        notionSyncService.recordPairingSessionInNotion(user.getEmail(), pairingCode, "Windows & iPhone");

        return createAuthTokenResponse(user);
    }

    private String extractPairingCodeFromEmail(String email) {
        if (email == null) return "TS-PAIRED";
        if (email.startsWith("device_") && email.contains("@")) {
            return email.substring(7, email.indexOf("@")).toUpperCase();
        }
        return "TS-USER";
    }

    @Transactional
    public AuthTokenResponse refresh(RefreshTokenRequest request) {
        String refreshTokenStr = request.getRefreshToken();
        if (!jwtProvider.validateToken(refreshTokenStr)) {
            throw new SyncNotesException("INVALID_REFRESH_TOKEN", "Expired or invalid refresh token", HttpStatus.UNAUTHORIZED);
        }

        UUID userId = jwtProvider.getUserIdFromToken(refreshTokenStr);
        String tokenHash = passwordEncoder.encode(refreshTokenStr);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new SyncNotesException("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND));

        // Revoke existing tokens for user on refresh for security
        refreshTokenRepository.deleteByUserId(userId);

        return createAuthTokenResponse(user);
    }

    @Transactional
    public void logout(UUID userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    public UserDto getCurrentUser(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new SyncNotesException("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND));
        return mapToUserDto(user);
    }

    private AuthTokenResponse createAuthTokenResponse(UserEntity user) {
        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtProvider.generateRefreshToken(user.getId());

        // Store refresh token
        RefreshTokenEntity refreshTokenEntity = RefreshTokenEntity.builder()
                .userId(user.getId())
                .tokenHash(passwordEncoder.encode(refreshToken))
                .expiresAt(Instant.now().plusMillis(604800000)) // 7 days
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        return AuthTokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getAccessExpirationMs())
                .user(mapToUserDto(user))
                .build();
    }

    private UserDto mapToUserDto(UserEntity user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
