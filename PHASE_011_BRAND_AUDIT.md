# PHASE 011 — PADIFIX COMPLETE BRAND AUDIT REPORT

**Date**: 2026-09-03  
**Target Brand**: PadiFix  
**Primary Tagline**: Find Skills. Get Things Done.  
**Secondary Tagline**: Whatever You Need. We’ve Got You.  
**Category**: Nigeria's Local-Services Marketplace  

---

## 1. Classification Summary

| Classification | Occurrences | Strategic Action |
| :--- | :---: | :--- |
| **PUBLIC_BRAND** | 248 | **MIGRATE**: Replace customer-facing copy, logos, titles, PWA name with PadiFix |
| **TECHNICAL_IDENTIFIER** | 1084 | **PRESERVE**: Keep database keys, contracts, and internal configs intact |
| **HISTORICAL** | 1211 | **PRESERVE**: Keep past migration files and prior phase audit logs immutable |
| **INFRASTRUCTURE** | 16 | **AUDIT FIRST**: Keep deployment endpoints functional, phase domain migrations |
| **UNCERTAIN** | 723 | **MANUAL REVIEW**: Validate during implementation phase |
| **TOTAL** | **3282** | Complete codebase scan |

---

## 2. Customer-Facing Surfaces (PUBLIC_BRAND) — High Priority Migration Matrix

### `about.html` (8 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>About Lokator.NG — Nigeria's Premier Artisan Directory</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 7 | `<meta name="description" content="Learn about Lokator.NG's mission to empower Ni` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 12 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 96 | `<span class="logo-text">Lokator<span class="logo-dot">.NG</span></span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 121 | `<span class="logo-text">Lokator<span class="logo-accent">.NG</span></span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 143 | `<p>Lokator.NG is built to bridge the gap between verified Nigerian technicians a` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 150 | `<p>Unlike agency platforms that deduct 20–30% of artisan earnings, Lokator conne` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 168 | `<p>© 2026 Lokator.NG — Nigeria's #1 Verified Artisan Discovery Directory. All ri` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `admin.html` (3 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>Trust & Safety Compliance Desk \| Lokator.NG</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 10 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 53 | `<span class="logo-text">Lokator</span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `analytics.html` (2 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>Internal Analytics & Platform Observability — Lokator.NG</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 7 | `<meta name="description" content="Internal platform observability, provider funn` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `dashboard.html` (12 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>Provider Management Dashboard — Lokator</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 7 | `<meta name="description" content="Manage your artisan profile, customer leads, p` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 12 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 41 | `<h2 class="splash-brand-title">Lokator<span class="splash-brand-accent">.NG</spa` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 57 | `<span class="logo-text dash-logo-text">Lokator</span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 282 | `<h2 style="margin: 0; font-size: 1.1rem; color: #FFFFFF;">Invite Fellow Artisans` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 293 | `<input type="text" id="dash-referral-link" readonly title="Artisan invite and re` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 359 | `<input type="email" id="edit-email" placeholder="dickson@lokator.ng" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 647 | `<p style="font-size: 12px; color: var(--dash-muted); margin-top: 4px;">Official ` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 664 | `Get an official verified trust badge on your public profile. Submit your identif` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 707 | `<strong>Lokator.NG Free Marketplace Guarantee:</strong> Listing, public profile,` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 872 | `<p>Invite fellow trusted artisans to Lokator.NG. Unlock the <strong>Community Bu` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `how-it-works.html` (8 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>How It Works — Lokator.NG</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 7 | `<meta name="description" content="Discover how Lokator.NG connects customers to ` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 12 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 123 | `<span class="logo-text">Lokator<span class="logo-dot">.NG</span></span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 148 | `<span class="logo-text">Lokator<span class="logo-accent">.NG</span></span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 168 | `<h1>How Lokator.NG Works</h1>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 221 | `<p>Join thousands of verified plumbers, electricians, carpenters, and technician` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 232 | `<p>© 2026 Lokator.NG — Nigeria's #1 Verified Artisan Discovery Directory. All ri` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `index.html` (32 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 7 | `<title>Lokator — Locate Skilled Hands Near You</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 9 | `content="Lokator connects you with the closest verified artisans and service pro` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 14 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 43 | `<h2 class="splash-brand-title">Lokator<span class="splash-brand-accent">.NG</spa` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 58 | `<span class="logo-text">Lokator</span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 64 | `<a href="#why-lokator" class="nav-link">Why Lokator</a>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 65 | `<button type="button" class="pwa-install-nav-btn" id="nav-pwa-install-btn" aria-` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 276 | `bathroom remodels. Lokator connects you with fast-response plumbers within minut` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 298 | `<a href="https://wa.me/2348034567890?text=Hello,%20I%20need%20a%20verified%20plu` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 843 | `<!-- ===== WHY LOKATOR ===== -->` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 844 | `<section class="why section-pad" id="why-lokator">` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 847 | `<span class="badge-pill">Why Lokator</span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 848 | `<h2>Why 200,000+ Nigerians Trust Lokator</h2>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 937 | `<a href="https://wa.me/2348012345678?text=Hello%20Adebayo,%20I%20saw%20your%20pr` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 961 | `<a href="https://wa.me/2348098765432?text=Hello%20Chidinma,%20I%20saw%20your%20p` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| ... | *(17 more occurrences in this file)* | Batch replace customer-facing strings | LOW |

