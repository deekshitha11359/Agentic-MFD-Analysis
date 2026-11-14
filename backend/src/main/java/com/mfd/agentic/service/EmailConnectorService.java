package com.mfd.agentic.service;

import com.mfd.agentic.model.EmailConnection;
import com.mfd.agentic.model.EmailAccessAudit;
import com.mfd.agentic.model.EmailImport;
import com.mfd.agentic.repository.AnalysisDocumentRepository;
import com.mfd.agentic.repository.EmailAccessAuditRepository;
import com.mfd.agentic.repository.EmailConnectionRepository;
import com.mfd.agentic.repository.EmailImportRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class EmailConnectorService {
    private static final int MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("csv", "tsv", "txt");
    private static final String DEFAULT_SEARCH =
            "brokerage OR commission OR mutual fund OR AMC OR folio OR transaction statement OR payout OR accrual OR GST OR distributor statement";
    private static final String GMAIL_MESSAGE_FIELDS =
            "id,payload(headers(name,value),mimeType,filename,body(attachmentId,size),parts(mimeType,filename,body(attachmentId,size),parts(mimeType,filename,body(attachmentId,size),parts(mimeType,filename,body(attachmentId,size),parts(mimeType,filename,body(attachmentId,size),parts(mimeType,filename,body(attachmentId,size)))))))";
    private static final ParameterizedTypeReference<Map<String, Object>> JSON_MAP = new ParameterizedTypeReference<>() {};

    private final RestClient restClient;
    private final EmailConnectionRepository connections;
    private final EmailOAuthStateService oauthStates;
    private final EmailTokenCrypto tokenCrypto;
    private final EmailImportRepository imports;
    private final AnalysisDocumentRepository documents;
    private final EmailAccessAuditRepository auditEvents;
    private final String gmailClientId;
    private final String gmailClientSecret;
    private final String microsoftClientId;
    private final String microsoftClientSecret;
    private final String publicBackendUrl;
    private final String frontendUrl;

    public EmailConnectorService(
            RestClient.Builder restClientBuilder,
            EmailConnectionRepository connections,
            EmailOAuthStateService oauthStates,
            EmailTokenCrypto tokenCrypto,
            EmailImportRepository imports,
            AnalysisDocumentRepository documents,
            EmailAccessAuditRepository auditEvents,
            @Value("${app.email.gmail.client-id:}") String gmailClientId,
            @Value("${app.email.gmail.client-secret:}") String gmailClientSecret,
            @Value("${app.email.microsoft.client-id:}") String microsoftClientId,
            @Value("${app.email.microsoft.client-secret:}") String microsoftClientSecret,
            @Value("${app.email.public-backend-url:}") String publicBackendUrl,
            @Value("${app.email.frontend-url:http://localhost:5173}") String frontendUrl
    ) {
        this.restClient = restClientBuilder.build();
        this.connections = connections;
        this.oauthStates = oauthStates;
        this.tokenCrypto = tokenCrypto;
        this.imports = imports;
        this.documents = documents;
        this.auditEvents = auditEvents;
        this.gmailClientId = gmailClientId;
        this.gmailClientSecret = gmailClientSecret;
        this.microsoftClientId = microsoftClientId;
        this.microsoftClientSecret = microsoftClientSecret;
        this.publicBackendUrl = publicBackendUrl.replaceAll("/+$", "");
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    public List<Map<String, Object>> providerStatuses(Long userId) {
        return List.of(providerStatus(userId, "GMAIL"), providerStatus(userId, "MICROSOFT"));
    }

    public String frontendCallbackErrorUrl() {
        return frontendUrl + "/?emailConnection=error";
    }

    public Map<String, Object> providerStatus(Long userId, String providerName) {
        String provider = normalizeProvider(providerName);
        Optional<EmailConnection> connection = connections.findByUserIdAndProvider(userId, provider);
        boolean configured = providerConfigured(provider);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("provider", provider);
        result.put("configured", configured);
        result.put("connected", connection.isPresent());
        result.put("emailAddress", connection.map(EmailConnection::getEmailAddress).orElse(null));
        result.put("connectedAt", connection.map(EmailConnection::getConnectedAt).orElse(null));
        result.put("setupMessage", configured ? null : setupMessage(provider));
        return result;
    }

    public String startConnection(Long userId, String providerName) {
        String provider = normalizeProvider(providerName);
        requireConfigured(provider);
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        String state = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        oauthStates.create(sha256(state), userId, provider);
        recordAudit(userId, provider, "CONNECT_STARTED");
        String callback = callbackUrl(provider);
        UriComponentsBuilder authorization = provider.equals("GMAIL")
                ? UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", gmailClientId)
                .queryParam("redirect_uri", callback)
                .queryParam("response_type", "code")
                .queryParam("scope", "https://www.googleapis.com/auth/gmail.readonly")
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                : UriComponentsBuilder.fromUriString("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")
                .queryParam("client_id", microsoftClientId)
                .queryParam("redirect_uri", callback)
                .queryParam("response_type", "code")
                .queryParam("response_mode", "query")
                .queryParam("scope", "offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read");
        return authorization.queryParam("state", state).build().encode().toUriString();
    }

    public String completeConnection(String providerName, String state, String code, String providerError) {
        String provider = normalizeProvider(providerName);
        if (state == null || state.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email authorization state is invalid or expired.");
        }
        EmailOAuthStateService.ConsumedState consumed = oauthStates.consume(sha256(state), provider);
        if (providerError != null || code == null || code.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email provider authorization was not completed.");
        }
        try {
            Map<String, Object> tokenResponse = exchangeAuthorizationCode(provider, code);
            String accessToken = stringValue(tokenResponse.get("access_token"));
            if (accessToken == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Email provider did not return an access token.");
            }
            String refreshToken = stringValue(tokenResponse.get("refresh_token"));
            Instant expiresAt = Instant.now().plusSeconds(numberValue(tokenResponse.get("expires_in"), 3600));
            String emailAddress = getMailboxAddress(provider, accessToken);
            if (emailAddress == null || emailAddress.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Email provider did not return a mailbox address.");
            }
            String encryptedRefresh = refreshToken == null ? null : tokenCrypto.encrypt(refreshToken);
            Optional<EmailConnection> existing = connections.findByUserIdAndProvider(consumed.userId(), provider);
            EmailConnection connection = existing.orElseGet(() -> new EmailConnection(
                    consumed.userId(), provider, emailAddress, tokenCrypto.encrypt(accessToken), encryptedRefresh, expiresAt
            ));
            if (existing.isPresent()) {
                connection.updateMailbox(emailAddress);
                connection.updateTokens(tokenCrypto.encrypt(accessToken), encryptedRefresh, expiresAt);
            }
            connections.save(connection);
            recordAudit(consumed.userId(), provider, "CONNECTED");
            return frontendUrl + "/?emailConnection=connected";
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Email provider authorization failed. Verify the OAuth app configuration and redirect URI.");
        }
    }

    public List<Map<String, Object>> searchMessages(
            Long userId, String providerName, String query, String after, String before
    ) {
        String provider = normalizeProvider(providerName);
        EmailConnection connection = requireConnection(userId, provider);
        validateSearch(query);
        LocalDate afterDate = parseDate(after);
        LocalDate beforeDate = parseDate(before);
        if (afterDate != null && beforeDate != null && afterDate.isAfter(beforeDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The start date must not be after the end date.");
        }
        String token = accessToken(connection);
        try {
            List<Map<String, Object>> messages = provider.equals("GMAIL")
                    ? searchGmail(connection, token, query, afterDate, beforeDate)
                    : searchMicrosoft(connection, token, query, afterDate, beforeDate);
            recordAudit(userId, provider, "MAILBOX_SEARCH");
            return messages;
        } catch (RestClientResponseException exception) {
            throw providerFailure(exception);
        }
    }

    public List<Map<String, Object>> listAttachments(Long userId, String providerName, String messageId) {
        String provider = normalizeProvider(providerName);
        validateIdentifier(messageId, "message");
        EmailConnection connection = requireConnection(userId, provider);
        String token = accessToken(connection);
        try {
            List<Map<String, Object>> result = provider.equals("GMAIL")
                    ? gmailAttachments(token, messageId)
                    : microsoftAttachments(token, messageId);
            recordAudit(userId, provider, "ATTACHMENTS_LISTED");
            return result;
        } catch (RestClientResponseException exception) {
            throw providerFailure(exception);
        }
    }

    @Transactional
    public Map<String, Object> downloadSelectedAttachment(
            Long userId, String providerName, String messageId, String attachmentId
    ) {
        String provider = normalizeProvider(providerName);
        validateIdentifier(messageId, "message");
        validateIdentifier(attachmentId, "attachment");
        EmailConnection connection = requireConnection(userId, provider);
        String token = accessToken(connection);
        try {
            Map<String, Object> attachment = provider.equals("GMAIL")
                    ? downloadGmailAttachment(token, messageId, attachmentId)
                    : downloadMicrosoftAttachment(token, messageId, attachmentId);
            String fileName = safeFileName(stringValue(attachment.get("name")));
            validateAttachment(fileName, attachment.get("contentType"), attachment.get("size"));
            byte[] bytes = decodeAttachment(stringValue(attachment.get("contentBytes")));
            validateAttachmentBytes(bytes);
            String fingerprint = sha256(bytes);
            Optional<EmailImport> priorImport = imports.findByUserIdAndProviderAndMessageIdAndAttachmentId(
                    userId, provider, messageId, attachmentId
            );
            if (priorImport.isPresent() && !"FAILED".equals(priorImport.get().getProcessingStatus())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "This attachment was already imported.");
            }
            if (priorImport.isEmpty() && imports.existsByUserIdAndFileSha256(userId, fingerprint)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "This attachment matches a file already imported for this account.");
            }

            EmailImport emailImport;
            if (priorImport.isPresent()) {
                emailImport = priorImport.get();
                emailImport.retry();
                recordAudit(userId, provider, "ATTACHMENT_RETRIED");
            } else {
                emailImport = imports.saveAndFlush(
                        new EmailImport(userId, provider, messageId, attachmentId, fileName, fingerprint)
                );
                recordAudit(userId, provider, "ATTACHMENT_SELECTED");
            }
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("importId", emailImport.getId());
            result.put("provider", provider);
            result.put("messageId", messageId);
            result.put("attachmentId", attachmentId);
            result.put("fileName", fileName);
            result.put("contentType", stringValue(attachment.get("contentType")));
            result.put("size", bytes.length);
            result.put("contentBase64", Base64.getEncoder().encodeToString(bytes));
            return result;
        } catch (RestClientResponseException exception) {
            throw providerFailure(exception);
        }
    }

    @Transactional
    public void updateImportStatus(Long userId, Long importId, String status, Long documentId) {
        EmailImport emailImport = imports.findByIdAndUserId(importId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email import not found."));
        if ("COMPLETED".equals(status)) {
            if (documentId == null || documents.findByIdAndUserId(documentId, userId).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "The analyzed document was not found for this account.");
            }
            emailImport.markCompleted(documentId);
            recordAudit(userId, emailImport.getProvider(), "IMPORT_COMPLETED");
        } else if ("FAILED".equals(status)) {
            emailImport.markFailed();
            recordAudit(userId, emailImport.getProvider(), "IMPORT_FAILED");
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Import status must be COMPLETED or FAILED.");
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listImports(Long userId) {
        return imports.findTop50ByUserIdOrderByImportedAtDesc(userId).stream().map(emailImport -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", emailImport.getId());
            item.put("provider", emailImport.getProvider());
            item.put("fileName", emailImport.getFileName());
            item.put("status", emailImport.getProcessingStatus());
            item.put("documentId", emailImport.getAnalysisDocumentId());
            item.put("importedAt", emailImport.getImportedAt());
            return item;
        }).toList();
    }

    @Transactional
    public void deleteImport(Long userId, Long importId) {
        EmailImport emailImport = imports.findByIdAndUserId(importId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email import not found."));
        if (emailImport.getAnalysisDocumentId() != null) {
            documents.deleteByIdAndUserId(emailImport.getAnalysisDocumentId(), userId);
        }
        recordAudit(userId, emailImport.getProvider(), "IMPORT_DELETED");
        imports.delete(emailImport);
    }

    public Map<String, Object> disconnect(Long userId, String providerName) {
        String provider = normalizeProvider(providerName);
        Optional<EmailConnection> connection = connections.findByUserIdAndProvider(userId, provider);
        boolean providerConsentRevoked = revokeProviderConsent(connection.orElse(null), provider);
        recordAudit(userId, provider, "DISCONNECTED");
        connections.deleteByUserIdAndProvider(userId, provider);
        if (connection.isPresent() && !providerConsentRevoked) {
            recordAudit(userId, provider, "PROVIDER_REVOKE_UNCONFIRMED");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("provider", provider);
        result.put("disconnected", true);
        result.put("providerConsentRevoked", providerConsentRevoked);
        return result;
    }

    public List<Map<String, Object>> disconnectAll(Long userId) {
        List<Map<String, Object>> results = new ArrayList<>();
        for (EmailConnection connection : connections.findByUserIdOrderByProvider(userId)) {
            results.add(disconnect(userId, connection.getProvider()));
        }
        return results;
    }

    private boolean revokeProviderConsent(EmailConnection connection, String provider) {
        if (connection == null) return true;
        if (!provider.equals("GMAIL")) return false;
        String token = tokenCrypto.decrypt(connection.getRefreshTokenEncrypted());
        if (token == null) token = tokenCrypto.decrypt(connection.getAccessTokenEncrypted());
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("token", token);
        try {
            restClient.post().uri("https://oauth2.googleapis.com/revoke")
                    .body(form).retrieve().toBodilessEntity();
            return true;
        } catch (RestClientResponseException | org.springframework.web.client.ResourceAccessException exception) {
            return false;
        }
    }

    private void recordAudit(Long userId, String provider, String action) {
        auditEvents.save(new EmailAccessAudit(userId, provider, action));
    }

    private List<Map<String, Object>> searchGmail(
            EmailConnection connection, String token, String query, LocalDate after, LocalDate before
    ) {
        String search = query == null || query.isBlank() ? DEFAULT_SEARCH : query.trim();
        if (after != null) search += " after:" + after.format(java.time.format.DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        if (before != null) search += " before:" + before.plusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        java.net.URI uri = UriComponentsBuilder.fromUriString("https://gmail.googleapis.com/gmail/v1/users/me/messages")
                .queryParam("q", search).queryParam("maxResults", 25).build().encode().toUri();
        Map<String, Object> result = getJson(uri, token, false);
        List<Map<String, Object>> messageRefs = objectList(result.get("messages"));
        List<Map<String, Object>> messages = new ArrayList<>();
        for (Map<String, Object> reference : messageRefs) {
            String id = stringValue(reference.get("id"));
            if (id == null) continue;
            Map<String, Object> message = getJson(gmailMessageUri(id), token, false);
            Map<String, Object> payload = objectMap(message.get("payload"));
            Map<String, String> headers = gmailHeaders(payload);
            List<Map<String, Object>> attachments = extractGmailAttachmentMetadata(payload);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", id);
            item.put("sender", headers.getOrDefault("from", "Sender unavailable"));
            item.put("subject", headers.getOrDefault("subject", "(no subject)"));
            item.put("receivedAt", headers.getOrDefault("date", null));
            item.put("attachments", attachments);
            messages.add(item);
        }
        return messages;
    }

    private List<Map<String, Object>> searchMicrosoft(
            EmailConnection connection, String token, String query, LocalDate after, LocalDate before
    ) {
        String searchTerms = query == null || query.isBlank() ? DEFAULT_SEARCH : query.trim();
        String search = "\"" + searchTerms.replace("\"", "\\\"") + "\"";
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString("https://graph.microsoft.com/v1.0/me/messages")
                .queryParam("$select", "id,subject,from,receivedDateTime,hasAttachments")
                .queryParam("$top", 25)
                .queryParam("$search", search);
        String filter = dateFilter(after, before);
        if (filter != null) builder.queryParam("$filter", filter);
        Map<String, Object> result = getJson(builder.build().encode().toUri(), token, true);
        List<Map<String, Object>> refs = objectList(result.get("value"));
        List<Map<String, Object>> messages = new ArrayList<>();
        for (Map<String, Object> reference : refs) {
            String id = stringValue(reference.get("id"));
            if (id == null) continue;
            Map<String, Object> sender = objectMap(reference.get("from"));
            Map<String, Object> mailbox = objectMap(sender.get("emailAddress"));
            List<Map<String, Object>> attachments = Boolean.TRUE.equals(reference.get("hasAttachments"))
                    ? microsoftAttachments(token, id)
                    : List.of();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", id);
            item.put("sender", stringValue(mailbox.get("address")));
            item.put("subject", stringValue(reference.get("subject")));
            item.put("receivedAt", stringValue(reference.get("receivedDateTime")));
            item.put("attachments", attachments);
            messages.add(item);
        }
        return messages;
    }

    private List<Map<String, Object>> gmailAttachments(String token, String messageId) {
        Map<String, Object> message = getJson(gmailMessageUri(messageId), token, false);
        return extractGmailAttachmentMetadata(objectMap(message.get("payload")));
    }

    private List<Map<String, Object>> microsoftAttachments(String token, String messageId) {
        URI uri = UriComponentsBuilder.fromUriString("https://graph.microsoft.com/v1.0/me/messages")
                .pathSegment(messageId, "attachments")
                .queryParam("$select", "id,name,contentType,size,isInline")
                .queryParam("$top", 50).build().encode().toUri();
        Map<String, Object> response = getJson(uri, token, true);
        return objectList(response.get("value")).stream()
                .filter(item -> !Boolean.TRUE.equals(item.get("isInline")))
                .map(item -> attachmentMetadata(stringValue(item.get("id")), item.get("name"),
                        item.get("contentType"), item.get("size")))
                .filter(item -> item.get("id") != null)
                .toList();
    }

    private Map<String, Object> downloadGmailAttachment(String token, String messageId, String attachmentId) {
        URI uri = UriComponentsBuilder.fromUriString("https://gmail.googleapis.com/gmail/v1/users/me/messages")
                .pathSegment(messageId, "attachments", attachmentId).build().encode().toUri();
        Map<String, Object> response = getJson(uri, token, false);
        Map<String, Object> found = findGmailAttachment(objectMap(getJson(gmailMessageUri(messageId), token, false).get("payload")), attachmentId);
        if (found == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "The selected attachment was not found.");
        Map<String, Object> result = new LinkedHashMap<>(found);
        result.put("contentBytes", stringValue(response.get("data")));
        result.put("size", response.getOrDefault("size", result.get("size")));
        return result;
    }

    private Map<String, Object> downloadMicrosoftAttachment(String token, String messageId, String attachmentId) {
        URI uri = UriComponentsBuilder.fromUriString("https://graph.microsoft.com/v1.0/me/messages")
                .pathSegment(messageId, "attachments", attachmentId).build().encode().toUri();
        Map<String, Object> response = getJson(uri, token, true);
        if (!"#Microsoft.Graph.fileAttachment".equals(stringValue(response.get("@odata.type")))) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only file attachments can be imported.");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("name", response.get("name"));
        result.put("contentType", response.get("contentType"));
        result.put("size", response.get("size"));
        result.put("contentBytes", response.get("contentBytes"));
        return result;
    }

    private Map<String, Object> exchangeAuthorizationCode(String provider, String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId(provider));
        form.add("client_secret", clientSecret(provider));
        form.add("code", code);
        form.add("redirect_uri", callbackUrl(provider));
        form.add("grant_type", "authorization_code");
        if (provider.equals("MICROSOFT")) {
            form.add("scope", "offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read");
        }
        String endpoint = provider.equals("GMAIL")
                ? "https://oauth2.googleapis.com/token"
                : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
        return restClient.post().uri(endpoint).body(form).retrieve().body(JSON_MAP);
    }

    private String getMailboxAddress(String provider, String accessToken) {
        Map<String, Object> mailbox = provider.equals("GMAIL")
                ? getJson(java.net.URI.create("https://gmail.googleapis.com/gmail/v1/users/me/profile"), accessToken, false)
                : getJson(UriComponentsBuilder.fromUriString("https://graph.microsoft.com/v1.0/me")
                .queryParam("$select", "mail,userPrincipalName").build().encode().toUri(), accessToken, true);
        if (provider.equals("GMAIL")) return stringValue(mailbox.get("emailAddress"));
        String email = stringValue(mailbox.get("mail"));
        return email == null ? stringValue(mailbox.get("userPrincipalName")) : email;
    }

    private String accessToken(EmailConnection connection) {
        if (connection.getTokenExpiresAt() == null || connection.getTokenExpiresAt().isAfter(Instant.now().plusSeconds(120))) {
            return tokenCrypto.decrypt(connection.getAccessTokenEncrypted());
        }
        String refreshToken = tokenCrypto.decrypt(connection.getRefreshTokenEncrypted());
        if (refreshToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email access expired. Disconnect and reconnect the mailbox.");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId(connection.getProvider()));
        form.add("client_secret", clientSecret(connection.getProvider()));
        form.add("refresh_token", refreshToken);
        form.add("grant_type", "refresh_token");
        if ("MICROSOFT".equals(connection.getProvider())) {
            form.add("scope", "offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read");
        }
        String endpoint = "GMAIL".equals(connection.getProvider())
                ? "https://oauth2.googleapis.com/token"
                : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
        try {
            Map<String, Object> response = restClient.post().uri(endpoint).body(form).retrieve().body(JSON_MAP);
            String newAccessToken = stringValue(response.get("access_token"));
            if (newAccessToken == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Email provider did not return a refreshed access token.");
            }
            String newRefreshToken = stringValue(response.get("refresh_token"));
            Instant expiresAt = Instant.now().plusSeconds(numberValue(response.get("expires_in"), 3600));
            connection.updateTokens(tokenCrypto.encrypt(newAccessToken),
                    newRefreshToken == null ? null : tokenCrypto.encrypt(newRefreshToken), expiresAt);
            connections.save(connection);
            return newAccessToken;
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email access expired. Disconnect and reconnect the mailbox.");
        }
    }

    private Map<String, Object> getJson(URI uri, String accessToken, boolean microsoft) {
        return restClient.get().uri(uri)
                .headers(headers -> {
                    headers.setBearerAuth(accessToken);
                    if (microsoft) headers.set("ConsistencyLevel", "eventual");
                })
                .retrieve().body(JSON_MAP);
    }

    private URI gmailMessageUri(String messageId) {
        return UriComponentsBuilder.fromUriString("https://gmail.googleapis.com/gmail/v1/users/me/messages")
                .pathSegment(messageId)
                .queryParam("format", "full")
                .queryParam("fields", GMAIL_MESSAGE_FIELDS).build().encode().toUri();
    }

    private String normalizeProvider(String provider) {
        if (provider == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email provider is required.");
        return switch (provider.toLowerCase(Locale.ROOT)) {
            case "gmail", "google" -> "GMAIL";
            case "microsoft", "outlook", "microsoft365", "microsoft-365" -> "MICROSOFT";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supported providers are Gmail and Microsoft 365.");
        };
    }

    private boolean providerConfigured(String provider) {
        return !clientId(provider).isBlank() && !clientSecret(provider).isBlank()
                && !publicBackendUrl.isBlank() && tokenCrypto.isConfigured();
    }

    private void requireConfigured(String provider) {
        if (!providerConfigured(provider)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, setupMessage(provider));
        }
        tokenCrypto.encrypt("configuration-check");
    }

    private String setupMessage(String provider) {
        String label = provider.equals("GMAIL") ? "Gmail" : "Microsoft 365";
        return label + " OAuth needs server-side client ID, client secret, public callback URL, and a 32-byte email token encryption key.";
    }

    private String clientId(String provider) {
        return provider.equals("GMAIL") ? gmailClientId : microsoftClientId;
    }

    private String clientSecret(String provider) {
        return provider.equals("GMAIL") ? gmailClientSecret : microsoftClientSecret;
    }

    private String callbackUrl(String provider) {
        return publicBackendUrl + "/api/email/callback/" + provider.toLowerCase(Locale.ROOT);
    }

    private EmailConnection requireConnection(Long userId, String provider) {
        return connections.findByUserIdAndProvider(userId, provider)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Connect this email provider before searching or importing."));
    }

    private ResponseStatusException providerFailure(RestClientResponseException exception) {
        if (exception.getStatusCode().value() == 401) {
            return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email provider authorization expired. Reconnect the mailbox.");
        }
        if (exception.getStatusCode().value() == 404) {
            return new ResponseStatusException(HttpStatus.NOT_FOUND, "The selected message or attachment was not found.");
        }
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The email provider request failed. Try again or reconnect the mailbox.");
    }

    private List<Map<String, Object>> extractGmailAttachmentMetadata(Map<String, Object> payload) {
        List<Map<String, Object>> attachments = new ArrayList<>();
        collectGmailAttachments(payload, attachments);
        return attachments;
    }

    private void collectGmailAttachments(Map<String, Object> part, List<Map<String, Object>> attachments) {
        String fileName = stringValue(part.get("filename"));
        Map<String, Object> body = objectMap(part.get("body"));
        String attachmentId = stringValue(body.get("attachmentId"));
        if (fileName != null && !fileName.isBlank() && attachmentId != null) {
            attachments.add(attachmentMetadata(attachmentId, fileName, part.get("mimeType"), body.get("size")));
        }
        for (Map<String, Object> child : objectList(part.get("parts"))) collectGmailAttachments(child, attachments);
    }

    private Map<String, Object> findGmailAttachment(Map<String, Object> part, String attachmentId) {
        Map<String, Object> body = objectMap(part.get("body"));
        if (attachmentId.equals(stringValue(body.get("attachmentId")))) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("name", part.get("filename"));
            result.put("contentType", part.get("mimeType"));
            result.put("size", body.get("size"));
            return result;
        }
        for (Map<String, Object> child : objectList(part.get("parts"))) {
            Map<String, Object> match = findGmailAttachment(child, attachmentId);
            if (match != null) return match;
        }
        return null;
    }

    private Map<String, String> gmailHeaders(Map<String, Object> payload) {
        Map<String, String> result = new LinkedHashMap<>();
        for (Map<String, Object> header : objectList(payload.get("headers"))) {
            String name = stringValue(header.get("name"));
            String value = stringValue(header.get("value"));
            if (name != null && value != null) result.put(name.toLowerCase(Locale.ROOT), value);
        }
        return result;
    }

    private Map<String, Object> attachmentMetadata(String id, Object name, Object contentType, Object size) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("id", id);
        metadata.put("name", safeFileName(stringValue(name)));
        metadata.put("contentType", stringValue(contentType));
        metadata.put("size", numberValue(size, 0));
        String extension = extension(stringValue(name));
        metadata.put("supported", ALLOWED_EXTENSIONS.contains(extension));
        metadata.put("detectedDocumentType", switch (extension) {
            case "csv" -> "CSV";
            case "tsv" -> "TSV";
            case "txt" -> "Delimited text";
            default -> "Unsupported";
        });
        return metadata;
    }

    private void validateAttachment(String fileName, Object contentType, Object size) {
        String extension = extension(fileName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only CSV, TSV, and delimited TXT email attachments can be analyzed in this build.");
        }
        if (numberValue(size, 0) > MAX_ATTACHMENT_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Email attachments are limited to 10 MB.");
        }
        String mime = stringValue(contentType);
        if (mime != null && !(mime.startsWith("text/") || mime.equalsIgnoreCase("application/vnd.ms-excel")
                || mime.equalsIgnoreCase("application/octet-stream"))) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "The selected attachment content type is not a supported text document.");
        }
    }

    private byte[] decodeAttachment(String base64) {
        if (base64 == null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Email provider did not return the selected attachment data.");
        try {
            byte[] bytes;
            try {
                bytes = Base64.getDecoder().decode(base64);
            } catch (IllegalArgumentException standardBase64Failure) {
                bytes = Base64.getUrlDecoder().decode(base64);
            }
            validateAttachmentBytes(bytes);
            return bytes;
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The selected email attachment could not be decoded.");
        }
    }

    private void validateAttachmentBytes(byte[] bytes) {
        if (bytes.length == 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected email attachment is empty.");
        if (bytes.length > MAX_ATTACHMENT_BYTES) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Email attachments are limited to 10 MB.");
        for (byte value : bytes) {
            if (value == 0) throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "The selected attachment is not a plain-text tabular document.");
        }
        String content = new String(bytes, StandardCharsets.UTF_8);
        if (content.indexOf('\uFFFD') >= 0) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "The selected attachment is not valid UTF-8 text.");
        }
    }

    private String safeFileName(String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "The selected email attachment has no file name.");
        }
        String safeName = name.replaceAll("[\\\\/\\p{Cntrl}]", "_").trim();
        if (safeName.length() > 255) safeName = safeName.substring(safeName.length() - 255);
        return safeName;
    }

    private String extension(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        return dot < 0 ? "" : fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private void validateSearch(String query) {
        if (query != null && (query.length() > 200 || query.chars().anyMatch(Character::isISOControl))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email search terms must be 200 characters or fewer and contain no control characters.");
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email date filters must use YYYY-MM-DD.");
        }
    }

    private String dateFilter(LocalDate after, LocalDate before) {
        List<String> clauses = new ArrayList<>();
        if (after != null) clauses.add("receivedDateTime ge " + after.atStartOfDay().toInstant(ZoneOffset.UTC));
        if (before != null) clauses.add("receivedDateTime lt " + before.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC));
        return clauses.isEmpty() ? null : String.join(" and ", clauses);
    }

    private void validateIdentifier(String value, String kind) {
        if (value == null || value.isBlank() || value.length() > 512 || value.chars().anyMatch(Character::isISOControl)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email " + kind + " identifier is invalid.");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> objectMap(Object value) {
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    private List<Map<String, Object>> objectList(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                Map<String, Object> typed = new LinkedHashMap<>();
                map.forEach((key, val) -> {
                    if (key instanceof String stringKey) typed.put(stringKey, val);
                });
                result.add(typed);
            }
        }
        return result;
    }

    private String stringValue(Object value) {
        return value instanceof String text && !text.isBlank() ? text : null;
    }

    private long numberValue(Object value, long fallback) {
        return value instanceof Number number ? number.longValue() : fallback;
    }

    private String sha256(String value) {
        return sha256(value.getBytes(StandardCharsets.UTF_8));
    }

    private String sha256(byte[] value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }
}
