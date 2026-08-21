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

      // 8. REALTIME GROWTH & OPERATIONAL INTELLIGENCE (Phase 8.0 & 8.1)
      if (LokatorDB.growthIntelligence || LokatorDB.realtimeGrowth) {
        const renderOperationalFeed = (data) => {
          if (!data) return;
          const statHighPrio = document.getElementById('stat-operational-high-prio');
          const statSustained = document.getElementById('stat-operational-sustained');
          const statEmerging = document.getElementById('stat-operational-emerging');
          const statActive = document.getElementById('stat-realtime-signals-active');
          const container = document.getElementById('realtime-signals-container');
          const connStatus = document.getElementById('realtime-growth-conn-text');
          const pulseDot = document.getElementById('realtime-growth-pulse-dot');

          if (statHighPrio) statHighPrio.textContent = data.high_priority_count || data.critical_high_count || 0;
          if (statSustained) statSustained.textContent = data.sustained_count || 0;
          if (statEmerging) statEmerging.textContent = data.emerging_count || 0;
          if (statActive) statActive.textContent = data.total_active_count || data.active_signals_count || 0;

          const currentStatus = LokatorDB.realtimeGrowth ? LokatorDB.realtimeGrowth.getStatus() : 'LIVE';
          if (connStatus) connStatus.textContent = currentStatus;
          if (pulseDot) {
            pulseDot.style.background = currentStatus === 'LIVE' ? '#10B981' : (currentStatus === 'POLLING_FALLBACK' ? '#F59E0B' : '#EF4444');
          }

          if (container) {
            const items = data.items || data.signals || [];
            if (items.length === 0) {
              container.innerHTML = `
                <div style="font-size: 0.85rem; color: #64748B; padding: 12px; background: #0E1522; border-radius: 6px;">
                  No active operational demand pressure or unmet expansion signals detected.
                </div>
              `;
            } else {
              container.innerHTML = items.map(item => {
                const opState = item.operational_state || (item.severity === 'CRITICAL' ? 'HIGH_PRIORITY' : 'EMERGING');
                const stateColor = opState === 'HIGH_PRIORITY' ? '#F43F5E' : (opState === 'SUSTAINED' ? '#F59E0B' : (opState === 'EMERGING' ? '#38BDF8' : '#10B981'));
                const isAck = opState === 'COOLDOWN' || item.status === 'ACKNOWLEDGED';
                const isSuppressed = opState === 'SUPPRESSED';
                const explanationText = (item.explanation && item.explanation.summary) ? item.explanation.summary : (item.evidence_summary || `Demand: ${item.current_value} vs Base: ${item.baseline_value}`);
                const hasRec = item.correlation_metadata && item.correlation_metadata.has_matching_recommendation;

                return `
                  <div style="background: #0E1522; border: 1px solid #1E293B; border-left: 4px solid ${stateColor}; border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                        <span style="font-size: 0.7rem; font-weight: 800; background: ${stateColor}22; color: ${stateColor}; padding: 2px 6px; border-radius: 4px;">${opState}</span>
                        <span style="font-size: 0.75rem; font-weight: 700; color: #E2E8F0;">${item.category}</span>
                        <span style="font-size: 0.7rem; color: #94A3B8;">&bull; ${item.lga}, ${item.state}</span>
                        ${hasRec ? '<span style="font-size: 0.65rem; background: #1E3A8A; color: #93C5FD; padding: 1px 5px; border-radius: 3px;">MATCHES_GROWTH_REC</span>' : ''}
                        ${isAck ? '<span style="font-size: 0.65rem; background: #334155; color: #CBD5E1; padding: 1px 5px; border-radius: 3px;">COOLDOWN_ACTIVE</span>' : ''}
                        ${isSuppressed ? '<span style="font-size: 0.65rem; background: #475569; color: #94A3B8; padding: 1px 5px; border-radius: 3px;">SUPPRESSED</span>' : ''}
                      </div>
                      <div style="display: flex; gap: 6px; align-items: center;">
                        ${!isAck && !isSuppressed ? `
                          <button class="btn-action btn-op-ack" data-id="${item.id}" style="padding: 3px 8px; font-size: 0.7rem; background: #0D9488;">Acknowledge</button>
                          <button class="btn-action btn-op-flag" data-id="${item.id}" style="padding: 3px 8px; font-size: 0.7rem; background: #1E293B;">Flag Follow-up</button>
                          <button class="btn-action btn-op-suppress" data-id="${item.id}" style="padding: 3px 8px; font-size: 0.7rem; background: #334155;">Suppress</button>
                        ` : ''}
                      </div>
                    </div>
                    <div style="font-size: 0.8rem; color: #CBD5E1; line-height: 1.4;">
                      ${explanationText}
                    </div>
                    <div style="font-size: 0.7rem; color: #64748B; display: flex; gap: 12px; flex-wrap: wrap;">
                      <span>Rate: <strong>${item.current_value}/hr</strong> (Base: ${item.baseline_value})</span>
                      <span>Dev: <strong>+${item.deviation_score || item.deviation_ratio}σ</strong></span>
                      <span>Sample: <strong>N=${item.sample_size}, k=${item.unique_sessions}</strong></span>
                      <span>Persistence: <strong>${item.persistence_count || 1} windows</strong></span>
                    </div>
                  </div>
                `;
              }).join('');

              container.querySelectorAll('.btn-op-ack').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const id = e.target.getAttribute('data-id');
                  if (LokatorDB.growthIntelligence) {
                    await LokatorDB.growthIntelligence.acknowledge(id, 'Acknowledged via operational dashboard');
                    const updated = await LokatorDB.growthIntelligence.getOperationalIntelligence();
                    renderOperationalFeed(updated);
                  }
                });
              });

              container.querySelectorAll('.btn-op-flag').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const id = e.target.getAttribute('data-id');
                  if (LokatorDB.growthIntelligence) {
                    await LokatorDB.growthIntelligence.flagFollowUp(id, 'Flagged for business team review');
                    const updated = await LokatorDB.growthIntelligence.getOperationalIntelligence();
                    renderOperationalFeed(updated);
                  }
                });
              });

              container.querySelectorAll('.btn-op-suppress').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const id = e.target.getAttribute('data-id');
                  if (LokatorDB.growthIntelligence) {
                    await LokatorDB.growthIntelligence.suppress(id, 'Suppressed as event noise by operator');
                    const updated = await LokatorDB.growthIntelligence.getOperationalIntelligence();
                    renderOperationalFeed(updated);
                  }
                });
              });
            }
          }
        };

        try {
          if (LokatorDB.growthIntelligence && typeof LokatorDB.growthIntelligence.getOperationalIntelligence === 'function') {
            LokatorDB.growthIntelligence.getOperationalIntelligence().then(opData => {
              renderOperationalFeed(opData);
            }).catch(() => {
              if (LokatorDB.realtimeGrowth) {
                LokatorDB.realtimeGrowth.getLatestSignals().then(renderOperationalFeed);
              }
            });
          } else if (LokatorDB.realtimeGrowth) {
            LokatorDB.realtimeGrowth.getLatestSignals().then(renderOperationalFeed);
          }

          if (LokatorDB.realtimeGrowth && typeof LokatorDB.realtimeGrowth.subscribe === 'function') {
            LokatorDB.realtimeGrowth.subscribe((incoming) => {
              if (LokatorDB.growthIntelligence) {
                LokatorDB.growthIntelligence.getOperationalIntelligence().then(renderOperationalFeed).catch(() => renderOperationalFeed(incoming));
              } else {
                renderOperationalFeed(incoming);
              }
            }, (status) => {
              const connStatus = document.getElementById('realtime-growth-conn-text');
              const pulseDot = document.getElementById('realtime-growth-pulse-dot');
              if (connStatus) connStatus.textContent = status;
              if (pulseDot) {
                pulseDot.style.background = status === 'LIVE' ? '#10B981' : (status === 'POLLING_FALLBACK' ? '#F59E0B' : '#EF4444');
              }
            });
          }
        } catch (e) {
          console.warn('Operational growth intelligence load failed:', e.message);
        }

        const btnRefreshRealtime = document.getElementById('btn-refresh-realtime-signals');
        if (btnRefreshRealtime && !btnRefreshRealtime.hasAttribute('data-bound')) {
          btnRefreshRealtime.setAttribute('data-bound', 'true');
          btnRefreshRealtime.addEventListener('click', async () => {
            btnRefreshRealtime.textContent = 'Evaluating...';
            if (LokatorDB.growthIntelligence) {
              await LokatorDB.growthIntelligence.computeOperationalIntelligence(true);
              const latest = await LokatorDB.growthIntelligence.getOperationalIntelligence();
              renderOperationalFeed(latest);
            } else if (LokatorDB.realtimeGrowth) {
              await LokatorDB.realtimeGrowth.computeSignals(true);
              const latest = await LokatorDB.realtimeGrowth.getLatestSignals();
              renderOperationalFeed(latest);
            }
            btnRefreshRealtime.textContent = 'Evaluate Multi-Window Rollup';
          });
        }

        // -------------------------------------------------------------
        // SECTION 8.2: PREDICTIVE GROWTH INTELLIGENCE & OPPORTUNITY DETECTION
        // -------------------------------------------------------------
        const renderPredictiveGrowthFeed = (data) => {
          if (!data) return;
          const statHighConf = document.getElementById('stat-predictions-high-conf');
          const statEmerging = document.getElementById('stat-predictions-emerging');
          const statShortage = document.getElementById('stat-predictions-shortage');
          const statActive = document.getElementById('stat-predictions-active');
          const container = document.getElementById('predictive-growth-container');

          if (statHighConf) statHighConf.textContent = data.high_confidence_count || 0;
          if (statEmerging) statEmerging.textContent = data.emerging_count || 0;
          if (statShortage) statShortage.textContent = data.shortage_count || 0;
          if (statActive) statActive.textContent = data.total_active_count || (data.predictions ? data.predictions.length : 0);

          if (container && data.predictions) {
            if (data.predictions.length === 0) {
              container.innerHTML = `
                <div style="font-size: 0.85rem; color: #64748B; padding: 12px; background: #0E1522; border-radius: 6px;">
                  No active predictive growth opportunities detected. Data meets privacy & stability criteria ($k \\ge 5, N \\ge 30$).
                </div>
              `;
            } else {
              container.innerHTML = data.predictions.map(pred => {
                const confColor = pred.confidence_tier === 'HIGH' ? '#10B981' : (pred.confidence_tier === 'MEDIUM' ? '#38BDF8' : '#F59E0B');
                const oppColor = pred.opportunity_class === 'SUPPLY_SHORTAGE' || pred.opportunity_class === 'SERVICE_EXPANSION' ? '#EF4444' : (pred.opportunity_class === 'HIGH_GROWTH_ZONE' ? '#8B5CF6' : '#38BDF8');
                const growthPct = Math.round((pred.demand_growth_rate || 0) * 100);

                return `
                  <div class="card" style="padding: 12px; background: #0E1522; border: 1px solid #1E293B; margin-bottom: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                      <div>
                        <span class="status-tag" style="background: ${oppColor}22; color: ${oppColor}; border: 1px solid ${oppColor}55; font-size: 0.7rem; font-weight: 700; margin-right: 6px;">
                          ${pred.opportunity_class}
                        </span>
                        <span class="status-tag" style="background: ${confColor}22; color: ${confColor}; border: 1px solid ${confColor}55; font-size: 0.7rem; font-weight: 700;">
                          CONFIDENCE: ${pred.confidence_tier} (${Math.round((pred.confidence_score || 0) * 100)}%)
                        </span>
                        <span style="font-size: 0.75rem; color: #64748B; margin-left: 8px;">
                          Horizon: <strong>${pred.forecast_window || 'NEXT_24H'}</strong>
                        </span>
                      </div>
                      <div style="display: flex; gap: 6px;">
                        <button class="btn-action btn-pred-ack" data-id="${pred.id}" style="padding: 2px 8px; font-size: 0.7rem; background: #059669;">Acknowledge</button>
                        <button class="btn-action btn-pred-watch" data-id="${pred.id}" style="padding: 2px 8px; font-size: 0.7rem; background: #3B82F6;">Watch</button>
                        <button class="btn-action btn-pred-dismiss" data-id="${pred.id}" style="padding: 2px 8px; font-size: 0.7rem; background: #64748B;">Dismiss</button>
                      </div>
                    </div>
                    <div style="font-size: 0.9rem; font-weight: 700; color: #F1F5F9; margin-bottom: 4px;">
                      ${pred.category} — ${pred.lga}, ${pred.state}
                    </div>
                    <div style="font-size: 0.8rem; color: #94A3B8; margin-bottom: 6px;">
                      ${pred.explanation && pred.explanation.summary ? pred.explanation.summary : 'Projected demand surge based on statistical velocity.'}
                    </div>
                    <div style="display: flex; gap: 14px; font-size: 0.75rem; color: #64748B; border-top: 1px solid #1E293B; padding-top: 6px; flex-wrap: wrap;">
                      <span>Projected Demand: <strong style="color: #38BDF8;">${pred.projected_demand}/hr</strong></span>
                      <span>Supply Capacity: <strong style="color: #10B981;">${pred.projected_supply}/hr</strong></span>
                      <span>Growth Velocity: <strong style="color: #F59E0B;">+${growthPct}%</strong></span>
                      <span>Sample Size: <strong>N=${pred.sample_size}, k=${pred.unique_sessions}</strong></span>
                    </div>
                  </div>
                `;
              }).join('');

              container.querySelectorAll('.btn-pred-ack').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const id = e.target.getAttribute('data-id');
                  if (LokatorDB.predictiveGrowth) {
                    await LokatorDB.predictiveGrowth.acknowledgePrediction(id, 'Acknowledged by operator');
                    const updated = await LokatorDB.predictiveGrowth.getPredictions();
                    renderPredictiveGrowthFeed(updated);
                  }
                });
              });

              container.querySelectorAll('.btn-pred-watch').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const id = e.target.getAttribute('data-id');
                  if (LokatorDB.predictiveGrowth) {
                    await LokatorDB.predictiveGrowth.watchPrediction(id, 'Flagged for operational monitoring');
                    const updated = await LokatorDB.predictiveGrowth.getPredictions();
                    renderPredictiveGrowthFeed(updated);
                  }
                });
              });

              container.querySelectorAll('.btn-pred-dismiss').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const id = e.target.getAttribute('data-id');
                  if (LokatorDB.predictiveGrowth) {
                    await LokatorDB.predictiveGrowth.dismissPrediction(id, 'Dismissed by operator');
                    const updated = await LokatorDB.predictiveGrowth.getPredictions();
                    renderPredictiveGrowthFeed(updated);
                  }
                });
              });
            }
          }
        };

        try {
          if (LokatorDB.predictiveGrowth && typeof LokatorDB.predictiveGrowth.getPredictions === 'function') {
            LokatorDB.predictiveGrowth.getPredictions().then(renderPredictiveGrowthFeed).catch((e) => {
              console.warn('Predictive growth fetch failed:', e.message);
            });
          }
        } catch (e) {
          console.warn('Predictive growth initialization failed:', e.message);
        }

        const btnRefreshPredictive = document.getElementById('btn-refresh-predictive-growth');
        if (btnRefreshPredictive && !btnRefreshPredictive.hasAttribute('data-bound')) {
          btnRefreshPredictive.setAttribute('data-bound', 'true');
          btnRefreshPredictive.addEventListener('click', async () => {
            btnRefreshPredictive.textContent = 'Computing...';
            if (LokatorDB.predictiveGrowth) {
              await LokatorDB.predictiveGrowth.computePredictions(true);
              const latest = await LokatorDB.predictiveGrowth.getPredictions();
              renderPredictiveGrowthFeed(latest);
            }
            btnRefreshPredictive.textContent = 'Compute Predictions';
          });
        }

        // =========================================================================
        // 9.0 STRATEGIC INTELLIGENCE COMMAND CENTER (SIMCC) INITIALIZATION
        // =========================================================================
        const renderCommandCenter = (cc) => {
          if (!cc) return;
          const pulse = cc.executive_pulse || {};

          // 1. Executive Pulse KPIs
          const elHealth = document.getElementById('simcc-stat-health');
          const elSubHealth = document.getElementById('simcc-sub-health');
          const elPressure = document.getElementById('simcc-stat-pressure');
          const elP0 = document.getElementById('simcc-stat-p0');
          const elTotalOpps = document.getElementById('simcc-stat-total-opps');

          if (elHealth) {
            elHealth.textContent = pulse.marketplace_health || 'OPTIMAL';
            elHealth.style.color = pulse.marketplace_health === 'OPTIMAL' ? '#34D399' : '#F87171';
          }
          if (elSubHealth) {
            if (pulse.top_opportunity) {
              elSubHealth.textContent = `Top Focus: ${pulse.top_opportunity.category} in ${pulse.top_opportunity.lga}`;
            } else {
              elSubHealth.textContent = 'System-wide operational balance';
            }
          }
          if (elPressure) elPressure.textContent = Number(pulse.strategic_pressure_index || 0).toFixed(1);
          if (elP0) elP0.textContent = pulse.critical_interventions_count || 0;
          if (elTotalOpps) elTotalOpps.textContent = pulse.total_active_opportunities || 0;

          // 2. Strategic Opportunity Priority Queue
          const oppContainer = document.getElementById('simcc-opportunities-container');
          if (oppContainer) {
            const opps = cc.strategic_opportunities || [];
            if (!opps || opps.length === 0) {
              oppContainer.innerHTML = `
                <div style="font-size: 0.85rem; color: #64748B; padding: 16px; background: #080D18; border-radius: 8px; text-align: center;">
                  No active strategic opportunities synthesized. Run evaluation to correlate active intelligence signals.
                </div>
              `;
            } else {
              oppContainer.innerHTML = opps.map(item => {
                const isP0 = item.priority_class === 'P0_CRITICAL_INTERVENTION';
                const isP1 = item.priority_class === 'P1_HIGH_PRIORITY_EXPANSION';
                const prioColor = isP0 ? '#EF4444' : (isP1 ? '#F59E0B' : '#6366F1');
                const prioBg = isP0 ? 'rgba(239, 68, 68, 0.15)' : (isP1 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)');
                const score = Number(item.strategic_score || 0).toFixed(1);
                const expl = item.explanation || {};
                const m = item.metrics || {};
                const systems = item.contributing_systems || [];

                const systemsBadges = systems.map(s => `
                  <span style="font-size: 0.65rem; background: #1E293B; color: #94A3B8; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);">
                    ${s.replace('_', ' ')}
                  </span>
                `).join(' ');

                return `
                  <div class="panel-card" style="background: #111827; border: 1px solid rgba(255,255,255,0.08); border-left: 4px solid ${prioColor}; padding: 14px; margin-bottom: 8px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                      <div>
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                          <span style="font-size: 0.7rem; font-weight: 800; background: ${prioBg}; color: ${prioColor}; padding: 2px 8px; border-radius: 12px; border: 1px solid ${prioColor}40;">
                            ${item.priority_class.replace('_', ' ')}
                          </span>
                          <span style="font-size: 0.7rem; font-weight: 800; background: #312E81; color: #818CF8; padding: 2px 8px; border-radius: 12px;">
                            SCORE: ${score}/100
                          </span>
                          <span style="font-size: 0.65rem; font-weight: 700; background: #064E3B; color: #34D399; padding: 2px 6px; border-radius: 4px;">
                            ${item.convergence_level.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 style="margin: 0; font-size: 1rem; color: #F9FAFB; font-weight: 700;">
                          ${item.category} — ${item.lga}, ${item.state}
                        </h4>
                      </div>
                      <div style="display: flex; gap: 6px;">
                        <button class="btn-action btn-simcc-ack" data-id="${item.id}" style="padding: 4px 8px; font-size: 0.75rem; background: #059669;">Acknowledge</button>
                        <button class="btn-action btn-simcc-watch" data-id="${item.id}" style="padding: 4px 8px; font-size: 0.75rem; background: #D97706;">Watch</button>
                        <button class="btn-action btn-simcc-dismiss" data-id="${item.id}" style="padding: 4px 8px; font-size: 0.75rem; background: #4B5563;">Dismiss</button>
                      </div>
                    </div>

                    <p style="margin: 6px 0; font-size: 0.82rem; color: #CBD5E1; line-height: 1.4;">
                      ${expl.summary || expl.what || 'Strategic opportunity detected across market telemetry.'}
                    </p>

                    ${expl.recommended_action ? `
                      <div style="font-size: 0.8rem; color: #60A5FA; background: rgba(59,130,246,0.1); border-left: 3px solid #3B82F6; padding: 6px 10px; border-radius: 4px; margin: 8px 0;">
                        💡 <strong>Recommended Strategic Action:</strong> ${expl.recommended_action}
                      </div>
                    ` : ''}

                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 0.75rem; color: #94A3B8; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.04);">
                      <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                        <span>Systems:</span> ${systemsBadges}
                      </div>
                      <div style="display: flex; gap: 12px;">
                        <span>N=${m.sample_size || '—'}</span>
                        <span>k=${m.unique_sessions || '—'}</span>
                        <span>Demand: ${m.projected_demand || 0}/hr</span>
                        <span>Supply: ${m.projected_supply || 0}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('');

              // Wire action buttons
              oppContainer.querySelectorAll('.btn-simcc-ack').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const id = e.target.getAttribute('data-id');
                  if (LokatorDB.strategicCommand) {
                    await LokatorDB.strategicCommand.acknowledgeSynthesis(id, 'Acknowledged via SIMCC');
                    const updated = await LokatorDB.strategicCommand.getCommandCenter();
                    renderCommandCenter(updated);
                  }
                });
              });

              oppContainer.querySelectorAll('.btn-simcc-watch').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const id = e.target.getAttribute('data-id');
                  if (LokatorDB.strategicCommand) {
                    await LokatorDB.strategicCommand.watchSynthesis(id, 'Flagged for operational monitoring in SIMCC');
                    const updated = await LokatorDB.strategicCommand.getCommandCenter();
                    renderCommandCenter(updated);
                  }
                });
              });

              oppContainer.querySelectorAll('.btn-simcc-dismiss').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  const id = e.target.getAttribute('data-id');
                  if (LokatorDB.strategicCommand) {
                    await LokatorDB.strategicCommand.dismissSynthesis(id, 'Dismissed by operator in SIMCC');
                    const updated = await LokatorDB.strategicCommand.getCommandCenter();
                    renderCommandCenter(updated);
                  }
                });
              });
            }
          }

          // 3. Regional Matrix
          const regContainer = document.getElementById('simcc-regional-matrix-container');
          if (regContainer) {
            const rows = cc.regional_matrix || [];
            if (!rows || rows.length === 0) {
              regContainer.innerHTML = `
                <div style="font-size: 0.85rem; color: #64748B; padding: 14px; background: #080D18; border-radius: 8px; text-align: center;">
                  Regional balance optimal. No acute localized supply deficits.
                </div>
              `;
            } else {
              regContainer.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
                  ${rows.map(r => `
                    <div style="background: #0E1522; border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 10px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-weight: 700; font-size: 0.85rem; color: #E2E8F0;">${r.lga}, ${r.state}</span>
                        <span style="font-size: 0.7rem; font-weight: 800; color: #F59E0B; background: rgba(245,158,11,0.15); padding: 2px 6px; border-radius: 4px;">
                          Score: ${Number(r.max_strategic_score || 0).toFixed(1)}
                        </span>
                      </div>
                      <div style="font-size: 0.75rem; color: #94A3B8;">
                        ${r.active_opportunity_count} Active Opps | ${(r.affected_categories || []).join(', ')}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `;
            }
          }
        };

        // Load Command Center data
        try {
          if (LokatorDB.strategicCommand && typeof LokatorDB.strategicCommand.getCommandCenter === 'function') {
            LokatorDB.strategicCommand.getCommandCenter().then(renderCommandCenter).catch((e) => {
              console.warn('SIMCC Command Center fetch failed:', e.message);
            });
          }
        } catch (e) {
          console.warn('SIMCC initialization failed:', e.message);
        }

        const btnRefreshCommandCenter = document.getElementById('btn-refresh-command-center');
        if (btnRefreshCommandCenter && !btnRefreshCommandCenter.hasAttribute('data-bound')) {
          btnRefreshCommandCenter.setAttribute('data-bound', 'true');
          btnRefreshCommandCenter.addEventListener('click', async () => {
            btnRefreshCommandCenter.textContent = 'Synthesizing...';
            if (LokatorDB.strategicCommand) {
              await LokatorDB.strategicCommand.computeSynthesis(true);
              const latest = await LokatorDB.strategicCommand.getCommandCenter();
              renderCommandCenter(latest);
            }
            btnRefreshCommandCenter.textContent = 'Evaluate Synthesis';
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
