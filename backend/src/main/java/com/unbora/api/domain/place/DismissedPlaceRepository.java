package com.unbora.api.domain.place;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DismissedPlaceRepository extends JpaRepository<DismissedPlace, String> {
    boolean existsByUserIdAndPlaceKey(String userId, String placeKey);

    List<DismissedPlace> findByUserId(String userId);
}
