(async function() {
    const memberNameHeading = document.getElementById('memberNameHeading');
    const memberSummary = document.getElementById('memberSummary');
    const memberAvatar = document.getElementById('memberAvatar');
    const filterButtons = document.getElementById('filterButtons');
    const contributionStats = document.getElementById('contributionStats');
    
    // Section Mapping
    const speechesSection = document.getElementById('speechesSection');
    const articlesSection = document.getElementById('articlesSection');
    const newsSection = document.getElementById('newsSection');
    const poemsSection = document.getElementById('poemsSection');
    const voicesSection = document.getElementById('voicesSection');
    const speechesGrid = document.getElementById('speechesGrid');
    const articlesGrid = document.getElementById('articlesGrid');
    const newsGrid = document.getElementById('newsGrid');
    const poemsGrid = document.getElementById('poemsGrid');
    const voicesGrid = document.getElementById('voicesGrid');

    const noContributionsSection = document.getElementById('noContributionsSection');

    const sectionMap = {
        speeches: speechesSection,
        articles: articlesSection,
        news: newsSection,
        poems: poemsSection,
        voices: voicesSection
    };
    
    const visibleSections = ['speeches', 'articles', 'news', 'poems', 'voices'];
    let activeFilter = 'all';

    // --- Helper Functions ---
    function normalizeText(value) {
        return String(value || '')
            .replace(/[^\w\s.-]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function slugify(value) {
        return normalizeText(value)
            .replace(/[_.]/g, '-')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function stripHtml(value) {
        return String(value || '').replace(/<[^>]*>/g, '').trim();
    }

    // Helper function to get display label - prioritizes cardLabel over type
    function getDisplayLabel(item) {
        if (item.cardLabel && item.cardLabel.trim() !== '') {
            return item.cardLabel;
        }
        if (item.type && item.type.trim() !== '') {
            return item.type.charAt(0).toUpperCase() + item.type.slice(1);
        }
        return 'Voice';
    }

    function setPageInfo(member) {
        if (!member) {
            memberNameHeading.textContent = 'Board Member Contributions';
            memberSummary.textContent = 'Select a board member to view their work.';
            return;
        }

        memberNameHeading.textContent = member.name;
        memberSummary.textContent = member.designation || 'Board Member';
        
        if (member.image && memberAvatar) {
            memberAvatar.src = member.image;
            memberAvatar.hidden = false;
        }
    }

    // --- Core Logic ---
    function createContributionListItem(item) {
        // Using the helper defined in your HTML for consistency
        if (window.createContributionListItem) {
            return window.createContributionListItem(item, item.typeLabel, item.url);
        }
        
        // Fallback if global helper isn't found
        const div = document.createElement('div');
        div.className = 'contribution-item';
        div.innerHTML = `
            <div class="contribution-type-badge"><span>${escapeHtml(item.typeLabel)}</span></div>
            <div class="contribution-content">
                <h3 class="contribution-title"><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></h3>
                <div class="contribution-meta"><span class="contribution-date">${escapeHtml(item.displayDate)}</span></div>
            </div>`;
        return div;
    }

    function createVoiceContributionListItem(item) {
        // Using the helper defined in your HTML for voices - uses cardLabel
        if (window.createVoiceContributionListItem) {
            return window.createVoiceContributionListItem(item, item.typeLabel, item.url);
        }
        
        // Fallback if global helper isn't found - uses getDisplayLabel
        const div = document.createElement('div');
        div.className = 'contribution-item';
        const displayLabel = getDisplayLabel(item);
        div.innerHTML = `
            <div class="contribution-type-badge"><span>${escapeHtml(displayLabel)}</span></div>
            <div class="contribution-content">
                <h3 class="contribution-title"><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></h3>
                <div class="contribution-meta"><span class="contribution-date">${escapeHtml(item.displayDate)}</span></div>
                ${item.excerpt ? `<p class="contribution-excerpt">${escapeHtml(item.excerpt)}</p>` : ''}
            </div>
            <div class="contribution-arrow">→</div>
        `;
        return div;
    }

    function renderSection(section, grid, items, emptyText, isVoiceSection = false) {
        if (!section || !grid) return;
        grid.innerHTML = '';

        if (!items.length) {
            section.hidden = true;
            return;
        }

        section.hidden = false;
        items.forEach(item => {
            if (isVoiceSection) {
                grid.appendChild(createVoiceContributionListItem(item));
            } else {
                grid.appendChild(createContributionListItem(item));
            }
        });
    }

    async function fetchJson(path) {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        return response.json();
    }

    // --- Initialization ---
    const query = new URLSearchParams(window.location.search);
    const selectedName = String(query.get('name') || '').trim();
    const selectedMemberSlug = String(query.get('member') || '').trim();

    if (!selectedName && !selectedMemberSlug) {
        setPageInfo(null);
        return;
    }

    try {
        const [team, posts, speechesData, voiceData] = await Promise.all([
            (window.WorkerData && window.WorkerData.fetchWorkerJson
              ? window.WorkerData.fetchWorkerJson('core-team', [])
              : fetchJson('data/core-team.json')),
            (window.WorkerData && window.WorkerData.fetchWorkerJson
              ? window.WorkerData.fetchWorkerJson('posts', [])
              : fetchJson('data/posts.json')),
            (window.WorkerData && window.WorkerData.fetchWorkerJson
              ? window.WorkerData.fetchWorkerJson('speeches', [])
              : fetchJson('data/speeches.json')),
            (window.WorkerData && window.WorkerData.fetchWorkerJson
              ? window.WorkerData.fetchWorkerJson('voice-hub', [])
              : fetchJson('data/voice-hub.json').catch(() => [])) // Voice data fallback to empty array
        ]);

        const normalizedSelectedName = normalizeText(selectedName);
        const normalizedSelectedSlug = slugify(selectedMemberSlug);
        
        // Find member details including Image
        const member = Array.isArray(team)
            ? team.find(m => {
                const normalizedMemberName = normalizeText(m.name);
                const memberSlug = slugify(m.name);
                return (selectedName && normalizedMemberName === normalizedSelectedName) ||
                       (selectedMemberSlug && memberSlug === normalizedSelectedSlug);
            })
            : { name: selectedName || selectedMemberSlug };

        setPageInfo(member);

        const selectedMemberName = member ? normalizeText(member.name) : normalizedSelectedName;

        const speeches = [];
        const articles = [];
        const news = [];
        const poems = [];
        const voices = [];

        // Process Posts
        if (Array.isArray(posts)) {
            posts.forEach(post => {
                const authorText = normalizeText(post.author || '');
                if (authorText !== selectedMemberName && !authorText.includes(selectedMemberName)) return;

                const postType = String(post.type || 'news').toLowerCase();
                const item = {
                    title: post.title || 'Untitled',
                    displayDate: post.displayDate || post.date || '',
                    date: post.date || '',
                    excerpt: post.excerpt || stripHtml(post.content || '').slice(0, 100),
                    url: post.slug ? `news-article.html?slug=${encodeURIComponent(post.slug)}` : 'news-article.html',
                    typeLabel: postType.charAt(0).toUpperCase() + postType.slice(1)
                };

                if (postType === 'poem') poems.push(item);
                else if (postType === 'article') articles.push(item);
                else news.push(item);
            });
        }

        // Process Speeches
        const speechItems = Array.isArray(speechesData.speeches) ? speechesData.speeches : [];
        speechItems.forEach(speech => {
            const authorText = normalizeText(speech.authorName || '');
            if (authorText !== selectedMemberName && !authorText.includes(selectedMemberName)) return;

            speeches.push({
                title: speech.title || 'Untitled Speech',
                displayDate: speech.displayDate || speech.date || '',
                date: speech.date || '',
                excerpt: stripHtml(speech.content || '').slice(0, 100),
                typeLabel: 'Speech',
                url: `speech-detail.html?id=${encodeURIComponent(speech.id)}`
            });
        });

        // Process Voices - Preserve cardLabel from JSON
        const voiceItems = Array.isArray(voiceData) ? voiceData : [];
        voiceItems.forEach(voice => {
            const authorText = normalizeText(voice.authorName || voice.name || '');
            if (authorText !== selectedMemberName && !authorText.includes(selectedMemberName)) return;

            // Get display label using cardLabel if available
            const displayLabel = getDisplayLabel(voice);
            
            voices.push({
                id: voice.id,
                title: voice.title || 'Untitled Voice',
                displayDate: voice.displayDate || voice.date || '',
                date: voice.date || '',
                excerpt: voice.excerptHtml || stripHtml(voice.content || '').slice(0, 100),
                typeLabel: displayLabel,  // Use cardLabel for the badge
                cardLabel: voice.cardLabel, // Preserve original cardLabel
                type: voice.type,           // Preserve original type as fallback
                url: `voice-article.html?id=${encodeURIComponent(voice.id)}`
            });
        });

        // Sorting & Rendering
        const dateSort = (a, b) => new Date(b.date || 0) - new Date(a.date || 0);
        [speeches, articles, news, poems, voices].forEach(arr => arr.sort(dateSort));

        renderSection(speechesSection, speechesGrid, speeches, `No speeches found.`);
        renderSection(articlesSection, articlesGrid, articles, `No articles found.`);
        renderSection(newsSection, newsGrid, news, `No news items found.`);
        renderSection(poemsSection, poemsGrid, poems, `No poems found.`);
        renderSection(voicesSection, voicesGrid, voices, `No voices found.`, true); // true for voice section

        // Stats & Filters
        const counts = { 
            speeches: speeches.length, 
            articles: articles.length, 
            news: news.length, 
            poems: poems.length,
            voices: voices.length 
        };
        const totalContributions = counts.speeches + counts.articles + counts.news + counts.poems + counts.voices;

        if (totalContributions === 0) {
            if (noContributionsSection) noContributionsSection.hidden = false;
            if (contributionStats) contributionStats.textContent = '';
            if (filterButtons) filterButtons.hidden = true;
        } else {
            if (noContributionsSection) noContributionsSection.hidden = true;
            if (filterButtons) filterButtons.hidden = false;
        }

        if (window.updateContributionStats) updateContributionStats(counts);
        if (typeof updateFilterButtons === 'function') updateFilterButtons(counts);

    } catch (error) {
        console.error("Error loading board member content:", error);
    }

    // Helper to update UI filters and handle scrolling
    function updateFilterButtons(counts) {
        if (!filterButtons) return;
        const totalContributions = counts.speeches + counts.articles + counts.news + counts.poems + counts.voices;
        filterButtons.innerHTML = '';
        filterButtons.hidden = totalContributions === 0;
        
        const filterOptions = ['all', 'speeches', 'articles', 'news', 'poems', 'voices'];
        
        filterOptions.forEach(key => {
            if (totalContributions === 0 && key === 'all') return;
            if (key !== 'all' && counts[key] === 0) return; 
            
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `btn secondary ${activeFilter === key ? 'active' : ''}`;
            btn.style.borderRadius = "20px";
            btn.style.marginRight = "5px";
            
            // Get display name with emoji for voice
            let displayName = key === 'all' ? 'All' : `${key.charAt(0).toUpperCase() + key.slice(1)} (${counts[key]})`;
            if (key === 'voices') displayName = `🎤 Voices (${counts[key]})`;
            if (key === 'speeches') displayName = `🎙️ Speeches (${counts[key]})`;
            if (key === 'articles') displayName = `📝 Articles (${counts[key]})`;
            if (key === 'news') displayName = `📰 News (${counts[key]})`;
            if (key === 'poems') displayName = `📖 Poems (${counts[key]})`;
            
            btn.textContent = displayName;
            
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                activeFilter = key;
                
                // Toggle visibility
                visibleSections.forEach(s => {
                    if (sectionMap[s]) {
                        sectionMap[s].hidden = (key !== 'all' && key !== s);
                    }
                });

                updateFilterButtons(counts);
                btn.blur();

                // --- Scroll Logic ---
                setTimeout(() => {
                    let targetElement;
                    if (key === 'all') {
                        const firstVisibleSection = Object.values(sectionMap).find(sec => sec && !sec.hidden);
                        targetElement = firstVisibleSection ? firstVisibleSection.querySelector('h2') || firstVisibleSection : null;
                    } else {
                        const section = sectionMap[key];
                        targetElement = section ? section.querySelector('h2') || section : null;
                    }

                    if (targetElement) {
                        const header = document.querySelector('.site-header');
                        const announcementBar = document.querySelector('.announcement-bar');
                        let headerOffset = 0;

                        if (header instanceof HTMLElement) headerOffset += header.offsetHeight;
                        if (announcementBar instanceof HTMLElement && announcementBar.offsetHeight > 0) headerOffset += announcementBar.offsetHeight;
                        headerOffset += 12; // small padding for visual spacing

                        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerOffset;
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                }, 50); // Small delay to allow 'hidden' state to update in DOM
            });
            
            filterButtons.appendChild(btn);
        });
    }

    // Helper to update contribution stats (if window.updateContributionStats exists)
    function updateContributionStats(counts) {
        if (!contributionStats) return;
        const total = counts.speeches + counts.articles + counts.news + counts.poems + counts.voices;
        if (total === 0) {
            contributionStats.innerHTML = '';
            return;
        }
        
        let statsHtml = `<span class="stat-badge">📊 Total Contributions: ${total}</span>`;
        if (counts.speeches > 0) statsHtml += `<span class="stat-badge">🎙️ Speeches: ${counts.speeches}</span>`;
        if (counts.articles > 0) statsHtml += `<span class="stat-badge">📝 Articles: ${counts.articles}</span>`;
        if (counts.news > 0) statsHtml += `<span class="stat-badge">📰 News: ${counts.news}</span>`;
        if (counts.poems > 0) statsHtml += `<span class="stat-badge">📖 Poems: ${counts.poems}</span>`;
        if (counts.voices > 0) statsHtml += `<span class="stat-badge">🎤 Voices: ${counts.voices}</span>`;
        
        contributionStats.innerHTML = statsHtml;
    }
})();