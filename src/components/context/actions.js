import { deriveActualsFromEntry } from '../../utils/scenarioCalculations';
import { templates as officialTemplatesData } from '../../utils/templates';
import axios from '../config/Axios';

// Configuration de l'API
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// Fonction utilitaire pour les appels API
const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async put(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: API_HEADERS,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: API_HEADERS,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
};

const getDefaultExpenseTargets = () => ({
  'exp-main-1': 20,
  'exp-main-2': 35,
  'exp-main-3': 10,
  'exp-main-4': 0,
  'exp-main-5': 10,
  'exp-main-6': 5,
  'exp-main-7': 10,
  'exp-main-8': 5,
  'exp-main-9': 5,
  'exp-main-10': 0,
});

// Fonctions API pour chaque entité
const apiEndpoints = {
  projects: '/projects',
  cashAccounts: '/cash-accounts',
  budgetEntries: '/budget-entries',
  actualTransactions: '/actual-transactions',
  tiers: '/tiers',
  scenarios: '/scenarios',
  scenarioEntries: '/scenario-entries',
  templates: '/templates',
  userCategories: '/user-categories',
  taxConfigs: '/tax-configs',
  consolidatedViews: '/consolidated-views',
  collaborators: '/collaborators',
  comments: '/comments',
};

export const updateProjectOnboardingStep = async (
  { dataDispatch, uiDispatch },
  { projectId, step }
) => {
  try {
    const response = await api.put(
      `${apiEndpoints.projects}/${projectId}/onboarding-step`,
      { step }
    );

    dataDispatch({
      type: 'UPDATE_PROJECT_ONBOARDING_STEP',
      payload: { projectId, step },
    });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Étape validée !', type: 'success' },
    });
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const initializeProject = async (
  { dataDispatch, uiDispatch },
  payload,
  user,
  existingTiersData,
  allTemplates
) => {
  try {
    uiDispatch({ type: "SET_LOADING", payload: true });

    // Validation de base
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
      description = '',
    } = payload;

    console.log("📥 Données reçues:", payload);

    // Validation des champs obligatoires
    if (!projectName?.trim()) {
      throw new Error("Le nom du projet est obligatoire");
    }

    if (!projectStartDate) {
      throw new Error("La date de début est obligatoire");
    }

    // CORRECTION : Gestion robuste du template_id
    let finalTemplateId = null;

    if (templateId && templateId !== 'blank' && templateId !== 'null') {
      try {
        // Si templateId est numérique, l'utiliser directement
        if (!isNaN(templateId)) {
          finalTemplateId = parseInt(templateId);
          console.log(`✅ Template ID numérique: ${finalTemplateId}`);
        } else {
          // Sinon chercher par nom
          const templatesResponse = await axios.get('/templates');
          if (templatesResponse.data.status === 200) {
            const apiData = templatesResponse.data.templates;
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
              finalTemplateId = foundTemplate.id;
              console.log(
                `✅ Template trouvé: ${foundTemplate.name} (ID: ${foundTemplate.id})`
              );
            }
          }
        } catch (templateError) {
          console.warn("⚠️ Erreur chargement templates:", templateError);
        }
      }
    }
    if (finalTemplateId === null) {
      finalTemplateId = 0; 
      console.log(
        `🔄 Utilisation de template_id par défaut: ${finalTemplateId}`
      );
    }

    // Préparation des données pour l'API
    const projectData = {
      name: projectName,
      description: description,
      start_date: projectStartDate,
      end_date: isEndDateIndefinite ? null : projectEndDate || null,
      is_duration_undetermined: isEndDateIndefinite ? 1 : 0,
      template_id: finalTemplateId,
      project_type_id: projectTypeId,
    };

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error('Timeout: La création du projet a pris trop de temps')
          ),
        30000
      );
    });

    console.log("📤 Données envoyées à l'API:", projectData);
    // Validation côté client avant envoi
    if (!projectData.name || projectData.name.length < 2) {
      throw new Error('Le nom du projet doit contenir au moins 2 caractères');
    }

    if (!projectData.start_date) {
      throw new Error('La date de début est requise');
    }

    console.log("📤 Données envoyées à l'API:", projectData);

    // Appel API pour créer le projet
    const response = await axios.post('/projects', projectData);
    console.log('✅ Réponse API création projet:', response.data);

    // CORRECTION : Vérification plus robuste de la réponse
    if (
      response.data &&
      (response.data.status === 200 || response.data.project_id)
    ) {
      const projectId = response.data.project_id || response.data.id;

      console.log(`✅ Projet créé avec succès. ID: ${projectId}`);

      // Créer l'objet projet minimal
      const minimalProject = {
        id: projectId,
        name: projectName,
        start_date: projectStartDate,
        description: description,
        project_type_id: projectTypeId,
        template_id: finalTemplateId,
        is_duration_undetermined: isEndDateIndefinite ? 1 : 0,
        end_date: isEndDateIndefinite ? null : projectEndDate || null,
      };

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
          message: response.data.message || 'Projet créé avec succès!',
          type: 'success',
        },
      });

      uiDispatch({ type: 'CANCEL_ONBOARDING' });

      return { success: true, projectId };
    } else {
      throw new Error(response.data.message || "Réponse invalide du serveur");
    }
  } catch (error) {
    console.error("❌ Erreur création projet:", error);

    // Log détaillé pour les erreurs 422
    if (error.response?.status === 422) {
      console.error("📋 Détails de l'erreur 422:", error.response.data);
      console.error("🚨 Erreurs de validation:", error.response.data.errors);
    }
  } catch (error) {
    console.error('❌ Erreur création projet:', error);

    let errorMessage = 'Erreur lors de la création du projet';

    if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors;
      errorMessage =
        'Erreurs de validation: ' +
        Object.values(validationErrors).flat().join(', ');
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: errorMessage, type: 'error' },
    });

    // Relancer l'erreur pour que le composant puisse la gérer
    throw error;
  } finally {
    uiDispatch({ type: "SET_LOADING", payload: false });
  }
};

