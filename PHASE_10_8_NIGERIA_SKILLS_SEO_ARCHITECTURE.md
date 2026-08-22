# LOKATOR.NG — PHASE 10.8 SEO & PROGRAMMATIC DISCOVERY ARCHITECTURE

**Document:** `PHASE_10_8_NIGERIA_SKILLS_SEO_ARCHITECTURE.md`  
**Phase:** 10.8 Architecture & Discovery Gate  
**Status:** SEO & ROUTING SPECIFICATION — DESIGN ONLY (READ-ONLY)  

---

## 1. CANONICAL URL STRUCTURE

To capture high-intent organic search traffic across Nigerian cities without creating duplicate or thin content:

| Route Type | URL Pattern | Example |
|---|---|---|
| **Industry Hub** | `/services/{industry-slug}` | `/services/home-repairs` |
| **Category Hub** | `/services/{industry-slug}/{category-slug}` | `/services/home-repairs/electrical` |
| **Canonical Skill** | `/services/{skill-slug}` | `/services/electrician` |
| **Localized Skill** | `/services/{skill-slug}/{state-slug}/{city-slug}` | `/services/electrician/lagos/ikeja` |
| **Specialized Skill** | `/services/{skill-slug}/{specialization-slug}` | `/services/electrician/solar-installation` |

---

## 2. STRUCTURED DATA & SCHEMA.ORG BLUEPRINT

Every skill landing page serves dynamic JSON-LD structured data:
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Verified Electricians in Ikeja, Lagos",
  "serviceType": "Electrical Installation & Repair",
  "provider": {
    "@type": "LocalBusiness",
    "name": "Lokator.NG Verified Artisans Network",
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": "Ikeja, Lagos, Nigeria"
    }
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "NGN",
    "offerCount": "24"
  }
}
```

---

## 3. THIN CONTENT & CRAWL BUDGET SAFEGUARDS

1. **Active Provider Threshold:** Localized pages (e.g. `/services/plumber/rivers/choba`) are only indexed (`robots: index, follow`) if at least 2 active, verified providers exist. Empty or single-provider locations return `noindex, follow` to protect domain authority.
2. **Dynamic Meta Generation:** Title tags and meta descriptions incorporate real-time provider counts, average ratings, and Nigerian locality keywords.
