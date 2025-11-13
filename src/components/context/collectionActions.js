import axios from '../config/Axios';

export async function getBudgets(projectId) {
  try {
    const res = await axios.get(`/schedules/budgets/project/${projectId}`);
    if (res.data.status === 200) {
      return res.data;
    } else {
      throw new Error(`Statut inattendu: ${res.data.message}`);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:az', error);
    throw error;
  }
}
export async function getCollection(budgetId, dateCollection) {
  try {
    // Utilisez le même nom de paramètre que dans la route Laravel
    const res = await axios.get(
      `/schedules/budgets/${budgetId}/date/${dateCollection}`
    );
    if (res.data.status === 200) {
      return res.data;
    } else {
      throw new Error(`Statut inattendu: ${res.data.message}`);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des collections:', error);
    throw error;
  }
}
export async function saveCollection(collectionData) {
  try {
    const res = await axios.post('/schedules/collections', collectionData);

    if (res.data.status === 200) {
      return res.data;
    } else {
      throw new Error(
        res.data.message || `Statut inattendu: ${res.data.status}`
      );
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la collection:', error);
    throw error;
  }
}
