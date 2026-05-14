/**
 * D1 Integration Script
 * 
 * This script integrates the Frontend with Cloudflare D1 database.
 * Fetches ONLY from D1 - no fallback to local JSON files.
 * 
 * Setup Required:
 * 1. Deploy the updated cloudflare-backend with the new /api/d1 routes
 * 2. Include this script in your HTML files after main.js
 * 
 * <script src="assets/js/main.js"></script>
 * <script src="assets/js/d1-client.js"></script>
 * <script src="scripts/d1-integration.js"></script>
 */

// Override the loadPosts function in main.js to fetch ONLY from D1
(function() {
  'use strict';
  
const D1_API_BASE = 'https://jeevajyothi-api.ssste.workers.dev/api/d1';
  
  // Override loadPosts - D1 only, no fallback
  window.loadPosts = async function() {
    try {
      const response = await fetch(`${D1_API_BASE}/type/posts`);
      if (!response.ok) {
        throw new Error('Failed to fetch from D1: ' + response.status);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error('D1 query failed: ' + result.error);
      }
      console.log('[D1] Loaded posts from D1:', result.data.length);
      return result.data.map(item => {
        // Transform D1 data format to match frontend format
        const d = item.data;
        return {
          title: d.title,
          slug: item.slug || (d.slug || ''),
          date: d.date,
          displayDate: d.displayDate || d.date,
          tags: d.tags || [],
          excerpt: d.excerptHtml || d.excerpt || '',
          excerptHtml: d.excerptHtml || d.excerpt || '',
          cover: d.cover || (d.coverImages && d.coverImages[0]) || '',
          featured: item.isFeatured || d.featured || false,
          contentHtml: d.contentHtml || '',
          coverImages: d.coverImages || [],
          type: d.type || d.contentType || 'news',
          language: d.language || item.language || 'English',
          author: d.author || ''
        };
      });
    } catch (error) {
      console.error('[D1] Posts fetch failed:', error);
      // Return empty array instead of falling back to local
      return [];
    }
  };
  
  // Override readSiteData - D1 only, no fallback
  window.readSiteData = async function() {
    try {
      // Fetch site settings
      const siteResponse = await fetch(`${D1_API_BASE}/site`);
      if (!siteResponse.ok) {
        throw new Error('Failed to fetch site from D1: ' + siteResponse.status);
      }
      const siteResult = await siteResponse.json();
      if (!siteResult.success) {
        throw new Error('D1 site query failed: ' + siteResult.error);
      }
      console.log('[D1] Loaded site data from D1');
      
      // Fetch navigators
      const navResponse = await fetch(`${D1_API_BASE}/navigators`);
      const navResult = navResponse.ok ? await navResponse.json() : { success: false };
      
      // Fetch about
      const aboutResponse = await fetch(`${D1_API_BASE}/about`);
      const aboutResult = aboutResponse.ok ? await aboutResponse.json() : { success: false };
      
      return {
        ...siteResult.data.data,
        other: siteResult.data.data,
        navigators: navResult.success ? navResult.data.data : null,
        about: aboutResult.success ? aboutResult.data.data : null
      };
    } catch (error) {
      console.error('[D1] Site data fetch failed:', error);
      // Return empty object instead of falling back to local
      return {};
    }
  };
  
  // Add helper to check D1 status
  window.checkD1Status = async function() {
    try {
      const response = await fetch(D1_API_BASE.replace('/api/d1', '/health'));
      if (response.ok) {
        const result = await response.json();
        return { available: true, status: result };
      }
    } catch (error) {
      return { available: false, error: error.message };
    }
    return { available: false };
  };
  
  console.log('[D1 Integration] Initialized. API:', D1_API_BASE);
})();
