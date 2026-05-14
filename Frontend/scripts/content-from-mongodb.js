/**
 * Content Loader for MongoDB
 * This script provides functions to load content from MongoDB API
 * Usage: Include this before main.js or use the global functions
 */

(function() {
  'use strict';

  // MongoDB API Configuration
  // Update this to your MongoDB API URL or leave empty to use local JSON files
  const MONGODB_API_URL = ''; // e.g., 'http://localhost:5000/api' or deploy to render/heroku
  
  // Set to true to prefer MongoDB over local files
  const USE_MONGODB = false;

  /**
   * Fetch content from MongoDB API
   */
  async function fetchFromMongoDB(section) {
    if (!MONGODB_API_URL || !USE_MONGODB) {
      return null;
    }

    try {
      const response = await fetch(`${MONGODB_API_URL}/content/${section}`, {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`MongoDB fetch failed for ${section}: ${response.status}`);
        return null;
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log(`Loaded ${section} from MongoDB`);
        // Convert MongoDB data structure to array if needed
        if (result.data.data && Array.isArray(result.data.data)) {
          return result.data.data;
        }
        // If data is an object with items array
        if (result.data.items && Array.isArray(result.data.items)) {
          return result.data.items;
        }
        // Return as array with single item
        return [result.data];
      }
      return null;
    } catch (error) {
      console.warn(`MongoDB fetch error for ${section}:`, error.message);
      return null;
    }
  }

  /**
   * Load posts - tries MongoDB first, falls back to local JSON
   */
  async function loadPostsFromMongoDB() {
    const mongoPosts = await fetchFromMongoDB('posts');
    if (mongoPosts) {
      return mongoPosts;
    }

    // Fallback to local JSON
    return loadPostsLocal();
  }

  /**
   * Fallback: Load posts from local JSON
   * This mirrors the original loadPosts function from main.js
   */
  async function loadPostsLocal() {
    try {
      const response = await fetch(`data/posts.json?t=${Date.now()}`);
      if (response.ok) {
        const localPosts = await response.json();
        if (Array.isArray(localPosts) && localPosts.length) {
          return localPosts.map(normalizePost);
        }
      }
    } catch (error) {
      console.warn('Local posts load failed:', error);
    }

    try {
      const site = await readSiteDataLocal();
      if (site && Array.isArray(site.posts) && site.posts.length) {
        return site.posts.map(normalizePost);
      }
    } catch (error) {
      console.warn('Fallback posts load failed:', error);
    }

    return [];
  }

  /**
   * Normalize post data for consistent structure
   */
  function normalizePost(post) {
    return {
      title: post.title,
      slug: post.slug,
      date: post.date,
      displayDate: post.displayDate || post.date,
      tags: post.tags || [],
      excerpt: post.excerptHtml || post.excerpt || '',
      excerptHtml: post.excerptHtml || post.excerpt || '',
      cover: post.cover || (post.coverImages && post.coverImages[0]) || '',
      featured: !!post.featured,
      contentHtml: post.contentHtml || '',
      coverImages: post.coverImages || [],
      type: post.type || post.contentType || 'news',
      language: post.language || 'English',
      author: post.author || ''
    };
  }

  /**
   * Load site data - tries MongoDB first, falls back to local JSON
   */
  async function loadSiteFromMongoDB() {
    const mongoSite = await fetchFromMongoDB('site');
    if (mongoSite) {
      return mongoSite[0] || mongoSite;
    }

    return loadSiteDataLocal();
  }

  /**
   * Fallback: Load site data from local JSON
   */
  async function loadSiteDataLocal() {
    const LS_KEY = 'site.data.v1';
    
    try {
      const response = await fetch(`data/site.json?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(LS_KEY, JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.warn('Site data fetch failed:', error);
    }

    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Local site data parse failed:', error);
      return null;
    }
  }

  /**
   * Load videos from MongoDB or local
   */
  async function loadVideosFromMongoDB() {
    const mongoVideos = await fetchFromMongoDB('videos');
    if (mongoVideos) {
      return mongoVideos;
    }

    try {
      const response = await fetch(`data/videos.json?t=${Date.now()}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Local videos load failed:', error);
    }

    return [];
  }

  /**
   * Load obituaries from MongoDB or local
   */
  async function loadObituariesFromMongoDB() {
    const mongoObituaries = await fetchFromMongoDB('obituaries');
    if (mongoObituaries) {
      return mongoObituaries;
    }

    try {
      const response = await fetch(`data/obituaries.json?t=${Date.now()}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Local obituaries load failed:', error);
    }

    return [];
  }

  /**
   * Load specific content section from MongoDB or local
   */
  async function loadContentFromMongoDB(section) {
    const mongoContent = await fetchFromMongoDB(section);
    if (mongoContent) {
      return mongoContent;
    }

    try {
      const response = await fetch(`data/${section}.json?t=${Date.now()}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Local ${section} load failed:`, error);
    }

    return section === 'videos' || section === 'obituaries' ? [] : null;
  }

  // Export to global scope
  window.loadPostsFromMongoDB = loadPostsFromMongoDB;
  window.loadSiteFromMongoDB = loadSiteFromMongoDB;
  window.loadVideosFromMongoDB = loadVideosFromMongoDB;
  window.loadObituariesFromMongoDB = loadObituariesFromMongoDB;
  window.loadContentFromMongoDB = loadContentFromMongoDB;
  window.fetchFromMongoDB = fetchFromMongoDB;
  window.normalizePost = normalizePost;

  console.log('MongoDB content loader loaded');
  console.log('USE_MONGODB:', USE_MONGODB);
  console.log('MONGODB_API_URL:', MONGODB_API_URL || '(not configured)');
})();
