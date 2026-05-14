/* Program Guide (Frontend/HTML) - API only */
(function () {
  const API_BASE = 'http://localhost:3000/api/public';

  async function loadPrograms() {
    try {
      const res = await fetch(`${API_BASE}/programs`);
      if (!res.ok) throw new Error(`Failed to load programs (${res.status})`);

      const json = await res.json();
      return Array.isArray(json?.data) ? json.data : [];
    } catch (e) {
      console.error('ProgramGuide loadPrograms error:', e);
      return [];
    }
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, (c) => {
      const m = { '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#39;' };
      return m[c] || c;
    });
  }

  function buildCard(program) {
    const slug = program.slug;
    const href = `program-guide-detail.html?slug=${encodeURIComponent(slug)}`;

    const imgSrc = program.image ? program.image : '';

    return `
      <article class="card" style="cursor:pointer;" data-slug="${escapeHtml(slug)}">
        <div class="card-cover" style="height:160px; background:#1f2937; display:flex; align-items:center; justify-content:center; overflow:hidden;">
          ${imgSrc ? `<img src="${imgSrc}" alt="${escapeHtml(program.title)}" style="width:100%; height:100%; object-fit:cover;" />` : `<span style="color:#fff; opacity:.8;">${escapeHtml(program.title)}</span>`}
        </div>
        <div class="card-body" style="padding:14px; display:flex; flex-direction:column; height:100%;">
          <h3 style="margin:0 0 6px;">${escapeHtml(program.title)}</h3>
          <p style="margin:0; color: rgba(255,255,255,0.8); line-height:1.5; font-size: 14px;">${escapeHtml(program.lead || program.summary)}</p>

          <div style="margin-top:auto; padding-top:12px; display:flex; align-items:center; justify-content:flex-start;">
            <button
              type="button"
              class="btn"
              data-share-url="${escapeHtml(href)}"
              data-title="${escapeHtml(program.title || '')}"
              style="padding:0.4rem 0.9rem; width:100%; max-width:180px;"
            >
              Share
            </button>
          </div>
        </div>
      </article>
    `;
  }

  async function renderGrid() {
    const grid = document.getElementById('programGuideGrid');
    const empty = document.getElementById('programGuideEmpty');
    if (!grid) return;

    const programs = await loadPrograms();

    if (!programs.length) {
      if (empty) empty.style.display = 'block';
      return;
    }

    if (empty) empty.style.display = 'none';

    grid.innerHTML = programs.map(buildCard).join('');

    grid.querySelectorAll('article[data-slug]').forEach((el) => {
      const shareBtn = el.querySelector('button[data-share-url]');

      el.addEventListener('click', (ev) => {
        const target = ev.target;

        if (shareBtn && (target === shareBtn || (target && target.closest && target.closest('button[data-share-url]')))) {
          return;
        }

        if (target && (target.tagName === 'A' || (target.closest && target.closest('a')))) return;

        const slug = el.getAttribute('data-slug');
        window.location.href = `program-guide-detail.html?slug=${encodeURIComponent(slug)}`;
      });

      if (shareBtn) {
        shareBtn.addEventListener('click', async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();

          const title = (shareBtn.getAttribute('data-title') || '').trim();
          const shareUrl = shareBtn.getAttribute('data-share-url') || '';
          const fullLink = window.location.origin.replace(/\/$/, '') + '/' + shareUrl;

          const text = `*യൂത്ത് മീറ്റിംഗുകൾക്കായി തയ്യാറെടുക്കാം! ✨*\n\n*നിങ്ങളുടെ മീറ്റിംഗുകളിൽ അവതരിപ്പിക്കാൻ വ്യത്യസ്തമായ ഒരു പ്രോഗ്രാം തിരയുകയാണോ? ജീവജ്യോതി മീഡിയ ഒരുക്കുന്ന ഈ പുതിയ പ്രോഗ്രാം പരിചയപ്പെടൂ:*\n\n*📌 Program: ${title}*\n\n*🔗 Link:* ${fullLink}\n\n*യൂത്ത് മീറ്റിംഗുകൾ കൂടുതൽ ആകർഷകമാക്കാൻ ആവശ്യമായ പുതിയ ഐഡിയകളും പ്രോഗ്രാമുകളും ഈ പേജിൽ ലഭ്യമാണ്.*\n\n*നമുക്ക് ഒന്നിച്ച് നല്ലൊരു നാളെയെ വാർത്തെടുക്കാം! 🤝*\n*🛑Jeevajyothi Media🛑*`;

          try {
            if (navigator.share) {
              navigator.share({ title: title || 'Program', text });
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(text);
              alert('Share text copied to clipboard!');
            } else {
              alert('Sharing is not supported in this browser.');
            }
          } catch (e) {
            console.error('Card share failed:', e);
          }
        });
      }
    });
  }

  function renderDetailNow(program) {
    const title = document.getElementById('programDetailTitle');
    const lead = document.getElementById('programDetailLead');
    const summary = document.getElementById('programDetailSummary');
    const sectionsEl = document.getElementById('programDetailSections');

    const verseWrap = document.getElementById('programDetailVerse');
    const verseRef = document.getElementById('programDetailVerseRef');
    const verseText = document.getElementById('programDetailVerseText');

    const notFound = document.getElementById('programDetailNotFound');

    if (!title || !lead || !summary || !sectionsEl) return;

    if (!program) {
      if (notFound) notFound.style.display = 'block';
      return;
    }

    if (notFound) notFound.style.display = 'none';

    title.textContent = program.title || 'Program';
    lead.textContent = program.lead || '';
    summary.textContent = program.summary || '';

    if (verseWrap && program.verse && program.verseText) {
      verseRef.textContent = program.verse;
      verseText.textContent = program.verseText;
      verseWrap.style.display = 'block';
    } else if (verseWrap) {
      verseWrap.style.display = 'none';
    }

    const sections = Array.isArray(program.sections) ? program.sections : [];
    sectionsEl.innerHTML = sections
      .map((s) => {
        const items = Array.isArray(s.items) ? s.items : [];
        return `
          <section>
            <h2 style="margin:0 0 8px; font-size: 18px;">${escapeHtml(s.title || '')}</h2>
            <ul style="margin:0; padding-left:18px; color: rgba(255,255,255,0.9); line-height:1.7;">
              ${items.map((it) => `<li>${escapeHtml(it)}</li>`).join('')}
            </ul>
          </section>
        `;
      })
      .join('');
  }

  async function renderDetail(slug) {
    const programs = await loadPrograms();
    const program = programs.find((p) => p.slug === slug);
    renderDetailNow(program);
  }

  window.ProgramGuide = {
    renderGrid,
    renderDetail,
  };

  document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('programGuideGrid');
    if (grid) {
      renderGrid();
    }

    const shareBtn = document.getElementById('programGuideShareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async function () {
        try {
          const link = window.location.origin + '/program-guide.html';
          const text = `*യൂത്ത് മീറ്റിംഗുകൾക്കായി തയ്യാറെടുക്കാം! ✨*\n\n*നിങ്ങളുടെ മീറ്റിംഗുകളിൽ അവതരിപ്പിക്കാൻ വ്യത്യസ്തമായ ഒരു പ്രോഗ്രാം തിരയുകയാണോ? ജീവജ്യോതി മീഡിയ ഒരുക്കുന്ന ഈ പുതിയ പ്രോഗ്രാം പരിചയപ്പെടൂ:*\n\n*📌 Program: [title]*\n\n*🔗 Link:* ${link}\n\n*യൂത്ത് മീറ്റിംഗുകൾ കൂടുതൽ ആകർഷകമാക്കാൻ ആവശ്യമായ പുതിയ ഐഡിയകളും പ്രോഗ്രാമുകളും ഈ പേജിൽ ലഭ്യമാണ്.*\n\n*നമുക്ക് ഒന്നിച്ച് നല്ലൊരു നാളെയെ വാർത്തെടുക്കാം! 🤝*\n*🛑Jeevajyothi Media🛑*`;

          if (navigator.share) {
            navigator.share({ title: 'Program Guide for Youth', text });
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            alert('Share text copied to clipboard!');
          } else {
            alert('Sharing is not supported in this browser.');
          }
        } catch (e) {
          console.error('Program guide share failed:', e);
        }
      });
    }
  });
})();

