import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import QuickAddThirdPartyModal from './QuickAddThirdPartyModal';
import { apiService } from '../../../utils/ApiService';

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
  const currencies = useMemo(
    () =>
      listCurrencies.map((currency) => ({
        value: currency.id?.toString() || `currency-${currency.code}`,
        label: `${currency.code} (${currency.symbol})`,
        code: currency.code,
        symbol: currency.symbol,
      })),
    [listCurrencies]
  );

  const defaultCurrency = useMemo(
    () => currencies.find((curr) => curr.code === 'EUR') || currencies[0],
    [currencies]
  );

  const frequencies = useMemo(
    () =>
      listFrequencies.map((freq) => ({
        value: freq.id?.toString() || `freq-${freq.name}`,
        label: freq.name,
      })),
    [listFrequencies]
  );

  const provisionAccountOptions = useMemo(
    () =>
      allCashAccounts.map((account) => ({
        value: account.id?.toString() || `account-${account.name}`,
        label: account.name,
      })),
    [allCashAccounts]
  );

  const getFilteredThirdPartyOptions = useCallback((type, thirdPartyList) => {
    if (!thirdPartyList || thirdPartyList.length === 0) return [];

    // Normaliser la structure des données
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

    console.log('📊 Données normalisées:', normalizedList);

    // NOUVELLE LOGIQUE : Fournisseur + Emprunteur ensemble, Client + Prêteur ensemble
    if (type === '1') {
      // Dépenses
      return normalizedList
        .filter(
          (thirdParty) =>
            thirdParty.user_type_id == 6 || thirdParty.user_type_id == 5 // Fournisseurs (6) ou Emprunteurs (5)
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
      // Revenus
      return normalizedList
        .filter(
          (thirdParty) =>
            thirdParty.user_type_id == 4 || thirdParty.user_type_id == 7 // Clients (4) ou Prêteurs (7)
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
  }, []);

  const thirdPartyOptions = useMemo(() => {
    const options = getFilteredThirdPartyOptions(formData.type, listThirdParty);
    console.log('🎯 ThirdParty Options finales:', {
      type: formData.type,
      optionsCount: options.length,
      options: options.map((opt) => ({ label: opt.label, type: opt.type })),
    });
    return options;
  }, [formData.type, listThirdParty, getFilteredThirdPartyOptions]);

  const createThirdParty = async (thirdPartyData) => {
    try {
      setIsCreatingThirdParty(true);

      console.log('📤 DONNÉES ENVOYÉES au backend:', thirdPartyData);

      const response = await apiService.request(
        'POST',
        '/users/third-parties',
        thirdPartyData
      );

      if (response.success) {
        console.log('✅ Tiers créé avec succès:', response.data);
        await fetchOptions();
        return response.data;
      } else {
        console.error("❌ Réponse d'erreur du backend:", response);

        let errorMessage = 'Erreur lors de la création du tiers';

        // Gestion spécifique des erreurs de validation
        if (response.status === 422 && response.validationErrors) {
          const errors = Object.entries(response.validationErrors)
            .map(([field, messages]) => {
              // Message personnalisé pour l'email unique
              if (
                field === 'email' &&
                messages.some((msg) => msg.includes('unique'))
              ) {
                return `L'adresse email "${thirdPartyData.email}" est déjà utilisée par un autre tiers. Veuillez utiliser une adresse email différente.`;
              }
              return `${field}: ${messages.join(', ')}`;
            })
            .join('; ');
          errorMessage = errors;
        }
        // Gestion des erreurs serveur avec message spécifique
        else if (response.status === 500) {
          // Vérifie si l'erreur concerne un email dupliqué
          const errorDetail =
            response.data?.error || response.data?.message || '';
          if (errorDetail.includes('email') && errorDetail.includes('unique')) {
            errorMessage = `L'adresse email "${thirdPartyData.email}" est déjà utilisée. Veuillez utiliser une autre adresse email.`;
          } else if (errorDetail.includes('Duplicate entry')) {
            errorMessage =
              'Cette adresse email est déjà utilisée par un autre tiers.';
          } else {
            errorMessage =
              response.data?.message || 'Erreur serveur. Veuillez réessayer.';
          }
        }
        // Autres erreurs
        else if (response.error) {
          errorMessage = response.error;
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Erreur création tiers:', {
        message: error.message,
        data: thirdPartyData,
      });
      throw error;
    } finally {
      setIsCreatingThirdParty(false);
    }
  };
  const handleAddNewThirdParty = async () => {
    if (!newThirdPartyData.name.trim()) {
      alert('Le nom du tiers est obligatoire');
      return;
    }

    if (!newThirdPartyData.user_type_id) {
      alert('Veuillez sélectionner un type de tiers');
      return;
    }

    // Vérification côté client pour les emails vides
    if (newThirdPartyData.email && !isValidEmail(newThirdPartyData.email)) {
      alert('Veuillez saisir une adresse email valide');
      return;
    }

    // STRUCTURE EXACTE attendue par le backend
    const thirdPartyData = {
      name: newThirdPartyData.name.trim(),
      firstname: newThirdPartyData.firstname?.trim() || '',
      email: newThirdPartyData.email?.trim() || null, // null si vide
      phone_number: newThirdPartyData.phone_number?.trim() || '',
      user_type_id: newThirdPartyData.user_type_id,
      password: 'password123', // Mot de passe par défaut
    };

    console.log('🎯 Données préparées pour le backend:', thirdPartyData);

    try {
      const result = await createThirdParty(thirdPartyData);

      if (result) {
        // Réinitialiser le formulaire
        setNewThirdPartyData({
          name: '',
          firstname: '',
          email: '',
          phone_number: '',
          user_type_id: '',
        });
        setShowThirdPartyModal(false);

        // Message de succès
        console.log('✅ Tiers créé avec succès!');
      }
    } catch (error) {
      console.error('❌ Erreur création tiers:', error);

      // Affichage d'alerte amélioré
      alert(`Erreur lors de la création du tiers:\n\n${error.message}`);
    }
  };

  // Fonction utilitaire pour valider l'email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

      console.log('🔍 STRUCTURE COMPLÈTE DE getOptions():', res);
      console.log('📋 Clés disponibles:', Object.keys(res));

      // Vérifiez différentes structures possibles
      if (res.users) {
        console.log('👥 Structure users trouvée:', {
          userThirdParties: res.users.user_third_parties,
          userFinancials: res.users.user_financials,
          userThirdPartiesData:
            res.users.user_third_parties?.user_third_party_items?.data,
          userFinancialsData:
            res.users.user_financials?.user_financial_items?.data,
        });
      }

      if (res.listThirdParty) {
        console.log('📦 listThirdParty directe:', res.listThirdParty);
      }

      // Essayez différentes approches pour récupérer les données
      let combinedList = [];

      // Approche 1: Structure avec users
      if (res.users) {
        const userThirdParties =
          res.users.user_third_parties?.user_third_party_items?.data || [];
        const userFinancials =
          res.users.user_financials?.user_financial_items?.data || [];
        combinedList = [...userThirdParties, ...userFinancials];

        console.log('🔄 Combinaison users + financials:', {
          userThirdPartiesCount: userThirdParties.length,
          userFinancialsCount: userFinancials.length,
          combinedCount: combinedList.length,
        });
      }
      // Approche 2: Structure directe
      else if (res.listThirdParty) {
        combinedList = res.listThirdParty;
        console.log(
          '🎯 Utilisation listThirdParty directe:',
          combinedList.length
        );
      }
      // Approche 3: Autre structure
      else {
        console.warn('⚠️ Structure inconnue, utilisation des données brutes');
        combinedList = res.thirdParties || res.data || [];
      }

      console.log(
        '📊 DÉTAIL des tiers combinés:',
        combinedList.map((t) => ({
          id: t.id,
          name: t.name,
          firstname: t.firstname,
          user_type_id: t.user_type_id,
          type:
            t.user_type_id === 4
              ? 'Client'
              : t.user_type_id === 5
              ? 'Emprunteur'
              : t.user_type_id === 6
              ? 'Fournisseur'
              : t.user_type_id === 7
              ? 'Prêteur'
              : 'Inconnu',
        }))
      );

      setData({
        ...res,
        listThirdParty: combinedList,
      });
    } catch (error) {
      console.error('❌ Erreur chargement options:', error);
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
      setNewThirdPartyData({
        name: '',
        firstname: '',
        email: '',
        phone_number: '',
        user_type_id: '',
      });
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

        if (onBudgetUpdated) {
          await onBudgetUpdated();
        }
      } else {
        // Mode création
        res = await storeBudget(apiData, projectId);

        if (onBudgetAdded) {
          await onBudgetAdded();
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving budget:', error);
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
      {/* Dialog principal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
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
                    onAddThirdParty={() => setShowThirdPartyModal(true)}
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

      {/* Modal de création de tiers - COMPOSANT SÉPARÉ */}
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
