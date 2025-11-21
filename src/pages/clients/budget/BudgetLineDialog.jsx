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

  // Extraction des données de l'API avec valeurs par défaut
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

  // Transformations simples - déplacées après les useState
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

  // Fonction pour filtrer les tiers
  const getFilteredThirdPartyOptions = (type, thirdPartyList) => {
    if (!thirdPartyList || thirdPartyList.length === 0) return [];

    const normalizedList = thirdPartyList.map((thirdParty) => ({
      id: thirdParty.id || thirdParty.user_id || thirdParty.user_third_party_id,
      user_type_id: thirdParty.user_type_id || thirdParty.type_id,
      name:
        thirdParty.name ||
        thirdParty.company_name ||
        thirdParty.entreprise_name,
      firstname: thirdParty.firstname || thirdParty.prenom || '',
      email: thirdParty.email || thirdParty.mail || '',
      raw: thirdParty,
    }));

    if (type === '1') {
      return normalizedList
        .filter(
          (thirdParty) =>
            thirdParty.user_type_id == 6 || thirdParty.user_type_id == 5
        )
        .map((thirdParty) => ({
          value: thirdParty.id?.toString(),
          label:
            `${thirdParty.firstname || ''} ${thirdParty.name || ''}`.trim() ||
            'Sans nom',
          email: thirdParty.email,
          type: thirdParty.user_type_id == 6 ? 'Fournisseur' : 'Emprunteur',
          rawData: thirdParty.raw,
        }));
    } else if (type === '2') {
      return normalizedList
        .filter(
          (thirdParty) =>
            thirdParty.user_type_id == 4 || thirdParty.user_type_id == 7
        )
        .map((thirdParty) => ({
          value: thirdParty.id?.toString(),
          label:
            `${thirdParty.firstname || ''} ${thirdParty.name || ''}`.trim() ||
            'Sans nom',
          email: thirdParty.email,
          type: thirdParty.user_type_id == 4 ? 'Client' : 'Prêteur',
          rawData: thirdParty.raw,
        }));
    }
    return [];
  };

  const thirdPartyOptions = getFilteredThirdPartyOptions(
    formData.type,
    listThirdParty
  );

  const createThirdParty = async (thirdPartyData) => {
    try {
      setIsCreatingThirdParty(true);

      // Convertir user_type_id en number
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
      } else {
        combinedList = res.thirdParties || res.data || [];
      }

      setData({
        ...res,
        listThirdParty: combinedList,
      });
    } catch (error) {
      console.error('❌ Erreur chargement options:', error);
      toast.error('Erreur lors du chargement des options');
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchEditData = async (budgetId) => {
    try {
      setIsLoadingEditData(true);
      const res = await apiGet(`/budget-projects/budgets/${budgetId}`);
      setEditData(res);

      if (res && res.budget) {
        const budget = res.budget;
        const thirdPartyOption = {
          value: budget.user_third_party_id?.toString(),
          label: `${budget.user_third_party_firstname || ''} ${
            budget.user_third_party_name || ''
          }`.trim(),
          email: budget.user_third_party_email,
        };

        const currency = currencies.find(
          (curr) => curr.value === budget.currency_id?.toString()
        );

        setFormData({
          type: budget.budget_type_id?.toString() || '1',
          mainCategory: budget.category_id?.toString() || '',
          subcategory: budget.sub_category_id?.toString() || '',
          amount: budget.amount?.toString() || '',
          currency: currency?.value || '1',
          frequency: budget.frequency_id?.toString() || '1',
          startDate: budget.start_date || '',
          endDate: budget.end_date || '',
          isIndefinite: budget.is_duration_indefinite || false,
          description: budget.description || '',
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
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données d'édition:", error);
      toast.error("Erreur lors du chargement des données d'édition");
    } finally {
      setIsLoadingEditData(false);
    }
  };

  // CORRECTION : Effets avec dépendances fixes
  useEffect(() => {
    if (open && !data) {
      fetchOptions();
    }
  }, [open]); // ← data retiré des dépendances

  useEffect(() => {
    if (open && editLine && !editData) {
      fetchEditData(editLine.id);
    }
  }, [open, editLine?.id]); // ← editData retiré, seulement l'ID

  // CORRECTION : Effet de reset
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
  }, [open, editLine]); // ← defaultCurrency retiré

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === 'type') {
        newData.mainCategory = '';
        newData.subcategory = '';
        newData.thirdParty = null;
      }
      if (field === 'mainCategory') {
        newData.subcategory = '';
      }
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.mainCategory ||
      !formData.subcategory ||
      !formData.amount ||
      !formData.currency ||
      !formData.frequency ||
      !formData.thirdParty ||
      !formData.startDate
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
      user_third_party_id: parseInt(formData.thirdParty.value),
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
      if (editLine) {
        const res = await apiUpdate(
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
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error(
        `Erreur lors de ${
          editLine ? 'la modification' : "l'ajout"
        } de la ligne budgétaire: ${error.message}`
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
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
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
                className="h-9 w-9 p-0 hover:bg-gray-100"
                disabled={isLoading || isLoadingData || isLoadingEditData}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fermer</span>
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {isLoadingData || (editLine && isLoadingEditData) ? (
                <div className="flex justify-center items-center py-12">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
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
                    formData={formData}
                    onFormChange={handleChange}
                    listCategoryTypes={listCategoryTypes}
                    listCategories={listCategories}
                    listSubCategories={listSubCategories}
                    currencies={currencies}
                    frequencies={frequencies}
                    thirdPartyOptions={thirdPartyOptions}
                    onAddThirdParty={() => setShowThirdPartyModal(true)}
                  />

                  <AdvancedOptions
                    description={formData.description}
                    onDescriptionChange={(value) =>
                      handleChange('description', value)
                    }
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
