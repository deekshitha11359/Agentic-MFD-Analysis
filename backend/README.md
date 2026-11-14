# MFD Brokerage Analysis Backend

Spring Boot 3 / Java 21 API with MySQL persistence.

## Local setup

1. Start MySQL and create a database and a dedicated application account:

   ```sql
   CREATE DATABASE mfd_brokerage_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   CREATE USER 'mfd_app'@'localhost' IDENTIFIED BY 'replace-with-a-strong-local-password';
   GRANT ALL PRIVILEGES ON mfd_brokerage_ai.* TO 'mfd_app'@'localhost';
   ```

   Flyway creates the application tables on first startup and upgrades the
   existing hand-written schema by adding account metadata and private report
   storage. It preserves old document metadata; reports that were never stored
   are not presented as analyzed data. Do not run `schema.sql` separately when
   Flyway is managing the database, and do not use the MySQL root account for
   the application.

2. Configure secrets and the database in the same PowerShell terminal used to
   start Spring Boot:

   ```powershell
   $env:DB_HOST = "localhost"
   $env:DB_PORT = "3306"
   $env:DB_NAME = "mfd_brokerage_ai"
   $env:DB_USERNAME = "mfd_app"
   $env:DB_PASSWORD = "your-local-database-password"
   $env:JWT_SECRET_BASE64 = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   $env:CORS_ALLOWED_ORIGINS = "http://localhost:5173"
   mvn spring-boot:run
   ```

   `JWT_SECRET_BASE64` is required and must be a randomly generated secret of at
   least 32 bytes. Do not reuse a development JWT secret in production.

3. In `frontend`, configure the API URL (optional for local development):

   ```text
   VITE_API_BASE_URL=http://localhost:8080
   ```

   Register an account in the UI, then sign in with its ARN and password.

## API

- `POST /api/auth/register` and `POST /api/auth/login` return a bearer token
  and account profile.
- `GET /api/auth/me` returns the signed-in account profile.
- `POST /api/documents` saves an analyzed report for the authenticated account.
- `GET /api/documents`, `/latest`, and `/{id}` list/read only the authenticated
  account's reports. `GET /api/reports/{id}` applies the same ownership check.
- `GET /api/analysis/{id}` and `/api/analysis/{id}/brokerage` return that
  account's saved report/normalized brokerage records.
- `GET /actuator/health` is available for service health checks.

The API derives account ownership from the validated JWT, never from a client
supplied user ID. Document reads use `(document id, authenticated user id)` in
the database query and respond with 404 when a document is absent or belongs to
another account. Passwords are stored as BCrypt hashes. The browser keeps the
short-lived bearer token in session storage.

The current browser parser analyzes delimited CSV/TSV/TXT files. The API stores
the resulting analysis JSON, not the original uploaded file. It does not yet
perform server-side PDF/image/Excel extraction.

## Analysis engine status

The current agent workflow and question answering use deterministic browser-side
rules over the uploaded document's extracted records. This build has no external
LLM provider or external market-data feed configured; it does not send financial
documents to an AI provider. Do not present a model connection or external-data
analysis as active unless a secured backend integration is implemented and
configured.

## Gmail and Microsoft 365 email import

The backend includes Gmail and Microsoft OAuth authorization-code connectors.
Provider buttons remain disabled until that provider's client ID, client secret,
public callback base URL, and the server-side token-encryption key are configured.
Manual upload continues to work without these settings.

Configure the following in the same environment as the backend:

```powershell
$env:APP_EMAIL_PUBLIC_BACKEND_URL = "http://localhost:8080"
$env:APP_EMAIL_FRONTEND_URL = "http://localhost:5173"
$env:APP_EMAIL_ENCRYPTION_KEY_BASE64 = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$env:GMAIL_OAUTH_CLIENT_ID = "your-google-oauth-client-id"
$env:GMAIL_OAUTH_CLIENT_SECRET = "your-google-oauth-client-secret"
$env:MICROSOFT_OAUTH_CLIENT_ID = "your-microsoft-application-client-id"
$env:MICROSOFT_OAUTH_CLIENT_SECRET = "your-microsoft-application-client-secret"
```

Keep these secrets server-side and out of source control, logs, and frontend
configuration. Use a stable, securely managed 32-byte encryption key across
backend restarts and instances; rotating it without re-encrypting stored tokens
will make existing connections unusable.

Register these exact **Web application** redirect URIs in each provider's OAuth
application:

- Google: `http://localhost:8080/api/email/callback/gmail`
- Microsoft: `http://localhost:8080/api/email/callback/microsoft`

For Google, enable the Gmail API and request the read-only
`gmail.readonly` scope. For Microsoft, configure delegated `Mail.Read` and
`User.Read` permissions and allow the authorization-code flow with a client
secret. Use the real HTTPS backend and frontend origins in hosted deployments,
and set `CORS_ALLOWED_ORIGINS` to the exact frontend origin.

OAuth uses a short-lived, one-time state bound to the authenticated account.
Access and refresh tokens are encrypted with AES-GCM in MySQL; mailbox endpoints
are account-scoped. The app searches messages using configurable terms and
optional dates, shows headers and attachment metadata rather than message
bodies, and downloads only an attachment the user explicitly selects.
Selected attachments are limited to 10 MB UTF-8 CSV, TSV, or delimited TXT in
this build. Imports are fingerprinted to detect duplicates, tracked per account,
and analyzed through the same document parser and analysis workflow as manual
uploads. Import deletion also deletes its saved analysis report. Email audit
events store only account, provider, action, and timestamp.

Disconnect removes the local encrypted tokens. It does not revoke provider
consent: remove the app from Google or Microsoft account permissions as well.
Never enter an email password into this app. Do not import documents you did
not select, and treat all attachment contents as untrusted data.

## Capacity and production deployment

The defaults bound database connections to 40 per backend instance and cap the
Tomcat request queue; tune them with `DB_POOL_MAX_SIZE`, `HTTP_MAX_THREADS`,
`HTTP_MAX_CONNECTIONS`, and `HTTP_ACCEPT_COUNT`. When running multiple backend
instances, budget the *sum* of their pool sizes against MySQL's connection
limit and provision MySQL, CPU, memory, and disk I/O accordingly.

These settings reduce connection storms and provide back-pressure; they are not
a capacity guarantee for 1,000 concurrent users. Verify the target deployment
with load tests before promising that level of traffic. Production deployments
must use TLS, a managed/replicated application deployment, encrypted database
storage and backups, strong environment-injected credentials, and a
`CORS_ALLOWED_ORIGINS` allowlist containing only the real frontend origin.
