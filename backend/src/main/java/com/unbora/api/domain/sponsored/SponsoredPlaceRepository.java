package com.unbora.api.domain.sponsored;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SponsoredPlaceRepository extends JpaRepository<SponsoredPlace, String> {

    List<SponsoredPlace> findAllByOrderBySortOrderAscCreatedAtDesc();

    List<SponsoredPlace> findByActiveTrueAndCityIgnoreCaseOrderBySortOrderAscCreatedAtDesc(String city);

    List<SponsoredPlace> findByActiveTrueAndSlotBoostTrueAndCityIgnoreCase(String city);

    List<SponsoredPlace> findByActiveTrueAndHomeHighlightTrueAndCityIgnoreCase(String city);
}
