package com.unbora.api.domain.checkin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface CheckinRepository extends JpaRepository<Checkin, String> {

    List<Checkin> findByUserIdOrderByVisitedAtDesc(String userId);

    Optional<Checkin> findByIdAndUserId(String id, String userId);

    List<Checkin> findByUserIdAndVisitedAtAfterOrderByVisitedAtDesc(String userId, Instant after);

    long countByUserId(String userId);

    boolean existsByUserIdAndPlaceId(String userId, String placeId);
}
