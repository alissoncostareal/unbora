package com.unbora.api.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SyncUserDto(
        @NotBlank(message = "O ID é obrigatório") String id,
        @NotBlank(message = "O nome é obrigatório") String name,
        String email,
        @NotNull(message = "isGuest é obrigatório") Boolean isGuest,
        String platform
) {}
