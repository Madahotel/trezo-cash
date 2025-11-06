import axios from "../config/Axios";

export async function getBudget(idProjet) {
  try {
    const res = await axios.get(`/budget-projects/${idProjet}`);
    if (res.data.status === 200) {
      return res.data;
    } else {
      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du budget:", error);
    throw error; // Relancer l'erreur pour que l'appelant puisse la gérer
  }
}
export async function getOptions() {
  try {
    const res = await axios.get(`/budget-projects/options`);
    if (res.data.status === 200) {
      return res.data;
    } else {
      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du budget:", error);
    throw error; // Relancer l'erreur pour que l'appelant puisse la gérer
  }
}
export async function showEditBudget(budgetId) {
  try {
    const res = await axios.get(`/budget-projects/budgets/${budgetId}`);
    if (res.data.status === 200) {
      return res.data;
    } else {
      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du budget:", error);
    throw error;
  }
}

export async function storeBudget(formData, idProjet) {
  try {
    console.log("URL appelée:", `/budget-projects/${idProjet}`);
    console.log("Données envoyées:", formData);

    const res = await axios.post(`/budget-projects/${idProjet}`, formData);

    console.log("Réponse reçue:", res);

    if (res.data.status === 200) {
      return res.data.message;
    } else {
      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error("Erreur détaillée:", error.response || error);
    throw error; // Relancer l'erreur pour mieux la gérer
  }
}
export async function addTiers(formData) {
  try {
    const res = await axios.post(`/users/third-parties`, formData);
    if (res.data.status === 200) {
      return res.data.id;
    } else {
      console.log(res.data.status);

      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error(error);
  }
}
export async function updateBudget(formData, budgetId) {
  try {
    const res = await axios.patch(
      `/budget-projects/budgets/${budgetId}`,
      formData
    );
    // if (res.data.status === 200) {
    //   return res.data.id;
    // } else {
    //   console.log(res.data.status);

    //   throw new Error(`Statut inattendu: ${res.data.status}`);
    // }
  } catch (error) {
    console.error(error);
  }
}
export async function destroyBudget(budgetId) {
  try {
    const res = await axios.delete(`/budget-projects/budgets/${budgetId}`);
    if (res.data.status === 200) {
      return res.data.message;
    } else {
      throw new Error(`Statut inattendu: ${res.data.message}`);
    }
  } catch (error) {
    console.error(error);
  }
}
