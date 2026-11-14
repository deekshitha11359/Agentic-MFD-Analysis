package com.mfd.agentic.controller;

import com.mfd.agentic.dto.DocumentAnalysisRequest;
import com.mfd.agentic.dto.DocumentListItem;
import com.mfd.agentic.security.MfdPrincipal;
import com.mfd.agentic.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> saveAnalysis(
            @AuthenticationPrincipal MfdPrincipal principal,
            @Valid @RequestBody DocumentAnalysisRequest request
    ) {
        return documentService.saveAnalysis(principal.id(), request);
    }

    @GetMapping
    public List<DocumentListItem> listDocuments(@AuthenticationPrincipal MfdPrincipal principal) {
        return documentService.listForUser(principal.id());
    }

    @GetMapping("/latest")
    public ResponseEntity<Map<String, Object>> getLatestDocument(
            @AuthenticationPrincipal MfdPrincipal principal
    ) {
        return documentService.latestForUser(principal.id())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}")
    public Map<String, Object> getDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal MfdPrincipal principal
    ) {
        return documentService.reportForUser(id, principal.id());
    }
}
