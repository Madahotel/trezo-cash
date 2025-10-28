import { apiService } from '../utils/ApiService';

class BudgetEntryService {
  endpoints = {
    budgetEntries: '/budget-entries',
    actualTransactions: '/actual-transactions',
    tiers: '/tiers',
  };

  async createEntry(entryData) {
    return await apiService.post(this.endpoints.budgetEntries, entryData);
  }

  async updateEntry(entryId, entryData) {
    return await apiService.put(`${this.endpoints.budgetEntries}/${entryId}`, entryData);
  }

  async deleteEntry(entryId) {
    return await apiService.delete(`${this.endpoints.budgetEntries}/${entryId}`);
  }

  async getEntryActuals(entryId) {
    return await apiService.get(
      `${this.endpoints.actualTransactions}?budget_entry_id=${entryId}`
    );
  }

  async createTier(tierData) {
    return await apiService.post(this.endpoints.tiers, tierData);
  }

  async findTierByName(name, type) {
    const response = await apiService.get(
      `${this.endpoints.tiers}?name=${encodeURIComponent(name)}&type=${type}`
    );
    return response.data?.[0] || null;
  }
}

export const budgetEntryService = new BudgetEntryService();