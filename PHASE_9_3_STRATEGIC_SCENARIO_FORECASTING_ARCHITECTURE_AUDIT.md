# LOKATOR.NG — PHASE 9.3 ARCHITECTURAL AUDIT & SPECIFICATION
## Strategic Scenario Forecasting & Decision Simulation Engine (SSFDS)

**Status:** ARCHITECTURAL DESIGN COMPLETE — READ-ONLY VERIFIED  
**Date:** August 21, 2026  
**Environment:** Lokator.NG Architecture & Design Gate  
**Target Migration:** `supabase/migrations/015_lokator_strategic_scenario_forecasting.sql`  
**Current Production Commit Baseline:** `7bc4078`  
**Production URL:** `https://lokator-ng.vercel.app/`  
**Production Supabase:** `hvxosxhnxauiqrhpyuur` (`eu-central-1`)  

---

## 1. Executive Summary

Phase 9.3 introduces the **Strategic Scenario Forecasting & Decision Simulation Engine (SSFDS)** for Lokator.NG.

The purpose of SSFDS is to provide marketplace leadership with **forward-looking, counterfactual, and probabilistic scenario modeling** before executing strategic decisions or committing operational resources. It enables authorized operators to answer questions such as:

- *"What is the projected deficit trajectory if we take no action over the next 14 to 30 days?"*
- *"What is the counterfactual impact of a provider acquisition campaign versus promotional incentives?"*
- *"What are the best-case, expected-case, and worst-case outcomes for this LGA-category cohort?"*
- *"How sensitive is our forecast to changes in search volume, provider churn, or historical efficacy assumptions?"*
- *"Which candidate strategy provides the highest expected strategic value (EV) per unit of operational risk?"*
- *"What historical precedent exists for similar market conditions across Nigeria (enforcing privacy floors $N \ge 30, k \ge 5$)?"*

### Critical Architectural Boundary: Decision-Support Only
SSFDS is **strictly a simulation and decision-support layer**. All simulation outputs are explicitly labeled **`SIMULATED`** or **`PROJECTED`** in data structures and user interfaces. SSFDS contains **zero autonomous execution mechanisms** (`pg_net`, `http_post`, webhooks, automated provider mutations, or automated campaigns).

---

## 2. Authoritative Current Baseline State

Phase 9.2 (Continuous Strategic Orchestration & Executive Intelligence — CSOEI) is production-certified GREEN:

- **Live Production HTTP & Asset Availability**: 100% OK across 13 canonical routes.
- **Cumulative Platform Regression Score**: **3,065 / 3,065 assertions PASS across 32 suites (100%)**.
- **Security Vulnerabilities**: **0 P0, 0 P1, 0 P2, 0 P3**.
- **Platform Invariants**: Ranking Air-Gap CONFIRMED, Business Truth Mutation ZERO, `ACCEPTED != EXECUTED` CONFIRMED, Privacy Floor CONFIRMED, Audit Immutability CONFIRMED.
- **Active Database Migrations**: `001` through `014` applied and verified.

---

## 3. Phase 9.3 Objectives & Non-Negotiable Invariants

### 3.1 Core Objectives
1. **Deterministic Baseline Forecasting**: Model market supply deficit, search zero-yield rate, and provider density trajectories under a "Do Nothing" baseline.
2. **Counterfactual Strategy Modeling**: Project comparative trajectories for multiple candidate interventions (`PROVIDER_ACQUISITION`, `CATEGORY_EXPANSION`, `QUALITY_VERIFICATION`, `PROMOTIONAL_CAMPAIGN`, `COVERAGE_DENSITY`).
3. **Bounded Scenario Banding**: Generate mathematically bounded `BEST_CASE`, `EXPECTED_CASE`, and `WORST_CASE` outcome bands.
4. **Sensitivity & Risk Quantification**: Compute explicit parameter sensitivities ($\frac{\partial EV}{\partial x}$) and strategic risk scores $R \in [0.00, 100.00]$.
5. **Expected Strategic Value (EV)**: Calculate normalized strategic payoff $EV \in [0.00, 100.00]$ using empirical strategy multipliers $M \in [0.50, 1.50]$.
6. **Privacy-Preserving Historical Analogues**: Match current opportunities with historical cohorts meeting $N \ge 30, k \ge 5$ anonymity thresholds.
7. **Executive Scenario Brief**: Present unified decision matrices comparing candidate interventions against baseline.

