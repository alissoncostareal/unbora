package com.unbora.api.domain.user.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmAccountDto(
        @NotBlank(message = "O token de confirmação é obrigatório.")
        String token
) {}
