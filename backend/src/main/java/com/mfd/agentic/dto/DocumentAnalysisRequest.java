package com.mfd.agentic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record DocumentAnalysisRequest(
        @NotBlank @Size(max = 255) String fileName,
        @NotNull Map<String, Object> report
) {
}