### `join.html` (7 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>Join as a Verified Service Provider — Lokator.NG</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 11 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 157 | `<a href="index.html" class="logo" aria-label="Lokator Home">` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 159 | `<span class="logo-text">Lokator<span class="logo-dot">.ng</span></span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 238 | `© 2026 Lokator.NG. Nigeria's verified skills marketplace.` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 289 | `if (typeof LokatorTelemetry !== 'undefined') {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 290 | `LokatorTelemetry.trackEvent('provider_acquisition_landing_viewed', {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `login.html` (21 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>Provider Login — Lokator</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 7 | `<meta name="description" content="Sign in to your Lokator Provider Dashboard to ` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 12 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 148 | `<h2 class="splash-brand-title">Lokator<span class="splash-brand-accent">.NG</spa` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 163 | `<span class="logo-text">Lokator</span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 188 | `<input type="email" id="login-email" name="email" required placeholder="e.g. ade` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 267 | `if (typeof LokatorDB !== 'undefined' && LokatorDB.auth) {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 268 | `const session = await LokatorDB.auth.getSession();` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 270 | `const p = await LokatorDB.auth.getCurrentProvider();` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 317 | `if (typeof LokatorTelemetry !== 'undefined') {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 318 | `LokatorTelemetry.trackEvent('provider_login_failed', { reason: 'validation', met` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 324 | `if (typeof LokatorTelemetry !== 'undefined') {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 325 | `LokatorTelemetry.trackEvent('provider_login_submitted', { method: 'password' });` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 332 | `if (typeof LokatorDB === 'undefined' \|\| !LokatorDB.auth) {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 336 | `const res = await LokatorDB.auth.signInWithPassword({ email, password });` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| ... | *(6 more occurrences in this file)* | Batch replace customer-facing strings | LOW |

### `manifest.json` (2 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 2 | `"name": "Lokator.NG",` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 3 | `"short_name": "Lokator",` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `map-service.js` (2 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 476 | `html: `<div class="lokator-pin" title="${escapeMapHtml(p.name)} (${escapeMapHtml` | MIGRATE_TO_PADIFIX (Update user-visible toast, prompt, or share message) | LOW |
| 494 | `${waUrl ? `<a href="${escapeMapHtml(waUrl)}" target="_blank" rel="noopener" clas` | MIGRATE_TO_PADIFIX (Update user-visible toast, prompt, or share message) | LOW |

### `offline.html` (2 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>Offline — Lokator.NG</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 156 | `<p class="offline-desc">Previously loaded Lokator content may still be available` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `privacy.html` (8 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>Privacy Policy — Lokator.NG</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 7 | `<meta name="description" content="NDPR compliant privacy policy for Lokator.NG. ` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 12 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 89 | `<span class="logo-text">Lokator<span class="logo-dot">.NG</span></span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 114 | `<span class="logo-text">Lokator<span class="logo-accent">.NG</span></span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 139 | `<p>Lokator.NG respects your privacy and is dedicated to protecting personal info` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 168 | `<p>You have the right to review, update, or delete your provider profile at any ` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 177 | `<p>© 2026 Lokator.NG — Nigeria's #1 Verified Artisan Discovery Directory. All ri` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `profile.html` (14 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>Provider Profile — Lokator</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 7 | `<meta name="description" content="View verified artisan profile, portfolio showc` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 12 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 41 | `<h2 class="splash-brand-title">Lokator<span class="splash-brand-accent">.NG</spa` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 52 | `<span class="logo-text">Lokator</span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 483 | `<li>Report misleading or suspicious listings to Lokator moderators</li>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 698 | `<small style="display: block; color: #94A3B8; font-size: 11.5px;">I confirm this` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 737 | `Help us keep Lokator.NG safe and transparent. Reports are reviewed by our modera` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 767 | `<a href="index.html" class="logo" aria-label="Lokator home">` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 769 | `<span class="logo-text">Lokator</span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 792 | `<a href="index.html#why-lokator">Why Lokator</a>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 804 | `<p>© 2026 Lokator. All rights reserved. Made with ❤️ in Nigeria 🇳🇬</p>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 818 | `<span>Lokator<span style="color: #D4AF37;">.NG</span></span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 829 | `<a href="index.html#why-lokator" class="drawer-link"><span class="drawer-icon">�` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `profile.js` (4 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 37 | `document.title = 'Provider Not Found — Lokator.NG';` | MIGRATE_TO_PADIFIX (Update user-visible toast, prompt, or share message) | LOW |
| 59 | `document.title = `${provider.name \|\| 'Artisan'} — ${provider.trade \|\| 'Servi` | MIGRATE_TO_PADIFIX (Update user-visible toast, prompt, or share message) | LOW |
| 311 | `title: `${provider.name} on Lokator`,` | MIGRATE_TO_PADIFIX (Update user-visible toast, prompt, or share message) | LOW |
| 353 | `<a href="search.html?q=${encodeURIComponent(s)}" class="skill-tag-pill" title="D` | MIGRATE_TO_PADIFIX (Update user-visible toast, prompt, or share message) | LOW |

