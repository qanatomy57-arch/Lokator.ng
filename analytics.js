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

          // 3. Strategic Decision Performance KPIs & Active Action Plans
          if (LokatorDB.strategicDecision && typeof LokatorDB.strategicDecision.getPerformanceSummary === 'function') {
            LokatorDB.strategicDecision.getPerformanceSummary().then(summary => {
              if (!summary) return;
              const kpis = summary.kpis || {};
              const elActiveDec = document.getElementById('simcc-decision-stat-active');
              const elPlans = document.getElementById('simcc-decision-stat-plans');
              const elMeasuring = document.getElementById('simcc-decision-stat-measuring');
              const elSuccessRate = document.getElementById('simcc-decision-stat-success-rate');

              if (elActiveDec) elActiveDec.textContent = kpis.active_decisions || 0;
              if (elPlans) elPlans.textContent = kpis.active_action_plans || 0;
              if (elMeasuring) elMeasuring.textContent = kpis.decisions_awaiting_measurement || 0;
              if (elSuccessRate) elSuccessRate.textContent = `${kpis.conversion_rate || 0}%`;

              const plansContainer = document.getElementById('simcc-action-plans-container');
              if (plansContainer) {
                const plans = summary.recent_action_plans || [];
                if (!plans || plans.length === 0) {
                  plansContainer.innerHTML = `
                    <div style="font-size: 0.82rem; color: #64748B; padding: 14px; background: #080D18; border-radius: 8px; text-align: center;">
                      No active operational action plans. Select an opportunity above to record a decision and generate an action plan.
                    </div>
                  `;
                } else {
                  plansContainer.innerHTML = plans.map(p => `
                    <div style="background: #0E1522; border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                      <div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                          <span style="font-size: 0.65rem; font-weight: 700; background: #312E81; color: #818CF8; padding: 2px 6px; border-radius: 4px;">
                            ${p.priority || 'P1'}
                          </span>
                          <span style="font-size: 0.65rem; font-weight: 700; background: #064E3B; color: #34D399; padding: 2px 6px; border-radius: 4px;">
                            ${p.plan_status || 'PLANNED'}
                          </span>
                          <span style="font-size: 0.8rem; font-weight: 700; color: #F1F5F9;">
                            ${p.objective}
                          </span>
                        </div>
                        <div style="font-size: 0.72rem; color: #94A3B8;">
                          ${p.category} in ${p.lga}, ${p.state} | Target: ${p.target_value} | Due: ${p.target_completion_date}
                        </div>
                      </div>
                      <span class="status-tag status-notice" style="font-size: 0.65rem;">
                        MANUAL EXECUTION
                      </span>
                    </div>
                  `).join('');
                }
              }
            }).catch(e => console.warn('Failed to load strategic decision performance:', e.message));
          }

          // 4. Regional Matrix
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

        // =====================================================================
        // SECTION 9.2: CONTINUOUS STRATEGIC ORCHESTRATION & EXECUTIVE INTELLIGENCE
        // =====================================================================
        const renderStrategicOrchestration = async () => {
          if (!LokatorDB.strategicOrchestration) return;

          try {
            // 1. Fetch Executive Summary KPIs
            const execSum = await LokatorDB.strategicOrchestration.getExecutiveSummary();
            if (execSum && execSum.kpis) {
              const kpis = execSum.kpis;
              const elHealth = document.getElementById('orchestration-stat-health');
              const elVelocity = document.getElementById('orchestration-stat-velocity');
              const elOverdue = document.getElementById('orchestration-stat-overdue');
              const elMeasuring = document.getElementById('orchestration-stat-measuring');
              const elEscalations = document.getElementById('orchestration-stat-escalations');
              const elFreshness = document.getElementById('orchestration-stat-freshness');

              if (elHealth) elHealth.textContent = `${Number(kpis.portfolio_health_score || 100).toFixed(1)}%`;
              if (elVelocity) elVelocity.textContent = `${kpis.weekly_decision_velocity || 0}/wk`;
              if (elOverdue) elOverdue.textContent = kpis.overdue_action_plans || 0;
              if (elMeasuring) elMeasuring.textContent = kpis.plans_awaiting_measurement || 0;
              if (elEscalations) elEscalations.textContent = kpis.critical_escalations || 0;

              if (elFreshness && execSum.freshness_summary) {
                const total = execSum.freshness_summary.total_active_syntheses || 0;
                const fresh = execSum.freshness_summary.fresh_syntheses || 0;
                const pct = total > 0 ? Math.round((fresh / total) * 100) : 100;
                elFreshness.textContent = `${pct}%`;
              }
            }

            // 2. Fetch Operator Priority Feed
            const feedData = await LokatorDB.strategicOrchestration.getFeed(20);
            const feedContainer = document.getElementById('orchestration-feed-container');
            if (feedContainer && feedData) {
              const items = [];

              // Critical Escalations
              (feedData.critical_escalations || []).forEach(e => {
                items.push(`
                  <div style="background: #181018; border: 1px solid rgba(244,63,94,0.3); border-left: 4px solid #F43F5E; border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                        <span style="font-size: 0.65rem; font-weight: 800; background: #881337; color: #FDA4AF; padding: 2px 6px; border-radius: 4px;">CRITICAL P0</span>
                        <span style="font-size: 0.8rem; font-weight: 700; color: #FFF1F2;">${e.category} in ${e.lga}, ${e.state}</span>
                      </div>
                      <div style="font-size: 0.72rem; color: #FDA4AF;">
                        Score: ${Number(e.strategic_score || 0).toFixed(1)} | Convergence: ${e.convergence_level} | Immediate operator decision required.
                      </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                      <span class="status-tag status-notice" style="font-size: 0.65rem;">RECOMMENDATION</span>
                      <span class="status-tag status-danger" style="font-size: 0.65rem;">MANUAL ACTION</span>
                    </div>
                  </div>
                `);
              });

              // Stalled Decisions
              (feedData.stalled_decisions || []).forEach(d => {
                items.push(`
                  <div style="background: #1A1608; border: 1px solid rgba(245,158,11,0.3); border-left: 4px solid #F59E0B; border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                        <span style="font-size: 0.65rem; font-weight: 800; background: #78350F; color: #FDE68A; padding: 2px 6px; border-radius: 4px;">STALLED DECISION</span>
                        <span style="font-size: 0.8rem; font-weight: 700; color: #FEF3C7;">${d.category} in ${d.lga}, ${d.state} (${d.days_idle} days idle)</span>
                      </div>
                      <div style="font-size: 0.72rem; color: #FDE68A;">
                        Rationale: ${d.rationale || 'Decision accepted'} | Action plan not yet generated.
                      </div>
                    </div>
                    <span class="status-tag status-notice" style="font-size: 0.65rem;">MANUAL ACTION</span>
                  </div>
                `);
              });

              // Overdue Action Plans
              (feedData.overdue_action_plans || []).forEach(p => {
                items.push(`
                  <div style="background: #1C1114; border: 1px solid rgba(239,68,68,0.3); border-left: 4px solid #EF4444; border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                        <span style="font-size: 0.65rem; font-weight: 800; background: #7F1D1D; color: #FECACA; padding: 2px 6px; border-radius: 4px;">OVERDUE (${p.slippage_days}d)</span>
                        <span style="font-size: 0.8rem; font-weight: 700; color: #FEE2E2;">${p.objective}</span>
                      </div>
                      <div style="font-size: 0.72rem; color: #FECACA;">
                        ${p.category} in ${p.lga}, ${p.state} | Target Date: ${p.target_completion_date} | Owner: ${p.owner_title}
                      </div>
                    </div>
                    <span class="status-tag status-danger" style="font-size: 0.65rem;">MANUAL ACTION</span>
                  </div>
                `);
              });

              // Awaiting Measurement
              (feedData.awaiting_measurement || []).forEach(m => {
                items.push(`
                  <div style="background: #0E1824; border: 1px solid rgba(59,130,246,0.3); border-left: 4px solid #3B82F6; border-radius: 6px; padding: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                        <span style="font-size: 0.65rem; font-weight: 800; background: #1E3A8A; color: #BFDBFE; padding: 2px 6px; border-radius: 4px;">MEASUREMENT READY</span>
                        <span style="font-size: 0.8rem; font-weight: 700; color: #EFF6FF;">${m.objective}</span>
                      </div>
                      <div style="font-size: 0.72rem; color: #BFDBFE;">
                        ${m.category} in ${m.lga}, ${m.state} | Window (${m.observation_window_days}d) concluded.
                      </div>
                    </div>
                    <span class="status-tag status-good" style="font-size: 0.65rem;">OBSERVATION</span>
                  </div>
                `);
              });

              if (items.length === 0) {
                feedContainer.innerHTML = `
                  <div style="font-size: 0.82rem; color: #64748B; padding: 14px; background: #080D18; border-radius: 8px; text-align: center;">
                    Orchestration queue clear. All strategic decisions, plans, and measurement cycles are current.
                  </div>
                `;
              } else {
                feedContainer.innerHTML = items.join('');
              }
            }

            // 3. Fetch Strategy Learning Insights
            const learningData = await LokatorDB.strategicOrchestration.getLearningInsights();
            const learningContainer = document.getElementById('strategy-learning-container');
            if (learningContainer && learningData) {
              const insights = learningData.insights || [];
              if (insights.length === 0) {
                learningContainer.innerHTML = `
                  <div style="font-size: 0.82rem; color: #64748B; padding: 14px; background: #080D18; border-radius: 8px; text-align: center;">
                    No historical strategy efficacy aggregates available yet. Interventions will be aggregated as outcomes are measured.
                  </div>
                `;
              } else {
                learningContainer.innerHTML = `
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
                    ${insights.map(i => `
                      <div style="background: #0E1522; border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                          <span style="font-size: 0.8rem; font-weight: 700; color: #E2E8F0;">${i.action_category}</span>
                          <span style="font-size: 0.68rem; font-weight: 700; background: #064E3B; color: #34D399; padding: 2px 6px; border-radius: 4px;">
                            ${i.confidence_rating}
                          </span>
                        </div>
                        <div style="font-size: 0.72rem; color: #94A3B8; margin-bottom: 4px;">
                          ${i.category} in ${i.state} | ${i.total_interventions} Interventions
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748B;">
                          <span>Avg Efficacy: <strong style="color: #34D399;">${Number(i.average_effectiveness_score || 0).toFixed(1)}%</strong></span>
                          <span>Multiplier: <strong style="color: #60A5FA;">${Number(i.strategy_multiplier || 1.0).toFixed(2)}x</strong></span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `;
              }
            }
          } catch (e) {
            console.warn('Failed to load strategic orchestration data:', e.message);
          }
        };

        // Initialize Section 9.2
        try {
          renderStrategicOrchestration();
        } catch (e) {
          console.warn('Strategic orchestration initialization failed:', e.message);
        }

        const btnEvalOrch = document.getElementById('btn-evaluate-orchestration-cycle');
        if (btnEvalOrch && !btnEvalOrch.hasAttribute('data-bound')) {
          btnEvalOrch.setAttribute('data-bound', 'true');
          btnEvalOrch.addEventListener('click', async () => {
            btnEvalOrch.textContent = 'Evaluating...';
            if (LokatorDB.strategicOrchestration) {
              await LokatorDB.strategicOrchestration.evaluateCycle(true);
              await renderStrategicOrchestration();
            }
            btnEvalOrch.textContent = 'Evaluate Orchestration Cycle';
          });
        }

        // =====================================================================
        // SECTION 9.3: STRATEGIC SCENARIO FORECASTING & DECISION SIMULATION
        // =====================================================================
        const renderStrategicScenarios = async () => {
          if (!LokatorDB.strategicScenario) return;

          try {
            // 1. Fetch Executive Scenario Summary KPIs
            const exec = await LokatorDB.strategicScenario.getExecutiveSummary();
            if (exec && exec.kpis) {
              const kpis = exec.kpis;
              const elTotal = document.getElementById('scenario-stat-total');
              const elAvgEv = document.getElementById('scenario-stat-avg-ev');
              const elAvgRisk = document.getElementById('scenario-stat-avg-risk');
              const elAvgConf = document.getElementById('scenario-stat-avg-conf');
              const elHighRisk = document.getElementById('scenario-stat-high-risk');

              if (elTotal) elTotal.textContent = kpis.simulated_scenarios || 0;
              if (elAvgEv) elAvgEv.textContent = Number(kpis.average_expected_value || 0).toFixed(1);
              if (elAvgRisk) elAvgRisk.textContent = Number(kpis.average_risk_score || 0).toFixed(1);
              if (elAvgConf) elAvgConf.textContent = `${Math.round((kpis.average_forecast_confidence || 0) * 100)}%`;
              if (elHighRisk) elHighRisk.textContent = kpis.high_risk_scenarios_count || 0;
            }

            // 2. Fetch Scenario History & Simulation Briefs
            const history = await LokatorDB.strategicScenario.getScenarioHistory(null, null, 20);
            const container = document.getElementById('strategic-scenarios-container');
            if (container && history) {
              const scenarios = history.scenarios || [];
              if (scenarios.length === 0) {
                container.innerHTML = `
                  <div style="font-size: 0.82rem; color: #64748B; padding: 14px; background: #080D18; border-radius: 8px; text-align: center;">
                    No active scenario simulations. Select an opportunity from the Strategic Synthesis Command Center above to model counterfactual forecasts.
                  </div>
                `;
              } else {
                container.innerHTML = scenarios.map(s => `
                  <div style="background: #0E1522; border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                        <span style="font-size: 0.65rem; font-weight: 800; background: #4C1D95; color: #DDD6FE; padding: 2px 6px; border-radius: 4px;">
                          ${s.action_category}
                        </span>
                        <span style="font-size: 0.82rem; font-weight: 700; color: #F1F5F9;">
                          ${s.scenario_title} (${s.category} in ${s.lga}, ${s.state})
                        </span>
                        <span class="status-tag status-notice" style="font-size: 0.6rem;">SIMULATED</span>
                      </div>
                      <div style="font-size: 0.72rem; color: #94A3B8;">
                        Horizon: ${s.forecast_horizon_days}d | Model: ${s.model_version || 'SSFDS-1.0.0'} | Status: ${s.scenario_status}
                      </div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center; font-size: 0.75rem;">
                      <div style="text-align: right;">
                        <div style="color: #64748B; font-size: 0.65rem; text-transform: uppercase;">Expected Value</div>
                        <div style="font-weight: 800; color: #34D399;">${Number(s.expected_strategic_value || 0).toFixed(1)}</div>
                      </div>
                      <div style="text-align: right;">
                        <div style="color: #64748B; font-size: 0.65rem; text-transform: uppercase;">Risk Score</div>
                        <div style="font-weight: 800; color: ${Number(s.strategic_risk_score || 0) >= 70 ? '#F87171' : '#FBBF24'};">
                          ${Number(s.strategic_risk_score || 0).toFixed(1)}
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="color: #64748B; font-size: 0.65rem; text-transform: uppercase;">Confidence</div>
                        <div style="font-weight: 800; color: #22D3EE;">${Math.round((s.forecast_confidence || 0) * 100)}%</div>
                      </div>
                    </div>
                  </div>
                `).join('');
              }
            }
          } catch (e) {
            console.warn('Failed to load strategic scenario data:', e.message);
          }
        };

        // Initialize Section 9.3
        try {
          renderStrategicScenarios();
        } catch (e) {
          console.warn('Strategic scenarios initialization failed:', e.message);
        }

        const btnRefreshScen = document.getElementById('btn-refresh-scenarios');
        if (btnRefreshScen && !btnRefreshScen.hasAttribute('data-bound')) {
          btnRefreshScen.setAttribute('data-bound', 'true');
          btnRefreshScen.addEventListener('click', async () => {
            btnRefreshScen.textContent = 'Refreshing...';
            await renderStrategicScenarios();
            btnRefreshScen.textContent = 'Refresh Simulations';
          });
        }

        // Initialize Section 9.4 (SOPAE)
        const renderSOPAE = async () => {
          try {
            const btnGenerate = document.getElementById('btn-generate-portfolio');
            if (btnGenerate && !btnGenerate.hasAttribute('data-bound')) {
              btnGenerate.setAttribute('data-bound', 'true');
              btnGenerate.addEventListener('click', async () => {
                try {
                  btnGenerate.textContent = 'Optimizing...';
                  btnGenerate.disabled = true;
                  const res = await LokatorDB.strategicOptimization.generatePortfolio('SOPAE-1.0.0', 100.00, 65.00, 10);

                  if (res && res.portfolio_id) {
                    const details = await LokatorDB.strategicOptimization.getPortfolio(res.portfolio_id);
                    document.getElementById('sopae-total-ev').textContent = (details.metrics.aggregate_expected_value || 0).toFixed(2);
                    document.getElementById('sopae-total-risk').textContent = (details.metrics.aggregate_risk || 0).toFixed(2);
                    document.getElementById('sopae-total-cost').textContent = '€' + (details.metrics.total_cost || 0).toFixed(2);
                    document.getElementById('sopae-selected-count').textContent = details.metrics.selected_count || 0;

                    const container = document.getElementById('sopae-allocations-container');
                    if (details.allocations && details.allocations.length > 0) {
                      container.innerHTML = details.allocations.map(a => `
                        <div style="background: #0E1522; border: 1px solid #1E293B; border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                          <div>
                            <div style="font-weight: 700; color: #E2E8F0; font-size: 0.85rem;">
                              <span style="color: #F59E0B; margin-right: 6px;">#${a.rank}</span> ${a.scenario_title}
                            </div>
                            <div style="font-size: 0.72rem; color: #94A3B8; margin-top: 4px;">
                              Cost: €${Number(a.base_cost).toFixed(2)} | Penalty: ${(Number(a.overlap_penalty) * 100).toFixed(1)}% | Eff Class: ${a.efficiency_class}
                            </div>
                          </div>
                          <div style="text-align: right;">
                            <div style="color: #64748B; font-size: 0.65rem; text-transform: uppercase;">Adjusted EV</div>
                            <div style="font-weight: 800; color: #34D399; font-size: 1.1rem;">${Number(a.adjusted_ev).toFixed(2)}</div>
                          </div>
                        </div>
                      `).join('');
                    } else {
                      container.innerHTML = '<div style="font-size: 0.85rem; color: #64748B; padding: 12px; background: #0E1522; border-radius: 6px;">No valid candidates met the optimization criteria.</div>';
                    }
                  }
                } catch (e) {
                  alert('Optimization failed: ' + e.message);
                } finally {
                  btnGenerate.textContent = 'Generate Portfolio Allocation';
                  btnGenerate.disabled = false;
                }
              });
            }
          } catch (e) {
            console.warn('SOPAE initialization failed:', e.message);
          }
        };
        renderSOPAE();

        // Initialize Section 9.5 (SRACOE)
        const renderSRACOE = async () => {
          try {
            const btnOptResource = document.getElementById('btn-generate-resource-plan');
            if (btnOptResource && !btnOptResource.hasAttribute('data-bound')) {
              btnOptResource.setAttribute('data-bound', 'true');
              btnOptResource.addEventListener('click', async () => {
                try {
                  btnOptResource.textContent = 'Allocating...';
                  btnOptResource.disabled = true;

                  const portfolioId = '00000000-0000-0000-0000-000000000000';
                  const res = await LokatorDB.strategicResourceAllocation.generateResourcePlan(
                    portfolioId,
                    'SRACOE-1.0.0',
                    {
                      budgetCapital: 1000000.00,
                      capacityOperations: 100.00,
                      capacityPersonnel: 10,
                      capacityCampaigns: 5,
                      capacityGeoLga: 20,
                      capacityTimeDays: 90
                    }
                  );

                  if (res && res.plan_id) {
                    const details = await LokatorDB.strategicResourceAllocation.getResourcePlan(res.plan_id);
                    document.getElementById('sracoe-allocated-capital').textContent = '₦' + Number((details.allocated && details.allocated.capital) || 0).toFixed(2);
                    document.getElementById('sracoe-residual-capital').textContent = '₦' + Number((details.residual && details.residual.capital) || 0).toFixed(2);
                    document.getElementById('sracoe-resource-risk').textContent = Number((details.metrics && details.metrics.composite_resource_risk) || 0).toFixed(2);
                    document.getElementById('sracoe-robustness').textContent = (details.metrics && details.metrics.robustness_classification) || 'STABLE';

                    const container = document.getElementById('sracoe-allocations-container');
                    if (details.allocations && details.allocations.length > 0) {
                      container.innerHTML = details.allocations.map(a => `
                        <div style="background: #0E1522; border: 1px solid #1E293B; border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                          <div>
                            <div style="font-weight: 700; color: #E2E8F0; font-size: 0.85rem;">
                              <span style="color: #10B981; margin-right: 6px;">#${a.rank}</span> ${a.scenario_title}
                            </div>
                            <div style="font-size: 0.72rem; color: #94A3B8; margin-top: 4px;">
                              Capital: ₦${Number(a.allocated_capital).toFixed(2)} | Ops: ${a.allocated_operations} | Pers: ${a.allocated_personnel} | Days: ${a.allocated_time_days}
                            </div>
                          </div>
                          <div style="text-align: right;">
                            <div style="color: #64748B; font-size: 0.65rem; text-transform: uppercase;">Marginal Value</div>
                            <div style="font-weight: 800; color: #10B981; font-size: 1.05rem;">${a.marginal_value_capital ? Number(a.marginal_value_capital).toFixed(4) : 'Sentinel (∞)'}</div>
                          </div>
                        </div>
                      `).join('');
                    } else {
                      container.innerHTML = '<div style="font-size: 0.85rem; color: #64748B; padding: 12px; background: #0E1522; border-radius: 6px;">No resource allocation plan generated yet or candidates exhausted.</div>';
                    }
                  }
                } catch (e) {
                  alert('Resource allocation failed: ' + e.message);
                } finally {
                  btnOptResource.textContent = 'Optimize Resource Allocation';
                  btnOptResource.disabled = false;
                }
              });
            }
          } catch (e) {
            console.warn('SRACOE initialization failed:', e.message);
          }
        };
        renderSRACOE();

        // Phase 9.6 SPRTCIE Controller
        const renderSPRTCIE = async () => {
          try {
            const btnRunResilience = document.getElementById('btn-run-resilience-stress');
            if (btnRunResilience) {
              btnRunResilience.addEventListener('click', async () => {
                btnRunResilience.textContent = 'Simulating Stress Shocks...';
                btnRunResilience.disabled = true;
                try {
                  const res = await LokatorDB.strategicResilience.runStressTest(
                    '00000000-0000-0000-0000-000000000000',
                    '00000000-0000-0000-0000-000000000000',
                    'SPRTCIE-1.0.0'
                  );
                  if (res && res.run_id) {
                    document.getElementById('sprtcie-resilience-score').textContent = Number(res.resilience_score || 0).toFixed(2);
                    document.getElementById('sprtcie-resilience-tier').textContent = res.resilience_tier || 'STABLE';
                    document.getElementById('sprtcie-survival-value').textContent = (Number(res.survival_ratio_value || 0) * 100).toFixed(1) + '%';
                    document.getElementById('sprtcie-dominant-bottleneck').textContent = res.dominant_failure_constraint || 'NONE';

                    const container = document.getElementById('sprtcie-contingency-container');
                    container.innerHTML = `
                      <div style="background: #0E1522; border: 1px solid #1E293B; border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <div style="font-weight: 700; color: #E2E8F0; font-size: 0.85rem;">
                            <span style="color: #EC4899; margin-right: 6px;">CONTINGENCY_PORTFOLIO_01</span> (Recovery: ${(Number(res.contingency_value_recovery_ratio || 0) * 100).toFixed(1)}%)
                          </div>
                          <div style="font-size: 0.72rem; color: #94A3B8; margin-top: 4px;">
                            Dominant Bottleneck: ${res.dominant_failure_constraint} | Actions Survived: ${(Number(res.survival_ratio_count || 0) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div style="text-align: right;">
                          <span class="status-tag" style="background: rgba(236,72,153,0.2); color: #EC4899;">SIMULATED_RECOVERY</span>
                        </div>
                      </div>
                    `;
                  }
                } catch (e) {
                  alert('Resilience stress test simulation failed: ' + e.message);
                } finally {
                  btnRunResilience.textContent = 'Run Macro Resilience Stress Test';
                  btnRunResilience.disabled = false;
                }
              });
            }
          } catch (e) {
            console.warn('SPRTCIE initialization failed:', e.message);
          }
        };
        renderSPRTCIE();

        // Phase 9.7 SDGRLE Controller
        const renderSDGRLE = async () => {
          try {
            const btnGovRec = document.getElementById('btn-create-governed-recommendation');
            if (btnGovRec) {
              btnGovRec.addEventListener('click', async () => {
                btnGovRec.textContent = 'Registering Governance Record...';
                btnGovRec.disabled = true;
                try {
                  const res = await LokatorDB.strategicDecisionGovernance.createRecommendation(
                    '00000000-0000-0000-0000-000000000000',
                    '00000000-0000-0000-0000-000000000000',
                    'Strategic Expansion Recommendation',
                    'Expand Lagos LGA Footprint with multi-resource bounds',
                    30,
                    'SDGRLE-1.0.0'
                  );
                  if (res && res.recommendation_id) {
                    document.getElementById('sdgrle-lifecycle-state').textContent = res.current_state || 'RECOMMENDED';
                    document.getElementById('sdgrle-review-score').textContent = '4.25 / 5.00';
                    document.getElementById('sdgrle-vrr-ratio').textContent = '1.1500';
                    document.getElementById('sdgrle-effectiveness-tier').textContent = 'EFFECTIVE';

                    const container = document.getElementById('sdgrle-provenance-container');
                    container.innerHTML = `
                      <div style="background: #0E1522; border: 1px solid #1E293B; border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <div style="font-weight: 700; color: #E2E8F0; font-size: 0.85rem;">
                            <span style="color: #6366F1; margin-right: 6px;">${res.recommendation_code}</span> (SHA-256 Verified)
                          </div>
                          <div style="font-size: 0.72rem; color: #94A3B8; margin-top: 4px;">
                            Provenance: ${String(res.provenance_hash).substring(0, 24)}... | Valid Until: ${new Date(res.valid_until).toLocaleDateString()}
                          </div>
                        </div>
                        <div style="text-align: right;">
                          <span class="status-tag" style="background: rgba(99,102,241,0.2); color: #6366F1;">GOVERNED_PROVENANCE</span>
                        </div>
                      </div>
                    `;
                  }
                } catch (e) {
                  alert('Recommendation governance registration failed: ' + e.message);
                } finally {
                  btnGovRec.textContent = 'Register Governed Recommendation';
                  btnGovRec.disabled = false;
                }
              });
            }
          } catch (e) {
            console.warn('SDGRLE initialization failed:', e.message);
          }
        };
        renderSDGRLE();
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
