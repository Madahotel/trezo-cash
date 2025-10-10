import { deriveActualsFromEntry } from "../../utils/scenarioCalculations";
import { templates as officialTemplatesData } from "../../utils/templates";

// Configuration de l'API
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
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
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async put(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: API_HEADERS,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: API_HEADERS,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
};

const getDefaultExpenseTargets = () => ({
  "exp-main-1": 20,
  "exp-main-2": 35,
  "exp-main-3": 10,
  "exp-main-4": 0,
  "exp-main-5": 10,
  "exp-main-6": 5,
  "exp-main-7": 10,
  "exp-main-8": 5,
  "exp-main-9": 5,
  "exp-main-10": 0,
});

// Fonctions API pour chaque entité
const apiEndpoints = {
  projects: "/projects",
  cashAccounts: "/cash-accounts",
  budgetEntries: "/budget-entries",
  actualTransactions: "/actual-transactions",
  tiers: "/tiers",
  scenarios: "/scenarios",
  scenarioEntries: "/scenario-entries",
  templates: "/templates",
  userCategories: "/user-categories",
  taxConfigs: "/tax-configs",
  consolidatedViews: "/consolidated-views",
  collaborators: "/collaborators",
  comments: "/comments",
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
      type: "UPDATE_PROJECT_ONBOARDING_STEP",
      payload: { projectId, step },
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Étape validée !", type: "success" },
    });
  } catch (error) {
    console.error("Error updating onboarding step:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
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
    const {
      projectName,
      projectStartDate,
      projectEndDate,
      isEndDateIndefinite,
      templateId,
      startOption,
    } = payload;

    const projectData = {
      user_id: user.id,
      name: projectName,
      start_date: projectStartDate,
      end_date: isEndDateIndefinite ? null : projectEndDate,
      currency: "EUR",
      currency_symbol: "€",
      expense_targets: getDefaultExpenseTargets(),
    };

    if (startOption === "blank" || templateId === "blank") {
      // Création d'un projet vide avec compte par défaut
      const response = await api.post(
        `${apiEndpoints.projects}/initialize-blank`,
        {
          project: projectData,
          user_id: user.id,
        }
      );

      const { project, cash_accounts, entries, actuals, tiers } = response.data;

      dataDispatch({
        type: "INITIALIZE_PROJECT_SUCCESS",
        payload: {
          newProject: project,
          finalCashAccounts: cash_accounts,
          newAllEntries: entries,
          newAllActuals: actuals,
          newTiers: tiers,
          newLoans: [],
          newCategories: null,
        },
      });
      uiDispatch({ type: "CANCEL_ONBOARDING" });
      return;
    }

    // Création avec template
    const officialTemplate = [
      ...officialTemplatesData.personal,
      ...officialTemplatesData.professional,
    ].find((t) => t.id === templateId);
    const customTemplate = allTemplates.find((t) => t.id === templateId);

    let templateData;
    let newCategories = null;
    if (officialTemplate) {
      templateData = officialTemplate.data;
    } else if (customTemplate) {
      templateData = customTemplate.structure;
      newCategories = customTemplate.structure.categories;
    } else {
      throw new Error("Template not found");
    }

    const response = await api.post(
      `${apiEndpoints.projects}/initialize-with-template`,
      {
        project: projectData,
        template_data: templateData,
        user_id: user.id,
        template_id: templateId,
      }
    );

    const { project, cash_accounts, entries, actuals, tiers } = response.data;

    dataDispatch({
      type: "INITIALIZE_PROJECT_SUCCESS",
      payload: {
        newProject: project,
        finalCashAccounts: cash_accounts,
        newAllEntries: entries,
        newAllActuals: actuals,
        newTiers: tiers,
        newLoans: [],
        newCategories,
      },
    });
    uiDispatch({ type: "CANCEL_ONBOARDING" });
  } catch (error) {
    console.error("Onboarding failed:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: {
        message: `Erreur lors de la création du projet: ${error.message}`,
        type: "error",
      },
    });
    throw error;
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
      type: "UPDATE_PROJECT_SETTINGS_SUCCESS",
      payload: {
        projectId,
        newSettings: response.data,
      },
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Paramètres du projet mis à jour.", type: "success" },
    });
  } catch (error) {
    console.error("Error updating project settings:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
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
    const tierType = type === "revenu" ? "client" : "fournisseur";

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

    const projectCurrency = entryData.projectCurrency || "EUR";
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
      type: "SAVE_ENTRY_SUCCESS",
      payload: {
        savedEntry: savedEntryForClient,
        newActuals: newActuals,
        targetProjectId: savedEntryForClient.project_id,
        newTier: newTierData,
      },
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Entrée budgétaire enregistrée.", type: "success" },
    });
    uiDispatch({ type: "CLOSE_BUDGET_MODAL" });
  } catch (error) {
    console.error("Error saving entry:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: {
        message: `Erreur lors de l'enregistrement: ${error.message}`,
        type: "error",
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
      entryProjectId === "consolidated" ||
      entryProjectId.startsWith("consolidated_view_")
    ) {
      uiDispatch({
        type: "ADD_TOAST",
        payload: {
          message: "Impossible de supprimer une entrée en vue consolidée.",
          type: "error",
        },
      });
      return;
    }

    await api.delete(`${apiEndpoints.budgetEntries}/${entryId}`);

    dataDispatch({
      type: "DELETE_ENTRY_SUCCESS",
      payload: { entryId, entryProjectId },
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Entrée budgétaire supprimée.", type: "success" },
    });
    uiDispatch({ type: "CLOSE_BUDGET_MODAL" });
  } catch (error) {
    console.error("Error deleting entry:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: {
        message: `Erreur lors de la suppression: ${error.message}`,
        type: "error",
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

    dataDispatch({ type: "DELETE_PROJECT_SUCCESS", payload: projectId });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Projet supprimé avec succès.", type: "success" },
    });
    uiDispatch({ type: "SET_ACTIVE_PROJECT", payload: "consolidated" });
  } catch (error) {
    console.error("Error deleting project:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: {
        message: `Erreur lors de la suppression du projet: ${error.message}`,
        type: "error",
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
      type: "ADD_TOAST",
      payload: { message: "Utilisateur non authentifié.", type: "error" },
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

    await api.put("/user/settings", updatedSettings);

    dataDispatch({ type: "UPDATE_SETTINGS_SUCCESS", payload: updatedSettings });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Préférences mises à jour.", type: "success" },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
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
      type: "UPDATE_USER_CASH_ACCOUNT_SUCCESS",
      payload: {
        projectId,
        accountId,
        accountData: response.data,
      },
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Compte mis à jour.", type: "success" },
    });
  } catch (error) {
    console.error("Error updating cash account:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
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
      type: "ADD_USER_CASH_ACCOUNT_SUCCESS",
      payload: {
        projectId,
        newAccount: response.data,
      },
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Compte ajouté.", type: "success" },
    });
  } catch (error) {
    console.error("Error adding cash account:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
    });
  }
};