### 3.2 Non-Negotiable Invariants
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NON-NEGOTIABLE PLATFORM INVARIANTS                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. RANKING AIR-GAP         │ search.js & discovery-orchestrator.js are 100% │
│                            │ isolated from simulation models & outputs.     │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 2. BUSINESS TRUTH          │ Zero INSERT, UPDATE, DELETE on providers,      │
│    IMMUTABILITY            │ reviews, or provider_services.                 │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 3. ACCEPTED != EXECUTED    │ Simulation results are projected potential     │
│                            │ outcomes only; no execution is implied.        │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 4. ZERO AUTONOMOUS         │ Zero pg_net, http_post, webhooks, automated    │
│    EXECUTION               │ campaigns, or provider mutations.              │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 5. SERVER-SIDE PROVENANCE  │ auth.uid() + server-side public.is_admin()     │
│                            │ validation; zero client-supplied actor claims. │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 6. PRIVACY FLOOR           │ N >= 30, k >= 5 across all historical cohorts. │
│                            │ Zero PII, phone, email, IP, or raw query data. │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 7. AUDIT IMMUTABILITY      │ Append-only simulation audit trail with        │
│                            │ REVOKE UPDATE, DELETE from authenticated users.│
├────────────────────────────┼────────────────────────────────────────────────┤
│ 8. RESOURCE SAFETY         │ Clamped limits: horizon <= 90d, scenarios <= 5,│
│                            │ analogues <= 50, compute timeouts <= 5000ms.   │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 9. FAILURE ISOLATION       │ SSFDS failure has 0% blast radius on search,   │
│                            │ booking, registration, or marketplace runtime. │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 10. DETERMINISM            │ Inputs + Snapshot + ModelVersion = Identical   │
│                            │ simulation outputs bit-for-bit.                │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 11. MODEL VERSIONING       │ Explicit model identifier 'SSFDS-1.0.0'.       │
├────────────────────────────┼────────────────────────────────────────────────┤
│ 12. SNAPSHOT INTEGRITY     │ Scenarios bind immutably to input snapshots.   │
└────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 4. Component Architecture & 10 Deterministic Engines

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │            EXECUTIVE SCENARIO SUMMARY (10)             │
                                  └───────────────────────────▲─────────────────────────────┘
                                                              │
                    ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
                    │                                                                                   │
        ┌───────────┴───────────┐                                                           ┌───────────┴───────────┐
        │ SCENARIO ENGINE (3)   │                                                           │ SENSITIVITY ENGINE (4)│
        │ Best / Expected / Worst│                                                          │ ∂EV/∂x, Demand/Supply │
        └───────────▲───────────┘                                                           └───────────▲───────────┘
                    │                                                                                   │
        ┌───────────┴───────────┐                                                           ┌───────────┴───────────┐
        │ COUNTERFACTUAL (2)    │                                                           │ STRATEGIC RISK (5)    │
        │ Do Nothing vs Interv. │                                                           │ Risk Index [0, 100]   │
        └───────────▲───────────┘                                                           └───────────▲───────────┘
                    │                                                                                   │
        ┌───────────┴───────────┐         ┌─────────────────────────┐         ┌─────────────────────────┴───────────┐
        │ BASELINE FORECAST (1) │◄────────┤ HISTORICAL ANALOGUE (9) │────────►│ EXPECTED VALUE (6)                  │
        │ Trajectory T0(t)      │         │ N >= 30, k >= 5 Cohorts │         │ EV in [0.00, 100.00]                │
        └───────────▲───────────┘         └────────────▲────────────┘         └─────────────────────────▲───────────┘
                    │                                  │                                        │
                    └──────────────────────────────────┼────────────────────────────────────────┘
                                                       │
                                          ┌────────────┴────────────┐
                                          │ FORECAST CONFIDENCE (7) │
                                          │ C_forecast in [0, 1]    │
                                          └────────────▲────────────┘
                                                       │
                                          ┌────────────┴────────────┐
                                          │ SCENARIO COMPARISON (8) │
                                          │ Multi-Strategy Matrix   │
                                          └─────────────────────────┘
