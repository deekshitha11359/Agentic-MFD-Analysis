package com.mfd.agentic.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mfd.agentic.dto.DocumentAnalysisRequest;
import com.mfd.agentic.dto.DocumentListItem;
import com.mfd.agentic.model.AnalysisDocument;
import com.mfd.agentic.repository.AnalysisDocumentRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DocumentService {
    private static final int MAX_REPORT_BYTES = 40 * 1024 * 1024;
    private static final TypeReference<Map<String, Object>> REPORT_TYPE = new TypeReference<>() {};

    private final AnalysisDocumentRepository documents;
    private final ObjectMapper objectMapper;

    public DocumentService(AnalysisDocumentRepository documents, ObjectMapper objectMapper) {
        this.documents = documents;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Map<String, Object> saveAnalysis(Long userId, DocumentAnalysisRequest request) {
        Map<String, Object> report = new LinkedHashMap<>(request.report());
        report.put("docName", request.fileName().trim());
        String reportJson = serializeReport(report);
        if (reportJson.getBytes(StandardCharsets.UTF_8).length > MAX_REPORT_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "The extracted report exceeds the 40 MB storage limit."
            );
        }

        Object sourceValue = report.get("source");
        String source = sourceValue instanceof String sourceText && !sourceText.isBlank()
                ? sourceText.substring(0, Math.min(sourceText.length(), 100))
                : null;
        AnalysisDocument document = documents.saveAndFlush(
                new AnalysisDocument(userId, request.fileName().trim(), source, "{}")
        );
        report.put("docId", document.getId().toString());
        document.setReportJson(serializeReport(report));
        documents.save(document);
        return report;
    }

    @Transactional(readOnly = true)
    public List<DocumentListItem> listForUser(Long userId) {
        return documents.findByUserIdOrderByCreatedAtDescIdDesc(userId, PageRequest.of(0, 100))
                .stream()
                .map(DocumentListItem::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> latestForUser(Long userId) {
        return documents.findFirstByUserIdAndStatusNotOrderByCreatedAtDescIdDesc(userId, "LEGACY_UNAVAILABLE")
                .map(this::readReport)
                .filter(report -> report.containsKey("summary"));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> reportForUser(Long documentId, Long userId) {
        AnalysisDocument document = documents.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found."));
        Map<String, Object> report = readReport(document);
        if (!report.containsKey("summary")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "A saved analysis is not available for this document.");
        }
        return report;
    }

    private String serializeReport(Map<String, Object> report) {
        try {
            return objectMapper.writeValueAsString(report);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("The extracted report could not be serialized.", exception);
        }
    }

    private Map<String, Object> readReport(AnalysisDocument document) {
        try {
            return objectMapper.readValue(document.getReportJson(), REPORT_TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("The stored report could not be read.", exception);
        }
    }
}
