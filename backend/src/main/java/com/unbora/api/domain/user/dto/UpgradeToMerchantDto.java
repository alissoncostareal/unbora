package com.unbora.api.domain.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpgradeToMerchantDto(
        @NotBlank(message = "O ID do usuário é obrigatório") String userId,
        @NotBlank(message = "O nome do negócio é obrigatório") String businessName,
        String phone,
        String cnpjCpf
) {}
