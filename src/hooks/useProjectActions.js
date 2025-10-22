import { useCallback } from 'react';
import { projectService } from '../services/ProjectService';
import { useToast } from '../contexts/ToastContext';
import { useLoading } from '../contexts/LoadingContext';

export const useProjectActions = () => {
  const { addToast } = useToast();
  const { setLoading } = useLoading();

  const initializeProject = useCallback(async (payload, user) => {
    setLoading(true);
    
    try {
      // Validation
      if (!user?.id) {
        throw new Error("Utilisateur non connecté");
      }

      const {
        projectName,
        projectStartDate,
        templateId,
        isEndDateIndefinite,
        projectEndDate,
        projectTypeId = 1,
        description = '',
      } = payload;

      // Gestion du template
      let finalTemplateId = 0;
      if (templateId && templateId !== 'blank' && templateId !== 'null') {
        const template = await projectService.findTemplateById(templateId);
        if (template) {
          finalTemplateId = template.id;
        }
      }

      // Préparation des données
      const projectData = {
        name: projectName.trim(),
        description,
        start_date: projectStartDate,
        end_date: isEndDateIndefinite ? null : projectEndDate || null,
        is_duration_undetermined: isEndDateIndefinite ? 1 : 0,
        template_id: finalTemplateId,
        project_type_id: projectTypeId,
      };

      // Validation
      if (!projectData.name || projectData.name.length < 2) {
        throw new Error('Le nom du projet doit contenir au moins 2 caractères');
      }

      if (!projectData.start_date) {
        throw new Error('La date de début est requise');
      }

      // Création du projet
      const response = await projectService.createProject(projectData);
      
      if (response.status === 200 || response.project_id) {
        const projectId = response.project_id || response.id;
        
        addToast({
          message: response.message || 'Projet créé avec succès!',
          type: 'success'
        });

        return { 
          success: true, 
          projectId,
          project: {
            id: projectId,
            name: projectName,
            start_date: projectStartDate,
            description,
            project_type_id: projectTypeId,
            template_id: finalTemplateId,
            is_duration_undetermined: isEndDateIndefinite ? 1 : 0,
            end_date: isEndDateIndefinite ? null : projectEndDate || null,
          }
        };
      } else {
        throw new Error(response.message || "Réponse invalide du serveur");
      }
    } catch (error) {
      console.error('❌ Erreur création projet:', error);
      
      let errorMessage = 'Erreur lors de la création du projet';
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        errorMessage = 'Erreurs de validation: ' + 
          Object.values(validationErrors).flat().join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      addToast({ message: errorMessage, type: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addToast, setLoading]);

  const updateProjectSettings = useCallback(async (projectId, newSettings) => {
    try {
      const updates = {
        name: newSettings.name,
        start_date: newSettings.startDate,
        end_date: newSettings.endDate,
        currency: newSettings.currency,
        currency_symbol: newSettings.currency_symbol,
        display_unit: newSettings.display_unit,
        decimal_places: newSettings.decimal_places,
        timezone_offset: newSettings.timezone_offset,
      };

      await projectService.updateProject(projectId, updates);
      addToast({ 
        message: 'Paramètres du projet mis à jour.', 
        type: 'success' 
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating project settings:', error);
      addToast({ 
        message: `Erreur: ${error.message}`, 
        type: 'error' 
      });
      return { success: false, error: error.message };
    }
  }, [addToast]);

  const deleteProject = useCallback(async (projectId) => {
    try {
      await projectService.deleteProject(projectId);
      addToast({ 
        message: 'Projet supprimé avec succès.', 
        type: 'success' 
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      addToast({ 
        message: `Erreur lors de la suppression: ${error.message}`, 
        type: 'error' 
      });
      return { success: false, error: error.message };
    }
  }, [addToast]);

  const updateOnboardingStep = useCallback(async (projectId, step) => {
    try {
      await projectService.updateOnboardingStep(projectId, step);
      addToast({ 
        message: 'Étape validée !', 
        type: 'success' 
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      addToast({ 
        message: `Erreur: ${error.message}`, 
        type: 'error' 
      });
      return { success: false, error: error.message };
    }
  }, [addToast]);

  return {
    initializeProject,
    updateProjectSettings,
    deleteProject,
    updateOnboardingStep,
  };
};