// Service API générique avec axios
import axios from '../components/config/Axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; // URL COMPLÈTE de votre API Laravel

class ApiService {
  constructor() {
    this.client = axios;
    this.baseURL = API_BASE_URL;
  }

  async get(endpoint) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🔍 GET ${url}`);
    const response = await this.client.get(url);
    return response.data;
  }

  async post(endpoint, data) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🔍 POST ${url}`, data);
    try {
      const response = await this.client.post(url, data);
      console.log(`✅ POST ${url} - Success:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ POST ${url} - Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  async put(endpoint, data) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🔍 PUT ${url}`, data);
    const response = await this.client.put(url, data);
    return response.data;
  }

  async delete(endpoint) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🔍 DELETE ${url}`);
    const response = await this.client.delete(url);
    return response.data;
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    try {
      const config = { method, url };
      if (data) config.data = data;
      
      console.log(`🔍 ${method} ${url}`, data);
      const response = await this.client(config);
      console.log(`✅ ${method} ${url} - Success:`, response.data);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`❌ ${method} ${url} - Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        validationErrors: error.response?.data?.errors
      };
    }
  }
}

export const apiService = new ApiService();