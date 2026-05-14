// Consolidated Voice Hub - Uses Speeches UI
const VOICE_HUB_CACHE = new Map();
const PUBLIC_API_BASE = window.PUBLIC_API_BASE || 'https://jeevajyothi-backend.ssste.workers.dev/api/public';

async function fetchVoiceData(cacheKey, url) {
  if (VOICE_HUB_CACHE.has(cacheKey)) return VOICE_HUB_CACHE.get(cacheKey);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    VOICE_HUB_CACHE.set(cacheKey, data);
    return data;
  } catch (e) {
    console.error('Error fetching voice data:', e);
    return [];
  }
}

// Create speech-card using Speeches UI matching styles.css structure
function createSpeechCard(voice) {
  const article = document.createElement('article');
  article.className = 'speech-card';
  article.style.cursor = 'pointer';

  const id = voice.id;
  // Keep .html extension for local development navigation
  const href = `voice-article.html?id=${encodeURIComponent(id || '')}`;
  const name = voice.authorName || voice.name || 'Anonymous';
  const image = voice.authorImage || '';
  const kicker = voice.cardLabel || voice.type || 'Voice';
  const displayDate = voice.displayDate || voice.date;

  const dateStr = displayDate ? new Date(displayDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '';

  const coverMarkup = image
    ? `<img src="${image}" alt="${escapeHtml(name)}" class="speech-author-thumb">`
    : '<span class="speech-cover-icon">🎤 Voice</span>';

  article.innerHTML = `
    <div class="speech-cover" style="background:linear-gradient(135deg, #2c3e66, #1e2a4a);color:white;display:flex;align-items:center;justify-content:center;">
      ${coverMarkup}
    </div>
    <p class="speech-card-kicker">${escapeHtml(kicker)}</p>
    <h3 class="speech-card-title">${escapeHtml(voice.title || 'Untitled')}</h3>
    <p class="meta">${escapeHtml(dateStr)}</p>
    <div class="speech-card-footer">
      <span class="speech-card-author"><strong>${escapeHtml(name)}</strong></span>
      <button class="btn share-speech-btn speech-card-share" type="button" data-id="${id || ''}">Share</button>
    </div>
  `;

  // Add click handler for navigation
  article.addEventListener('click', function(event) {
    if (!event.target.classList.contains('share-speech-btn')) {
      window.location.href = href;
    }
  });

  // Add share button handler
  const shareBtn = article.querySelector('.share-speech-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      shareVoice(voice);
    });
  }

  return article;
}

