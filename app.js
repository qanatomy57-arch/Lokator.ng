// ===== LOKATOR — APP.JS =====

// ===== SCENE DATA DEFINITIONS (9 STAGES) =====
const SCENES = [
  {
    index: 0,
    key: 'master',
    title: 'Master Marketplace',
    icon: '⚡',
    proName: 'Verified Artisan Community',
    proSub: '📍 Closest Providers in Real-Time',
    badgeText: '01 / 09',
    glow: 'radial-gradient(circle, rgba(212, 175, 55, 0.22) 0%, rgba(0, 107, 63, 0.28) 45%, transparent 70%)',
    rotateZ: 0,
    scale: 1
  },
  {
    index: 1,
    key: 'electrician',
    title: 'Electrical Services',
    icon: '⚡',
    proName: 'Adebayo Okafor · Master Electrician',
    proSub: '📍 0.8 km away · Surulere, Lagos',
    badgeText: '02 / 09',
    glow: 'radial-gradient(circle, rgba(245, 158, 11, 0.28) 0%, rgba(0, 107, 63, 0.32) 45%, transparent 70%)',
    rotateZ: -1.2,
    scale: 1.02
  },
  {
    index: 2,
    key: 'plumber',
    title: 'Plumbing Services',
    icon: '🔧',
    proName: 'Emeka Musa · Rapid Response Plumber',
    proSub: '📍 1.1 km away · Ikeja, Lagos',
    badgeText: '03 / 09',
    glow: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(0, 107, 63, 0.3) 45%, transparent 70%)',
    rotateZ: 1.2,
    scale: 1.01
  },
  {
    index: 3,
    key: 'beauty',
    title: 'Beauty & Nail Services',
    icon: '💅',
    proName: 'Chidinma Ikenna · Nail & Beauty Tech',
    proSub: '📍 1.2 km away · Lekki, Lagos',
    badgeText: '04 / 09',
    glow: 'radial-gradient(circle, rgba(244, 114, 182, 0.26) 0%, rgba(212, 175, 55, 0.25) 45%, transparent 70%)',
    rotateZ: -1,
    scale: 1.02
  },
  {
    index: 4,
    key: 'tailor',
    title: 'Fashion & Tailoring',
    icon: '🧵',
    proName: 'Fatima Kawu · Bespoke Fashion Designer',
    proSub: '📍 1.5 km away · Wuse, Abuja',
    badgeText: '05 / 09',
    glow: 'radial-gradient(circle, rgba(168, 85, 247, 0.26) 0%, rgba(0, 107, 63, 0.25) 45%, transparent 70%)',
    rotateZ: 1.4,
    scale: 1.015
  },
  {
    index: 5,
    key: 'mechanic',
    title: 'Auto Services',
    icon: '🔩',
    proName: 'Kabiru Sani · Certified Auto Mechanic',
    proSub: '📍 1.8 km away · Garki, Abuja',
    badgeText: '06 / 09',
    glow: 'radial-gradient(circle, rgba(251, 146, 60, 0.28) 0%, rgba(0, 107, 63, 0.3) 45%, transparent 70%)',
    rotateZ: -1.3,
    scale: 1.02
  },
  {
    index: 6,
    key: 'carpenter',
    title: 'Carpentry & Woodwork',
    icon: '🪚',
    proName: 'Godwin Bassey · Master Wood Craftsman',
    proSub: '📍 2.0 km away · Yaba, Lagos',
    badgeText: '07 / 09',
    glow: 'radial-gradient(circle, rgba(217, 119, 6, 0.26) 0%, rgba(0, 107, 63, 0.25) 45%, transparent 70%)',
    rotateZ: 1.1,
    scale: 1.015
  },
  {
    index: 7,
    key: 'cleaner',
    title: 'Home & Cleaning Services',
    icon: '✨',
    proName: 'Grace Alabi · Professional Cleaner',
    proSub: '📍 0.9 km away · Victoria Island, Lagos',
    badgeText: '08 / 09',
    glow: 'radial-gradient(circle, rgba(45, 212, 191, 0.28) 0%, rgba(0, 107, 63, 0.3) 45%, transparent 70%)',
    rotateZ: -1.2,
    scale: 1.02
  },
  {
    index: 8,
    key: 'finale',
    title: '18,000+ Verified Network',
    icon: '🇳🇬',
    proName: 'Lokator Verified Network',
    proSub: '📍 Across All 36 Nigerian States',
    badgeText: '09 / 09',
    glow: 'radial-gradient(circle, rgba(34, 197, 94, 0.32) 0%, rgba(212, 175, 55, 0.32) 45%, transparent 70%)',
    rotateZ: 0,
    scale: 1.03
  }
];

