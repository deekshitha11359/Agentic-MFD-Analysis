package com.mfd.agentic.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "email_connections")
public class EmailConnection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "email_address", nullable = false, length = 320)
    private String emailAddress;

    @Column(name = "access_token_encrypted", nullable = false, columnDefinition = "TEXT")
    private String accessTokenEncrypted;

    @Column(name = "refresh_token_encrypted", columnDefinition = "TEXT")
    private String refreshTokenEncrypted;

    @Column(name = "token_expires_at")
    private Instant tokenExpiresAt;

    @Column(name = "connected_at", nullable = false, updatable = false)
    private Instant connectedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected EmailConnection() {
    }

    public EmailConnection(
            Long userId,
            String provider,
            String emailAddress,
            String accessTokenEncrypted,
            String refreshTokenEncrypted,
            Instant tokenExpiresAt
    ) {
        this.userId = userId;
        this.provider = provider;
        this.emailAddress = emailAddress;
        this.accessTokenEncrypted = accessTokenEncrypted;
        this.refreshTokenEncrypted = refreshTokenEncrypted;
        this.tokenExpiresAt = tokenExpiresAt;
    }

    public Long getUserId() { return userId; }
    public String getProvider() { return provider; }
    public String getEmailAddress() { return emailAddress; }
    public String getAccessTokenEncrypted() { return accessTokenEncrypted; }
    public String getRefreshTokenEncrypted() { return refreshTokenEncrypted; }
    public Instant getTokenExpiresAt() { return tokenExpiresAt; }
    public Instant getConnectedAt() { return connectedAt; }

    public void updateMailbox(String emailAddress) {
        this.emailAddress = emailAddress;
    }

    public void updateTokens(String accessTokenEncrypted, String refreshTokenEncrypted, Instant tokenExpiresAt) {
        this.accessTokenEncrypted = accessTokenEncrypted;
        if (refreshTokenEncrypted != null) this.refreshTokenEncrypted = refreshTokenEncrypted;
        this.tokenExpiresAt = tokenExpiresAt;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (connectedAt == null) connectedAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
