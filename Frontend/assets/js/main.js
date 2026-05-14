(function () {
  'use strict';

  // =============================================
  // VERSION CONTROL - Change only here to refresh all caches
  // =============================================
  const APP_VERSION = '20260430';
  const USE_DYNAMIC_VERSION = true;
  
  function getCacheVersion() {
    return USE_DYNAMIC_VERSION ? Date.now() : APP_VERSION;
  }
  

  function addVersionParam(url) {
    const v = getCacheVersion();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${v}`;
  }

  window.APP_VERSION = APP_VERSION;
  window.getCacheVersion = getCacheVersion;
  window.addVersionParam = addVersionParam;

  const LS_KEY = 'site.data.v1';
  const IMAGE_FALLBACK = 'https://drive.google.com/uc?id=15lXuilvGEiot7c4qaUs_j6ZKrsYo0AVa';

  function disablePageTranslation() {
    if (document && document.documentElement) {
      document.documentElement.setAttribute('translate', 'no');
      document.documentElement.classList.add('notranslate');
    }

    if (document && document.head) {
      if (!document.querySelector('meta[name="google"]')) {
        const googleMeta = document.createElement('meta');
        googleMeta.name = 'google';
        googleMeta.content = 'notranslate';
        document.head.appendChild(googleMeta);
      }
      if (!document.querySelector('meta[name="yandex"]')) {
        const yandexMeta = document.createElement('meta');
        yandexMeta.name = 'yandex';
        yandexMeta.content = 'notranslate';
        document.head.appendChild(yandexMeta);
      }
      if (!document.querySelector('meta[http-equiv="Content-Language"]')) {
        const contentLangMeta = document.createElement('meta');
        contentLangMeta.httpEquiv = 'Content-Language';
        contentLangMeta.content = 'en';
        document.head.appendChild(contentLangMeta);
      }
    }
  }

  disablePageTranslation();

  async function readSiteData() {
    try {
      if (window.WorkerData && window.WorkerData.fetchWorkerJson) {
        const data = await window.WorkerData.fetchWorkerJson('site', null);
        if (data) {
          localStorage.setItem(LS_KEY, JSON.stringify(data));
          return data;
        }
      }

      const response = await fetch(`data/site.json?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(LS_KEY, JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.warn('Site data fetch failed:', error);
      console.error('[Worker bridge] readSiteData failed:', error);
    }


    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Local site data parse failed:', error);
      return null;
    }
  }

  function setFallback(img) {
    if (!img || img.dataset.fallbackApplied) return;

    img.dataset.fallbackApplied = '1';
    img.addEventListener('error', function () {
      if (!img.src.includes('placeholder.svg')) {
        img.src = IMAGE_FALLBACK;
      }
    }, { once: true });
  }

  function getArticleUrl(post) {
    return 'news-article.html?slug=' + encodeURIComponent(post.slug || '');
  }

  function getShareUrl(href) {
    const path = String(href || '').replace(/\.html(?=[?#]|$)/gi, '');
    return window.location.origin.replace(/\/$/, '') + '/' + path;
  }

  function getCurrentPageName() {
    const path = window.location.pathname || '';
    const fileName = path.split('/').pop() || '';
    return fileName.toLowerCase();
  }

  function isHomePage() {
    const page = getCurrentPageName();
    return page === '' || page === 'index.html' || page === 'index';
  }

  function isUpdatesPage() {
    const page = getCurrentPageName();
    return page === 'updates.html' || page === 'updates';
  }

  function getSpeechSharePayload(speech, href) {
    const url = getShareUrl(href);
    const brandName = document.getElementById('headerBrandName')?.textContent || 'Jeevajyothi Media';
    return {
      title: speech.title || 'Speech',
      text: `🛡️*${speech.title || 'Speech'}*\n📌*${brandName} - പ്രസംഗക്കുറിപ്പ്*\n📝*${speech.authorName || 'Unknown Speaker'}*\n🔗 ${url}`
    };
  }

  async function loadPosts() {
    const API_BASE = 'http://localhost:3000';
    try {
      const res = await fetch(`${API_BASE}/api/public/posts`);
      if (res.ok) {
        const json = await res.json();
        const posts = Array.isArray(json?.data) ? json.data : [];
        if (posts.length) return posts.map(normalizePost);
      }
    } catch (error) {
      console.warn('Public posts API load failed:', error);
    }

    // Fallback to existing site.json (kept for resilience)
    try {
      const site = await readSiteData();
      if (site && Array.isArray(site.posts) && site.posts.length) {
        return site.posts.map(normalizePost);
      }
    } catch (error) {
      console.warn('Fallback posts load failed:', error);
    }

    return [];
  }

  function normalizePost(post) {
    return {
      title: post.title,
      slug: post.slug,
      date: post.date,
      displayDate: post.displayDate || post.date,
      tags: post.tags || [],
      excerpt: post.excerptHtml || post.excerpt || '',
      excerptHtml: post.excerptHtml || post.excerpt || '',
      cover: post.cover || (post.coverImages && post.coverImages[0]) || '',
      featured: !!post.featured,
      contentHtml: post.contentHtml || '',
      coverImages: post.coverImages || [],
      type: post.type || post.contentType || 'news',
      language: post.language || 'English',
      author: post.author || ''
    };
  }

  function createPostCard(post) {
    const article = document.createElement('article');
    article.className = 'post-card';

    const href = getArticleUrl(post);
    const tagsHtml = (post.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join(' ');
    const typeDisplay = post.type ? post.type.charAt(0).toUpperCase() + post.type.slice(1) : 'News';
    const languageDisplay = post.language === 'Malayalam' ? 'Malayalam' : 'English';
    const typeColor = post.type && post.type.toLowerCase() === 'poem'
      ? '#8BC34A'
      : post.type && post.type.toLowerCase() === 'news'
        ? '#EF4444'
        : 'var(--accent-primary)';
    const coverHtml = post.cover
      ? `<img src="${post.cover}" alt="${escapeHtml(post.title || 'Post image')}" style="width:100%;object-fit:cover;">`
      : `<div style="width:100%;min-height:180px;background:linear-gradient(135deg, rgba(239,68,68,0.1), rgba(15,23,42,0.05));color:${typeColor};display:flex;align-items:center;justify-content:center;font-size:0.95rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:24px;text-align:center;">${escapeHtml(typeDisplay)}</div>`;
    const typeBadgeHtml = post.cover
      ? `<div style="margin:12px 12px 0;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;text-transform:uppercase;color:${typeColor};">${escapeHtml(typeDisplay)}</div>`
      : '';

    article.innerHTML = `
      ${coverHtml}
      ${typeBadgeHtml}
      <h3 style="margin:12px;font-size:18px;">${escapeHtml(post.title || 'Untitled')}</h3>
      <p class="meta" style="margin:0 12px;color:var(--muted);font-size:14px;">${escapeHtml(post.displayDate || '')} • ${escapeHtml(languageDisplay)}</p>
      <div style="margin:8px 12px 24px;display:flex;flex-wrap:wrap;gap:4px;">${tagsHtml}</div>
      <div class="card-footer" style="padding:12px;border-top:1px solid var(--border);">
        ${post.author ? `<span class="author-info" style="font-size:12px;color:lightyellow;"><strong>${escapeHtml(post.author)}</strong></span>` : '<span></span>'}
        <div style="display:flex;gap:8px;">
          <button class="btn" type="button" aria-label="Share post" style="cursor:pointer;padding:6px 12px;font-size:14px;">Share</button>
        </div>
      </div>
    `;

    article.style.cursor = 'pointer';
    article.addEventListener('click', function (event) {
      if (!event.target.closest('button')) {
        if (isHomePage()) {
          sessionStorage.setItem('homeScrollPosition', window.scrollY);
        } else if (isUpdatesPage()) {
          sessionStorage.setItem('updatesScrollPosition', window.scrollY);
        }
        window.location.href = href;
      }
    });

    const img = article.querySelector('img');
    setFallback(img);

    const shareBtn = article.querySelector('button');
    if (shareBtn) {
      shareBtn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        const url = getShareUrl(href);
        const brandName = document.getElementById('headerBrandName')
          ? document.getElementById('headerBrandName').textContent
          : 'Jeevajyothi Media';
        const rawType = post.type ? String(post.type).trim().toLowerCase() : 'news';
        const postType = rawType.charAt(0).toUpperCase() + rawType.slice(1);
        const titleLine = `🛡️ *${post.title || 'Untitled'}*`;
        const brandLine = `📌*${brandName} - ${postType}*`;
        const authorLine = postType !== 'News' && post.author ? `📝*${post.author}*` : '';
        const shareText = `${titleLine}\n${brandLine}${authorLine ? `\n${authorLine}` : ''}\n🔗 ${url}`;

        if (navigator.share) {
          navigator.share({ title: post.title, text: shareText }).catch((err) => {
            console.log('Share cancelled or failed:', err);
            fallbackCopy(shareText);
          });
        } else {
          fallbackCopy(shareText);
        }
      });
    }

    return article;
  }

  function createSpeechCardHome(speech) {
    const article = document.createElement('article');
    article.className = 'speech-card';
    article.style.cursor = 'pointer';

    const href = `speech-detail.html?id=${encodeURIComponent(speech.id || '')}`;
    const authorImage = speech.authorImage || speech.image || '';
    const dateStr = speech.date ? new Date(speech.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : '';
    const coverMarkup = authorImage
      ? `<img src="${authorImage}" alt="${escapeHtml(speech.authorName || 'Author')}" class="speech-author-thumb">`
      : '<span class="speech-cover-icon">📖 Speech</span>';

    article.innerHTML = `
      <div class="speech-cover" style="background:linear-gradient(135deg, var(--brand-1), var(--brand-2));color:white;font-size:24px;font-weight:600;">
        ${coverMarkup}
      </div>
      <p class="speech-card-kicker">${escapeHtml(speech.cardLabel) || 'പ്രസംഗക്കുറിപ്പ്'}</p>
      <h3 class="speech-card-title">${escapeHtml(speech.title) || 'Untitled Speech'}</h3>
      <p class="meta">${dateStr || ''}</p>
      <div class="speech-card-footer">
        <span class="speech-card-author"><strong>${escapeHtml(speech.authorName) || 'Unknown Speaker'}</strong></span>
        <button class="btn primary share-speech-btn speech-card-share" type="button" data-id="${speech.id || ''}">Share</button>
      </div>
    `;

    article.addEventListener('click', function (event) {
      if (!event.target.classList.contains('share-speech-btn')) {
        window.location.href = href;
      }
    });

    const shareBtn = article.querySelector('.share-speech-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        const payload = getSpeechSharePayload(speech, href);
        if (navigator.share) {
          navigator.share(payload).catch(() => {
            fallbackCopy(payload.text);
          });
        } else {
          fallbackCopy(payload.text);
        }
      });
    }

    return article;
  }

  function renderAnnouncementBar(speeches, posts) {
    const bar = document.querySelector('.announcement-bar');
    if (!bar) return;

    const track = bar.querySelector('.announcement-track');
    if (!track) return;

    const sortByDateDesc = function (items, key) {
      return (items || []).slice().sort(function (a, b) {
        const aDate = new Date(a && a[key] ? a[key] : 0).getTime();
        const bDate = new Date(b && b[key] ? b[key] : 0).getTime();
        return bDate - aDate;
      });
    };

    const latestSpeeches = sortByDateDesc(speeches, 'date').slice(0, 3).map(function (speech) {
      return {
        href: 'speech-detail.html?id=' + encodeURIComponent(speech.id || ''),
        text: speech.authorName ? `${speech.title} (${speech.authorName})` : speech.title
      };
    });

    const latestPosts = (posts || []).slice(-3).reverse().map(function (post) {
      return {
        href: getArticleUrl(post),
        text: post.author ? `${post.title} (${post.author})` : post.title
      };
    });

    const chunks = [];
    if (latestSpeeches.length) {
      chunks.push('<span class="announcement-section-label">LATEST SPEECHES</span>');
      latestSpeeches.forEach(function (item) {
        chunks.push(`<a class="announcement-item" href="${item.href}">${escapeHtml(item.text)}</a>`);
      });
    }
    if (latestPosts.length) {
      chunks.push('<span class="announcement-section-label">LATEST UPDATES</span>');
      latestPosts.forEach(function (item) {
        chunks.push(`<a class="announcement-item" href="${item.href}">${escapeHtml(item.text)}</a>`);
      });
    }
    if (!chunks.length) {
      track.innerHTML = '';
      bar.classList.remove('announcement-ready');
      return;
    }

    const separator = '<span class="separator">•</span>';
    const html = chunks.join(separator);
    track.innerHTML = html + separator + html;
    bar.classList.add('announcement-ready');
  }

  function calculateAge(dob, dod) { // kept for potential reuse
    const birth = dob ? new Date(dob) : null;
    const death = dod ? new Date(dod) : null;
    if (!birth || !death || Number.isNaN(birth.getTime()) || Number.isNaN(death.getTime())) return '';

    let age = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      age -= 1;
    }

    return age;
  }

  function uniqueTags(posts) {
    return Array.from(new Set(posts.flatMap(post => post.tags || []))).sort();
  }

  async function renderBlog() {
    const grid = document.getElementById('postGrid');
    const empty = document.getElementById('emptyState');
    const search = document.getElementById('search');
    const tagFilter = document.getElementById('tagFilter');
    const typeFilter = document.getElementById('typeFilter');
    const languageFilter = document.getElementById('languageFilter');
    const showMoreBtn = document.getElementById('showMoreNews');

    if (!grid) return;

    try {
      const posts = await loadPosts();
      if (!posts.length) {
        grid.innerHTML = '<div style="text-align:center;padding:20px;color:#e44;">No posts available.</div>';
        if (empty) empty.hidden = false;
        return;
      }

      if (tagFilter) {
        tagFilter.innerHTML = '<option value="">All Categories</option>';
        uniqueTags(posts).forEach(tag => {
          const option = document.createElement('option');
          option.value = tag;
          option.textContent = tag;
          tagFilter.appendChild(option);
        });
      }

      if (typeFilter) {
        const types = Array.from(new Set(posts.map(post => post.type || 'news'))).sort();
        typeFilter.innerHTML = '<option value="">All types</option>';
        types.forEach(type => {
          const option = document.createElement('option');
          option.value = type;
          option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
          typeFilter.appendChild(option);
        });
      }

      if (languageFilter) {
        const languages = Array.from(new Set(posts.map(post => post.language || 'English'))).sort();
        languageFilter.innerHTML = '<option value="">All languages</option>';
        languages.forEach(language => {
          const option = document.createElement('option');
          option.value = language;
          option.textContent = language;
          languageFilter.appendChild(option);
        });
      }

      let page = 1;
      const pageSize = showMoreBtn ? 9 : Number.MAX_SAFE_INTEGER;

      function applyFilters(resetPage) {
        if (resetPage) page = 1;

        const query = ((search && search.value) || '').toLowerCase();
        const tag = tagFilter ? tagFilter.value : '';
        const type = typeFilter ? typeFilter.value : '';
        const language = languageFilter ? languageFilter.value : '';

        const filtered = posts.filter(post => {
          const inText = [post.title, post.excerpt, ...(post.tags || [])].join(' ').toLowerCase().includes(query);
          const inTag = !tag || (post.tags || []).includes(tag);
          const inType = !type || (post.type || 'news') === type;
          const inLanguage = !language || (post.language || 'English') === language;
          return inText && inTag && inType && inLanguage;
        });

        grid.innerHTML = '';
        filtered.slice(0, page * pageSize).forEach(post => grid.appendChild(createPostCard(post)));

        if (empty) empty.hidden = filtered.length > 0;
        if (showMoreBtn) {
          showMoreBtn.hidden = page * pageSize >= filtered.length;
          showMoreBtn.onclick = function () {
            page += 1;
            applyFilters(false);
          };
        }
      }

      search && search.addEventListener('input', function () { applyFilters(true); });
      tagFilter && tagFilter.addEventListener('change', function () { applyFilters(true); });
      typeFilter && typeFilter.addEventListener('change', function () { applyFilters(true); });
      languageFilter && languageFilter.addEventListener('change', function () { applyFilters(true); });

      applyFilters(true);
    } catch (error) {
      console.error('Failed to render blog:', error);
      grid.innerHTML = '<div style="text-align:center;padding:20px;color:#e44;">Failed to load news. Please try again.</div>';
      if (empty) empty.hidden = true;
    }
  }

  async function renderFeatured() {
    const container = document.getElementById('featured-list');
    if (!container) return;

    const posts = await loadPosts();
    const featured = posts.filter(post => post.featured).slice(0, 3);

    container.innerHTML = '';
    featured.forEach(post => container.appendChild(createPostCard(post)));
  }

  async function renderHomeNews() {
    const container = document.getElementById('home-news');
    if (!container) return;

    try {
      const posts = await loadPosts();
      const items = posts.slice(-3).reverse();

      container.innerHTML = '';
      if (!items.length) {
        container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px;">No news available yet.</p>';
        return;
      }

      items.forEach(post => container.appendChild(createPostCard(post)));
    } catch (error) {
      console.error('Error rendering home news:', error);
      container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px;">Error loading news. Please try again later.</p>';
    }
  }

  async function updateBrandName() {
    const site = await readSiteData();
    if (!site || !site.other || !site.other.brandName) return;

    const brandName = site.other.brandName;
    ['headerBrandName', 'footerBrandName', 'logoBrandName', 'aboutBrandName', 'teamBrandName', 'logoDetailsBrandName'].forEach(function (id) {
      const element = document.getElementById(id);
      if (element) element.textContent = brandName;
    });

    document.querySelectorAll('.brand span').forEach(function (element) {
      if (!element.id || !element.id.includes('BrandName')) {
        element.textContent = brandName;
      }
    });

    if (document.title.includes('Jeevajyothi Media')) {
      document.title = document.title.replace(/Jeevajyothi Media/gi, brandName);
    }
  }

  async function updateSocialLinks() {
    const site = await readSiteData();
    if (!site || !site.other) return;

    [
      { id: 'footerFacebook', key: 'facebookLink' },
      { id: 'footerInstagram', key: 'instagramLink' },
      { id: 'footerYouTube', key: 'youtubeLink' }
    ].forEach(function (entry) {
      const element = document.getElementById(entry.id);
      if (element && site.other[entry.key]) {
        element.href = site.other[entry.key];
      }
    });
  }

  async function updateFooterLinks() {
    const site = await readSiteData();
    const yearEl = document.getElementById('year');
    const footerBrandNameEl = document.getElementById('footerBrandName');
    const footerTextEl = document.getElementById('footerText');

    if (yearEl) yearEl.textContent = new Date().getFullYear();
    if (site && site.other && footerBrandNameEl && site.other.brandName) {
      footerBrandNameEl.textContent = site.other.brandName;
    }
    if (site && site.other && footerTextEl && site.other.footerText) {
      footerTextEl.textContent = site.other.footerText;
    }
  }

  async function updateOGImage() {
    try {
      if (window.WorkerData && window.WorkerData.fetchWorkerJson) {
        const site = await window.WorkerData.fetchWorkerJson('site', null);
        if (site && site.ogImage) {
          const ogImageMeta = document.querySelector('meta[property="og:image"]');
          if (ogImageMeta) ogImageMeta.setAttribute('content', site.ogImage);
        }
        return;
      }

      const response = await fetch(`data/site.json?t=${Date.now()}`);
      if (response.ok) {
        const site = await response.json();
        if (site.ogImage) {
          const ogImageMeta = document.querySelector('meta[property="og:image"]');
          if (ogImageMeta) ogImageMeta.setAttribute('content', site.ogImage);
        }
      }
    } catch (error) {
      console.warn('OG image update failed:', error);
    }
  }

  async function updateFavicon() {
    try {
      if (window.WorkerData && window.WorkerData.fetchWorkerJson) {
        const data = await window.WorkerData.fetchWorkerJson('logo', null);
        if (data && data.image) {
          const favicon = document.querySelector('link[rel="icon"]');
          if (favicon) favicon.href = data.image;
        }
        return;
      }


      const data = await response.json();
      if (data.image) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) favicon.href = data.image;
      }
    } catch (error) {
      console.warn('Favicon update failed:', error);
    }
  }

  async function loadAds() {
    const site = await readSiteData();
    if (!site || !site.ads) return;

    [
      ['leftAdLink', 'leftAdImage', 'leftAdText', site.ads.left],
      ['rightAdLink', 'rightAdImage', 'rightAdText', site.ads.right],
      ['leftAdLink2', 'leftAdImage2', 'leftAdText2', site.ads.left],
      ['rightAdLink2', 'rightAdImage2', 'rightAdText2', site.ads.right],
      ['mobileLeftAdLink', 'mobileLeftAdImage', 'mobileLeftAdText', site.ads.left],
      ['mobileRightAdLink', 'mobileRightAdImage', 'mobileRightAdText', site.ads.right]
    ].forEach(function (entry) {
      const linkEl = document.getElementById(entry[0]);
      const imageEl = document.getElementById(entry[1]);
      const textEl = document.getElementById(entry[2]);
      const ad = entry[3];

      if (linkEl && ad && ad.link) {
        linkEl.href = ad.link;
        linkEl.target = '_blank';
      }
      if (imageEl && ad && ad.image) {
        imageEl.src = `${ad.image}?v=${Date.now()}`;
        imageEl.style.display = 'block';
        if (textEl) textEl.style.display = 'none';
      }
    });
  }

  async function preloadImages() {
    const imageUrls = new Set();

    try {
      const [posts, team, logo, videos, site] = await Promise.all([
        fetch(`https://api.jeevajyothimedia.com/api/public/posts`).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
        fetch(`https://api.jeevajyothimedia.com/api/public/board-members`).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
        fetch(`https://api.jeevajyothimedia.com/api/site`).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
        fetch(`https://api.jeevajyothimedia.com/api/public/videos`).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
        fetch(`https://api.jeevajyothimedia.com/api/site`).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
      ]);

      posts.forEach(function (post) {
        if (post.cover) imageUrls.add(post.cover);
        if (Array.isArray(post.coverImages)) post.coverImages.forEach(function (image) { imageUrls.add(image); });
      });
      team.forEach(function (member) {
        if (member.image) imageUrls.add(member.image);
      });
      videos.forEach(function (video) {
        if (video.image) imageUrls.add(video.image);
      });
      if (logo.image) imageUrls.add(logo.image);
      if (site.ogImage) imageUrls.add(site.ogImage);

      await Promise.all(Array.from(imageUrls).map(function (url) {
        return new Promise(function (resolve) {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = url;
        });
      }));
    } catch (error) {
      console.warn('Image preload failed:', error);
    }
  }

  function fallbackCopy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
      return;
    }

    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Use ResizeObserver so --header-offset always matches actual header height,
    // even after nav items load, fonts render, or screen rotates.
    const header = document.querySelector('.site-header');
    if (header) {
      const ro = new ResizeObserver(function() {
        const h = header.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--header-offset', h + 'px');
      });
      ro.observe(header);
    }
    document.querySelectorAll('img').forEach(setFallback);

    setTimeout(async function () {
      await readSiteData();
      await Promise.all([
        updateBrandName(),
        updateSocialLinks(),
        updateFooterLinks(),
        updateOGImage(),
        updateFavicon(),
        loadAds(),
        preloadImages()
      ]);
    }, 100);

    setTimeout(async function () {
      const API_BASE = 'http://localhost:3000';
      try {
        const [speechesRes, postsRes] = await Promise.all([
          fetch(`${API_BASE}/api/public/speeches`),
          fetch(`${API_BASE}/api/public/posts`)
        ]);
        const speechesJson = speechesRes.ok ? await speechesRes.json() : { data: [] };
        const postsJson = postsRes.ok ? await postsRes.json() : { data: [] };

        const speeches = Array.isArray(speechesJson?.data) ? speechesJson.data : [];
        const postsRaw = Array.isArray(postsJson?.data) ? postsJson.data : [];

        renderAnnouncementBar(speeches, postsRaw.map(normalizePost));
      } catch (error) {
        console.warn('Announcement bar load failed:', error);
      }
    }, 120);

    const homeNewsContainer = document.getElementById('home-news');
    if (homeNewsContainer) {
      setTimeout(function () {
        renderHomeNews().catch(function (error) {
          console.error('Home news render failed:', error);
        });
      }, 250);
    }
  });

  window.loadPosts = loadPosts;
  window.readSiteData = readSiteData;
  window.getArticleUrl = getArticleUrl;
  window.createPostCard = createPostCard;
  window.createSpeechCardHome = createSpeechCardHome;
  window.renderBlog = renderBlog;
  window.renderFeatured = renderFeatured;
  window.renderHomeNews = renderHomeNews;
  window.renderHomeSpeeches = renderHomeSpeeches;
  window.renderAnnouncementBar = renderAnnouncementBar;
  window.setFallback = setFallback;
  window.updateBrandName = updateBrandName;
  window.updateSocialLinks = updateSocialLinks;
  window.updateFooterLinks = updateFooterLinks;
  window.updateOGImage = updateOGImage;
  window.updateFavicon = updateFavicon;
})();