export const updateProjectSettings = async (
  { dataDispatch, uiDispatch },
  { projectId, newSettings }
) => {
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

    const response = await api.put(
      `${apiEndpoints.projects}/${projectId}`,
      updates
    );

    dataDispatch({
      type: 'UPDATE_PROJECT_SETTINGS_SUCCESS',
      payload: {
        projectId,
        newSettings: response.data,
      },
    });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Paramètres du projet mis à jour.', type: 'success' },
    });
  } catch (error) {
    console.error('Error updating project settings:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const saveEntry = async (
  { dataDispatch, uiDispatch },
  {
    entryData,
    editingEntry,
    activeProjectId,
    tiers,
    user,
    cashAccounts,
    exchangeRates,
  }
) => {
  try {
    const { supplier, type } = entryData;
    const tierType = type === 'revenu' ? 'client' : 'fournisseur';

    let newTierData = null;
    if (!editingEntry && supplier) {
      // Vérifier si le tier existe déjà
      const existingTiers = await api.get(
        `${apiEndpoints.tiers}?name=${encodeURIComponent(
          supplier
        )}&type=${tierType}`
      );
      if (existingTiers.data.length === 0) {
        const newTier = await api.post(apiEndpoints.tiers, {
          name: supplier,
          type: tierType,
          user_id: user.id,
        });
        newTierData = newTier.data;
      }
    }

    const projectCurrency = entryData.projectCurrency || 'EUR';
    const transactionCurrency = entryData.currency || projectCurrency;

    let convertedTtcAmount = entryData.ttc_amount;

    if (transactionCurrency !== projectCurrency && exchangeRates) {
      const baseRate = exchangeRates[projectCurrency];
      const transactionRate = exchangeRates[transactionCurrency];
      if (baseRate && transactionRate) {
        const conversionRate = baseRate / transactionRate;
        convertedTtcAmount = entryData.ttc_amount * conversionRate;
      }
    }

    const finalEntryDataForDB = {
      project_id: entryData.projectId || activeProjectId,
      user_id: user.id,
      type: entryData.type,
      category: entryData.category,
      frequency: entryData.frequency,
      amount: convertedTtcAmount,
      date: entryData.date,
      start_date: entryData.startDate,
      end_date: entryData.endDate,
      supplier: entryData.supplier,
      description: entryData.description,
      is_off_budget: entryData.isOffBudget || false,
      payments: entryData.payments,
      provision_details: entryData.provisionDetails,
      is_provision: entryData.isProvision,
      currency: entryData.currency,
      original_amount: entryData.amount,
      amount_type: entryData.amount_type,
      vat_rate_id: entryData.vat_rate_id,
      ht_amount: entryData.ht_amount,
      ttc_amount: entryData.ttc_amount,
    };

    let savedEntryResponse;
    if (editingEntry && editingEntry.id) {
      savedEntryResponse = await api.put(
        `${apiEndpoints.budgetEntries}/${editingEntry.id}`,
        finalEntryDataForDB
      );
    } else {
      savedEntryResponse = await api.post(
        apiEndpoints.budgetEntries,
        finalEntryDataForDB
      );
    }

    const savedEntryForClient = savedEntryResponse.data;

    // Récupérer les actuals générés par le backend
    const actualsResponse = await api.get(
      `${apiEndpoints.actualTransactions}?budget_entry_id=${savedEntryForClient.id}`
    );
    const newActuals = actualsResponse.data;

    dataDispatch({
      type: 'SAVE_ENTRY_SUCCESS',
      payload: {
        savedEntry: savedEntryForClient,
        newActuals: newActuals,
        targetProjectId: savedEntryForClient.project_id,
        newTier: newTierData,
      },
    });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Entrée budgétaire enregistrée.', type: 'success' },
    });
    uiDispatch({ type: 'CLOSE_BUDGET_MODAL' });
  } catch (error) {
    console.error('Error saving entry:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: {
        message: `Erreur lors de l'enregistrement: ${error.message}`,
        type: 'error',
      },
    });
  }
};

