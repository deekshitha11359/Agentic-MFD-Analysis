package com.mfd.agentic.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @PostMapping("/{documentId}")
    public ResponseEntity<Map<String, Object>> chatWithDocument(
            @PathVariable String documentId,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                "error", "Server-side document chat is not configured."
        ));
    }

    @GetMapping("/{documentId}/suggested-questions")
    public ResponseEntity<Map<String, Object>> getSuggestedQuestions(@PathVariable String documentId) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                "error", "Server-side suggested questions are not configured."
        ));
    }
}
