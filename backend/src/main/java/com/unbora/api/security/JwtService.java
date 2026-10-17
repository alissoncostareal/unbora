package com.unbora.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final String rawSecret;
    private final long expirationMs;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtService(
            @Value("${unbora.jwt.secret:unbora-super-secret-jwt-key-minimum-256-bits-for-security-must-be-long-enough-12345}") String secret,
            @Value("${unbora.jwt.expiration-ms:2592000000}") long expirationMs
    ) {
        this.rawSecret = secret;
        this.expirationMs = expirationMs;

        // Ensure key is at least 256 bits by hashing with SHA-256 if needed
        byte[] keyBytes;
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            keyBytes = sha.digest(secret.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String sub, String email, String name, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(sub)
                .claim("email", email)
                .claim("name", name)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public AdminPrincipal verifyToken(String token) {
        if (token == null || token.isBlank()) return null;

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return new AdminPrincipal(
                    claims.getSubject(),
                    claims.get("email", String.class),
                    claims.get("name", String.class),
                    claims.get("role", String.class)
            );
        } catch (Exception e) {
            return null;
        }
    }
}
