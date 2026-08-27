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
    // 0. Network, Save-Data, and Reduced Motion Detection
    this.detectNetworkAndDeviceCapabilities();

    // 1. Configure and prime initial video preloads
    this.primeAllVideos();

    // 3. IntersectionObserver for slide visibility within hero container
    this.setupIntersectionObserver();

    // 4. Viewport observer for hero section (pause all videos when scrolled down page)
    this.setupHeroViewportObserver();

    // 5. User interaction listener to ensure mobile media autoplay permission
    const unlockAutoplay = () => {
      if (this.isHeroInViewport && !this.prefersReducedMotion) {
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

    // 8. Continuous Scrollbar & Scroll Position Tracker
    this.setupContinuousScrollTracking();

    // 9. Desktop Wheel Control for Scene Scroll Lock
    this.setupDesktopWheelControl();

    // 10. Initial active state on slide 0
    this.updateActiveSlide(0);
    this.bindVideoProgress(0);
    if (!this.prefersReducedMotion) {
      this.playVideo(0);
    }
  }

  detectNetworkAndDeviceCapabilities() {
    const nav = typeof navigator !== 'undefined' ? navigator : {};
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection || {};

    this.effectiveType = conn.effectiveType || '4g';
    this.saveData = conn.saveData === true;
    this.isSlowConnection = ['slow-2g', '2g', '3g'].includes(this.effectiveType) || this.saveData;

    this.prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  setupContinuousScrollTracking() {
    let ticking = false;

    this.heroWrapper.addEventListener('scroll', () => {
      if (this.isManualScrolling) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          ticking = false;
          const scrollTop = this.heroWrapper.scrollTop;
          const slideHeight = this.heroWrapper.clientHeight || window.innerHeight;
          const calculatedIndex = Math.round(scrollTop / slideHeight);
          const clampedIndex = Math.max(0, Math.min(this.slides.length - 1, calculatedIndex));

          if (clampedIndex !== this.currentIndex) {
            this.onSlideVisible(clampedIndex);
          }
        });
        ticking = true;
      }
    }, { passive: true });
  }

  primeAllVideos() {
    this.videos.forEach((vid, i) => {
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      vid.setAttribute('muted', '');
      vid.setAttribute('loop', '');

      // Error handler for graceful poster image fallback
      vid.addEventListener('error', () => {
        vid.style.opacity = '0';
      }, { once: true });

      // Adaptive preloading: slide 0 and 1 get auto; rest get metadata to enable instant play on demand
      if (i <= 1) {
        vid.preload = 'auto';
      } else {
        vid.preload = 'metadata';
      }
    });
  }

  setupIntersectionObserver() {
    const observerOptions = {
      root: this.heroWrapper,
      rootMargin: '0px',
      threshold: [0.25, 0.5, 0.75]
    };

    this.slideObserver = new IntersectionObserver((entries) => {
      if (this.isManualScrolling) return;
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
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
          // Back in view: resume the active video and progress tracking if allowed
          if (!this.prefersReducedMotion) {
            this.playVideo(this.currentIndex);
          }
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

    // 3. Play active video if hero is in viewport and motion permitted
    if (this.isHeroInViewport && !this.prefersReducedMotion) {
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
    if (this.isSlowConnection || this.saveData) {
      return;
    }

    const toBuffer = [centerIdx, centerIdx + 1, centerIdx - 1];
    toBuffer.forEach(idx => {
      if (idx >= 0 && idx < this.videos.length) {
        const vid = this.videos[idx];
        if (vid && vid.preload === 'none') {
          vid.preload = 'metadata';
        }
      }
    });
  }

  playVideo(idx) {
    if (this.prefersReducedMotion) return;
    if (idx < 0 || idx >= this.videos.length) return;
    const vid = this.videos[idx];
    if (!vid) return;

    vid.muted = true;
    vid.defaultMuted = true;
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    vid.setAttribute('muted', '');

    if (vid.readyState < 2 || vid.preload !== 'auto') {
      vid.preload = 'auto';
      try { vid.load(); } catch (e) {}
    }

    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        vid.addEventListener('canplay', () => {
          vid.play().catch(() => {});
        }, { once: true });
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

    this.isManualScrolling = true;
    this.onSlideVisible(stepIndex);

    this.heroWrapper.scrollTo({
      top: targetSlide.offsetTop,
      behavior: 'smooth'
    });

    clearTimeout(this.manualScrollTimer);
    this.manualScrollTimer = setTimeout(() => {
      this.isManualScrolling = false;
    }, 650);
  }

  setupDesktopWheelControl() {
    let wheelCooldown = false;
    const heroEl = this.heroWrapper;

    heroEl.addEventListener('wheel', (e) => {
      // Only apply on desktop viewports
      if (window.innerWidth < 769) return;
      if (wheelCooldown) {
        if (this.currentIndex < this.slides.length - 1 && e.deltaY > 0) e.preventDefault();
        if (this.currentIndex > 0 && e.deltaY < 0 && window.scrollY <= 10) e.preventDefault();
        return;
      }

      if (e.deltaY > 30) {
        // Scrolling down through scenes
        if (this.currentIndex < this.slides.length - 1) {
          e.preventDefault();
          wheelCooldown = true;
          this.scrollToStep(this.currentIndex + 1);
          setTimeout(() => { wheelCooldown = false; }, 600);
        } else {
          // At 9th scene (last slide): release scroll lock so page continues to Testimonials/Categories
          const downstreamSection = document.getElementById('how-it-works') || document.querySelector('.why-lokator') || document.querySelector('footer');
          if (downstreamSection && window.scrollY <= 10) {
            downstreamSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } else if (e.deltaY < -30) {
        // If downstream on page, let normal window scroll up to top first
        if (window.scrollY > 15) {
          return;
        }

        // Scrolling up through scenes once at top of document
        if (this.currentIndex > 0) {
          e.preventDefault();
          wheelCooldown = true;
          this.scrollToStep(this.currentIndex - 1);
          setTimeout(() => { wheelCooldown = false; }, 600);
        }
      }
    }, { passive: false });
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

// ===== PHASE 10.19: MOBILE NAVIGATION DRAWER & HAMBURGER CONTROL =====
const hamburger = document.getElementById('hamburger');
const mobileDrawer = document.getElementById('mobile-nav-drawer');
const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
const drawerCloseBtn = document.getElementById('mobile-nav-close-btn');
const navLinks = document.getElementById('nav-links');

function openMobileNav() {
  if (mobileDrawer) {
    mobileDrawer.classList.add('open');
    mobileDrawer.setAttribute('aria-hidden', 'false');
  }
  if (mobileBackdrop) {
    mobileBackdrop.classList.add('open');
    mobileBackdrop.setAttribute('aria-hidden', 'false');
  }
  if (hamburger) {
    hamburger.setAttribute('aria-expanded', 'true');
  }
  if (navLinks) {
    navLinks.classList.add('open');
  }
  document.body.classList.add('mobile-nav-open');
  if (drawerCloseBtn) drawerCloseBtn.focus();
}

function closeMobileNav() {
  if (mobileDrawer) {
    mobileDrawer.classList.remove('open');
    mobileDrawer.setAttribute('aria-hidden', 'true');
  }
  if (mobileBackdrop) {
    mobileBackdrop.classList.remove('open');
    mobileBackdrop.setAttribute('aria-hidden', 'true');
  }
  if (hamburger) {
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.focus();
  }
  if (navLinks) {
    navLinks.classList.remove('open');
  }
  document.body.classList.remove('mobile-nav-open');
}

if (hamburger) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = mobileDrawer ? mobileDrawer.classList.contains('open') : (navLinks && navLinks.classList.contains('open'));
    if (isOpen) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  });
}

if (drawerCloseBtn) {
  drawerCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMobileNav();
  });
}

if (mobileBackdrop) {
  mobileBackdrop.addEventListener('click', closeMobileNav);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('open')) {
    closeMobileNav();
  }
});

