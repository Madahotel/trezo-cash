import axios from '../components/config/Axios';

class ApiService {
  constructor() {
    this.client = axios; 
  }

  async get(endpoint, configOptions = {}) {
    const response = await this.client.get(endpoint, configOptions);
    return response.data;
  }

  async post(endpoint, data = {}, configOptions = {}) {
    const response = await this.client.post(endpoint, data, configOptions);
    return response.data;
  }

  async put(endpoint, data = {}, configOptions = {}) {
    const response = await this.client.put(endpoint, data, configOptions);
    return response.data;
  }

  async delete(endpoint, configOptions = {}) {
    const response = await this.client.delete(endpoint, configOptions);
    return response.data;
  }
}

export const apiService = new ApiService();
