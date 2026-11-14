package com.mfd.agentic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(max = 32) String arn,
        @NotBlank @Size(max = 72) String password
) {
}
