package com.unbora.api.domain.carousel;

import com.unbora.api.common.LocationsConstants;
import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.carousel.dto.CarouselRecordDto;
import com.unbora.api.domain.carousel.dto.CreateCarouselDto;
import com.unbora.api.domain.carousel.dto.UpdateCarouselDto;
import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CarouselsService {

    private final CarouselRepository carouselRepository;

    public CarouselsService(CarouselRepository carouselRepository) {
        this.carouselRepository = carouselRepository;
    }

    @PostConstruct
    @Transactional
    public void seedInitialData() {
        List<Carousel> defaults = List.of(
                createSeedCarousel("1", "Round-the-clock wellness", "Explore o melhor do autocuidado e bem-estar em Fortaleza", "Destaque", "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80", "Fortaleza", "Grande Fortaleza", 0),
                createSeedCarousel("2", "Aventuras ao Ar Livre", "Descubra praias escondidas e trilhas incríveis", "Natureza", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80", "Fortaleza", "Grande Fortaleza", 1),
                createSeedCarousel("3", "Gastronomia Local", "Os melhores cafés, bistrôs e restaurantes na orla", "Gastronomia", "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80", "Fortaleza", "Grande Fortaleza", 2),
                createSeedCarousel("4", "Sunset em Canoa Quebrada", "Cliffs, dunas e música ao vivo no litoral leste", "Evento", "https://images.unsplash.com/photo-1473496167767-577a174412d8?w=800&auto=format&fit=crop&q=80", "Canoa Quebrada", "Litoral Leste", 0),
                createSeedCarousel("organic-seed-cafes", "Cafés calmos para focar", "Curadoria Unbora: lugares bons para trabalhar sem pressa", "Dica Unbora", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80", "Fortaleza", "Grande Fortaleza", 10),
                createSeedCarousel("organic-seed-gratis", "O que fazer de graça", "Sugestões da comunidade: cultura e lazer sem custo", "Comunidade", "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80", "Fortaleza", "Grande Fortaleza", 11)
        );

        for (Carousel item : defaults) {
            if (!carouselRepository.existsById(item.getId())) {
                carouselRepository.save(item);
            }
        }
    }

    private Carousel createSeedCarousel(String id, String title, String subtitle, String tag, String imageUrl, String city, String region, int order) {
        Carousel c = new Carousel();
        c.setId(id);
        c.setTitle(title);
        c.setSubtitle(subtitle);
        c.setTag(tag);
        c.setImageUrl(imageUrl);
        c.setCity(city);
        c.setRegion(region);
        c.setSortOrder(order);
        c.setActive(true);
        c.setCreatedAt(Instant.now());
        c.setUpdatedAt(Instant.now());
        return c;
    }

    private CarouselRecordDto toRecord(Carousel c) {
        return new CarouselRecordDto(
                c.getId(),
                c.getTitle(),
                c.getSubtitle(),
                c.getTag(),
                c.getImageUrl(),
                c.getCity() != null ? c.getCity() : LocationsConstants.DEFAULT_CITY,
                c.getRegion() != null ? c.getRegion() : LocationsConstants.DEFAULT_REGION,
                c.getSortOrder(),
                c.getActive(),
                c.getCreatedAt() != null ? c.getCreatedAt().toString() : "",
                c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : ""
        );
    }

    public List<CarouselRecordDto> list(boolean activeOnly, String city, String region) {
        return carouselRepository.findAllByOrderBySortOrderAscCreatedAtDesc().stream()
                .filter(c -> !activeOnly || Boolean.TRUE.equals(c.getActive()))
                .filter(c -> LocationsConstants.matchesLocation(c.getCity(), c.getRegion(), city, region))
                .map(this::toRecord)
                .toList();
    }

    @Transactional
    public CarouselRecordDto create(CreateCarouselDto dto) {
        int order = dto.order() != null ? dto.order() : 0;
        if (dto.order() == null) {
            order = carouselRepository.findAll().stream()
                    .mapToInt(Carousel::getSortOrder)
                    .max()
                    .orElse(-1) + 1;
        }

        Carousel carousel = new Carousel();
        carousel.setId(UUID.randomUUID().toString());
        carousel.setTitle(dto.title().trim());
        carousel.setSubtitle(dto.subtitle().trim());
        carousel.setTag(dto.tag().trim());
        carousel.setImageUrl(dto.imageUrl().trim());
        carousel.setCity(dto.city().trim());
        carousel.setRegion(dto.region().trim());
        carousel.setSortOrder(order);
        carousel.setActive(dto.active() != null ? dto.active() : true);
        carousel.setCreatedAt(Instant.now());
        carousel.setUpdatedAt(Instant.now());

        return toRecord(carouselRepository.save(carousel));
    }

    @Transactional
    public CarouselRecordDto update(String id, UpdateCarouselDto dto) {
        Carousel carousel = carouselRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Carrossel não encontrado."));

        if (dto.title() != null && !dto.title().isBlank()) carousel.setTitle(dto.title().trim());
        if (dto.subtitle() != null && !dto.subtitle().isBlank()) carousel.setSubtitle(dto.subtitle().trim());
        if (dto.tag() != null && !dto.tag().isBlank()) carousel.setTag(dto.tag().trim());
        if (dto.imageUrl() != null && !dto.imageUrl().isBlank()) carousel.setImageUrl(dto.imageUrl().trim());
        if (dto.city() != null && !dto.city().isBlank()) carousel.setCity(dto.city().trim());
        if (dto.region() != null && !dto.region().isBlank()) carousel.setRegion(dto.region().trim());
        if (dto.order() != null) carousel.setSortOrder(dto.order());
        if (dto.active() != null) carousel.setActive(dto.active());
        carousel.setUpdatedAt(Instant.now());

        return toRecord(carouselRepository.save(carousel));
    }

    @Transactional
    public Map<String, Object> remove(String id) {
        Carousel carousel = carouselRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Carrossel não encontrado."));

        carouselRepository.delete(carousel);
        return Map.of("deleted", true, "id", id);
    }
}
