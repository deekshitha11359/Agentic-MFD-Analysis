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
@Table(name = "documents")
public class AnalysisDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 50)
    private String fileType = "ANALYSIS_JSON";

    @Column(name = "detected_source", length = 100)
    private String detectedSource;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "storage_path", length = 500)
    private String storagePath;

    @Column(name = "report_json", nullable = false, columnDefinition = "LONGTEXT")
    private String reportJson;

    @Column(nullable = false, length = 50)
    private String status = "COMPLETED";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AnalysisDocument() {
    }

    public AnalysisDocument(Long userId, String fileName, String detectedSource, String reportJson) {
        this.userId = userId;
        this.fileName = fileName;
        this.detectedSource = detectedSource;
        this.reportJson = reportJson;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getDetectedSource() {
        return detectedSource;
    }

    public String getReportJson() {
        return reportJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setReportJson(String reportJson) {
        this.reportJson = reportJson;
    }

    @PrePersist
    void setCreatedAt() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
