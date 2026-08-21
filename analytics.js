/**
 * LOKATOR.NG — INTERNAL ANALYTICS DASHBOARD CONTROLLER (analytics.js)
 * Fetches server-aggregated analytics summaries via secure SECURITY DEFINER RPCs.
 * Conceals raw session IDs, applies k-anonymity (k >= 5) and displays observational metrics.
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const timeWindowSelect = document.getElementById('time-window');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnRunPrune = document.getElementById('btn-run-prune');
  const btnRunSummary = document.getElementById('btn-run-summary');
  const retentionStatus = document.getElementById('retention-status');

  async function loadAnalytics() {
    const days = parseInt(timeWindowSelect.value, 10) || 30;

    try {
      // 1. Fetch Executive Platform Health
      const exec = await LokatorDB.analytics.getExecutiveSummary(days);
      if (exec) {
        document.getElementById('kpi-total-events').textContent = (exec.total_events || 0).toLocaleString();
        document.getElementById('kpi-total-sessions').textContent = (exec.total_sessions_approx || 0).toLocaleString();
        document.getElementById('kpi-error-rate').textContent = (exec.client_error_count > 0 && exec.total_events > 0)
          ? ((exec.client_error_count / exec.total_events) * 100).toFixed(2) + '%'
          : '0.00%';
        document.getElementById('kpi-error-count').textContent = `${exec.client_error_count || 0} client errors`;
        document.getElementById('kpi-no-results-rate').textContent = `${exec.no_results_rate || 0}%`;
        document.getElementById('kpi-search-count').textContent = `${exec.search_count || 0} searches`;
      }

      // 2. Fetch Funnel Summary
      const funnel = await LokatorDB.analytics.getFunnelSummary(days);
      if (funnel) {
        const pf = funnel.provider_funnel || {};
        document.getElementById('funnel-reg-started').textContent = (pf.registration_started || 0).toLocaleString();
        document.getElementById('funnel-reg-val-failed').textContent = (pf.validation_failed || 0).toLocaleString();
        document.getElementById('funnel-reg-submitted').textContent = (pf.registration_submitted || 0).toLocaleString();
        document.getElementById('rate-form-completion').textContent = `${pf.form_completion_rate || 0}% Completion`;
        document.getElementById('funnel-reg-succeeded').textContent = (pf.registration_succeeded || 0).toLocaleString();
        document.getElementById('rate-creation-success').textContent = `${pf.creation_success_rate || 0}% Success`;
        document.getElementById('funnel-login-succeeded').textContent = (pf.login_succeeded || 0).toLocaleString();
        document.getElementById('rate-login-success').textContent = `${pf.login_success_rate || 0}% Login Pass`;
        document.getElementById('funnel-dash-engagements').textContent = `${pf.dashboard_engagements || 0} updates`;

        const cf = funnel.customer_funnel || {};
        document.getElementById('funnel-cat-browses').textContent = (cf.category_browses || 0).toLocaleString();
        document.getElementById('funnel-searches').textContent = (cf.searches || 0).toLocaleString();
        document.getElementById('funnel-profile-views').textContent = (cf.profile_views || 0).toLocaleString();
        document.getElementById('funnel-total-leads').textContent = `${(cf.total_contact_leads || 0).toLocaleString()} leads`;
        document.getElementById('rate-profile-conversion').textContent = `${cf.profile_lead_conversion_rate || 0}% Lead Rate`;
        document.getElementById('funnel-reviews').textContent = (cf.reviews_submitted || 0).toLocaleString();
      }

      // 3. Fetch Core Web Vitals Summary
      const cwv = await LokatorDB.analytics.getPerformanceSummary(days);
      if (cwv) {
        const p75 = cwv.p75_metrics || {};
        document.getElementById('cwv-lcp').textContent = p75.lcp_ms ? `${p75.lcp_ms}ms` : '—';
        document.getElementById('cwv-inp').textContent = p75.inp_ms ? `${p75.inp_ms}ms` : '—';
        document.getElementById('cwv-cls').textContent = (p75.cls !== null && p75.cls !== undefined) ? p75.cls : '—';
        document.getElementById('cwv-ttfb').textContent = p75.ttfb_ms ? `${p75.ttfb_ms}ms` : '—';
        document.getElementById('cwv-fcp').textContent = p75.fcp_ms ? `${p75.fcp_ms}ms` : '—';
        document.getElementById('cwv-dom').textContent = p75.dom_ready_ms ? `${p75.dom_ready_ms}ms` : '—';
        document.getElementById('cwv-splash').textContent = p75.pwa_splash_ms ? `${p75.pwa_splash_ms}ms` : '—';

        const badge = document.getElementById('cwv-status-badge');
        if (badge) {
          badge.textContent = cwv.status || 'INSTRUMENTATION_ONLY';
          if (cwv.status === 'REPRESENTATIVE_PRODUCTION') {
            badge.className = 'status-tag status-good';
          } else {
            badge.className = 'status-tag status-notice';
          }
        }
      }

      // 4. Fetch Operational Anomaly Intelligence Summary
      const anomaly = await LokatorDB.analytics.getAnomalySummary(days, 2.5);
      if (anomaly) {
        const platformBadge = document.getElementById('anomaly-platform-status');
        const anomalyList = document.getElementById('anomaly-list');
        const summaryText = document.getElementById('anomaly-summary-text');

        if (platformBadge) {
          platformBadge.textContent = anomaly.platform_status || 'HEALTHY';
          if (anomaly.platform_status === 'CRITICAL') {
            platformBadge.className = 'status-tag';
            platformBadge.style.background = 'rgba(239, 68, 68, 0.25)';
            platformBadge.style.color = '#F87171';
          } else if (anomaly.platform_status === 'WARNING') {
            platformBadge.className = 'status-tag status-notice';
          } else if (anomaly.platform_status === 'DATA_INSUFFICIENT') {
            platformBadge.className = 'status-tag';
            platformBadge.style.background = 'rgba(100, 116, 139, 0.25)';
            platformBadge.style.color = '#94A3B8';
          } else {
            platformBadge.className = 'status-tag status-good';
          }
        }

        if (summaryText) {
          summaryText.textContent = `Evaluated across ${days}-day window (z-score threshold: 2.5). Status: ${anomaly.platform_status}. Total anomalies: ${anomaly.anomalies_count || 0}.`;
        }

        if (anomalyList) {
          const items = anomaly.anomalies || [];
          if (items.length === 0) {
            anomalyList.innerHTML = `
              <div style="font-size: 0.85rem; color: #64748B; padding: 10px; background: #0E1522; border-radius: 6px;">
                No operational anomalies detected in the evaluated ${days}-day window.
              </div>
            `;
          } else {
            anomalyList.innerHTML = items.map(a => {
              const sevColor = a.severity === 'CRITICAL' ? '#F87171' : (a.severity === 'ELEVATED' ? '#FBBF24' : '#60A5FA');
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #0E1522; border-radius: 6px; border-left: 3px solid ${sevColor};">
                  <div>
                    <span style="font-weight: 700; font-size: 0.85rem; color: #E2E8F0;">[${a.category || 'SYSTEM'}] ${a.metric}</span>
                    <div style="font-size: 0.8rem; color: #94A3B8; margin-top: 2px;">${a.message || ''}</div>
                  </div>
                  <div style="text-align: right;">
                    <span class="status-tag" style="background: rgba(255,255,255,0.06); color: ${sevColor};">${a.severity}</span>
                  </div>
                </div>
              `;
            }).join('');
          }
        }
      }

    } catch (err) {
      console.error('Failed to load internal analytics:', err);
      if (err.message && err.message.toLowerCase().includes('unauthorized')) {
        document.getElementById('analytics-content').innerHTML = `
          <div class="auth-gate">
            <h2 style="color: #F87171; margin-bottom: 12px;">Access Denied — Administrator Privileges Required</h2>
            <p style="color: #94A3B8; max-width: 500px; margin: 0 auto 20px;">
              Internal telemetry aggregations are protected by server-side authorization checks. Please sign in with an authorized administrator account.
            </p>
            <a href="login.html" class="btn-action">Go to Provider Sign In</a>
          </div>
        `;
      }
    }
  }

  // Event Listeners
  if (timeWindowSelect) timeWindowSelect.addEventListener('change', loadAnalytics);
  if (btnRefresh) btnRefresh.addEventListener('click', loadAnalytics);

  if (btnRunPrune) {
    btnRunPrune.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to prune raw telemetry events older than 60 days? This action is permanent.')) {
        return;
      }
      try {
        btnRunPrune.disabled = true;
        btnRunPrune.textContent = 'Pruning...';
        const res = await LokatorDB.analytics.pruneOldEvents(60, 5000);
        retentionStatus.textContent = `Prune completed: ${res.raw_events_deleted || 0} raw events and ${res.daily_summaries_deleted || 0} stale daily summaries deleted.`;
      } catch (e) {
        retentionStatus.textContent = 'Pruning error: ' + e.message;
      } finally {
        btnRunPrune.disabled = false;
        btnRunPrune.textContent = 'Execute Bounded 60-Day Pruning';
      }
    });
  }

  if (btnRunSummary) {
    btnRunSummary.addEventListener('click', async () => {
      try {
        btnRunSummary.disabled = true;
        btnRunSummary.textContent = 'Generating rollup...';
        const targetDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const res = await LokatorDB.analytics.generateDailySummary(targetDate);
        retentionStatus.textContent = `Daily rollup generated for ${targetDate}: ${res || 0} events summarized.`;
      } catch (e) {
        retentionStatus.textContent = 'Summary generation error: ' + e.message;
      } finally {
        btnRunSummary.disabled = false;
        btnRunSummary.textContent = 'Generate Daily Summary Rollup';
      }
    });
  }

  // Initial Load
  await loadAnalytics();
});
