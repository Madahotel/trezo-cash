import axios from '../config/Axios';

export async function getUserThirdParty() {
  try {
    const res = await axios.get(`/users/collaborators/thirdParty`);
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
export async function getUserFinancials() {
  try {
    const res = await axios.get(`/users/collaborators/financials`);
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

export async function storeTiers(formData) {
  try {
    const res = await axios.post(`/users/collaborators`, formData);

    console.log('Réponse reçue:', res);

    if (res.data.status === 200) {
      return res.data.message;
    } else {
      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error('Erreur détaillée:', error.response || error);
    throw error;
  }
}
export async function updateTiers(formData, id) {
  console.log(formData);
  console.log(id);

  try {
    const res = await axios.patch(`/users/collaborators/${id}`, formData);

    console.log('Réponse reçue:', res);

    if (res.data.status === 200) {
      return res.data.message;
    } else {
      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error('Erreur détaillée:', error.response || error);
    throw error;
  }
}
