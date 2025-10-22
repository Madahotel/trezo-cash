// Service API générique avec axios
import axios from '../components/config/Axios';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.client = axios;
  }

  async get(endpoint) {
    console.log(`🔍 GET ${endpoint}`);
    const response = await this.client.get(endpoint);
    return response.data;
  }

  async post(endpoint, data) {
    console.log(`🔍 POST ${endpoint}`, data);
    try {
      const response = await this.client.post(endpoint, data);
      console.log(`✅ POST ${endpoint} - Success:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ POST ${endpoint} - Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  async put(endpoint, data) {
    console.log(`🔍 PUT ${endpoint}`, data);
    const response = await this.client.put(endpoint, data);
    return response.data;
  }

  async delete(endpoint) {
    console.log(`🔍 DELETE ${endpoint}`);
    const response = await this.client.delete(endpoint);
    return response.data;
  }

  async request(method, endpoint, data = null) {
    try {
      const config = { method, url: endpoint };
      if (data) config.data = data;
      
      console.log(`🔍 ${method} ${endpoint}`, data);
      const response = await this.client(config);
      console.log(`✅ ${method} ${endpoint} - Success:`, response.data);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`❌ ${method} ${endpoint} - Error:`, {
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