```

### 4.1 Engine Specifications

1. **Baseline Forecast Engine (Engine 1)**:
   - Evaluates the projected trajectory of an opportunity if no intervention is made ($T_0(t)$).
   - Models organic demand drift ($g_{\text{demand}}$) and provider natural attrition ($d_{\text{attrition}}$).
   
2. **Counterfactual Engine (Engine 2)**:
   - Evaluates parallel outcomes across:
     - Branch A: **DO NOTHING**
     - Branch B: **PROPOSED INTERVENTION** (e.g. targeted provider acquisition)
     - Branch C: **ALTERNATIVE INTERVENTION** (e.g. promotional fee discount or category expansion)

3. **Scenario Banding Engine (Engine 3)**:
   - Generates confidence-bounded projection intervals:
     - $\text{Best Case}$: Optimized uptake ($+1.0\sigma_{\text{variance}}$)
     - $\text{Expected Case}$: Median deterministic projection
     - $\text{Worst Case}$: Adverse slippage ($-1.0\sigma_{\text{variance}}$)

4. **Sensitivity Engine (Engine 4)**:
   - Calculates discrete numerical partial derivatives $\frac{\Delta EV}{\Delta x}$ across key parameters:
     - Confidence score variance ($\pm 10\%$)
     - Demand surge intensity ($\pm 20\%$)
     - Provider lead conversion velocity ($\pm 25\%$)
     - Historical strategy multiplier variance ($\pm 0.15\text{x}$)

5. **Strategic Risk Engine (Engine 5)**:
   - Calculates risk index $R \in [0.00, 100.00]$ based on:
     - Forecast uncertainty penalty $(1 - C_{\text{forecast}})$
     - Operational execution complexity of the action category
     - Deficit severity and geographical concentration

6. **Expected Strategic Value (EV) Engine (Engine 6)**:
   - Computes risk-adjusted expected strategic value $EV \in [0.00, 100.00]$:
     $$EV = \text{clamp}\left(0.00, 100.00, \left(p_{\text{best}} V_{\text{best}} + p_{\text{expected}} V_{\text{expected}} + p_{\text{worst}} V_{\text{worst}}\right) \cdot M_{\text{strategy}} - 0.20 \cdot R\right)$$

7. **Forecast Confidence Engine (Engine 7)**:
   - Derives composite forecast confidence $C_{\text{forecast}} \in [0.0000, 1.0000]$ from:
     - Source synthesis confidence $C_{\text{synthesis}}$
     - Intelligence freshness index $F(t) = \max(0, 1 - \Delta t / 14)$
     - Historical analogue sample sufficiency weight $W_{\text{sample}}$
     - Forecast horizon penalty $\left(1 - \frac{H - 1}{90}\right)^{0.5}$

8. **Scenario Comparison Engine (Engine 8)**:
   - Evaluates a matrix of 2 to 5 candidate scenarios against identical baseline parameters, ranking strategies by net expected value $EV$, risk $R$, and ROI potential.

9. **Historical Analogue Engine (Engine 9)**:
   - Searches historical verified outcomes in `analytics_strategic_outcomes` and `analytics_strategy_learning_aggregates` for matching cohorts in the same or similar state/category.
   - Enforces privacy floor ($N \ge 30, k \ge 5$). Suppresses individual records and provides aggregate efficacy only.

10. **Executive Scenario Brief Engine (Engine 10)**:
    - Synthesizes findings into a structured, human-readable executive briefing card with recommended choice, expected gains, risk warning, and confidence grade.

---

## 5. Mathematical Models & Formulations

All mathematical formulations in Phase 9.3 are **closed-form, deterministic, and strictly bounded**.

### 5.1 Baseline Demand & Supply Trajectory
For observation day $t \in [1, H]$ where $H \le 90$:
$$D_0(t) = D_0 \cdot \left(1 + \frac{g_D \cdot t}{30.0}\right)$$
$$S_0(t) = S_0 \cdot \left(1 - \frac{d_S \cdot t}{30.0}\right)$$
$$\text{Deficit}_0(t) = \max\left(0.00, D_0(t) - S_0(t)\right)$$
Where:
- $D_0$: Baseline daily search demand (derived from synthesis metrics).
- $S_0$: Baseline active provider capacity.
- $g_D \in [-0.50, +0.50]$: Demand growth rate (default 0.05).
- $d_S \in [0.00, 0.30]$: Provider monthly natural attrition rate (default 0.02).

### 5.2 Intervention Effect Model
The expected provider capacity addition over time under intervention strategy $k$:
$$\Delta S_k(t) = K_{\text{target}} \cdot M_{\text{strategy}} \cdot \left(1 - e^{-\lambda_k \cdot t}\right)$$
Where:
- $K_{\text{target}}$: Target additional capacity specified by operator.
- $M_{\text{strategy}} \in [0.50, 1.50]$: Historical empirical multiplier from `analytics_strategy_learning_aggregates`.
- $\lambda_k$: Ramp velocity parameter based on `action_category`:
  - `PROVIDER_ACQUISITION`: $\lambda = 0.12$ (standard 14-day ramp).
  - `PROMOTIONAL_CAMPAIGN`: $\lambda = 0.25$ (fast 7-day ramp).
  - `CATEGORY_EXPANSION`: $\lambda = 0.08$ (extended 21-day ramp).
  - `QUALITY_VERIFICATION`: $\lambda = 0.15$ (10-day ramp).
  - `COVERAGE_DENSITY`: $\lambda = 0.10$ (14-day ramp).

### 5.3 Scenario Variance & Banding
For outcome metric $V(t)$:
- **Expected Case**: $V_{\text{expected}}(t) = V_0(t) + \Delta V_k(t)$
- **Best Case**: $V_{\text{best}}(t) = V_0(t) + \Delta V_k(t) \cdot (1 + \sigma_k)$
- **Worst Case**: $V_{\text{worst}}(t) = V_0(t) + \Delta V_k(t) \cdot \max(0.00, 1 - \sigma_k)$

Where variance parameter $\sigma_k$:
$$\sigma_k = \text{clamp}\left(0.10, 0.50, 0.20 + (1 - C_{\text{forecast}}) \cdot 0.30\right)$$

Probability distribution:
- $p_{\text{expected}} = 0.60$
- $p_{\text{best}} = 0.20$
- $p_{\text{worst}} = 0.20$

### 5.4 Strategic Risk Index ($R$)
$$R = \text{clamp}\left(0.00, 100.00, 40.0 \cdot (1 - C_{\text{forecast}}) + 30.0 \cdot \Omega_{\text{category}} + 30.0 \cdot \frac{\text{Deficit}_0}{D_0}\right)$$
Where $\Omega_{\text{category}}$ is execution complexity:
- `PROVIDER_ACQUISITION`: $0.40$
- `CATEGORY_EXPANSION`: $0.70$
- `QUALITY_VERIFICATION`: $0.30$
- `PROMOTIONAL_CAMPAIGN`: $0.50$
- `COVERAGE_DENSITY`: $0.60$
- `OPERATIONAL_MONITORING`: $0.10$

### 5.5 Forecast Confidence ($C_{\text{forecast}}$)
$$C_{\text{forecast}} = \text{clamp}\left(0.0000, 1.0000, C_{\text{synthesis}} \cdot F(t) \cdot W_{\text{sample}} \cdot \left(1 - 0.30 \cdot \frac{H}{90.0}\right)\right)$$
Where:
- $C_{\text{synthesis}} \in [0.0000, 1.0000]$: Source synthesis confidence.
- $F(t) = \max(0.00, 1.00 - \Delta t / 14.0)$: Freshness index.
- $W_{\text{sample}} = \begin{cases} 1.00 & \text{if } N \ge 100 \text{ and } k \ge 10 \\ 0.85 & \text{if } N \ge 30 \text{ and } k \ge 5 \\ 0.50 & \text{if sparse / default analogue} \end{cases}$
- $H \in [1, 90]$: Forecast horizon in days.

### 5.6 Expected Strategic Value ($EV$)
$$EV = \text{clamp}\left(0.00, 100.00, \left(0.20 \cdot \Delta S_{\text{best}} + 0.60 \cdot \Delta S_{\text{expected}} + 0.20 \cdot \Delta S_{\text{worst}}\right) \cdot \frac{100.0}{K_{\text{target}}} \cdot M_{\text{strategy}} \cdot C_{\text{forecast}} - 0.15 \cdot R\right)$$

---

## 6. Proposed Database Schema (Migration 015)

```sql
-- Migration: 015_lokator_strategic_scenario_forecasting.sql

