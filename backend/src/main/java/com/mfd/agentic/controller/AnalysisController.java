package com.mfd.agentic.controller;

import com.mfd.agentic.security.MfdPrincipal;
import com.mfd.agentic.service.DocumentService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {
    private final DocumentService documentService;

    public AnalysisController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping("/{documentId}")
    public Map<String, Object> getAnalysis(
            @PathVariable Long documentId,
            @AuthenticationPrincipal MfdPrincipal principal
    ) {
        return documentService.reportForUser(documentId, principal.id());
    }

    @GetMapping("/{documentId}/brokerage")
    public Map<String, Object> getBrokerageAnalysis(
            @PathVariable Long documentId,
            @AuthenticationPrincipal MfdPrincipal principal
    ) {
        Map<String, Object> report = documentService.reportForUser(documentId, principal.id());
        Map<String, Object> brokerage = new LinkedHashMap<>();
        brokerage.put("summary", report.get("summary"));
        brokerage.put("normalizedRecords", report.get("normalizedRecords"));
        return brokerage;
    }
}
