package com.unbora.api.domain.testimonial;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestimonialSettingsRepository extends JpaRepository<TestimonialSettings, String> {
}
