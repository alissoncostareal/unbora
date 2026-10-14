package com.unbora.api.domain.place;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPlaceLikeRepository extends JpaRepository<UserPlaceLike, String> {

    List<UserPlaceLike> findByUserIdOrderByCreatedAtDesc(String userId);

    boolean existsByUserIdAndPlaceId(String userId, String placeId);

    Optional<UserPlaceLike> findByUserIdAndPlaceId(String userId, String placeId);

    @Modifying
    @Query("DELETE FROM UserPlaceLike l WHERE l.userId = :userId AND l.placeId = :placeId")
    void deleteByUserIdAndPlaceId(@Param("userId") String userId, @Param("placeId") String placeId);

    long countByPlaceId(String placeId);
}
