// config/environment.js
const config = {
  // URL de l'API
  api: {
    baseURL: process.env.REACT_APP_API_URL || 
            (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api'),
    timeout: 30000,
    retryAttempts: 3
  },
  
  // Features flags
  features: {
    enableLogs: process.env.NODE_ENV === 'development',
    enableAnalytics: process.env.NODE_ENV === 'production',
    enableDebug: process.env.REACT_APP_DEBUG === 'true'
  },
  
  // Performance
  performance: {
    debounceDelay: 300,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    lazyLoadOffset: 100 // pixels avant chargement
  }
};

export default config;