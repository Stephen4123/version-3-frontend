/**
 * API Configuration
 * Environment-aware configuration for frontend API endpoints
 */

const getApiConfig = () => {
  const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  
  return {
    // Use local backend for development, Cloudflare Worker proxy for production
    baseUrl: isDevelopment 
      ? 'http://localhost:3000/api/public'
      : 'https://api.jeevajyothimedia.com/api/public',
    
    // Render backend URL (for direct requests if needed)
    backendUrl: 'https://jeevajyothi-backend.onrender.com/api/public',
    
    // Timeout for API requests (ms)
    timeout: 10000,
    
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000,
    
    // Cache duration for GET requests (ms)
    cacheDuration: 5 * 60 * 1000, // 5 minutes
  };
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = getApiConfig;
}

// Export as global for inline scripts
window.getApiConfig = getApiConfig;
