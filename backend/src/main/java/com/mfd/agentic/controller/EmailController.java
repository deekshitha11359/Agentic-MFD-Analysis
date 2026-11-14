package com.mfd.agentic.controller;

import com.mfd.agentic.security.MfdPrincipal;
import com.mfd.agentic.service.EmailConnectorService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
public class EmailController {
    private final EmailConnectorService emailService;

    public EmailController(EmailConnectorService emailService) {
        this.emailService = emailService;
    }

    @GetMapping("/connect/{provider}")
    public Map<String, String> connect(
            @PathVariable String provider,
            @AuthenticationPrincipal MfdPrincipal principal
    ) {
        String authorizationUrl = emailService.startConnection(principal.id(), provider);
        return Map.of("authorizationUrl", authorizationUrl);
    }

    @GetMapping("/callback/{provider}")
    public ResponseEntity<Void> callback(
            @PathVariable String provider,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error
    ) {
        try {
            String returnUrl = emailService.completeConnection(provider, state, code, error);
            return redirect(returnUrl);
        } catch (ResponseStatusException exception) {
            return redirect(emailService.frontendCallbackErrorUrl());
        }
    }

    @GetMapping("/connection")
    public List<Map<String, Object>> connectionStatus(@AuthenticationPrincipal MfdPrincipal principal) {
        return emailService.providerStatuses(principal.id());
    }

    @GetMapping("/messages")
    public List<Map<String, Object>> messages(
            @AuthenticationPrincipal MfdPrincipal principal,
            @RequestParam String provider,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String after,
            @RequestParam(required = false) String before
    ) {
        return emailService.searchMessages(principal.id(), provider, query, after, before);
    }

    @GetMapping("/messages/{messageId}/attachments")
    public List<Map<String, Object>> attachments(
            @AuthenticationPrincipal MfdPrincipal principal,
            @RequestParam String provider,
            @PathVariable String messageId
    ) {
        return emailService.listAttachments(principal.id(), provider, messageId);
    }

    @PostMapping("/import")
    public Map<String, Object> importAttachment(
            @AuthenticationPrincipal MfdPrincipal principal,
            @Valid @RequestBody ImportRequest request
    ) {
        return emailService.downloadSelectedAttachment(
                principal.id(), request.provider(), request.messageId(), request.attachmentId()
        );
    }

    @PostMapping("/imports/{importId}/status")
    public ResponseEntity<Void> updateImportStatus(
            @AuthenticationPrincipal MfdPrincipal principal,
            @PathVariable Long importId,
            @Valid @RequestBody ImportStatusRequest request
    ) {
        emailService.updateImportStatus(principal.id(), importId, request.status(), request.documentId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/imports")
    public List<Map<String, Object>> imports(@AuthenticationPrincipal MfdPrincipal principal) {
        return emailService.listImports(principal.id());
    }

    @DeleteMapping("/connection/{provider}")
    public Map<String, Object> disconnectProvider(
            @AuthenticationPrincipal MfdPrincipal principal,
            @PathVariable String provider
    ) {
        return emailService.disconnect(principal.id(), provider);
    }

    @DeleteMapping("/connection")
    public List<Map<String, Object>> disconnectAll(@AuthenticationPrincipal MfdPrincipal principal) {
        return emailService.disconnectAll(principal.id());
    }

    @DeleteMapping("/imports/{importId}")
    public ResponseEntity<Void> deleteImport(
            @AuthenticationPrincipal MfdPrincipal principal,
            @PathVariable Long importId
    ) {
        emailService.deleteImport(principal.id(), importId);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<Void> redirect(String location) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, URI.create(location).toASCIIString())
                .build();
    }

    public record ImportRequest(
            @NotBlank @Size(max = 20) String provider,
            @NotBlank @Size(max = 512) String messageId,
            @NotBlank @Size(max = 512) String attachmentId
    ) {
    }

    public record ImportStatusRequest(
            @NotBlank @Size(max = 20) String status,
            Long documentId
    ) {
    }
}
