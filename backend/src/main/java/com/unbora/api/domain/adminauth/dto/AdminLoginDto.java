package com.unbora.api.domain.adminauth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminLoginDto(
        @Email(message = "E-mail inválido") @NotBlank(message = "O e-mail é obrigatório") String email,
        @NotBlank(message = "A senha é obrigatória") String password
) {}