if (navLinks) {
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeMobileNav();
    });
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
  '.step, .cat-item, .why-card, .tp-card, .provider-card'
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
        const PhoneEngine = (typeof NigeriaPhone !== 'undefined' ? NigeriaPhone : null) || (typeof window !== 'undefined' ? window.NigeriaPhone : null);
        const telUrl = PhoneEngine ? PhoneEngine.buildTelUrl(p) : (p.phone ? `tel:${p.phone}` : '');
        const waUrl = PhoneEngine ? PhoneEngine.buildWhatsAppUrl(p, { service: p.trade, location: p.area }) : '';

        const safeRating = Number(p.rating || 5).toFixed(1);
        const safeReviews = parseInt(p.reviewsCount || 0, 10);
        const safeAvatarBg = (p.avatarBg && typeof p.avatarBg === 'string' && p.avatarBg.startsWith('linear-gradient')) ? p.avatarBg : 'var(--green)';

        const callActionHtml = telUrl ? `<a href="${escapeHtml(telUrl)}" class="action-btn call-btn sm" aria-label="Call ${escapeHtml(p.name)}">📞 Call</a>` : '';
        const waActionHtml = waUrl ? `<a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener" class="action-btn wa-btn sm" aria-label="WhatsApp ${escapeHtml(p.name)}">💬 WhatsApp</a>` : '';

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
              ${callActionHtml}
              ${waActionHtml}
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
    setupHeroSearchCard();
  });
} else {
  loadDynamicTopProviders();
  setupFunnelTelemetryListeners();
  setupHeroSearchCard();
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

  // Testimonials Continuous Marquee Touch Pause & Resume
  const testiTrack = document.getElementById('testi-track');
  if (testiTrack) {
    let touchResumeTimer = null;
    const resumeTrack = () => {
      if (touchResumeTimer) {
        clearTimeout(touchResumeTimer);
        touchResumeTimer = null;
      }
      testiTrack.classList.remove('is-paused');
    };

    testiTrack.addEventListener('touchstart', () => {
      testiTrack.classList.add('is-paused');
      if (touchResumeTimer) clearTimeout(touchResumeTimer);
      // Auto-resume after 4s safeguard even if touchend was cancelled by vertical document scroll
      touchResumeTimer = setTimeout(resumeTrack, 4000);
    }, { passive: true });

    testiTrack.addEventListener('touchend', resumeTrack, { passive: true });
    testiTrack.addEventListener('touchcancel', resumeTrack, { passive: true });
    testiTrack.addEventListener('pointerup', resumeTrack, { passive: true });
    testiTrack.addEventListener('pointercancel', resumeTrack, { passive: true });
  }
}

