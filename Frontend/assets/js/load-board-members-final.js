(async function loadBoardMembers() {
  const API_BASE = 'https://api.jeevajyothimedia.com/api/public';

  if (window.coreTeamLoaded) return;
  window.coreTeamLoaded = true;

  try {
    const res = await fetch(`${API_BASE}/board-members`);
    if (!res.ok) throw new Error(`Failed to load board members (${res.status})`);

    const json = await res.json();
    const team = Array.isArray(json?.data) ? json.data : [];

    // Categorize
    const boardMembers = team.filter(m => {
      const d = (m.designation || '').toLowerCase();
      return !['honorary', 'contributor', 'associate'].some(k => d.includes(k));
    });

    const honorary = team.filter(m => (m.designation || '').toLowerCase().includes('honorary'));
    const associates = team.filter(m => (m.designation || '').toLowerCase().includes('associate'));
    const contributors = team.filter(m => (m.designation || '').toLowerCase().includes('contributor'));

    function card(member) {
      const article = document.createElement('article');
      article.className = 'member-card';
      const slug = (member.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const link = `board-member.html?member=${encodeURIComponent(slug)}`;
      const duties = member.duties || '';

      article.innerHTML = `
        <div class="member-card-media">
          <a class="member-card-link" href="${link}">
            <img class="member-card-photo" src="${member.image || 'assets/images/placeholder.svg'}" alt="${member.name || ''}" loading="lazy">
          </a>
        </div>
        <div class="member-card-body">
          <p class="member-card-role">${member.designation || 'Team Member'}</p>
          <h3 class="member-card-name">${member.name || ''}</h3>
          ${duties ? `<p class="member-card-duty">${duties}</p>` : ''}
        </div>
      `;

      article.addEventListener('click', e => {
        if (!e.target.closest('a')) {
          sessionStorage.setItem('boardScrollPos', window.scrollY);
          window.location.href = link;
        }
      });

      return article;
    }

    function render(id, list) {
      const grid = document.getElementById(id);
      if (!grid) return;

      grid.innerHTML = '';
      list.forEach(m => grid.appendChild(card(m)));

      const section = grid.closest('.team-category');
      if (section) section.style.display = list.length ? 'block' : 'none';
    }

    render('boardMembersGrid', boardMembers);
    render('contributorsGrid', honorary);
    render('associateMembersGrid', associates);
    render('contributorsFinalGrid', contributors);

  } catch (e) {
    console.error('Load error:', e);
    const targetIds = ['boardMembersGrid', 'contributorsGrid', 'associateMembersGrid', 'contributorsFinalGrid'];
    targetIds.forEach(id => {
      const grid = document.getElementById(id);
      if (grid) grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted);">Unable to load board members right now.</p>';
    });
  }
})();