### `pwa-manager.js` (40 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 3 | `* LOKATOR.NG — PWA EXPERIENCE & INSTALL MANAGER (pwa.js / pwa-manager.js)` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 26 | `const LokatorPWA = {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 89 | `if (typeof LokatorTelemetry !== 'undefined') {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 90 | `LokatorTelemetry.trackEvent('pwa_install_dismissed', { days });` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 101 | `if (typeof LokatorTelemetry !== 'undefined') {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 102 | `LokatorTelemetry.trackEvent('ios_install_guide_dismissed', { days });` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 136 | `if (typeof LokatorTelemetry !== 'undefined' && typeof LokatorTelemetry.setPWASpl` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 137 | `LokatorTelemetry.setPWASplashTiming(splashTime);` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 165 | `if (typeof LokatorTelemetry !== 'undefined') {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 166 | `LokatorTelemetry.trackEvent('pwa_installed', { mode: 'standalone' });` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 194 | `<img src="icons/icon-192.png" alt="Lokator.NG Icon" width="56" height="56">` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 197 | `<h3 id="pwa-sheet-title">Install Lokator.NG</h3>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 198 | `<p id="pwa-sheet-desc">Install Lokator.NG on your phone for faster access and an` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 229 | `<img src="icons/icon-192.png" alt="Lokator.NG Icon" width="56" height="56">` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 232 | `<h3 id="pwa-ios-title">Install Lokator.NG</h3>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| ... | *(25 more occurrences in this file)* | Batch replace customer-facing strings | LOW |

### `pwa.css` (1 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 2 | `LOKATOR.NG — PWA POLISH & NATIVE APP EXPERIENCE STYLES (pwa.css)` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `register.html` (47 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>Register as Provider — Lokator</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 7 | `<meta name="description" content="Join 18,000+ service providers on Lokator. Reg` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 12 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 73 | `<h2 class="splash-brand-title">Lokator<span class="splash-brand-accent">.NG</spa` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 82 | `<span class="logo-text">Lokator</span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 100 | `<p>Join 18,000+ artisans and service providers already getting new customers thr` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 222 | `<span id="moderation-alert-text">Disallowed service keyword detected. Lokator on` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 445 | `<label for="terms">I agree to Lokator's <a href="terms.html" target="_blank">Ter` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 530 | `<a href="index.html" class="logo"><div class="logo-mark"><svg width="24" height=` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 538 | `<div class="footer-bottom"><div class="container fb-inner"><p>© 2026 Lokator. Al` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 598 | `if (typeof LokatorTelemetry !== 'undefined') {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 599 | `LokatorTelemetry.trackEvent('provider_onboarding_started', { step: 1, total_step` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 667 | `if (!isValid && typeof LokatorTelemetry !== 'undefined') {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 668 | `LokatorTelemetry.trackEvent('provider_onboarding_validation_failed', { step: 1, ` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 678 | `if (typeof LokatorTelemetry !== 'undefined') {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| ... | *(32 more occurrences in this file)* | Batch replace customer-facing strings | LOW |

