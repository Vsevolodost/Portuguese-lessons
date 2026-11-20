# Server authentication

The browser uses an opaque HttpOnly, Secure, SameSite=Lax cookie. Supabase access and refresh tokens are AES-256-GCM encrypted in the server-only `bora_web_sessions` table. Browser requests use a session-bound CSRF header; login and Google start also require the configured exact Origin. JWT validation checks ES256/RS256 signatures, issuer, audience, expiry, authenticated role and the live Supabase session.

Production configuration in Vercel (never commit values):

- `SUPABASE_SECRET_KEY`: server key for the dedicated Bora Supabase project.
- `BORA_SESSION_KEY`: 32 random bytes encoded as base64. Changing it signs out existing web sessions.
- `BORA_AUTH_MODE=server`.
- `BORA_SITE_URL=https://portuguese-lessons.vercel.app`.
- `BORA_GOOGLE_AUTH_READY=true` only after enabling the provider and its redirect URL.
- `BORA_EMAIL_AUTH_READY=true` after testing SMTP delivery. Gmail SMTP is configured in Supabase; its app password stays only in Supabase. Confirmation and recovery templates must include `{{ .Token }}` for code entry.

Apply `supabase/migrations/202611190001_secure_sessions.sql` once. It adds server-only session/rate-limit/client registry tables and restrictive policies; it does not rewrite learner progress. The additional active-session policy makes revoked JWTs unable to read progress directly through the Supabase Data API.

Google web client configuration:

- Origin: `https://portuguese-lessons.vercel.app`.
- Google redirect: `https://nsvnptuxnmutwvmuczjm.supabase.co/auth/v1/callback`.
- Supabase allowed app redirect: `https://portuguese-lessons.vercel.app/api/auth/google-callback`.
- Scopes: OpenID, email and profile only. Google client secret belongs only in Supabase provider settings.
- Check Google testing/publishing restrictions before inviting learners.

Web sessions expire after seven days, or 24 hours idle. Refresh tokens rotate on the server using a database lease. Logout can revoke this device or all devices. Progress reads/writes still use the student's JWT and owner RLS, never the server key.

## Future native / external clients

`/api/v1/me` and `/api/v1/progress` accept provider JWTs from explicitly registered OAuth clients. Do not use the web password-login endpoint to collect tokens: it deliberately returns no JWT. Native apps must use Supabase Authorization Code + S256 PKCE with registered callback URIs and secure OS storage. The OAuth server and actual client registration are separate setup tasks; no external clients are enabled by default. `bora_oauth_clients` permissions restrict access to progress, tutor and speech. Cross-origin browser integrations are not enabled by default.

## Release checks

Run `npm test`. Check existing password login, Google signup/login, correct learner progress after reload, optimistic revision conflicts, CSRF rejection and logout. Do not test by changing real learners' progress. The ignored `.env.bora-smoke` contains the dedicated test account; do not print its credentials or tokens.

Production server keys must not be copied into unrestricted previews or downloaded into local environment files. New previews use the legacy configuration until a separate test environment is provisioned. Email recovery uses a code and an isolated recovery session. MFA challenge UI is not available in this release.

## Avatars and themes

Apply `supabase/migrations/202611200001_private_avatars.sql` once. Images are kept in the private `bora-avatars` Supabase Storage bucket; `bora_profiles` stores the path and update time. Each authenticated user can access only their own fixed `user_id/avatar.webp` object. The web endpoint derives the owner from the validated session, never from the upload body. External OAuth clients and anonymous requests cannot access avatar endpoints. Images are served through the authenticated API with private/no-store caching, not public URLs.

The browser accepts JPG/PNG/WebP up to 5 MB, crops a square preview and compresses it. The API enforces a 2 MB decoded upload bound, 16 million input pixels, static supported formats, re-encodes to WebP up to 512 pixels and drops metadata. Replacing the same object avoids accumulating old photos.

`dist/theme.js` follows the existing System Lab preference pattern: system color scheme by default, an explicit local `bora-theme-v1` preference, OS changes and cross-tab updates. Theme preference is browser-only; learning progress and avatars remain server-side.
