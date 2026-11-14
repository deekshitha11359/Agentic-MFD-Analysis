package com.mfd.agentic.repository;

import com.mfd.agentic.model.EmailConnection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailConnectionRepository extends JpaRepository<EmailConnection, Long> {
    Optional<EmailConnection> findByUserIdAndProvider(Long userId, String provider);
    List<EmailConnection> findByUserIdOrderByProvider(Long userId);
    void deleteByUserIdAndProvider(Long userId, String provider);
    void deleteByUserId(Long userId);
}
