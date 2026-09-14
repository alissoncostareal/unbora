package com.unbora.api.domain.event.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateEventDto(
        @NotBlank(message = "O título é obrigatório") String title,
        @NotBlank(message = "A descrição é obrigatória") String description,
        @NotBlank(message = "A URL da imagem é obrigatória") String imageUrl,
        @NotBlank(message = "A cidade é obrigatória") String city,
        @NotBlank(message = "A região é obrigatória") String region,
        String venue,
        @NotBlank(message = "A data de início é obrigatória") String startsAt,
        Boolean active,
        /** Creator user id (any logged-in user). */
        @NotBlank(message = "O ID do usuário é obrigatório") String merchantId,
        @NotBlank(message = "A categoria é obrigatória") String category
) {}
