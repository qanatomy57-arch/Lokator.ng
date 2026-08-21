// ============================================================================
// LOKATOR SEARCH & FILTER ENGINE (search.js) — SUPABASE REAL BACKEND INTEGRATION
// Flexible multi-skill discovery, natural language query intent, live suggestions & distance ranking
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Safe HTML Escaping Helper (Inherits from LokatorDB / window or fallback)
  const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) ||
                     (typeof LokatorDB !== 'undefined' && LokatorDB.escapeHtml) ||
                     ((v) => (v === null || v === undefined) ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

  // State Management
  const state = {
    keyword: "",
    category: "all",
    city: "all",
    state: "all",
    locationQuery: "",
    maxDistance: 50,
    minRating: 0,
    verifiedOnly: false,
    availableOnly: false,
    sortBy: "distance-asc",
    userCoords: null,
    page: 1,
    pageSize: 20,
    isLoading: false,
    totalCount: 0
  };

  // DOM Elements
  const searchInput = document.getElementById("keyword-search") || document.getElementById("search-input");
  const suggestionsDropdown = document.getElementById("search-suggestions");
  const categorySelect = document.getElementById("category-select");
  const citySelect = document.getElementById("city-select");
  const locationSearch = document.getElementById("location-search");
  const gpsTrigger = document.getElementById("gps-trigger");
  const distanceRange = document.getElementById("distance-range");
  const distanceVal = document.getElementById("distance-val");
  const sortSelect = document.getElementById("sort-select");
  const verifiedOnlyCb = document.getElementById("verified-only");
  const availableOnlyCb = document.getElementById("available-only");
  const ratingPills = document.getElementById("rating-pills");
  const resetFiltersBtn = document.getElementById("reset-filters");
  const providersContainer = document.getElementById("providers-container");
  const resultsCountText = document.getElementById("results-count-text");
  const activeFilterTags = document.getElementById("active-filter-tags");
  const emptyState = document.getElementById("empty-state");
  const paginationControls = document.getElementById("pagination-controls");
  const profileModal = document.getElementById("profile-modal");
  const modalBody = document.getElementById("modal-body");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const applyMainSearchBtn = document.getElementById("apply-main-search");

  // Debounce Utility
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // 1. Initialize from URL Search Parameters
  function initFromUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get("service") || params.get("category");
    const qParam = params.get("q");
    const locParam = params.get("location");
    const stateParam = params.get("state");
    const cityParam = params.get("city");
    const verifiedParam = params.get("verified");
    const availableParam = params.get("available");
    const minRatingParam = params.get("minRating");
    const sortParam = params.get("sort");
    const pageParam = params.get("page");

    // If q parameter exists (from free-form natural search)
    if (qParam) {
      const qClean = qParam.trim();
      if (searchInput) searchInput.value = qClean;
      state.keyword = qClean;
    }

    // Service category parameter resolution
    if (serviceParam) {
      const resolvedSlug = (typeof CategoryMap !== 'undefined')
        ? CategoryMap.resolveQuery(serviceParam)
        : serviceParam.toLowerCase();

      const catObj = (typeof CategoryMap !== 'undefined') ? CategoryMap.getBySlug(resolvedSlug) : null;
      if (catObj && categorySelect) {
        categorySelect.value = catObj.dropdownValue || catObj.name;
        state.category = resolvedSlug;
      } else {
        // Custom service searched directly
        if (!state.keyword) {
          state.keyword = serviceParam;
          if (searchInput) searchInput.value = serviceParam;
        }
        state.category = "all";
      }
    }

    if (stateParam) {
      state.state = stateParam;
    }

    if (cityParam) {
      state.city = cityParam;
      if (citySelect) citySelect.value = cityParam;
    }

    if (locParam && locationSearch) {
      locationSearch.value = locParam;
      state.locationQuery = locParam.trim();
    } else {
      // Check temporary session location
      try {
        const savedLoc = sessionStorage.getItem('lokator_temp_location_name');
        const savedLat = sessionStorage.getItem('lokator_temp_lat');
        const savedLng = sessionStorage.getItem('lokator_temp_lng');
        if (savedLoc && locationSearch) {
          locationSearch.value = savedLoc;
          state.locationQuery = savedLoc;
        }
        if (savedLat && savedLng) {
          state.userCoords = { lat: parseFloat(savedLat), lng: parseFloat(savedLng) };
        }
      } catch (e) {}
    }

    if (verifiedParam === "true" && verifiedOnlyCb) {
      verifiedOnlyCb.checked = true;
      state.verifiedOnly = true;
    }

    if (availableParam === "true" && availableOnlyCb) {
      availableOnlyCb.checked = true;
      state.availableOnly = true;
    }

    if (minRatingParam && !isNaN(parseFloat(minRatingParam))) {
      state.minRating = parseFloat(minRatingParam);
      if (ratingPills) {
        ratingPills.querySelectorAll(".pill-btn").forEach(b => {
          b.classList.toggle("active", parseFloat(b.dataset.rating) === state.minRating);
        });
      }
    }

    if (sortParam && sortSelect) {
      sortSelect.value = sortParam;
      state.sortBy = sortParam;
    }

    if (pageParam && !isNaN(parseInt(pageParam, 10))) {
      state.page = parseInt(pageParam, 10);
    }
  }

  // Synchronize browser address bar with search state (shareable & refresh-safe)
  function updateUrlState() {
    try {
      const params = new URLSearchParams();
      if (state.keyword) params.set("q", state.keyword);
      if (state.category && state.category !== "all") params.set("service", state.category);
      if (state.locationQuery) params.set("location", state.locationQuery);
      if (state.city && state.city !== "all") params.set("city", state.city);
      if (state.state && state.state !== "all") params.set("state", state.state);
      if (state.verifiedOnly) params.set("verified", "true");
      if (state.availableOnly) params.set("available", "true");
      if (state.minRating > 0) params.set("minRating", String(state.minRating));
      if (state.sortBy && state.sortBy !== "distance-asc") params.set("sort", state.sortBy);
      if (state.page > 1) params.set("page", String(state.page));

      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", newUrl);
      }
    } catch (e) {}
  }

  // Generate initials for avatar
  function getInitials(name) {
    if (!name) return "LP";
    const parts = name.trim().split(" ");
    return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  }

  // 2. Render Loading Skeletons
  function renderSkeletons() {
    if (!providersContainer) return;
    providersContainer.innerHTML = `
      <div class="provider-item-card skeleton-card" style="opacity: 0.7; pointer-events: none;">
        <div class="provider-avatar-col"><div class="big-avatar" style="background: var(--border);"></div></div>
        <div class="provider-content-col">
          <div style="height: 18px; width: 45%; background: var(--border-light); border-radius: 4px; margin-bottom: 8px;"></div>
          <div style="height: 14px; width: 30%; background: var(--border-light); border-radius: 4px; margin-bottom: 12px;"></div>
          <div style="height: 12px; width: 85%; background: var(--border-light); border-radius: 4px; margin-bottom: 6px;"></div>
        </div>
      </div>
      <div class="provider-item-card skeleton-card" style="opacity: 0.5; pointer-events: none;">
        <div class="provider-avatar-col"><div class="big-avatar" style="background: var(--border);"></div></div>
        <div class="provider-content-col">
          <div style="height: 18px; width: 40%; background: var(--border-light); border-radius: 4px; margin-bottom: 8px;"></div>
          <div style="height: 14px; width: 25%; background: var(--border-light); border-radius: 4px; margin-bottom: 12px;"></div>
          <div style="height: 12px; width: 80%; background: var(--border-light); border-radius: 4px; margin-bottom: 6px;"></div>
        </div>
      </div>
    `;
  }

  // 3. Main Query & Render Function (Connects directly to Supabase with flexible skills)
  async function render() {
    if (state.isLoading) return;
    state.isLoading = true;
    renderSkeletons();
    renderActiveTags();
    updateUrlState();

    try {
      // Map category dropdown value to canonical slug
      let categorySlug = state.category;
      if (categorySelect && categorySelect.value) {
        if (categorySelect.value === "all") {
          categorySlug = "all";
        } else {
          categorySlug = (typeof CategoryMap !== 'undefined')
            ? CategoryMap.resolveQuery(categorySelect.value)
            : categorySelect.value.toLowerCase();
        }
      }

      // Location / City / State extraction
      const loc = state.locationQuery || (citySelect && citySelect.value !== 'all' ? citySelect.value : "all");
      const userLat = state.userCoords ? state.userCoords.lat : null;
      const userLng = state.userCoords ? state.userCoords.lng : null;

      // Query database via LokatorDB
      if (typeof LokatorTelemetry !== 'undefined') {
        LokatorTelemetry.trackEvent('search_submitted', {
          category: categorySlug,
          keyword: state.keyword,
          city: loc,
          verifiedOnly: state.verifiedOnly
        });
      }

      const result = await LokatorDB.getProviders({
        category: categorySlug,
        city: loc,
        state: state.state,
        query: state.keyword,
        isVerified: state.verifiedOnly,
        isAvailable: state.availableOnly,
        minRating: state.minRating,
        page: state.page,
        pageSize: state.pageSize,
        sortBy: state.sortBy,
        userLat: userLat,
        userLng: userLng
      });

      state.isLoading = false;
      const providers = result.data || [];
      state.totalCount = result.totalCount || providers.length;

      if (typeof LokatorTelemetry !== 'undefined') {
        if (providers.length === 0) {
          LokatorTelemetry.trackEvent('search_no_results', { query: state.keyword, category: categorySlug });
        } else {
          LokatorTelemetry.trackEvent('search_result_viewed', { totalCount: state.totalCount, page: state.page });
        }
      }

      // Offline Search Status Notice
      let offlineBanner = document.getElementById('search-offline-banner');
      if (result.isOffline) {
        if (!offlineBanner && providersContainer && providersContainer.parentNode) {
          offlineBanner = document.createElement('div');
          offlineBanner.id = 'search-offline-banner';
          offlineBanner.className = 'offline-search-banner';
          providersContainer.parentNode.insertBefore(offlineBanner, providersContainer);
        }
        if (offlineBanner) {
          offlineBanner.style.display = 'flex';
          offlineBanner.innerHTML = `<span>⚡</span> <span>You're offline. Showing cached provider results.</span>`;
        }
      } else if (offlineBanner) {
        offlineBanner.style.display = 'none';
      }

      // Update Result Counter
      if (resultsCountText) {
        resultsCountText.textContent = `Found ${state.totalCount} verified professional${state.totalCount === 1 ? "" : "s"} near you`;
      }

      if (providers.length === 0) {
        providersContainer.innerHTML = "";
        if (emptyState) {
          emptyState.style.display = "flex";
          const currentQuery = state.keyword || (state.category !== 'all' ? state.category : '');
          emptyState.innerHTML = `
            <div class="empty-icon">🔍</div>
            <h3>${currentQuery ? `No providers found for "${escapeHtml(currentQuery)}" yet` : 'No providers match your search'}</h3>
            <p>We are actively onboarding verified artisans and professionals across Nigeria. Search another skill, broaden your location, or list your skill on Lokator.</p>
            <div class="empty-actions-row">
              ${currentQuery ? `<a href="register.html?service=${encodeURIComponent(currentQuery)}" class="btn btn-primary">List Your Skill for Free →</a>` : ''}
              <button class="btn btn-outline" id="clear-all-empty-btn">Reset All Filters</button>
            </div>
          `;
          const resetBtn = document.getElementById("clear-all-empty-btn");
          if (resetBtn) {
            resetBtn.addEventListener("click", () => {
              if (resetFiltersBtn) resetFiltersBtn.click();
            });
          }
        }
        if (paginationControls) paginationControls.innerHTML = "";
        return;
      }

      if (emptyState) emptyState.style.display = "none";

      // Render Provider Cards
      providersContainer.innerHTML = providers.map(provider => {
        const safeId = parseInt(provider.id, 10) || 0;
        const initials = getInitials(provider.name);
        const cleanPhone = (provider.phone || '').replace(/[^0-9]/g, '');
        const cleanWa = (provider.whatsappNumber || provider.phone || '').replace(/[^0-9]/g, '');
        const waMsg = encodeURIComponent(
          `Hello ${provider.name}, I found your verified profile on Lokator and I'd like to inquire about your ${provider.trade} service in ${provider.area}. Are you available?`
        );

        // Distance text
        const distText = (provider.distanceKm != null) 
          ? `📍 ${provider.distanceKm} km away • ${provider.area}`
          : `📍 ${provider.area}`;

        const skillsList = Array.isArray(provider.skills) ? provider.skills : [provider.trade];
        const safeRating = Number(provider.rating || 5).toFixed(1);
        const safeReviewsCount = parseInt(provider.reviewsCount || 0, 10);
        const safeExpYrs = parseInt(provider.experienceYrs || 3, 10);
        const safeAvatarBg = (provider.avatarBg && typeof provider.avatarBg === 'string' && provider.avatarBg.startsWith('linear-gradient')) ? provider.avatarBg : 'var(--green)';

        return `
          <article class="provider-item-card ${provider.isVerified ? 'is-verified' : ''}" id="card-prov-${safeId}">
            <!-- Avatar Column -->
            <div class="provider-avatar-col">
              <a href="profile.html?id=${safeId}" style="text-decoration: none;">
                <div class="big-avatar" style="background: ${safeAvatarBg}; overflow: hidden;">
                  ${provider.avatarUrl ? `<img src="${escapeHtml(provider.avatarUrl)}" alt="${escapeHtml(provider.name)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />` : escapeHtml(initials)}
                </div>
              </a>
              <span class="status-dot ${provider.isAvailable ? 'online' : 'offline'}" title="${provider.isAvailable ? 'Available today' : 'Currently busy'}"></span>
            </div>

            <!-- Content Column -->
            <div class="provider-content-col">
              <div class="provider-header-line">
                <a href="profile.html?id=${safeId}" style="text-decoration: none; color: inherit;">
                  <h3 class="provider-title-name">${escapeHtml(provider.name)}</h3>
                </a>
                ${provider.isVerified ? `
                  <span class="badge-tag-verified" title="NIN and Government ID Verified">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Verified Pro
                  </span>` : ''
                }
                ${provider.isTop ? `<span class="badge-tag-top">⭐ Top Pick</span>` : ''}
              </div>

              <div class="provider-specialty">${escapeHtml(provider.trade)}</div>

              <div class="provider-meta-row">
                <span class="meta-distance">${escapeHtml(distText)}</span>
                <span class="meta-rating">
                  ★ ${safeRating} <span>(${safeReviewsCount} reviews)</span>
                </span>
                <span>• ${safeExpYrs} yrs exp</span>
              </div>

              <p class="provider-bio-snippet">${escapeHtml(provider.bio || `Specialist ${provider.trade} providing verified local services.`)}</p>

              <div class="provider-tags-row">
                ${skillsList.map(s => `<span class="mini-tag" data-skill="${escapeHtml(s)}" title="Search ${escapeHtml(s)}">${escapeHtml(s)}</span>`).join('')}
              </div>
            </div>

            <!-- Direct Actions Column -->
            <div class="provider-actions-col">
              <a href="tel:${cleanPhone}" class="action-btn call-btn" aria-label="Call ${escapeHtml(provider.name)}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Call Now
              </a>
              <a href="https://wa.me/${cleanWa}?text=${waMsg}" target="_blank" rel="noopener" class="action-btn wa-btn" aria-label="WhatsApp ${escapeHtml(provider.name)}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 0 0 .611.611l4.458-1.495A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 0 1-5.39-1.585l-.386-.231-2.646.887.887-2.646-.231-.386A9.94 9.94 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                WhatsApp
              </a>
              <a href="profile.html?id=${safeId}" class="btn-view-profile" style="text-decoration: none; text-align: center;">
                View Full Profile →
              </a>
            </div>
          </article>
        `;
      }).join('');

      // Render Pagination if more than pageSize
      renderPagination(state.totalCount);

    } catch (err) {
      console.error('Error fetching providers from Supabase:', err);
      state.isLoading = false;
      if (providersContainer) {
        providersContainer.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--fg-muted);">
            <p>Unable to load live provider directory at this moment. Please check your connection and refresh.</p>
          </div>
        `;
      }
    }
  }

  // 4. Render Active Filter Badges
  function renderActiveTags() {
    if (!activeFilterTags) return;
    const tags = [];
    if (state.category && state.category !== "all") tags.push(`Category: ${state.category}`);
    if (state.city && state.city !== "all") tags.push(`City: ${state.city}`);
    if (state.locationQuery) tags.push(`Location: "${state.locationQuery}"`);
    if (state.keyword) tags.push(`Skill / Service: "${state.keyword}"`);
    if (state.verifiedOnly) tags.push(`Verified only`);
    if (state.availableOnly) tags.push(`Available now`);
    if (state.minRating > 0) tags.push(`★ ${state.minRating}+`);

    activeFilterTags.innerHTML = tags
      .map(t => `<span class="filter-badge-tag">${escapeHtml(t)}</span>`)
      .join('');
  }

  // 5. Render Pagination Controls
  function renderPagination(total) {
    if (!paginationControls) return;
    const totalPages = Math.ceil(total / state.pageSize);
    if (totalPages <= 1) {
      paginationControls.innerHTML = "";
      return;
    }

    paginationControls.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 24px;">
        <button class="btn btn-outline btn-sm" id="pg-prev" ${state.page === 1 ? 'disabled' : ''}>← Previous</button>
        <span style="font-size: 13px; font-weight: 700; color: var(--fg-muted);">Page ${state.page} of ${totalPages}</span>
        <button class="btn btn-outline btn-sm" id="pg-next" ${state.page >= totalPages ? 'disabled' : ''}>Next →</button>
      </div>
    `;

    const prevBtn = document.getElementById("pg-prev");
    const nextBtn = document.getElementById("pg-next");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (state.page > 1) {
          state.page--;
          render();
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (state.page < totalPages) {
          state.page++;
          render();
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }
      });
    }
  }

  // 6. Live Search Suggestions Dropdown Handling
  function renderSuggestions(query) {
    if (!suggestionsDropdown) return;
    const suggestions = (LokatorDB && LokatorDB.getSkillSuggestions)
      ? LokatorDB.getSkillSuggestions(query, 6)
      : [];

    if (suggestions.length === 0) {
      suggestionsDropdown.style.display = "none";
      suggestionsDropdown.innerHTML = "";
      return;
    }

    suggestionsDropdown.innerHTML = suggestions.map(s => `
      <div class="suggestion-item" data-val="${escapeHtml(s)}">
        <span class="sugg-icon">⚡</span>
        <span>${escapeHtml(s)}</span>
      </div>
    `).join('');
    suggestionsDropdown.style.display = "block";
  }

  function hideSuggestions() {
    if (suggestionsDropdown) {
      setTimeout(() => {
        suggestionsDropdown.style.display = "none";
      }, 200);
    }
  }

  if (suggestionsDropdown) {
    suggestionsDropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".suggestion-item");
      if (item && item.dataset.val) {
        const val = item.dataset.val;
        if (searchInput) searchInput.value = val;
        state.keyword = val;
        state.category = "all";
        if (categorySelect) categorySelect.value = "all";
        suggestionsDropdown.style.display = "none";
        state.page = 1;
        render();
      }
    });
  }

  // Clickable Mini-Tag to Search Specific Skill
  if (providersContainer) {
    providersContainer.addEventListener("click", (e) => {
      const tag = e.target.closest(".mini-tag");
      if (tag && tag.dataset.skill) {
        const skill = tag.dataset.skill;
        if (searchInput) searchInput.value = skill;
        state.keyword = skill;
        state.category = "all";
        if (categorySelect) categorySelect.value = "all";
        state.page = 1;
        render();
        window.scrollTo({ top: 250, behavior: 'smooth' });
      }
    });
  }

  // 7. Event Listeners for Filters
  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      state.category = e.target.value;
      if (typeof LokatorTelemetry !== 'undefined' && e.target.value !== 'all') {
        const canonicalCat = (typeof CategoryMap !== 'undefined' && CategoryMap.resolveQuery)
          ? CategoryMap.resolveQuery(e.target.value)
          : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        LokatorTelemetry.trackEvent('category_browse_clicked', { category: canonicalCat, source: 'search_filter' });
      }
      state.page = 1;
      render();
    });
  }

  // Registration CTA click tracker
  document.addEventListener('click', (e) => {
    const cta = e.target.closest('a[href*="register.html"]');
    if (cta && typeof LokatorTelemetry !== 'undefined') {
      LokatorTelemetry.trackEvent('registration_cta_clicked', { source: 'search_page' });
    }
  });

  if (citySelect) {
    citySelect.addEventListener("change", (e) => {
      state.city = e.target.value;
      state.page = 1;
      render();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", debounce((e) => {
      const val = e.target.value.trim();
      state.keyword = val;
      state.page = 1;
      renderSuggestions(val);
      render();
    }, 250));

    searchInput.addEventListener("focus", (e) => {
      if (e.target.value.trim()) {
        renderSuggestions(e.target.value.trim());
      }
    });

    searchInput.addEventListener("blur", hideSuggestions);

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        hideSuggestions();
        render();
      }
    });
  }

  if (locationSearch) {
    locationSearch.addEventListener("input", debounce((e) => {
      state.locationQuery = e.target.value.trim();
      state.page = 1;
      render();
    }, 300));
  }

  if (applyMainSearchBtn) {
    applyMainSearchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      hideSuggestions();
      if (searchInput) state.keyword = searchInput.value.trim();
      if (locationSearch) state.locationQuery = locationSearch.value.trim();
      state.page = 1;
      render();
    });
  }

  if (distanceRange && distanceVal) {
    distanceRange.addEventListener("input", (e) => {
      const val = Number(e.target.value);
      state.maxDistance = val;
      distanceVal.textContent = `${val} km`;
    });
    distanceRange.addEventListener("change", () => {
      state.page = 1;
      render();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      render();
    });
  }

  if (verifiedOnlyCb) {
    verifiedOnlyCb.addEventListener("change", (e) => {
      state.verifiedOnly = e.target.checked;
      state.page = 1;
      render();
    });
  }

  if (availableOnlyCb) {
    availableOnlyCb.addEventListener("change", (e) => {
      state.availableOnly = e.target.checked;
      state.page = 1;
      render();
    });
  }

  // Minimum Rating Filter Pills
  if (ratingPills) {
    ratingPills.addEventListener("click", (e) => {
      const btn = e.target.closest(".pill-btn");
      if (btn && btn.dataset.rating != null) {
        ratingPills.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.minRating = Number(btn.dataset.rating);
        state.page = 1;
        render();
      }
    });
  }

  // GPS Location Trigger
  if (gpsTrigger && locationSearch) {
    gpsTrigger.addEventListener("click", () => {
      if ("geolocation" in navigator) {
        gpsTrigger.classList.add("loading");
        locationSearch.placeholder = "Detecting your location...";

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            gpsTrigger.classList.remove("loading");
            gpsTrigger.classList.add("active");
            state.userCoords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            };
            const locName = "Current GPS Location";
            locationSearch.value = locName;
            state.locationQuery = locName;

            try {
              sessionStorage.setItem('lokator_temp_location_name', locName);
              sessionStorage.setItem('lokator_temp_lat', pos.coords.latitude.toString());
              sessionStorage.setItem('lokator_temp_lng', pos.coords.longitude.toString());
            } catch (e) {}

            state.page = 1;
            render();
          },
          (err) => {
            gpsTrigger.classList.remove("loading");
            locationSearch.placeholder = "GPS unavailable — enter area manually";
            console.warn("Geolocation error:", err);
          },
          { timeout: 10000, maximumAge: 60000 }
        );
      }
    });
  }

  // Reset Filters
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      state.keyword = "";
      state.category = "all";
      state.city = "all";
      state.state = "all";
      state.locationQuery = "";
      state.maxDistance = 50;
      state.minRating = 0;
      state.verifiedOnly = false;
      state.availableOnly = false;
      state.page = 1;

      if (searchInput) searchInput.value = "";
      if (categorySelect) categorySelect.value = "all";
      if (citySelect) citySelect.value = "all";
      if (locationSearch) locationSearch.value = "";
      if (distanceRange) distanceRange.value = 50;
      if (distanceVal) distanceVal.textContent = "50 km";
      if (verifiedOnlyCb) verifiedOnlyCb.checked = false;
      if (availableOnlyCb) availableOnlyCb.checked = false;
      if (gpsTrigger) gpsTrigger.classList.remove("active");
      if (ratingPills) {
        ratingPills.querySelectorAll(".pill-btn").forEach((b, idx) => {
          b.classList.toggle("active", idx === 0);
        });
      }

      try {
        sessionStorage.removeItem('lokator_temp_location_name');
        sessionStorage.removeItem('lokator_temp_lat');
        sessionStorage.removeItem('lokator_temp_lng');
      } catch (e) {}

      render();
    });
  }

  // Mobile filters toggle
  const mobileFilterBtn = document.getElementById("mobile-filter-btn");
  const filterSidebar = document.getElementById("filter-sidebar");
  if (mobileFilterBtn && filterSidebar) {
    mobileFilterBtn.addEventListener("click", () => {
      filterSidebar.classList.toggle("open");
    });
  }

  // Handle browser back/forward navigation
  window.addEventListener("popstate", () => {
    initFromUrlParams();
    render();
  });

  // Execute initial load
  initFromUrlParams();
  render();
});
