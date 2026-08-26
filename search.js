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
    industry: "all",
    specialization: "all",
    city: "all",
    state: "all",
    lga: "all",
    locality: "all",
    locationQuery: "",
    source: "marketplace",
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
  const stateSelect = document.getElementById("state-select");
  const lgaSelect = document.getElementById("lga-select");
  const localitySelect = document.getElementById("locality-select");
  const lgaFilterGroup = document.getElementById("lga-filter-group");
  const localityFilterGroup = document.getElementById("locality-filter-group");
  const citySelect = document.getElementById("city-select");
  const locationSearch = document.getElementById("location-search");
  const locationSuggestions = document.getElementById("location-suggestions");
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
  const breadcrumbsNav = document.getElementById("marketplace-breadcrumbs");
  const browseSection = document.getElementById("marketplace-browse-section");
  const industryCardsGrid = document.getElementById("industry-cards-grid");
  const filterSidebar = document.getElementById("filter-sidebar");
  const filterBackdrop = document.getElementById("filter-backdrop");
  const mobileFilterBtn = document.getElementById("mobile-filter-btn");
  const mobileFilterCloseBtn = document.getElementById("mobile-filter-close-btn");
  const mobileApplyFiltersBtn = document.getElementById("mobile-apply-filters-btn");
  const mobileResetFiltersBtn = document.getElementById("mobile-reset-filters-btn");

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
    const serviceParam = params.get("service") || params.get("skill") || params.get("category");
    const industryParam = params.get("industry");
    const specParam = params.get("spec") || params.get("specialization");
    const qParam = params.get("q");
    const locParam = params.get("location");
    const stateParam = params.get("state");
    const lgaParam = params.get("lga");
    const localityParam = params.get("locality") || params.get("area");
    const cityParam = params.get("city");
    const sourceParam = params.get("source") || "marketplace";
    const verifiedParam = params.get("verified");
    const availableParam = params.get("available");
    const minRatingParam = params.get("minRating");
    const sortParam = params.get("sort");
    const pageParam = params.get("page");

    state.source = sourceParam;
    if (industryParam) state.industry = industryParam;
    if (specParam) state.specialization = specParam;

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

    if (stateParam) state.state = stateParam;
    if (lgaParam) state.lga = lgaParam;
    if (localityParam) state.locality = localityParam;

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
      state.page = Math.max(1, parseInt(pageParam, 10));
    }

    // Populate and sync Nigerian Location cascading controls
    populateStateSelect();
    if (state.state && state.state !== "all") {
      updateLgaSelect(state.state, state.lga);
      if (state.lga && state.lga !== "all") {
        updateLocalitySelect(state.state, state.lga, state.locality);
      }
    }

    // Render breadcrumbs immediately on init
    renderBreadcrumbs();
  }

  // Populate Nigerian States in Filter Sidebar
  function populateStateSelect() {
    if (!stateSelect || typeof NigeriaLocations === 'undefined') return;
    const states = NigeriaLocations.getStates();
    stateSelect.innerHTML = `<option value="all">All Nigeria (36 States + FCT)</option>` +
      states.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.displayName)}</option>`).join('');
    
    if (state.state && state.state !== 'all') {
      stateSelect.value = state.state;
    }
  }

  // Update LGA dropdown based on selected Nigerian State
  function updateLgaSelect(stateName, selectedLga = 'all') {
    if (!lgaSelect || typeof NigeriaLocations === 'undefined') return;
    if (!stateName || stateName === 'all') {
      lgaSelect.innerHTML = `<option value="all">Select State First...</option>`;
      lgaSelect.disabled = true;
      if (localityFilterGroup) localityFilterGroup.style.display = 'none';
      state.lga = 'all';
      state.locality = 'all';
      return;
    }

    const lgas = NigeriaLocations.getLgas(stateName);
    lgaSelect.disabled = false;
    lgaSelect.innerHTML = `<option value="all">All LGAs in ${escapeHtml(stateName)}</option>` +
      lgas.map(l => `<option value="${escapeHtml(l.name)}">${escapeHtml(l.name)}</option>`).join('');
    
    if (selectedLga && selectedLga !== 'all') {
      lgaSelect.value = selectedLga;
      state.lga = selectedLga;
      updateLocalitySelect(stateName, selectedLga, state.locality);
    } else {
      lgaSelect.value = 'all';
      state.lga = 'all';
      if (localityFilterGroup) localityFilterGroup.style.display = 'none';
    }
  }

  // Update Locality dropdown based on selected LGA
  function updateLocalitySelect(stateName, lgaName, selectedLocality = 'all') {
    if (!localitySelect || !localityFilterGroup || typeof NigeriaLocations === 'undefined') return;
    if (!lgaName || lgaName === 'all') {
      localityFilterGroup.style.display = 'none';
      state.locality = 'all';
      return;
    }

    const localities = NigeriaLocations.getLocalities(stateName, lgaName);
    if (!localities || localities.length === 0) {
      localityFilterGroup.style.display = 'none';
      state.locality = 'all';
      return;
    }

    localityFilterGroup.style.display = 'block';
    localitySelect.innerHTML = `<option value="all">All Neighborhoods in ${escapeHtml(lgaName)}</option>` +
      localities.map(loc => `<option value="${escapeHtml(loc)}">${escapeHtml(loc)}</option>`).join('');

    if (selectedLocality && selectedLocality !== 'all') {
      localitySelect.value = selectedLocality;
      state.locality = selectedLocality;
    } else {
      localitySelect.value = 'all';
      state.locality = 'all';
    }
  }

  // Phase 10.9: Render Marketplace Discovery Breadcrumbs
  function renderBreadcrumbs() {
    if (!breadcrumbsNav || typeof MarketplaceTaxonomy === 'undefined') return;

    const context = MarketplaceTaxonomy.buildDiscoveryContext({
      industry: state.industry !== 'all' ? state.industry : null,
      category: state.category !== 'all' ? state.category : null,
      skill: state.category !== 'all' ? state.category : (state.keyword || null),
      specialization: state.specialization !== 'all' ? state.specialization : null,
      state: state.state !== 'all' ? state.state : (state.locationQuery || null),
      lga: state.lga !== 'all' ? state.lga : null,
      locality: state.locality !== 'all' ? state.locality : null,
      city: state.city !== 'all' ? state.city : null,
      source: state.source
    });

    if (context.breadcrumbs && context.breadcrumbs.length > 1) {
      breadcrumbsNav.innerHTML = `
        <ol class="breadcrumb-trail-list">
          ${context.breadcrumbs.map((crumb, idx) => {
            const isLast = idx === context.breadcrumbs.length - 1;
            const iconHtml = crumb.icon ? `<span class="crumb-icon">${escapeHtml(crumb.icon)}</span> ` : '';
            return `
              <li class="breadcrumb-item ${isLast ? 'is-active' : ''}">
                ${isLast ? `
                  <span class="crumb-current" aria-current="page">${iconHtml}${escapeHtml(crumb.label)}</span>
                ` : `
                  <a href="${escapeHtml(crumb.url)}" class="crumb-link">${iconHtml}${escapeHtml(crumb.label)}</a>
                  <span class="crumb-separator" aria-hidden="true">›</span>
                `}
              </li>
            `;
          }).join('')}
        </ol>
      `;
      breadcrumbsNav.style.display = "block";
    } else {
      breadcrumbsNav.style.display = "none";
    }
  }

  // Phase 10.10: Render Canonical Nigerian Marketplace Industries Browse Grid
  function buildIndustryCardsHtml(industries) {
    return industries.map(ind => {
      const isSelected = state.industry === ind.id;
      const skillsHtml = (ind.popularSkills || []).slice(0, 4).map(skillSlug => {
        const catObj = (typeof CategoryMap !== 'undefined') ? CategoryMap.getBySlug(skillSlug) : null;
        const skillName = catObj ? catObj.displayName || catObj.name : skillSlug.replace(/-/g, ' ');
        return `<span class="industry-skill-pill-tag" data-skill-slug="${escapeHtml(skillSlug)}">${escapeHtml(skillName)}</span>`;
      }).join('');

      return `
        <div class="industry-browse-card ${isSelected ? 'is-selected' : ''}" data-industry-id="${escapeHtml(ind.id)}" role="button" tabindex="0" title="Browse ${escapeHtml(ind.name)}">
          <div class="industry-card-head">
            <span class="industry-card-icon" aria-hidden="true">${escapeHtml(ind.icon || '⚡')}</span>
            <div class="industry-card-name">${escapeHtml(ind.name)}</div>
          </div>
          <p class="industry-card-desc">${escapeHtml(ind.description || '')}</p>
          <div class="industry-popular-skills-wrap">
            ${skillsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderBrowseGrid() {
    if (!browseSection || typeof MarketplaceTaxonomy === 'undefined') return;

    const industries = MarketplaceTaxonomy.getIndustries();
    if (!industries || industries.length === 0) {
      browseSection.style.display = "none";
      return;
    }

    browseSection.style.display = "block";
    const hasActiveQuery = Boolean(state.keyword || (state.category && state.category !== 'all') || (state.industry && state.industry !== 'all'));

    if (hasActiveQuery) {
      browseSection.classList.add('is-compact');
      const activeInd = state.industry !== 'all' ? MarketplaceTaxonomy.getIndustryById(state.industry) : null;
      browseSection.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 14px;">⚡</span>
            <span style="font-size: 13px; font-weight: 700; color: var(--fg);">${activeInd ? `Industry: ${escapeHtml(activeInd.name)}` : 'Browse all 15 trades & industries'}</span>
          </div>
          <button type="button" class="browse-toggle-btn" id="toggle-browse-grid-btn" aria-expanded="false">
            <span>${activeInd ? 'Change Industry' : 'Explore All Trades'}</span> ↓
          </button>
        </div>
        <div class="industry-cards-grid" id="industry-cards-grid-inner" style="display: none; margin-top: 14px;">
          ${buildIndustryCardsHtml(industries)}
        </div>
      `;
      const toggleBtn = document.getElementById('toggle-browse-grid-btn');
      const gridInner = document.getElementById('industry-cards-grid-inner');
      if (toggleBtn && gridInner) {
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const isHidden = gridInner.style.display === 'none';
          gridInner.style.display = isHidden ? 'grid' : 'none';
          toggleBtn.setAttribute('aria-expanded', String(isHidden));
          toggleBtn.innerHTML = isHidden ? `<span>Collapse Trades</span> ↑` : `<span>${activeInd ? 'Change Industry' : 'Explore All Trades'}</span> ↓`;
        });
      }
    } else {
      browseSection.classList.remove('is-compact');
      browseSection.innerHTML = `
        <div class="browse-section-header">
          <div class="browse-header-text">
            <span class="browse-badge">⚡ Explore by Trade</span>
            <h3 class="browse-title">Browse Nigeria's Canonical Trades & Industries</h3>
            <p class="browse-subtitle">Select an industry or popular trade to find verified artisans and specialists near you.</p>
          </div>
        </div>
        <div class="industry-cards-grid" id="industry-cards-grid-inner">
          ${buildIndustryCardsHtml(industries)}
        </div>
      `;
    }
  }

  // Synchronize browser address bar with search state (shareable & refresh-safe)
  function updateUrlState() {
    try {
      const params = new URLSearchParams();
      if (state.keyword) params.set("q", state.keyword);
      if (state.category && state.category !== "all") params.set("service", state.category);
      if (state.locationQuery) params.set("location", state.locationQuery);
      if (state.state && state.state !== "all") params.set("state", state.state);
      if (state.lga && state.lga !== "all") params.set("lga", state.lga);
      if (state.locality && state.locality !== "all") params.set("locality", state.locality);
      if (state.city && state.city !== "all") params.set("city", state.city);
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
          state: state.state,
          lga: state.lga,
          verifiedOnly: state.verifiedOnly
        });
      }

      const result = await LokatorDB.getProviders({
        category: categorySlug,
        city: loc,
        state: state.state,
        lga: state.lga,
        locality: state.locality,
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
          LokatorTelemetry.trackEvent('search_no_results', {
            query: state.keyword,
            category: categorySlug,
            state: state.state !== 'all' ? state.state : (state.locationQuery || null),
            lga: state.lga !== 'all' ? state.lga : null,
            city: loc !== 'all' ? loc : null
          });
        } else {
          LokatorTelemetry.trackEvent('search_result_viewed', {
            totalCount: state.totalCount,
            page: state.page,
            category: categorySlug,
            state: state.state !== 'all' ? state.state : (state.locationQuery || null),
            lga: state.lga !== 'all' ? state.lga : null,
            city: loc !== 'all' ? loc : null
          });
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

      // Update Result Counter, Breadcrumbs & Canonical Industry Browse Grid
      renderBreadcrumbs();
      renderBrowseGrid();
      if (resultsCountText) {
        resultsCountText.textContent = `Found ${state.totalCount} verified professional${state.totalCount === 1 ? "" : "s"} near you`;
      }

      if (providers.length === 0) {
        providersContainer.innerHTML = "";
        if (emptyState) {
          emptyState.style.display = "flex";
          const currentQuery = state.keyword || (state.category !== 'all' ? state.category : '');
          
          let recsHtml = '';
          if (typeof MarketplaceTaxonomy !== 'undefined') {
            const context = MarketplaceTaxonomy.buildDiscoveryContext({
              industry: state.industry !== 'all' ? state.industry : null,
              category: state.category !== 'all' ? state.category : null,
              skill: state.category !== 'all' ? state.category : (state.keyword || null),
              specialization: state.specialization !== 'all' ? state.specialization : null,
              state: state.state !== 'all' ? state.state : (state.locationQuery || null),
              city: state.city !== 'all' ? state.city : null
            });
            const recs = MarketplaceTaxonomy.getZeroResultRecommendations(context);
            
            recsHtml = `
              <div class="zero-recovery-card">
                <h4 class="recovery-heading">${escapeHtml(recs.title)}</h4>
                <div class="recovery-suggestions-grid">
                  ${recs.suggestions.map(s => `
                    <a href="${escapeHtml(s.url)}" class="recovery-btn-chip">
                      <span>${escapeHtml(s.label)}</span> →
                    </a>
                  `).join('')}
                </div>
                ${recs.relatedSkills && recs.relatedSkills.length > 0 ? `
                  <div class="related-skills-box">
                    <span class="related-label">Looking for related trades?</span>
                    <div class="related-chips-wrap">
                      ${recs.relatedSkills.map(r => `
                        <a href="search.html?service=${encodeURIComponent(r.id)}${state.state !== 'all' ? `&state=${encodeURIComponent(state.state)}` : ''}" class="related-skill-pill">
                          <span>${escapeHtml(r.icon || '⚡')}</span> ${escapeHtml(r.name)}
                        </a>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            `;

            // Non-invasive MDCIE Telemetry
            if (typeof LokatorDB !== 'undefined' && LokatorDB.marketplaceDiscovery) {
              LokatorDB.marketplaceDiscovery.trackDiscoveryEvent('zero_results', {
                keyword: state.keyword,
                category: categorySlug,
                state: state.state,
                city: loc
              }).catch(() => {});
            }
          }

          emptyState.innerHTML = `
            <div class="empty-icon">🔍</div>
            <h3>${currentQuery ? `No verified providers found for "${escapeHtml(currentQuery)}" in this area yet` : 'No providers match your exact search filters'}</h3>
            <p>We are actively verifying skilled hands across all 36 Nigerian states. Try exploring nearby locations or related trades below:</p>
            ${recsHtml}
            <div class="empty-actions-row" style="margin-top: 20px;">
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

      // Non-invasive MDCIE Telemetry for positive results view
      if (typeof LokatorDB !== 'undefined' && LokatorDB.marketplaceDiscovery) {
        LokatorDB.marketplaceDiscovery.trackDiscoveryEvent('provider_results_viewed', {
          count: state.totalCount,
          category: categorySlug,
          state: state.state,
          city: loc
        }).catch(() => {});
      }

      if (emptyState) emptyState.style.display = "none";

      // Render Provider Cards
      providersContainer.innerHTML = providers.map(provider => {
        const safeId = parseInt(provider.id, 10) || 0;
        const initials = getInitials(provider.name);
        const providerArea = provider.area || (provider.lga && provider.state ? `${provider.lga}, ${provider.state}` : provider.city) || 'your area';
        const serviceCtx = state.keyword || provider.trade;
        const locationCtx = state.locationQuery || providerArea;

        const PhoneEngine = (typeof NigeriaPhone !== 'undefined' ? NigeriaPhone : null) || (typeof window !== 'undefined' ? window.NigeriaPhone : null);
        const telUrl = PhoneEngine ? PhoneEngine.buildTelUrl(provider) : (provider.phone ? `tel:${provider.phone}` : '');
        const waUrl = PhoneEngine 
          ? PhoneEngine.buildWhatsAppUrl(provider, { service: serviceCtx, location: locationCtx })
          : '';

        // Distance text — safe fallback for missing area
        const distText = (provider.distanceKm != null) 
          ? `📍 ${provider.distanceKm} km away • ${providerArea}`
          : `📍 ${providerArea}`;

        const skillsList = Array.isArray(provider.skills) ? provider.skills : [provider.trade];
        const safeRating = Number(provider.rating || 5).toFixed(1);
        const safeReviewsCount = parseInt(provider.reviewsCount || 0, 10);
        const safeExpYrs = parseInt(provider.experienceYrs || 3, 10);
        const safeAvatarBg = (provider.avatarBg && typeof provider.avatarBg === 'string' && provider.avatarBg.startsWith('linear-gradient')) ? provider.avatarBg : 'var(--green)';

        // Contact action buttons generated via central NigeriaPhone utility
        const callBtnHtml = telUrl
          ? `<a href="${escapeHtml(telUrl)}" class="action-btn call-btn" aria-label="Call ${escapeHtml(provider.name)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Call Now
            </a>`
          : '';

        const waBtnHtml = waUrl
          ? `<a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener" class="action-btn wa-btn" aria-label="WhatsApp ${escapeHtml(provider.name)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 0 0 .611.611l4.458-1.495A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 0 1-5.39-1.585l-.386-.231-2.646.887.887-2.646-.231-.386A9.94 9.94 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              WhatsApp
            </a>`
          : (telUrl
              ? `<a href="${escapeHtml(telUrl)}" class="action-btn call-btn" title="WhatsApp not available — tap to call" aria-label="Call ${escapeHtml(provider.name)} (no WhatsApp)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Call Only
                </a>`
              : '');

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
                ${(provider.is_sponsored || provider.isSponsored) ? `<span class="badge-tag-sponsored" style="background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.4); font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">⚡ Sponsored</span>` : ''}
                ${(provider.is_community_builder || provider.isCommunityBuilder) ? `<span class="badge-tag-community" style="background: rgba(251, 191, 36, 0.15); color: #FBBF24; border: 1px solid rgba(251, 191, 36, 0.4); font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">🌟 Community Builder</span>` : ''}
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
              ${callBtnHtml}
              ${waBtnHtml}
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
    if (state.state && state.state !== "all") tags.push(`State: ${state.state}`);
    if (state.lga && state.lga !== "all") tags.push(`LGA: ${state.lga}`);
    if (state.locality && state.locality !== "all") tags.push(`Neighborhood: ${state.locality}`);
    if (state.city && state.city !== "all" && state.city !== state.lga && state.city !== state.state) tags.push(`City: ${state.city}`);
    if (state.locationQuery && state.locationQuery !== state.state && state.locationQuery !== state.lga && state.locationQuery !== state.locality) tags.push(`Location: "${state.locationQuery}"`);
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

  // 6.1 Live Nigerian Location Suggestions Handling
  function renderLocationSuggestions(query) {
    if (!locationSuggestions || typeof NigeriaLocations === 'undefined') return;
    const matches = NigeriaLocations.searchLocations(query, 6);
    if (matches.length === 0) {
      locationSuggestions.style.display = "none";
      locationSuggestions.innerHTML = "";
      return;
    }

    locationSuggestions.innerHTML = matches.map(m => `
      <div class="suggestion-item location-sugg-item" data-state="${escapeHtml(m.state)}" data-lga="${escapeHtml(m.lga || '')}" data-locality="${escapeHtml(m.locality || '')}" data-formatted="${escapeHtml(m.formatted)}">
        <span class="sugg-icon">📍</span>
        <div style="display: flex; flex-direction: column; text-align: left;">
          <span style="font-weight: 600; font-size: 13px; color: var(--fg);">${escapeHtml(m.title)}</span>
          <span style="font-size: 11px; color: var(--fg-muted);">${escapeHtml(m.label)}</span>
        </div>
      </div>
    `).join('');
    locationSuggestions.style.display = "block";
  }

  function hideLocationSuggestions() {
    if (locationSuggestions) {
      setTimeout(() => {
        locationSuggestions.style.display = "none";
      }, 250);
    }
  }

  if (locationSuggestions) {
    locationSuggestions.addEventListener("click", (e) => {
      const item = e.target.closest(".location-sugg-item");
      if (item && item.dataset.state) {
        const itemState = item.dataset.state;
        const itemLga = item.dataset.lga;
        const itemLocality = item.dataset.locality;
        const itemFormatted = item.dataset.formatted;

        if (locationSearch) locationSearch.value = itemFormatted;
        state.locationQuery = itemFormatted;
        state.state = itemState;
        state.lga = itemLga || "all";
        state.locality = itemLocality || "all";

        if (stateSelect) stateSelect.value = itemState;
        updateLgaSelect(itemState, state.lga);
        if (state.lga !== "all") {
          updateLocalitySelect(itemState, state.lga, state.locality);
        }

        locationSuggestions.style.display = "none";
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

  if (stateSelect) {
    stateSelect.addEventListener("change", (e) => {
      const selectedState = e.target.value;
      state.state = selectedState;
      state.lga = "all";
      state.locality = "all";
      updateLgaSelect(selectedState, "all");
      state.page = 1;
      render();
    });
  }

  if (lgaSelect) {
    lgaSelect.addEventListener("change", (e) => {
      const selectedLga = e.target.value;
      state.lga = selectedLga;
      state.locality = "all";
      updateLocalitySelect(state.state, selectedLga, "all");
      state.page = 1;
      render();
    });
  }

  if (localitySelect) {
    localitySelect.addEventListener("change", (e) => {
      state.locality = e.target.value;
      state.page = 1;
      render();
    });
  }

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
      const val = e.target.value.trim();
      state.locationQuery = val;
      state.page = 1;
      renderLocationSuggestions(val);
      render();
    }, 250));

    locationSearch.addEventListener("focus", (e) => {
      if (e.target.value.trim()) {
        renderLocationSuggestions(e.target.value.trim());
      }
    });

    locationSearch.addEventListener("blur", hideLocationSuggestions);

    locationSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        hideLocationSuggestions();
        render();
      }
    });
  }

  if (applyMainSearchBtn) {
    applyMainSearchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      hideSuggestions();
      hideLocationSuggestions();
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
      state.industry = "all";
      state.specialization = "all";
      state.city = "all";
      state.state = "all";
      state.lga = "all";
      state.locality = "all";
      state.locationQuery = "";
      state.maxDistance = 50;
      state.minRating = 0;
      state.verifiedOnly = false;
      state.availableOnly = false;
      state.page = 1;

      if (searchInput) searchInput.value = "";
      if (categorySelect) categorySelect.value = "all";
      if (citySelect) citySelect.value = "all";
      if (stateSelect) stateSelect.value = "all";
      updateLgaSelect("all");
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

  // Phase 10.10: Browse-by-Industry Click Handler (Delegated)
  if (browseSection) {
    browseSection.addEventListener("click", (e) => {
      // 1. If clicked on a specific skill chip tag
      const skillPill = e.target.closest(".industry-skill-pill-tag");
      if (skillPill && skillPill.dataset.skillSlug) {
        e.preventDefault();
        e.stopPropagation();
        const slug = skillPill.dataset.skillSlug;
        const catObj = (typeof CategoryMap !== 'undefined') ? CategoryMap.getBySlug(slug) : null;
        state.category = slug;
        state.keyword = "";
        if (searchInput) searchInput.value = "";
        if (categorySelect && catObj) {
          categorySelect.value = catObj.dropdownValue || catObj.name;
        }
        state.page = 1;

        if (typeof LokatorTelemetry !== 'undefined') {
          LokatorTelemetry.trackEvent('skill_selected', { skill: slug, source: 'browse_grid' });
        }
        if (typeof LokatorDB !== 'undefined' && LokatorDB.marketplaceDiscovery) {
          LokatorDB.marketplaceDiscovery.trackDiscoveryEvent('skill_selected', { skill: slug, source: 'browse_grid' }).catch(() => {});
        }

        render();
        window.scrollTo({ top: 260, behavior: 'smooth' });
        return;
      }

      // 2. If clicked on the industry card itself
      const card = e.target.closest(".industry-browse-card");
      if (card && card.dataset.industryId) {
        e.preventDefault();
        const indId = card.dataset.industryId;
        state.industry = (state.industry === indId) ? "all" : indId;
        state.page = 1;

        if (typeof LokatorTelemetry !== 'undefined') {
          LokatorTelemetry.trackEvent('industry_selected', { industry: indId, source: 'browse_grid' });
        }
        if (typeof LokatorDB !== 'undefined' && LokatorDB.marketplaceDiscovery) {
          LokatorDB.marketplaceDiscovery.trackDiscoveryEvent('industry_selected', { industry: indId, source: 'browse_grid' }).catch(() => {});
        }

        render();
        window.scrollTo({ top: 260, behavior: 'smooth' });
      }
    });
  }

  // Phase 10.12F: Mobile Filter Bottom-Sheet & Backdrop Lifecycle
  function openFilterDrawer() {
    if (filterSidebar) {
      filterSidebar.classList.add("open", "mobile-open");
    }
    if (filterBackdrop) {
      filterBackdrop.classList.add("active");
    }
    document.body.classList.add("filter-drawer-open");
    if (mobileFilterBtn) {
      mobileFilterBtn.setAttribute("aria-expanded", "true");
    }
    if (mobileFilterCloseBtn) {
      try { mobileFilterCloseBtn.focus(); } catch (e) {}
    }
    if (typeof LokatorTelemetry !== 'undefined') {
      LokatorTelemetry.trackEvent('mobile_filter_opened', { source: 'search_toolbar' });
    }
  }

  function closeFilterDrawer() {
    if (filterSidebar) {
      filterSidebar.classList.remove("open", "mobile-open");
    }
    if (filterBackdrop) {
      filterBackdrop.classList.remove("active");
    }
    document.body.classList.remove("filter-drawer-open");
    if (mobileFilterBtn) {
      mobileFilterBtn.setAttribute("aria-expanded", "false");
      try { mobileFilterBtn.focus(); } catch (e) {}
    }
  }

  if (mobileFilterBtn) {
    mobileFilterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openFilterDrawer();
    });
  }

  if (mobileFilterCloseBtn) {
    mobileFilterCloseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeFilterDrawer();
    });
  }

  if (filterBackdrop) {
    filterBackdrop.addEventListener("click", (e) => {
      e.preventDefault();
      closeFilterDrawer();
    });
  }

  if (mobileApplyFiltersBtn) {
    mobileApplyFiltersBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeFilterDrawer();
      state.page = 1;
      render();
      if (typeof LokatorTelemetry !== 'undefined') {
        LokatorTelemetry.trackEvent('mobile_filter_applied', {
          category: state.category,
          state: state.state,
          lga: state.lga,
          locality: state.locality
        });
      }
    });
  }

  if (mobileResetFiltersBtn) {
    mobileResetFiltersBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (resetFiltersBtn) {
        resetFiltersBtn.click();
      }
      closeFilterDrawer();
    });
  }

  // GPS / "Near Me" Search Handler with High Accuracy & Reverse Geocoding
  if (gpsTrigger) {
    gpsTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      if (!('geolocation' in navigator)) {
        alert('Geolocation is not supported by your browser.');
        return;
      }

      gpsTrigger.classList.add('loading');
      const origHtml = gpsTrigger.innerHTML;
      gpsTrigger.innerHTML = '<span>Locating...</span>';

      const handleGpsSuccess = async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        state.userCoords = { lat, lng };
        state.sortBy = "distance-asc";
        if (sortSelect) sortSelect.value = "distance-asc";

        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, {
            headers: { 'Accept': 'application/json' }
          });
          if (resp.ok) {
            const data = await resp.json();
            const a = data.address || {};
            const area = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.town || a.city || 'My Location';
            const city = a.city || a.county || a.state_district || 'Lagos';
            const locName = `${area}, ${city}`;
            if (locationSearch) locationSearch.value = locName;
            state.locationQuery = locName;
            try {
              sessionStorage.setItem('lokator_temp_location_name', locName);
              sessionStorage.setItem('lokator_temp_lat', lat.toString());
              sessionStorage.setItem('lokator_temp_lng', lng.toString());
            } catch (err) {}
          }
        } catch (e) {
          if (locationSearch) locationSearch.value = `Near Me (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
        }

        gpsTrigger.innerHTML = '<span style="color:#52E58C;">✓ Located</span>';
        setTimeout(() => { gpsTrigger.innerHTML = origHtml; }, 3000);
        state.page = 1;
        render();
      };

      const handleGpsFail = (err) => {
        console.warn('Search GPS notice:', err);
        if (err && err.code === 3) {
          // Retry with network geolocation
          navigator.geolocation.getCurrentPosition(
            handleGpsSuccess,
            (finalErr) => {
              gpsTrigger.innerHTML = origHtml;
              alert(finalErr.code === 1 ? 'Location permission was denied. Please enter your area manually.' : 'Could not acquire GPS fix. Please enter your area manually.');
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
          );
          return;
        }
        gpsTrigger.innerHTML = origHtml;
        alert(err && err.code === 1 ? 'Location permission was denied. Please enter your area manually.' : 'Could not detect your current location. Please enter your area manually.');
      };

      navigator.geolocation.getCurrentPosition(
        handleGpsSuccess,
        handleGpsFail,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  }

  // Hamburger / Mobile Nav Menu Handler with Outside Click Dismiss
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a, button').forEach(item => {
      item.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Close drawer on Escape key press
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && filterSidebar && (filterSidebar.classList.contains("open") || filterSidebar.classList.contains("mobile-open"))) {
      closeFilterDrawer();
    }
  });

  // ============================================================================
  // PHASE 10.14: QUICK MATCH MODAL HANDLERS
  // ============================================================================
  const quickMatchModal = document.getElementById('quick-match-modal');
  const quickMatchCloseBtn = document.getElementById('quick-match-close-btn');
  const emptyQuickMatchBtn = document.getElementById('btn-empty-quick-match');
  const quickMatchForm = document.getElementById('quick-match-form');
  const qmCategoryInput = document.getElementById('qm-category');
  const qmStateSelect = document.getElementById('qm-state');
  const qmLgaInput = document.getElementById('qm-lga');
  const qmNeighborhoodInput = document.getElementById('qm-neighborhood');
  const qmUrgencySelect = document.getElementById('qm-urgency');
  const qmDescriptionInput = document.getElementById('qm-description');
  const qmResultBox = document.getElementById('qm-result-box');
  const qmResultText = document.getElementById('qm-result-text');
  const qmWhatsAppBtn = document.getElementById('qm-whatsapp-btn');

  function openQuickMatch(cat = '', st = '', lga = '') {
    if (!quickMatchModal) return;
    if (qmCategoryInput) qmCategoryInput.value = cat || (state.category !== 'all' ? state.category : (state.keyword || ''));
    if (qmStateSelect && st) qmStateSelect.value = st;
    if (qmLgaInput) qmLgaInput.value = lga || (state.lga !== 'all' ? state.lga : (state.city !== 'all' ? state.city : ''));
    if (qmResultBox) qmResultBox.style.display = 'none';
    quickMatchModal.style.display = 'flex';
    quickMatchModal.setAttribute('aria-hidden', 'false');
  }

  function closeQuickMatch() {
    if (!quickMatchModal) return;
    quickMatchModal.style.display = 'none';
    quickMatchModal.setAttribute('aria-hidden', 'true');
  }

  if (emptyQuickMatchBtn) {
    emptyQuickMatchBtn.addEventListener('click', () => {
      openQuickMatch(state.keyword || (state.category !== 'all' ? state.category : ''), state.state !== 'all' ? state.state : 'Delta', state.city !== 'all' ? state.city : '');
    });
  }

  if (quickMatchCloseBtn) {
    quickMatchCloseBtn.addEventListener('click', closeQuickMatch);
  }

  if (quickMatchModal) {
    quickMatchModal.addEventListener('click', (e) => {
      if (e.target === quickMatchModal) closeQuickMatch();
    });
  }

  if (quickMatchForm) {
    quickMatchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cat = qmCategoryInput ? qmCategoryInput.value.trim() : 'artisan';
      const st = qmStateSelect ? qmStateSelect.value.trim() : 'Delta';
      const lga = qmLgaInput ? qmLgaInput.value.trim() : 'Warri South';
      const neigh = qmNeighborhoodInput ? qmNeighborhoodInput.value.trim() : '';
      const urg = qmUrgencySelect ? qmUrgencySelect.value : 'within_24h';
      const desc = qmDescriptionInput ? qmDescriptionInput.value.trim() : '';

      if (typeof LokatorDB !== 'undefined' && LokatorDB.liquidityEngine) {
        const res = await LokatorDB.liquidityEngine.generateJobRequest({
          category: cat,
          state: st,
          lga: lga,
          neighborhood: neigh,
          urgency: urg,
          description: desc
        });

        if (res.success && res.primary_whatsapp_url) {
          if (qmResultBox && qmResultText && qmWhatsAppBtn) {
            const artisanName = res.primary_artisan ? (res.primary_artisan.first_name || res.primary_artisan.name) : 'Verified Artisan';
            qmResultText.textContent = `Connected with ${artisanName} in ${res.location}. Tap below to send your pre-filled job brief on WhatsApp!`;
            qmWhatsAppBtn.href = res.primary_whatsapp_url;
            qmWhatsAppBtn.style.display = 'flex';
            qmResultBox.style.display = 'block';
          }
          window.open(res.primary_whatsapp_url, '_blank');
        } else {
          if (qmResultBox && qmResultText && qmWhatsAppBtn) {
            qmResultText.textContent = `Job request broadcasted to the ${lga} artisan community feed! We will notify nearby artisans as they come online.`;
            qmWhatsAppBtn.style.display = 'none';
            qmResultBox.style.display = 'block';
          }
        }
      }
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
