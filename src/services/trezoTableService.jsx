import axios from '../components/config/Axios'; // Votre instance Axios

export const trezoTableService = {
  // Récupérer les données du projet
  getProjectData: async (projectId) => {
    try {
      const response = await axios.get(`/trezo-tables/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données du projet:', error);
      throw error;
    }
  },

  // Optionnel: Autres méthodes pour POST, PUT, DELETE
  createBudgetEntry: async (projectId, data) => {
    const response = await axios.post(`/trezo-tables/projects/${projectId}/entries`, data);
    return response.data;
  },

  updateBudgetEntry: async (projectId, entryId, data) => {
    const response = await axios.put(`/trezo-tables/projects/${projectId}/entries/${entryId}`, data);
    return response.data;
  },

  deleteBudgetEntry: async (projectId, entryId) => {
    const response = await axios.delete(`/trezo-tables/projects/${projectId}/entries/${entryId}`);
    return response.data;
  }
};