### `search.html` (10 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>Explore Providers — Lokator</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 12 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 38 | `<h2 class="splash-brand-title">Lokator<span class="splash-brand-accent">.NG</spa` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 49 | `<span class="logo-text">Lokator</span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 63 | `<button type="button" class="pwa-install-nav-btn" id="nav-pwa-install-btn" aria-` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 421 | `<span class="logo-text">Lokator</span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 443 | `<a href="index.html#why-lokator">Why Lokator</a>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 455 | `<p>© 2026 Lokator. All rights reserved. Made with ❤️ in Nigeria 🇳🇬</p>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 466 | `<span>Lokator<span style="color: #D4AF37;">.NG</span></span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 477 | `<a href="index.html#why-lokator" class="drawer-link"><span class="drawer-icon">�` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `style.css` (8 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 1 | `/* ===== LOKATOR — DESIGN SYSTEM ===== */` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 3413 | `/* ===== LOKATOR GLOBAL CONNECTION & OFFLINE BADGE ===== */` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 3414 | `.lokator-conn-badge {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 3435 | `.lokator-conn-badge.show {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 3441 | `.lokator-conn-badge.offline {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 3447 | `.lokator-conn-badge.syncing {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 3453 | `.lokator-conn-badge.synced {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 3459 | `.lokator-conn-badge.failed {` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `sw.js` (5 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 2 | `// LOKATOR.NG — SERVICE WORKER (sw.js)` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 6 | `const CACHE_VERSION = 'lokator-v10.29';` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 7 | `const STATIC_CACHE = `lokator-static-${CACHE_VERSION}`;` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 8 | `const RUNTIME_CACHE = `lokator-runtime-${CACHE_VERSION}`;` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 138 | `return offlinePage \|\| new Response('You are offline. Please reconnect to conti` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

### `telemetry.js` (2 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 534 | `LokatorTelemetry.trackEvent('page_view', { title: document.title });` | MIGRATE_TO_PADIFIX (Update user-visible toast, prompt, or share message) | LOW |
| 537 | `LokatorTelemetry.trackEvent('page_view', { title: document.title });` | MIGRATE_TO_PADIFIX (Update user-visible toast, prompt, or share message) | LOW |

### `terms.html` (10 occurrences)

| Line | Old Brand Value | Proposed Action | Risk Level |
| :---: | :--- | :--- | :---: |
| 6 | `<title>Terms of Service — Lokator.NG</title>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 7 | `<meta name="description" content="Terms and conditions governing the use of Loka` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 12 | `<meta name="apple-mobile-web-app-title" content="Lokator" />` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 89 | `<span class="logo-text">Lokator<span class="logo-dot">.NG</span></span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 114 | `<span class="logo-text">Lokator<span class="logo-accent">.NG</span></span>` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 139 | `<p>Welcome to <strong>Lokator.NG</strong> ("Lokator", "we", "us", or "our"). By ` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 140 | `<p>Lokator.NG operates as a direct discovery and connection directory matching c` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 145 | `<p>Lokator.NG is a discovery directory. We connect customers directly to artisan` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 160 | `<p>Artisans listing services on Lokator.NG agree to provide genuine contact deta` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |
| 174 | `<p>© 2026 Lokator.NG — Nigeria's #1 Verified Artisan Discovery Directory. All ri` | MIGRATE_TO_PADIFIX (Update customer-facing text, page titles, taglines, logos, and PWA name to PadiFix) | LOW |

---

## 3. Technical Identifiers (TECHNICAL_IDENTIFIER) — Preserved for Safety

The following technical identifiers are **strictly preserved** to prevent breaking client state, auth sessions, database relations, and service workers:

- `DB_STORE_KEY = 'lokator_supabase_providers_db'` (LocalStorage offline database cache)
- `DB_AUTH_SESSION_KEY = 'lokator_supabase_auth_session'` (User session token persistence)
- `DB_REVIEWS_KEY = 'lokator_supabase_reviews_db'` (Review submission queue)
- `window.lokatorDiscovery` (Core hero and scroll engine controller singleton)
- `window.LOKATOR_SUPABASE_URL` / `window.LOKATOR_SUPABASE_ANON_KEY` (Backward-compatible environment fallback)
- Supabase database table names (`providers`, `categories`, `reviews`, `analytics_events`, etc.)
- Storage bucket IDs and column schemas

---

## 4. Historical Records (HISTORICAL) — Immutable Past Documentation

All prior audit markdown files (`PHASE_10_*.md`, `PHASE_9_*.md`, etc.) and database migrations (`supabase/migrations/*.sql`) represent historical milestones and are preserved without modification.

