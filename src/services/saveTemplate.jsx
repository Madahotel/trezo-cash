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

    // Utilisation de apiService
    const result = await apiService.request(
      editingTemplate ? 'PUT' : 'POST',
      editingTemplate ? `/templates/${editingTemplate.id}` : '/templates',
      payload
    );

    if (result.success) {
      console.log('✅ Template sauvegardé avec succès');
      
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
        data: result.data,
        templateId: result.data.id || result.data.template_id 
      };
    } else {
      throw new Error(result.error || "Erreur lors de la sauvegarde");
    }

  } catch (error) {
    console.error('❌ Erreur sauvegarde template:', error);
    
    const errorMessage = error.message || 'Erreur lors de la sauvegarde du modèle';

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