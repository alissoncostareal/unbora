package com.unbora.api.security;

public record AdminPrincipal(
        String id,
        String email,
        String name,
        String role
) {}
