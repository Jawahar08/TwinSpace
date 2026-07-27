package com.syncnotes;

import com.syncnotes.dto.AuthDtos.*;
import com.syncnotes.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Test
    void testRegisterAndLoginFlow() {
        RegisterRequest registerReq = RegisterRequest.builder()
                .email("user1@example.com")
                .password("Password123!")
                .build();

        AuthTokenResponse registerRes = authService.register(registerReq);
        assertNotNull(registerRes.getAccessToken());
        assertNotNull(registerRes.getRefreshToken());
        assertEquals("user1@example.com", registerRes.getUser().getEmail());

        LoginRequest loginReq = LoginRequest.builder()
                .email("user1@example.com")
                .password("Password123!")
                .build();

        AuthTokenResponse loginRes = authService.login(loginReq);
        assertNotNull(loginRes.getAccessToken());
        assertEquals(registerRes.getUser().getId(), loginRes.getUser().getId());
    }
}