export const deleteEntry = async (
  { dataDispatch, uiDispatch },
  { entryId, entryProjectId }
) => {
  try {
    if (
      !entryProjectId ||
      entryProjectId === 'consolidated' ||
      entryProjectId.startsWith('consolidated_view_')
    ) {
      uiDispatch({
        type: 'ADD_TOAST',
        payload: {
          message: 'Impossible de supprimer une entrée en vue consolidée.',
          type: 'error',
        },
      });
      return;
    }

    await api.delete(`${apiEndpoints.budgetEntries}/${entryId}`);

    dataDispatch({
      type: 'DELETE_ENTRY_SUCCESS',
      payload: { entryId, entryProjectId },
    });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Entrée budgétaire supprimée.', type: 'success' },
    });
    uiDispatch({ type: 'CLOSE_BUDGET_MODAL' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: {
        message: `Erreur lors de la suppression: ${error.message}`,
        type: 'error',
      },
    });
  }
};

export const deleteProject = async (
  { dataDispatch, uiDispatch },
  projectId
) => {
  try {
    await api.delete(`${apiEndpoints.projects}/${projectId}`);

    dataDispatch({ type: 'DELETE_PROJECT_SUCCESS', payload: projectId });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Projet supprimé avec succès.', type: 'success' },
    });
    uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: 'consolidated' });
  } catch (error) {
    console.error('Error deleting project:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: {
        message: `Erreur lors de la suppression du projet: ${error.message}`,
        type: 'error',
      },
    });
  }
};

