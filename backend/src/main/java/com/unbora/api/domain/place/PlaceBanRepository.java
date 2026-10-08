package com.unbora.api.domain.place;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaceBanRepository extends JpaRepository<PlaceBan, String> {
    List<PlaceBan> findAllByOrderByCreatedAtDesc();
}
