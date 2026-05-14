/**
 * D1 Database Client for Jeevajyothi Media
 * Fetches content from Cloudflare D1 instead of local JSON files
 * 
 * Usage:
 *   // In your HTML or JS:
 *   <script src="assets/js/d1-client.js"></script>
 *   <script>
 *     // Then call the functions
 *     D1Client.getPosts().then(posts => console.log(posts));
 *     D1Client.getSection('about').then(data => console.log(data));
 *   </script>
 */

// Configuration - Cloudflare Workers API connected to D1
const D1_API_BASE = window.D1_API_BASE || 'https://jeevajyothi-api.ssste.workers.dev/api/d1';

const D1Client = {
/**
   * Fetch all posts from D1 (D1 only, no fallback)
   */
  async getPosts() {
    const response = await fetch(`${D1_API_BASE}/type/posts`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'D1 query failed');
    return result.data.map(item => item.data).flat();
  },

  /**
   * Fetch all speeches from D1 (D1 only, no fallback)
   */
  async getSpeeches() {
    const response = await fetch(`${D1_API_BASE}/type/speeches`);
    if (!response.ok) throw new Error('Failed to fetch speeches');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'D1 query failed');
    return result.data.map(item => item.data).flat();
  },

  /**
   * Fetch all obituaries from D1 (D1 only, no fallback)
   */
  async getObituaries() {
    const response = await fetch(`${D1_API_BASE}/type/obituaries`);
    if (!response.ok) throw new Error('Failed to fetch obituaries');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'D1 query failed');
    return result.data.map(item => item.data).flat();
  },

  /**
   * Fetch all videos from D1 (D1 only, no fallback)
   */
  async getVideos() {
    const response = await fetch(`${D1_API_BASE}/type/videos`);
    if (!response.ok) throw new Error('Failed to fetch videos');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'D1 query failed');
    return result.data.map(item => item.data).flat();
  },

  /**
   * Fetch all quotes from D1 (D1 only, no fallback)
   */
  async getQuotes() {
    const response = await fetch(`${D1_API_BASE}/type/quotes`);
    if (!response.ok) throw new Error('Failed to fetch quotes');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'D1 query failed');
    return result.data.map(item => item.data).flat();
  },

  /**
   * Fetch content by section name (D1 only, no fallback)
   * @param {string} section - Section name (e.g., 'about', 'contact', 'site')
   */
  async getSection(section) {
    const response = await fetch(`${D1_API_BASE}/${section}`);
    if (!response.ok) throw new Error('Failed to fetch section');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'D1 query failed');
    return result.data.data;
  },

  /**
   * Fetch navigators/navigation data
   */
  async getNavigators() {
    return this.getSection('navigators');
  },

  /**
   * Fetch site settings
   */
  async getSite() {
    return this.getSection('site');
  },

  /**
   * Fetch about content
   */
  async getAbout() {
    return this.getSection('about');
  },

  /**
   * Fetch contact data
   */
  async getContact() {
    return this.getSection('contact');
  },

  /**
   * Fetch logo data
   */
  async getLogo() {
    return this.getSection('logo');
  },

  /**
   * Fetch voice contributors
   */
  async getVoiceContributors() {
    return this.getSection('voice-contributors');
  },

  /**
   * Fetch voice hub data
   */
  async getVoiceHub() {
    return this.getSection('voice-hub');
  },

  /**
   * Fetch whatsapp data
   */
  async getWhatsApp() {
    return this.getSection('whatsapp');
  },

  /**
   * Fetch core team
   */
  async getCoreTeam() {
    return this.getSection('core-team');
  },

  /**
   * Fetch notices
   */
  async getNotices() {
    return this.getSection('notices');
  },

  /**
   * Fetch all sections metadata
   */
  async getSections() {
    try {
      const response = await fetch(`${D1_API_BASE}/meta/sections`);
      if (!response.ok) throw new Error('Failed to fetch sections');
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
    } catch (error) {
      console.warn('D1 fetch failed:', error);
    }
    return null;
  },

  /**
   * Check if D1 is reachable
   */
  async checkHealth() {
    try {
      const response = await fetch(D1_API_BASE.replace('/api/d1', '/health'));
      if (response.ok) {
        const result = await response.json();
        return result.ok === true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }
};

// Export to global scope
window.D1Client = D1Client;

// Also export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = D1Client;
}

console.log('[D1] Client initialized. API:', D1_API_BASE);
