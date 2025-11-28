export * from '../../hooks/useApiActions.jsx';
import axios from '../../components/config/Axios';

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

export const deleteEntry = async (
  { dataDispatch, uiDispatch },
  { entryId, entryProjectId }
) => {
  try {
    uiDispatch({ type: 'SET_LOADING', payload: true });
    const response = await axios.delete(`/budget-projects/budgets/${entryId}`);
    if (response.status === 200) {
      dataDispatch({
        type: 'DELETE_BUDGET_ENTRY',
        payload: { entryId, projectId: entryProjectId },
      });

      uiDispatch({
        type: 'CLOSE_CONFIRMATION_MODAL',
      });

      uiDispatch({
        type: 'SHOW_TOAST',
        payload: {
          type: 'success',
          message: response.data.message || 'Entrée supprimée avec succès',
        },
      });

      return response.data;
    }
  } catch (error) {
    console.error('❌ Erreur suppression entrée:', error);
    
    uiDispatch({
      type: 'SHOW_TOAST',
      payload: {
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de la suppression',
      },
    });
    
    throw error;
  } finally {
    uiDispatch({ type: 'SET_LOADING', payload: false });
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
