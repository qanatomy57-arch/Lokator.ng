// ============================================================================
// LOKATOR PROVIDER PROFILE CONTROLLER (profile.js) — SUPABASE REAL DATA
// Database-driven single provider profile, real WhatsApp/Call actions, and reviews
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // Safe HTML Escaping Helper (Inherits from LokatorDB / window or fallback)
  const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) ||
                     (typeof LokatorDB !== 'undefined' && LokatorDB.escapeHtml) ||
                     ((v) => (v === null || v === undefined) ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

  // 1. Get Provider ID from URL query parameters
  const params = new URLSearchParams(window.location.search);
  const providerId = parseInt(params.get('id'), 10);

  if (!providerId) {
    showNotFound();
    return;
  }

  // 2. Fetch Provider Record from Supabase Data Layer
  let provider = null;
  try {
    provider = await LokatorDB.getProviderById(providerId);
  } catch (err) {
    console.error('Failed to load provider from Supabase:', err);
  }

  if (!provider) {
    showNotFound();
    return;
  }

  function showNotFound() {
    const main = document.querySelector('.profile-page-main');
    if (main) {
      main.innerHTML = `
        <div class="container" style="text-align: center; padding: 80px 20px;">
          <div style="font-size: 56px; margin-bottom: 12px;">🔍</div>
          <h2 style="font-size: 26px; font-weight: 800; color: var(--fg);">Provider Not Found</h2>
          <p style="color: var(--fg-muted); margin: 12px auto 24px; max-width: 480px;">
            The artisan profile you requested does not exist or is no longer publicly listed. Browse all active service providers in our directory.
          </p>
          <a href="search.html" class="btn btn-primary btn-lg">Browse Service Directory →</a>
        </div>
      `;
    }
  }

  // Update Page Title & Meta
  document.title = `${provider.name} — ${provider.trade} | Lokator`;

  // 3. Populate Breadcrumbs & Hero Header
  const crumbName = document.getElementById('crumb-provider-name');
  if (crumbName) crumbName.textContent = provider.name;

  const heroAvatar = document.getElementById('hero-avatar');
  if (heroAvatar) {
    if (provider.avatarUrl) {
      heroAvatar.innerHTML = `<img src="${escapeHtml(provider.avatarUrl)}" alt="${escapeHtml(provider.name)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
    } else {
      const initials = provider.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      heroAvatar.textContent = initials;
      heroAvatar.style.background = provider.avatarBg || 'var(--green)';
    }
  }

  const heroStatus = document.getElementById('hero-status-badge');
  if (heroStatus) {
    heroStatus.className = `profile-status-badge ${provider.isAvailable ? 'online' : 'offline'}`;
    heroStatus.title = provider.isAvailable ? 'Available today for jobs' : 'Currently busy';
  }

  const heroName = document.getElementById('hero-name');
  if (heroName) {
    heroName.innerHTML = `
      ${escapeHtml(provider.name)}
      ${provider.isTop ? '<span class="badge-tag-top" style="font-size: 12px; vertical-align: middle; margin-left: 8px;">⭐ Top Pick</span>' : ''}
    `;
  }

  const heroTrade = document.getElementById('hero-trade');
  if (heroTrade) heroTrade.textContent = provider.trade;

  const heroLocationText = document.getElementById('hero-location-text');
  if (heroLocationText) {
    heroLocationText.textContent = provider.area;
  }

  const heroRatingVal = document.getElementById('hero-rating-val');
  if (heroRatingVal) heroRatingVal.textContent = provider.rating.toFixed(1);

  const heroReviewsCount = document.getElementById('hero-reviews-count');
  if (heroReviewsCount) heroReviewsCount.textContent = provider.reviewsCount;

  // 4. Populate Metric Badges
  const metricRating = document.getElementById('metric-rating');
  if (metricRating) metricRating.textContent = `★ ${provider.rating.toFixed(1)}`;

  const metricJobs = document.getElementById('metric-jobs');
  if (metricJobs) metricJobs.textContent = `${parseInt(provider.completedJobs, 10) || 50}+`;

  const metricExp = document.getElementById('metric-exp');
  if (metricExp) metricExp.textContent = `${parseInt(provider.experienceYrs, 10) || 3} Years`;

  const metricResponse = document.getElementById('metric-response');
  if (metricResponse) metricResponse.textContent = provider.responseTime || '~15 mins';

  // 5. Hero Action Buttons (Direct Call & WhatsApp)
  const cleanPhone = (provider.phone || '').replace(/[^0-9]/g, '');
  const cleanWa = (provider.whatsappNumber || provider.phone || '').replace(/[^0-9]/g, '');
  const initialWaMsg = encodeURIComponent(
    `Hello ${provider.name}, I found your verified profile on Lokator and I'd like to inquire about your ${provider.trade} service in ${provider.area}.`
  );

  const btnCallHero = document.getElementById('btn-call-hero');
  if (btnCallHero) {
    btnCallHero.href = `tel:${cleanPhone}`;
    btnCallHero.addEventListener('click', () => {
      if (typeof LokatorTelemetry !== 'undefined') {
        LokatorTelemetry.trackEvent('phone_clicked', { providerId: provider.id, trade: provider.trade, city: provider.city });
      }
    });
  }

  const btnWaHero = document.getElementById('btn-wa-hero');
  if (btnWaHero) {
    btnWaHero.href = `https://wa.me/${cleanWa}?text=${initialWaMsg}`;
    btnWaHero.addEventListener('click', () => {
      if (typeof LokatorTelemetry !== 'undefined') {
        LokatorTelemetry.trackEvent('whatsapp_clicked', { providerId: provider.id, trade: provider.trade, city: provider.city });
      }
    });
  }

  // Track profile view
  if (typeof LokatorTelemetry !== 'undefined') {
    LokatorTelemetry.trackEvent('provider_profile_viewed', { providerId: provider.id, trade: provider.trade, city: provider.city });
  }

  // Share profile
  const btnShare = document.getElementById('btn-share-profile');
  if (btnShare) {
    btnShare.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: `${provider.name} on Lokator`,
          text: `Check out ${provider.name} (${provider.trade}) on Lokator.NG!`,
          url: window.location.href
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Profile link copied to clipboard!');
      }
    });
  }

  // 6. Bio and Skills
  const bioFullText = document.getElementById('bio-full-text');
  if (bioFullText) bioFullText.textContent = provider.bio;

  const skillsContainer = document.getElementById('skills-container');
  if (skillsContainer && provider.skills) {
    skillsContainer.innerHTML = provider.skills.map(s => `
      <a href="search.html?q=${encodeURIComponent(s)}" class="skill-tag-pill" title="Discover ${escapeHtml(s)} specialists on Lokator">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${escapeHtml(s)}</span>
      </a>
    `).join('');
  }

  // 7. Transparent Pricing Guide
  const pricingListContainer = document.getElementById('pricing-list-container');
  if (pricingListContainer && provider.pricingGuide) {
    pricingListContainer.innerHTML = provider.pricingGuide.map(item => `
      <div class="pricing-item-row">
        <strong>${escapeHtml(item.item)}</strong>
        <span class="price-val">${escapeHtml(item.price)}</span>
      </div>
    `).join('');
  }

  // 8. Portfolio Showcase & Lightbox
  const portfolioGrid = document.getElementById('portfolio-grid');
  const lightbox = document.getElementById('portfolio-lightbox');
  const lightboxClose = document.getElementById('lightbox-close-btn');
  const lightboxBanner = document.getElementById('lightbox-banner');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxTag = document.getElementById('lightbox-tag');

  function renderPortfolio(filter = 'all') {
    if (!portfolioGrid || !provider.portfolio) return;

    let items = provider.portfolio;
    if (filter === 'before-after') {
      items = items.filter(p => p.isBeforeAfter);
    } else if (filter === 'completed') {
      items = items.filter(p => !p.isBeforeAfter);
    }

    if (items.length === 0) {
      portfolioGrid.innerHTML = `<p style="grid-column: 1/-1; color: var(--fg-muted); padding: 16px 0;">No items found in this category.</p>`;
      return;
    }

    portfolioGrid.innerHTML = items.map((item, idx) => {
      const safeIdx = parseInt(idx, 10);
      const safeAccent = (item.accentColor && item.accentColor.startsWith('#')) ? item.accentColor : '#006B3F';
      return `
        <div class="portfolio-card" data-idx="${safeIdx}" tabindex="0" role="button" aria-label="${escapeHtml(item.title)}">
          <div class="portfolio-card-thumb" style="background: linear-gradient(135deg, ${safeAccent}, #06180D);">
            <span class="portfolio-card-badge">${escapeHtml(item.tag || 'Verified Work')}</span>
            <span class="thumb-icon">${escapeHtml(item.icon || '🛠️')}</span>
          </div>
          <div class="portfolio-card-body">
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.description)}</p>
          </div>
        </div>
      `;
    }).join('');

    portfolioGrid.querySelectorAll('.portfolio-card').forEach(card => {
      const idx = card.dataset.idx;
      const item = items[idx];
      const openLb = () => {
        if (!lightbox) return;
        lightboxBanner.textContent = item.icon || '🛠️';
        lightboxBanner.style.background = `linear-gradient(135deg, ${item.accentColor || '#006B3F'}, #020D05)`;
        lightboxTitle.textContent = item.title;
        lightboxDesc.textContent = item.description;
        lightboxTag.textContent = item.tag || 'Verified Work';
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
      };
      card.addEventListener('click', openLb);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') openLb();
      });
    });
  }

  document.querySelectorAll('.ptab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ptab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPortfolio(btn.dataset.filter);
    });
  });

  renderPortfolio('all');

  if (lightboxClose && lightbox) {
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
    });
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // 9. Customer Reviews & 5-Star Histogram Calculation
  function renderReviews() {
    const reviews = provider.reviews || [];
    const reviewsCount = reviews.length;
    const avgRating = reviewsCount > 0 
      ? Number((reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviewsCount).toFixed(1))
      : provider.rating;

    const scoreBig = document.getElementById('score-big-val');
    if (scoreBig) scoreBig.textContent = avgRating.toFixed(1);

    const scoreSub = document.getElementById('score-sub-text');
    if (scoreSub) scoreSub.textContent = `Based on ${reviewsCount} verified review${reviewsCount === 1 ? '' : 's'}`;

    if (heroRatingVal) heroRatingVal.textContent = avgRating.toFixed(1);
    if (heroReviewsCount) heroReviewsCount.textContent = reviewsCount;
    if (metricRating) metricRating.textContent = `★ ${avgRating.toFixed(1)}`;

    // Histogram
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
    });

    for (let s = 1; s <= 5; s++) {
      const pct = reviewsCount > 0 ? Math.round((counts[s] / reviewsCount) * 100) : 0;
      const bar = document.getElementById(`histo-bar-${s}`);
      const cnt = document.getElementById(`histo-cnt-${s}`);
      if (bar) bar.style.width = `${pct}%`;
      if (cnt) cnt.textContent = `${pct}%`;
    }

    const reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer) {
      if (reviews.length === 0) {
        reviewsContainer.innerHTML = `<p style="color: var(--fg-muted); padding: 12px 0;">No reviews yet. Be the first to leave a verified review!</p>`;
        return;
      }

      reviewsContainer.innerHTML = reviews.map(r => {
        const safeRating = Math.min(5, Math.max(1, parseInt(r.rating, 10) || 5));
        const starsStr = '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);
        const initials = (r.author || 'User').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const safeRevId = parseInt(r.id, 10) || 0;

        return `
          <div class="review-item-card" id="rev-${safeRevId}">
            <div class="review-item-header">
              <div class="review-author-info">
                <div class="review-author-avatar">${escapeHtml(initials)}</div>
                <div class="review-author-name">
                  <strong>${escapeHtml(r.author)}</strong>
                  <span>📍 ${escapeHtml(r.location)} • ${escapeHtml(r.date)}</span>
                </div>
              </div>
              <div class="review-stars">${starsStr}</div>
            </div>
            ${r.serviceType ? `<span class="review-service-tag">✓ ${escapeHtml(r.serviceType)}</span>` : ''}
            <p class="review-comment-text">${escapeHtml(r.comment)}</p>
            <div class="review-item-footer">
              <span style="display: inline-flex; align-items: center; gap: 4px; color: #006B3F; font-weight: 600;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                Verified Lokator Customer
              </span>
              <button class="btn-helpful" onclick="this.textContent = '✓ Helpful (1)'; this.disabled = true;">
                👍 Helpful (${parseInt(r.helpfulCount, 10) || 0})
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  renderReviews();

  // 10. Write a Review Modal Form
  const reviewModal = document.getElementById('review-modal');
  const btnOpenReviewModal = document.getElementById('btn-open-review-modal');
  const btnCloseReviewModal = document.getElementById('review-modal-close');
  const reviewForm = document.getElementById('review-form');
  const starPicker = document.getElementById('star-picker');

  let selectedRating = 5;

  if (starPicker) {
    const starBtns = starPicker.querySelectorAll('.star-pick-btn');
    starBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRating = parseInt(btn.dataset.val, 10);
        starBtns.forEach((b, i) => {
          b.classList.toggle('active', i < selectedRating);
        });
      });
    });
  }

  if (btnOpenReviewModal && reviewModal) {
    btnOpenReviewModal.addEventListener('click', () => {
      reviewModal.classList.add('active');
      reviewModal.setAttribute('aria-hidden', 'false');
    });
  }

  if (btnCloseReviewModal && reviewModal) {
    btnCloseReviewModal.addEventListener('click', () => {
      reviewModal.classList.remove('active');
      reviewModal.setAttribute('aria-hidden', 'true');
    });
    reviewModal.addEventListener('click', (e) => {
      if (e.target === reviewModal) {
        reviewModal.classList.remove('active');
        reviewModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const author = document.getElementById('rev-author').value.trim();
      const location = document.getElementById('rev-location').value.trim();
      const service = document.getElementById('rev-service').value.trim();
      const comment = document.getElementById('rev-comment').value.trim();

      if (!author || !comment) return;

      const reviewData = {
        author,
        location,
        serviceType: service,
        rating: selectedRating,
        comment
      };

      const res = await LokatorDB.submitReview(providerId, reviewData);
      
      // Update local provider object
      if (!provider.reviews) provider.reviews = [];
      provider.reviews.unshift({
        id: Date.now(),
        author: reviewData.author,
        location: reviewData.location,
        date: 'Today',
        rating: reviewData.rating,
        serviceType: reviewData.serviceType,
        comment: reviewData.comment,
        isVerifiedCustomer: res && res.remoteConfirmed ? true : false,
        helpfulCount: 0
      });

      renderReviews();

      reviewForm.reset();
      selectedRating = 5;
      if (starPicker) {
        starPicker.querySelectorAll('.star-pick-btn').forEach(b => b.classList.add('active'));
      }
      reviewModal.classList.remove('active');
      reviewModal.setAttribute('aria-hidden', 'true');
    });
  }

  // 11. Sidebar Actions & Structured WhatsApp Booking Generator
  const sidebarPhoneText = document.getElementById('sidebar-phone-text');
  if (sidebarPhoneText) sidebarPhoneText.textContent = provider.phone;

  const sidebarCallBtn = document.getElementById('sidebar-call-btn');
  if (sidebarCallBtn) sidebarCallBtn.href = `tel:${cleanPhone}`;

  const waServiceSelect = document.getElementById('wa-service-type');
  const waUserLocation = document.getElementById('wa-user-location');
  const waUrgency = document.getElementById('wa-urgency');
  const waNote = document.getElementById('wa-note');
  const waPreviewText = document.getElementById('wa-preview-text');
  const waSendBtn = document.getElementById('wa-send-btn');

  try {
    const savedLoc = sessionStorage.getItem('lokator_temp_location_name');
    if (savedLoc && waUserLocation) waUserLocation.value = savedLoc;
  } catch (e) {}

  if (waServiceSelect && provider.skills) {
    waServiceSelect.innerHTML = provider.skills.map(s => `
      <option value="${escapeHtml(s)}">${escapeHtml(s)}</option>
    `).join('');
  }

  function updateWhatsAppPreview() {
    const serviceVal = waServiceSelect ? waServiceSelect.value : provider.trade;
    const locVal = waUserLocation && waUserLocation.value.trim() ? waUserLocation.value.trim() : provider.area;
    const urgVal = waUrgency ? waUrgency.value : 'Urgent';
    const noteVal = waNote && waNote.value.trim() ? `\n• Details: ${waNote.value.trim()}` : '';

    const formattedMessage = `Hello ${provider.name},\n\nI found you on Locator.NG.\n\nI need your ${serviceVal} service.\n\nLocation:\n${locVal}\n\nPreferred time:\n${urgVal}${noteVal}\n\nAre you available? Thank you.`;

    if (waPreviewText) waPreviewText.textContent = formattedMessage;
    if (waSendBtn) {
      waSendBtn.href = `https://wa.me/${cleanWa}?text=${encodeURIComponent(formattedMessage)}`;
    }
  }

  if (waServiceSelect) waServiceSelect.addEventListener('change', updateWhatsAppPreview);
  if (waUserLocation) waUserLocation.addEventListener('input', updateWhatsAppPreview);
  if (waUrgency) waUrgency.addEventListener('change', updateWhatsAppPreview);
  if (waNote) waNote.addEventListener('input', updateWhatsAppPreview);

  updateWhatsAppPreview();

  // 12. Working Hours
  const workingHoursList = document.getElementById('working-hours-list');
  if (workingHoursList && provider.workingHours) {
    workingHoursList.innerHTML = `
      <div class="wh-row">
        <strong>Monday – Friday:</strong>
        <span>${escapeHtml(provider.workingHours.weekday || '8:00 AM – 7:00 PM')}</span>
      </div>
      <div class="wh-row">
        <strong>Saturday:</strong>
        <span>${escapeHtml(provider.workingHours.saturday || '8:00 AM – 6:00 PM')}</span>
      </div>
      <div class="wh-row">
        <strong>Sunday:</strong>
        <span>${escapeHtml(provider.workingHours.sunday || 'Emergency Callouts (24/7)')}</span>
      </div>
    `;
  }

  // 13. Nearby Recommended Providers
  const nearbyContainer = document.getElementById('nearby-providers-container');
  if (nearbyContainer) {
    const res = await LokatorDB.getProviders({
      state: provider.state,
      pageSize: 4
    });
    const nearbyList = (res.data || []).filter(p => p.id !== provider.id).slice(0, 3);
    
    if (nearbyList.length > 0) {
      nearbyContainer.innerHTML = nearbyList.map(n => {
        const safeNId = parseInt(n.id, 10) || 0;
        const nInitials = (n.name || '').split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
        const safeRating = Number(n.rating || 5).toFixed(1);
        const safeReviews = parseInt(n.reviewsCount || 0, 10);
        const safeAvatarBg = (n.avatarBg && typeof n.avatarBg === 'string' && n.avatarBg.startsWith('linear-gradient')) ? n.avatarBg : 'var(--green)';

        return `
          <article class="tp-card" style="box-shadow: var(--shadow-sm); border: 1px solid var(--border);" id="nearby-${safeNId}">
            <div class="tp-top">
              <div class="tp-avatar" style="background: ${safeAvatarBg};">${escapeHtml(nInitials)}</div>
              <div class="tp-details">
                <strong>${escapeHtml(n.name)}</strong>
                <span class="verified-badge sm"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Verified</span>
              </div>
            </div>
            <span class="tp-trade">${escapeHtml(n.trade)}</span>
            <div class="tp-rating">★★★★★ <span>${safeRating} (${safeReviews})</span></div>
            <span class="tp-loc">📍 ${escapeHtml(n.area)}</span>
            <div class="tp-actions" style="margin-top: 12px;">
              <a href="profile.html?id=${safeNId}" class="btn btn-outline btn-sm btn-block">View Profile & Reviews →</a>
            </div>
          </article>
        `;
      }).join('');
    } else {
      nearbyContainer.innerHTML = `<p style="color: var(--fg-muted);">No other providers registered in this specific area yet.</p>`;
    }
  }

  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });
  }
});
