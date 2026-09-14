package com.unbora.api.domain.adminauth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreatePortalUserDto(
        @NotBlank(message = "O nome é obrigatório") String name,
        @Email(message = "E-mail inválido") @NotBlank(message = "O e-mail é obrigatório") String email,
        @NotBlank(message = "A senha é obrigatória") String password,
        @NotBlank(message = "O perfil é obrigatório") @Pattern(regexp = "admin|consultor", message = "O perfil deve ser 'admin' ou 'consultor'") String role
) {}