// ===== SCROLL DISCOVERY ENGINE (VERTICAL SCROLL-SNAP + INTERSECTION OBSERVER) =====
class ScrollDiscoveryEngine {
  constructor() {
    this.heroWrapper = document.getElementById('hero');
    if (!this.heroWrapper) return;

    this.slides = Array.from(document.querySelectorAll('.hero-slide'));
    this.videos = Array.from(document.querySelectorAll('.hero-video'));
    this.timelineSteps = Array.from(document.querySelectorAll('.t-step'));
    this.scrollPrompt = document.getElementById('scroll-prompt');

    this.currentIndex = 0;
    this.isHeroInViewport = true;
    this.activeProgressVideo = null;
    this.activeProgressHandler = null;

    this.init();
  }

  init() {
    // 1. Configure and prime initial video preloads
    this.primeAllVideos();

    // 3. IntersectionObserver for slide visibility within hero container
    this.setupIntersectionObserver();

    // 4. Viewport observer for hero section (pause all videos when scrolled down page)
    this.setupHeroViewportObserver();

    // 5. User interaction listener to ensure mobile media autoplay permission
    const unlockAutoplay = () => {
      if (this.isHeroInViewport) {
        this.playVideo(this.currentIndex);
        this.bufferAdjacentVideos(this.currentIndex);
        this.bindVideoProgress(this.currentIndex);
      }
      window.removeEventListener('touchstart', unlockAutoplay);
      window.removeEventListener('click', unlockAutoplay);
    };
    window.addEventListener('touchstart', unlockAutoplay, { passive: true, once: true });
    window.addEventListener('click', unlockAutoplay, { passive: true, once: true });

    // 6. Interactive timeline step clicks
    this.timelineSteps.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const stepIndex = parseInt(btn.dataset.step, 10);
        if (!isNaN(stepIndex)) {
          this.scrollToStep(stepIndex);
        }
      });
    });

    // 7. Scroll prompt click
    if (this.scrollPrompt) {
      this.scrollPrompt.addEventListener('click', () => {
        this.scrollToStep(1);
      });
    }

    // 8. Initial active state on slide 0
    this.updateActiveSlide(0);
    this.bindVideoProgress(0);
    this.playVideo(0);
  }

  primeAllVideos() {
    this.videos.forEach((vid, i) => {
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      vid.setAttribute('muted', '');

      // Slide 0 is immediate, Slide 1 is pre-buffered, others on-demand
      if (i === 0) {
        vid.preload = 'auto';
      } else if (i === 1) {
        vid.preload = 'metadata';
      } else {
        vid.preload = 'none';
      }
    });
  }

  setupIntersectionObserver() {
    const observerOptions = {
      root: this.heroWrapper,
      rootMargin: '0px',
      threshold: 0.65
    };

    this.slideObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const slideIndex = parseInt(entry.target.dataset.index, 10);
          if (!isNaN(slideIndex)) {
            this.onSlideVisible(slideIndex);
          }
        }
      });
    }, observerOptions);

    this.slides.forEach(slide => {
      this.slideObserver.observe(slide);
    });
  }

  setupHeroViewportObserver() {
    // Pause hero videos when user scrolls down to downstream homepage sections
    this.heroViewportObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isHeroInViewport = entry.isIntersecting;
        if (!this.isHeroInViewport) {
          // Off-screen: pause all hero videos to save battery/GPU
          this.pauseAllVideos();
          if (this.activeProgressVideo && this.activeProgressHandler) {
            this.activeProgressVideo.removeEventListener('timeupdate', this.activeProgressHandler);
          }
        } else {
          // Back in view: resume the active video and progress tracking
          this.playVideo(this.currentIndex);
          this.bindVideoProgress(this.currentIndex);
        }
      });
    }, { threshold: 0.15 });

    this.heroViewportObserver.observe(this.heroWrapper);
  }

  onSlideVisible(newIndex) {
    if (newIndex === this.currentIndex && this.slides[newIndex].classList.contains('is-active')) return;

    this.currentIndex = newIndex;

    // 1. Update visual is-active state on slides
    this.updateActiveSlide(newIndex);

    // 2. Strict invariant: At most ONE hero video plays at a time
    this.pauseAllVideosExcept(newIndex);

    // 3. Play active video if hero is in viewport
    if (this.isHeroInViewport) {
      this.playVideo(newIndex);
    }

    // 4. Pre-buffer adjacent slides
    this.bufferAdjacentVideos(newIndex);

    // 5. Update timeline navigation dots & accessibility attributes
    this.timelineSteps.forEach((step, i) => {
      const isActive = i === newIndex;
      step.classList.toggle('active', isActive);
      step.setAttribute('aria-selected', isActive ? 'true' : 'false');
      step.setAttribute('aria-current', isActive ? 'true' : 'false');
      if (!isActive) {
        step.style.removeProperty('--video-progress');
      }
    });

    // 6. Bind active video playback progress
    this.bindVideoProgress(newIndex);

    // 7. Smoothly fade scroll prompt when navigating away from first slide
    if (this.scrollPrompt) {
      this.scrollPrompt.style.opacity = newIndex === 0 ? '1' : '0';
      this.scrollPrompt.style.pointerEvents = newIndex === 0 ? 'auto' : 'none';
      this.scrollPrompt.style.transition = 'opacity 0.4s ease';
    }
  }

  bindVideoProgress(idx) {
    // Unbind previous video progress handler
    if (this.activeProgressVideo && this.activeProgressHandler) {
      this.activeProgressVideo.removeEventListener('timeupdate', this.activeProgressHandler);
      this.activeProgressVideo = null;
      this.activeProgressHandler = null;
    }

    const currentVideo = this.videos[idx];
    const currentStep = this.timelineSteps[idx];
    if (!currentVideo || !currentStep) return;

    this.activeProgressHandler = () => {
      if (currentVideo.duration && !isNaN(currentVideo.duration) && currentVideo.duration > 0) {
        const pct = Math.min(100, Math.max(0, (currentVideo.currentTime / currentVideo.duration) * 100));
        currentStep.style.setProperty('--video-progress', `${pct.toFixed(1)}%`);
      }
    };

    currentVideo.addEventListener('timeupdate', this.activeProgressHandler, { passive: true });
    this.activeProgressVideo = currentVideo;
  }

  updateActiveSlide(idx) {
    this.slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === idx);
    });
  }

  bufferAdjacentVideos(centerIdx) {
    const toBuffer = [centerIdx - 1, centerIdx, centerIdx + 1];
    toBuffer.forEach(idx => {
      if (idx >= 0 && idx < this.videos.length) {
        const vid = this.videos[idx];
        if (vid && vid.preload !== 'auto') {
          vid.preload = 'auto';
        }
      }
    });
  }

  playVideo(idx) {
    if (idx < 0 || idx >= this.videos.length) return;
    const vid = this.videos[idx];
    if (!vid) return;

    vid.muted = true;
    vid.playsInline = true;
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Graceful catch for mobile browser autoplay policies
      });
    }
  }

  pauseVideo(idx) {
    if (idx < 0 || idx >= this.videos.length) return;
    const vid = this.videos[idx];
    if (!vid) return;
    vid.pause();
  }

  pauseAllVideosExcept(activeIdx) {
    this.videos.forEach((vid, i) => {
      if (i !== activeIdx) {
        vid.pause();
      }
    });
  }

  pauseAllVideos() {
    this.videos.forEach(vid => vid.pause());
  }

  scrollToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.slides.length) return;
    const targetSlide = this.slides[stepIndex];
    if (!targetSlide) return;

    this.heroWrapper.scrollTo({
      top: targetSlide.offsetTop,
      behavior: 'smooth'
    });
  }
}

