import { apiService } from '../utils/ApiService';

export const fetchTemplates = async () => {
  try {
    console.log('📡 Chargement des templates...');

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

      console.log(`✅ ${uniqueTemplates.length} templates chargés avec succès`);
      return uniqueTemplates;

    } else if (response.status === 204) {
      console.log('ℹ️ Aucun template trouvé');
      return [];
    } else {
      throw new Error(`Statut de réponse inattendu: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erreur chargement templates:', error);
    
    // Retourner une erreur structurée
    throw {
      message: error.error || 'Erreur lors du chargement des templates',
      originalError: error
    };
  }
};