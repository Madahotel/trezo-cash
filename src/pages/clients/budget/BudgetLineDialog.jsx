import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import AdvancedOptions from './AdvancedOptions';
import BasicInfoSection from './BasicInfoSection';
import QuickAddThirdPartyModal from './QuickAddThirdPartyModal';
import { apiService } from '../../../utils/ApiService';
import toast from 'react-hot-toast';
import {
  apiGet,
  apiPost,
  apiUpdate,
} from '../../../components/context/actionsMethode';

const BudgetLineDialog = ({
  open,
  onOpenChange,
  editLine = null,
  onBudgetAdded,
  onBudgetUpdated,
  projectId,
}) => {
  const [data, setData] = useState();
  const [editData, setEditData] = useState();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);
  const [isCreatingThirdParty, setIsCreatingThirdParty] = useState(false);
  const [showThirdPartyModal, setShowThirdPartyModal] = useState(false);
  const [newThirdPartyData, setNewThirdPartyData] = useState({
    name: '',
    firstname: '',
    email: '',
    phone_number: '',
    user_type_id: '',
  });

  const {
    listCategories = [],
    listSubCategories = [],
    listCategoryTypes = [],
    listFrequencies = [],
    listCurrencies = [],
    listThirdParty = [],
    vatRates = [],
    allCashAccounts = [],
  } = data || {};

  const [formData, setFormData] = useState({
    type: '1',
    mainCategory: '',
    subcategory: '',
    amount: '',
    currency: '1',
    frequency: '1',
    startDate: '',
    endDate: '',
    isIndefinite: false,
    description: '',
    thirdParty: null,
  });

  const [amountType, setAmountType] = useState('ttc');
  const [vatRateId, setVatRateId] = useState(null);
  const [isProvision, setIsProvision] = useState(false);
  const [numProvisions, setNumProvisions] = useState('');
  const [provisionDetails, setProvisionDetails] = useState({
    finalPaymentDate: '',
    provisionAccountId: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  // Transformations
  const currencies = listCurrencies.map((currency) => ({
    value: currency.id?.toString() || `currency-${currency.code}`,
    label: `${currency.code} (${currency.symbol})`,
    code: currency.code,
    symbol: currency.symbol,
  }));

  const defaultCurrency =
    currencies.find((curr) => curr.code === 'EUR') || currencies[0];

  const frequencies = listFrequencies.map((freq) => ({
    value: freq.id?.toString() || `freq-${freq.name}`,
    label: freq.name,
  }));

  const provisionAccountOptions = allCashAccounts.map((account) => ({
    value: account.id?.toString() || `account-${account.name}`,
    label: account.name,
  }));

  // Fonction pour transformer les tiers en format React Select
  const transformThirdParties = (thirdParties) => {
    if (!thirdParties || !Array.isArray(thirdParties)) {
      return [];
    }

    return thirdParties.map((thirdParty) => {
      // Déterminer le nom à afficher
      let displayName = '';
      if (thirdParty.firstname && thirdParty.name) {
        displayName = `${thirdParty.firstname} ${thirdParty.name}`;
      } else if (thirdParty.name) {
        displayName = thirdParty.name;
      } else if (thirdParty.firstname) {
        displayName = thirdParty.firstname;
      } else if (thirdParty.email) {
        displayName = thirdParty.email;
      } else {
        displayName = 'Tiers sans nom';
      }

      // Déterminer l'ID
      let id = '';
      if (thirdParty.id) {
        id = thirdParty.id.toString();
      } else if (thirdParty.user_id) {
        id = thirdParty.user_id.toString();
      } else {
        id = `thirdparty-${Math.random().toString(36).substr(2, 9)}`;
      }

      return {
        value: id,
        label: displayName.trim(),
        email: thirdParty.email || '',
        originalData: thirdParty, // Conserver les données originales
      };
    });
  };

  const createThirdParty = async (thirdPartyData) => {
    try {
      setIsCreatingThirdParty(true);
      const payload = {
        ...thirdPartyData,
        user_type_id: parseInt(thirdPartyData.user_type_id),
      };

      const response = await apiService.post('/users/third-parties', payload);

      if (response.status === 200) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await fetchOptions();
        return response.data || { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Erreur serveur');
      }
    } catch (error) {
      console.error('❌ Erreur création tiers:', error);
      throw error;
    } finally {
      setIsCreatingThirdParty(false);
    }
  };

  const handleAddNewThirdParty = async () => {
    if (!newThirdPartyData.name.trim()) {
      toast.error('Le nom du tiers est obligatoire');
      return;
    }

    if (!newThirdPartyData.user_type_id) {
      toast.error('Veuillez sélectionner un type de tiers');
      return;
    }

    if (newThirdPartyData.email && !isValidEmail(newThirdPartyData.email)) {
      toast.error('Veuillez saisir une adresse email valide');
      return;
    }

    const thirdPartyData = {
      name: newThirdPartyData.name.trim(),
      firstname: newThirdPartyData.firstname?.trim() || '',
      email: newThirdPartyData.email?.trim() || null,
      phone_number: newThirdPartyData.phone_number?.trim() || '',
      user_type_id: newThirdPartyData.user_type_id,
      password: 'password123',
    };

    try {
      const result = await createThirdParty(thirdPartyData);
      if (result) {
        setNewThirdPartyData({
          name: '',
          firstname: '',
          email: '',
          phone_number: '',
          user_type_id: '',
        });
        setShowThirdPartyModal(false);
        toast.success('Tiers créé avec succès !');
      }
    } catch (error) {
      toast.error(`Erreur lors de la création du tiers: ${error.message}`);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculatedAmounts = () => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return { htAmount: 0, ttcAmount: 0, vatAmount: 0 };

    const selectedVatRate = vatRates.find(
      (rate) => rate.id.toString() === vatRateId
    );
    const rate = selectedVatRate ? parseFloat(selectedVatRate.rate) / 100 : 0;

    if (amountType === 'ht') {
      const ht = amount;
      const vat = ht * rate;
      const ttc = ht + vat;
      return { htAmount: ht, ttcAmount: ttc, vatAmount: vat };
    } else {
      const ttc = amount;
      const ht = ttc / (1 + rate);
      const vat = ttc - ht;
      return { htAmount: ht, ttcAmount: ttc, vatAmount: vat };
    }
  };

  const amounts = calculatedAmounts();
  const showProvisionButton =
    formData.type === '1' && ['3', '4', '5', '6'].includes(formData.frequency);

  const fetchOptions = async () => {
    try {
      setIsLoadingData(true);
      const res = await apiGet(`/budget-projects/options`);
      let combinedList = [];

      if (res.users) {
        const userThirdParties =
          res.users.user_third_parties?.user_third_party_items?.data || [];
        const userFinancials =
          res.users.user_financials?.user_financial_items?.data || [];
        combinedList = [...userThirdParties, ...userFinancials];
      } else if (res.listThirdParty) {
        combinedList = res.listThirdParty;
      } else if (res.thirdParties) {
        combinedList = res.thirdParties;
      } else if (res.data) {
        combinedList = res.data;
      } else {
        combinedList = [];
      }

      // Transformer les tiers en format React Select
      const transformedThirdParties = transformThirdParties(combinedList);

      setData({
        ...res,
        listThirdParty: transformedThirdParties,
      });
    } catch (error) {
      console.error('❌ Erreur chargement options:', error);
      toast.error('Erreur lors du chargement des options');
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchEditData = async (entry) => {
    try {
      setIsLoadingEditData(true);

      // Utilisez le budget_id au lieu de l'id de l'entrée
      const budgetId = entry.budget_id || entry.id;

      if (!budgetId) {
        throw new Error('ID du budget non trouvé');
      }

      const res = await apiGet(`/budget-projects/budgets/${budgetId}`);

      if (res.status === 200 && res.budget) {
        const budget = res.budget;

        // Formater le tiers pour l'édition
        let thirdPartyOption = null;
        if (budget.user_third_party_id) {
          thirdPartyOption = {
            value: budget.user_third_party_id?.toString(),
            label:
              `${budget.user_third_party_firstname || ''} ${
                budget.user_third_party_name || ''
              }`.trim() ||
              budget.user_third_party_email ||
              'Tiers',
            email: budget.user_third_party_email || '',
          };
        }

        const currency = currencies.find(
          (curr) => curr.value === budget.currency_id?.toString()
        );

        setFormData({
          type: budget.budget_type_id?.toString() || '1',
          mainCategory: budget.category_id?.toString() || '',
          subcategory: budget.sub_category_id?.toString() || '',
          amount: budget.budget_amount?.toString() || budget.amount?.toString() || '',
          currency: currency?.value || '1',
          frequency: budget.frequency_id?.toString() || '1',
          startDate: budget.start_date || '',
          endDate: budget.end_date || '',
          isIndefinite: budget.is_duration_indefinite || false,
          description: budget.description || budget.budget_description || '',
          thirdParty: thirdPartyOption,
        });

        if (budget.amount_type) setAmountType(budget.amount_type);
        if (budget.vat_rate_id) setVatRateId(budget.vat_rate_id.toString());

        if (budget.is_provision) {
          setIsProvision(true);
          setNumProvisions(budget.num_provisions?.toString() || '');
          setProvisionDetails({
            finalPaymentDate: budget.final_payment_date || '',
            provisionAccountId: budget.provision_account_id?.toString() || '',
          });
        }
      } else {
        throw new Error(res.message || 'Données non trouvées');
      }

    } catch (error) {
      console.error("Erreur lors du chargement des données d'édition:", error);
      toast.error(`Erreur lors du chargement: ${error.message}`);
    } finally {
      setIsLoadingEditData(false);
    }
  };

  // Effets
  useEffect(() => {
    if (open && !data) {
      fetchOptions();
    }
  }, [open]);

  useEffect(() => {
    if (open && editLine && !editData) {
      fetchEditData(editLine);
    }
  }, [open, editLine?.id]);

  useEffect(() => {
    if (open && !editLine) {
      setFormData({
        type: '1',
        mainCategory: '',
        subcategory: '',
        amount: '',
        currency: '1',
        frequency: '1',
        startDate: '',
        endDate: '',
        isIndefinite: false,
        description: '',
        thirdParty: null,
      });
      setAmountType('ttc');
      setVatRateId(null);
      setIsProvision(false);
      setNumProvisions('');
      setProvisionDetails({ finalPaymentDate: '', provisionAccountId: '' });
      setEditData(null);
      setNewThirdPartyData({
        name: '',
        firstname: '',
        email: '',
        phone_number: '',
        user_type_id: '',
      });
    }
  }, [open, editLine]);

  // MODIFICATION : Le tiers n'est pas effacé quand on change le type
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === 'type') {
        newData.mainCategory = '';
        newData.subcategory = '';
        // NE PAS EFFACER le tiers quand on change le type
        // newData.thirdParty = null;
      }
      if (field === 'mainCategory') {
        newData.subcategory = '';
      }
      return newData;
    });
  };

  const handleSubmit = async () => {
    // Validation des champs obligatoires
    if (
      !formData.mainCategory ||
      !formData.subcategory ||
      !formData.amount ||
      !formData.currency ||
      !formData.frequency ||
      !formData.startDate ||
      !formData.thirdParty // Tiers maintenant toujours obligatoire pour tous les types
    ) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Veuillez saisir un montant valide');
      return;
    }

    const apiData = {
      amount: amount,
      start_date: formData.startDate,
      is_duration_indefinite: formData.isIndefinite,
      sub_category_id: parseInt(formData.subcategory),
      currency_id: parseInt(formData.currency),
      user_third_party_id: formData.thirdParty
        ? parseInt(formData.thirdParty.value)
        : null,
      frequency_id: parseInt(formData.frequency),
      budget_type_id: parseInt(formData.type),
      end_date: formData.isIndefinite ? null : formData.endDate,
      description: formData.description || '',
      amount_type_id: 1,
    };

    if (amountType) apiData.amount_type = amountType;
    if (vatRateId) apiData.vat_rate_id = parseInt(vatRateId);

    if (isProvision) {
      apiData.is_provision = true;
      apiData.num_provisions = parseInt(numProvisions) || 0;
      apiData.final_payment_date = provisionDetails.finalPaymentDate || null;
      apiData.provision_account_id = provisionDetails.provisionAccountId
        ? parseInt(provisionDetails.provisionAccountId)
        : null;
    } else {
      apiData.is_provision = false;
      apiData.num_provisions = 0;
      apiData.final_payment_date = null;
      apiData.provision_account_id = null;
    }

    setIsLoading(true);
    try {
      let res;
      if (editLine) {
        res = await apiUpdate(
          `budget-projects/budgets/${editLine.id}/details/${editLine.budget_detail_id}`,
          apiData
        );
        toast.success(res.message);
        if (onBudgetUpdated) await onBudgetUpdated();
      } else {
        const res = await apiPost(`/budget-projects/${projectId}`, apiData);
        toast.success(res.message);
        if (onBudgetAdded) await onBudgetAdded();
      }

      setTimeout(() => {
        onOpenChange(false);
      }, 600);

    } catch (error) {
      console.error('Error saving budget:', error.response?.data || error);
      toast.error(
        `Erreur lors de ${editLine ? 'la modification' : "l'ajout"
        } de la ligne budgétaire: ${errorMessage}`
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="space-y-1">
                <h2
                  id="modal-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  {editLine
                    ? 'Modifier la ligne budgétaire'
                    : 'Ajouter une ligne budgétaire'}
                </h2>
                <p className="text-sm text-gray-600">
                  {editLine
                    ? 'Modifiez les détails de votre ligne de revenu ou de dépense'
                    : 'Créez une nouvelle ligne de revenu ou de dépense pour votre budget'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="p-0 h-9 w-9 hover:bg-gray-100"
                disabled={isLoading || isLoadingData || isLoadingEditData}
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Fermer</span>
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {isLoadingData || (editLine && isLoadingEditData) ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-10 h-10 border-b-2 border-blue-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">
                      {editLine && isLoadingEditData
                        ? 'Chargement des données...'
                        : 'Chargement des options...'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <BasicInfoSection
                    onDescriptionChange={(value) =>
                      handleChange('description', value)
                    }
                    formData={formData}
                    onFormChange={handleChange}
                    listCategoryTypes={listCategoryTypes}
                    listCategories={listCategories}
                    listSubCategories={listSubCategories}
                    currencies={currencies}
                    frequencies={frequencies}
                    listThirdParty={listThirdParty || []}
                    onAddThirdParty={() => setShowThirdPartyModal(true)}
                  />

                  <AdvancedOptions
                    amountType={amountType}
                    onAmountTypeChange={setAmountType}
                    vatRateId={vatRateId}
                    onVatRateChange={setVatRateId}
                    vatRates={vatRates}
                    isProvision={isProvision}
                    onProvisionChange={setIsProvision}
                    numProvisions={numProvisions}
                    onNumProvisionsChange={setNumProvisions}
                    provisionDetails={provisionDetails}
                    onProvisionDetailsChange={setProvisionDetails}
                    provisionAccountOptions={provisionAccountOptions}
                    showProvisionButton={showProvisionButton}
                    calculatedAmounts={amounts}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isLoadingData || isLoadingEditData}
                className="min-w-[100px]"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || isLoadingData || isLoadingEditData}
                className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                    {editLine ? 'Modification...' : 'Ajout...'}
                  </>
                ) : editLine ? (
                  'Modifier'
                ) : (
                  'Ajouter'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <QuickAddThirdPartyModal
        showThirdPartyModal={showThirdPartyModal}
        setShowThirdPartyModal={setShowThirdPartyModal}
        isCreatingThirdParty={isCreatingThirdParty}
        newThirdPartyData={newThirdPartyData}
        setNewThirdPartyData={setNewThirdPartyData}
        formData={formData}
        handleAddNewThirdParty={handleAddNewThirdParty}
      />
    </>
  );
};

export default BudgetLineDialog;
