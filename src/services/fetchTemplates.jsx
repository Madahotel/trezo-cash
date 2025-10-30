import { apiService } from '../utils/ApiService'; // Chemin vers votre ApiService

export const fetchTemplates = async ({ dataDispatch, uiDispatch }) => {
  try {
    uiDispatch({ type: 'SET_LOADING', payload: true });

    const response = await apiService.get('/templates');
    console.log('📡 Réponse API templates:', response);

    if (response.status === 200) {
      const apiData = response.templates;

      // Extraire et marquer correctement les templates
      const allTemplates = [
        ...(apiData.officials?.template_official_items?.data || []).map(t => ({
          ...t,
          type: 'official'
        })),
        ...(apiData.personals?.template_personal_items?.data || []).map(t => ({
          ...t,
          type: 'personal'
        })),
        ...(apiData.communities?.template_community_items?.data || []).map(t => ({
          ...t,
          type: 'community'
        })),
      ];

      console.log('📦 Templates extraits avec types:', allTemplates);

      // Éliminer les doublons
      const templateMap = new Map();
      allTemplates.forEach((template) => {
        if (!templateMap.has(template.id)) {
          templateMap.set(template.id, template);
        }
      });

      const uniqueTemplates = Array.from(templateMap.values());

      dataDispatch({
        type: 'SET_TEMPLATES',
        payload: uniqueTemplates,
      });

      uiDispatch({
        type: 'ADD_TOAST',
        payload: {
          message: `Modèles chargés (${uniqueTemplates.length} templates)`,
          type: 'success',
        },
      });
    } else if (response.status === 204) {
      dataDispatch({ type: 'SET_TEMPLATES', payload: [] });
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