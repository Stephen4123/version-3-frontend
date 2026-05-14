import re
from pathlib import Path

js_path = Path('assets/js/load-board-member.js')
text = js_path.read_text(encoding='utf-8')
old_fn = re.search(r"  function showNoResults\(memberName\) \{.*?\n  function setPageInfo\(memberName, memberDesignation\) \{", text, flags=re.S)
if not old_fn:
    raise SystemExit('showNoResults block not found')
new_fn = '''  function showNoResults(memberName) {
    const container = document.querySelector('.team-category .container');
    if (!container) return;
    container.innerHTML = `
      <div class="contribution-empty">
        No contributions found for <strong>${escapeHtml(memberName)}</strong> in speeches, articles, news, or poems.
      </div>
    `;
  }

  function renderSection(gridId, items, emptyText) {
    const section = document.getElementById(gridId.replace('Grid', 'Section'));
    const grid = document.getElementById(gridId);
    if (!section || !grid) return;

    section.hidden = false;
    grid.innerHTML = '';

    if (!items.length) {
      grid.innerHTML = `\n        <div class="contribution-empty">${escapeHtml(emptyText)}</div>\n      `;
      return;
    }

    items.forEach(item => grid.appendChild(createContributionCard(item)));
  }

  function setPageInfo(memberName, memberDesignation) {
    const heading = document.getElementById('memberNameHeading');
    const summary = document.getElementById('memberSummary');

    heading.textContent = memberName ? `${memberName} — Contributions` : 'Board Member Contributions';
    summary.textContent = memberName
      ? memberDesignation
        ? `Showing speeches, articles, news, and poems authored by ${memberName}. ${memberDesignation}`
        : `Showing speeches, articles, news, and poems authored by ${memberName}.`
      : 'Board member contributions from news articles, articles, poems, and speeches will appear here once a member is selected.';
  }
'''
text = text[:old_fn.start()] + new_fn + text[old_fn.end():]
block_pattern = re.compile(r"    setPageInfo\(selectedName, memberDesignation\);\n\n    const contributions = \[\];.*?    contributions\.forEach\(item => \{\n      grid\.appendChild\(createContributionCard\(item\)\);\n    \}\);\n", flags=re.S)
new_block = '''    setPageInfo(selectedName, memberDesignation);

    const speeches = [];
    const articles = [];
    const news = [];
    const poems = [];

    if (Array.isArray(postItems)) {
      postItems.forEach(post => {
        const authorText = normalizeText(post.author);
        if (authorText === normalizedSelectedName || authorText.includes(normalizedSelectedName) || normalizedSelectedName.includes(authorText)) {
          const item = {
            title: post.title || 'Untitled',
            author: post.author || selectedName,
            displayDate: post.displayDate || post.date || '',
            date: post.date || '',
            excerpt: (post.excerptHtml || '')
              .replace(/<[^>]*>/g, '')
              .trim()
              .slice(0, 120),
            typeLabel: post.type === 'poem' ? 'Poem' : post.type === 'article' ? 'Article' : 'News',
            url: post.slug ? `news-article.html?slug=${encodeURIComponent(post.slug)}` : 'news-article.html'
          };

          if (post.type === 'poem') {
            poems.push(item);
          } else if (post.type === 'article') {
            articles.push(item);
          } else {
            news.push(item);
          }
        }
      });
    }

    if (Array.isArray(speechItems)) {
      speechItems.forEach(speech => {
        const authorText = normalizeText(speech.author || speech.authorName || '');
        if (authorText === normalizedSelectedName || authorText.includes(normalizedSelectedName) || normalizedSelectedName.includes(authorText)) {
          speeches.push({
            title: speech.title || 'Untitled Speech',
            author: speech.author || speech.authorName || selectedName,
            displayDate: speech.displayDate || speech.date || '',
            date: speech.date || '',
            excerpt: (speech.excerptHtml || speech.contentHtml || '')
              .replace(/<[^>]*>/g, '')
              .trim()
              .slice(0, 120),
            typeLabel: 'Speech',
            url: speech.id ? `speech-detail.html?id=${encodeURIComponent(speech.id)}` : 'Speeches.html'
          });
        }
      });
    }

    const allContributions = [...speeches, ...articles, ...news, ...poems];
    if (!allContributions.length) {
      showNoResults(selectedName);
      return;
    }

    const dateSort = (a, b) => new Date(b.date || 0) - new Date(a.date || 0);
    speeches.sort(dateSort);
    articles.sort(dateSort);
    news.sort(dateSort);
    poems.sort(dateSort);

    renderSection('speechesGrid', speeches, `No speeches found for ${selectedName}.`);
    renderSection('articlesGrid', articles, `No articles found for ${selectedName}.`);
    renderSection('newsGrid', news, `No news items found for ${selectedName}.`);
    renderSection('poemsGrid', poems, `No poems found for ${selectedName}.`);
'''
text, count = block_pattern.subn(new_block, text)
if count != 1:
    raise SystemExit(f'Contributions block replacement count unexpected: {count}')
js_path.write_text(text, encoding='utf-8')

html_path = Path('board-member.html')
html_text = html_path.read_text(encoding='utf-8')
old_css = '''    .contribution-card-footer {
      margin-top: auto;
      padding: 0 1rem 1rem;
    }
    .contribution-card-footer a {
      color: var(--text-primary);
      font-weight: 700;
      text-decoration: none;
    }
    .contribution-empty {
      padding: 2rem 1rem;
      grid-column: 1 / -1;
      color: var(--text-secondary);
      text-align: center;
      border: 1px dashed rgba(255, 255, 255, 0.15);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.03);
    }
'''
new_css = '''    .contribution-card-footer {
      margin-top: auto;
      padding: 0 1rem 1rem;
    }
    .contribution-card-footer a {
      color: var(--text-primary);
      font-weight: 700;
      text-decoration: none;
    }
    .contribution-type-section {
      margin-top: 2rem;
    }
    .contribution-type-section h2 {
      margin: 0 0 1rem;
      font-size: 1.5rem;
      letter-spacing: 0.01em;
    }
    .contribution-empty {
      padding: 2rem 1rem;
      grid-column: 1 / -1;
      color: var(--text-secondary);
      text-align: center;
      border: 1px dashed rgba(255, 255, 255, 0.15);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.03);
    }
'''
if old_css not in html_text:
    raise SystemExit('CSS block not found')
html_text = html_text.replace(old_css, new_css)
html_path.write_text(html_text, encoding='utf-8')
print('patched')
