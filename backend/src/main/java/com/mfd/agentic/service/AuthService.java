package com.mfd.agentic.service;

import com.mfd.agentic.dto.AuthResponse;
import com.mfd.agentic.dto.LoginRequest;
import com.mfd.agentic.dto.ProfileResponse;
import com.mfd.agentic.dto.RegisterRequest;
import com.mfd.agentic.model.MfdUser;
import com.mfd.agentic.repository.MfdUserRepository;
import com.mfd.agentic.security.JwtService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {
    private final MfdUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            MfdUserRepository users,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String arn = normalizeArn(request.arn());
        if (users.existsByEmail(email) || users.existsByArnNumber(arn)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email or ARN already exists.");
        }
        MfdUser user = new MfdUser(
                request.name().trim(),
                email,
                passwordEncoder.encode(request.password()),
                arn,
                blankToNull(request.euin()),
                blankToNull(request.firmName()),
                blankToNull(request.phone()),
                blankToNull(request.accountType())
        );
        try {
            user = users.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email or ARN already exists.");
        }
        return createAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        MfdUser user = users.findByArnNumber(normalizeArn(request.arn()))
                .filter(account -> passwordEncoder.matches(request.password(), account.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid ARN or password."
                ));
        return createAuthResponse(user);
    }

    private AuthResponse createAuthResponse(MfdUser user) {
        return new AuthResponse(jwtService.createToken(user), ProfileResponse.from(user));
    }

    private String normalizeArn(String arn) {
        return arn.trim().toUpperCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
