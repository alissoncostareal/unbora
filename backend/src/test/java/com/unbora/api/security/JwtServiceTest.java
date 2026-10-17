package com.unbora.api.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private static final String SECRET = "test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha-256";
    private static final long EXPIRATION_MS = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS);
    }

    @Test
    @DisplayName("Security: Valid signed JWT token parses and returns correct principal")
    void testValidTokenVerification() {
        String token = jwtService.generateToken("user-123", "user@unbora.com", "Test User", "SUPERADMIN");
        assertNotNull(token);

        AdminPrincipal principal = jwtService.verifyToken(token);
        assertNotNull(principal);
        assertEquals("user-123", principal.id());
        assertEquals("user@unbora.com", principal.email());
        assertEquals("Test User", principal.name());
        assertEquals("SUPERADMIN", principal.role());
    }

    @Test
    @DisplayName("Security: Forged unsigned token (legacy format) must be rejected")
    void testForgedUnsignedTokenRejected() {
        // Attack payload attempting to impersonate SUPERADMIN without a cryptographic signature
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"sub\":\"attacker\",\"role\":\"SUPERADMIN\",\"email\":\"evil@attacker.com\",\"name\":\"Attacker\",\"exp\":9999999999}".getBytes(StandardCharsets.UTF_8));
        String forgedToken = header + "." + payload + ".invalidsignature";

        AdminPrincipal principal = jwtService.verifyToken(forgedToken);
        assertNull(principal, "Forged unsigned token must be rejected with null principal");

        String twoPartToken = payload + ".dummy";
        assertNull(jwtService.verifyToken(twoPartToken), "Two-part legacy payload must be rejected");
    }

    @Test
    @DisplayName("Security: Tampered payload with valid signature prefix must be rejected")
    void testTamperedPayloadRejected() {
        String token = jwtService.generateToken("user-123", "user@unbora.com", "Normal User", "user");
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length);

        // Tamper payload to elevate role to SUPERADMIN while reusing existing signature
        String tamperedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                "{\"sub\":\"user-123\",\"role\":\"SUPERADMIN\",\"email\":\"user@unbora.com\",\"name\":\"Normal User\"}".getBytes(StandardCharsets.UTF_8)
        );
        String tamperedToken = parts[0] + "." + tamperedPayload + "." + parts[2];

        AdminPrincipal principal = jwtService.verifyToken(tamperedToken);
        assertNull(principal, "Tampered payload must fail cryptographic signature check");
    }

    @Test
    @DisplayName("Security: Token signed with a different key must be rejected")
    void testDifferentKeyTokenRejected() {
        JwtService foreignService = new JwtService("different-secret-key-that-is-at-least-256-bits-long-38947239847", EXPIRATION_MS);
        String foreignToken = foreignService.generateToken("admin-1", "admin@unbora.com", "Admin", "SUPERADMIN");

        AdminPrincipal principal = jwtService.verifyToken(foreignToken);
        assertNull(principal, "Token from different key must be rejected");
    }
}
