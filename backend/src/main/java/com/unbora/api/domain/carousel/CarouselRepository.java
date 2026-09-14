package com.unbora.api.domain.carousel;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarouselRepository extends JpaRepository<Carousel, String> {
    List<Carousel> findAllByOrderBySortOrderAscCreatedAtDesc();
}
