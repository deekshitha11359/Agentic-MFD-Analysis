package com.mfd.agentic.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 12, max = 72) String password,
        @NotBlank @Size(max = 32) String arn,
        @Size(max = 32) String euin,
        @Size(max = 160) String firmName,
        @Size(max = 32) String phone,
        @Size(max = 60) String accountType
) {
}
