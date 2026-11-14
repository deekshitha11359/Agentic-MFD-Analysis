package com.mfd.agentic.controller;

import com.mfd.agentic.security.MfdPrincipal;
import com.mfd.agentic.service.DocumentService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final DocumentService documentService;

    public ReportController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping("/{documentId}")
    public Map<String, Object> getReport(
            @PathVariable Long documentId,
            @AuthenticationPrincipal MfdPrincipal principal
    ) {
        return documentService.reportForUser(documentId, principal.id());
    }
}
