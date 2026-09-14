package com.unbora.api.domain.carousel.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCarouselDto(
        @NotBlank(message = "O título é obrigatório") String title,
        @NotBlank(message = "O subtítulo é obrigatório") String subtitle,
        @NotBlank(message = "A tag é obrigatória") String tag,
        @NotBlank(message = "A URL da imagem é obrigatória") String imageUrl,
        @NotBlank(message = "A cidade é obrigatória") String city,
        @NotBlank(message = "A região é obrigatória") String region,
        Integer order,
        Boolean active
) {}
