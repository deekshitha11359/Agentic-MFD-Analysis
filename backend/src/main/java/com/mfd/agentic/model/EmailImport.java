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
@Table(name = "email_imports")
public class EmailImport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "message_id", nullable = false, length = 512)
    private String messageId;

    @Column(name = "attachment_id", nullable = false, length = 512)
    private String attachmentId;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_sha256", nullable = false, length = 64)
    private String fileSha256;

    @Column(name = "processing_status", nullable = false, length = 30)
    private String processingStatus;

    @Column(name = "analysis_document_id")
    private Long analysisDocumentId;

    @Column(name = "imported_at", nullable = false, updatable = false)
    private Instant importedAt;

    protected EmailImport() {
    }

    public EmailImport(Long userId, String provider, String messageId, String attachmentId,
                       String fileName, String fileSha256) {
        this.userId = userId;
        this.provider = provider;
        this.messageId = messageId;
        this.attachmentId = attachmentId;
        this.fileName = fileName;
        this.fileSha256 = fileSha256;
        this.processingStatus = "DOWNLOADED";
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getProvider() { return provider; }
    public String getMessageId() { return messageId; }
    public String getAttachmentId() { return attachmentId; }
    public String getFileName() { return fileName; }
    public String getProcessingStatus() { return processingStatus; }
    public Long getAnalysisDocumentId() { return analysisDocumentId; }
    public Instant getImportedAt() { return importedAt; }

    public void markCompleted(Long documentId) {
        this.analysisDocumentId = documentId;
        this.processingStatus = "COMPLETED";
    }

    public void markFailed() {
        this.processingStatus = "FAILED";
    }

    public void retry() {
        this.processingStatus = "DOWNLOADED";
    }

    @PrePersist
    void prePersist() {
        if (importedAt == null) importedAt = Instant.now();
    }
}
