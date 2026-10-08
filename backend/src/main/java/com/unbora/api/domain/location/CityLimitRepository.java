package com.unbora.api.domain.location;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CityLimitRepository extends JpaRepository<CityLimit, String> {

    List<CityLimit> findAllByOrderByCityNameAsc();

    List<CityLimit> findByActiveTrueOrderByCityNameAsc();
}
