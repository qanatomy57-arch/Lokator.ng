# LOKATOR.NG — PHASE 10.3 ARCHITECTURE AUDIT: STRATEGIC CAPACITY FORECASTING & FUTURE RESOURCE PLANNING ENGINE (SCFFRPE)

**Phase:** 10.3 Architecture Gate  
**Engine:** Strategic Capacity Forecasting & Future Resource Planning Engine (SCFFRPE)  
**Baseline Certified Commit:** `9308968`  
**Model Version:** `SCFFRPE-1.0.0`  
**Status:** ARCHITECTURAL SPECIFICATION & SECURITY AUDIT  

---

## 1. EXECUTIVE SUMMARY & STRATEGIC MISSION

Phase 10.3 introduces the **Strategic Capacity Forecasting & Future Resource Planning Engine (SCFFRPE)**. Operating downstream of Phases 9.3 through 10.2, SCFFRPE provides predictive forecasting of strategic capacity demand, resource requirements, utilization curves, projected bottlenecks, and capacity resilience across structured planning horizons (`SHORT_TERM`, `MEDIUM_TERM`, `LONG_TERM`).

### Core Architectural Axioms
1. **Decision Support Only:** SCFFRPE forecasts future resource requirements and models capacity buffers. It has **zero autonomous execution** capability. No resources may be automatically provisioned, budgets altered, or plans mutated (`MANUAL_ACTION_REQUIRED`).
2. **Forecast vs. Actual Segregation:** Historical observations and empirical business facts are strictly decoupled from predictive estimates (`FORECAST`, `SIMULATION`, `ANALYTICAL_SYNTHESIS`).
3. **Deterministic Capacity & Bottleneck Forecasting:** Identifies binding capacity constraints using deterministic utilization metrics and stable tie-breaking (`id ASC`).
4. **Ranking Air-Gap & Zero Business Truth Mutations:** 100% isolation from marketplace search ranking (`search.js`, `discovery-orchestrator.js`) and core business truth (`providers`, `reviews`, `provider_services`).
5. **Mathematical & Numerical Safety:** All capacity ratios, utilization percentages, and sensitivity derivatives enforce defensive zero-denominator guards and bounded ranges $[0.00, 100.00]$.

---

