import { apiService } from '../utils/ApiService';

class ProjectInitializationService {
    async initializeProject(
        { dataDispatch, uiDispatch },
        payload,
        user,
        existingTiersData,
        allTemplates
    ) {
        try {
            uiDispatch({ type: "SET_LOADING", payload: true });

            if (!user?.id) {
                throw new Error("Utilisateur non connecté");
            }

            const {
                projectName,
                projectStartDate,
                projectEndDate,
                isEndDateIndefinite,
                templateId,
                startOption,
                projectTypeId = 1,
                projectDescription = '',
                description = projectDescription || '',
            } = payload;

            console.log("📥 Données reçues:", payload);
            if (!projectName?.trim()) {
                throw new Error("Le nom du projet est obligatoire");
            }

            if (!projectStartDate) {
                throw new Error("La date de début est obligatoire");
            }

            const finalTemplateId = await this.resolveTemplateId(templateId);

            const projectData = {
                name: projectName.trim(),
                description: description?.trim() || 'Nouveau projet',
                start_date: this.formatDateForAPI(projectStartDate),
                end_date: isEndDateIndefinite ? null : this.formatDateForAPI(projectEndDate),
                is_duration_undetermined: isEndDateIndefinite ? true : false,
                template_id: finalTemplateId,
                project_type_id: parseInt(projectTypeId),
            };

            console.log("📤 Données envoyées à l'API:", projectData);

            this.validateProjectData(projectData);
            const response = await apiService.post('/projects', projectData);

            console.log('✅ Réponse API création projet:', response);

            if (response && response.status === 200) {
                const projectId = response.project_id;

                console.log(`✅ Projet créé avec succès. ID: ${projectId}`);

                const minimalProject = {
                    id: projectId,
                    name: projectName,
                    start_date: projectStartDate,
                    description: description,
                    project_type_id: projectTypeId,
                    template_id: finalTemplateId,
                    is_duration_undetermined: isEndDateIndefinite,
                    end_date: isEndDateIndefinite ? null : projectEndDate,
                };

                this.dispatchSuccessActions(
                    { dataDispatch, uiDispatch },
                    minimalProject,
                    response
                );

                return { success: true, projectId };
            } else {
                throw new Error(response?.message || "Réponse invalide du serveur");
            }
        } catch (error) {
            console.error('❌ Erreur création projet:', error);

            const errorDetails = this.getErrorDetails(error);
            console.error('🔍 Détails de l\'erreur:', errorDetails);

            this.handleError({ uiDispatch }, error, errorDetails);
            throw error;
        } finally {
            uiDispatch({ type: "SET_LOADING", payload: false });
        }
    }

