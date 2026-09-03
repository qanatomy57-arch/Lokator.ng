# PadiFix — Nigeria's Local-Services Marketplace

> **"Find a trusted padi to fix it."**  
> *Find Skills. Get Things Done.*

Official Production Endpoint: **[https://padifix.vercel.app](https://padifix.vercel.app)**

---

## 🌟 Overview

**PadiFix** is an ultra-modern, zero-middleman local-services marketplace engineered for Nigerian communities, homeowners, and businesses. It connects customers directly with verified, background-vetted artisans and skilled professionals—from electricians and plumbers to tailors and mechanics.

### Key Capabilities:
- **Cinematic 9-Scene Scroll-Driven Video Hero**: Dynamic visual storytelling showcasing real Nigerian trades.
- **AI-Powered Natural Search**: Pidgin English, local colloquialisms, trade slang, and typo tolerance.
- **Granular Geospatial Filtering**: 36 States + FCT, 774 Local Government Areas (LGAs), and interactive GPS-based distance radius.
- **Direct WhatsApp Dispatch**: Instant zero-fee customer-to-artisan direct messaging with pre-formatted job briefs.
- **Progressive Web App (PWA)**: Offline resilience, low-bandwidth data saver mode, home screen installation, and instant startup splash screen.
- **Trust & Verification**: Multi-tier artisan verification incorporating NIN verification, customer reviews, and portfolio galleries.

---

## 🛠️ Technology Architecture

- **Frontend**: Vanilla HTML5, CSS3 (Modern Glassmorphism & Custom Properties), Vanilla JavaScript (ES2022 Modules).
- **Backend & Database**: Supabase PostgreSQL with Row Level Security (RLS) and real-time observability.
- **Payments / Escrow**: Paystack integration for subscription tiers and verified artisan badges.
- **Deployment & Edge**: Hosted on Vercel Anycast Global Edge Network.
- **Privacy & Compliance**: Strict NDPR & SAIF adherence with automatic PII sanitization in telemetry.

---

## 🚀 Quickstart & Local Development

1. **Clone Repository**:
   ```bash
   git clone https://github.com/qanatomy57-arch/padifix.git
   cd padifix
   ```

2. **Serve Locally**:
   Run with any static file server:
   ```bash
   # Using Node.js
   node scripts/local_server.js
   # Or using Python
   python -m http.server 8080
   ```
   Open `http://localhost:8080` in your browser.

3. **Run Production Verification Suite**:
   ```bash
   npm test
   ```

---

## 📜 License & Compliance

Copyright © 2026 PadiFix. All rights reserved.  
Privacy policy: [https://padifix.vercel.app/privacy.html](https://padifix.vercel.app/privacy.html)  
Terms of service: [https://padifix.vercel.app/terms.html](https://padifix.vercel.app/terms.html)