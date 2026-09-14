package com.unbora.api.domain.venue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VenuePhotoRepository extends JpaRepository<VenuePhoto, String> {

    Optional<VenuePhoto> findByVenueNormalized(String venueNormalized);

    boolean existsByVenueNormalized(String venueNormalized);

    long deleteBySourceStartingWith(String sourcePrefix);

    long deleteBySource(String source);
}