// =============================================
// VOICE HUB HOME PAGE FUNCTIONS
// =============================================

// Load recent voices for home page
async function loadHomeVoices() {
  const container = document.getElementById('home-voices-grid');
  if (!container) return;

  try {
    let voices = [];
    
    try {
      const apiResponse = await fetch('/api/public/voices');
      const apiData = await apiResponse.json();
      if (apiResponse.ok && apiData.success && Array.isArray(apiData.data)) {
        voices = apiData.data;
      }
    } catch (apiError) {
      console.warn('Public voices API unavailable, using local JSON fallback.', apiError);
    }

    if (!voices.length) {
      try {
        const response = await fetch('data/voice-hub.json');
        if (response.ok) {
          voices = await response.json();
        }
      } catch (e) {
        console.warn('No local voice-hub.json found');
      }
    }

    // ORDER BY ID IN DESCENDING ORDER (highest ID first), then take first 3
    const recentVoices = voices
      .sort((a, b) => b.id - a.id)
      .slice(0, 3);

    container.innerHTML = '';
    
    if (recentVoices.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No voices available yet. <a href="voice-hub-submit.html">Share your voice →</a></p>';
      return;
    }

    recentVoices.forEach(voice => {
      const card = createHomeVoiceCard(voice);
      container.appendChild(card);
    });

  } catch (error) {
    console.error('Error loading home voices:', error);
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Error loading voices. Please try again later.</p>';
  }
}

