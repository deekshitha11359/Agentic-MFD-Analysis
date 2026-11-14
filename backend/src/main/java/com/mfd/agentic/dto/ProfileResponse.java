package com.mfd.agentic.dto;

import com.mfd.agentic.model.MfdUser;

public record ProfileResponse(
        Long id,
        String name,
        String firmName,
        String arn,
        String euin,
        String email,
        String phone,
        String tier,
        String accountType
) {
    public static ProfileResponse from(MfdUser user) {
        return new ProfileResponse(
                user.getId(),
                user.getName(),
                user.getFirmName(),
                user.getArnNumber(),
                user.getEuinNumber(),
                user.getEmail(),
                user.getPhone(),
                "Registered Partner",
                user.getAccountType()
        );
    }
}
