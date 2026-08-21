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

      // 5. Fetch Alert Lifecycle & Incident Intelligence
      const alertSummary = await LokatorDB.analyticsAlerts.getSummary(days);
      if (alertSummary) {
        const platformAlertBadge = document.getElementById('platform-alert-status-badge');
        const statOpen = document.getElementById('stat-open-alerts');
        const statCritical = document.getElementById('stat-critical-alerts');
        const statWarning = document.getElementById('stat-warning-alerts');
        const statResolved = document.getElementById('stat-resolved-alerts');
        const alertList = document.getElementById('alert-lifecycle-list');

        if (statOpen) statOpen.textContent = alertSummary.open_alerts_count || 0;
        if (statCritical) statCritical.textContent = alertSummary.critical_alerts_count || 0;
        if (statWarning) statWarning.textContent = alertSummary.warning_alerts_count || 0;
        if (statResolved) statResolved.textContent = alertSummary.resolved_alerts_count || 0;

        if (platformAlertBadge) {
          platformAlertBadge.textContent = alertSummary.platform_alert_status || 'HEALTHY';
          if (alertSummary.platform_alert_status === 'CRITICAL_ALERT') {
            platformAlertBadge.className = 'status-tag';
            platformAlertBadge.style.background = 'rgba(239, 68, 68, 0.25)';
            platformAlertBadge.style.color = '#F87171';
          } else if (alertSummary.platform_alert_status === 'WARNING_ALERT') {
            platformAlertBadge.className = 'status-tag status-notice';
          } else if (alertSummary.platform_alert_status === 'WATCH') {
            platformAlertBadge.className = 'status-tag';
            platformAlertBadge.style.background = 'rgba(96, 165, 250, 0.25)';
            platformAlertBadge.style.color = '#60A5FA';
          } else {
            platformAlertBadge.className = 'status-tag status-good';
          }
        }

        if (alertList) {
          const alerts = alertSummary.alerts || [];
          if (alerts.length === 0) {
            alertList.innerHTML = `
              <div style="font-size: 0.85rem; color: #64748B; padding: 12px; background: #0E1522; border-radius: 6px;">
                No persistent operational alerts in the evaluated ${days}-day window.
              </div>
            `;
          } else {
            alertList.innerHTML = alerts.map(alt => {
              const sevColor = alt.severity === 'CRITICAL' ? '#F87171' : (alt.severity === 'WARNING' ? '#FBBF24' : '#60A5FA');
              const statusBg = alt.status === 'OPEN' ? 'rgba(96, 165, 250, 0.2)' : (alt.status === 'RESOLVED' ? 'rgba(37, 211, 102, 0.2)' : 'rgba(148, 163, 184, 0.2)');
              const statusColor = alt.status === 'OPEN' ? '#60A5FA' : (alt.status === 'RESOLVED' ? '#25D366' : '#94A3B8');

              let actionButtons = '';
              if (alt.status === 'OPEN') {
                actionButtons = `
                  <button class="btn-ack" data-id="${alt.id}" style="padding: 4px 8px; font-size: 0.75rem; background: #1E293B; border: 1px solid #334155; color: #E2E8F0; border-radius: 4px; cursor: pointer;">Acknowledge</button>
                  <button class="btn-res" data-id="${alt.id}" style="padding: 4px 8px; font-size: 0.75rem; background: rgba(37, 211, 102, 0.15); border: 1px solid rgba(37, 211, 102, 0.3); color: #25D366; border-radius: 4px; cursor: pointer;">Resolve</button>
                  <button class="btn-sup" data-id="${alt.id}" style="padding: 4px 8px; font-size: 0.75rem; background: #1E293B; border: 1px solid #334155; color: #94A3B8; border-radius: 4px; cursor: pointer;">Suppress 24h</button>
                `;
              } else if (alt.status === 'ACKNOWLEDGED') {
                actionButtons = `
                  <button class="btn-res" data-id="${alt.id}" style="padding: 4px 8px; font-size: 0.75rem; background: rgba(37, 211, 102, 0.15); border: 1px solid rgba(37, 211, 102, 0.3); color: #25D366; border-radius: 4px; cursor: pointer;">Resolve</button>
                  <button class="btn-sup" data-id="${alt.id}" style="padding: 4px 8px; font-size: 0.75rem; background: #1E293B; border: 1px solid #334155; color: #94A3B8; border-radius: 4px; cursor: pointer;">Suppress 24h</button>
                `;
              } else if (alt.status === 'RESOLVED' || alt.status === 'SUPPRESSED') {
                actionButtons = `
                  <button class="btn-reopen" data-id="${alt.id}" style="padding: 4px 8px; font-size: 0.75rem; background: #1E293B; border: 1px solid #334155; color: #E2E8F0; border-radius: 4px; cursor: pointer;">Reopen</button>
                `;
              }

              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #0E1522; border-radius: 6px; border-left: 3px solid ${sevColor};">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-weight: 700; font-size: 0.85rem; color: #E2E8F0;">[${alt.category || 'SYSTEM'}] ${alt.metric}</span>
                      <span class="status-tag" style="background: rgba(255,255,255,0.06); color: ${sevColor}; font-size: 0.7rem;">${alt.severity}</span>
                      <span class="status-tag" style="background: ${statusBg}; color: ${statusColor}; font-size: 0.7rem;">${alt.status}</span>
                      <span style="font-size: 0.75rem; color: #64748B;">(${alt.occurrence_count || 1}x)</span>
                    </div>
                    <div style="font-size: 0.8rem; color: #94A3B8; margin-top: 4px;">
                      Deviation: ${alt.deviation_score || '0'} | Baseline: ${alt.baseline_value || '0'} | Current: ${alt.current_value || '0'} (N=${alt.sample_size || '0'})
                    </div>
                  </div>
                  <div style="display: flex; gap: 6px;">
                    ${actionButtons}
                  </div>
                </div>
              `;
            }).join('');

            // Attach action listeners
            alertList.querySelectorAll('.btn-ack').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                btn.disabled = true;
                await LokatorDB.analyticsAlerts.acknowledge(id, 'Acknowledged from dashboard');
                loadAnalytics();
              });
            });

            alertList.querySelectorAll('.btn-res').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                btn.disabled = true;
                await LokatorDB.analyticsAlerts.resolve(id, 'Resolved from dashboard');
                loadAnalytics();
              });
            });

            alertList.querySelectorAll('.btn-sup').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                btn.disabled = true;
                await LokatorDB.analyticsAlerts.suppress(id, 'Suppressed 24h from dashboard', 24);
                loadAnalytics();
              });
            });

            alertList.querySelectorAll('.btn-reopen').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                btn.disabled = true;
                await LokatorDB.analyticsAlerts.reopen(id, 'Reopened from dashboard');
                loadAnalytics();
              });
            });
          }
        }
      }

      // 6. Discovery Orchestration & Growth Intelligence (Phase 7.1)
      if (LokatorDB.discoveryIntelligence && LokatorDB.discoveryIntelligence.getSummary) {
        const growthSummary = await LokatorDB.discoveryIntelligence.getSummary(days);
        const gapsSummary = await LokatorDB.discoveryIntelligence.getDemandSupplyGaps(days, 10);

        const statSearches = document.getElementById('stat-growth-searches');
        const statZrr = document.getElementById('stat-growth-zrr');
        const statDqs = document.getElementById('stat-growth-dqs');
        const statGaps = document.getElementById('stat-growth-gaps');
        const gapsList = document.getElementById('growth-gaps-list');

        if (growthSummary) {
          if (statSearches) statSearches.textContent = (growthSummary.platform_total_searches || 0).toLocaleString();
          if (statZrr) statZrr.textContent = (growthSummary.platform_zero_result_rate || 0) + '%';
          if (statDqs) statDqs.textContent = (growthSummary.platform_avg_dqs_score || 100.0) + '/100';
        }

        if (gapsSummary && gapsSummary.gaps) {
          if (statGaps) statGaps.textContent = gapsSummary.gaps.length;
          if (gapsList && gapsSummary.gaps.length > 0) {
            gapsList.innerHTML = gapsSummary.gaps.map(g => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #0E1522; border-radius: 6px; border-left: 3px solid #FBBF24;">
                <div>
                  <span style="font-weight: 700; color: #E2E8F0; font-size: 0.85rem;">[${g.category}] ${g.lga}, ${g.state}</span>
                  <div style="font-size: 0.75rem; color: #94A3B8; margin-top: 2px;">
                    Demand: ${g.aggregate_demand_index} (${g.total_searches} searches) | Supply: ${g.active_verified_providers} providers
                  </div>
                </div>
                <div style="text-align: right;">
                  <span class="status-tag" style="background: rgba(251, 191, 36, 0.2); color: #FBBF24; font-size: 0.75rem;">Gap: ${g.aggregate_gap_ratio}x</span>
                </div>
              </div>
            `).join('');
          }
        }
      }

      // 7. Growth Automation & Smart Recommendations (Phase 7.2)
      if (LokatorDB.growthRecommendations && LokatorDB.growthRecommendations.getSummary) {
        const recSummary = await LokatorDB.growthRecommendations.getSummary();
        const statActive = document.getElementById('stat-rec-active');
        const statCriticalHigh = document.getElementById('stat-rec-critical-high');
        const statSupplyGaps = document.getElementById('stat-rec-supply-gaps');
        const statZeroResults = document.getElementById('stat-rec-zero-results');
        const recList = document.getElementById('growth-recommendations-list');

        if (recSummary) {
          if (statActive) statActive.textContent = (recSummary.active_count || 0);
          if (statCriticalHigh) statCriticalHigh.textContent = ((recSummary.critical_count || 0) + (recSummary.high_count || 0));
          if (statSupplyGaps) statSupplyGaps.textContent = (recSummary.supply_gap_count || 0);
          if (statZeroResults) statZeroResults.textContent = (recSummary.zero_result_count || 0);

          if (recList && recSummary.recommendations && recSummary.recommendations.length > 0) {
            recList.innerHTML = recSummary.recommendations.map(r => {
              const priorityColors = {
                CRITICAL: '#EF4444',
                HIGH: '#F97316',
                MEDIUM: '#FBBF24',
                LOW: '#60A5FA'
              };
              const pColor = priorityColors[r.priority] || '#94A3B8';
              return `
                <div style="padding: 12px; background: #0E1522; border-radius: 6px; border-left: 3px solid ${pColor}; display: flex; flex-direction: column; gap: 6px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <span style="font-weight: 700; color: #E2E8F0; font-size: 0.9rem;">${r.title}</span>
                      <span class="status-tag" style="margin-left: 8px; background: ${pColor}20; color: ${pColor}; font-size: 0.7rem; border: 1px solid ${pColor}40;">${r.priority}</span>
                      <span class="status-tag" style="margin-left: 4px; background: #3B82F620; color: #60A5FA; font-size: 0.7rem;">Conf: ${(r.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                    <div style="font-size: 0.75rem; color: #64748B;">Expires: ${new Date(r.expires_at).toLocaleDateString()}</div>
                  </div>
                  <div style="font-size: 0.8rem; color: #94A3B8;">${r.summary}</div>
                  <div style="font-size: 0.75rem; color: #CBD5E1; background: #131D2D; padding: 6px 8px; border-radius: 4px;">
                    <strong>Recommended Action:</strong> ${r.recommended_action}
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                    <div style="font-size: 0.7rem; color: #64748B;">
                      Demand: ${r.demand_index} | Supply: ${r.supply_index} | Gap: ${r.gap_ratio}x | DQS: ${r.dqs_score}
                    </div>
                    <div style="display: flex; gap: 6px;">
                      ${r.status === 'NEW' ? `<button class="btn-action btn-rec-review" data-id="${r.id}" style="padding: 2px 8px; font-size: 0.7rem; background: #475569;">Review</button>` : ''}
                      <button class="btn-action btn-rec-accept" data-id="${r.id}" style="padding: 2px 8px; font-size: 0.7rem; background: #059669;">Accept</button>
                      <button class="btn-action btn-rec-dismiss" data-id="${r.id}" style="padding: 2px 8px; font-size: 0.7rem; background: #DC2626;">Dismiss</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('');

            // Wire action buttons
            recList.querySelectorAll('.btn-rec-review').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                await LokatorDB.growthRecommendations.review(id, 'Reviewed via admin dashboard');
                loadAnalytics();
              });
            });
            recList.querySelectorAll('.btn-rec-accept').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                await LokatorDB.growthRecommendations.accept(id, 'Accepted via admin dashboard');
                loadAnalytics();
              });
            });
            recList.querySelectorAll('.btn-rec-dismiss').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                await LokatorDB.growthRecommendations.dismiss(id, 'Dismissed via admin dashboard');
                loadAnalytics();
              });
            });
          }
        }

        const btnGenRecs = document.getElementById('btn-generate-recommendations');
        if (btnGenRecs && !btnGenRecs.hasAttribute('data-bound')) {
          btnGenRecs.setAttribute('data-bound', 'true');
          btnGenRecs.addEventListener('click', async () => {
            btnGenRecs.textContent = 'Evaluating...';
            await LokatorDB.growthRecommendations.generate(7, 28);
            btnGenRecs.textContent = 'Run Rollup Evaluation';
            loadAnalytics();
          });
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