// ===== PHASE 10.17: HERO SEARCH CARD & AUTOCOMPLETE ENGINE =====
function setupHeroSearchCard() {
  const serviceInput = document.getElementById('service-input');
  const locationInput = document.getElementById('location-input');
  const searchBtn = document.getElementById('search-btn');
  const gpsBtn = document.getElementById('gps-btn');
  const serviceSuggestions = document.getElementById('hero-service-suggestions');
  const locationSuggestions = document.getElementById('hero-location-suggestions');

  let selectedState = '';
  let selectedLga = '';
  let userCoords = null;

  // Pre-load previously detected session location
  try {
    const savedLoc = sessionStorage.getItem('lokator_temp_location_name');
    const savedLat = sessionStorage.getItem('lokator_temp_lat');
    const savedLng = sessionStorage.getItem('lokator_temp_lng');
    const savedState = sessionStorage.getItem('lokator_temp_state');
    const savedLga = sessionStorage.getItem('lokator_temp_lga');

    if (savedLoc && locationInput && !locationInput.value) {
      locationInput.value = savedLoc;
      if (savedState) selectedState = savedState;
      if (savedLga) selectedLga = savedLga;
      if (savedLat && savedLng) {
        userCoords = { lat: parseFloat(savedLat), lng: parseFloat(savedLng) };
      }
    }
  } catch (e) {}

  function executeSearch() {
    const service = (serviceInput ? serviceInput.value : '').trim();
    const loc = (locationInput ? locationInput.value : '').trim();

    const params = new URLSearchParams();
    if (service) params.set('service', service);
    if (loc) params.set('location', loc);
    if (selectedState) params.set('state', selectedState);
    if (selectedLga) params.set('lga', selectedLga);
    if (userCoords) {
      params.set('lat', userCoords.lat.toString());
      params.set('lng', userCoords.lng.toString());
      params.set('near_me', 'true');
    }

    if (typeof LokatorTelemetry !== 'undefined') {
      LokatorTelemetry.trackEvent('hero_search_submitted', { service, location: loc, state: selectedState, lga: selectedLga });
    }

    window.location.href = `search.html?${params.toString()}`;
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      executeSearch();
    });
  }

  if (serviceInput) {
    serviceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearch();
      }
    });

    serviceInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (!serviceSuggestions) return;
      if (!q) {
        serviceSuggestions.style.display = 'none';
        return;
      }

      const suggestions = (typeof LokatorDB !== 'undefined' && LokatorDB.getSkillSuggestions)
        ? LokatorDB.getSkillSuggestions(q, 5)
        : ['Electrician', 'Plumber', 'Solar Installer', 'Nail Tech', 'Carpenter', 'Mechanic'].filter(s => s.toLowerCase().includes(q.toLowerCase()));

      if (suggestions.length === 0) {
        serviceSuggestions.style.display = 'none';
        return;
      }

      serviceSuggestions.innerHTML = suggestions.map(s => `
        <div class="suggestion-item" data-val="${escapeHtml(s)}">
          <span>⚡ ${escapeHtml(s)}</span>
        </div>
      `).join('');
      serviceSuggestions.style.display = 'block';
    });

    serviceInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (serviceSuggestions) serviceSuggestions.style.display = 'none';
      }, 200);
    });
  }

  if (serviceSuggestions) {
    serviceSuggestions.addEventListener('click', (e) => {
      const item = e.target.closest('.suggestion-item');
      if (item && item.dataset.val) {
        if (serviceInput) serviceInput.value = item.dataset.val;
        serviceSuggestions.style.display = 'none';
        if (locationInput) locationInput.focus();
      }
    });
  }

  if (locationInput) {
    locationInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearch();
      }
    });

    locationInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (!locationSuggestions || typeof NigeriaLocations === 'undefined') return;
      if (!q) {
        locationSuggestions.style.display = 'none';
        return;
      }

      const matches = NigeriaLocations.searchLocations(q, 5);
      if (matches.length === 0) {
        locationSuggestions.style.display = 'none';
        return;
      }

      locationSuggestions.innerHTML = matches.map(m => `
        <div class="suggestion-item" data-state="${escapeHtml(m.state)}" data-lga="${escapeHtml(m.lga || '')}" data-formatted="${escapeHtml(m.formatted)}">
          <span>📍 ${escapeHtml(m.formatted)}</span>
        </div>
      `).join('');
      locationSuggestions.style.display = 'block';
    });

    locationInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (locationSuggestions) locationSuggestions.style.display = 'none';
      }, 200);
    });
  }

  if (locationSuggestions) {
    locationSuggestions.addEventListener('click', (e) => {
      const item = e.target.closest('.suggestion-item');
      if (item && item.dataset.formatted) {
        if (locationInput) locationInput.value = item.dataset.formatted;
        selectedState = item.dataset.state || '';
        selectedLga = item.dataset.lga || '';
        locationSuggestions.style.display = 'none';
      }
    });
  }

  if (gpsBtn) {
    gpsBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!('geolocation' in navigator)) {
        alert('Geolocation is not supported by your device browser.');
        return;
      }

      gpsBtn.classList.add('is-loading');
      if (locationInput) {
        locationInput.value = '';
        locationInput.placeholder = '📍 Detecting precise location...';
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          gpsBtn.classList.remove('is-loading');
          gpsBtn.style.background = '#006B3F';
          gpsBtn.style.color = '#fff';

          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          userCoords = { lat, lng };

          let resolved = null;
          if (typeof NigeriaLocations !== 'undefined' && NigeriaLocations.reverseGeocode) {
            resolved = await NigeriaLocations.reverseGeocode(lat, lng);
          } else if (typeof NigeriaLocations !== 'undefined' && NigeriaLocations.findNearest) {
            resolved = NigeriaLocations.findNearest(lat, lng);
          }

          const detectedName = (resolved && resolved.formatted) ? resolved.formatted : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          if (locationInput) {
            locationInput.value = detectedName;
          }

          if (resolved) {
            selectedState = resolved.state || '';
            selectedLga = resolved.lga || '';
          }

          try {
            sessionStorage.setItem('lokator_temp_lat', lat.toString());
            sessionStorage.setItem('lokator_temp_lng', lng.toString());
            sessionStorage.setItem('lokator_temp_location_name', detectedName);
            if (resolved && resolved.state) sessionStorage.setItem('lokator_temp_state', resolved.state);
            if (resolved && resolved.lga) sessionStorage.setItem('lokator_temp_lga', resolved.lga);
          } catch (err) {}

          if (typeof LokatorTelemetry !== 'undefined' && LokatorTelemetry.trackEvent) {
            LokatorTelemetry.trackEvent('gps_location_detected', { lat, lng, locality: detectedName });
          }
        },
        (err) => {
          gpsBtn.classList.remove('is-loading');
          gpsBtn.style.background = 'rgba(220, 38, 38, 0.15)';
          gpsBtn.style.color = '#EF4444';
          if (locationInput) locationInput.placeholder = 'Your area, LGA or city (e.g. Surulere, Ikeja)...';
          
          let errMsg = 'Could not detect your GPS location.';
          if (err.code === 1) errMsg = 'Location access was denied. Please allow location permissions in your browser or select your city manually.';
          else if (err.code === 2) errMsg = 'Location unavailable. Please check your device location settings.';
          else if (err.code === 3) errMsg = 'Location request timed out.';
          alert(errMsg);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }
}
