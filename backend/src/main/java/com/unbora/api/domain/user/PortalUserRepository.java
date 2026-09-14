package com.unbora.api.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortalUserRepository extends JpaRepository<PortalUser, String> {
    Optional<PortalUser> findByEmail(String email);
    List<PortalUser> findAllByOrderByCreatedAtDesc();
}
