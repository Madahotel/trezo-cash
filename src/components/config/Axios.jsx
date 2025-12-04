import Axios from "axios";

const axios = Axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

axios.interceptors.request.use(config => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 429 && !originalRequest._retry) {
      console.warn('Rate limit détecté, attente avant retry...');
      
      originalRequest._retry = true;
      
      const retryCount = originalRequest._retryCount || 0;
      const baseDelay = Math.pow(2, retryCount) * 1000;
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      
      originalRequest._retryCount = retryCount + 1;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (retryCount < 2) {
        return axios(originalRequest);
      } else {
        console.error('Nombre maximum de retries atteint pour', originalRequest.url);
        throw new Error('Nombre maximum de tentatives atteint. Veuillez réessayer plus tard.');
      }
    }
    
    if (error.response?.status === 401) {
      console.warn('Session expirée, redirection vers login');
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    }
    
    if (error.response) {
      console.error('Erreur API:', {
        status: error.response.status,
        url: error.config.url,
        method: error.config.method,
        message: error.response.data?.message || error.message
      });
    }
    
    return Promise.reject(error);
  }
);

export default axios;