# PADIFIX PHASE 011.2 — SENTRY, CLOUDFLARE & GOOGLE MAPS INFRASTRUCTURE SPECIFICATION & AUDIT

**Document Version**: 1.0.0  
**Phase**: 011.2  
**Date**: September 4, 2026  
**Environment**: Local Workspace (`c:/All workspace/PadiFix project/lokator`) & Vercel Production (`https://padifix.vercel.app`)  
**Classification**: Infrastructure Architecture, Security Classification & Observability Audit  
**Status**: **GREEN — INFRASTRUCTURE CONFIGURATION CERTIFIED (100% REGRESSION PASS)**

---

## 1. EXECUTIVE SUMMARY & VERIFICATION MATRIX

Phase 011.2 establishes the secure environment-variable architecture, client/server secret boundaries, privacy sanitization, and integration foundations for **Sentry error/performance monitoring**, **Cloudflare edge/DNS/WAF management**, and **Google Maps Platform** location services.

| Infrastructure Dimension | Configuration Status | Runtime Boundary | Security Audit | Test Verdict |
| :--- | :---: | :---: | :---: | :---: |
| **ENVIRONMENT ARCHITECTURE** | **PRESENT** | Modular 7-section structure | Safe placeholders in `.env.example` | ✅ PASS |
| **SENTRY CLIENT (BROWSER)** | **PRESENT** | Public DSN / Client-safe | Deep PII / credential redaction | ✅ PASS |
| **SENTRY SERVER (API)** | **PRESENT** | Server-Only (`withSentry`) | Redacts headers, cookies & tokens | ✅ PASS |
| **CLOUDFLARE API INTEGRATION** | **PRESENT** | Server-Only (`CLOUDFLARE_API_TOKEN`)| Token-scoped / Browser forbidden | ✅ PASS |
| **GOOGLE MAPS PLATFORM** | **PRESENT** | Public DSN / Client-safe | HTTP Referrer & API Restricted | ✅ PASS |
| **SECURITY & SECRETS SCAN** | **VERIFIED** | Zero secrets in Git / Bundles | `.env` untracked; 0 `AIza` keys | ✅ PASS |
| **FULL REGRESSION MATRIX** | **VERIFIED** | 12/12 Suites Passed | 477+ automated assertions | ✅ 100% PASS |
| **PLAYWRIGHT BROWSER QA** | **VERIFIED** | 6 Viewports (320px to 1920px) | 0px overflow, 0 console errors | ✅ 100% PASS |

---

## 2. ENVIRONMENT VARIABLE ARCHITECTURE & CLASSIFICATION

