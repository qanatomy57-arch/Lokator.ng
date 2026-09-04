/**
 * LOKATOR.NG — TRUST & SAFETY COMPLIANCE PORTAL (admin.js)
 * Manages artisan identity/NIN/CAC review queues, dispute resolution, and audit logs.
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // 1. Tab Switching
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabPanels = document.querySelectorAll('.admin-tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(`panel-${target}`);
      if (panel) panel.classList.add('active');
    });
  });

  // 2. Hydration Logic
  async function hydrateCompliancePortal() {
    if (typeof LokatorDB === 'undefined' || !LokatorDB.compliance) return;

    // Load Providers & Queues
    const pendingVerifications = LokatorDB.compliance.getPendingVerifications();
    const reportedCases = LokatorDB.compliance.getReportedCases();
    const openDisputes = reportedCases.filter(r => r.status === 'open');
    const auditLogs = LokatorDB.compliance.getAuditLogs();

    let allProviders = [];
    try {
      const res = await LokatorDB.getProviders();
      allProviders = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      allProviders = (typeof LokatorDB.getProvidersSync === 'function') ? LokatorDB.getProvidersSync() : [];
    }
    if (!Array.isArray(allProviders)) allProviders = [];

    const verifiedCount = allProviders.filter(p => p.is_verified || p.isVerified || p.nin_verified).length;

    // 2.1 Overview KPIs
    const kpiPending = document.getElementById('kpi-pending-verifications');
    const kpiVerified = document.getElementById('kpi-total-verified');
    const kpiDisputes = document.getElementById('kpi-open-disputes');
    const countVerTab = document.getElementById('tab-count-verifications');
    const countDisTab = document.getElementById('tab-count-disputes');

    if (kpiPending) kpiPending.textContent = pendingVerifications.length;
    if (kpiVerified) kpiVerified.textContent = verifiedCount;
    if (kpiDisputes) kpiDisputes.textContent = openDisputes.length;
    if (countVerTab) countVerTab.textContent = pendingVerifications.length;
    if (countDisTab) countDisTab.textContent = openDisputes.length;

    // 2.2 Render Verification Queue Table
    const tbodyVer = document.getElementById('tbody-verifications');
    if (tbodyVer) {
      if (pendingVerifications.length === 0) {
        tbodyVer.innerHTML = `<tr><td colspan="7" style="padding: 24px; text-align: center; color: #64748B;">No pending verification requests in queue.</td></tr>`;
      } else {
        tbodyVer.innerHTML = pendingVerifications.map(req => {
          const safeDate = req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : 'Recent';
          const maskedRef = req.document_masked_ref || 
            (typeof PadiFixVerification !== 'undefined' ? PadiFixVerification.maskDocumentReference(req.doc_type, req.doc_ref) : 'REF: ****');
          return `
            <tr>
              <td style="font-weight: 700; color: #F1F5F9;">${req.name}</td>
              <td><span style="color: #38BDF8;">${req.trade}</span> (${req.category})</td>
              <td>${req.lga ? req.lga + ', ' : ''}${req.state}</td>
              <td style="font-weight: 600; color: #FBBF24;">${req.doc_type}</td>
              <td style="font-family: monospace; color: #CBD5E1;">${maskedRef}</td>
              <td style="font-size: 11px; color: #94A3B8;">${safeDate}</td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="btn-action-sm btn-approve" data-id="${req.provider_id}">
                    ✓ Approve Pro
                  </button>
                  <button type="button" class="btn-action-sm btn-reject" data-id="${req.provider_id}">
                    ✕ Reject
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // 2.3 Render Disputes Table
    const tbodyDis = document.getElementById('tbody-disputes');
    if (tbodyDis) {
      if (reportedCases.length === 0) {
        tbodyDis.innerHTML = `<tr><td colspan="7" style="padding: 24px; text-align: center; color: #64748B;">No open dispute reports recorded.</td></tr>`;
      } else {
        tbodyDis.innerHTML = reportedCases.map(rep => {
          const isResolved = rep.status === 'resolved';
          return `
            <tr>
              <td style="font-family: monospace; color: #94A3B8;">${rep.report_id}</td>
              <td style="font-weight: 700; color: #F1F5F9;">#${rep.provider_id}</td>
              <td>${rep.reporter_name}</td>
              <td style="color: #F87171; font-weight: 600;">${rep.issue_type}</td>
              <td style="max-width: 250px; font-size: 12px; color: #CBD5E1;">${rep.details}</td>
              <td>
                <span class="status-tag ${isResolved ? 'status-good' : 'status-bad'}" style="font-size: 10.5px;">
                  ${rep.status.toUpperCase()}
                </span>
              </td>
              <td>
                ${!isResolved ? `
                  <button type="button" class="btn-action-sm btn-resolve" data-report-id="${rep.report_id}">
                    Resolve Case
                  </button>
                ` : `<span style="font-size: 11px; color: #34D399;">Resolved ✓</span>`}
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // 2.4 Render Audit Ledger Table
    const tbodyAud = document.getElementById('tbody-audit');
    if (tbodyAud) {
      if (auditLogs.length === 0) {
        tbodyAud.innerHTML = `<tr><td colspan="6" style="padding: 24px; text-align: center; color: #64748B;">No audit entries recorded yet.</td></tr>`;
      } else {
        tbodyAud.innerHTML = auditLogs.map(log => {
          const safeTime = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent';
          const actionClass = log.action.includes('APPROVED') ? 'status-good' : (log.action.includes('REJECTED') ? 'status-bad' : 'status-notice');
          return `
            <tr>
              <td style="font-family: monospace; font-size: 11px; color: #94A3B8;">${log.log_id}</td>
              <td><span class="status-tag ${actionClass}" style="font-size: 10px;">${log.action}</span></td>
              <td style="font-family: monospace; color: #F1F5F9;">#${log.provider_id || log.report_id || '--'}</td>
              <td style="color: #CBD5E1;">${log.reviewer || 'Compliance Admin'}</td>
              <td style="color: #CBD5E1; font-size: 12px;">${log.notes || '--'}</td>
              <td style="font-size: 11px; color: #94A3B8;">${safeTime}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  // 3. Action Event Listeners
  document.addEventListener('click', async (e) => {
    const btnApprove = e.target.closest('.btn-approve');
    if (btnApprove) {
      const provId = btnApprove.getAttribute('data-id');
      if (!provId || typeof LokatorDB === 'undefined' || !LokatorDB.compliance) return;

      const confirmApprove = confirm(`Approve artisan #${provId} as Verified Pro?\n\nThis will grant the Verified Pro badge and increase search ranking completeness.`);
      if (confirmApprove) {
        LokatorDB.compliance.approveVerification(provId, {
          reviewer: 'Chief Compliance Officer',
          notes: 'NIN and identity validation confirmed against official standard.',
          badgeType: 'Verified Pro'
        });
        alert(`✅ Artisan #${provId} is now verified on the marketplace.`);
        await hydrateCompliancePortal();
      }
    }

    const btnReject = e.target.closest('.btn-reject');
    if (btnReject) {
      const provId = btnReject.getAttribute('data-id');
      if (!provId || typeof LokatorDB === 'undefined' || !LokatorDB.compliance) return;

      const reason = prompt('Please enter the rejection reason or document correction required for the artisan:', 'NIN document number does not match registered trade name.');
      if (reason) {
        LokatorDB.compliance.rejectVerification(provId, {
          reviewer: 'Chief Compliance Officer',
          reason: reason
        });
        alert(`Artisan #${provId} verification marked rejected. Feedback recorded.`);
        await hydrateCompliancePortal();
      }
    }

    const btnResolve = e.target.closest('.btn-resolve');
    if (btnResolve) {
      const repId = btnResolve.getAttribute('data-report-id');
      if (!repId || typeof LokatorDB === 'undefined' || !LokatorDB.compliance) return;

      const notes = prompt('Enter resolution findings and action taken:', 'Contacted customer and artisan. Mutual resolution reached.');
      if (notes) {
        LokatorDB.compliance.resolveReport(repId, {
          reviewer: 'Dispute Desk Lead',
          resolution: notes,
          actionTaken: 'remediated'
        });
        alert(`Dispute ${repId} resolved.`);
        await hydrateCompliancePortal();
      }
    }
  });

  const btnRefresh = document.getElementById('btn-refresh-queue');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => hydrateCompliancePortal());
  }

  const btnReconcile = document.getElementById('btn-reconcile-kyc');
  if (btnReconcile) {
    btnReconcile.addEventListener('click', async () => {
      const feedback = document.getElementById('reconcile-feedback');
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = 'rgba(2, 132, 199, 0.15)';
        feedback.style.color = '#38BDF8';
        feedback.style.border = '1px solid rgba(2, 132, 199, 0.3)';
        feedback.textContent = '🔄 Reconciling pending KYC requests with verification gateway...';
      }

      try {
        let result = { total: 0, reconciled: 0, unchanged: 0 };
        if (typeof PadiFixVerification !== 'undefined' && PadiFixVerification.PadiFixVerificationGateway) {
          result = await PadiFixVerification.PadiFixVerificationGateway.reconcilePendingVerifications({}, { role: 'compliance_officer', userId: 'admin_officer' });
        }
        if (feedback) {
          feedback.style.background = 'rgba(16, 185, 129, 0.15)';
          feedback.style.color = '#10B981';
          feedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';
          feedback.textContent = `✅ Reconciliation complete: Scanned ${result.total} pending record(s), reconciled ${result.reconciled}, unchanged ${result.unchanged}.`;
        }
        await hydrateCompliancePortal();
      } catch (err) {
        if (feedback) {
          feedback.style.background = 'rgba(239, 68, 68, 0.15)';
          feedback.style.color = '#F87171';
          feedback.style.border = '1px solid rgba(239, 68, 68, 0.3)';
          feedback.textContent = `❌ Reconciliation error: ${err.message}`;
        }
      }
    });
  }

  // Initial load
  await hydrateCompliancePortal();
});
