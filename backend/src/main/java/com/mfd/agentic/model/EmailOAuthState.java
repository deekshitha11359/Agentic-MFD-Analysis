package com.mfd.agentic.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "email_oauth_states")
public class EmailOAuthState {
    @Id
    @Column(name = "state_hash", length = 64)
    private String stateHash;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected EmailOAuthState() {
    }

    public EmailOAuthState(String stateHash, Long userId, String provider, Instant expiresAt) {
        this.stateHash = stateHash;
        this.userId = userId;
        this.provider = provider;
        this.expiresAt = expiresAt;
    }

    public Long getUserId() { return userId; }
    public String getProvider() { return provider; }
    public Instant getExpiresAt() { return expiresAt; }

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
