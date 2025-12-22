import axios from '../config/Axios';

export async function apiGet(url) {
  try {
    const res = await axios.get(url);
    return res.data; // ⬅️ TOUJOURS retourner les données
  } catch (error) {
    console.error("Erreur API GET:", error);
    throw error;
  }
}

export async function apiPost(url, formData) {
  try {
    const res = await axios.post(url, formData);
    return res.data; // ⬅️ idem
  } catch (error) {
    console.error("Erreur API POST:", error);
    throw error;
  }
}

export async function apiUpdate(url, formData) {
  try {
    const res = await axios.patch(url, formData);
    if (res.data.status === 200) {
      return res.data; // Retourne tout res.data comme les autres
    }
  } catch (error) {
    console.error('Erreur API UPDATE:', error);
    throw error;
  }
}

export async function apiDelete(url) {
  try {
    const res = await axios.delete(url);
    if (res.data.status === 200) {
      return res.data; // Retourne tout res.data comme les autres
    }
  } catch (error) {
    console.error('Erreur API DELETE:', error);
    throw error;
  }
}
