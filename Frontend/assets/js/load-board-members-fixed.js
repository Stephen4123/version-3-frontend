(async function loadBoardMembers() {
  if (window.coreTeamLoaded) return;
  window.coreTeamLoaded = true;
  
  try {
    let team = [];
    if (window.WorkerData && window.WorkerData.fetchWorkerJson) {
      team = await window.WorkerData.fetchWorkerJson('core-team', []);
    }
    if (!Array.isArray(team) || !team.length) {
      const response = await fetch('./data/core-team.json');
      team = await response.json();
    }


    // Categorize
    const boardMembers = team.filter(m => {
      const d = (m.designation || '').toLowerCase();
      return !['honorary', 'contributor', 'associate'].some(k => d.includes(k));
    });

    const honorary = team.filter(m => (m.designation || '').toLowerCase().includes('honorary'));
    const associates = team.filter(m => (m.designation || '').toLowerCase().includes('associate'));

    function card(member) {
      const article = document.createElement('article');
      article.className = 'member-card';
      const slug = member.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const link = `board-member.html?member=${encodeURIComponent(slug)}`;
      const duties = member.duties || '';
      article.innerHTML = `
        <div class="member-card-media">
          <a class="member-card-link" href="${link}">
            <img class="member-card-photo" src="${member.image || 'assets/images/placeholder.svg'}" alt="${member.name}" loading="lazy">
          </a>
        </div>
        <div class="member-card-body">
          <p class="member-card-role">${member.designation || 'Team Member'}</p>
          <h3 class="member-card-name">${member.name}</h3>
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
      section.style.display = list.length ? 'block' : 'none';
    }

    render('boardMembersGrid', boardMembers);
    render('contributorsGrid', honorary);
    render('associateMembersGrid', associates);
    
    console.log('Board loaded:', boardMembers.length, honorary.length, associates.length);
    
  } catch (e) {
    console.error('Board load failed:', e);
  }
})();



