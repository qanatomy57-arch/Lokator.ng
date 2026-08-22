# LOKATOR.NG — PHASE 10.8 BROWSE-FIRST UX & INFORMATION ARCHITECTURE

**Document:** `PHASE_10_8_NIGERIA_SKILLS_UX_INFORMATION_ARCHITECTURE.md`  
**Phase:** 10.8 Architecture & Discovery Gate  
**Status:** UX/IA SPECIFICATION — DESIGN ONLY (READ-ONLY)  

---

## 1. BROWSE-FIRST DISCOVERY FLOW

Transform Lokator.NG from a query-dependent search box into an intuitive, exploratory Nigerian skills marketplace:

```
[HOMEPAGE]
    ├── 1. Cinematic Hero Search (Natural Language + Auto-Suggest)
    ├── 2. "Browse by Industry" Grid (15 Macro Sectors with Icons & Skill Counts)
    │       └── Clicking an Industry expands Functional Categories & Top Skills
    ├── 3. "Popular Nigerian Trades" Chip Carousel (Instant 1-Click Discovery)
    ├── 4. "Emergency & Rapid Response Services" (Plumber, Electrician, Auto Mechanic, Generator Fix)
    └── 5. Location-Aware "Artisans Near You" Feed
```

---

## 2. MARKETPLACE NAVIGATION PATHS

### A. Deep Browse Flow
$$\text{Home} \longrightarrow \text{Select Industry (e.g. Home \& Repairs)} \longrightarrow \text{Select Category (Electrical)} \longrightarrow \text{Select Skill (Solar Installer)} \longrightarrow \text{Filtered Provider List}$$

### B. Direct Search Flow
$$\text{Natural Query ("fix my inverter battery in Ikeja")} \longrightarrow \text{Intent Resolver} \longrightarrow \text{Canonical Skill: solar-installer, City: Ikeja} \longrightarrow \text{Ranked Provider Results}$$

### C. Multi-Skill Provider Profile Experience
- Provider profile showcases verified primary trade badge with secondary skill chips.
- Clicking any skill chip on a provider's profile instantly executes a localized search for that trade in the same city.

---

## 3. PROVIDER ONBOARDING REDESIGN

### 3-Step Guided Skill Selection:
1. **Primary Industry Selection:** Provider chooses their core sector (e.g., `Automotive & Transport`).
2. **Trade & Skill Selection:** Pick up to 5 verified skills (e.g., `Auto Mechanic`, `Auto Electrician`).
3. **Specializations (Optional):** Check specific brand/service proficiencies (e.g., `Toyota Engine Specialist`, `OBD-II Scanning`).

*Outcome:* Eliminates typos, unifies taxonomy, prevents spam, and ensures 100% search match accuracy.