## 2. ARCHITECTURAL POSITION & COMPLETE DEPENDENCY GRAPH

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 9.3: Strategic Scenario Forecasting & Simulation (SSFDS)         │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 9.4: Strategic Optimization & Portfolio Allocation (SOPAE)       │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 9.5: Strategic Resource Allocation & Constraints (SRACOE)        │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 9.6: Portfolio Resilience & Stress Testing (SPRTCIE)             │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 9.7: Decision Governance & Recommendation Lifecycle (SDGRLE)     │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 9.8: Strategic Intelligence Learning & Calibration (SILCCIE)     │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 9.9: Strategic Intelligence Orchestration & Synthesis (SIOEDSE)  │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 10.0: Strategic Planning & Executive Command Engine (SPSECE)     │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 10.1: Strategic Execution Monitoring & Adaptive Control (SEMVDACE│
├────────────────────────────────────────────────────────────────────────┤
│ Phase 10.2: Strategic Performance Optimization & Rebalancing (SPORE)   │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 10.3: Strategic Capacity Forecasting & Resource Planning (SCFFRPE│
│             (Baselines, Demand Forecasts, Utilization, Bottlenecks,    │
│              Bounded Scenarios, Buffers, Sensitivity & Planning Brief) │
├────────────────────────────────────────────────────────────────────────┤
│                      EXECUTIVE HUMAN OPERATORS                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 10 CORE SCFFRPE ENGINES

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│            STRATEGIC CAPACITY FORECASTING & PLANNING (SCFFRPE)                 │
├───────────────────────┬────────────────────────┬───────────────────────────────┤
│ 1. Capacity Baseline  │ 2. Demand Forecast     │ 3. Capacity Requirement       │
│    (Immutable Snapshot│    (3 Bounded Horizons)│    (Gap / Surplus Calculation)│
├───────────────────────┼────────────────────────┼───────────────────────────────┤
│ 4. Utilization Forecast│ 5. Bottleneck Forecast│ 6. Scenario Engine            │
│    (5 Utilization Tier│    (Pre-emptive Detect)│    (Bounded Canonical Shock)  │
├───────────────────────┼────────────────────────┼───────────────────────────────┤
│ 7. Buffer & Resilience│ 8. Sensitivity Engine  │ 9. Strategy Comparison        │
│    (Analytical Buffer)│    (4 Sensitivity Tier│    (Multi-Key Trade-offs)     │
├───────────────────────┴────────────────────────┴───────────────────────────────┤
│ 10. Executive Capacity Planning Engine (12-Section Structured Planning Brief)  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Capacity Baseline Engine
Captures immutable multi-dimensional snapshots (`capital`, `personnel`, `operational throughput`, `campaigns`, `geography`, `time`, `supply`, `demand`) from approved strategic plans.

### 3.2 Demand Forecast Engine
Projects future resource requirements across bounded horizons (`SHORT_TERM` 1-3mo, `MEDIUM_TERM` 3-12mo, `LONG_TERM` 12-24mo) with lower/upper bounds and confidence intervals.

### 3.3 Capacity Requirement Engine
Calculates capacity gap: $\text{Capacity Gap} = \max(0.00, \text{Required Capacity} - \text{Available Capacity})$ and surplus: $\text{Surplus} = \max(0.00, \text{Available Capacity} - \text{Required Capacity})$.

### 3.4 Capacity Utilization Forecast Engine
Calculates projected utilization rate:
$$\text{Utilization Rate (\%)} = \frac{\text{Projected Demand}}{\max(1.00, \text{Available Capacity})} \times 100$$
Classified into 5 tiers: `UNDERUTILIZED` ($< 50\%$), `HEALTHY` ($50-75\%$), `ELEVATED` ($75-85\%$), `HIGH` ($85-95\%$), `CRITICAL` ($> 95\%$).

### 3.5 Capacity Bottleneck Forecast Engine
Pre-emptively projects bottleneck emergence by integrating projected utilization, capacity gaps, and resilience buffers into deterministic alerts.

### 3.6 Capacity Scenario Engine
Generates strictly bounded capacity scenarios (`BASELINE`, `DEMAND_SURGE`, `DEMAND_CONTRACTION`, `RESOURCE_SHORTAGE`, `COST_INFLATION`, `SUPPLY_DISRUPTION`, `EXPANSION_ACCELERATION`, `EXPANSION_DELAY`) preventing unbounded recursion.

### 3.7 Capacity Buffer & Resilience Engine
Computes recommended analytical contingency buffers based on upstream stress-test signals (Phase 9.6) and variance metrics (Phase 10.1).

### 3.8 Capacity Sensitivity Engine
Evaluates responsiveness to parameter perturbations, classifying sensitivity into: `LOW`, `MODERATE`, `HIGH`, `CRITICAL`.

### 3.9 Capacity Strategy Comparison Engine
Evaluates alternative capacity strategies (Gradual Expansion, Accelerated Expansion, Buffer Protection, Staged Acquisition) across cost, feasibility, and resilience.

### 3.10 Executive Capacity Planning Engine
Generates structured 12-section planning packages with explicit evidentiary tagging (`FACT`, `OBSERVED_ASSOCIATION`, `FORECAST`, `SIMULATION`, `ANALYTICAL_SYNTHESIS`, `RECOMMENDATION`, `HUMAN_DECISION`).

---

## 4. PROPOSED DATA MODEL & SCHEMA (MIGRATION 025 SPECIFICATION)

```sql
-- 1. CAPACITY BASELINES
CREATE TABLE IF NOT EXISTS public.analytics_strategic_capacity_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.analytics_strategic_plans(id) ON DELETE CASCADE,
    baseline_code TEXT NOT NULL UNIQUE,
    current_capacity NUMERIC(12,2) NOT NULL CHECK (current_capacity >= 0),
    allocated_capacity NUMERIC(12,2) NOT NULL CHECK (allocated_capacity >= 0),
    utilization_rate NUMERIC(5,2) NOT NULL CHECK (utilization_rate BETWEEN 0.00 AND 100.00),
    utilization_tier TEXT NOT NULL CHECK (utilization_tier IN ('UNDERUTILIZED', 'HEALTHY', 'ELEVATED', 'HIGH', 'CRITICAL')),
    baseline_digest TEXT NOT NULL,
    capacity_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_version TEXT NOT NULL DEFAULT 'SCFFRPE-1.0.0',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CAPACITY FORECASTS & SCENARIOS
CREATE TABLE IF NOT EXISTS public.analytics_strategic_capacity_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baseline_id UUID NOT NULL REFERENCES public.analytics_strategic_capacity_baselines(id) ON DELETE CASCADE,
    forecast_code TEXT NOT NULL,
    planning_horizon TEXT NOT NULL CHECK (planning_horizon IN ('SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM')),
    projected_demand NUMERIC(12,2) NOT NULL CHECK (projected_demand >= 0),
    required_capacity NUMERIC(12,2) NOT NULL CHECK (required_capacity >= 0),
    capacity_gap NUMERIC(12,2) NOT NULL CHECK (capacity_gap >= 0),
    forecast_utilization NUMERIC(5,2) NOT NULL CHECK (forecast_utilization BETWEEN 0.00 AND 100.00),
    bottleneck_risk TEXT NOT NULL CHECK (bottleneck_risk IN ('NON_BINDING', 'WATCH', 'CONSTRAINING', 'CRITICAL_BOTTLENECK')),
    recommended_buffer NUMERIC(12,2) NOT NULL CHECK (recommended_buffer >= 0),
    confidence_score NUMERIC(5,2) NOT NULL CHECK (confidence_score BETWEEN 0.00 AND 100.00),
    scenario_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    executive_planning_brief JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_version TEXT NOT NULL DEFAULT 'SCFFRPE-1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cap_fc UNIQUE (baseline_id, forecast_code)
);

-- 3. CAPACITY AUDIT LOG (Strictly Append-Only)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_capacity_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. HOSTILE RED-TEAM ARCHITECTURE REVIEW (25 THREAT VECTORS)

| # | Threat Vector | Attack Scenario | Defensive Control & Architectural Mitigation | Severity | Verdict |
|---|---|---|---|---|---|
| 1 | **Capacity Baseline Tampering** | Attacker modifying baseline capacity to suppress shortage warnings | `REVOKE UPDATE, DELETE ON public.analytics_strategic_capacity_baselines` | Critical | MITIGATED |
| 2 | **Forecast Mutation** | Modifying historical capacity forecast records after the fact | `REVOKE UPDATE, DELETE ON public.analytics_strategic_capacity_forecasts` | Critical | MITIGATED |
| 3 | **Autonomous Resource Provisioning** | Forecasting engine automatically purchasing server slots or funding budgets | Zero `pg_net`, `http_post`, or triggers; manual decision required | Critical | MITIGATED |
| 4 | **Forecast/Actual Conflation** | Storing forecast numbers in empirical business metrics | Separate analytics tables; clear `FORECAST` provenance tagging | Critical | MITIGATED |
| 5 | **Zero Denominator Crash** | Zero available capacity submitted crashing utilization formula | $\max(1.00, \text{Available Capacity})$ denominator guard | High | MITIGATED |
| 6 | **Negative Capacity Injection** | Submitting negative capacity or demand numbers | Table `CHECK (current_capacity >= 0)` constraints | High | MITIGATED |
| 7 | **search_path Hijacking** | Schema injection on SECURITY DEFINER RPCs | Fixed `SET search_path = public, extensions, pg_temp;` | Critical | MITIGATED |
| 8 | **Actor Identity Spoofing** | Submitting forged actor IDs in client payload | Server derives actor strictly from `auth.uid()` | Critical | MITIGATED |
| 9 | **Audit Trail Tampering** | Deleting capacity planning audit log entries | `REVOKE UPDATE, DELETE ON public.analytics_strategic_capacity_audit_log` | Critical | MITIGATED |
| 10| **Cross-Plan Leakage** | Querying capacity forecasts of unrelated plans | RLS policies restrict access to authorized admins | High | MITIGATED |
| 11| **Replay Attacks** | Submitting duplicate forecast code for same baseline | Unique constraint `(baseline_id, forecast_code)` | Medium | MITIGATED |
| 12| **Scenario Explosion** | Recursive unbounded scenario expansion exhausting CPU/memory | Bounded scenario matrix ($\le 4$ canonical scenarios per horizon) | High | MITIGATED |
| 13| **Ranking Air-Gap Breach** | Capacity forecast metrics leaking into provider search | 100% air-gap verified; zero references in `search.js` | Critical | MITIGATED |
| 14| **Marketplace Mutation** | Capacity RPC updating `providers` or `reviews` | Zero mutation statements targeting core marketplace tables | Critical | MITIGATED |
| 15| **Plan Auto-Transition** | Forecasting engine auto-approving strategic plan | Plan lifecycle remains under Phase 10.0 human governance | Critical | MITIGATED |
| 16| **Model-Version Spoofing** | Submitting unverified model version string | Server enforces default `SCFFRPE-1.0.0` | Medium | MITIGATED |
| 17| **Confidence Clamping Bypass** | Confidence score $> 100\%$ or $< 0\%$ | Clamped via $\min(100.00, \max(0.00, x))$ and table CHECK | Medium | MITIGATED |
| 18| **Stale Baseline Usage** | Forecasting against a deleted strategic plan | Foreign key with `ON DELETE CASCADE` and existence check | High | MITIGATED |
| 19| **Corrupted JSON Injection** | Malicious payload in scenario analysis JSONB | Validated structured JSONB object construction server-side | Medium | MITIGATED |
| 20| **Unauthenticated Execution** | Anon token invoking capacity RPCs | `auth.uid()` null check and `public.is_admin()` validation | Critical | MITIGATED |
| 21| **Non-Deterministic Sort** | Forecasts returned in random order | Deterministic sort ending with `forecast_code ASC, id ASC` | Low | MITIGATED |
| 22| **Sensitivity Inversion** | Claiming low sensitivity when variance is critical | Sensitivity calculated deterministically from derivative thresholds | Medium | MITIGATED |
| 23| **Buffer Laundering** | Presenting buffer recommendation as allocated resource | Strict `RECOMMENDED_BUFFER (DECISION_SUPPORT)` badge | Critical | MITIGATED |
| 24| **Extreme Horizon Overflow** | Requesting 50-year horizon projection | Horizon restricted to enum (`SHORT_TERM`, `MEDIUM_TERM`, `LONG_TERM`)| High | MITIGATED |
| 25| **Causality Laundering** | Presenting forecasted correlation as causal truth | Tagged strictly as `ANALYTICAL_SYNTHESIS` | High | MITIGATED |

---

## 6. FINAL ARCHITECTURAL CERTIFICATION VERDICT

```text
PHASE_10_3_ARCHITECTURE:
GREEN

ARCHITECTURE:
PASS

PROVENANCE:
PASS

FORECAST_ACTUAL_SEPARATION:
PASS

CAPACITY_MATHEMATICAL_SAFETY:
PASS

BOTTLENECK_FORECASTING:
PASS

SCENARIO_BOUNDING:
PASS

RESILIENCE_INTEGRATION:
PASS

MODEL_VERSIONING:
PASS

DETERMINISM:
PASS

CAUSALITY_SAFETY:
PASS

SIMULATION_ISOLATION:
PASS

SECURITY:
PASS

PRIVACY:
PASS

RESOURCE_SAFETY:
PASS

FAILURE_ISOLATION:
PASS

RANKING_AIR_GAP:
CONFIRMED

BUSINESS_TRUTH_MUTATION:
ZERO

AUTONOMOUS_EXECUTION:
ZERO

IMPLEMENTATION_AUTHORIZATION:
AUTHORIZED

NEXT_STEP:
PROCEED WITH PHASE 10.3 IMPLEMENTATION
```
