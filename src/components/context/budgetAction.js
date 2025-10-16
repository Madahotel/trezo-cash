import axios from '../config/Axios';

export async function getBudget(idProjet) {
  try {
    const res = await axios.get(`/budget-projects/${idProjet}`);
    if (res.data.status === 200) {
      return res.data;
    } else {
      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du budget:', error);
    throw error; // Relancer l'erreur pour que l'appelant puisse la gérer
  }
}
