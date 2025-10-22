import { apiService } from '../utils/ApiService'; // Chemin vers votre ApiService

export const fetchTemplates = async ({ dataDispatch, uiDispatch }) => {
  try {
    uiDispatch({ type: 'SET_LOADING', payload: true });

    // Utilisez apiService au lieu de axios directement
    const response = await apiService.get('/templates');
    console.log('📡 Réponse API templates:', response);

    if (response.status === 200) {
      const apiData = response.templates;

      // Extraire les données de la structure paginée
      const allTemplates = [
        ...(apiData.officials?.template_official_items?.data || []),
        ...(apiData.personals?.template_personal_items?.data || []),
        ...(apiData.communities?.template_community_items?.data || []),
      ];

      console.log('📦 Templates extraits:', allTemplates);

      // Éliminer les doublons avec Map
      const templateMap = new Map();
      const duplicates = [];

      allTemplates.forEach((template) => {
        if (templateMap.has(template.id)) {
          duplicates.push(template.id);
          console.log(`⚠️ Template dupliqué: ID ${template.id} - ${template.name}`);
        } else {
          templateMap.set(template.id, template);
        }
      });

      const uniqueTemplates = Array.from(templateMap.values());

      console.log('✨ Templates uniques:', uniqueTemplates);
      if (duplicates.length > 0) {
        console.log(`🗑️ Doublons ignorés: ${duplicates.join(", ")}`);
      }

      dataDispatch({
        type: 'SET_TEMPLATES',
        payload: uniqueTemplates,
      });

      uiDispatch({
        type: 'ADD_TOAST',
        payload: {
          message: `Modèles chargés (${uniqueTemplates.length} uniques, ${duplicates.length} doublons ignorés)`,
          type: 'success',
        },
      });
    } else if (response.status === 204) {
      console.log('ℹ️ Aucun template trouvé');
      dataDispatch({
        type: 'SET_TEMPLATES',
        payload: [],
      });
    }
  } catch (error) {
    console.error('❌ Erreur chargement templates:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: {
        message: error.error || 'Erreur lors du chargement des templates',
        type: 'error',
      },
    });
  } finally {
    uiDispatch({ type: "SET_LOADING", payload: false });
  }
};