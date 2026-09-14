package com.unbora.api.domain.notification.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateNotificationDto(
        @NotBlank(message = "O título é obrigatório") String title,
        @NotBlank(message = "A mensagem é obrigatória") String body,
        @NotBlank(message = "A cidade é obrigatória") String city,
        @NotBlank(message = "A região é obrigatória") String region,
        Boolean active
) {}
