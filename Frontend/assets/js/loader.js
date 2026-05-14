// Loader utility functions
(function() {
  let globalLoader = null;
  let shownAt = 0;
  let hideTimer = null;
  let holdCount = 0;
  let pageReady = false;
  const MIN_VISIBILITY_MS = 220;
  const FADE_OUT_MS = 220;
  const LOGO_URL = 'https://drive.google.com/thumbnail?id=1jaEnOnm2O0w6882JCtHgYNJQ0HcXwzB7&sz=w500';

  function createLoader() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    return loader;
  }

  function buildHeaderShell() {
    return `
      <div class="skeleton skeleton-top-strip"></div>
      <div class="skeleton-header-shell">
        <div class="skeleton-brand-shell">
          <div class="skeleton skeleton-brand-logo"></div>
          <div class="skeleton-brand-lines">
            <div class="skeleton skeleton-brand-name"></div>
            <div class="skeleton skeleton-brand-tagline"></div>
          </div>
        </div>
        <div class="skeleton-nav-shell">
          <div class="skeleton skeleton-nav-pill"></div>
          <div class="skeleton skeleton-nav-pill"></div>
          <div class="skeleton skeleton-nav-pill"></div>
          <div class="skeleton skeleton-nav-pill"></div>
        </div>
      </div>
    `;
  }

  function buildFooterShell() {
    return `
      <div class="skeleton-footer-shell">
        <div class="skeleton skeleton-footer-copy"></div>
        <div class="skeleton-footer-social">
          <div class="skeleton skeleton-footer-icon"></div>
          <div class="skeleton skeleton-footer-icon"></div>
          <div class="skeleton skeleton-footer-icon"></div>
        </div>
      </div>
    `;
  }

  function buildPageHeroShell(includeKicker) {
    return `
      <div class="skeleton-page-hero">
        ${includeKicker ? '<div class="skeleton skeleton-page-kicker"></div>' : ''}
        <div class="skeleton skeleton-page-title"></div>
        <div class="skeleton skeleton-page-text"></div>
        <div class="skeleton skeleton-page-text short"></div>
      </div>
    `;
  }

  function buildCardGrid(cardCount, cardClass) {
    let cards = '';
    for (let i = 0; i < cardCount; i += 1) {
      cards += `
        <div class="skeleton-site-card ${cardClass || ''}">
          <div class="skeleton skeleton-image"></div>
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      `;
    }
    return cards;
  }

  function buildHomeSkeleton() {
    return `
      <div class="skeleton-main-shell">
        <section class="skeleton-home-hero">
          <div class="skeleton skeleton-home-welcome"></div>
          <div class="skeleton skeleton-home-brand-line brand-line-one"></div>
          <div class="skeleton skeleton-home-brand-line brand-line-two"></div>
          <div class="skeleton skeleton-home-subtitle"></div>
          <div class="skeleton skeleton-home-text"></div>
          <div class="skeleton skeleton-home-text short"></div>
          <div class="skeleton-home-actions">
            <div class="skeleton skeleton-home-btn"></div>
            <div class="skeleton skeleton-home-btn"></div>
          </div>
        </section>
        <section class="skeleton-section-shell">
          <div class="skeleton skeleton-section-heading"></div>
          <div class="skeleton-notice-shell">
            <div class="skeleton skeleton-notice-card"></div>
            <div class="skeleton skeleton-notice-card"></div>
            <div class="skeleton skeleton-notice-card"></div>
            <div class="skeleton skeleton-notice-card"></div>
          </div>
        </section>
        <section class="skeleton-section-shell">
          <div class="skeleton skeleton-section-heading"></div>
          <div class="skeleton-site-grid">
            ${buildCardGrid(3)}
          </div>
        </section>
        <section class="skeleton-section-shell">
          <div class="skeleton skeleton-section-heading"></div>
          <div class="skeleton-site-grid">
            ${buildCardGrid(3, 'speech')}
          </div>
        </section>
        <section class="skeleton-section-shell">
          <div class="skeleton skeleton-section-heading"></div>
          <div class="skeleton-about-shell">
            <div class="skeleton skeleton-about-line"></div>
            <div class="skeleton skeleton-about-line"></div>
            <div class="skeleton skeleton-about-line"></div>
            <div class="skeleton skeleton-about-line short"></div>
          </div>
        </section>
      </div>
    `;
  }

  function buildListingSkeleton(withFilters, cardClass, count) {
    return `
      <div class="skeleton-main-shell">
        ${buildPageHeroShell(false)}
        <section class="skeleton-section-shell">
          ${withFilters ? `
            <div class="skeleton-filter-shell">
              <div class="skeleton skeleton-filter-pill wide"></div>
              <div class="skeleton skeleton-filter-pill"></div>
              <div class="skeleton skeleton-filter-pill"></div>
              <div class="skeleton skeleton-filter-pill"></div>
            </div>
          ` : ''}
          <div class="skeleton-site-grid">
            ${buildCardGrid(count || 6, cardClass)}
          </div>
        </section>
      </div>
    `;
  }

  function buildQuotesSkeleton() {
    return `
      <div class="skeleton-main-shell">
        <section class="skeleton-simple-section">
          <div class="skeleton skeleton-section-heading centered"></div>
          <div class="skeleton-quote-grid">
            <div class="skeleton-site-card quote">
              <div class="skeleton skeleton-quote-title"></div>
              <div class="skeleton skeleton-quote-line"></div>
              <div class="skeleton skeleton-quote-line"></div>
              <div class="skeleton skeleton-quote-line short"></div>
            </div>
            <div class="skeleton-site-card quote">
              <div class="skeleton skeleton-quote-title"></div>
              <div class="skeleton skeleton-quote-line"></div>
              <div class="skeleton skeleton-quote-line"></div>
              <div class="skeleton skeleton-quote-line short"></div>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function buildBoardMembersSkeleton() {
    return `
      <div class="skeleton-main-shell">
        ${buildPageHeroShell(true)}
        <section class="skeleton-team-section">
          <div class="skeleton-team-head">
            <div class="skeleton skeleton-team-label"></div>
            <div class="skeleton skeleton-team-title"></div>
            <div class="skeleton skeleton-team-text"></div>
          </div>
          <div class="skeleton-team-grid">
            ${buildCardGrid(6, 'team')}
          </div>
        </section>
        <section class="skeleton-team-section">
          <div class="skeleton-team-head">
            <div class="skeleton skeleton-team-label"></div>
            <div class="skeleton skeleton-team-title"></div>
            <div class="skeleton skeleton-team-text"></div>
          </div>
          <div class="skeleton-team-grid">
            ${buildCardGrid(4, 'team')}
          </div>
        </section>
        <section class="skeleton-team-section">
          <div class="skeleton-team-head">
            <div class="skeleton skeleton-team-label"></div>
            <div class="skeleton skeleton-team-title"></div>
            <div class="skeleton skeleton-team-text"></div>
          </div>
          <div class="skeleton-team-grid">
            ${buildCardGrid(4, 'team')}
          </div>
        </section>
      </div>
    `;
  }

  function buildContactSkeleton() {
    return `
      <div class="skeleton-main-shell">
        <section class="skeleton-two-col-shell">
          <div class="skeleton-site-card contact-info">
            <div class="skeleton skeleton-card-heading"></div>
            <div class="skeleton skeleton-contact-line"></div>
            <div class="skeleton skeleton-contact-line"></div>
            <div class="skeleton skeleton-contact-line long"></div>
            <div class="skeleton-contact-icons">
              <div class="skeleton skeleton-footer-icon"></div>
              <div class="skeleton skeleton-footer-icon"></div>
              <div class="skeleton skeleton-footer-icon"></div>
              <div class="skeleton skeleton-footer-icon"></div>
            </div>
          </div>
          <div class="skeleton-site-card contact-form">
            <div class="skeleton skeleton-card-heading"></div>
            <div class="skeleton skeleton-field"></div>
            <div class="skeleton skeleton-field"></div>
            <div class="skeleton skeleton-field"></div>
            <div class="skeleton skeleton-field"></div>
            <div class="skeleton skeleton-field textarea"></div>
            <div class="skeleton skeleton-submit-btn"></div>
          </div>
        </section>
      </div>
    `;
  }

  function buildLogoSkeleton() {
    return `
      <div class="skeleton-main-shell">
        <section class="skeleton-logo-shell">
          <div class="skeleton skeleton-section-heading centered wide"></div>
          <div class="skeleton-two-col-shell logo">
            <div class="skeleton-site-card logo-media">
              <div class="skeleton skeleton-logo-image"></div>
            </div>
            <div class="skeleton-site-card logo-copy">
              <div class="skeleton skeleton-about-line"></div>
              <div class="skeleton skeleton-about-line"></div>
              <div class="skeleton skeleton-about-line"></div>
              <div class="skeleton skeleton-about-line"></div>
              <div class="skeleton skeleton-about-line short"></div>
              <div class="skeleton skeleton-about-line"></div>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function buildVideoSkeleton() {
    return `
      <div class="skeleton-main-shell">
        <section class="skeleton-simple-section">
          <div class="skeleton skeleton-section-heading centered"></div>
          <div class="skeleton-video-cta">
            <div class="skeleton skeleton-video-btn"></div>
          </div>
          <div class="skeleton-site-grid">
            ${buildCardGrid(6, 'video')}
          </div>
        </section>
      </div>
    `;
  }

  function buildDetailSkeleton(kind) {
    const includeMedia = kind !== 'speech';
    return `
      <div class="skeleton-main-shell">
        ${buildPageHeroShell(false)}
        <section class="skeleton-detail-shell ${kind}">
          <div class="skeleton-detail-card">
            ${includeMedia ? '<div class="skeleton skeleton-detail-media"></div>' : ''}
            <div class="skeleton-detail-content-shell">
              <div class="skeleton skeleton-detail-line"></div>
              <div class="skeleton skeleton-detail-line"></div>
              <div class="skeleton skeleton-detail-line"></div>
              <div class="skeleton skeleton-detail-line"></div>
              <div class="skeleton skeleton-detail-line short"></div>
              <div class="skeleton skeleton-detail-line"></div>
            </div>
            <div class="skeleton-detail-actions">
              <div class="skeleton skeleton-action-btn"></div>
              <div class="skeleton skeleton-action-btn"></div>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function detectPageType() {
    const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const body = document.body;

    if (path === '' || path === 'index.html') return 'home';
    if (body && body.classList.contains('board-page')) return 'board-members';
    if (path === 'contact.html') return 'contact';
    if (path === 'logo.html') return 'logo';
    if (path === 'quotes.html') return 'quotes';
    if (path === 'videos.html') return 'videos';
    if (path === 'speeches.html') return 'speeches';
    if (path === 'updates.html' || path === 'about.html') return 'listing';
    if (path === 'news-article.html') return 'news-article';
    if (path === 'speech-detail.html') return 'speech-detail';
    return 'listing';
  }

  function buildPageSkeleton() {
    switch (detectPageType()) {
      case 'home':
        return buildHomeSkeleton();
      case 'board-members':
        return buildBoardMembersSkeleton();
      case 'contact':
        return buildContactSkeleton();
      case 'logo':
        return buildLogoSkeleton();
      case 'quotes':
        return buildQuotesSkeleton();
      case 'videos':
        return buildVideoSkeleton();
      case 'speeches':
        return buildListingSkeleton(false, 'speech', 6);
      case 'news-article':
        return buildDetailSkeleton('news');
      case 'speech-detail':
        return buildDetailSkeleton('speech');
      case 'listing':
      default:
        return buildListingSkeleton(true, '', 6);
    }
  }

  function buildSkeletonMarkup(message) {
    return `
      <div class="skeleton-site-shell skeleton-page-${detectPageType()}" aria-hidden="true">
        ${buildHeaderShell()}
        <div class="skeleton-loader-badge">
          <div class="skeleton-loader-logo-wrap">
            <span class="skeleton-loader-ring ring-one"></span>
            <span class="skeleton-loader-ring ring-two"></span>
            <span class="skeleton-loader-logo-frame">
              <img class="skeleton-loader-logo" src="${LOGO_URL}" alt="Jeevajyothi Media logo">
            </span>
          </div>
          <div class="skeleton-loader-copy">
            <div class="skeleton-loader-title">Jeevajyothi Media</div>
            <div class="skeleton-loader-message">${message}</div>
          </div>
        </div>
        ${buildPageSkeleton()}
        ${buildFooterShell()}
      </div>
      <div class="skeleton-loading-label">Please wait while the page loads</div>
    `;
  }

  function ensureLoader(message) {
    if (!document.body) return null;
    if (globalLoader) {
      const label = globalLoader.querySelector('.skeleton-loading-label');
      if (label) label.textContent = message;
      const messageNode = globalLoader.querySelector('.skeleton-loader-message');
      if (messageNode) messageNode.textContent = message;
      globalLoader.classList.remove('is-hiding');
      return globalLoader;
    }

    globalLoader = document.createElement('div');
    globalLoader.className = 'loading-overlay skeleton-loading-overlay';
    globalLoader.setAttribute('role', 'status');
    globalLoader.setAttribute('aria-live', 'polite');
    globalLoader.innerHTML = buildSkeletonMarkup(message);
    document.body.appendChild(globalLoader);
    document.documentElement.classList.add('loader-active');
    document.body.classList.add('loader-active');
    shownAt = Date.now();
    return globalLoader;
  }

  function showGlobalLoader(message = 'Loading...') {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    ensureLoader(message);
  }

  function finalizeHide() {
    if (!globalLoader) return;
    globalLoader.classList.add('is-hiding');
    const loaderToRemove = globalLoader;
    globalLoader = null;
    document.documentElement.classList.remove('loader-active');
    if (document.body) {
      document.body.classList.remove('loader-active');
    }
    window.setTimeout(() => {
      loaderToRemove.remove();
    }, FADE_OUT_MS);
  }

  function hideGlobalLoader() {
    if (!globalLoader || holdCount > 0) return;
    const remaining = Math.max(0, MIN_VISIBILITY_MS - (Date.now() - shownAt));
    if (hideTimer) {
      clearTimeout(hideTimer);
    }
    hideTimer = window.setTimeout(() => {
      hideTimer = null;
      finalizeHide();
    }, remaining);
  }

  function showButtonLoader(button, originalText) {
    if (!button) return;
    button.classList.add('loading');
    button.disabled = true;
    if (originalText) {
      button.dataset.originalText = originalText;
    }
  }

  function hideButtonLoader(button) {
    if (!button) return;
    button.classList.remove('loading');
    button.disabled = false;
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }

  function showSectionLoader(container, message = 'Loading...') {
    if (!container) return;
    container.innerHTML = `
      <div class="section-loading">
        <div class="loader"></div>
        <span>${message}</span>
      </div>
    `;
  }

  function fetchWithLoader(url, options = {}, showGlobal = false, message = 'Loading...') {
    if (showGlobal) {
      showGlobalLoader(message);
    }

    return fetch(url, options).finally(() => {
      if (showGlobal) {
        hideGlobalLoader();
      }
    });
  }

  function withButtonLoader(button, asyncFn, originalText) {
    return async function(...args) {
      showButtonLoader(button, originalText);
      try {
        return await asyncFn.apply(this, args);
      } finally {
        hideButtonLoader(button);
      }
    };
  }

  function shouldHandleLink(anchor) {
    if (!anchor || !anchor.href) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;
    if (anchor.getAttribute('href').startsWith('#')) return false;

    const currentUrl = new URL(window.location.href);
    const nextUrl = new URL(anchor.href, window.location.href);
    if (nextUrl.origin !== currentUrl.origin) return false;
    if (nextUrl.pathname === currentUrl.pathname && nextUrl.hash) return false;

    return true;
  }

  function bindNavigationLoader() {
    document.addEventListener('click', (event) => {
      const anchor = event.target.closest('a');
      if (!shouldHandleLink(anchor)) return;
      showGlobalLoader('Loading...');
    });
  }

  function requestLoaderHold() {
    holdCount += 1;
  }

  function releaseLoaderHold() {
    if (!holdCount) return;
    holdCount -= 1;
    if (holdCount === 0 && pageReady) {
      hideGlobalLoader();
    }
  }

  function initPageLoader() {
    showGlobalLoader('Loading...');

    if (document.readyState === 'complete') {
      pageReady = true;
      if (!holdCount) hideGlobalLoader();
    } else {
      window.addEventListener('load', () => {
        pageReady = true;
        if (!holdCount) hideGlobalLoader();
      }, { once: true });
      window.addEventListener('pageshow', () => {
        pageReady = true;
        if (!holdCount) hideGlobalLoader();
      }, { once: true });
    }
  }

  bindNavigationLoader();
  initPageLoader();

  window.LoaderUtils = {
    createLoader,
    showGlobalLoader,
    hideGlobalLoader,
    showButtonLoader,
    hideButtonLoader,
    showSectionLoader,
    fetchWithLoader,
    withButtonLoader,
    requestLoaderHold,
    releaseLoaderHold
  };
})();

