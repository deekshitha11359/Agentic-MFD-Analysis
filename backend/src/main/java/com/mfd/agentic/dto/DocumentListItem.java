package com.mfd.agentic.dto;

import com.mfd.agentic.model.AnalysisDocument;

import java.time.Instant;

public record DocumentListItem(Long id, String fileName, String source, Instant createdAt) {
    public static DocumentListItem from(AnalysisDocument document) {
        return new DocumentListItem(
                document.getId(),
                document.getFileName(),
                document.getDetectedSource(),
                document.getCreatedAt()
        );
    }
}
