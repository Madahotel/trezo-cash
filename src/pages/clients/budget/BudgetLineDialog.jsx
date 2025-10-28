import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import {
  getOptions,
  showEditBudget,
  storeBudget,
  updateBudget,
} from '../../../components/context/budgetAction';
import AdvancedOptions from './AdvancedOptions';
import BasicInfoSection from './BasicInfoSection';
import { motion, AnimatePresence } from 'framer-motion';

const BudgetLineDialog = ({
  open,
  onOpenChange,
  editLine = null,
  onBudgetAdded,
  onBudgetUpdated,
}) => {
  const [data, setData] = useState();
  const [editData, setEditData] = useState();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);

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

  // État principal du formulaire
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

  // État pour les options avancées
  const [amountType, setAmountType] = useState('ttc');
  const [vatRateId, setVatRateId] = useState(null);
  const [isProvision, setIsProvision] = useState(false);
  const [numProvisions, setNumProvisions] = useState('');
  const [provisionDetails, setProvisionDetails] = useState({
    finalPaymentDate: '',
    provisionAccountId: '',
  });

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(false);

  // Préparation des données - utiliser useMemo pour éviter les recréations
  const currencies = React.useMemo(
    () =>
      listCurrencies.map((currency) => ({
        value: currency.id.toString(),
        label: `${currency.code} (${currency.symbol})`,
        code: currency.code,
        symbol: currency.symbol,
      })),
    [listCurrencies]
  );

  const defaultCurrency = React.useMemo(
    () => currencies.find((curr) => curr.code === 'EUR') || currencies[0],
    [currencies]
  );

  const frequencies = React.useMemo(
    () =>
      listFrequencies.map((freq) => ({
        value: freq.id.toString(),
        label: freq.name,
      })),
    [listFrequencies]
  );

  const provisionAccountOptions = React.useMemo(
    () =>
      allCashAccounts.map((account) => ({
        value: account.id.toString(),
        label: account.name,
      })),
    [allCashAccounts]
  );

  // Fonction pour filtrer les tiers - DÉPLACÉE en dehors de useMemo
  const getFilteredThirdPartyOptions = useCallback((type, thirdPartyList) => {
    if (!thirdPartyList || thirdPartyList.length === 0) return [];

    if (type === '1') {
      return thirdPartyList
        .filter(
          (thirdParty) =>
            thirdParty.user_type_id === 6 || thirdParty.user_type_id === 7
        )
        .map((thirdParty) => ({
          value:
            thirdParty.user_third_party_id?.toString() ||
            thirdParty.id?.toString(),
          label: `${thirdParty.firstname || ''} ${
            thirdParty.name || ''
          }`.trim(),
          email: thirdParty.email,
          rawData: thirdParty,
        }));
    } else if (type === '2') {
      return thirdPartyList
        .filter(
          (thirdParty) =>
            thirdParty.user_type_id === 4 || thirdParty.user_type_id === 5
        )
        .map((thirdParty) => ({
          value:
            thirdParty.user_third_party_id?.toString() ||
            thirdParty.id?.toString(),
          label: `${thirdParty.firstname || ''} ${
            thirdParty.name || ''
          }`.trim(),
          email: thirdParty.email,
          rawData: thirdParty,
        }));
    }
    return [];
  }, []);

  // Options tiers mémorisées
  const thirdPartyOptions = React.useMemo(
    () => getFilteredThirdPartyOptions(formData.type, listThirdParty),
    [formData.type, listThirdParty, getFilteredThirdPartyOptions]
  );

  // Calcul des montants
  const calculatedAmounts = useCallback(() => {
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
  }, [formData.amount, amountType, vatRateId, vatRates]);

  const amounts = calculatedAmounts();
  const showProvisionButton =
    formData.type === '1' && ['3', '4', '5', '6'].includes(formData.frequency);

  const fetchOptions = async () => {
    try {
      setIsLoadingData(true);
      const res = await getOptions();
      setData(res);
    } catch (error) {
      console.log('Erreur lors du chargement des options:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Charger les données d'édition
  const fetchEditData = useCallback(
    async (budgetId) => {
      try {
        setIsLoadingEditData(true);
        const res = await showEditBudget(budgetId);
        setEditData(res);

        // Pré-remplir le formulaire avec les données d'édition
        if (res && res.budget) {
          const budget = res.budget;

          // Approche directe : créer l'option tiers à partir des données du budget
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

          // Mettre à jour le formulaire principal en une seule fois
          setFormData({
            type: budget.budget_type_id?.toString() || '1',
            mainCategory: budget.category_id?.toString() || '',
            subcategory: budget.sub_category_id?.toString() || '',
            amount: budget.amount?.toString() || '',
            currency: currency?.value || defaultCurrency?.value || '1',
            frequency: budget.frequency_id?.toString() || '1',
            startDate: budget.start_date || '',
            endDate: budget.end_date || '',
            isIndefinite: budget.is_duration_indefinite || false,
            description: budget.description || '',
            thirdParty: thirdPartyOption,
          });

          // Mettre à jour les options avancées
          if (budget.amount_type) setAmountType(budget.amount_type);
          if (budget.vat_rate_id) setVatRateId(budget.vat_rate_id.toString());

          // Gérer les provisions
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
        console.error(
          "Erreur lors du chargement des données d'édition:",
          error
        );
      } finally {
        setIsLoadingEditData(false);
      }
    },
    [currencies, defaultCurrency]
  );

  // Charger les options seulement quand le dialog s'ouvre
  useEffect(() => {
    if (open && !data) {
      fetchOptions();
    }
  }, [open, data]);

  // Charger les données d'édition quand le dialog s'ouvre en mode édition
  useEffect(() => {
    if (open && editLine && !editData) {
      fetchEditData(editLine.id);
    }
  }, [open, editLine, editData, fetchEditData]);

  // Reset form when dialog opens - Mode création
  useEffect(() => {
    if (open && !editLine) {
      // Mode création - formulaire vide
      setFormData({
        type: '1',
        mainCategory: '',
        subcategory: '',
        amount: '',
        currency: defaultCurrency?.value || '1',
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
    }
  }, [open, editLine, defaultCurrency]);

  // Gestion des changements de formulaire
  const handleChange = useCallback((field, value) => {
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
  }, []);

  // Fonction pour soumettre le formulaire (création ou mise à jour)
  const handleSubmit = async () => {
    // Validation des champs obligatoires
    if (
      !formData.mainCategory ||
      !formData.subcategory ||
      !formData.amount ||
      !formData.currency ||
      !formData.frequency ||
      !formData.thirdParty ||
      !formData.startDate
    ) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    // Préparation des données pour l'API
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

    // Ajouter les données des options avancées si nécessaire
    if (amountType) {
      apiData.amount_type = amountType;
    }

    if (vatRateId) {
      apiData.vat_rate_id = parseInt(vatRateId);
    }

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
        // Mode mise à jour
        res = await updateBudget(apiData, editLine.id);

        // Appeler le callback de mise à jour si fourni
        if (onBudgetUpdated) {
          await onBudgetUpdated();
        }
      } else {
        // Mode création
        res = await storeBudget(apiData, 1);

        // Appeler le callback d'ajout si fourni
        if (onBudgetAdded) {
          await onBudgetAdded();
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving budget:', error);
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        let errorMessage = 'Erreur de validation:\n';
        Object.keys(validationErrors).forEach((field) => {
          errorMessage += `- ${validationErrors[field].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        alert(
          `Erreur lors de ${
            editLine ? 'la modification' : "l'ajout"
          } de la ligne budgétaire`
        );
      }
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
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="space-y-1">
                <h2 id="modal-title" className="text-lg font-semibold">
                  {editLine
                    ? 'Modifier la ligne budgétaire'
                    : 'Ajouter une ligne budgétaire'}
                </h2>
                <p className="text-sm text-gray-500">
                  {editLine
                    ? 'Modifiez la ligne de revenu ou de dépense'
                    : 'Créez une ligne de revenu ou de dépense'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
                disabled={isLoading || isLoadingData || isLoadingEditData}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fermer</span>
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {isLoadingData || (editLine && isLoadingEditData) ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-2">
                    {editLine && isLoadingEditData
                      ? 'Chargement des données...'
                      : 'Chargement des options...'}
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Section Informations de base */}
                  <BasicInfoSection
                    formData={formData}
                    onFormChange={handleChange}
                    listCategoryTypes={listCategoryTypes}
                    listCategories={listCategories}
                    listSubCategories={listSubCategories}
                    currencies={currencies}
                    frequencies={frequencies}
                    thirdPartyOptions={thirdPartyOptions}
                  />

                  {/* Options avancées */}
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
            <div className="flex justify-end gap-2 p-6 border-t shrink-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || isLoadingData || isLoadingEditData}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || isLoadingData || isLoadingEditData}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BudgetLineDialog;
