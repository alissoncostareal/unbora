package com.unbora.api.domain.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unbora.api.common.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GoogleAuthServiceTest {

    private GoogleAuthService googleAuthService;

    @BeforeEach
    void setUp() {
        googleAuthService = new GoogleAuthService(new ObjectMapper(), "test-client-id.apps.googleusercontent.com");
    }

    @Test
    @DisplayName("Deve rejeitar token nulo ou vazio")
    void shouldRejectNullOrEmptyToken() {
        assertThrows(ApiException.class, () -> googleAuthService.verifyIdToken(null));
        assertThrows(ApiException.class, () -> googleAuthService.verifyIdToken("   "));
    }

    @Test
    @DisplayName("Deve rejeitar token inválido")
    void shouldRejectInvalidToken() {
        assertThrows(ApiException.class, () -> googleAuthService.verifyIdToken("invalid.jwt.token"));
    }
}
