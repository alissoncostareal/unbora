package com.unbora.api.domain.event.dto;

import jakarta.validation.constraints.NotBlank;

public record ImportInstagramEventDto(
        @NotBlank(message = "A URL ou link do post do Instagram é obrigatória")
        String url,
        String caption,
        String imageUrl,
        String city,
        String region,
        String merchantId
) {}
