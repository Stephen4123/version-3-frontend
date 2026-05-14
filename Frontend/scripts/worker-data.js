// Worker data helper for fetching JSON-like collections via Cloudflare Worker
// Worker expects: GET https://jeevajyothi-api.ssste.workers.dev/?type=<CollectionType>

(function () {
  'use strict';

  const WORKER_BASE_URL = 'https://jeevajyothi-api.ssste.workers.dev';
  const COLLECTION_TYPE_BY_FILENAME = {
    about: 'About',
    contact: 'Contact',
    'core-team': 'CoreTeam',
    logo: 'Logo',
    navigators: 'Navigators',
    notices: 'Notice',
    posts: 'Posts',
    'program-guide': 'Program Guide',
    quotes: 'Quotes',
    site: 'Site',
    speeches: 'Speeches',
    videos: 'Videos',
    'voice-contributors': 'Contributors',
    'voice-hub': 'Voice Hub Data',
    whatsapp: 'Whatsapp',
    obituaries: 'Obituaries',
  };

  function buildWorkerUrl(type) {
    const safeType = encodeURIComponent(String(type || '').trim());
    return `${WORKER_BASE_URL}/?type=${safeType}`;
  }

  async function fetchWorkerCollection(type, options = {}) {
    const url = buildWorkerUrl(type);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        ...options,
      });

      if (!res.ok) {
        throw new Error(`Worker responded with ${res.status} for type=${type}`);
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.error('[Worker fetch failed]', { type, url, err });
      throw err;
    }
  }

  // Many existing local JSON endpoints returned either an array or an object.
  // We keep that behavior via the parser below.
  function normalizeWorkerPayload(type, payload) {
    // Your Worker currently returns an array of documents as documents.
    // But sometimes it may return wrapper JSON depending on how it evolved.
    if (Array.isArray(payload)) return payload;

    if (payload && Array.isArray(payload.documents)) return payload.documents;

    // If worker returns { success: true, data: ... } style
    if (payload && payload.success === true) {
      if (Array.isArray(payload.data)) return payload.data;
      if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
      if (payload.data && Array.isArray(payload.data.items)) return payload.data.items;
      if (payload.data && payload.data.data && !Array.isArray(payload.data.data)) return [payload.data.data];
      if (payload.data && payload.data.items && !Array.isArray(payload.data.items)) return [payload.data.items];
    }

    // If worker returns { documents: [...] } and we need type-specific structure
    if (payload && payload.documents) return payload.documents;

    // Fallback: return as-is
    return payload;
  }

  // Convenience wrapper: returns fallback when worker fails.
  async function fetchWorkerJson(type, fallback) {
    try {
      const payload = await fetchWorkerCollection(type);
      return normalizeWorkerPayload(type, payload);
    } catch (e) {
      return fallback;
    }
  }

  // Export
  window.WorkerData = {
    WORKER_BASE_URL,
    buildWorkerUrl,
    fetchWorkerCollection,
    normalizeWorkerPayload,
    fetchWorkerJson,
  };

  console.log('WorkerData helper loaded');
})();

