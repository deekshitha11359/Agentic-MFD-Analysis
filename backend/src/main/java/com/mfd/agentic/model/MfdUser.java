package com.mfd.agentic.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;

import java.time.Instant;

@Entity
@Table(name = "users")
public class MfdUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "arn_number", nullable = false, unique = true, length = 100)
    private String arnNumber;

    @Column(name = "euin_number", length = 100)
    private String euinNumber;

    @Column(name = "firm_name", length = 255)
    private String firmName;

    @Column(length = 32)
    private String phone;

    @Column(name = "account_type", length = 60)
    private String accountType;

    @Column(nullable = false, length = 50)
    private String role = "MFD_DISTRIBUTOR";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected MfdUser() {
    }

    public MfdUser(String name, String email, String passwordHash, String arnNumber,
                   String euinNumber, String firmName, String phone, String accountType) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.arnNumber = arnNumber;
        this.euinNumber = euinNumber;
        this.firmName = firmName;
        this.phone = phone;
        this.accountType = accountType;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getArnNumber() {
        return arnNumber;
    }

    public String getEuinNumber() {
        return euinNumber;
    }

    public String getFirmName() {
        return firmName;
    }

    public String getPhone() {
        return phone;
    }

    public String getAccountType() {
        return accountType;
    }

    public String getRole() {
        return role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @PrePersist
    void setCreatedAt() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