// Create home voice card (same design, for home page)
function createHomeVoiceCard(voice) {
  const article = document.createElement('article');
  article.className = 'speech-card';
  article.style.cursor = 'pointer';

  const id = voice.id;
  // Internal navigation keeps .html
  const href = `voice-article.html?id=${encodeURIComponent(id || '')}`;
  const name = voice.authorName || voice.name || 'Anonymous';
  const image = voice.authorImage || '';
  const kicker = voice.cardLabel || voice.type || 'Voice';
  const displayDate = voice.displayDate || voice.date;

  const dateStr = displayDate ? new Date(displayDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '';

  const coverMarkup = image
    ? `<img src="${image}" alt="${escapeHtml(name)}" class="speech-author-thumb" loading="lazy">`
    : '<span class="speech-cover-icon">🎤 Voice</span>';

  article.innerHTML = `
    <div class="speech-cover" style="background:linear-gradient(135deg, #2c3e66, #1e2a4a);color:white;display:flex;align-items:center;justify-content:center;">
      ${coverMarkup}
    </div>
    <p class="speech-card-kicker">${escapeHtml(kicker)}</p>
    <h3 class="speech-card-title">${escapeHtml(voice.title || 'Untitled Voice')}</h3>
    <p class="meta">${escapeHtml(dateStr)}</p>
    <div class="speech-card-footer">
      <span class="speech-card-author"><strong>${escapeHtml(name)}</strong></span>
      <button class="btn share-voice-btn" type="button" data-id="${id || ''}">Share</button>
    </div>
  `;

  // Card click navigation
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
      
      const fullText = `🛡️*${voice.title || 'Voice'}*
📝*${voice.authorName || 'Unknown'}*
🔗 ${articleUrl}

*നിങ്ങളുടെ ചിന്തകളും ലോകമറിയട്ടെ! ✍️*

*ജീവജ്യോതി മീഡിയയിലൂടെ നിങ്ങളുടെ ലേഖനങ്ങളും സന്ദേശങ്ങളും സമൂഹത്തിലേക്ക് പങ്കുവെക്കാം.*

*താഴെ കാണുന്ന ലിങ്ക് വഴി നിങ്ങളുടെ സന്ദേശങ്ങൾ ഞങ്ങൾക്ക് അയച്ചുതരൂ:*
🔗 ${submitUrl}

*നമുക്ക് ഒന്നിച്ച് നല്ലൊരു നാളെയെ വാർത്തെടുക്കാം! 🤝*
🛡️*Jeevajyothi Media* 🛡️`;
      
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

// Load recent voices for home page
async function loadHomeVoices() {
  const container = document.getElementById('home-voices-grid');
  if (!container) return;

  try {
    let voices = [];
    
    try {
      const apiResponse = await fetch(`${PUBLIC_API_BASE}/voices`);
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

    const recentVoices = voices
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
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

// Share function for voice items - NO .html in share links
function shareVoice(voice) {
  const origin = window.location.origin;
  // REMOVED .html from share URLs
  const articleUrl = `${origin}/voice-article?id=${voice.id}`;
  const submitUrl = `${origin}/voice-hub-submit`;
  
  const payload = {
    title: voice.title || 'Voice',
    text: `🛡️*${voice.title || 'Voice'}*
📝*${voice.authorName || 'Unknown'}*
🔗 ${articleUrl}

*നിങ്ങളുടെ ചിന്തകളും ലോകമറിയട്ടെ! ✍️*

*ജീവജ്യോതി മീഡിയയിലൂടെ നിങ്ങളുടെ ലേഖനങ്ങളും സന്ദേശങ്ങളും സമൂഹത്തിലേക്ക് പങ്കുവെക്കാം.*

*താഴെ കാണുന്ന ലിങ്ക് വഴി നിങ്ങളുടെ സന്ദേശങ്ങൾ ഞങ്ങൾക്ക് അയച്ചുതരൂ:*
🔗 ${submitUrl}

*നമുക്ക് ഒന്നിച്ച് നല്ലൊരു നാളെയെ വാർത്തെടുക്കാം! 🤝*
🛡️*Jeevajyothi Media* 🛡️`
  };

  if (navigator.share) {
    navigator.share(payload).catch(() => {
      fallbackCopy(payload.text);
    });
  } else {
    fallbackCopy(payload.text);
  }
}

function fallbackCopy(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    return;
  }
  const input = document.createElement('textarea');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Voice Hub Feed
async function loadVoiceHubFeed() {
  const grid = document.getElementById('voicesGrid') || document.getElementById('voice-feed');
  const countElem = document.getElementById('voiceCount') || document.getElementById('totalVoices');
  if (!grid) return;
  
  try {
    let voices = [];
    try {
      const apiResponse = await fetch(`${PUBLIC_API_BASE}/voices`);
      const apiData = await apiResponse.json();
      if (apiResponse.ok && apiData.success && Array.isArray(apiData.data)) {
        voices = apiData.data;
      }
    } catch (apiError) {
      console.warn('Public voices API unavailable, using local JSON fallback.', apiError);
    }

    if (!voices.length) {
      voices = await fetchVoiceData('voice-hub', 'data/voice-hub.json');
    }

    voices.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (countElem) countElem.textContent = `${voices.length} voice${voices.length === 1 ? '' : 's'} available`;
    
    grid.innerHTML = '';
    voices.forEach(voice => {
      const card = createSpeechCard(voice);
      grid.appendChild(card);
    });
    
    if (voices.length === 0) {
      const emptyMsg = document.getElementById('emptyVoices');
      if (emptyMsg) emptyMsg.hidden = false;
    }
  } catch (e) {
    console.error('Error loading voice hub feed:', e);
    grid.innerHTML = '<p class="error">Failed to load voices. Please try again later.</p>';
  }
}

// Make functions available globally
window.createSpeechCard = createSpeechCard;
window.createHomeVoiceCard = createHomeVoiceCard;
window.loadHomeVoices = loadHomeVoices;
window.shareVoice = shareVoice;
window.fallbackCopy = fallbackCopy;
window.loadVoiceHubFeed = loadVoiceHubFeed;
