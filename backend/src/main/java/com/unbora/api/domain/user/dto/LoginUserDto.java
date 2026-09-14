package com.unbora.api.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginUserDto(
        @Email(message = "E-mail inválido") @NotBlank(message = "O e-mail é obrigatório") String email,
        @NotBlank(message = "A senha é obrigatória") String password
) {}
