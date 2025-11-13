// utils/config.js
// Configuration centralisée de l'application
export const config = {
  // API
  api: {
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 30000,
    retryAttempts: 3,
    useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    mockDelay: parseInt(import.meta.env.VITE_MOCK_DELAY) || 0
  },
  
  // Application
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Trezo Cash',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    env: import.meta.env.VITE_APP_ENV || 'development'
  },
  
  // Features
  features: {
    enableLogs: import.meta.env.DEV,
    enableDebug: import.meta.env.VITE_APP_ENV === 'development',
    enableAnalytics: import.meta.env.VITE_APP_ENV === 'production'
  },
  
  // Méthodes utilitaires
  isDevelopment: () => import.meta.env.DEV,
  isProduction: () => import.meta.env.PROD,
  getApiUrl: () => import.meta.env.VITE_API_URL
};

// Log de la configuration au chargement
if (import.meta.env.DEV) {
  console.log('🚀 Configuration application:', {
    environment: config.app.env,
    apiUrl: config.api.baseURL,
    mockData: config.api.useMockData
  });
}

export default config;