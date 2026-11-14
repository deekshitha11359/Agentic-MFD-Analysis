package com.mfd.agentic.service;

import com.mfd.agentic.model.EmailOAuthState;
import com.mfd.agentic.repository.EmailOAuthStateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
public class EmailOAuthStateService {
    private final EmailOAuthStateRepository states;

    public EmailOAuthStateService(EmailOAuthStateRepository states) {
        this.states = states;
    }

    @Transactional
    public void create(String stateHash, Long userId, String provider) {
        Instant now = Instant.now();
        states.deleteByExpiresAtBefore(now);
        states.save(new EmailOAuthState(stateHash, userId, provider, now.plusSeconds(600)));
    }

    @Transactional
    public ConsumedState consume(String stateHash, String provider) {
        EmailOAuthState state = states.lockByStateHash(stateHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email authorization state is invalid or expired."));
        states.delete(state);
        if (!state.getProvider().equals(provider) || state.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email authorization state is invalid or expired.");
        }
        return new ConsumedState(state.getUserId(), state.getProvider());
    }

    public record ConsumedState(Long userId, String provider) {
    }
}
