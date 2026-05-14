/**
 * VERSION MANAGEMENT
 * 
 * This single file controls all cache busting for the website.
 * Change APP_VERSION here to refresh all caches for users.
 * 
 * SETTINGS:
 * - APP_VERSION: Hardcoded version string (change this number to force cache refresh)
 * - USE_DYNAMIC_VERSION: Set to true to always use timestamp (for development)
 */
(function() {
  'use strict';

  // ============================================
  // CHANGE THIS NUMBER TO REFRESH ALL CACHES
  // ============================================
  const APP_VERSION = '20260430'; // Format: YYYYMMDD
  
  // Set to true during development to always get fresh files
  const USE_DYNAMIC_VERSION = false;

  /**
   * Get the current version string
   * @returns {string} Version string or timestamp
   */
  function getCacheVersion() {
    return USE_DYNAMIC_VERSION ? Date.now().toString() : APP_VERSION;
  }

  /**
   * Add version parameter to any URL
   * @param {string} url - The URL to add version to
   * @returns {string} URL with version parameter
   */
  function addVersionParam(url) {
    const v = getCacheVersion();
    const separator = url.includes('?') ? '&' : '?';
    return url + separator + 'v=' + v;
  }

  // ============================================
  // Export to window for global access
  // ============================================
  window.APP_VERSION = APP_VERSION;
  window.USE_DYNAMIC_VERSION = USE_DYNAMIC_VERSION;
  window.getCacheVersion = getCacheVersion;
  window.addVersionParam = addVersionParam;

  console.log('[Version] Cache version:', getCacheVersion());
})();