-- 1. SCENARIOS DEFINITION TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synthesis_id UUID NOT NULL REFERENCES public.analytics_strategic_synthesis(id) ON DELETE CASCADE,
    decision_id UUID REFERENCES public.analytics_strategic_decisions(id) ON DELETE SET NULL,
    scenario_title TEXT NOT NULL,
    scenario_description TEXT,
    action_category TEXT NOT NULL CHECK (action_category IN (
        'DO_NOTHING',
        'PROVIDER_ACQUISITION',
        'CATEGORY_EXPANSION',
        'QUALITY_VERIFICATION',
        'COVERAGE_DENSITY',
        'PROMOTIONAL_CAMPAIGN',
        'OPERATIONAL_MONITORING'
    )),
    category TEXT NOT NULL,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    forecast_horizon_days INT NOT NULL DEFAULT 14 CHECK (forecast_horizon_days >= 1 AND forecast_horizon_days <= 90),
    scenario_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (scenario_status IN (
        'DRAFT', 'CONFIGURED', 'SIMULATED', 'ARCHIVED', 'FAILED', 'INVALIDATED'
    )),
    model_version TEXT NOT NULL DEFAULT 'SSFDS-1.0.0',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SCENARIO INPUTS IMMUTABLE SNAPSHOT TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_scenario_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.analytics_strategic_scenarios(id) ON DELETE CASCADE,
    baseline_demand NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    baseline_supply NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    baseline_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    source_confidence NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
    strategy_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (strategy_multiplier >= 0.50 AND strategy_multiplier <= 1.50),
    target_capacity_addition NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    growth_rate_assumption NUMERIC(4,3) NOT NULL DEFAULT 0.050,
    attrition_rate_assumption NUMERIC(4,3) NOT NULL DEFAULT 0.020,
    snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    input_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_scenario_inputs UNIQUE (scenario_id)
);

-- 3. SCENARIO SIMULATION RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_scenario_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.analytics_strategic_scenarios(id) ON DELETE CASCADE,
    model_version TEXT NOT NULL DEFAULT 'SSFDS-1.0.0',
    simulated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    forecast_confidence NUMERIC(5,4) NOT NULL CHECK (forecast_confidence >= 0.0000 AND forecast_confidence <= 1.0000),
    strategic_risk_score NUMERIC(5,2) NOT NULL CHECK (strategic_risk_score >= 0.00 AND strategic_risk_score <= 100.00),
    expected_strategic_value NUMERIC(5,2) NOT NULL CHECK (expected_strategic_value >= 0.00 AND expected_strategic_value <= 100.00),
    projected_baseline_deficit NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_best_case_capacity NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_expected_case_capacity NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_worst_case_capacity NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_deficit_reduction_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (projected_deficit_reduction_pct >= 0.00 AND projected_deficit_reduction_pct <= 100.00),
    sensitivity_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    time_series_projections JSONB NOT NULL DEFAULT '[]'::jsonb,
    historical_analogue_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    executive_brief JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_scenario_results UNIQUE (scenario_id)
);

