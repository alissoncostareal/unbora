package com.unbora.api.domain.user.dto;

public record PublicUserDto(
        String id,
        String name,
        String email,
        Boolean isGuest,
        String platform,
        String role,
        String businessName,
        String cnpj,
        String createdAt,
        String lastSeenAt,
        String token
) {
    public PublicUserDto(
            String id,
            String name,
            String email,
            Boolean isGuest,
            String platform,
            String role,
            String businessName,
            String cnpj,
            String createdAt,
            String lastSeenAt
    ) {
        this(id, name, email, isGuest, platform, role, businessName, cnpj, createdAt, lastSeenAt, null);
    }
}