The environment architecture in [`.env`](file:///c:/All%20workspace/PadiFix%20project/lokator/.env) and [`.env.example`](file:///c:/All%20workspace/PadiFix%20project/lokator/.env.example) has been structured into 7 standardized components. Every variable is classified according to its execution boundary:

| Variable Name | Section | Execution Scope | Client-Safe? | Purpose & Protection Mechanism |
| :--- | :--- | :---: | :---: | :--- |
| `APP_URL` | Application | Public | **YES** | Canonical base URL (`https://padifix.vercel.app`) |
| `SUPABASE_URL` | Supabase | Public | **YES** | Supabase project API gateway |
| `SUPABASE_ANON_KEY` | Supabase | Public | **YES** | Public API key protected by PostgreSQL Row Level Security |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase | Public | **YES** | Modern Supabase publishable key format |
| `SUPABASE_SERVICE_ROLE_KEY`| Supabase | **Server-Only** | **NO** | Administrative access; bypasses RLS. Strictly barred from browser. |
| `PAYSTACK_PUBLIC_KEY` | Paystack | Public | **YES** | Used for client-side popup checkout initialization |
| `PAYSTACK_SECRET_KEY` | Paystack | **Server-Only** | **NO** | Signs transaction initialization and verifies webhooks (HMAC-SHA512) |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack | **Server-Only** | **NO** | Legacy/redundant alias (Paystack verifies using Secret Key) |
| `PAYMENT_LIVE_MODE` | Paystack | Server/Public | **YES** | Boolean toggle (`true`/`false`) controlling test vs live charges |
| `RESEND_API_KEY` | Resend | **Server-Only** | **NO** | Authorizes outbound transactional email API requests |
| `RESEND_FROM_EMAIL` | Resend | Public | **YES** | Sender display string (e.g. `PadiFix <notifications@padifix.ng>`) |
| `SENTRY_DSN` | Sentry | Public | **YES** | Public event ingestion endpoint; safe for browser & serverless |
| `SENTRY_AUTH_TOKEN` | Sentry | **Server-Only** | **NO** | Sentry CLI release tracking & source-map upload token |
| `SENTRY_ORG` | Sentry | **Server-Only** | **NO** | Organization slug for Sentry build tooling |
| `SENTRY_PROJECT` | Sentry | **Server-Only** | **NO** | Project slug for Sentry build tooling |
| `SENTRY_ENVIRONMENT` | Sentry | Public | **YES** | Runtime environment tag (`development`, `preview`, `production`) |
| `SENTRY_TRACES_SAMPLE_RATE`| Sentry | Public | **YES** | Float (0.0 to 1.0) controlling performance tracing volume |
| `SENTRY_REPLAYS_SESSION_SAMPLE_RATE`| Sentry | Public | **YES** | Session replay sampling rate (default `0.0`) |
| `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE`| Sentry | Public | **YES** | Replay-on-error capture sampling rate (default `1.0`) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare | **Server-Only** | **NO** | Cloudflare account identifier |
| `CLOUDFLARE_ZONE_ID` | Cloudflare | **Server-Only** | **NO** | Cloudflare zone identifier for `padifix.ng` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare | **Server-Only** | **NO** | Scoped REST API token (Zone:Read, DNS:Edit, Cache:Purge) |
| `GOOGLE_MAPS_API_KEY` | Google Maps | Public (Restricted) | **YES** | Browser API key; MUST be restricted by HTTP referrer & enabled APIs |
| `GOOGLE_MAPS_MAP_ID` | Google Maps | Public | **YES** | Optional Google Cloud vector map styling ID |

---

## 3. SENTRY OBSERVABILITY ARCHITECTURE & PRIVACY MODEL

### 3.1 PadiFix Architecture Compatibility
PadiFix utilizes a **Vanilla JS / HTML / CSS** static frontend hosted on Vercel with serverless Node.js functions in `/api/*`. It does not use Next.js or a bundler. Consequently, Sentry is implemented as two complementary, non-blocking modules:
1. **Client-Side Browser Module**: [`lib/sentry-client.js`](file:///c:/All%20workspace/PadiFix%20project/lokator/lib/sentry-client.js)
2. **Server-Side Serverless Module**: [`lib/sentry-server.js`](file:///c:/All%20workspace/PadiFix%20project/lokator/lib/sentry-server.js)

### 3.2 Privacy & PII Sanitization (Nigerian NDPR & SAIF Compliance)
Before any event or exception is recorded or transmitted, all payloads are processed through recursive data sanitizers that redact sensitive keys to `[REDACTED]`:
* **Credential Blocklist**: `password`, `pwd`, `token`, `access_token`, `refresh_token`, `jwt`, `secret`, `service_role`, `api_key`, `auth`, `authorization`.
* **Nigerian Identity Blocklist**: `nin`, `vnin`, `bvn`, `identity_document`, `document_number`.
* **Payment Credentials**: `card`, `cvv`, `pan`, `account_number`, `pin`, `paystack_secret_key`.
* **HTTP Headers Redacted**: `authorization`, `cookie`, `set-cookie`, `x-paystack-signature`.

### 3.3 Environment Awareness & Dormancy
* If `SENTRY_DSN` is empty or unconfigured, both client and server modules operate in **graceful dormant mode**—they do not throw, log errors, or emit network requests.
* The environment tag dynamically resolves from `process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || 'development'`.
* In browser code, the host header automatically classifies `padifix.vercel.app` or `padifix.ng` as `production`, and `*.vercel.app` preview branches as `preview`.

### 3.4 Serverless Error Trapping (`withSentry`)
Serverless handlers can be wrapped with `withSentry(handler, routeName)`:
* Uncaught exceptions are intercepted and logged with an anonymous `incident_id`.
* The client receives a clean `HTTP 500: Internal Server Error` without exposing internal stack traces, file paths, or database error messages.

### 3.5 Source Maps Strategy
PadiFix's production assets are lightweight, unminified or browser-bundled Vanilla JavaScript files. Because no heavy webpack/rollup minification is applied, stack traces point directly to meaningful source line numbers in `app.js`, `map-service.js`, and `telemetry.js`. Source-map uploading via Sentry CLI (`SENTRY_AUTH_TOKEN`) is therefore deferred until a build minification pipeline is introduced, preventing unnecessary exposure of build secrets.

---

## 4. CLOUDFLARE EDGE & API INTEGRATION FOUNDATION

### 4.1 Role of Cloudflare in PadiFix
Cloudflare serves three primary architectural functions:
1. **Authoritative DNS**: Managing records for the custom domain `padifix.ng` (A, CNAME, TXT for Resend DKIM/SPF).
2. **Edge Security & WAF**: Mitigating DDoS attacks and bot scraping against artisan phone/WhatsApp contacts.
3. **Cache Purge & Edge Invalidation**: Purging static asset caches upon new production deployments.

### 4.2 Security & Authentication Standards
* **API Token Enforced**: Cloudflare explicitly recommends API Tokens over Global API Keys. PadiFix enforces `CLOUDFLARE_API_TOKEN` and marks legacy `CLOUDFLARE_API_EMAIL`/`CLOUDFLARE_API_KEY` as deprecated.
* **Server-Only Guard**: [`lib/cloudflare-client.js`](file:///c:/All%20workspace/PadiFix%20project/lokator/lib/cloudflare-client.js) throws a security violation if imported in a browser environment.
* **Non-Destructive Guarantee**: Cloudflare configuration is additive. No DNS records or global bot challenges are enabled automatically without explicit operational review.

---

## 5. GOOGLE MAPS PLATFORM CONFIGURATION & AUDIT

### 5.1 Required Google Maps APIs & Justification
PadiFix connects customers with local artisans across Nigerian LGAs. The required Google Cloud APIs are:

| Google Maps API | Role in PadiFix | Necessity |
| :--- | :--- | :---: |
| **Maps JavaScript API** | Interactive map rendering on search & profile pages; custom artisan map markers; Nigerian cluster pins. | **Required** |
| **Places API (New)** | Real-time address autocomplete in search bars (e.g. typing "Ikeja", "Surulere", "Wuse 2", "Garki", "Port Harcourt"). | **Required** |
| **Geocoding API** | Forward/reverse geocoding converting artisan workshop addresses and LGA names to precise lat/lng coordinates. | **Required** |
| **Routes API / Distance Matrix** | Real-time driving distance calculations. Currently deferred; PadiFix uses zero-cost Haversine formula in `calculateDistanceKm`. | *Deferred* |
| **Maps Embed API** | Static iframe embedding. Not required since interactive Maps JS API is utilized. | *Not Needed* |

### 5.2 Key Restriction Strategy
> [!WARNING]
> **UNRESTRICTED GOOGLE MAPS KEYS ARE FORBIDDEN IN PRODUCTION**
> Because `GOOGLE_MAPS_API_KEY` is delivered to browser clients, it MUST be locked down in Google Cloud Console:
> 
> 1. **Application Restrictions (HTTP Referrers)**:
>    - `https://padifix.vercel.app/*`
>    - `https://*.vercel.app/*` (for Vercel preview environments)
>    - `http://localhost:*/*` (local development)
>    - `http://127.0.0.1:*/*` (local testing)
>    - `https://padifix.ng/*` and `https://*.padifix.ng/*` (when custom domain is activated)
> 2. **API Restrictions**:
>    - Restrict key exclusively to:
>      - *Maps JavaScript API*
>      - *Places API (New)*
>      - *Geocoding API*

### 5.3 Dual-Engine Rendering & Seamless Fallback
[`map-service.js`](file:///c:/All%20workspace/PadiFix%20project/lokator/map-service.js) implements dual-engine map rendering:
- If `GOOGLE_MAPS_API_KEY` is present and valid, it asynchronously loads Google Maps JS API with optional vector styling (`GOOGLE_MAPS_MAP_ID`).
- If `GOOGLE_MAPS_API_KEY` is absent, invalid, or blocked by an ad-blocker, the UI **seamlessly and gracefully falls back to interactive Leaflet / OpenStreetMap**. The search page and provider profiles never crash or display broken map frames.

---

## 6. GIT SECURITY & SECRETS AUDIT

The automated security audit script [`scripts/security_secrets_audit.js`](file:///c:/All%20workspace/PadiFix%20project/lokator/scripts/security_secrets_audit.js) performed deep repository checks:
* `.env` is declared in `.gitignore` and is untracked by Git (`git ls-files` returns 0 entries).
* Scanned all tracked files against active secrets (`PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_AUTH_TOKEN`, `CLOUDFLARE_API_TOKEN`). **0 leaks found.**
* Scanned all client frontend files for Google API key patterns (`AIza...`). **0 hard-coded keys found.**
* Client bundles contain zero references to server-only credential variable names.

---

## 7. AUTOMATED VERIFICATION SUITES & REGRESSION AUDIT

### 7.1 Phase 011.2 Infrastructure Test Suite
**Command**: `node scripts/verify_phase_011_2_infrastructure.js`  
**Result**: **21 / 21 PASS (100% GREEN)**

- Standardized 7-component environment architecture verified in `.env` and `.env.example`.
- Server-only variables strictly isolated from client-side bundles.
- Deep PII and secret sanitization confirmed across `lib/sentry-client.js` and `lib/sentry-server.js`.
- Sentry dormant mode verified (zero errors or console noise when DSN is empty).
- Sentry serverless `withSentry` error boundary verified (returns clean HTTP 500 with correlation ID).
- Cloudflare server-only guard confirmed (throws in browser).
- Google Maps key detection (`GOOGLE_MAPS_API_KEY`), Map ID support (`GOOGLE_MAPS_MAP_ID`), and Leaflet fallback verified.
- Zero hard-coded `AIza...` keys detected.

### 7.2 Full Historical Regression Suite (Phases 002 — 011.2)
**Command**: `node scripts/run_all_regressions.js`  
**Result**: **12 / 12 SUITES PASS (100% GREEN)**

```text
================================================================================
🚀 PADIFIX FULL REGRESSION MATRIX (PHASES 002 — 011.2)
================================================================================
⏳ Running Phase 002 (verify_phase_002_functional_integrity.js)... ✅ PASS (86.90s)
⏳ Running Phase 003 (verify_phase_003_experience_audit.js)... ✅ PASS (54.41s)
⏳ Running Phase 004 (verify_phase_004_monetization_architecture.js)... ✅ PASS (0.44s)
⏳ Running Phase 005 (verify_phase_005_provider_growth.js)... ✅ PASS (0.28s)
⏳ Running Phase 006 (verify_phase_006_provider_verification.js)... ✅ PASS (0.24s)
⏳ Running Phase 007 (verify_phase_007_provider_verification_gateway.js)... ✅ PASS (0.34s)
⏳ Running Phase 008 (verify_phase_008_real_kyc_compliance.js)... ✅ PASS (0.32s)
⏳ Running Phase 009 (verify_phase_009_kyc_vendor_activation.js)... ✅ PASS (0.30s)
⏳ Running Phase 010 (verify_phase_010_provider_monetization.js)... ✅ PASS (0.39s)
⏳ Running Phase 011 (verify_phase_011_provider_subscriptions.js)... ✅ PASS (0.37s)
⏳ Running Phase 011.1 Real Integration (verify_phase_011_1_real_integration.js)... ✅ PASS (5.75s)
⏳ Running Phase 011.2 Infrastructure (verify_phase_011_2_infrastructure.js)... ✅ PASS (1.09s)

================================================================================
REGRESSION SUMMARY: 12/12 suites passed (0 failures)
================================================================================
🎉 VERDICT: GREEN — 100% REGRESSION INTEGRITY CERTIFIED ACROSS ALL PHASES
```

### 7.3 Playwright Multi-Viewport Browser QA Suite
**Command**: `node scripts/verify_phase_011_browser_qa.js`  
**Result**: **32 / 32 PASS (100% GREEN)**

- 6 canonical viewports verified: `320x844`, `390x844`, `412x915`, `1280x720`, `1440x900`, `1920x1080`.
- **0px horizontal overflow** across all viewports.
- **0 uncaught JavaScript console errors**.

---

## 8. REMAINING SETUP REQUIRED FROM USER

To activate Sentry, Cloudflare, and Google Maps live monitoring:

1. **Sentry Activation**:
   - Create a project on [sentry.io](https://sentry.io).
   - Add your DSN to `.env` as `SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>`.
   - Add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` if CI release tracking is desired.
2. **Cloudflare Activation**:
   - Create a scoped API Token on [dash.cloudflare.com](https://dash.cloudflare.com) with permissions: `Zone:Read`, `DNS:Edit`, `Cache Purge:Purge`.
   - Populate `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, and `CLOUDFLARE_ACCOUNT_ID` in `.env`.
3. **Google Maps Platform Activation**:
   - Enable Maps JavaScript API, Places API, and Geocoding API on [console.cloud.google.com](https://console.cloud.google.com).
   - Generate a key, apply HTTP referrer restrictions (`https://padifix.vercel.app/*`), and add it to `.env` as `GOOGLE_MAPS_API_KEY`.
4. **Vercel Production Deployment**:
   - Replicate the above variables into Vercel Project Settings (`Settings -> Environment Variables`) for the `Production` and `Preview` environments.