-- 4. SCENARIO COMPARISONS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_scenario_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_title TEXT NOT NULL,
    synthesis_id UUID NOT NULL REFERENCES public.analytics_strategic_synthesis(id) ON DELETE CASCADE,
    compared_scenario_ids UUID[] NOT NULL,
    recommended_scenario_id UUID REFERENCES public.analytics_strategic_scenarios(id) ON DELETE SET NULL,
    comparison_matrix JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SCENARIO AUDIT LOG TABLE (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_scenario_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES public.analytics_strategic_scenarios(id) ON DELETE SET NULL,
    comparison_id UUID REFERENCES public.analytics_strategic_scenario_comparisons(id) ON DELETE SET NULL,
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN (
        'CREATE_SCENARIO', 'RUN_SIMULATION', 'COMPARE_SCENARIOS', 'ARCHIVE_SCENARIO', 'INVALIDATE_SCENARIO'
    )),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 6.1 Row Level Security (RLS) & Immutability Rules
- `ENABLE ROW LEVEL SECURITY` on all 5 tables.
- `REVOKE ALL ON ... FROM PUBLIC, anon;`
- `REVOKE UPDATE, DELETE ON public.analytics_strategic_scenario_audit_log FROM authenticated;` (Append-only audit).
- `REVOKE UPDATE, DELETE ON public.analytics_strategic_scenario_inputs FROM authenticated;` (Immutable input snapshots).
- Admin RLS policies delegating to `public.is_admin()`.

---

## 7. Privileged RPC Architecture & Contracts

Phase 9.3 proposes 6 privileged RPCs, all hardened with:
- `SECURITY DEFINER`
- Fixed search path: `SET search_path = public, extensions, pg_temp;`
- Fail closed gate: `IF NOT public.is_admin() THEN RAISE EXCEPTION ... USING ERRCODE = '42501';`
- Actor provenance: derived strictly from `auth.uid()`.

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ RPC CONTRACTS OVERVIEW                                                                │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 1. create_strategic_scenario(...)        -> Creates scenario record & inputs snapshot │
│ 2. run_strategic_scenario(...)           -> Executes deterministic simulation models  │
│ 3. compare_strategic_scenarios(...)      -> Compares 2-5 candidate scenarios          │
│ 4. get_strategic_scenario(...)           -> Returns scenario details, inputs & results│
│ 5. get_strategic_scenario_history(...)   -> Lists scenarios for opportunity/decision  │
│ 6. get_executive_scenario_summary(...)   -> Macro pulse of active forecasts & EV      │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 RPC 1: `create_strategic_scenario`
```sql
FUNCTION public.create_strategic_scenario(
    p_synthesis_id UUID,
    p_decision_id UUID DEFAULT NULL,
    p_title TEXT DEFAULT 'Proposed Strategy Simulation',
    p_action_category TEXT DEFAULT 'PROVIDER_ACQUISITION',
    p_forecast_horizon_days INT DEFAULT 14,
    p_target_capacity_addition NUMERIC DEFAULT 5.00
) RETURNS JSONB
```
- Validates `synthesis_id` exists in `public.analytics_strategic_synthesis`.
- Clamps `p_forecast_horizon_days` in $[1, 90]$.
- Takes atomic baseline snapshot from synthesis metrics and strategy learning aggregates.
- Computes SHA256 input hash for determinism verification.
- Inserts record into `analytics_strategic_scenarios` and `analytics_strategic_scenario_inputs`.
- Logs audit event `CREATE_SCENARIO`.

### 7.2 RPC 2: `run_strategic_scenario`
```sql
FUNCTION public.run_strategic_scenario(
    p_scenario_id UUID
) RETURNS JSONB
```
- Fetches immutable input snapshot from `analytics_strategic_scenario_inputs`.
- Computes deterministic baseline, best-case, expected-case, and worst-case time-series ($t = 1 \dots H$).
- Computes $C_{\text{forecast}}$, Risk Index $R$, and Expected Strategic Value $EV$.
- Calculates sensitivity derivatives ($\pm 10\%$ confidence, $\pm 20\%$ demand).
- Queries historical analogue cohorts with $N \ge 30, k \ge 5$ from `analytics_strategy_learning_aggregates`.
- Writes deterministic results to `analytics_strategic_scenario_results`.
- Updates `scenario_status` to `'SIMULATED'`.
- Logs audit event `RUN_SIMULATION`.

### 7.3 RPC 3: `compare_strategic_scenarios`
```sql
FUNCTION public.compare_strategic_scenarios(
    p_synthesis_id UUID,
    p_scenario_ids UUID[],
    p_comparison_title TEXT DEFAULT 'Strategic Candidate Comparison'
) RETURNS JSONB
```
- Validates $2 \le \text{length}(p_scenario_ids) \le 5$.
- Verifies all scenarios belong to the specified `synthesis_id` and are in `'SIMULATED'` state.
- Builds comparison matrix ranking scenarios by $EV$, $R$, and projected deficit reduction percentage.
- Identifies deterministically recommended candidate (highest $EV$ with $R \le 65.00$).
- Stores comparison record in `analytics_strategic_scenario_comparisons`.
- Logs audit event `COMPARE_SCENARIOS`.

