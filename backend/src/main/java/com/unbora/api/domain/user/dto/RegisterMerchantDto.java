package com.unbora.api.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterMerchantDto(
        @NotBlank(message = "O nome é obrigatório") String name,
        @Email(message = "E-mail inválido") @NotBlank(message = "O e-mail é obrigatório") String email,
        @NotBlank(message = "A senha é obrigatória") @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres") String password,
        @NotBlank(message = "O nome do negócio é obrigatório") String businessName,
        String platform
) {}
