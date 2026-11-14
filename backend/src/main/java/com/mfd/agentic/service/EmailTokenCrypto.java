package com.mfd.agentic.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Service
public class EmailTokenCrypto {
    private static final int NONCE_LENGTH = 12;
    private static final int TAG_BITS = 128;
    private final String keyBase64;
    private final SecureRandom secureRandom = new SecureRandom();

    public EmailTokenCrypto(@Value("${app.email.encryption-key-base64:}") String keyBase64) {
        this.keyBase64 = keyBase64;
    }

    public boolean isConfigured() {
        if (keyBase64.isBlank()) return false;
        try {
            return Base64.getDecoder().decode(keyBase64).length == 32;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    public String encrypt(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            byte[] nonce = new byte[NONCE_LENGTH];
            secureRandom.nextBytes(nonce);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, nonce));
            byte[] ciphertext = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(ByteBuffer.allocate(nonce.length + ciphertext.length)
                    .put(nonce).put(ciphertext).array());
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Email token encryption failed.", exception);
        }
    }

    public String decrypt(String encrypted) {
        if (encrypted == null || encrypted.isBlank()) return null;
        try {
            byte[] payload = Base64.getDecoder().decode(encrypted);
            if (payload.length <= NONCE_LENGTH) throw new IllegalArgumentException("Invalid encrypted token payload.");
            ByteBuffer buffer = ByteBuffer.wrap(payload);
            byte[] nonce = new byte[NONCE_LENGTH];
            buffer.get(nonce);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, nonce));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException exception) {
            throw new IllegalStateException("Stored email token could not be decrypted. Verify APP_EMAIL_ENCRYPTION_KEY_BASE64.", exception);
        }
    }

    private SecretKeySpec key() {
        if (!isConfigured()) {
            throw new IllegalStateException("Email token encryption is not configured.");
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(keyBase64);
            if (bytes.length != 32) throw new IllegalArgumentException("The encryption key must be exactly 32 bytes.");
            return new SecretKeySpec(Arrays.copyOf(bytes, bytes.length), "AES");
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("APP_EMAIL_ENCRYPTION_KEY_BASE64 must encode exactly 32 random bytes.", exception);
        }
    }
}
