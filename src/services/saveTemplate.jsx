import { apiService } from '../utils/ApiService';
import { fetchTemplates } from './fetchTemplates';

export const saveTemplate = async (
  { dataDispatch, uiDispatch },
  { templateData, editingTemplate, projectStructure, user }
) => {
  try {
    uiDispatch({ type: "SET_LOADING", payload: true });

    // Validation des données
    if (!templateData.name?.trim()) {
      throw new Error("Le nom du modèle est obligatoire");
    }

    if (templateData.name.length < 2 || templateData.name.length > 150) {
      throw new Error("Le nom doit contenir entre 2 et 150 caractères");
    }

    const payload = {
      name: templateData.name.trim(),
      description: templateData.description?.trim() || '',
      icon: templateData.icon || 'Briefcase',
      color: templateData.color || 'blue',
      is_public: Boolean(templateData.is_public),
      purpose: templateData.purpose || 'professional',
      structure: projectStructure || {},
    };

    console.log('💾 Sauvegarde template:', {
      editing: !!editingTemplate,
      payload
    });

    // Utiliser les méthodes spécifiques au lieu de .request()
    let result;
    if (editingTemplate) {
      result = await apiService.put(`/templates/${editingTemplate.id}`, payload);
    } else {
      result = await apiService.post('/templates', payload);
    }

    // Vérifier le résultat selon la structure de votre API
    if (result.success || result.status === 200 || result.data) {
      
      // Rafraîchir la liste des templates
      await fetchTemplates({ dataDispatch, uiDispatch });

      uiDispatch({
        type: 'ADD_TOAST',
        payload: {
          message: editingTemplate
            ? 'Modèle modifié avec succès!'
            : 'Modèle créé avec succès!',
          type: 'success',
        },
      });

      return { 
        success: true, 
        data: result.data || result,
        templateId: (result.data?.id || result.data?.template_id || result.id || result.template_id) 
      };
    } else {
      throw new Error(result.error || result.message || "Erreur lors de la sauvegarde");
    }

  } catch (error) {
    console.error('Erreur sauvegarde template:', error);
    
    const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la sauvegarde du modèle';

    uiDispatch({
      type: 'ADD_TOAST',
      payload: {
        message: errorMessage,
        type: 'error',
      },
    });
    
    return { 
      success: false, 
      error: errorMessage 
    };
  } finally {
    uiDispatch({ type: "SET_LOADING", payload: false });
  }
};