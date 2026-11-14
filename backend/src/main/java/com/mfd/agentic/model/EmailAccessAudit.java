package com.mfd.agentic.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "email_access_audit")
public class EmailAccessAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    protected EmailAccessAudit() {
    }

    public EmailAccessAudit(Long userId, String provider, String action) {
        this.userId = userId;
        this.provider = provider;
        this.action = action;
    }

    @PrePersist
    void prePersist() {
        if (occurredAt == null) occurredAt = Instant.now();
    }
}