export const updateSettings = async (
  { dataDispatch, uiDispatch },
  user,
  newSettings
) => {
  if (!user) {
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Utilisateur non authentifié.', type: 'error' },
    });
    return;
  }
  try {
    const updatedSettings = {
      currency: newSettings.currency,
      displayUnit: newSettings.displayUnit,
      decimalPlaces: newSettings.decimalPlaces,
      timezoneOffset: newSettings.timezoneOffset,
    };

    await api.put('/user/settings', updatedSettings);

    dataDispatch({ type: 'UPDATE_SETTINGS_SUCCESS', payload: updatedSettings });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Préférences mises à jour.', type: 'success' },
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const updateUserCashAccount = async (
  { dataDispatch, uiDispatch },
  { projectId, accountId, accountData }
) => {
  try {
    const updates = {
      name: accountData.name,
      initial_balance: accountData.initialBalance,
      initial_balance_date: accountData.initialBalanceDate,
    };

    const response = await api.put(
      `${apiEndpoints.cashAccounts}/${accountId}`,
      updates
    );

    dataDispatch({
      type: 'UPDATE_USER_CASH_ACCOUNT_SUCCESS',
      payload: {
        projectId,
        accountId,
        accountData: response.data,
      },
    });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Compte mis à jour.', type: 'success' },
    });
  } catch (error) {
    console.error('Error updating cash account:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const addUserCashAccount = async (
  { dataDispatch, uiDispatch },
  { projectId, mainCategoryId, name, initialBalance, initialBalanceDate, user }
) => {
  try {
    const newAccountData = {
      project_id: projectId,
      user_id: user.id,
      main_category_id: mainCategoryId,
      name: name,
      initial_balance: initialBalance,
      initial_balance_date: initialBalanceDate,
      is_closed: false,
      closure_date: null,
    };

    const response = await api.post(apiEndpoints.cashAccounts, newAccountData);

    dataDispatch({
      type: 'ADD_USER_CASH_ACCOUNT_SUCCESS',
      payload: {
        projectId,
        newAccount: response.data,
      },
    });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Compte ajouté.', type: 'success' },
    });
  } catch (error) {
    console.error('Error adding cash account:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const saveActual = async (
  { dataDispatch, uiDispatch },
  { actualData, editingActual, user, tiers }
) => {
  try {
    const { thirdParty, type } = actualData;
    const tierType = type === 'receivable' ? 'client' : 'fournisseur';
    let newTierData = null;

    if (!editingActual && thirdParty) {
      // Vérifier si le tier existe déjà
      const existingTiers = await api.get(
        `${apiEndpoints.tiers}?name=${encodeURIComponent(
          thirdParty
        )}&type=${tierType}`
      );
      if (existingTiers.data.length === 0) {
        const newTier = await api.post(apiEndpoints.tiers, {
          name: thirdParty,
          type: tierType,
          user_id: user.id,
        });
        newTierData = newTier.data;
      }
    }

    const dataToSave = {
      project_id: actualData.projectId,
      user_id: user.id,
      type: actualData.type,
      category: actualData.category,
      third_party: actualData.thirdParty,
      description: actualData.description,
      date: actualData.date,
      amount: actualData.amount,
      status: actualData.status,
      is_off_budget: actualData.isOffBudget,
    };

    let savedActualResponse;
    if (editingActual) {
      savedActualResponse = await api.put(
        `${apiEndpoints.actualTransactions}/${editingActual.id}`,
        dataToSave
      );
    } else {
      savedActualResponse = await api.post(
        apiEndpoints.actualTransactions,
        dataToSave
      );
    }

    dataDispatch({
      type: 'SAVE_ACTUAL_SUCCESS',
      payload: {
        finalActualData: savedActualResponse.data,
        newTier: newTierData,
      },
    });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Transaction enregistrée.', type: 'success' },
    });
    uiDispatch({ type: 'CLOSE_ACTUAL_TRANSACTION_MODAL' });
  } catch (error) {
    console.error('Error saving actual transaction:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const deleteActual = async ({ dataDispatch, uiDispatch }, actualId) => {
  try {
    await api.delete(`${apiEndpoints.actualTransactions}/${actualId}`);
    dataDispatch({ type: 'DELETE_ACTUAL_SUCCESS', payload: actualId });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Transaction supprimée.', type: 'success' },
    });
  } catch (error) {
    console.error('Error deleting actual:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const recordPayment = async (
  { dataDispatch, uiDispatch },
  { actualId, paymentData, allActuals, user }
) => {
  try {
    if (!user || !user.id) {
      throw new Error('ID utilisateur manquant.');
    }

    const response = await api.post(
      `${apiEndpoints.actualTransactions}/${actualId}/record-payment`,
      paymentData
    );

    dataDispatch({
      type: 'RECORD_PAYMENT_SUCCESS',
      payload: { updatedActual: response.data },
    });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Paiement enregistré.', type: 'success' },
    });
    uiDispatch({ type: 'CLOSE_PAYMENT_MODAL' });
  } catch (error) {
    console.error('Error recording payment:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const writeOffActual = async (
  { dataDispatch, uiDispatch },
  actualId
) => {
  try {
    const response = await api.post(
      `${apiEndpoints.actualTransactions}/${actualId}/write-off`
    );

    dataDispatch({ type: 'WRITE_OFF_ACTUAL_SUCCESS', payload: response.data });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Transaction passée en perte.', type: 'success' },
    });
  } catch (error) {
    console.error('Error writing off actual:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const saveConsolidatedView = async (
  { dataDispatch, uiDispatch },
  { viewData, editingView, user }
) => {
  try {
    const dataToSave = {
      user_id: user.id,
      name: viewData.name,
      project_ids: viewData.project_ids,
    };

    let response;
    if (editingView) {
      response = await api.put(
        `${apiEndpoints.consolidatedViews}/${editingView.id}`,
        dataToSave
      );
      dataDispatch({
        type: 'UPDATE_CONSOLIDATED_VIEW_SUCCESS',
        payload: response.data,
      });
      uiDispatch({
        type: 'ADD_TOAST',
        payload: { message: 'Vue consolidée mise à jour.', type: 'success' },
      });
    } else {
      response = await api.post(apiEndpoints.consolidatedViews, dataToSave);
      dataDispatch({
        type: 'ADD_CONSOLIDATED_VIEW_SUCCESS',
        payload: response.data,
      });
      uiDispatch({
        type: 'ADD_TOAST',
        payload: { message: 'Vue consolidée créée.', type: 'success' },
      });
    }
    uiDispatch({ type: 'CLOSE_CONSOLIDATED_VIEW_MODAL' });
  } catch (error) {
    console.error('Error saving consolidated view:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const deleteConsolidatedView = async (
  { dataDispatch, uiDispatch },
  viewId
) => {
  try {
    await api.delete(`${apiEndpoints.consolidatedViews}/${viewId}`);
    dataDispatch({ type: 'DELETE_CONSOLIDATED_VIEW_SUCCESS', payload: viewId });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Vue consolidée supprimée.', type: 'success' },
    });
  } catch (error) {
    console.error('Error deleting consolidated view:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const saveMainCategory = async (
  { dataDispatch, uiDispatch },
  { type, name, user }
) => {
  try {
    const newCategory = {
      user_id: user.id,
      name,
      type,
      is_fixed: false,
    };

    const response = await api.post(apiEndpoints.userCategories, newCategory);

    dataDispatch({
      type: 'ADD_MAIN_CATEGORY_SUCCESS',
      payload: { type, newCategory: response.data },
    });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Catégorie principale créée.', type: 'success' },
    });
    return response.data;
  } catch (error) {
    console.error('Error saving main category:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
    return null;
  }
};

export const saveSubCategory = async (
  { dataDispatch, uiDispatch },
  { type, mainCategoryId, subCategoryName, user, categories }
) => {
  try {
    const newSubCategory = {
      main_category_id: mainCategoryId,
      name: subCategoryName,
      is_fixed: false,
      criticality: 'essential',
    };

    const response = await api.post(
      `${apiEndpoints.userCategories}/${mainCategoryId}/subcategories`,
      newSubCategory
    );

    dataDispatch({
      type: 'ADD_SUB_CATEGORY_SUCCESS',
      payload: { type, mainCategoryId, newSubCategory: response.data },
    });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Sous-catégorie créée.', type: 'success' },
    });
    return response.data;
  } catch (error) {
    console.error('Error saving sub category:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
    return null;
  }
};

export const updateSubCategoryCriticality = async (
  { dataDispatch, uiDispatch },
  { subCategoryId, newCriticality }
) => {
  try {
    const response = await api.put(
      `${apiEndpoints.userCategories}/subcategories/${subCategoryId}`,
      {
        criticality: newCriticality,
      }
    );

    dataDispatch({
      type: 'UPDATE_SUB_CATEGORY_CRITICALITY',
      payload: response.data,
    });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Criticité mise à jour.', type: 'success' },
    });
  } catch (error) {
    console.error('Error updating criticality:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const saveTaxConfig = async ({ dataDispatch, uiDispatch }, config) => {
  try {
    let response;
    if (config.id) {
      response = await api.put(
        `${apiEndpoints.taxConfigs}/${config.id}`,
        config
      );
    } else {
      response = await api.post(apiEndpoints.taxConfigs, config);
    }

    dataDispatch({ type: 'SAVE_TAX_CONFIG_SUCCESS', payload: response.data });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: {
        message: 'Configuration fiscale enregistrée.',
        type: 'success',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error saving tax config:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
    return null;
  }
};

export const deleteTaxConfig = async ({ dataDispatch, uiDispatch }, taxId) => {
  try {
    await api.delete(`${apiEndpoints.taxConfigs}/${taxId}`);
    dataDispatch({ type: 'DELETE_TAX_CONFIG_SUCCESS', payload: taxId });
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Impôt/Taxe supprimé.', type: 'success' },
    });
  } catch (error) {
    console.error('Error deleting tax config:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: { message: `Erreur: ${error.message}`, type: 'error' },
    });
  }
};