    formatDateForAPI(dateString) {
        if (!dateString) return null;

        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.warn('⚠️ Erreur formatage date:', error);
            return dateString;
        }
    }

    async resolveTemplateId(templateId) {
        if (!templateId || templateId === 'blank' || templateId === 'null') {
            console.log('🔄 Recherche d\'un template par défaut...');

            try {
                const templatesResponse = await apiService.get('/templates');

                if (templatesResponse.status === 200) {
                    const apiData = templatesResponse.templates;
                    const templatesList = [
                        ...(apiData.officials?.template_official_items?.data || []),
                        ...(apiData.personals?.template_personal_items?.data || []),
                        ...(apiData.communities?.template_community_items?.data || []),
                    ];
                    if (templatesList.length > 0) {
                        const defaultTemplate = templatesList[0];
                        console.log(`✅ Template par défaut trouvé: ${defaultTemplate.name} (ID: ${defaultTemplate.id})`);
                        return defaultTemplate.id;
                    }
                }
            } catch (error) {
                console.warn('⚠️ Erreur recherche template par défaut:', error);
            }
            throw new Error('Aucun template disponible. Veuillez créer un template d\'abord.');
        }

        if (!isNaN(templateId)) {
            const finalTemplateId = parseInt(templateId);
            console.log(`✅ Template ID numérique: ${finalTemplateId}`);
            return finalTemplateId;
        }

        // Sinon chercher par nom
        try {
            const templatesResponse = await apiService.get('/templates');

            if (templatesResponse.status === 200) {
                const apiData = templatesResponse.templates;
                const templatesList = [
                    ...(apiData.officials?.template_official_items?.data || []),
                    ...(apiData.personals?.template_personal_items?.data || []),
                    ...(apiData.communities?.template_community_items?.data || []),
                ];

                const foundTemplate = templatesList.find(
                    (t) =>
                        t.id &&
                        (t.id.toString() === templateId.toString() ||
                            t.name?.toLowerCase() === templateId.toLowerCase())
                );

                if (foundTemplate) {
                    console.log(`✅ Template trouvé: ${foundTemplate.name} (ID: ${foundTemplate.id})`);
                    return foundTemplate.id;
                } else {
                    throw new Error(`Template "${templateId}" non trouvé`);
                }
            }
        } catch (templateError) {
            console.warn("⚠️ Erreur chargement templates:", templateError);
            throw new Error('Erreur lors de la recherche du template');
        }

        throw new Error('Template non valide');
    }

    validateProjectData(projectData) {
        const errors = [];

        if (!projectData.name || projectData.name.trim().length < 2) {
            errors.push('Le nom du projet doit contenir au moins 2 caractères');
        }

        if (!projectData.description || projectData.description.trim().length === 0) {
            errors.push('La description est requise');
        }

        if (!projectData.start_date) {
            errors.push('La date de début est requise');
        }

        if (projectData.template_id === undefined || projectData.template_id === null) {
            errors.push('L\'ID du template est requis');
        }

        if (!projectData.project_type_id) {
            errors.push('Le type de projet est requis');
        }

        if (typeof projectData.is_duration_undetermined !== 'boolean') {
            errors.push('is_duration_undetermined doit être un boolean');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('; '));
        }

        console.log('✅ Données validées avec succès');
    }

    getErrorDetails(error) {
        if (error.response?.status === 422) {
            return {
                status: 422,
                errors: error.response.data?.errors,
                message: error.response.data?.message,
                validation: error.response.data
            };
        }

        return {
            message: error.message,
            code: error.code,
            status: error.response?.status
        };
    }

    dispatchSuccessActions(
        { dataDispatch, uiDispatch },
        minimalProject,
        apiResponse
    ) {
          uiDispatch({
            type: 'SET_ACTIVE_PROJECT',
            payload: minimalProject
        });


        dataDispatch({
            type: "INITIALIZE_PROJECT_SUCCESS",
            payload: {
                newProject: minimalProject,
                finalCashAccounts: [],
                newAllEntries: [],
                newAllActuals: [],
                newTiers: [],
                newLoans: [],
                newCategories: null,
            },
        });

        uiDispatch({
            type: 'ADD_TOAST',
            payload: {
                message: apiResponse.message || 'Projet créé avec succès!',
                type: 'success',
            },
        });

        uiDispatch({ type: 'CANCEL_ONBOARDING' });
    }

    handleError({ uiDispatch }, error, errorDetails) {
        let errorMessage = 'Erreur lors de la création du projet';

        if (errorDetails.status === 422) {
            // Erreur de validation Laravel
            if (errorDetails.errors) {
                const validationErrors = Object.entries(errorDetails.errors)
                    .map(([field, messages]) => {
                        const fieldName = this.getFieldDisplayName(field);
                        return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
                    })
                    .join('; ');
                errorMessage = `Erreurs de validation: ${validationErrors}`;
            } else if (errorDetails.message) {
                errorMessage = errorDetails.message;
            } else {
                errorMessage = 'Données invalides envoyées au serveur';
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        console.error('🚨 Erreur détaillée:', errorDetails);

        uiDispatch({
            type: 'ADD_TOAST',
            payload: {
                message: errorMessage,
                type: 'error',
                duration: 8000
            },
        });
    }

    getFieldDisplayName(field) {
        const fieldNames = {
            'name': 'Nom du projet',
            'start_date': 'Date de début',
            'template_id': 'Modèle',
            'project_type_id': 'Type de projet',
            'is_duration_undetermined': 'Durée indéterminée'
        };

        return fieldNames[field] || field;
    }
}

export const projectInitializationService = new ProjectInitializationService();