export const saveActual = async (
  { dataDispatch, uiDispatch },
  { actualData, editingActual, user, tiers }
) => {
  try {
    const { thirdParty, type } = actualData;
    const tierType = type === "receivable" ? "client" : "fournisseur";
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
      type: "SAVE_ACTUAL_SUCCESS",
      payload: {
        finalActualData: savedActualResponse.data,
        newTier: newTierData,
      },
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Transaction enregistrée.", type: "success" },
    });
    uiDispatch({ type: "CLOSE_ACTUAL_TRANSACTION_MODAL" });
  } catch (error) {
    console.error("Error saving actual transaction:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
    });
  }
};

export const deleteActual = async ({ dataDispatch, uiDispatch }, actualId) => {
  try {
    await api.delete(`${apiEndpoints.actualTransactions}/${actualId}`);
    dataDispatch({ type: "DELETE_ACTUAL_SUCCESS", payload: actualId });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Transaction supprimée.", type: "success" },
    });
  } catch (error) {
    console.error("Error deleting actual:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
    });
  }
};

export const recordPayment = async (
  { dataDispatch, uiDispatch },
  { actualId, paymentData, allActuals, user }
) => {
  try {
    if (!user || !user.id) {
      throw new Error("ID utilisateur manquant.");
    }

    const response = await api.post(
      `${apiEndpoints.actualTransactions}/${actualId}/record-payment`,
      paymentData
    );

    dataDispatch({
      type: "RECORD_PAYMENT_SUCCESS",
      payload: { updatedActual: response.data },
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Paiement enregistré.", type: "success" },
    });
    uiDispatch({ type: "CLOSE_PAYMENT_MODAL" });
  } catch (error) {
    console.error("Error recording payment:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
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

    dataDispatch({ type: "WRITE_OFF_ACTUAL_SUCCESS", payload: response.data });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Transaction passée en perte.", type: "success" },
    });
  } catch (error) {
    console.error("Error writing off actual:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
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
        type: "UPDATE_CONSOLIDATED_VIEW_SUCCESS",
        payload: response.data,
      });
      uiDispatch({
        type: "ADD_TOAST",
        payload: { message: "Vue consolidée mise à jour.", type: "success" },
      });
    } else {
      response = await api.post(apiEndpoints.consolidatedViews, dataToSave);
      dataDispatch({
        type: "ADD_CONSOLIDATED_VIEW_SUCCESS",
        payload: response.data,
      });
      uiDispatch({
        type: "ADD_TOAST",
        payload: { message: "Vue consolidée créée.", type: "success" },
      });
    }
    uiDispatch({ type: "CLOSE_CONSOLIDATED_VIEW_MODAL" });
  } catch (error) {
    console.error("Error saving consolidated view:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
    });
  }
};