export const addComment = async (
  { dataDispatch, uiDispatch },
  { projectId, rowId, columnId, content, authorId }
) => {
  try {
    const newComment = {
      project_id:
        projectId === 'consolidated' ||
        projectId.startsWith('consolidated_view_')
          ? null
          : projectId,
      user_id: authorId,
      row_id: rowId,
      column_id: columnId,
      content: content,
    };

    const response = await api.post(apiEndpoints.comments, newComment);

    dataDispatch({ type: 'ADD_COMMENT_SUCCESS', payload: response.data });
  } catch (error) {
    console.error('Error adding comment:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: {
        message: `Erreur lors de l'ajout du commentaire: ${error.message}`,
        type: 'error',
      },
    });
  }
};

// Dans votre fichier actions.js
export const saveTemplate = async (
  { dataDispatch, uiDispatch },
  { templateData, editingTemplate, projectStructure, user }
) => {
  try {
    uiDispatch({ type: "SET_LOADING", payload: true });

    const payload = {
      name: templateData.name,
      description: templateData.description,
      icon: templateData.icon,
      color: templateData.color,
      is_public: templateData.is_public,
      purpose: templateData.purpose,
      structure: projectStructure, // Ajout de la structure du projet
    };

    let response;
    if (editingTemplate) {
      // Pour l'édition (si vous avez cette route)
      response = await axios.put(`/templates/${editingTemplate.id}`, payload);
    } else {
      // Pour la création
      response = await axios.post("/templates", payload);
    }

    if (response.data.status === 200) {
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

      return { success: true };
    }
  } catch (error) {
    console.error('Erreur sauvegarde template:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: {
        message:
          error.response?.data?.message || 'Erreur lors de la sauvegarde',
        type: 'error',
      },
    });
    return { success: false };
  } finally {
    uiDispatch({ type: "SET_LOADING", payload: false });
  }
};