// Create voice card for home page
function createHomeVoiceCard(voice) {
  const article = document.createElement('article');
  article.className = 'speech-card';
  article.style.cursor = 'pointer';

  // Internal navigation keeps .html
  const href = `voice-article.html?id=${encodeURIComponent(voice.id || '')}`;
  const authorImage = voice.authorImage || voice.image || '';
  const dateStr = voice.date ? new Date(voice.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '';
  
  const coverMarkup = authorImage
    ? `<img src="${authorImage}" alt="${voice.authorName || 'Author'}" class="speech-author-thumb" loading="lazy">`
    : '<span class="speech-cover-icon">🎤 Voice</span>';

  article.innerHTML = `
    <div class="speech-cover" style="background:linear-gradient(135deg, #2c3e66, #1e2a4a);color:white;display:flex;align-items:center;justify-content:center;">
      ${coverMarkup}
    </div>
    <p class="speech-card-kicker">${escapeHtml(voice.cardLabel || voice.type || 'Voice')}</p>
    <h3 class="speech-card-title">${escapeHtml(voice.title) || 'Untitled Voice'}</h3>
    <p class="meta">${dateStr || ''}</p>
    <div class="speech-card-footer">
      <span class="speech-card-author"><strong>${escapeHtml(voice.authorName) || 'Anonymous'}</strong></span>
      <button class="btn share-voice-btn" type="button" data-id="${voice.id || ''}">Share</button>
    </div>
  `;

  // Card click navigation (keeps .html)
  article.addEventListener('click', function(event) {
    if (!event.target.classList.contains('share-voice-btn')) {
      window.location.href = href;
    }
  });

  // Share button handler - NO .html in share links
  const shareBtn = article.querySelector('.share-voice-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      const origin = window.location.origin;
      // REMOVED .html from share URLs for clean sharing
      const articleUrl = `${origin}/voice-article?id=${voice.id}`;
      const submitUrl = `${origin}/voice-hub-submit`;
      
      const fullText = `*🛑${voice.title || 'Voice'}*
📝*${voice.authorName || 'Unknown'}*
🔗 ${articleUrl}

*നിങ്ങളുടെ ചിന്തകളും ലോകമറിയട്ടെ! ✍️*

*ജീവജ്യോതി മീഡിയയിലൂടെ നിങ്ങളുടെ ലേഖനങ്ങളും സന്ദേശങ്ങളും സമൂഹത്തിലേക്ക് പങ്കുവെക്കാം.*

*താഴെ കാണുന്ന ലിങ്ക് വഴി നിങ്ങളുടെ സന്ദേശങ്ങൾ ഞങ്ങൾക്ക് അയച്ചുതരൂ:*
🔗 ${submitUrl}

*നമുക്ക് ഒന്നിച്ച് നല്ലൊരു നാളെയെ വാർത്തെടുക്കാം! 🤝*
*🛑Jeevajyothi Media🛑*`;
      
      if (navigator.share) {
        navigator.share({ title: voice.title, text: fullText }).catch(() => {
          fallbackCopy(fullText);
        });
      } else {
        fallbackCopy(fullText);
      }
    });
  }

  return article;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('home-voices-grid')) {
      loadHomeVoices();
    }
  });
} else {
  if (document.getElementById('home-voices-grid')) {
    loadHomeVoices();
  }
}
// =============================================
// PROGRAM GUIDE HOME PAGE FUNCTIONS
// Add this to your main.js file
// =============================================