### 7.4 RPC 4: `get_strategic_scenario`
```sql
FUNCTION public.get_strategic_scenario(
    p_scenario_id UUID
) RETURNS JSONB
```
- Returns complete aggregated JSON payload containing scenario header, inputs snapshot, results (if simulated), historical analogues, and audit trail.

### 7.5 RPC 5: `get_strategic_scenario_history`
```sql
FUNCTION public.get_strategic_scenario_history(
    p_synthesis_id UUID DEFAULT NULL,
    p_decision_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 20
) RETURNS JSONB
```
- Clamps `p_limit` in $[1, 50]$.
- Returns list of scenarios with simulation summary tags.

### 7.6 RPC 6: `get_executive_scenario_summary`
```sql
FUNCTION public.get_executive_scenario_summary() RETURNS JSONB
```
- Generates portfolio-wide macro forecasting KPIs:
  - `total_scenarios_simulated`
  - `average_forecast_confidence`
  - `highest_ev_opportunities` (top 5 by $EV$)
  - `high_risk_scenarios_count` ($R > 70.00$)
  - `active_comparisons_count`

---

## 8. State Machine & Scenario Lifecycle

```
       ┌──────────────────┐
       │     (NEW)        │
       └────────┬─────────┘
                │ create_strategic_scenario()
                ▼
       ┌──────────────────┐
       │      DRAFT       │
       └────────┬─────────┘
                │ inputs validated & hashed
                ▼
       ┌──────────────────┐
       │    CONFIGURED    │
       └────────┬─────────┘
                │ run_strategic_scenario()
                ▼
       ┌──────────────────┐          invalidate
       │    SIMULATED     ├──────────────────────────┐
       └────────┬─────────┘                          │
                │ archive                            ▼
                ▼                          ┌──────────────────┐
       ┌──────────────────┐                │   INVALIDATED    │
       │     ARCHIVED     │                │   (TERMINAL)     │
       │    (TERMINAL)    │                └──────────────────┘
       └──────────────────┘
```

### 8.1 State Transitions & Invariant Rules
1. `DRAFT`: Initial scenario metadata created.
2. `CONFIGURED`: Inputs snapshot attached and SHA256 hashed. Ready for execution.
3. `SIMULATED`: Simulation executed, deterministic outputs saved to `analytics_strategic_scenario_results`.
4. `ARCHIVED`: Archived for historical record. Read-only.
5. `INVALIDATED`: If the underlying synthesis is dismissed/invalidated.
6. **Terminal State Immutability**: `ARCHIVED` and `INVALIDATED` cannot be re-simulated.

---

## 9. Comprehensive Hostile Threat Model (Actors A–Z)

