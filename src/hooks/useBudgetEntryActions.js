import { useCallback } from 'react';
import { budgetEntryService } from '../services/budgetEntryService';
import { useToast } from '../contexts/ToastContext';

export const useBudgetEntryActions = () => {
  const { addToast } = useToast();

  const saveEntry = useCallback(async ({
    entryData,
    editingEntry,
    user,
    exchangeRates
  }) => {
    try {
      const { supplier, type } = entryData;
      const tierType = type === 'revenu' ? 'client' : 'fournisseur';

      let newTierData = null;
      
      // Gestion du tier
      if (!editingEntry && supplier) {
        const existingTier = await budgetEntryService.findTierByName(supplier, tierType);
        if (!existingTier) {
          newTierData = await budgetEntryService.createTier({
            name: supplier,
            type: tierType,
            user_id: user.id,
          });
        }
      }

      // Conversion de devise si nécessaire
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

      // Préparation des données
      const finalEntryData = {
        project_id: entryData.projectId,
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

      // Sauvegarde
      let savedEntry;
      if (editingEntry?.id) {
        savedEntry = await budgetEntryService.updateEntry(editingEntry.id, finalEntryData);
      } else {
        savedEntry = await budgetEntryService.createEntry(finalEntryData);
      }

      // Récupération des actuals
      const newActuals = await budgetEntryService.getEntryActuals(savedEntry.id);

      addToast({ 
        message: 'Entrée budgétaire enregistrée.', 
        type: 'success' 
      });

      return {
        success: true,
        savedEntry,
        newActuals,
        newTier: newTierData
      };

    } catch (error) {
      console.error('Error saving entry:', error);
      addToast({ 
        message: `Erreur lors de l'enregistrement: ${error.message}`,
        type: 'error' 
      });
      return { success: false, error: error.message };
    }
  }, [addToast]);

  const deleteEntry = useCallback(async (entryId, entryProjectId) => {
    try {
      if (!entryProjectId || 
          entryProjectId === 'consolidated' || 
          entryProjectId.startsWith('consolidated_view_')) {
        throw new Error('Impossible de supprimer une entrée en vue consolidée.');
      }

      await budgetEntryService.deleteEntry(entryId);
      addToast({ 
        message: 'Entrée budgétaire supprimée.', 
        type: 'success' 
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting entry:', error);
      addToast({ 
        message: `Erreur lors de la suppression: ${error.message}`,
        type: 'error' 
      });
      return { success: false, error: error.message };
    }
  }, [addToast]);

  return {
    saveEntry,
    deleteEntry,
  };
};