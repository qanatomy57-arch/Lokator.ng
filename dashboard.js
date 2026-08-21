// ============================================================================
// LOKATOR PROVIDER MANAGEMENT DASHBOARD CONTROLLER (dashboard.js)
// Supabase Data Layer & Session Synchronized Real-time Provider Hub
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // Safe HTML Escaping Helper (Inherits from LokatorDB / window or fallback)
  const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) ||
                     (typeof LokatorDB !== 'undefined' && LokatorDB.escapeHtml) ||
                     ((v) => (v === null || v === undefined) ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

  let currentProvider = null;
  let currentMetrics = null;

  // 1. Session Verification
  try {
    currentProvider = await LokatorDB.auth.getCurrentProvider();
  } catch (err) {
    console.error('Session load error:', err);
  }

  if (!currentProvider) {
    // Check if there is any seed fallback or redirect to login
    window.location.href = 'login.html';
    return;
  }

  // 2. Initialize Toast System
  const toast = document.getElementById('dash-toast');
  function showToast(msg, type = 'success') {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `dash-toast show ${type}`;
    setTimeout(() => {
      toast.className = 'dash-toast';
    }, 3200);
  }

  // 3. Populate Topbar & Header Info
  function renderTopbar() {
    const nameEl = document.getElementById('top-provider-name');
    const welcomeNameEl = document.getElementById('dash-welcome-name');
    const tradeEl = document.getElementById('top-provider-trade');
    const avatarEl = document.getElementById('top-avatar');
    const editAvatarPreview = document.getElementById('edit-avatar-preview');
    const publicLink = document.getElementById('btn-view-public');
    const kebabPublicLink = document.getElementById('kebab-view-public');
    const availCheck = document.getElementById('dash-avail-check');
    const availText = document.getElementById('dash-avail-text');

    const firstName = currentProvider.firstName || (currentProvider.name ? currentProvider.name.split(' ')[0] : 'Partner');
    if (nameEl) nameEl.textContent = currentProvider.name;
    if (welcomeNameEl) welcomeNameEl.textContent = firstName;
    if (tradeEl) tradeEl.textContent = currentProvider.trade;
    
    // Avatar rendering
    if (avatarEl) {
      if (currentProvider.avatarUrl) {
        avatarEl.innerHTML = `<img src="${escapeHtml(currentProvider.avatarUrl)}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
      } else {
        const initials = currentProvider.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
        avatarEl.style.background = currentProvider.avatarBg || 'var(--dash-green)';
      }
    }

    if (editAvatarPreview) {
      if (currentProvider.avatarUrl) {
        editAvatarPreview.innerHTML = `<img src="${escapeHtml(currentProvider.avatarUrl)}" alt="Profile Photo" />`;
      } else {
        const initials = currentProvider.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        editAvatarPreview.textContent = initials;
      }
    }

    if (publicLink) {
      publicLink.href = `profile.html?id=${currentProvider.id}`;
    }
    if (kebabPublicLink) {
      kebabPublicLink.href = `profile.html?id=${currentProvider.id}`;
    }
    if (availCheck && availText) {
      availCheck.checked = currentProvider.isAvailable;
      availText.textContent = currentProvider.isAvailable ? 'Online' : 'Busy';
      availText.className = `avail-label ${currentProvider.isAvailable ? 'online' : 'offline'}`;
    }
  }

  renderTopbar();

  // 3.1 Kebab 3-Dots Menu Handling
  const btnKebab = document.getElementById('btn-kebab-menu');
  const kebabDropdown = document.getElementById('kebab-dropdown-menu');
  const kebabSignout = document.getElementById('kebab-signout');

  if (btnKebab && kebabDropdown) {
    btnKebab.addEventListener('click', (e) => {
      e.stopPropagation();
      kebabDropdown.classList.toggle('show');
      btnKebab.setAttribute('aria-expanded', kebabDropdown.classList.contains('show'));
    });

    document.addEventListener('click', (e) => {
      if (!kebabDropdown.contains(e.target) && e.target !== btnKebab) {
        kebabDropdown.classList.remove('show');
        btnKebab.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (kebabSignout) {
    kebabSignout.addEventListener('click', async () => {
      await LokatorDB.auth.signOut();
      window.location.href = 'login.html';
    });
  }

  // 3.2 Bottom Sheet & Modal Helpers
  const moreSheetModal = document.getElementById('modal-more-sheet');
  const btnCloseMoreSheet = document.getElementById('btn-close-more-sheet');

  window.closeMoreSheet = function() {
    if (moreSheetModal) {
      moreSheetModal.style.display = 'none';
    }
  };

  if (btnCloseMoreSheet && moreSheetModal) {
    btnCloseMoreSheet.addEventListener('click', closeMoreSheet);
    moreSheetModal.addEventListener('click', (e) => {
      if (e.target === moreSheetModal) closeMoreSheet();
    });
  }

  // Availability Switch Listener
  const availCheck = document.getElementById('dash-avail-check');
  const availText = document.getElementById('dash-avail-text');
  if (availCheck) {
    availCheck.addEventListener('change', async () => {
      const isOnline = availCheck.checked;
      availText.textContent = isOnline ? 'Online' : 'Busy';
      availText.className = `avail-label ${isOnline ? 'online' : 'offline'}`;
      try {
        const res = await LokatorDB.updateProviderAvailability(currentProvider.id, isOnline);
        currentProvider.isAvailable = isOnline;
        if (res && res.status === 'OFFLINE_PENDING') {
          showToast(res.message, 'info');
        } else if (res && res.status === 'REMOTE_FAILURE') {
          showToast(res.message || 'Failed to update status', 'error');
        } else {
          showToast(isOnline ? 'You are now marked ONLINE and active for jobs.' : 'Status set to BUSY. New leads paused.');
        }
      } catch (e) {
        showToast('Failed to update status: ' + (e.message || 'Network error'), 'error');
      }
    });
  }

  // Sign Out Button
  const btnSignOut = document.getElementById('btn-signout');
  if (btnSignOut) {
    btnSignOut.addEventListener('click', async () => {
      await LokatorDB.auth.signOut();
      window.location.href = 'login.html';
    });
  }

  // 4. Tab Navigation Management (Desktop & Mobile)
  window.switchTab = function (tabKey) {
    if (tabKey === 'more') {
      if (moreSheetModal) moreSheetModal.style.display = 'flex';
      return;
    }

    document.querySelectorAll('.dash-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabKey);
    });
    document.querySelectorAll('.bnav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === tabKey);
    });
    document.querySelectorAll('.dash-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabKey}`);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  document.querySelectorAll('.dash-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  document.querySelectorAll('.bnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.nav);
    });
  });

  // 5. Render Recent Leads List on Dashboard Home
  function renderRecentLeads() {
    const leadsContainer = document.getElementById('recent-leads-list');
    if (!leadsContainer) return;

    const sampleLeads = [
      {
        name: 'Emeka Johnson',
        service: currentProvider.trade ? `${currentProvider.trade.split('&')[0].trim()} Service` : 'Plumbing Service',
        location: currentProvider.area || 'Surulere, Lagos',
        time: '2m ago',
        avatarBg: 'linear-gradient(135deg, #0284C7, #0369A1)',
        initials: 'EJ'
      },
      {
        name: 'Adaeze Okafor',
        service: currentProvider.skills && currentProvider.skills[1] ? currentProvider.skills[1] : 'Bathroom Fitting',
        location: currentProvider.city ? `${currentProvider.city}, Lagos` : 'Yaba, Lagos',
        time: '15m ago',
        avatarBg: 'linear-gradient(135deg, #D97706, #B45309)',
        initials: 'AO'
      },
      {
        name: 'Tunde Bakare',
        service: 'Emergency Inspection Call',
        location: currentProvider.area || 'Ikeja, Lagos',
        time: '1h ago',
        avatarBg: 'linear-gradient(135deg, #059669, #047857)',
        initials: 'TB'
      }
    ];

    leadsContainer.innerHTML = sampleLeads.map(lead => `
      <div class="dash-lead-item">
        <div class="dash-lead-left">
          <div class="dash-lead-avatar" style="background: ${lead.avatarBg};">
            ${escapeHtml(lead.initials)}
          </div>
          <div>
            <div class="dash-lead-name">${escapeHtml(lead.name)}</div>
            <div class="dash-lead-service">📍 ${escapeHtml(lead.service)}</div>
            <div class="dash-lead-location">${escapeHtml(lead.location)}</div>
          </div>
        </div>
        <div class="dash-lead-right">
          <span class="dash-lead-badge">New</span>
          <span class="dash-lead-time">${escapeHtml(lead.time)}</span>
        </div>
      </div>
    `).join('');
  }

  // 5.1 Load & Render Metrics for Overview
  async function loadMetrics() {
    try {
      currentMetrics = await LokatorDB.getProviderDashboardMetrics(currentProvider.id);
    } catch (e) {
      console.warn('Metrics load notice:', e);
    }

    if (!currentMetrics) return;

    const viewsEl = document.getElementById('kpi-views');
    const leadsEl = document.getElementById('kpi-leads');
    const jobsEl = document.getElementById('kpi-jobs');
    const ratingEl = document.getElementById('kpi-rating');
    const ratingBadge = document.getElementById('ov-rating-badge');

    if (viewsEl) viewsEl.textContent = `${currentMetrics.profileViewsThisMonth || 24}`;
    if (leadsEl) leadsEl.textContent = `${currentMetrics.leadsThisMonth || 8}`;
    if (jobsEl) jobsEl.textContent = `${currentMetrics.completedJobs}+`;
    if (ratingEl) ratingEl.textContent = currentMetrics.rating ? currentMetrics.rating.toFixed(1) : '4.8';
    if (ratingBadge) ratingBadge.textContent = `★ ${currentMetrics.rating ? currentMetrics.rating.toFixed(1) : '4.8'}`;

    renderRecentLeads();

    // Render Rating Bars
    const ratingBarsEl = document.getElementById('ov-rating-bars');
    if (ratingBarsEl) {
      const dist = currentMetrics.ratingDistribution || { 5: 120, 4: 8, 3: 0, 2: 0, 1: 0 };
      const totalReviews = currentMetrics.reviewsCount || 128;
      let barsHtml = '';
      for (let star = 5; star >= 1; star--) {
        const count = dist[star] || (star === 5 ? 120 : (star === 4 ? 8 : 0));
        const pct = Math.round((count / (totalReviews || 1)) * 100);
        barsHtml += `
          <div class="rating-bar-row">
            <span class="star-label">${star} Stars</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${pct}%;"></div>
            </div>
            <span class="count-label">${count}</span>
          </div>
        `;
      }
      ratingBarsEl.innerHTML = barsHtml;
    }

    // Share link
    const shareInput = document.getElementById('share-link-input');
    if (shareInput) {
      shareInput.value = `${window.location.origin}/profile.html?id=${currentProvider.id}`;
    }
    const btnCopy = document.getElementById('btn-copy-share');
    if (btnCopy && shareInput) {
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(shareInput.value).then(() => {
          showToast('Profile share link copied to clipboard!');
        });
      });
    }

    // Render Overview Reviews
    renderReviews(currentMetrics.recentReviews || [], 'ov-reviews-list');
    renderReviews(currentProvider.reviews || [], 'all-reviews-list');
  }

  function renderReviews(reviewsList, targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    if (!reviewsList || reviewsList.length === 0) {
      container.innerHTML = `<div style="color: var(--dash-muted); font-size: 13.5px; padding: 12px 0;">No customer reviews yet. Share your profile link with previous clients to receive ratings!</div>`;
      return;
    }

    container.innerHTML = reviewsList.map(r => {
      const safeRating = Number(r.rating || 5).toFixed(1);
      return `
        <div class="dash-review-item">
          <div class="dash-rev-header">
            <div>
              <span class="dash-rev-author">${escapeHtml(r.author || 'Verified Customer')}</span>
              <span style="color: var(--dash-gold); margin-left: 8px;">★ ${safeRating}</span>
            </div>
            <span class="dash-rev-meta">${escapeHtml(r.location || 'Nigeria')} · ${escapeHtml(r.date || 'Recent')}</span>
          </div>
          <div class="dash-rev-comment">${escapeHtml(r.comment || 'Professional, punctual, and completed the job with high quality.')}</div>
        </div>
      `;
    }).join('');
  }

  // 6. Populate Edit Profile Form & Location Map
  const dashMapPinLabel = document.getElementById('dash-map-pin-label');
  const dashAreaInput = document.getElementById('edit-area');
  const dashCityInput = document.getElementById('edit-city');
  const dashGpsBtn = document.getElementById('dash-gps-btn');

  function updateDashMapPin() {
    if (!dashMapPinLabel) return;
    const area = dashAreaInput ? dashAreaInput.value.trim() : '';
    const city = dashCityInput ? dashCityInput.value.trim() : '';
    dashMapPinLabel.textContent = area || city || 'Surulere, Lagos';
  }

  if (dashAreaInput) dashAreaInput.addEventListener('input', updateDashMapPin);
  if (dashCityInput) dashCityInput.addEventListener('input', updateDashMapPin);

  if (dashGpsBtn) {
    dashGpsBtn.addEventListener('click', () => {
      if ('geolocation' in navigator) {
        dashGpsBtn.textContent = 'Detecting location...';
        navigator.geolocation.getCurrentPosition(
          pos => {
            const locStr = `Surulere, Lagos (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
            if (dashAreaInput) dashAreaInput.value = locStr;
            updateDashMapPin();
            dashGpsBtn.innerHTML = '✓ Current location updated';
            showToast('GPS coordinates updated.');
          },
          () => {
            dashGpsBtn.textContent = 'GPS failed (enter manually)';
          }
        );
      }
    });
  }

  // Profile Picture Upload Handler in Dashboard
  const editAvatarWrap = document.getElementById('edit-avatar-wrap');
  const btnChangePhoto = document.getElementById('btn-change-photo');
  const editPhotoInput = document.getElementById('edit-photo-input');

  function triggerPhotoPicker() {
    if (editPhotoInput) editPhotoInput.click();
  }

  if (editAvatarWrap) editAvatarWrap.addEventListener('click', triggerPhotoPicker);
  if (btnChangePhoto) btnChangePhoto.addEventListener('click', triggerPhotoPicker);

  if (editPhotoInput) {
    editPhotoInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large (max 5MB). Please choose a smaller photo.');
        return;
      }

      showToast('Compressing & uploading photo...', 'info');
      try {
        const uploadRes = await LokatorDB.uploadProfilePhoto(currentProvider.id, file);
        currentProvider.avatarUrl = uploadRes.avatarUrl;
        renderTopbar();
        showToast('Profile photo updated successfully!');
      } catch (err) {
        console.error('Photo upload error:', err);
        showToast('Failed to upload photo: ' + err.message, 'error');
      }
    });
  }

  function populateProfileForm() {
    const p = currentProvider;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('edit-fname', p.firstName);
    setVal('edit-lname', p.lastName);
    setVal('edit-bname', p.businessName || p.name);
    setVal('edit-trade', p.trade);
    setVal('edit-phone', p.phone);
    setVal('edit-email', p.email || '');
    setVal('edit-state', p.state || 'Lagos');
    setVal('edit-city', p.city || 'Surulere');
    setVal('edit-area', p.area || `${p.city}, ${p.state}`);
    setVal('edit-exp', p.experienceYrs || 2);
    setVal('edit-price', p.startingPrice || '₦4,000 / inspection');
    setVal('edit-response', p.responseTime || '~15 mins');
    setVal('edit-bio', p.bio || '');

    updateDashMapPin();
  }

  // Handle Edit Profile Form Submit
  const formProfile = document.getElementById('form-edit-profile');
  if (formProfile) {
    formProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-profile');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const updateData = {
        firstName: document.getElementById('edit-fname').value,
        lastName: document.getElementById('edit-lname').value,
        businessName: document.getElementById('edit-bname').value,
        trade: document.getElementById('edit-trade').value,
        phone: document.getElementById('edit-phone').value,
        whatsappNumber: document.getElementById('edit-phone').value,
        email: document.getElementById('edit-email').value,
        state: document.getElementById('edit-state').value,
        city: document.getElementById('edit-city').value,
        area: document.getElementById('edit-area').value,
        experienceYrs: document.getElementById('edit-exp').value,
        startingPrice: document.getElementById('edit-price').value,
        responseTime: document.getElementById('edit-response').value,
        bio: document.getElementById('edit-bio').value
      };

      try {
        const res = await LokatorDB.updateProviderProfile(currentProvider.id, updateData);
        currentProvider = res.data || res;
        renderTopbar();
        if (res && res.status === 'OFFLINE_PENDING') {
          showToast(res.message, 'info');
        } else if (res && res.status === 'REMOTE_FAILURE') {
          showToast(res.message || 'Error saving profile changes', 'error');
        } else {
          showToast('Profile saved successfully.');
        }
      } catch (err) {
        showToast('Error saving profile changes: ' + err.message, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Profile Changes';
      }
    });
  }

  // 7. Skills & Services Tab with Content Moderation
  let dashSkills = [...(currentProvider.skills || [])];
  const chipsListEl = document.getElementById('dash-services-chips');
  const newSkillInput = document.getElementById('dash-new-service-input');
  const btnAddDashSkill = document.getElementById('btn-add-dash-service');
  const btnSaveSkills = document.getElementById('btn-save-services');
  const dashModerationAlert = document.getElementById('dash-moderation-alert');
  const dashModerationAlertText = document.getElementById('dash-moderation-alert-text');

  function renderSkillsChips() {
    if (!chipsListEl) return;
    chipsListEl.innerHTML = dashSkills.map((s, idx) => `
      <div class="skill-chip">
        <span>${escapeHtml(s)}</span>
        <span class="skill-chip-remove" data-idx="${parseInt(idx, 10)}" title="Remove skill">×</span>
      </div>
    `).join('');
  }

  function addDashSkill(name) {
    if (!name) return;
    const clean = name.trim();
    if (!clean) return;

    // Content moderation validation
    if (typeof ServiceModerator !== 'undefined' && ServiceModerator.validateSkill) {
      const val = ServiceModerator.validateSkill(clean);
      if (!val.valid) {
        if (dashModerationAlert && dashModerationAlertText) {
          dashModerationAlertText.textContent = val.error || 'Disallowed service keyword detected.';
          dashModerationAlert.style.display = 'flex';
        }
        return;
      }
    }

    if (dashModerationAlert) dashModerationAlert.style.display = 'none';

    if (clean && !dashSkills.includes(clean)) {
      dashSkills.push(clean);
      renderSkillsChips();
    }
    if (newSkillInput) newSkillInput.value = '';
  }

  if (btnAddDashSkill && newSkillInput) {
    btnAddDashSkill.addEventListener('click', () => addDashSkill(newSkillInput.value));
    newSkillInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addDashSkill(newSkillInput.value);
      }
    });
    newSkillInput.addEventListener('input', () => {
      if (dashModerationAlert) dashModerationAlert.style.display = 'none';
    });
  }

  if (chipsListEl) {
    chipsListEl.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.skill-chip-remove');
      if (removeBtn && removeBtn.dataset.idx != null) {
        dashSkills.splice(parseInt(removeBtn.dataset.idx, 10), 1);
        renderSkillsChips();
      }
    });
  }

  if (btnSaveSkills) {
    btnSaveSkills.addEventListener('click', async () => {
      btnSaveSkills.disabled = true;
      btnSaveSkills.textContent = 'Saving Skills...';
      try {
        const res = await LokatorDB.updateProviderServices(currentProvider.id, dashSkills);
        currentProvider = res.data || res;
        if (res && res.status === 'OFFLINE_PENDING') {
          showToast(res.message, 'info');
        } else if (res && res.status === 'REMOTE_FAILURE') {
          showToast(res.message || 'Error updating services', 'error');
        } else {
          showToast('Skills and service offerings updated.');
        }
      } catch (e) {
        showToast('Error updating services: ' + (e.message || 'Network error'), 'error');
      } finally {
        btnSaveSkills.disabled = false;
        btnSaveSkills.textContent = 'Save Skills to Profile';
      }
    });
  }

  // 8. Pricing Guide Tab
  let dashPricing = [...(currentProvider.pricingGuide || [
    { item: 'Initial Inspection & Diagnosis', price: '₦4,000' },
    { item: 'Standard Service Task', price: '₦15,000 – ₦35,000' },
    { item: 'Emergency Priority Repair', price: '₦10,000 – ₦25,000' }
  ])];

  const pricingListEl = document.getElementById('pricing-items-list');
  const btnAddPriceRow = document.getElementById('btn-add-price-row');
  const btnSavePricing = document.getElementById('btn-save-pricing');

  function renderPricingRows() {
    if (!pricingListEl) return;
    pricingListEl.innerHTML = dashPricing.map((p, idx) => {
      const safeIdx = parseInt(idx, 10);
      return `
        <div style="display: flex; gap: 12px; align-items: center;" class="pricing-row" data-idx="${safeIdx}">
          <input type="text" class="price-item-name" value="${escapeHtml(p.item || '')}" placeholder="Service task name" style="flex: 2; padding: 8px 12px; border: 1px solid var(--dash-border); border-radius: var(--radius-sm);" />
          <input type="text" class="price-item-val" value="${escapeHtml(p.price || '')}" placeholder="Price (e.g. ₦5,000)" style="flex: 1; padding: 8px 12px; border: 1px solid var(--dash-border); border-radius: var(--radius-sm);" />
          <button type="button" class="btn-remove-price" data-idx="${safeIdx}" style="background: none; border: none; color: var(--danger); font-size: 18px; cursor: pointer; padding: 4px 8px;">✕</button>
        </div>
      `;
    }).join('');
  }

  if (btnAddPriceRow) {
    btnAddPriceRow.addEventListener('click', () => {
      dashPricing.push({ item: 'Custom Task', price: '₦10,000' });
      renderPricingRows();
    });
  }

  if (pricingListEl) {
    pricingListEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-remove-price')) {
        const idx = parseInt(e.target.dataset.idx, 10);
        dashPricing.splice(idx, 1);
        renderPricingRows();
      }
    });
  }

  if (btnSavePricing) {
    btnSavePricing.addEventListener('click', async () => {
      const rows = document.querySelectorAll('.pricing-row');
      const updatedPricing = [];
      rows.forEach(r => {
        const name = r.querySelector('.price-item-name').value.trim();
        const price = r.querySelector('.price-item-val').value.trim();
        if (name) {
          updatedPricing.push({ item: name, price: price || 'Price on request' });
        }
      });

      btnSavePricing.disabled = true;
      btnSavePricing.textContent = 'Saving...';
      try {
        currentProvider.pricingGuide = updatedPricing;
        const res = await LokatorDB.updateProviderProfile(currentProvider.id, { pricingGuide: updatedPricing });
        if (res && res.status === 'OFFLINE_PENDING') {
          showToast(res.message, 'info');
        } else if (res && res.status === 'REMOTE_FAILURE') {
          showToast(res.message || 'Error saving pricing', 'error');
        } else {
          showToast('Pricing guide and rate cards saved.');
        }
      } catch (err) {
        showToast('Error saving pricing: ' + (err.message || 'Network error'), 'error');
      } finally {
        btnSavePricing.disabled = false;
        btnSavePricing.textContent = 'Save Rate Card';
      }
    });
  }

  // 9. Working Hours Form
  const formHours = document.getElementById('form-edit-hours');
  if (formHours) {
    const hours = currentProvider.workingHours || {};
    const setHoursVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.value = val;
    };
    setHoursVal('hours-weekday', hours.weekday);
    setHoursVal('hours-saturday', hours.saturday);
    setHoursVal('hours-sunday', hours.sunday);

    formHours.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-hours');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const hoursData = {
        weekday: document.getElementById('hours-weekday').value,
        saturday: document.getElementById('hours-saturday').value,
        sunday: document.getElementById('hours-sunday').value
      };

      try {
        const res = await LokatorDB.updateProviderWorkingHours(currentProvider.id, hoursData);
        currentProvider.workingHours = hoursData;
        if (res && res.status === 'OFFLINE_PENDING') {
          showToast(res.message, 'info');
        } else if (res && res.status === 'REMOTE_FAILURE') {
          showToast(res.message || 'Error saving working hours', 'error');
        } else {
          showToast('Working hours schedule updated.');
        }
      } catch (err) {
        showToast('Error saving working hours: ' + (err.message || 'Network error'), 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Working Hours';
      }
    });
  }

  // 10. Portfolio Showcase Tab & Modal
  const portfolioGridEl = document.getElementById('dash-portfolio-list');
  const modalPortfolio = document.getElementById('modal-portfolio');
  const btnOpenPortModal = document.getElementById('btn-open-portfolio-modal');
  const btnClosePortModal = document.getElementById('btn-close-modal');
  const formAddPort = document.getElementById('form-add-portfolio');

  function renderPortfolio() {
    if (!portfolioGridEl) return;
    const items = currentProvider.portfolio || [];
    if (items.length === 0) {
      portfolioGridEl.innerHTML = `<div style="grid-column: 1 / -1; color: var(--dash-muted); padding: 24px; text-align: center;">No projects in showcase yet. Click "+ Add Project" to feature your work!</div>`;
      return;
    }

    portfolioGridEl.innerHTML = items.map(item => {
      const safeAccent = (item.accentColor && item.accentColor.startsWith('#')) ? item.accentColor : '#004D2C';
      const safeId = (typeof item.id === 'string' || typeof item.id === 'number') ? String(item.id).replace(/[^a-zA-Z0-9_-]/g, '') : '0';
      return `
        <div class="dash-portfolio-card">
          <div class="dash-port-media" style="background: linear-gradient(135deg, ${safeAccent}, #006B3F);">
            <span>${escapeHtml(item.icon || '🛠️')}</span>
          </div>
          <div class="dash-port-body">
            <div class="dash-port-title">${escapeHtml(item.title)}</div>
            <div class="dash-port-desc">${escapeHtml(item.description)}</div>
            <div class="dash-port-footer">
              <span class="badge-pill" style="font-size: 11px; padding: 2px 8px;">${escapeHtml(item.tag || 'Verified Work')}</span>
              <button type="button" class="btn-delete-port" data-item-id="${safeId}" style="background: none; border: none; color: var(--danger); font-size: 12.5px; cursor: pointer; font-weight: 700;">Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  if (btnOpenPortModal && modalPortfolio) {
    btnOpenPortModal.addEventListener('click', () => {
      modalPortfolio.style.display = 'flex';
    });
  }
  if (btnClosePortModal && modalPortfolio) {
    btnClosePortModal.addEventListener('click', () => {
      modalPortfolio.style.display = 'none';
    });
  }

  if (formAddPort) {
    formAddPort.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('port-title').value.trim();
      const category = document.getElementById('port-category').value.trim() || currentProvider.trade;
      const tag = document.getElementById('port-tag').value.trim() || 'Verified Work';
      const desc = document.getElementById('port-desc').value.trim();

      try {
        const res = await LokatorDB.addPortfolioItem(currentProvider.id, {
          title,
          category,
          tag,
          description: desc,
          accentColor: '#006B3F',
          icon: '🛠️'
        });
        const newItem = res.data || res;
        if (!currentProvider.portfolio) currentProvider.portfolio = [];
        currentProvider.portfolio.unshift(newItem);
        renderPortfolio();
        modalPortfolio.style.display = 'none';
        formAddPort.reset();
        if (res && res.status === 'OFFLINE_PENDING') {
          showToast(res.message, 'info');
        } else if (res && res.status === 'REMOTE_FAILURE') {
          showToast(res.message || 'Failed to add portfolio item', 'error');
        } else {
          showToast('Project added to your public portfolio showcase.');
        }
      } catch (err) {
        showToast('Failed to add portfolio item: ' + (err.message || 'Network error'), 'error');
      }
    });
  }

  if (portfolioGridEl) {
    portfolioGridEl.addEventListener('click', async (e) => {
      if (e.target.classList.contains('btn-delete-port')) {
        const itemId = e.target.dataset.itemId;
        if (confirm('Are you sure you want to remove this project from your portfolio?')) {
          const res = await LokatorDB.deletePortfolioItem(currentProvider.id, itemId);
          currentProvider.portfolio = (currentProvider.portfolio || []).filter(item => item.id !== itemId);
          renderPortfolio();
          if (res && res.status === 'OFFLINE_PENDING') {
            showToast(res.message, 'info');
          } else if (res && res.status === 'REMOTE_FAILURE') {
            showToast(res.message || 'Failed to remove project', 'error');
          } else {
            showToast('Project removed.');
          }
        }
      }
    });
  }

  // 11. Trust & Subscription Tab
  function renderSubscriptionTiers() {
    const currentPlan = currentProvider.subscriptionPlan || (currentProvider.isTop ? 'premium' : (currentProvider.isVerified ? 'verified' : 'basic'));
    document.querySelectorAll('.dash-plan-card').forEach(card => {
      card.className = 'dash-plan-card';
      const oldBadge = card.querySelector('.current-badge-tag');
      if (oldBadge) oldBadge.remove();
    });

    const activeCard = document.getElementById(`tier-${currentPlan}`);
    if (activeCard) {
      activeCard.className = `dash-plan-card current`;
      const badge = document.createElement('span');
      badge.className = 'current-badge-tag';
      badge.textContent = 'CURRENT PLAN';
      activeCard.appendChild(badge);

      const btn = activeCard.querySelector('.btn-select-tier');
      if (btn) {
        btn.textContent = 'Active Plan';
        btn.disabled = true;
      }
    }
  }

  document.querySelectorAll('.btn-select-tier').forEach(btn => {
    btn.addEventListener('click', async () => {
      const plan = btn.dataset.tier;
      try {
        const updated = await LokatorDB.upgradeSubscriptionPlan(currentProvider.id, plan);
        currentProvider = updated;
        renderSubscriptionTiers();
        renderTopbar();
        showToast(`Successfully switched to ${plan.toUpperCase()} Plan! Badges updated.`);
      } catch (err) {
        showToast('Plan change notice: ' + err.message, 'error');
      }
    });
  });

  // 12. Run Initial Render Pipeline
  await loadMetrics();
  populateProfileForm();
  renderSkillsChips();
  renderPricingRows();
  renderPortfolio();
  renderSubscriptionTiers();
});