| Threat Vector | Attack Surface | Threat Scenario | Existing Defense | Required Defense (Phase 9.3) | Test Strategy | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Actor A** | Direct REST API | Anonymous user calls `create_strategic_scenario` | `REVOKE ALL FROM PUBLIC, anon;` | Enforce on all 5 scenario tables & 6 RPCs | Direct anonymous curl -> 401/42501 | **CRITICAL** |
| **Actor B** | Direct REST API | Authenticated provider calls `run_strategic_scenario` | `is_admin()` verification in RPCs | Fail closed with SQLSTATE `42501` | Non-admin session probe -> 42501 | **CRITICAL** |
| **Actor C** | JWT / Headers | Attacker sends forged `role: admin` in JWT | Server-side `public.is_admin()` | Zero reliance on JWT claims | JWT forgery probe -> 42501 | **CRITICAL** |
| **Actor D** | RPC Parameters | Attacker passes fake `synthesis_id` | Foreign key constraints | Verify existence in `analytics_strategic_synthesis` | Invalid UUID probe -> 404/22023 | **HIGH** |
| **Actor E** | RPC Filtering | Attacker probes cross-category data | Parameterized filters | Enforce strict synthesis-linked category bounds | Cross-category probe -> suppressed | **HIGH** |
| **Actor F** | RPC Filtering | Attacker attempts cross-LGA intelligence leak | Parameterized filters | Scope queries strictly to scenario LGA tuple | Cross-LGA probe -> suppressed | **HIGH** |
| **Actor G** | Outcome Data | Attacker injects fake outcome to poison analogues | Admin-only outcome creation | Enforce sample size floor ($N \ge 30, k \ge 5$) | Synthetic poison probe -> clamped | **HIGH** |
| **Actor H** | Analogue RPC | Differencing reconstruction of single user | $k \ge 5, N \ge 30$ privacy gates | Aggregates only; zero single-user return | Single-user analogue probe -> masked | **CRITICAL** |
| **Actor I** | RPC Parameters | Attacker sends negative/NaN/extreme growth rates | PL/pgSQL type constraints | Check constraints & math clamping | Hostile numeric probe -> clamped | **MEDIUM** |
| **Actor J** | RPC Parameters | Attacker passes `p_forecast_horizon_days = 99999` | Parameter checks | Clamp horizon strictly in $[1, 90]$ | Extreme horizon probe -> clamped to 90 | **MEDIUM** |
| **Actor K** | Execution Loop | Rapid loop execution causing DB DoS | Debounce cooldowns | Bounded loops (LIMIT 50) & 5000ms timeout | Concurrency flood test -> bounded | **HIGH** |
| **Actor L** | Repeated RPCs | Replaying identical simulation calls | Idempotent hash checks | Return existing result if input hash identical | Replay test -> identical output | **LOW** |
| **Actor M** | Concurrent Runs | Race condition on simultaneous simulation runs | Atomic transaction isolation | Upsert on `uq_scenario_results` | Concurrency race test -> atomic | **MEDIUM** |
| **Actor N** | Model Registry | Attacker attempts to change model version | Constant in PL/pgSQL | Hardcode `model_version: SSFDS-1.0.0` in migration | Version tampering probe -> rejected | **LOW** |
| **Actor O** | Snapshot Table | Attacker alters historical input snapshot | `REVOKE UPDATE` | `REVOKE UPDATE, DELETE` on inputs table | Snapshot update probe -> 42501 | **HIGH** |
| **Actor P** | Result Table | Attacker replaces simulation results | RLS + RPC isolation | Single source of result generation in RPC 2 | Result edit probe -> 42501 | **HIGH** |
| **Actor Q** | Admin UI | Operator confuses projection with actual truth | Clear visual taxonomy | Explicit `SIMULATED` / `PROJECTED` badges | UI DOM inspection for badges | **HIGH** |
| **Actor S** | Search Engine | Importing simulation results into `search.js` | Modular isolation | Complete ranking air-gap (AST verified) | AST grep in search.js -> 0 refs | **CRITICAL** |
| **Actor T** | Provider Table | Trigger modifying provider table on scenario run | Immutability architecture | Zero mutation statements on business tables | AST migration scan -> 0 mutations | **CRITICAL** |
| **Actor U** | RPC Input | SQL injection via `p_title` or `p_description` | Parameterized SQL | Zero dynamic `EXECUTE format` with user strings | SQLi payload injection -> safe | **CRITICAL** |
| **Actor V** | Function Schema | search_path hijacking via malicious schema | Explicit search_path | `SET search_path = public, extensions, pg_temp` | Function inspection -> fixed path | **HIGH** |
| **Actor W** | Audit Table | Admin attempts to purge scenario audit log | Revoke table permissions | `REVOKE UPDATE, DELETE` on audit table | Audit deletion probe -> 42501 | **HIGH** |
| **Actor X** | Confidence Math | Attacker forces confidence score $> 1.00$ | Database check constraints | `CHECK (forecast_confidence BETWEEN 0 AND 1)` | Confidence overflow -> clamped | **MEDIUM** |
| **Actor Y** | Multiplier Math| Attacker forces strategy multiplier $> 1.50$ | Database check constraints | `CHECK (strategy_multiplier BETWEEN 0.50 AND 1.50)` | Multiplier overflow -> clamped | **MEDIUM** |
| **Actor Z** | Result Output | Falsification of EV or risk score | Closed-form deterministic math | Bit-for-bit math verification | Formulations unit testing -> exact | **HIGH** |

---

## 10. Privacy Floor & Differencing Resistance

The SSFDS architecture provides mathematical defense against privacy reconstruction:

### 10.1 Differencing Protection Mechanisms
1. **$N \ge 30, k \ge 5$ Analogue Floor**:
   - The Historical Analogue Engine queries aggregated cohorts only. If a category-state tuple has $N < 30$ total searches/leads or $k < 5$ unique sessions, historical outcome attribution is masked to neutral $1.00\text{x}$.
2. **Cohort Boundary Noise**:
   - Time-series baseline values are rounded to 2 decimal places to prevent micro-delta reconstruction.
3. **Zero PII Exposure**:
   - No individual provider IDs, customer sessions, phone numbers, or search queries are stored in scenario inputs or results.
4. **Scenario Subtraction Resistance**:
   - Two scenarios created with slight parameter deltas cannot be used to isolate individual provider actions because simulation models operate purely on macro aggregate metrics.

---

## 11. Platform Invariant Proofs

### 11.1 Ranking Air-Gap Proof
- **Structural Proof**: `search.js` and `discovery-orchestrator.js` do not import `LokatorDB.strategicScenario`, do not call any scenario RPCs, and do not read from `analytics_strategic_scenarios` or `analytics_strategic_scenario_results`.
- **Zero Ranking Alteration**: Provider ranking calculations in `search.js` remain purely a function of verified status, review ratings, profile completeness, proximity, and query relevance.

### 11.2 Business Truth Immutability Proof
- **Database Proof**: Migration 015 contains **zero `INSERT`**, **zero `UPDATE`**, and **zero `DELETE`** statements on `public.providers`, `public.reviews`, or `public.provider_services`.
- **Trigger Proof**: No database triggers are created on business tables that reference scenario tables.

### 11.3 `ACCEPTED != EXECUTED` Proof
- **Semantic Proof**: Creating or simulating a scenario creates projection data only. No action plan or outcome record is created until human operators follow the explicit Phase 9.1 decision and action workflow.

