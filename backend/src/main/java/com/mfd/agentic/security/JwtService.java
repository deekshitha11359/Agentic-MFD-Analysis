package com.mfd.agentic.security;

import com.mfd.agentic.model.MfdUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret-base64}") String secretBase64,
            @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        byte[] secret = Decoders.BASE64.decode(secretBase64);
        this.signingKey = Keys.hmacShaKeyFor(secret);
        this.expirationMs = expirationMs;
    }

    public String createToken(MfdUser user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("arn", user.getArnNumber())
                .claim("role", user.getRole())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(signingKey)
                .compact();
    }

    public MfdPrincipal parsePrincipal(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return new MfdPrincipal(
                Long.parseLong(claims.getSubject()),
                claims.get("email", String.class),
                claims.get("arn", String.class),
                claims.get("role", String.class)
        );
    }
}
