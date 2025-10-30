// api/dashboardSettings.js
import axios from '../config/Axios';

export async function getDashboardSetting(idProjet) {
  try {
    const res = await axios.get(`/projects/${idProjet}/dashboard/setting`);
    if (res.data.status === 200) {
      return res.data.setting;
    } else {
      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    throw error;
  }
}

export async function updateDashboardSetting(idProjet, idSetting, status) {
  try {
    const settingData = {
      id: idSetting,
      project_id: idProjet,
      status: status,
    };

    const res = await axios.post(
      `/projects/${idProjet}/dashboard/setting`,
      settingData
    );
    if (res.data.status === 200) {
      return res.data.message;
    } else {
      throw new Error(`Statut inattendu: ${res.data.status}`);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    throw error;
  }
}

export async function updateMultipleDashboardSettings(idProjet, settings) {
  try {
    const updates = Object.entries(settings).map(([idSetting, status]) =>
      updateDashboardSetting(idProjet, parseInt(idSetting), status)
    );

    await Promise.all(updates);
    return 'Paramètres mis à jour avec succès';
  } catch (error) {
    console.error('Erreur lors de la mise à jour multiple:', error);
    throw error;
  }
}
