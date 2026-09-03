# PHASE 012.3 — PADIFIX.NG CUSTOM DOMAIN + DNS MIGRATION REPORT

**Date:** September 3, 2026  
**Execution Phase:** Phase 012.3 — Custom Domain & DNS Migration  
**Active Production Endpoint:** `https://lokator-ng.vercel.app` (HTTP 200 OK — 100% Operational)  
**Target Canonical Domain:** `https://padifix.ng` (Status: Awaiting Registrar Registration & DNS Delegation)  
**Status:** **`SAFEGUARDED — PRODUCTION GREEN & RUNBOOK DELIVERED`**  

---

## 1. Executive Summary

During the Phase 012.3 audit and execution gate:
1. **Pre-Domain Safety Verification**: Git branch `main` verified clean at commit `aa0a1b7` with `origin` correctly pointing to `https://github.com/qanatomy57-arch/padifix.git`.
2. **Authoritative DNS & Registry Audit**:
   - Multiple authoritative DNS queries were executed directly against Google Public DNS (`8.8.8.8`), Cloudflare (`1.1.1.1`), and the NiRA authoritative TLD nameservers (`nsa.nic.net.ng`, `ns3.nic.net.ng`).
   - Both `padifix.ng` and `www.padifix.ng` returned **`Status: 3 (NXDOMAIN)`** from the `.ng` registry.
   - User confirmed that `padifix.ng` has **not yet been registered or purchased at a domain registrar**.
3. **Safety Architecture Compliance**:
   - In accordance with negative constraints, **no premature domain redirects were activated**, preventing any disruption to live users.
   - The primary production service at **`https://lokator-ng.vercel.app`** remains **100% active, healthy, and serving traffic**.
4. **Acquisition & DNS Runbook Delivered**: An exact registrar-to-Vercel onboarding specification has been generated with verified records.
5. **Multi-Viewport Visual QA & Evidence**: All 9 evidence screenshots were captured across desktop (1440x900, 1920x1080), mobile (390x844, 412x915), search directory, provider profile, registration, PWA bottom sheet, and DNS status audit canvas, archived in `scripts/visual_evidence/padifix/phase_012_3/`.

---

## 2. DNS Inspection & Registry State

| Domain Target | Query Type | Authoritative Resolver | Result | Notes |
| :--- | :---: | :--- | :---: | :--- |
| **`padifix.ng`** | `A` | `nsa.nic.net.ng` (NiRA) | **`NXDOMAIN (Status 3)`** | Domain not yet delegated in registry |
| **`www.padifix.ng`** | `CNAME` | `nsa.nic.net.ng` (NiRA) | **`NXDOMAIN (Status 3)`** | Subdomain not delegated |
| **`lokator-ng.vercel.app`** | `A / CNAME` | Vercel Anycast Global Edge | **`200 OK (Active)`** | Primary production deployment serving live |

---

## 3. Step-by-Step Domain Registration & Cutover Runbook

When ready to purchase and attach `padifix.ng`:

### Step 3.1: Domain Purchase at a NiRA-Accredited Registrar
Register `padifix.ng` at any accredited `.ng` registrar (e.g., Whogohost, QServers, DomainKing, Garanntor, Web4Africa).

### Step 3.2: Configure DNS Records at the Registrar
In the registrar's DNS Management portal, configure the following 2 minimum records:

| Record Name | Record Type | Target Value / Destination | TTL | Purpose |
| :--- | :---: | :--- | :---: | :--- |
| **`@`** (or `padifix.ng`) | **`A`** | **`76.76.21.21`** | `60` / `Auto` | Apex routing to Vercel Anycast Edge IP |
| **`www`** | **`CNAME`** | **`cname.vercel-dns.com.`** | `60` / `Auto` | Canonical redirect routing |

> **IMPORTANT**: Do NOT delete or modify MX, SPF, DKIM, or DMARC records if corporate email is attached.

### Step 3.3: Attach Domain in Vercel Dashboard
1. Open the [Vercel Dashboard](https://vercel.com/dashboard) and select project **`padifix`** (formerly `lokator-ng`).
2. Go to **Settings → Domains**.
3. In the input box, enter **`padifix.ng`** and click **Add**.
4. Select the option: **Redirect `www.padifix.ng` to `padifix.ng` (Recommended)**.
5. Vercel will verify the DNS A record and CNAME, and automatically generate a valid Let's Encrypt TLS/SSL certificate.

---

## 4. Live Production Verification (`https://lokator-ng.vercel.app`)

During this phase, the production application was audited against live traffic:

- **Desktop Viewports (1440x900, 1920x1080)**: Verified 0 horizontal overflow; PadiFix logo mark and green wordmark visible; 9-video hero responsive.
- **Mobile Viewports (390x844, 412x915)**: Verified touch scrolling; hamburger navigation drawer; 1% glass card opacity; zero clipping.
- **Search Directory**: Search query for `electrician` returns live verified provider cards with badges, LGA tags, and trade chips.
- **Provider Profile**: Live profile loads artisan details; verified WhatsApp CTA (`#btn-wa-hero`) initiates direct client dispatch.
- **Registration Wizard**: 5-step provider onboarding wizard verified functional.
- **PWA & Cache**: `manifest.json` (`PadiFix`, `#00A859`) and service worker `padifix-v11.00` verified active.

---

## 5. Supabase & Telemetry Privacy Verification

- **Supabase PostgreSQL**: Table structures (`providers`, `reviews`, `portfolio_items`, `working_hours`, `provider_services`, `analytics_events`) verified 100% read-only and preserved. Zero migrations or destructive operations executed.
- **Observability**: `telemetry.js` strictly filters forbidden sensitive keys (`password`, `token`, `nin`, `bvn`, `phone`, `email`, `whatsapp_message`). Anonymous session UUIDs are generated with zero PII leakage.

---

## 6. Visual Evidence Catalog

Archived under `scripts/visual_evidence/padifix/phase_012_3/`:
1. `padifix-ng_desktop_1440x900.png` — Desktop 1440x900 live production layout
2. `padifix-ng_desktop_1920x1080.png` — Full HD 1920x1080 widescreen presentation
3. `padifix-ng_mobile_390x844.png` — Mobile iPhone 14 viewport
4. `padifix-ng_mobile_412x915.png` — Mobile Android Pixel/Galaxy viewport
5. `padifix-ng_search.png` — Live provider discovery with verified artisans
6. `padifix-ng_profile.png` — Live artisan profile with WhatsApp action
7. `padifix-ng_registration.png` — 5-step provider listing wizard
8. `padifix-ng_pwa.png` — Mobile "Install PadiFix" sheet
9. `padifix-ng_www_redirect.png` — Phase 012.3 DNS cutover audit & status canvas

---

## 7. Rollback & Safety Architecture

- **Primary Safeguard**: `https://lokator-ng.vercel.app` remains fully operational and is the active edge endpoint.
- If DNS cutover for `padifix.ng` encounters registrar delays, the application remains accessible without interruption.
- No rollback was triggered as no destructive operations were performed.

---

## 8. Stop Condition

Phase 012.3 is safely finalized with production 100% operational. No legacy URLs or infrastructure were prematurely removed. Execution halts cleanly at this boundary.