// Initialize Discovery Engine on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.lokatorDiscovery = new ScrollDiscoveryEngine();
});

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// ===== GPS LOCATION DETECTION =====
const gpsBtn = document.getElementById('gps-btn');
const locationInput = document.getElementById('location-input');

if (gpsBtn && locationInput) {
  // Pre-fill location if previously detected in this session
  try {
    const savedLoc = sessionStorage.getItem('lokator_temp_location_name');
    if (savedLoc && !locationInput.value) {
      locationInput.value = savedLoc;
      gpsBtn.title = 'Location saved from current session';
    }
  } catch (e) { }

  gpsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!('geolocation' in navigator)) {
      const fallback = 'Surulere, Lagos';
      locationInput.value = fallback;
      try {
        sessionStorage.setItem('lokator_temp_location_name', fallback);
      } catch (err) { }
      return;
    }
    gpsBtn.style.background = '#006B3F';
    gpsBtn.style.color = '#fff';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detectedArea = 'Surulere, Lagos';
        locationInput.value = detectedArea;
        gpsBtn.title = 'Location detected!';
        try {
          sessionStorage.setItem('lokator_temp_location_name', detectedArea);
          sessionStorage.setItem('lokator_temp_lat', String(pos.coords.latitude));
          sessionStorage.setItem('lokator_temp_lng', String(pos.coords.longitude));
        } catch (err) { }
      },
      () => {
        locationInput.placeholder = 'GPS denied — enter your area';
        gpsBtn.style.background = '#FEE2E2';
        gpsBtn.style.color = '#DC2626';
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}