// Load recent program guides for home page
async function loadHomeProgramGuidesMainJs() {
  const container = document.getElementById('home-program-guides');
  if (!container) return;

  try {
    let programs = [];
    
    try {
      const response = await fetch('data/program-guide.json?v=' + Date.now());
      if (response.ok) {
        const data = await response.json();
        programs = Array.isArray(data.programs) ? data.programs : [];
      }
    } catch (e) {
      console.warn('No local program-guide.json found', e);
    }

    if (!programs.length) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No programs available yet. <a href="program-guide.html">Explore programs →</a></p>';
      return;
    }

    // Sort by ID in descending order (highest ID first - newest programs)
    programs.sort((a, b) => {
      const idA = a.id !== undefined ? a.id : 0;
      const idB = b.id !== undefined ? b.id : 0;
      return idB - idA;
    });

    // Take only first 3 programs
    const recentPrograms = programs.slice(0, 3);

    container.innerHTML = '';
    
    recentPrograms.forEach(program => {
const card = createHomeProgramCardMainJs(program);
      container.appendChild(card);
    });

  } catch (error) {
    console.error('Error loading home program guides:', error);
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Error loading programs. Please try again later.</p>';
  }
}

// Helper function to convert Google Drive link to direct image URL
function getGoogleDriveImageUrl(url) {
  if (!url) return '';
  
  if (url.includes('drive.google.com')) {
    let fileId = null;
    
    let match = url.match(/\/file\/d\/([^\/]+)/);
    if (match) fileId = match[1];
    
    if (!fileId) {
      match = url.match(/[?&]id=([^&]+)/);
      if (match) fileId = match[1];
    }
    
    if (!fileId) {
      match = url.match(/id=([^&]+)/);
      if (match) fileId = match[1];
    }
    
    if (!fileId) {
      match = url.match(/thumbnail\?id=([^&]+)/);
      if (match) fileId = match[1];
    }
    
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`;
    }
  }
  
  return url;
}

// Create program card for home page (compact version)
function createHomeProgramCardMainJs(program) {
  const article = document.createElement('article');
  article.className = 'program-card';
  article.style.cursor = 'pointer';

  const href = `program-guide-detail.html?slug=${encodeURIComponent(program.slug || '')}`;
  
  // Get Google Drive image if available
  let imgSrc = '';
  if (program.image) {
    imgSrc = getGoogleDriveImageUrl(program.image);
  }

  const coverMarkup = imgSrc
    ? `<img src="${imgSrc}" alt="${escapeHtml(program.title)}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">`
    : `<div class="no-image" style="display:flex; align-items:center; justify-content:center; height:100%; background:linear-gradient(135deg, #2c3e66, #1e2a4a); color:white;">📖</div>`;

  article.innerHTML = `
    <div class="program-card-cover" style="height:140px; background:#1f2937; display:flex; align-items:center; justify-content:center; overflow:hidden;">
      ${coverMarkup}
    </div>
    <div class="program-card-body" style="padding:14px;">
      <h3 class="program-card-title" style="margin:0 0 6px 0; font-size:0.95rem; font-weight:600; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(program.title)}</h3>
      <p class="program-card-summary" style="margin:0 0 10px 0; font-size:0.75rem; line-height:1.5; color:rgba(255,255,255,0.7); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(program.summary)}</p>
      <div class="program-card-footer" style="display:flex; align-items:center; justify-content:flex-end; margin-top:auto;">
        <button class="program-share-btn" type="button" data-id="${program.id || ''}" data-slug="${program.slug || ''}" data-title="${escapeHtml(program.title || '')}" style="background:#25D366; color:white; border:none; padding:4px 10px; font-size:0.65rem; font-weight:600; border-radius:20px; cursor:pointer;">📤 Share</button>
      </div>
    </div>
  `;

  // Card click navigation
  article.addEventListener('click', function(event) {
    if (!event.target.classList.contains('program-share-btn')) {
      window.location.href = href;
    }
  });

  // Share button handler
  const shareBtn = article.querySelector('.program-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      const origin = window.location.origin;
      const programTitle = shareBtn.getAttribute('data-title') || program.title;
      const programSlug = shareBtn.getAttribute('data-slug') || program.slug;
      const articleUrl = `${origin}/program-guide-detail?slug=${encodeURIComponent(programSlug)}`;
      const programGuideUrl = `${origin}/program-guide`;
      
      const text = `*യൂത്ത് മീറ്റിംഗുകൾക്കായി തയ്യാറെടുക്കാം! ✨*

*നിങ്ങളുടെ മീറ്റിംഗുകളിൽ അവതരിപ്പിക്കാൻ വ്യത്യസ്തമായ ഒരു പ്രോഗ്രാം തിരയുകയാണോ? ജീവജ്യോതി മീഡിയ ഒരുക്കുന്ന ഈ പുതിയ പ്രോഗ്രാം പരിചയപ്പെടൂ:*

*📌 Program: ${title}*

*🔗 Link:* ${fullLink}

*യൂത്ത് മീറ്റിംഗുകൾ കൂടുതൽ ആകർഷകമാക്കാൻ ആവശ്യമായ പുതിയ ഐഡിയകളും പ്രോഗ്രാമുകളും ഈ പേജിൽ ലഭ്യമാണ്.*

*നമുക്ക് ഒന്നിച്ച് നല്ലൊരു നാളെയെ വാർത്തെടുക്കാം! 🤝*
*🛑Jeevajyothi Media🛑*`;

      
      if (navigator.share) {
        navigator.share({ title: programTitle, text: fullText }).catch(() => {
          fallbackCopy(fullText);
        });
      } else {
        fallbackCopy(fullText);
      }
    });
  }

  return article;
}

// Make functions available globally
window.loadHomeProgramGuidesMainJs = loadHomeProgramGuidesMainJs;
window.getGoogleDriveImageUrlMainJs = getGoogleDriveImageUrl;
window.createHomeProgramCardMainJs = createHomeProgramCardMainJs;
