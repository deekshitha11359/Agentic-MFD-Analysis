package com.mfd.agentic.repository;

import com.mfd.agentic.model.EmailOAuthState;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmailOAuthStateRepository extends JpaRepository<EmailOAuthState, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select state from EmailOAuthState state where state.stateHash = :stateHash")
    Optional<EmailOAuthState> lockByStateHash(@Param("stateHash") String stateHash);

    long deleteByExpiresAtBefore(java.time.Instant expiresAt);
}
