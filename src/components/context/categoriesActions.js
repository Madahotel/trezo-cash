import axios from '../config/Axios';

export async function getCategories() {
  try {
    const res = await axios.get(`/categories`);
    if (res.data.status === 200) {
      return res.data;
    } else {
      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du budget:', error);
    throw error;
  }
}
export async function getSubCategories() {
  try {
    const res = await axios.get(`/sub-categories`);
    if (res.data.status === 200) {
      return res.data;
    } else {
      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du budget:', error);
    throw error;
  }
}
