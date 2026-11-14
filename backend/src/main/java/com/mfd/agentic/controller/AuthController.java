package com.mfd.agentic.controller;

import com.mfd.agentic.dto.AuthResponse;
import com.mfd.agentic.dto.LoginRequest;
import com.mfd.agentic.dto.ProfileResponse;
import com.mfd.agentic.dto.RegisterRequest;
import com.mfd.agentic.repository.MfdUserRepository;
import com.mfd.agentic.security.MfdPrincipal;
import com.mfd.agentic.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final MfdUserRepository users;

    public AuthController(AuthService authService, MfdUserRepository users) {
        this.authService = authService;
        this.users = users;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public ProfileResponse currentProfile(@AuthenticationPrincipal MfdPrincipal principal) {
        return users.findById(principal.id())
                .map(ProfileResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account is unavailable."));
    }
}