// Version alternative plus performante
export const fetchTemplates = async ({ dataDispatch, uiDispatch }) => {
  try {
    uiDispatch({ type: 'SET_LOADING', payload: true });

    const response = await axios.get('/templates');
    console.log('📡 Réponse API templates:', response.data);

    if (response.data.status === 200) {
      const apiData = response.data.templates;

      // Extraire les données de la structure paginée
      const allTemplates = [
        ...(apiData.officials?.template_official_items?.data || []),
        ...(apiData.personals?.template_personal_items?.data || []),
        ...(apiData.communities?.template_community_items?.data || []),
      ];

      console.log('📦 Templates extraits:', allTemplates);

      // Éliminer les doublons avec Map (plus performant)
      const templateMap = new Map();
      const duplicates = [];

      allTemplates.forEach((template) => {
        if (templateMap.has(template.id)) {
          duplicates.push(template.id);
          console.log(
            `⚠️ Template dupliqué: ID ${template.id} - ${template.name}`
          );
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
    } else if (response.data.status === 204) {
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
        message:
          error.response?.data?.message ||
          'Erreur lors du chargement des templates',
        type: 'error',
      },
    });
  } finally {
    uiDispatch({ type: "SET_LOADING", payload: false });
  }
};
export const deleteTemplate = async (
  { dataDispatch, uiDispatch },
  templateId
) => {
  try {
    uiDispatch({ type: 'SET_LOADING', payload: true });

    const response = await axios.delete(`/templates/${templateId}`);

    if (response.data.status === 200) {
      // Rafraîchir la liste
      await fetchTemplates({ dataDispatch, uiDispatch });

      uiDispatch({
        type: 'ADD_TOAST',
        payload: {
          message: 'Template supprimé avec succès!',
          type: 'success',
        },
      });
    }
  } catch (error) {
    console.error('Erreur suppression template:', error);
    uiDispatch({
      type: 'ADD_TOAST',
      payload: {
        message:
          error.response?.data?.message || 'Erreur lors de la suppression',
        type: 'error',
      },
    });
  } finally {
    uiDispatch({ type: "SET_LOADING", payload: false });
  }
};

// Fonctions pour charger les données initiales
export const loadInitialData = async (user) => {
  try {
    const [
      projectsResponse,
      cashAccountsResponse,
      budgetEntriesResponse,
      actualTransactionsResponse,
      tiersResponse,
      templatesResponse,
      userCategoriesResponse,
      taxConfigsResponse,
      consolidatedViewsResponse,
    ] = await Promise.all([
      api.get(apiEndpoints.projects),
      api.get(apiEndpoints.cashAccounts),
      api.get(apiEndpoints.budgetEntries),
      api.get(apiEndpoints.actualTransactions),
      api.get(apiEndpoints.tiers),
      api.get(apiEndpoints.templates),
      api.get(apiEndpoints.userCategories),
      api.get(apiEndpoints.taxConfigs),
      api.get(apiEndpoints.consolidatedViews),
    ]);

    return {
      projects: projectsResponse.data,
      cashAccounts: cashAccountsResponse.data,
      budgetEntries: budgetEntriesResponse.data,
      actualTransactions: actualTransactionsResponse.data,
      tiers: tiersResponse.data,
      templates: templatesResponse.data,
      userCategories: userCategoriesResponse.data,
      taxConfigs: taxConfigsResponse.data,
      consolidatedViews: consolidatedViewsResponse.data,
    };
  } catch (error) {
    console.error('Error loading initial data:', error);
    throw error;
  }
};