// ===== SEARCH BUTTON ON HOMEPAGE (REDIRECTS TO SEARCH.HTML) =====
const searchBtn = document.getElementById('search-btn');
const serviceInput = document.getElementById('service-input');

function handleSearchRedirect() {
  const serviceText = serviceInput ? serviceInput.value.trim() : '';
  const locationText = locationInput ? locationInput.value.trim() : '';

  const params = new URLSearchParams();
  if (serviceText) {
    params.set('q', serviceText);
  }

  // Preserve location from input or sessionStorage
  let locToPass = locationText;
  if (!locToPass) {
    try {
      const sessionLoc = sessionStorage.getItem('lokator_temp_location_name');
      if (sessionLoc) locToPass = sessionLoc;
    } catch (e) { }
  }

  if (locToPass) params.set('location', locToPass);

  const targetUrl = params.toString() ? `search.html?${params.toString()}` : 'search.html';
  window.location.href = targetUrl;
}

if (searchBtn) {
  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleSearchRedirect();
  });
}
if (serviceInput) {
  serviceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchRedirect();
    }
  });
}
if (locationInput) {
  locationInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchRedirect();
    }
  });
}

// ===== SCROLL REVEAL ANIMATION (Downstream Sections) =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

const revealElements = document.querySelectorAll(
  '.step, .cat-item, .why-card, .tp-card, .testi-card, .provider-card'
);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  revealElements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.45s ${i * 0.05}s ease, transform 0.45s ${i * 0.05}s ease`;
    revealObserver.observe(el);
  });
}

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, suffix = '') {
  const duration = 1600;
  const startTime = performance.now();
  const update = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    el.textContent = current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const heroStats = document.querySelector('.hero-stats');
if (heroStats && !prefersReducedMotion) {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stats = heroStats.querySelectorAll('.hstat strong');
        if (stats[0]) animateCounter(stats[0], 18000, '+');
        if (stats[1]) animateCounter(stats[1], 36, '');
        statsObserver.unobserve(heroStats);
      }
    });
  }, { threshold: 0.2 });
  statsObserver.observe(heroStats);
}

// ===== DYNAMIC HOMEPAGE TOP-RATED PROVIDERS FROM SUPABASE =====
async function loadDynamicTopProviders() {
  const tpGrid = document.querySelector('.tp-grid');
  if (!tpGrid || typeof LokatorDB === 'undefined') return;

  const escapeHtml = (typeof window !== 'undefined' && window.escapeHtml) ||
                     (typeof LokatorDB !== 'undefined' && LokatorDB.escapeHtml) ||
                     ((v) => (v === null || v === undefined) ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

  try {
    const featured = await LokatorDB.getTopFeaturedProviders(3);
    if (featured && featured.length > 0) {
      tpGrid.innerHTML = featured.map((p, idx) => {
        const safeId = parseInt(p.id, 10) || 0;
        const initials = (p.name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
        const cleanWa = (p.whatsappNumber || p.phone || '').replace(/[^0-9]/g, '');
        const waMsg = encodeURIComponent(`Hello ${p.name}, I saw your profile on Lokator`);
        const safeRating = Number(p.rating || 5).toFixed(1);
        const safeReviews = parseInt(p.reviewsCount || 0, 10);
        const safeAvatarBg = (p.avatarBg && typeof p.avatarBg === 'string' && p.avatarBg.startsWith('linear-gradient')) ? p.avatarBg : 'var(--green)';

        return `
          <div class="tp-card ${idx === 1 ? 'tp-featured' : ''}" id="tp-${safeId}">
            ${idx === 1 ? '<span class="tp-featured-label">⭐ Top Rated</span>' : ''}
            <div class="tp-top">
              <a href="profile.html?id=${safeId}" class="tp-card-link">
                <div class="tp-avatar" style="background: ${safeAvatarBg};">${escapeHtml(initials)}</div>
              </a>
              <div class="tp-details">
                <a href="profile.html?id=${safeId}" class="tp-card-link">
                  <strong>${escapeHtml(p.name)}</strong>
                </a>
                <span class="verified-badge sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Verified
                </span>
              </div>
            </div>
            <span class="tp-trade">${escapeHtml(p.trade)}</span>
            <div class="tp-rating">★★★★★ <span>${safeRating} (${safeReviews})</span></div>
            <span class="tp-loc">📍 ${escapeHtml(p.area)}</span>
            <div class="tp-actions">
              <a href="tel:${cleanPhone}" class="action-btn call-btn sm">📞 Call</a>
              <a href="https://wa.me/${cleanWa}?text=${waMsg}" target="_blank" rel="noopener" class="action-btn wa-btn sm">💬 WhatsApp</a>
              <a href="profile.html?id=${safeId}" class="action-btn profile-btn sm">View Profile</a>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    console.warn('Could not load dynamic top providers from Supabase:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadDynamicTopProviders();
    setupFunnelTelemetryListeners();
  });
} else {
  loadDynamicTopProviders();
  setupFunnelTelemetryListeners();
}

function setupFunnelTelemetryListeners() {
  // Category browse clicks on homepage
  document.querySelectorAll('.cat-item').forEach(cat => {
    cat.addEventListener('click', () => {
      if (typeof LokatorTelemetry !== 'undefined') {
        const href = cat.getAttribute('href') || '';
        const catSlug = href.includes('service=') ? href.split('service=')[1].split('&')[0] : 'all';
        LokatorTelemetry.trackEvent('category_browse_clicked', {
          category: catSlug,
          source: 'home_categories'
        });
      }
    });
  });

  // Registration CTA clicks on homepage
  document.querySelectorAll('a[href*="register.html"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof LokatorTelemetry !== 'undefined') {
        LokatorTelemetry.trackEvent('registration_cta_clicked', { source: 'home_page' });
      }
    });
  });
}
