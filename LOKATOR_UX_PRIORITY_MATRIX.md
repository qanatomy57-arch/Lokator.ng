# LOKATOR.NG — UX PRIORITY & OPPORTUNITY MATRIX

**Sprint:** Post-Mobile-Hardening Production UX & Product Audit  
**Authoritative Baseline Commit:** `5e28f57`  
**Classification Guide:**
- **P0:** Blocks core marketplace use
- **P1:** Materially damages conversion or trust
- **P2:** Meaningful UX improvement
- **P3:** Visual polish & aesthetic enhancement

---

## 1. PRIORITIZED OPPORTUNITY MATRIX

| ID | Category | Observation | User Impact | Business Impact | Severity | Effort | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **UX-01** | Search | Slang query matching (e.g. "rewire" for auto-electrician) | High | Increases search conversion | **P2** | Low | Low | Expand synonym mappings in `categories.js` |
| **UX-02** | Profile | Empty gallery fallback illustration | Medium | Enhances unverified profile trust | **P3** | Low | Low | Provide clean branded placeholder gallery cards |
| **UX-03** | Onboarding | Phone number formatting helper (+234) | Medium | Reduces input validation errors | **P2** | Low | Low | Auto-format leading zero / +234 in registration input |
| **UX-04** | Discovery | Category icon visual vibrancy | Low | Improves scan speed | **P3** | Low | Low | Polish SVG icon fills with subtle gold/emerald gradients |
| **UX-05** | Reviews | Rating count breakdown bars in profile modal | Medium | Boosts review transparency | **P3** | Medium | Low | Add 5-star distribution visualizer in review section |

---

## 2. AUDIT SUMMARY CONCLUSION

There are **0 P0 blockers** and **0 P1 critical issues**. The platform is in an active **GREEN** state and ready for commercial operations across all target viewports.
