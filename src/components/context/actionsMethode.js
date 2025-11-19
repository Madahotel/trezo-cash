import axios from '../config/Axios';

export async function apiGet(url) {
  try {
    const res = await axios.get(url);
    if (res.data.status === 200) {
      return res.data;
    } else {
      throw new Error(`Statut inattendu: ${res.data.message}`);
    }
  } catch (error) {
    console.error('Erreur API GET:', error);
    throw error;
  }
}

export async function apiPost(url, formData) {
  try {
    const res = await axios.post(url, formData);
    if (res.data.status === 200) {
      return res.data;
    } else {
      throw new Error(`Statut inattendu: ${res.data.message}`);
    }
  } catch (error) {
    console.error('Erreur API POST:', error);
    throw error;
  }
}

export async function apiUpdate(url, formData) {
  try {
    const res = await axios.patch(url, formData);
    if (res.data.status === 200) {
      return res.data; // Retourne tout res.data comme les autres
    } else {
      throw new Error(`Statut inattendu: ${res.data.message}`);
    }
  } catch (error) {
    console.error('Erreur API UPDATE:', error);
    throw error;
  }
}

export async function apiDelete(url) {
  try {
    const res = await axios.delete(url); // Correction : delete au lieu de patch
    if (res.data.status === 200) {
      return res.data; // Retourne tout res.data comme les autres
    } else {
      throw new Error(`Statut inattendu: ${res.data.message}`);
    }
  } catch (error) {
    console.error('Erreur API DELETE:', error);
    throw error;
  }
}
