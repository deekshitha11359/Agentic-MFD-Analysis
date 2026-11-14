package com.mfd.agentic.repository;

import com.mfd.agentic.model.MfdUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MfdUserRepository extends JpaRepository<MfdUser, Long> {
    boolean existsByEmail(String email);

    boolean existsByArnNumber(String arnNumber);

    Optional<MfdUser> findByArnNumber(String arnNumber);
}