export const deleteConsolidatedView = async (
  { dataDispatch, uiDispatch },
  viewId
) => {
  try {
    await api.delete(`${apiEndpoints.consolidatedViews}/${viewId}`);
    dataDispatch({ type: "DELETE_CONSOLIDATED_VIEW_SUCCESS", payload: viewId });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Vue consolidée supprimée.", type: "success" },
    });
  } catch (error) {
    console.error("Error deleting consolidated view:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
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
      type: "ADD_MAIN_CATEGORY_SUCCESS",
      payload: { type, newCategory: response.data },
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Catégorie principale créée.", type: "success" },
    });
    return response.data;
  } catch (error) {
    console.error("Error saving main category:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
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
      criticality: "essential",
    };

    const response = await api.post(
      `${apiEndpoints.userCategories}/${mainCategoryId}/subcategories`,
      newSubCategory
    );

    dataDispatch({
      type: "ADD_SUB_CATEGORY_SUCCESS",
      payload: { type, mainCategoryId, newSubCategory: response.data },
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Sous-catégorie créée.", type: "success" },
    });
    return response.data;
  } catch (error) {
    console.error("Error saving sub category:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
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
      type: "UPDATE_SUB_CATEGORY_CRITICALITY",
      payload: response.data,
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Criticité mise à jour.", type: "success" },
    });
  } catch (error) {
    console.error("Error updating criticality:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
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

    dataDispatch({ type: "SAVE_TAX_CONFIG_SUCCESS", payload: response.data });
    uiDispatch({
      type: "ADD_TOAST",
      payload: {
        message: "Configuration fiscale enregistrée.",
        type: "success",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error saving tax config:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
    });
    return null;
  }
};

export const deleteTaxConfig = async ({ dataDispatch, uiDispatch }, taxId) => {
  try {
    await api.delete(`${apiEndpoints.taxConfigs}/${taxId}`);
    dataDispatch({ type: "DELETE_TAX_CONFIG_SUCCESS", payload: taxId });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Impôt/Taxe supprimé.", type: "success" },
    });
  } catch (error) {
    console.error("Error deleting tax config:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
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
        projectId === "consolidated" ||
        projectId.startsWith("consolidated_view_")
          ? null
          : projectId,
      user_id: authorId,
      row_id: rowId,
      column_id: columnId,
      content: content,
    };

    const response = await api.post(apiEndpoints.comments, newComment);

    dataDispatch({ type: "ADD_COMMENT_SUCCESS", payload: response.data });
  } catch (error) {
    console.error("Error adding comment:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: {
        message: `Erreur lors de l'ajout du commentaire: ${error.message}`,
        type: "error",
      },
    });
  }
};

export const deleteTemplate = async (
  { dataDispatch, uiDispatch },
  templateId
) => {
  try {
    await api.delete(`${apiEndpoints.templates}/${templateId}`);
    dataDispatch({ type: "DELETE_TEMPLATE_SUCCESS", payload: templateId });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Modèle supprimé.", type: "success" },
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
    });
  }
};

export const saveTemplate = async (
  { dataDispatch, uiDispatch },
  { templateData, editingTemplate, projectStructure, user }
) => {
  try {
    const dataToSave = {
      ...templateData,
      user_id: user.id,
      structure: projectStructure,
    };

    let response;
    if (editingTemplate) {
      response = await api.put(
        `${apiEndpoints.templates}/${editingTemplate.id}`,
        dataToSave
      );
      dataDispatch({ type: "UPDATE_TEMPLATE_SUCCESS", payload: response.data });
      uiDispatch({
        type: "ADD_TOAST",
        payload: { message: "Modèle mis à jour.", type: "success" },
      });
    } else {
      response = await api.post(apiEndpoints.templates, dataToSave);
      dataDispatch({ type: "ADD_TEMPLATE_SUCCESS", payload: response.data });
      uiDispatch({
        type: "ADD_TOAST",
        payload: { message: "Modèle créé.", type: "success" },
      });
    }
    uiDispatch({ type: "CLOSE_SAVE_TEMPLATE_MODAL" });
  } catch (error) {
    console.error("Error saving template:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
    });
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
    console.error("Error loading initial data:", error);
    throw error;
  }
};
