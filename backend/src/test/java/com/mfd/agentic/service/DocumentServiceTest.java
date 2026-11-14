package com.mfd.agentic.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mfd.agentic.repository.AnalysisDocumentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DocumentServiceTest {
    private final AnalysisDocumentRepository documents = mock(AnalysisDocumentRepository.class);
    private final DocumentService service = new DocumentService(documents, new ObjectMapper());

    @Test
    void reportLookupRequiresBothDocumentAndAuthenticatedOwner() {
        when(documents.findByIdAndUserId(17L, 6L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.reportForUser(17L, 6L)
        );

        assertEquals(404, exception.getStatusCode().value());
        verify(documents).findByIdAndUserId(17L, 6L);
    }
}
