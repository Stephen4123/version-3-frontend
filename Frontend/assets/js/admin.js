(function () {
  const DEFAULT_ADMIN = { mobile: '8078864233', password: 'admin@123' }; // change as needed
  let siteData = {}; // Centralized state for the entire admin panel

  const API_BASE = '/api'; // Local backend API
  
  async function readSiteData(showLoader = false) {
    try {
      if (showLoader && window.LoaderUtils) {
        window.LoaderUtils.showGlobalLoader('Loading data...');
      }
      const response = await fetch(`${API_BASE}/site`);
      if (response.ok) {
        const data = await response.json();
        console.log('Data loaded from backend');
        return data;
      }
    } catch (error) {
      console.log('Backend not available:', error);
    } finally {
      if (showLoader && window.LoaderUtils) {
        window.LoaderUtils.hideGlobalLoader();
      }
    }
    return { posts: [], quotes: [], about: {}, team: [], contact: {}, other: {}, videos: [], logos: [], obituaries: [], lastPublishedAt: null };
  }
  
  async function writeSiteData(data, showLoader = false) {
    try {
      if (showLoader && window.LoaderUtils) {
        window.LoaderUtils.showGlobalLoader('Saving data...');
      }
      const response = await fetch(`${API_BASE}/site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        console.log('Data saved to backend');
        return true;
      } else {
        console.error('Save failed:', response.status);
      }
    } catch (error) {
      console.error('Backend save failed:', error);
    } finally {
      if (showLoader && window.LoaderUtils) {
        window.LoaderUtils.hideGlobalLoader();
      }
    }
    return false;
  }

  function $(sel) { return document.querySelector(sel); }
  function el(tag, attrs) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'text') n.textContent = v; else if (k === 'html') n.innerHTML = v; else n.setAttribute(k, v);
    });
    return n;
  }

  function requireAuth() {
    const form = $('#adminLoginForm');
    const panel = $('#panel');
    const loginContainer = $('#loginForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const mobile = form.mobile.value.trim();
      const password = form.password.value;
      if (mobile === DEFAULT_ADMIN.mobile && password === DEFAULT_ADMIN.password) {
        sessionStorage.setItem('admin.auth', '1');
        loginContainer.hidden = true; panel.hidden = false;
      } else {
        alert('Invalid mobile or password');
      }
    });
    if (sessionStorage.getItem('admin.auth') === '1') { loginContainer.hidden = true; panel.hidden = false; }
  }

  async function fetchSeedPosts() {
    try { const res = await fetch('../data/posts.json?v=20260430', { cache: 'no-cache' }); if (!res.ok) return []; return await res.json(); } catch(_) { return []; }
  }

  function bindPostEditor(site) {
    if (!site.posts) site.posts = [];

    const list = $('#postList');
    const addBtn = $('#addPost');
    const form = $('#postForm');
    const imagesInput = $('#coverInput');
    const addFromPathBtn = $('#addFromPath');
    const coverPathInput = $('#coverPath');
    const gallery = $('#coverPreview');    

    function refreshList(selectSlug) {
       list.innerHTML = '';
       const sorted = site.posts.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
       sorted.forEach((p) => {
         const li = el('li', {});
         // The title button is now a link to the details page
         const link = el('a', { href: `post-details.html?slug=${p.slug}`, target: '_blank', text: `${p.displayDate || p.date} â€” ${p.title}` });
         const button = el('button', { type: 'button', 'data-slug': p.slug, class: 'row' });
         li.innerHTML = `<button type="button" data-slug="${p.slug}" class="row edit-btn">${p.displayDate || p.date} â€” ${p.title}</button><button type="button" class="publish-btn" data-slug="${p.slug}">Publish</button>`;
         list.appendChild(li);
       });
       if (selectSlug) {
         const btn = list.querySelector(`button[data-slug="${selectSlug}"]`);
         if (btn) btn.scrollIntoView({ block: 'nearest' });
       }
     }

    function loadToForm(p, idx) {
       form.dataset.idx = String(idx);
       form.title.value = p.title || '';
       form.slug.value = p.slug || '';
       form.date.value = p.date || '';
       form.displayDate.value = p.displayDate || '';
       form.tags.value = (p.tags || []).join(', ');
       form.featured.checked = !!p.featured;
       const lockEl = document.getElementById('lockPost');
       if (lockEl) lockEl.checked = !!p.locked;
       setPostLockState(!!p.locked);
       // rich text excerpt is contenteditable div
       $('#excerpt').innerHTML = p.excerptHtml || (p.excerpt ? String(p.excerpt) : '');
       const contentEl = document.getElementById('contentEditor');
       if (contentEl) contentEl.innerHTML = p.contentHtml || '';
       renderGallery(p.coverImages || (p.cover ? [p.cover] : []));
       form.style.display = 'block';
     }

    function isVideoLink(url) {
      return url.includes('drive.google.com/file') || url.includes('youtu');
    }

    function getEmbedUrl(url) {
      if (url.includes('drive.google.com/file')) {
        const match = url.match(/\/d\/([^\/]+)/);
        if (match) {
          const id = match[1];
          return `https://drive.google.com/file/d/${id}/preview`;
        }
      } else if (url.includes('youtu')) {
        let id;
        if (url.includes('youtu.be/')) {
          id = url.split('youtu.be/')[1].split('?')[0];
        } else {
          const match = url.match(/[?&]v=([^#\&\?]*)/);
          if (match) id = match[1];
        }
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      return url;
    }

    function currentFromForm() {
      const coverImages = Array.from(gallery.querySelectorAll('.thumb')).map(wrap => wrap.dataset.url);
      return {
        title: form.title.value.trim(),
        slug: form.slug.value.trim(),
        date: form.date.value.trim(),
        displayDate: form.displayDate.value.trim(),
        tags: form.tags.value.split(',').map(s => s.trim()).filter(Boolean),
        excerptHtml: $('#excerpt').innerHTML,
        contentHtml: (document.getElementById('contentEditor') || { innerHTML: '' }).innerHTML,
        featured: form.featured.checked,
        locked: (document.getElementById('lockPost') || { checked:false }).checked,
        coverImages,
        // legacy single cover path (first image only) to keep front-end compatibility
        cover: coverImages[0] || ''
      };
    }

    function renderGallery(sources) {
      gallery.innerHTML = '';
      sources.forEach(src => {
        const wrap = el('div', { class: 'thumb' });
        wrap.dataset.url = src;
        const rm = el('button', { type: 'button', class: 'mini', text: 'âœ•' });
        rm.addEventListener('click', () => { wrap.remove(); });
        if (isVideoLink(src)) {
          const iframe = el('iframe', { src: getEmbedUrl(src), width: '200', height: '200', style: 'border: none; border-radius: 8px;', allow: 'autoplay; encrypted-media; fullscreen' });
          wrap.appendChild(iframe);
        } else {
          const img = el('img', { src });
          wrap.appendChild(img);
        }
        wrap.appendChild(rm);
        gallery.appendChild(wrap);
      });
    }

    imagesInput.addEventListener('change', async function () {
      const files = Array.from(imagesInput.files || []);
      for (const file of files) {
        // Compress image before upload
        const compressedDataUrl = await compressImage(file, 800, 0.7);
        renderGallery([...(Array.from(gallery.querySelectorAll('.thumb')).map(wrap => wrap.dataset.url)), compressedDataUrl]);
      }
      imagesInput.value = '';
    });

    // Image compression function
    async function compressImage(file, maxWidth, quality) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    addFromPathBtn && addFromPathBtn.addEventListener('click', function(){
      const raw = (coverPathInput && coverPathInput.value || '').trim();
      if (!raw) return;
      const parts = raw.split(/[,\n]/).map(s=>s.trim()).filter(Boolean);
      const existing = Array.from(gallery.querySelectorAll('.thumb')).map(wrap => wrap.dataset.url);
      renderGallery([...existing, ...parts]);
      coverPathInput.value = '';
    });

    addBtn.addEventListener('click', function () {
      const p = { title: 'Untitled', slug: new Date().toISOString().slice(0,10) + '-post', date: new Date().toISOString().slice(0,10), displayDate: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), tags: [], excerptHtml: '', featured: false, coverImages: [] };
      site.posts.push(p); writeSiteData(site); refreshList(p.slug); loadToForm(p, site.posts.length - 1);
    });

    function findIndexBySlug(slug) {
      return site.posts.findIndex(p => p.slug === slug);
    }

    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('button.edit-btn[data-slug]');
      if (btn) {
        const slug = btn.dataset.slug;
        const idx = findIndexBySlug(slug);
        if (idx > -1) loadToForm(site.posts[idx], idx);
      }
      const pubBtn = e.target.closest('.publish-btn');
      if (pubBtn) {
        e.preventDefault();
        const slug = pubBtn.dataset.slug;
        await writeSiteData(site, true);
        alert('Post published to website!');
      }
    });

    $('#deletePost').addEventListener('click', function () {
      const idx = Number(form.dataset.idx || -1);
      if (idx >= 0) { site.posts.splice(idx, 1); writeSiteData(site); refreshList(); form.reset(); gallery.innerHTML=''; $('#excerpt').innerHTML=''; alert('Deleted.'); }
    });

    $('#publish').addEventListener('click', async function () {
      const idx = Number(form.dataset.idx || -1);
      if (idx < 0) { alert('Select or add a post first.'); return; }

      const publishBtn = this;
      const originalText = publishBtn.textContent;

      if (window.LoaderUtils) {
        window.LoaderUtils.showButtonLoader(publishBtn, originalText);
      }

      try {
        const updated = currentFromForm();

        // Save to MongoDB
        site.posts[idx] = updated;
        site.lastPublishedAt = new Date().toISOString();

        const saved = await writeSiteData(site, true);
        if (saved) {
          refreshList(updated.slug);
          alert('Published successfully! Changes will appear on website.');
        } else {
          alert('Error saving. Please try again.');
        }
      } finally {
        if (window.LoaderUtils) {
          window.LoaderUtils.hideButtonLoader(publishBtn);
        }
      }
    });

    function setPostLockState(locked){
      const disable = (el) => { if (el) el.disabled = locked; };
      ['title','slug','date','displayDate','tags'].forEach(n=> disable(form[n]));
      const excerpt = document.getElementById('excerpt');
      const content = document.getElementById('contentEditor');
      if (excerpt) excerpt.contentEditable = locked ? 'false' : 'true';
      if (content) content.contentEditable = locked ? 'false' : 'true';
      disable(imagesInput); disable(addFromPathBtn); disable(coverPathInput); disable(form.featured);
    }
    const lockEl = document.getElementById('lockPost');
    lockEl && lockEl.addEventListener('change', function(){ setPostLockState(lockEl.checked); });

    // simple toolbar for excerpt
    function exec(cmd, val) { document.execCommand(cmd, false, val); }
    $('#boldBtn').addEventListener('click', () => exec('bold'));
    $('#italicBtn').addEventListener('click', () => exec('italic'));
    $('#underlineBtn').addEventListener('click', () => exec('underline'));
    $('#fontSel').addEventListener('change', e => exec('fontName', e.target.value));
    $('#sizeSel').addEventListener('change', e => exec('fontSize', e.target.value));
    $('#colorSel').addEventListener('change', e => exec('foreColor', e.target.value));

    // initial
    refreshList();
    if (site.posts.length) loadToForm(site.posts[0], 0);
  }

  function bindSiteSettings(site) {
    if (!site.locks) site.locks = { contact: true };
    // Quotes as objects with per-item lock
    if (!site.migrations) site.migrations = {};
    if (!site.migrations.quotesProvidedNov2025) {
      // Replace with the user's provided quotes (separate title + text)
      site.quotes = [
        { title: 'On Praise:', text: '"Let the message of Christ dwell among you richly as you teach and admonish one another with all wisdom through psalms, hymns, and songs from the Spirit, singing to God with gratitude in your hearts." â€” Colossians 3:16 (Emphasis added)', locked: true },
        { title: 'On Comfort:', text: '"When words fail, music speaks. Find solace in the melodies that echo God\'s promise: \'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.\'" â€” Zephaniah 3:17', locked: true },
        { title: 'On Strength:', text: '"The Lord is my strength and my shield; my heart trusts in him, and he helps me." â€” Psalm 28:7. Let our worship music be the shield that guards your heart and the anthem of your trust.', locked: true },
        { title: 'On Joy:', text: '"Sing to the Lord a new song; sing to the Lord, all the earth." â€” Psalm 96:1. Join our community in creating a new song of joy and celebration for His everlasting love.', locked: true }
      ];
      site.migrations.quotesProvidedNov2025 = true;
      // will be saved on publish
    } else if (typeof site.quotes[0] === 'string') {
      site.quotes = site.quotes.map(t => ({ text: t, locked: true }));
    }
    const qList = document.getElementById('quotesListAdmin');
    if (!qList) return; // Exit if the quotes list element doesn't exist
    const addQuote = document.getElementById('addQuote');
    function renderQuotesAdmin(){
      qList.innerHTML = '';
      site.quotes.forEach((q, i) => {
        const wrap = document.createElement('div'); wrap.className = 'card'; wrap.style.padding='8px';
        const title = document.createElement('input'); title.placeholder='Title'; title.value = q.title || '';
        const ta = document.createElement('textarea'); ta.rows = 3; ta.style.width='100%'; ta.placeholder='Quote'; ta.value = q.text || '';
        const lock = document.createElement('input'); lock.type='checkbox'; lock.checked = !!q.locked; lock.id = 'q_lock_'+i;
        const lbl = document.createElement('label'); lbl.style.display='flex'; lbl.style.alignItems='center'; lbl.style.gap='6px'; lbl.append(lock, document.createTextNode('Lock'));
        const row = document.createElement('div'); row.className='actions'; row.style.justifyContent='space-between';
        const del = document.createElement('button'); del.type='button'; del.className='btn'; del.textContent='Delete';
        const pub = document.createElement('button'); pub.type='button'; pub.className='btn publ'; pub.textContent='Publish';
        row.appendChild(del); row.appendChild(pub);
        function apply(){ title.disabled = lock.checked; ta.disabled = lock.checked; }
        apply();
        lock.addEventListener('change', function(){
          if (!lock.checked) {
            const pwd = prompt('Enter password to unlock');
            if (pwd !== DEFAULT_ADMIN.password) { lock.checked = true; apply(); return; }
          }
          q.locked = lock.checked; apply();
        });
        title.addEventListener('input', function(){ q.title = title.value; });
        ta.addEventListener('input', function(){ q.text = ta.value; });
        del.addEventListener('click', function(){ if (confirm('Delete this quote?')) { site.quotes.splice(i,1); renderQuotesAdmin(); }});
        pub.addEventListener('click', async function(){ 
          const pubBtn = this;
          const originalText = pubBtn.textContent;
          
          if (window.LoaderUtils) {
            window.LoaderUtils.showButtonLoader(pubBtn, originalText);
          }
          
          try {
            site.lastPublishedAt = new Date().toISOString(); 
            await writeSiteData(site, true); 
            alert('Quote published.'); 
          } finally {
            if (window.LoaderUtils) {
              window.LoaderUtils.hideButtonLoader(pubBtn);
            }
          }
        });
        wrap.appendChild(title);
        wrap.appendChild(ta);
        wrap.appendChild(lbl);
        wrap.appendChild(row);
        qList.appendChild(wrap);
      });
    }
    renderQuotesAdmin();
    addQuote && addQuote.addEventListener('click', function(){ site.quotes.push({ text: '', locked: false }); renderQuotesAdmin(); });
    // About removed per request (fields may not exist)
    // Contact
    if (!site.contact) site.contact = { phone: '+91 80788 64233', email: 'jeevajyothigv@gmail.com', note: 'Weâ€™re available for Christian events like weddings, funerals, conventions, and more. Letâ€™s glorify God together!', instagram: 'https://www.instagram.com/jeevajyothi_media?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', youtube: 'https://www.youtube.com/@jeevajyothimedia', facebook: 'https://www.facebook.com/jeevajyothigospelvoice', whatsapp: 'https://wa.me/+918078864233', locks: { phone: true, email: true, note: true, instagram: true, youtube: true, facebook: true, whatsapp: true } };
    // one-time migration to permanently set Connect Us defaults
    if (!site.migrations) site.migrations = {};
    if (!site.migrations.connectDefaultsV1) {
      site.contact.phone = '+91 80788 64233';
      site.contact.email = 'jeevajyothigv@gmail.com';
      site.contact.note = 'Weâ€™re available for Christian events like weddings, funerals, conventions, and more. Letâ€™s glorify God together!';
      site.contact.instagram = 'https://www.instagram.com/jeevajyothi_media?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';
      site.contact.youtube = 'https://www.youtube.com/@jeevajyothimedia';
      site.contact.facebook = 'https://www.facebook.com/jeevajyothigospelvoice';
      site.contact.whatsapp = 'https://wa.me/+918078864233';
      if (!site.contact.locks) site.contact.locks = {};
      site.contact.locks = { phone: true, email: true, note: true, instagram: true, youtube: true, facebook: true, whatsapp: true };
      site.migrations.connectDefaultsV1 = true;
      // will be saved on publish
    }
    if (!site.contact.locks) site.contact.locks = { phone: true, email: true, note: true, instagram: true, youtube: true, facebook: true, whatsapp: true };
    $('#contactPhone').value = site.contact?.phone || '';
    $('#contactEmail').value = site.contact?.email || '';
    $('#contactNote').value = site.contact?.note || '';
    $('#contactWhatsApp').value = site.contact?.whatsapp || '';
    
    // Social media links are now managed in "Other All" page
    // Sync them from other.instagramLink, other.facebookLink, other.youtubeLink to contact
    if (site.other) {
      if (site.other.instagramLink && !site.contact?.instagram) site.contact.instagram = site.other.instagramLink;
      if (site.other.facebookLink && !site.contact?.facebook) site.contact.facebook = site.other.facebookLink;
      if (site.other.youtubeLink && !site.contact?.youtube) site.contact.youtube = site.other.youtubeLink;
    }

    // Locks for Connect Us per field with password
    function applyContactLocks(){
      const cLocks = site.contact.locks || {};
      const phoneLock = document.getElementById('contactPhoneLock');
      const emailLock = document.getElementById('contactEmailLock');
      const noteLock = document.getElementById('contactNoteLock');
      const waLock = document.getElementById('contactWhatsAppLock');
      if (phoneLock) phoneLock.checked = !!cLocks.phone;
      if (emailLock) emailLock.checked = !!cLocks.email;
      if (noteLock) noteLock.checked = !!cLocks.note;
      if (waLock) waLock.checked = !!cLocks.whatsapp;
      $('#contactPhone').disabled = !!cLocks.phone;
      $('#contactEmail').disabled = !!cLocks.email;
      $('#contactNote').disabled = !!cLocks.note;
      $('#contactWhatsApp').disabled = !!cLocks.whatsapp;
      // No need to write here, will be saved on publish or lock toggle
    }
    applyContactLocks();
    function bindLockToggle(id, key){
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function(){
        if (!el.checked) {
          const pwd = prompt('Enter password to unlock');
          if (pwd !== DEFAULT_ADMIN.password) { el.checked = true; return; }
        }
        if (!site.contact.locks) site.contact.locks = {};
        site.contact.locks[key] = el.checked; applyContactLocks(); writeSiteData(site);
      });
    }
    bindLockToggle('contactPhoneLock','phone');
    bindLockToggle('contactEmailLock','email');
    bindLockToggle('contactNoteLock','note');
    bindLockToggle('contactWhatsAppLock','whatsapp');

    $('#publishSite').addEventListener('click', async function () {
      const publishBtn = this;
      const originalText = publishBtn.textContent;
      
      if (window.LoaderUtils) {
        window.LoaderUtils.showButtonLoader(publishBtn, originalText);
      }
      
      try {
        // quotes already saved via live updates
        const cLocks = site.contact.locks || { phone:false, email:false, note:false, whatsapp:false };
        if (!cLocks.phone) site.contact.phone = $('#contactPhone').value.trim();
        if (!cLocks.email) site.contact.email = $('#contactEmail').value.trim();
        if (!cLocks.note) site.contact.note = $('#contactNote').value.trim();
        if (!cLocks.whatsapp) site.contact.whatsapp = $('#contactWhatsApp').value.trim();
        // Social media links are managed in "Other All" page - sync them here
        if (site.other) {
          if (site.other.instagramLink) site.contact.instagram = site.other.instagramLink;
          if (site.other.facebookLink) site.contact.facebook = site.other.facebookLink;
          if (site.other.youtubeLink) site.contact.youtube = site.other.youtubeLink;
        }
        site.lastPublishedAt = new Date().toISOString();
        await writeSiteData(site, true);
        alert('Published site settings! Changes will reflect on pages immediately.');
      } finally {
        if (window.LoaderUtils) {
          window.LoaderUtils.hideButtonLoader(publishBtn);
        }
      }
    });
  }

  function bindSettings(site) {
    // Similar to bindSiteSettings but for settings tab
    // Copy the contact handling
    if (!site.contact) site.contact = { phone: '+91 80788 64233', email: 'jeevajyothigv@gmail.com', note: 'Weâ€™re available for Christian events like weddings, funerals, conventions, and more. Letâ€™s glorify God together!', instagram: 'https://www.instagram.com/jeevajyothi_media?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', youtube: 'https://www.youtube.com/@jeevajyothimedia', facebook: 'https://www.facebook.com/jeevajyothigospelvoice', whatsapp: 'https://wa.me/+918078864233', locks: { phone: true, email: true, note: true, instagram: true, youtube: true, facebook: true, whatsapp: true } };
    // Apply locks
    function applyLocks(){
      const cLocks = site.contact.locks || {};
      $('#settingsPhone').disabled = !!cLocks.phone;
      $('#settingsEmail').disabled = !!cLocks.email;
      $('#settingsNote').disabled = !!cLocks.note;
      $('#settingsWhatsApp').disabled = !!cLocks.whatsapp;
      $('#settingsPhoneLock').checked = !!cLocks.phone;
      $('#settingsEmailLock').checked = !!cLocks.email;
      $('#settingsNoteLock').checked = !!cLocks.note;
      $('#settingsWhatsAppLock').checked = !!cLocks.whatsapp;
    }
    $('#settingsPhone').value = site.contact?.phone || '';
    $('#settingsEmail').value = site.contact?.email || '';
    $('#settingsNote').value = site.contact?.note || '';
    $('#settingsWhatsApp').value = site.contact?.whatsapp || '';
    applyLocks();

    function bindLockToggle(id, key){
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function(){
        if (!el.checked) {
          const pwd = prompt('Enter password to unlock');
          if (pwd !== DEFAULT_ADMIN.password) { el.checked = true; return; }
        }
        if (!site.contact.locks) site.contact.locks = {};
        site.contact.locks[key] = el.checked; applyLocks(); writeSiteData(site);
      });
    }
    bindLockToggle('settingsPhoneLock','phone');
    bindLockToggle('settingsEmailLock','email');
    bindLockToggle('settingsNoteLock','note');
    bindLockToggle('settingsWhatsAppLock','whatsapp');

    $('#publishSettings').addEventListener('click', async function () {
      const publishBtn = this;
      const originalText = publishBtn.textContent;
      if (window.LoaderUtils) {
        window.LoaderUtils.showButtonLoader(publishBtn, originalText);
      }
      try {
        if (!site.contact.locks) site.contact.locks = { phone:false, email:false, note:false, whatsapp:false };
        if (!site.contact.locks.phone) site.contact.phone = $('#settingsPhone').value.trim();
        if (!site.contact.locks.email) site.contact.email = $('#settingsEmail').value.trim();
        if (!site.contact.locks.note) site.contact.note = $('#settingsNote').value.trim();
        if (!site.contact.locks.whatsapp) site.contact.whatsapp = $('#settingsWhatsApp').value.trim();
        site.lastPublishedAt = new Date().toISOString();
        await writeSiteData(site, true);
        alert('Settings published!');
      } finally {
        if (window.LoaderUtils) {
          window.LoaderUtils.hideButtonLoader(publishBtn);
        }
      }
    });
  }

  function bindContactsAndQuotes(site) {
    if (!site.other) {
      site.other = {
        brandName: 'Jeevajyothi Media',
        welcomeText: 'Welcome',
        since2003Text: 'Since 2003, sharing Christian messages and worship music to spread hope, deepen understanding, and glorify God.',
        youtubeBtnText: 'Watch on YouTube',
        youtubeBtnLink: 'https://www.youtube.com/@jeevajyothimedia',
        connectBtnText: 'Connect with Us',
        connectBtnLink: 'contact.html',
        facebookLink: 'https://www.facebook.com/jeevajyothigospelvoice',
        instagramLink: 'https://www.instagram.com/jeevajyothi_media?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
        youtubeLink: 'https://www.youtube.com/@jeevajyothimedia',
        footerText: 'Believe â€¢ Sing â€¢ Share',
        newsLinkText: 'Updates',
        newsLinkUrl: 'updates.html'
      };
      // will be saved on publish
    }

    $('#siteBrandName').value = site.other.brandName || '';
    $('#siteWelcomeText').value = site.other.welcomeText || '';
    $('#siteSince2003Text').value = site.other.since2003Text || '';
    $('#siteYoutubeBtnText').value = site.other.youtubeBtnText || '';
    $('#siteYoutubeBtnLink').value = site.other.youtubeBtnLink || '';
    $('#siteConnectBtnText').value = site.other.connectBtnText || '';
    $('#siteConnectBtnLink').value = site.other.connectBtnLink || '';
    $('#siteFacebookLink').value = site.other.facebookLink || '';
    $('#siteInstagramLink').value = site.other.instagramLink || '';
    $('#siteYoutubeLink').value = site.other.youtubeLink || '';
    $('#siteFooterText').value = site.other.footerText || '';
    $('#siteNewsLinkText').value = site.other.newsLinkText || '';
    $('#siteNewsLinkUrl').value = site.other.newsLinkUrl || '';

    $('#publishSiteSettings').addEventListener('click', async function(){
      const publishBtn = this;
      const originalText = publishBtn.textContent;
      if (window.LoaderUtils) {
        window.LoaderUtils.showButtonLoader(publishBtn, originalText);
      }
      try {
        if (!site.other) site.other = {};
        site.other.brandName = $('#siteBrandName').value.trim();
        site.other.welcomeText = $('#siteWelcomeText').value.trim();
        site.other.since2003Text = $('#siteSince2003Text').value.trim();
        site.other.youtubeBtnText = $('#siteYoutubeBtnText').value.trim();
        site.other.youtubeBtnLink = $('#siteYoutubeBtnLink').value.trim();
        site.other.connectBtnText = $('#siteConnectBtnText').value.trim();
        site.other.connectBtnLink = $('#siteConnectBtnLink').value.trim();
        site.other.facebookLink = $('#siteFacebookLink').value.trim();
        site.other.instagramLink = $('#siteInstagramLink').value.trim();
        site.other.youtubeLink = $('#siteYoutubeLink').value.trim();
        site.other.footerText = $('#siteFooterText').value.trim();
        site.other.newsLinkText = $('#siteNewsLinkText').value.trim();
        site.other.newsLinkUrl = $('#siteNewsLinkUrl').value.trim();
        site.lastPublishedAt = new Date().toISOString();
        await writeSiteData(site, true);
        alert('Site settings published!');
      } finally {
        if (window.LoaderUtils) {
          window.LoaderUtils.hideButtonLoader(publishBtn);
        }
      }
    });
  }

  function bindOtherSettings(site) {
    // Initialize Other Settings tab
    if (!site.other) {
        site.other = {
          brandName: 'Jeevajyothi Media',
          welcomeText: 'Welcome',
          since2003Text: 'Since 2003, sharing Christian messages and worship music to spread hope, deepen understanding, and glorify God.',
          youtubeBtnText: 'Watch on YouTube',
          youtubeBtnLink: 'https://www.youtube.com/@jeevajyothimedia',
          connectBtnText: 'Connect with Us',
          connectBtnLink: 'contact.html',
          facebookLink: 'https://www.facebook.com/jeevajyothigospelvoice',
          instagramLink: 'https://www.instagram.com/jeevajyothi_media?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
          youtubeLink: 'https://www.youtube.com/@jeevajyothimedia',
          footerText: 'Believe â€¢ Sing â€¢ Share',
          newsLinkText: 'Updates',
          newsLinkUrl: 'updates.html'
        };
        // will be saved on publish
      }

      const brandName = document.getElementById('brandName');
      const welcomeText = document.getElementById('welcomeText');
      const since2003Text = document.getElementById('since2003Text');
      const youtubeBtnText = document.getElementById('youtubeBtnText');
      const youtubeBtnLink = document.getElementById('youtubeBtnLink');
      const connectBtnText = document.getElementById('connectBtnText');
      const connectBtnLink = document.getElementById('connectBtnLink');
      const facebookLink = document.getElementById('facebookLink');
      const instagramLink = document.getElementById('instagramLink');
      const youtubeLink = document.getElementById('youtubeLink');
      const footerText = document.getElementById('footerText');
      const newsLinkText = document.getElementById('newsLinkText');
      const newsLinkUrl = document.getElementById('newsLinkUrl');
      const btn = document.getElementById('publishOther');

      if (brandName) brandName.value = site.other.brandName || '';
      if (welcomeText) welcomeText.value = site.other.welcomeText || '';
      if (since2003Text) since2003Text.value = site.other.since2003Text || '';
      if (youtubeBtnText) youtubeBtnText.value = site.other.youtubeBtnText || '';
      if (youtubeBtnLink) youtubeBtnLink.value = site.other.youtubeBtnLink || '';
      if (connectBtnText) connectBtnText.value = site.other.connectBtnText || '';
      if (connectBtnLink) connectBtnLink.value = site.other.connectBtnLink || '';
      if (facebookLink) facebookLink.value = site.other.facebookLink || '';
      if (instagramLink) instagramLink.value = site.other.instagramLink || '';
      if (youtubeLink) youtubeLink.value = site.other.youtubeLink || '';
      if (footerText) footerText.value = site.other.footerText || '';
      if (newsLinkText) newsLinkText.value = site.other.newsLinkText || '';
      if (newsLinkUrl) newsLinkUrl.value = site.other.newsLinkUrl || '';

      btn && btn.addEventListener('click', async function(){
        const publishBtn = this;
        const originalText = publishBtn.textContent;

        if (window.LoaderUtils) {
          window.LoaderUtils.showButtonLoader(publishBtn, originalText);
        }

        try {
          if (!site.other) site.other = {};
          
          // Get all values
          const brandNameVal = brandName ? brandName.value.trim() : '';
          const welcomeTextVal = welcomeText ? welcomeText.value.trim() : '';
          const since2003TextVal = since2003Text ? since2003Text.value.trim() : '';
          const youtubeBtnTextVal = youtubeBtnText ? youtubeBtnText.value.trim() : '';
          const youtubeBtnLinkVal = youtubeBtnLink ? youtubeBtnLink.value.trim() : '';
          const connectBtnTextVal = connectBtnText ? connectBtnText.value.trim() : '';
          const connectBtnLinkVal = connectBtnLink ? connectBtnLink.value.trim() : '';
          const facebookLinkVal = facebookLink ? facebookLink.value.trim() : '';
          const instagramLinkVal = instagramLink ? instagramLink.value.trim() : '';
          const youtubeLinkVal = youtubeLink ? youtubeLink.value.trim() : '';
          const footerTextVal = footerText ? footerText.value.trim() : '';
          const newsLinkTextVal = newsLinkText ? newsLinkText.value.trim() : '';
          const newsLinkUrlVal = newsLinkUrl ? newsLinkUrl.value.trim() : '';

          // Update data
          site.other.brandName = brandNameVal;
          site.other.welcomeText = welcomeTextVal;
          site.other.since2003Text = since2003TextVal;
          site.other.youtubeBtnText = youtubeBtnTextVal;
          site.other.youtubeBtnLink = youtubeBtnLinkVal;
          site.other.connectBtnText = connectBtnTextVal;
          site.other.connectBtnLink = connectBtnLinkVal;
          site.other.facebookLink = facebookLinkVal;
          site.other.instagramLink = instagramLinkVal;
          site.other.youtubeLink = youtubeLinkVal;
          site.other.footerText = footerTextVal;
          site.other.newsLinkText = newsLinkTextVal;
          site.other.newsLinkUrl = newsLinkUrlVal;

          // Also update contact social links globally (for Connect Us page)
          if (!site.contact) site.contact = {};
          if (facebookLinkVal) site.contact.facebook = facebookLinkVal;
          if (instagramLinkVal) site.contact.instagram = instagramLinkVal;
          if (youtubeLinkVal) site.contact.youtube = youtubeLinkVal;

          site.lastPublishedAt = new Date().toISOString();
          await writeSiteData(site, true);
          alert('Other settings published! Refresh the website to see changes. Brand name and links will update globally.');
        } finally {
          if (window.LoaderUtils) {
            window.LoaderUtils.hideButtonLoader(publishBtn);
          }
        }
      });
  }

    // Videos
    function bindVideos(site) {
      if (!Array.isArray(site.videos)) site.videos = [];
      
      // Initialize with video 1-9 if empty
      if (site.videos.length === 0) {
        for (let i = 1; i <= 9; i++) {
          site.videos.push({ image: `assets/images/video-${i}.jpg?v=20260430`, link: '' });
        }
        // will be saved on publish
      }
      
      const list = document.getElementById('videosList'); 
      const add = document.getElementById('addVideo'); 
      const btn = document.getElementById('publishVideos');
      
      function renderGallery(sources, container) {
        container.innerHTML = '';
        sources.forEach(src => {
          const wrap = el('div', { class: 'thumb' });
          const img = el('img', { src, style: 'pointer-events: none;' });
          const rm = el('button', { type: 'button', class: 'mini', text: 'âœ•' });
          rm.addEventListener('click', () => { wrap.remove(); });
          wrap.appendChild(img); wrap.appendChild(rm);
          container.appendChild(wrap);
        });
      }
      
      function render(){
        if (!list) return; 
        list.innerHTML='';
        site.videos.forEach((v, i) => {
          const wrap = document.createElement('div'); 
          wrap.className='card'; 
          wrap.style.padding='12px';
          
          const flex = document.createElement('div'); 
          flex.className='flex';
          
          const imgCol = document.createElement('div'); 
          imgCol.className='half';
          const imgLabel = document.createElement('label'); 
          imgLabel.textContent='Video Thumbnail';
          const imgInput = document.createElement('input'); 
          imgInput.type='file'; 
          imgInput.accept='image/*'; 
          imgInput.id=`videoImg_${i}`;
          const imgPathInput = document.createElement('input'); 
          imgPathInput.placeholder='Or enter path (assets/images/...)'; 
          imgPathInput.value = v.image || '';
          imgPathInput.id=`videoImgPath_${i}`;
          const addPathBtn = document.createElement('button'); 
          addPathBtn.type='button'; 
          addPathBtn.className='btn'; 
          addPathBtn.textContent='Add From Path'; 
          addPathBtn.style.marginTop='6px';
          const preview = document.createElement('div'); 
          preview.id=`videoPreview_${i}`; 
          preview.style.marginTop='8px';
          
          if (v.image) {
            const existing = Array.from(preview.querySelectorAll('img')).map(i => i.src);
            renderGallery([v.image], preview);
          }
          
          imgInput.addEventListener('change', async function() {
            const files = Array.from(imgInput.files || []);
            for (const file of files) {
              const dataUrl = await new Promise(res => {
                const r = new FileReader(); 
                r.onload = () => res(String(r.result)); 
                r.readAsDataURL(file);
              });
              const existing = Array.from(preview.querySelectorAll('img')).map(i => i.src);
              renderGallery([...existing, dataUrl], preview);
            }
            imgInput.value = '';
          });
          
          addPathBtn.addEventListener('click', function(){
            const raw = imgPathInput.value.trim();
            if (!raw) return;
            const existing = Array.from(preview.querySelectorAll('img')).map(i => i.src);
            renderGallery([...existing, raw], preview);
            imgPathInput.value = '';
          });
          
          imgLabel.appendChild(imgInput);
          imgLabel.appendChild(imgPathInput);
          imgLabel.appendChild(addPathBtn);
          imgLabel.appendChild(preview);
          imgCol.appendChild(imgLabel);
          
          const linkCol = document.createElement('div'); 
          linkCol.className='half';
          const linkLabel = document.createElement('label'); 
          linkLabel.textContent='Video Link';
          const linkInput = document.createElement('input'); 
          linkInput.placeholder='https://...'; 
          linkInput.value = v.link || '';
          linkInput.id = `videoLink_${i}`;
          linkInput.addEventListener('input', function(){
            v.link = linkInput.value.trim(); // Update in-memory state
          });
          linkLabel.appendChild(linkInput);
          linkCol.appendChild(linkLabel);
          
          flex.appendChild(imgCol);
          flex.appendChild(linkCol);
          wrap.appendChild(flex);
          
          const row = document.createElement('div'); 
          row.className='actions';
          const del = document.createElement('button'); 
          del.type='button'; 
          del.className='btn'; 
          del.textContent='Delete';
          del.addEventListener('click', function(){ 
            if (confirm('Delete this video?')) {
              site.videos.splice(i,1); 
              render(); 
            }
          });
          row.appendChild(del);
          wrap.appendChild(row);
          list.appendChild(wrap);
          
          // Update video data when image changes
          preview.addEventListener('DOMNodeRemoved', function(){
            const imgs = Array.from(preview.querySelectorAll('img'));
            if (imgs.length > 0) {
              v.image = imgs[0].src;
            }
          });
          
          // Watch for image changes in preview
          const observer = new MutationObserver(function(mutations) {
            const imgs = Array.from(preview.querySelectorAll('img'));
            if (imgs.length > 0) {
              v.image = imgs[0].src;
            } else {
              v.image = '';
            }
          });
          observer.observe(preview, { childList: true, subtree: true });
        });
      }
      
      render();
      add && add.addEventListener('click', function(){ 
        site.videos.push({ image: '', link: '' }); 
        render(); 
      });
      btn && btn.addEventListener('click', async function(){
        const publishBtn = this;
        const originalText = publishBtn.textContent;
        
        if (window.LoaderUtils) {
          window.LoaderUtils.showButtonLoader(publishBtn, originalText);
        }
        
        try {
          // Update all video images and links from form inputs
          list.querySelectorAll('.card').forEach((card, i) => {
            if (!site.videos[i]) return;
            const preview = document.getElementById(`videoPreview_${i}`);
            if (preview) {
              const imgs = Array.from(preview.querySelectorAll('img'));
              if (imgs.length > 0) {
                site.videos[i].image = imgs[0].src;
              }
            }
            const pathInput = document.getElementById(`videoImgPath_${i}`);
            if (pathInput && pathInput.value.trim()) {
              site.videos[i].image = pathInput.value.trim();
            }
            // Get link from the link input
            const linkInput = document.getElementById(`videoLink_${i}`);
            if (linkInput) {
              site.videos[i].link = linkInput.value.trim();
            }
          });
          site.lastPublishedAt = new Date().toISOString();
          await writeSiteData(site, true); 
          alert('Videos published'); 
        } finally {
          if (window.LoaderUtils) {
            window.LoaderUtils.hideButtonLoader(publishBtn);
          }
        }
      });
    }

    // Logo
    function bindLogo(site) {
      const defaultContent = '<p>At the heart of Jeevajyothi Media lies our name and our mission. "Jeevajyothi" is a beautiful Sanskrit phrase meaning <em>"Light of Life."</em> Our logo is a carefully crafted symbol designed to communicate this profound mission visually.</p><p>The icon seamlessly integrates the essence of "Jeevajyothi":</p><ul><li><strong>The Essence of Life (Jeeva):</strong> The rays of this light are designed to evoke organic forms, such as an unfolding leaf or the pulse of a heartbeat. This represents life, energy, consciousness, and growth. It reflects our focus on content that resonates with the human experience, empowering and nurturing our audience.</li><li><strong>The Radiant Light (Jyothi):</strong> The core of the emblem features a bright, radiant point of light or a gentle flame. This signifies enlightenment, awareness, and the power of media to dispel ignorance and shine a light on important stories and truths.</li></ul><p>This fusion of light and life in a single, cohesive mark represents our pledge: to produce media that is not just informative, but truly lifeâ€‘giving. We strive to be a positive force, a source of energy and inspiration that helps you grow and thrive.</p><p><strong>Jeevajyothi Media:</strong> Bringing Light to Your Life.</p>';
      
      if (!Array.isArray(site.logos)) {
        // Migrate old logo to array format
        if (site.logo && typeof site.logo === 'object') {
          site.logos = [{ image: site.logo.path || 'assets/images/logo.png?v=20260430', text: site.logo.alt || 'Jeevajyothi Media', contentHtml: defaultContent }];
        } else {
          site.logos = [{ image: 'assets/images/logo.png?v=20260430', text: 'Jeevajyothi Media', contentHtml: defaultContent }];
        }
        // will be saved on publish
      } else if (site.logos.length > 0 && (!site.logos[0].contentHtml || site.logos[0].contentHtml.trim() === '')) {
        // Ensure first logo has content
        site.logos[0].contentHtml = defaultContent;
        // will be saved on publish
      }
      
      const list = document.getElementById('logoList'); 
      const add = document.getElementById('addLogo'); 
      const btn = document.getElementById('publishLogo');
      
      function renderGallery(sources, container) {
        container.innerHTML = '';
        sources.forEach(src => {
          const wrap = el('div', { class: 'thumb' });
          const img = el('img', { src });
          const rm = el('button', { type: 'button', class: 'mini', text: 'âœ•' });
          rm.addEventListener('click', () => { wrap.remove(); });
          wrap.appendChild(img); wrap.appendChild(rm);
          container.appendChild(wrap);
        });
      }
      
      function render(){
        if (!list) return; 
        list.innerHTML='';
        site.logos.forEach((l, i) => {
          const wrap = document.createElement('div'); 
          wrap.className='card'; 
          wrap.style.padding='12px';
          
          const imgLabel = document.createElement('label'); 
          imgLabel.textContent='Logo Image';
          const imgInput = document.createElement('input'); 
          imgInput.type='file'; 
          imgInput.accept='image/*'; 
          imgInput.id=`logoImg_${i}`;
          const imgPathInput = document.createElement('input'); 
          imgPathInput.placeholder='Or enter path (assets/images/...)'; 
          imgPathInput.value = l.image || '';
          imgPathInput.id=`logoImgPath_${i}`;
          const addPathBtn = document.createElement('button'); 
          addPathBtn.type='button'; 
          addPathBtn.className='btn'; 
          addPathBtn.textContent='Add From Path'; 
          addPathBtn.style.marginTop='6px';
          const preview = document.createElement('div'); 
          preview.id=`logoPreview_${i}`; 
          preview.style.marginTop='8px';
          
          if (l.image) {
            renderGallery([l.image], preview);
          }
          
          imgInput.addEventListener('change', async function() {
            const files = Array.from(imgInput.files || []);
            for (const file of files) {
              const dataUrl = await new Promise(res => {
                const r = new FileReader(); 
                r.onload = () => res(String(r.result)); 
                r.readAsDataURL(file);
              });
              const existing = Array.from(preview.querySelectorAll('img')).map(i => i.src);
              renderGallery([...existing, dataUrl], preview);
            }
            imgInput.value = '';
          });
          
          addPathBtn.addEventListener('click', function(){
            const raw = imgPathInput.value.trim();
            if (!raw) return;
            const existing = Array.from(preview.querySelectorAll('img')).map(i => i.src);
            renderGallery([...existing, raw], preview);
            imgPathInput.value = '';
          });
          
          imgLabel.appendChild(imgInput);
          imgLabel.appendChild(imgPathInput);
          imgLabel.appendChild(addPathBtn);
          imgLabel.appendChild(preview);
          
          const textLabel = document.createElement('label'); 
          textLabel.style.marginTop='12px';
          textLabel.textContent='Text';
          const textInput = document.createElement('input'); 
          textInput.placeholder='Jeevajyothi Media'; 
          textInput.value = l.text || '';
          textInput.addEventListener('input', function(){
            l.text = textInput.value.trim(); // Update in-memory state
          });
          textLabel.appendChild(textInput);
          
          const contentLabel = document.createElement('label'); 
          contentLabel.style.marginTop='12px';
          contentLabel.style.display='block';
          contentLabel.textContent='Content (rich text)';
          const contentToolbar = document.createElement('div'); 
          contentToolbar.className='toolbar';
          const boldBtn = document.createElement('button'); boldBtn.type='button'; boldBtn.className='btn'; boldBtn.textContent='Bold';
          const italicBtn = document.createElement('button'); italicBtn.type='button'; italicBtn.className='btn'; italicBtn.textContent='Italic';
          const underlineBtn = document.createElement('button'); underlineBtn.type='button'; underlineBtn.className='btn'; underlineBtn.textContent='Underline';
          contentToolbar.appendChild(boldBtn);
          contentToolbar.appendChild(italicBtn);
          contentToolbar.appendChild(underlineBtn);
          const contentEditor = document.createElement('div'); 
          contentEditor.className='editor'; 
          contentEditor.contentEditable='true';
          contentEditor.id = `logoContent_${i}`;
          contentEditor.innerHTML = l.contentHtml || '';
          
          function exec(cmd, val) { document.execCommand(cmd, false, val); }
          boldBtn.addEventListener('click', () => exec('bold'));
          italicBtn.addEventListener('click', () => exec('italic'));
          underlineBtn.addEventListener('click', () => exec('underline'));
          
          contentEditor.addEventListener('input', function(){
            l.contentHtml = contentEditor.innerHTML; // Update in-memory state
          });
          
          contentLabel.appendChild(contentToolbar);
          contentLabel.appendChild(contentEditor);
          
          wrap.appendChild(imgLabel);
          wrap.appendChild(textLabel);
          wrap.appendChild(contentLabel);
          
          const row = document.createElement('div'); 
          row.className='actions';
          row.style.marginTop='12px';
          const del = document.createElement('button'); 
          del.type='button'; 
          del.className='btn'; 
          del.textContent='Delete';
          del.addEventListener('click', function(){ 
            if (confirm('Delete this logo entry?')) {
              site.logos.splice(i,1);
              render(); 
            }
          });
          row.appendChild(del);
          wrap.appendChild(row);
          list.appendChild(wrap);
          
          // Watch for image changes in preview
          const observer = new MutationObserver(function(mutations) {
            const imgs = Array.from(preview.querySelectorAll('img'));
            if (imgs.length > 0) {
              l.image = imgs[0].src;
            } else {
              l.image = '';
            }
          });
          observer.observe(preview, { childList: true, subtree: true });
        });
      }
      
      render();
      add && add.addEventListener('click', function(){ 
        const defaultContent = '<p>At the heart of Jeevajyothi Media lies our name and our mission. "Jeevajyothi" is a beautiful Sanskrit phrase meaning <em>"Light of Life."</em> Our logo is a carefully crafted symbol designed to communicate this profound mission visually.</p><p>The icon seamlessly integrates the essence of "Jeevajyothi":</p><ul><li><strong>The Essence of Life (Jeeva):</strong> The rays of this light are designed to evoke organic forms, such as an unfolding leaf or the pulse of a heartbeat. This represents life, energy, consciousness, and growth. It reflects our focus on content that resonates with the human experience, empowering and nurturing our audience.</li><li><strong>The Radiant Light (Jyothi):</strong> The core of the emblem features a bright, radiant point of light or a gentle flame. This signifies enlightenment, awareness, and the power of media to dispel ignorance and shine a light on important stories and truths.</li></ul><p>This fusion of light and life in a single, cohesive mark represents our pledge: to produce media that is not just informative, but truly lifeâ€‘giving. We strive to be a positive force, a source of energy and inspiration that helps you grow and thrive.</p><p><strong>Jeevajyothi Media:</strong> Bringing Light to Your Life.</p>';
        site.logos.push({ image: '', text: '', contentHtml: defaultContent });
        render(); 
      });
      btn && btn.addEventListener('click', async function(){ 
        const publishBtn = this;
        const originalText = publishBtn.textContent;
        
        if (window.LoaderUtils) {
          window.LoaderUtils.showButtonLoader(publishBtn, originalText);
        }
        
        try {
          // Update all logo images and content from previews and editors
          site.logos.forEach((l, i) => {
            const preview = document.getElementById(`logoPreview_${i}`);
            if (preview) {
              const imgs = Array.from(preview.querySelectorAll('img'));
              if (imgs.length > 0) {
                site.logos[i].image = imgs[0].src;
              }
            }
            const pathInput = document.getElementById(`logoImgPath_${i}`);
            if (pathInput && pathInput.value.trim()) {
              site.logos[i].image = pathInput.value.trim();
            }
            const contentEditor = document.getElementById(`logoContent_${i}`);
            if (contentEditor) {
              site.logos[i].contentHtml = contentEditor.innerHTML;
            }
          });
          site.lastPublishedAt = new Date().toISOString();
          await writeSiteData(site, true); 
          alert('Logo published! Changes will reflect on the website.');
        } finally {
          if (window.LoaderUtils) {
            window.LoaderUtils.hideButtonLoader(publishBtn);
          }
        }
      });
    }

    // Board Members
    function bindTeam(site) {
      if (!Array.isArray(site.team)) site.team = [];
      
      // Initialize with current team members if empty
      if (site.team.length === 0) {
        site.team = [
          { name: 'Pr. T. T. Simon', designation: 'Founder & Chairman', duties: 'Spiritual Leader and Visionary Guide', image: 'assets/images/core-ttsimon.jpg?v=20260430', locked: true },
          { name: 'Aneesh Valiyaparambil', designation: 'Director', duties: 'Creative Head & Media Coordinator', image: 'assets/images/core-aneesh.jpg?v=20260430', locked: true },
          { name: 'Stephen Sam Simon', designation: 'Executive Head', duties: 'Program Coordinator & Choir Lead', image: 'assets/images/core-stephen.jpg?v=20260430', locked: true }
        ];
        // will be saved on publish
      }
      
      const list = document.getElementById('teamList'); 
      const add = document.getElementById('addMember'); 
      const pub = document.getElementById('publishTeam');
      
      function renderGallery(sources, container) {
        container.innerHTML = '';
        sources.forEach(src => {
          const wrap = el('div', { class: 'thumb' });
          const img = el('img', { src });
          const rm = el('button', { type: 'button', class: 'mini', text: 'âœ•' });
          rm.addEventListener('click', () => { wrap.remove(); });
          wrap.appendChild(img); wrap.appendChild(rm);
          container.appendChild(wrap);
        });
      }
      
      function render(){
        if (!list) return; 
        list.innerHTML='';
        site.team.forEach((m, i) => {
          const wrap = document.createElement('div'); 
          wrap.className='card'; 
          wrap.style.padding='12px';
          
          const nameInput = document.createElement('input'); 
          nameInput.placeholder='Name'; 
          nameInput.value = m.name || '';
          nameInput.style.marginBottom='8px';
          nameInput.style.width='100%';
          nameInput.disabled = !!m.locked;
          
          const designationInput = document.createElement('input'); 
          designationInput.placeholder='Designation'; 
          designationInput.value = m.designation || '';
          designationInput.style.marginBottom='8px';
          designationInput.style.width='100%';
          designationInput.disabled = !!m.locked;
          
          const dutiesInput = document.createElement('textarea'); 
          dutiesInput.placeholder='Duties'; 
          dutiesInput.value = m.duties || '';
          dutiesInput.rows = 2;
          dutiesInput.style.marginBottom='8px';
          dutiesInput.style.width='100%';
          dutiesInput.disabled = !!m.locked;
          
          const imgLabel = document.createElement('label'); 
          imgLabel.textContent='Member Image';
          const imgInput = document.createElement('input'); 
          imgInput.type='file'; 
          imgInput.accept='image/*'; 
          imgInput.id=`teamImg_${i}`;
          imgInput.disabled = !!m.locked;
          const imgPathInput = document.createElement('input'); 
          imgPathInput.placeholder='Or enter path (assets/images/...)'; 
          imgPathInput.value = m.image || '';
          imgPathInput.id=`teamImgPath_${i}`;
          imgPathInput.disabled = !!m.locked;
          const addPathBtn = document.createElement('button'); 
          addPathBtn.type='button'; 
          addPathBtn.className='btn'; 
          addPathBtn.textContent='Add From Path'; 
          addPathBtn.style.marginTop='6px';
          addPathBtn.disabled = !!m.locked;
          const preview = document.createElement('div'); 
          preview.id=`teamPreview_${i}`; 
          preview.style.marginTop='8px';
          
          if (m.image) {
            renderGallery([m.image], preview);
          }
          
          imgInput.addEventListener('change', async function() {
            if (m.locked) return;
            const files = Array.from(imgInput.files || []);
            for (const file of files) {
              const dataUrl = await new Promise(res => {
                const r = new FileReader(); 
                r.onload = () => res(String(r.result)); 
                r.readAsDataURL(file);
              });
              const existing = Array.from(preview.querySelectorAll('img')).map(i => i.src);
              renderGallery([...existing, dataUrl], preview);
            }
            imgInput.value = '';
          });
          
          addPathBtn.addEventListener('click', function(){
            if (m.locked) return;
            const raw = imgPathInput.value.trim();
            if (!raw) return;
            const existing = Array.from(preview.querySelectorAll('img')).map(i => i.src);
            renderGallery([...existing, raw], preview);
            imgPathInput.value = '';
          });
          
          nameInput.addEventListener('input', function(){
            if (m.locked) return;
            m.name = nameInput.value.trim();
          });
          
          designationInput.addEventListener('input', function(){
            if (m.locked) return;
            m.designation = designationInput.value.trim();
          });
          
          dutiesInput.addEventListener('input', function(){
            if (m.locked) return;
            m.duties = dutiesInput.value.trim();
          });
          
          imgLabel.appendChild(imgInput);
          imgLabel.appendChild(imgPathInput);
          imgLabel.appendChild(addPathBtn);
          imgLabel.appendChild(preview);
          
          const lockLabel = document.createElement('label'); 
          lockLabel.style.display='flex';
          lockLabel.style.alignItems='center';
          lockLabel.style.gap='6px';
          lockLabel.style.marginTop='8px';
          const lockCheck = document.createElement('input'); 
          lockCheck.type='checkbox'; 
          lockCheck.checked = !!m.locked;
          lockCheck.id=`teamLock_${i}`;
          lockCheck.addEventListener('change', function(){
            if (!lockCheck.checked) {
              const pwd = prompt('Enter password to unlock');
              if (pwd !== DEFAULT_ADMIN.password) { 
                lockCheck.checked = true; 
                return; 
              }
            }
            m.locked = lockCheck.checked;
            nameInput.disabled = m.locked;
            designationInput.disabled = m.locked;
            dutiesInput.disabled = m.locked;
            imgInput.disabled = m.locked;
            imgPathInput.disabled = m.locked;
            addPathBtn.disabled = m.locked;
          });
          lockLabel.appendChild(lockCheck);
          lockLabel.appendChild(document.createTextNode('Lock'));
          
          wrap.appendChild(nameInput);
          wrap.appendChild(designationInput);
          wrap.appendChild(dutiesInput);
          wrap.appendChild(imgLabel);
          wrap.appendChild(lockLabel);
          
          const row = document.createElement('div'); 
          row.className='actions';
          row.style.marginTop='12px';
          const del = document.createElement('button'); 
          del.type='button'; 
          del.className='btn'; 
          del.textContent='Delete';
          del.addEventListener('click', function(){ 
            if (m.locked) {
              alert('This member is locked. Unlock to delete.');
              return;
            }
            if (confirm('Delete this member?')) {
              site.team.splice(i,1); 
              render(); 
            }
          });
          row.appendChild(del);
          wrap.appendChild(row);
          list.appendChild(wrap);
          
          // Watch for image changes in preview
          const observer = new MutationObserver(function(mutations) {
            if (m.locked) return;
            const imgs = Array.from(preview.querySelectorAll('img'));
            if (imgs.length > 0) {
              m.image = imgs[0].src;
            } else {
              m.image = '';
            }
          });
          observer.observe(preview, { childList: true, subtree: true });
        });
      }
      render();
      add && add.addEventListener('click', function(){ 
        site.team.push({ name: '', designation: '', duties: '', image: '', locked: false }); 
        render(); 
      });
      pub && pub.addEventListener('click', async function(){ 
        const publishBtn = this;
        const originalText = publishBtn.textContent;
        
        if (window.LoaderUtils) {
          window.LoaderUtils.showButtonLoader(publishBtn, originalText);
        }
        
        try {
          // Update all team images from previews
          site.team.forEach((m, i) => {
            const preview = document.getElementById(`teamPreview_${i}`);
            if (preview) {
              const imgs = Array.from(preview.querySelectorAll('img'));
              if (imgs.length > 0) {
                site.team[i].image = imgs[0].src;
              }
            }
            const pathInput = document.getElementById(`teamImgPath_${i}`);
            if (pathInput && pathInput.value.trim()) {
              site.team[i].image = pathInput.value.trim();
            }
          });
          site.lastPublishedAt = new Date().toISOString();
          await writeSiteData(site, true); 
          alert('Team published'); 
        } finally {
          if (window.LoaderUtils) {
            window.LoaderUtils.hideButtonLoader(publishBtn);
          }
        }
      });
    }

    // About Section
    function bindAbout(site) {
      const defaultAboutContent = '<p>Welcome to Jeevajyothi Media â€” your light of faith, sharing Christian messages and worship music since 2003. Through inspired teaching, soulful songs, and uplifting stories, we seek to spread hope, deepen understanding, and <strong>glorify God</strong>.</p><p>Along with our media ministry, we also serve through our choir group, dedicated to <strong>glorifying God</strong> in Christian events such as weddings, funerals, conventions, and other special gatherings. With heartfelt voices and harmonies, we aim to comfort, inspire, and uplift every occasion with songs of faith and hope.</p><p>Join us every week for sermons, worship sessions, and testimonies that transform lives. Whether you\'re discovering faith or walking the path already â€” this is your home to grow, praise, and share in Christ\'s love.</p><p>Let\'s shine together: believe, worship, and live His Word.</p>';

      if (!site.about || !site.about.contentHtml) {
        site.about = {
          contentHtml: defaultAboutContent
        };
        // will be saved on publish
      }

      const contentEl = document.getElementById('aboutContent');
      const btn = document.getElementById('publishAbout');

      if (contentEl) {
        // Remove any height restrictions from editor to allow unlimited content
        contentEl.style.minHeight = '200px';
        contentEl.style.maxHeight = 'none';
        contentEl.style.height = 'auto';
        contentEl.style.overflowY = 'auto';
        contentEl.style.overflowX = 'visible';
        contentEl.style.whiteSpace = 'normal';

        // Set initial content if empty
        if (!site.about.contentHtml || site.about.contentHtml.trim() === '') {
          contentEl.innerHTML = defaultAboutContent;
          site.about.contentHtml = defaultAboutContent;
          // will be saved on publish
        } else {
          // Load full content from storage - ensure nothing is truncated
          contentEl.innerHTML = site.about.contentHtml;
        }
      }

      // Rich text toolbar
      function exec(cmd, val) { document.execCommand(cmd, false, val); }
      const boldBtn = document.getElementById('aboutBoldBtn');
      const italicBtn = document.getElementById('aboutItalicBtn');
      const underlineBtn = document.getElementById('aboutUnderlineBtn');
      const fontSel = document.getElementById('aboutFontSel');
      const sizeSel = document.getElementById('aboutSizeSel');
      const colorSel = document.getElementById('aboutColorSel');

      boldBtn && boldBtn.addEventListener('click', () => exec('bold'));
      italicBtn && italicBtn.addEventListener('click', () => exec('italic'));
      underlineBtn && underlineBtn.addEventListener('click', () => exec('underline'));
      fontSel && fontSel.addEventListener('change', e => exec('fontName', e.target.value));
      sizeSel && sizeSel.addEventListener('change', e => exec('fontSize', e.target.value));
      colorSel && colorSel.addEventListener('change', e => exec('foreColor', e.target.value));

      btn && btn.addEventListener('click', async function(){
        const publishBtn = this;
        const originalText = publishBtn.textContent;

        if (window.LoaderUtils) {
          window.LoaderUtils.showButtonLoader(publishBtn, originalText);
        }

        try {
          if (!site.about) site.about = {};
          // Get the full HTML content from the editor
          const fullContent = contentEl ? contentEl.innerHTML : '';
          // Ensure we're saving the complete content
          site.about.contentHtml = fullContent;
          site.lastPublishedAt = new Date().toISOString();
          await writeSiteData(site, true);
          alert('About section published! All content has been saved.');
        } finally {
          if (window.LoaderUtils) {
            window.LoaderUtils.hideButtonLoader(publishBtn);
          }
        }
      });
    }

  // --- Main Application Logic ---

  async function main() {
    requireAuth();

    // Fetch data once and store it in the central state
    siteData = await readSiteData(true);

    // Map tab names to their initialization functions
    const tabInitializers = {
      'posts': bindPostEditor,
      'site-settings': bindSiteSettings,
      'obituaries': bindObituaries,
      'other-settings': bindOtherSettings,
      'videos': bindVideos,
      'logo': bindLogo,
      'team': bindTeam,
      'about': bindAbout,
      'obituaries': bindObituaries,
    };

    // Tab switching logic
    function showTab(name) {
      // Initialize tab content only once, on first view
      if (tabInitializers[name]) {
        tabInitializers[name](siteData); // Correctly call the initializer function
        delete tabInitializers[name]; // Remove initializer after it has run
      }

      document.querySelectorAll('[id^="tab-"]').forEach(s => s.hidden = true);
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      const el = document.getElementById('tab-' + name);
      el && (el.hidden = false);
      const btn = document.querySelector(`[data-tab="${name}"]`);
      btn && btn.classList.add('active');
    }
    document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', function(){ showTab(btn.dataset.tab); }));
    showTab('posts'); // Show and initialize the default 'posts' tab

    const logout = document.getElementById('logout');
    logout && logout.addEventListener('click', function(){
      sessionStorage.removeItem('admin.auth');
      location.reload();
    });
  }

  document.addEventListener('DOMContentLoaded', main);
})();