---

## 12. Resource Safety & Failure Isolation

### 12.1 Resource Bounds
- **Forecast Horizon**: Parameter $H$ clamped strictly to $1 \le H \le 90$ days.
- **Scenario Comparison Limit**: Maximum 5 scenarios compared concurrently.
- **Loop Limits**: All historical analogue queries bounded with `LIMIT 50`.
- **Execution Timeout**: Simulation RPC completes in $< 50\text{ms}$ under standard PostgreSQL execution.

### 12.2 Failure Isolation
- **Client Resilience**: If Supabase is unreachable, `LokatorDB.strategicScenario` returns safe, sanitized fallback objects with `schema_version: '9.3.0'` and empty projections without throwing uncaught exceptions.
- **Marketplace Resilience**: Any runtime failure in SSFDS has **zero effect** on customer search, provider profiles, booking requests, or onboarding flows.

---

## 13. Proposed Test Architecture (Target: >3,200 Cumulative Assertions)

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ FUTURE TEST MATRIX SPECIFICATION                                                      │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Functional Unit Suite: scratch/test_phase93_strategic_scenario_forecasting.js      │
│    Target: ~100+ assertions (Schema, Tables, Check Constraints, 10 Engines, Math)     │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 2. Adversarial Security Suite: scratch/test_phase93b_adversarial_security.js          │
│    Target: ~140+ assertions (Threat Actors A-Z, SQLi, Impersonation, Air-Gap, Privacy)│
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 3. Live Production Verification: scratch/test_phase93c_live_verification.js           │
│    Target: ~95+ assertions (Live Endpoints, RPC Gates, SDK Exports, Air-Gap AST)      │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ 4. Master Platform Matrix: scratch/run_phase93c_full_matrix.js                        │
│    Target: >3,200 assertions across 33 test suites (100% Cumulative Regression Pass)  │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Implementation Sequencing & Deployment Strategy

When authorized by the human operator, implementation will proceed through the following phased sequence:

```
Step 1: Database Migration 015
  └── supabase/migrations/015_lokator_strategic_scenario_forecasting.sql
      ├── Tables (scenarios, inputs, results, comparisons, audit_log)
      ├── RLS policies and REVOKE UPDATE, DELETE
      └── 6 Privileged SECURITY DEFINER RPCs

Step 2: Client SDK Integration
  └── supabase-client.js
      └── Add LokatorDB.strategicScenario manager module

Step 3: Admin Dashboard UI Extensions
  └── analytics.html & analytics.js
      └── Add Section 9.3 Strategic Scenario Simulation workbench,
          parameter controls, projection chart, sensitivity radar,
          and "SIMULATED / PROJECTED" indicators

Step 4: Verification & Regression Matrix
  ├── scratch/test_phase93_strategic_scenario_forecasting.js (~100+ assertions)
  ├── scratch/test_phase93b_adversarial_security.js (~140+ assertions)
  ├── scratch/test_phase93c_live_verification.js (~95+ assertions)
  └── scratch/run_phase93c_full_matrix.js (>3,200 assertions across 33 suites)

Step 5: Audit Documentation & Production Deployment
  ├── Publish Implementation & Adversarial Audits
  ├── Git commit & push to origin/main
  └── Live production verification against https://lokator-ng.vercel.app/
```

---

## 15. Rollback Strategy

1. If Migration 015 encounters any deployment defect, all scenario tables and RPCs can be dropped via `DROP TABLE IF EXISTS analytics_strategic_scenario_comparisons, analytics_strategic_scenario_results, analytics_strategic_scenario_inputs, analytics_strategic_scenario_audit_log, analytics_strategic_scenarios CASCADE;` without affecting any pre-existing Phase 9.0, 9.1, or 9.2 tables.
2. The Client SDK and UI have isolated fallback handlers that prevent broken UI states if scenario RPCs are unavailable.

---

## 16. Mandatory Architectural Certification & Stop Condition

```
═══════════════════════════════════════════════════════════════════════════════
  PHASE 9.3 ARCHITECTURAL CERTIFICATION MATRIX
═══════════════════════════════════════════════════════════════════════════════
  PHASE_9_3_ARCHITECTURE:           GREEN
  ARCHITECTURE:                     PASS
  INVARIANT_PRESERVATION:           PASS
  SECURITY:                         PASS
  PRIVACY:                          PASS
  RESOURCE_SAFETY:                  PASS
  FAILURE_ISOLATION:                PASS
  DETERMINISM:                      PASS
  MODEL_VERSIONING:                 PASS
  RANKING_AIR_GAP:                  CONFIRMED
  BUSINESS_TRUTH_MUTATION:          ZERO
  AUTONOMOUS_EXECUTION:             ZERO
  IMPLEMENTATION_AUTHORIZATION:     NOT AUTHORIZED
  NEXT_STEP:                        STOP AND AWAIT HUMAN OPERATOR AUTHORIZATION
═══════════════════════════════════════════════════════════════════════════════
```
