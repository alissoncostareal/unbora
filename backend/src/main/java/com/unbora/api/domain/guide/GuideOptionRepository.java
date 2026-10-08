package com.unbora.api.domain.guide;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuideOptionRepository extends JpaRepository<GuideOption, String> {
    List<GuideOption> findAllByOrderByStepAscPositionAsc();

    List<GuideOption> findByStepOrderByPositionAsc(String step);
}
