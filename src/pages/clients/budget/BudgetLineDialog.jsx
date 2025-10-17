import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, ChevronDown, User, Tag } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import Select from 'react-select';
import { storeBudget } from '../../../components/context/budgetAction';

const BudgetLineDialog = ({
  open,
  onOpenChange,
  editLine = null,
  data = {},
  onBudgetAdded,
}) => {
  // Extraction des données de l'API
  const {
    listCategories = [],
    listSubCategories = [],
    listCategoryTypes = [],
    listFrequencies = [],
    listCurrencies = [],
    listThirdParty = [],
  } = data;

  // États pour les menus déroulants
  const [typeOpen, setTypeOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Références pour fermer les menus en cliquant à l'extérieur
  const typeRef = useRef(null);
  const categoryRef = useRef(null);
  const subcategoryRef = useRef(null);
  const currencyRef = useRef(null);
  const frequencyRef = useRef(null);

  // Fonction pour obtenir les classes de couleur
  const getColorClasses = (color) => {
    const colorClasses = {
      green: { text: 'text-green-600', bg: 'bg-green-100' },
      blue: { text: 'text-blue-600', bg: 'bg-blue-100' },
      red: { text: 'text-red-600', bg: 'bg-red-100' },
      yellow: { text: 'text-yellow-600', bg: 'bg-yellow-100' },
      purple: { text: 'text-purple-600', bg: 'bg-purple-100' },
      indigo: { text: 'text-indigo-600', bg: 'bg-indigo-100' },
      pink: { text: 'text-pink-600', bg: 'bg-pink-100' },
      orange: { text: 'text-orange-600', bg: 'bg-orange-100' },
      emerald: { text: 'text-emerald-600', bg: 'bg-emerald-100' },
      stone: { text: 'text-stone-600', bg: 'bg-stone-100' },
    };
    return colorClasses[color] || { text: 'text-gray-600', bg: 'bg-gray-100' };
  };

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

  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  // Fonction utilitaire pour générer une couleur aléatoire
  const getRandomColor = useCallback(() => {
    const colors = [
      'green',
      'blue',
      'red',
      'yellow',
      'purple',
      'indigo',
      'pink',
      'orange',
      'emerald',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // Préparation des données statiques
  const currencies = listCurrencies.map((currency) => ({
    value: currency.id.toString(),
    label: `${currency.code} (${currency.symbol})`,
    code: currency.code,
    symbol: currency.symbol,
  }));

  const defaultCurrency =
    currencies.find((curr) => curr.code === 'EUR') || currencies[0];

  // Types de catégories (Dépense/Revenue)
  const categoryTypes = [
    { value: '1', label: 'Dépense' },
    { value: '2', label: 'Revenue' },
  ];

  // Fréquences
  const frequencies = listFrequencies.map((freq) => ({
    value: freq.id.toString(),
    label: freq.name,
  }));

  // Fonction pour filtrer les tiers - version simplifiée
  const getFilteredThirdPartyOptions = useCallback(
    (type) => {
      if (type === '1') {
        // Dépense
        return listThirdParty
          .filter(
            (thirdParty) =>
              thirdParty.user_type_id === 6 || // Fournisseur
              thirdParty.user_type_id === 7 // Prêteur
          )
          .map((thirdParty) => ({
            value:
              thirdParty.user_third_party_id?.toString() ||
              thirdParty.id?.toString(),
            label: `${thirdParty.firstname} ${thirdParty.name}`,
            email: thirdParty.email,
            rawData: thirdParty,
          }));
      } else if (type === '2') {
        // Revenu
        return listThirdParty
          .filter(
            (thirdParty) =>
              thirdParty.user_type_id === 4 || // Client
              thirdParty.user_type_id === 5 // Emprunteur
          )
          .map((thirdParty) => ({
            value:
              thirdParty.user_third_party_id?.toString() ||
              thirdParty.id?.toString(),
            label: `${thirdParty.firstname} ${thirdParty.name}`,
            email: thirdParty.email,
            rawData: thirdParty,
          }));
      }
      return [];
    },
    [listThirdParty]
  );

  // Options de tiers actuelles
  const thirdPartyOptions = getFilteredThirdPartyOptions(formData.type);

  // Fermer les menus en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setTypeOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }
      if (
        subcategoryRef.current &&
        !subcategoryRef.current.contains(event.target)
      ) {
        setSubcategoryOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target)) {
        setCurrencyOpen(false);
      }
      if (
        frequencyRef.current &&
        !frequencyRef.current.contains(event.target)
      ) {
        setFrequencyOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Empêcher le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Reset form when dialog opens - CORRIGÉ
  useEffect(() => {
    if (open) {
      if (editLine) {
        // Trouver le tiers correspondant pour l'édition
        const currentThirdPartyOptions = getFilteredThirdPartyOptions(
          editLine.budget_type_id?.toString() ||
            (editLine.category_type_name === 'Revenue' ? '2' : '1')
        );

        const thirdPartyOption = currentThirdPartyOptions.find(
          (option) => option.value === editLine.user_third_party_id?.toString()
        );

        // Trouver la devise par ID
        const currency = currencies.find(
          (curr) => curr.code === editLine.currency_code
        );

        setFormData({
          type:
            editLine.budget_type_id?.toString() ||
            (editLine.category_type_name === 'Revenue' ? '2' : '1'),
          mainCategory: editLine.category_id?.toString() || '',
          subcategory: editLine.sub_category_id?.toString() || '',
          amount: editLine.amount?.toString() || '',
          currency: currency?.value || defaultCurrency?.value || '1',
          frequency: editLine.frequency_id?.toString() || '1',
          startDate: editLine.start_date || '',
          endDate: editLine.end_date || '',
          isIndefinite: editLine.is_duration_indefinite || false,
          description: editLine.description || '',
          thirdParty: thirdPartyOption || null,
        });
      } else {
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
      }
    }
  }, [open, editLine]); // Seulement open et editLine comme dépendances

  // Load categories when type changes - CORRIGÉ
  useEffect(() => {
    if (open) {
      const categories = listCategories.filter(
        (cat) => cat.category_type_id?.toString() === formData.type
      );
      setAvailableCategories(categories || []);
    }
  }, [open, formData.type, listCategories]);

  // Load subcategories when main category changes - CORRIGÉ
  useEffect(() => {
    if (open && formData.mainCategory) {
      const subcategories = listSubCategories.filter(
        (sub) => sub.category_id?.toString() === formData.mainCategory
      );
      setAvailableSubcategories(subcategories || []);
    } else if (open) {
      setAvailableSubcategories([]);
    }
  }, [open, formData.mainCategory, listSubCategories]);

  // Réinitialiser le tiers quand le type change - CORRIGÉ
  useEffect(() => {
    if (open && formData.thirdParty) {
      const currentOptions = getFilteredThirdPartyOptions(formData.type);
      const isValidThirdParty = currentOptions.some(
        (option) => option.value === formData.thirdParty?.value
      );

      if (!isValidThirdParty) {
        setFormData((prev) => ({
          ...prev,
          thirdParty: null,
        }));
      }
    }
  }, [open, formData.type, getFilteredThirdPartyOptions]); // Ajout de getFilteredThirdPartyOptions

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Si le type change, réinitialiser la catégorie, sous-catégorie et tiers
      if (field === 'type') {
        newData.mainCategory = '';
        newData.subcategory = '';
        newData.thirdParty = null;
      }

      // Si la catégorie principale change, réinitialiser la sous-catégorie
      if (field === 'mainCategory') {
        newData.subcategory = '';
      }

      return newData;
    });
  }, []);

  const handleSubmit = async () => {
    console.log('Submitting form:', formData);

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
      alert(
        'Veuillez remplir tous les champs obligatoires (type, catégorie, sous-catégorie, montant, devise, fréquence, tiers et date de début)'
      );
      return;
    }

    // Validation du montant
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    // Préparer les données pour l'API
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

    console.log('Sending to API:', apiData);

    try {
      // Sauvegarder les données
      const res = await storeBudget(apiData, 1);
      console.log('Save response:', res);

      // Appeler le callback pour notifier le parent de recharger les données
      if (onBudgetAdded) {
        await onBudgetAdded();
      }

      console.log('Ligne budgétaire ajoutée avec succès');
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
        alert("Erreur lors de l'ajout de la ligne budgétaire");
      }
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

  // Fonctions pour obtenir les labels affichés
  const getTypeLabel = () => {
    const type = categoryTypes.find((t) => t.value === formData.type);
    return type?.label || 'Choisir le type';
  };

  const getCategoryLabel = () => {
    const category = listCategories.find(
      (cat) => cat.id?.toString() === formData.mainCategory
    );
    return category?.name || 'Choisir une catégorie...';
  };

  const getSubcategoryLabel = () => {
    if (!formData.mainCategory) {
      return "Sélectionnez d'abord une catégorie principale...";
    }

    const subcategory = listSubCategories.find(
      (sub) => sub.id?.toString() === formData.subcategory
    );

    return (
      subcategory?.name ||
      (availableSubcategories.length === 0
        ? 'Aucune sous-catégorie disponible'
        : 'Choisir une sous-catégorie...')
    );
  };

  const getCurrencyLabel = () => {
    const currency = currencies.find(
      (curr) => curr.value === formData.currency
    );
    return currency ? `${currency.label}` : 'Choisir une devise';
  };

  const getFrequencyLabel = () => {
    const frequency = frequencies.find(
      (freq) => freq.value === formData.frequency
    );
    return frequency?.label || 'Choisir une fréquence';
  };

  // Obtenir le placeholder dynamique pour les tiers
  const getThirdPartyPlaceholder = () => {
    if (formData.type === '1') {
      return 'Sélectionnez un fournisseur ou prêteur...';
    } else if (formData.type === '2') {
      return 'Sélectionnez un client ou emprunteur...';
    }
    return 'Sélectionnez un tiers...';
  };

  // Styles personnalisés pour le Select React
  const customStyles = {
    control: (base, state) => ({
      ...base,
      height: '40px',
      minHeight: '40px',
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      borderRadius: '6px',
      boxShadow: state.isFocused
        ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
        : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      zIndex: 60,
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.875rem',
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
        ? '#f3f4f6'
        : 'white',
      color: state.isSelected ? 'white' : '#374151',
      '&:active': {
        backgroundColor: state.isSelected ? '#3b82f6' : '#e5e7eb',
      },
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: '0.875rem',
      color: '#374151',
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '0.875rem',
      color: '#6b7280',
    }),
    input: (base) => ({
      ...base,
      fontSize: '0.875rem',
    }),
  };

  // Composant personnalisé pour l'option du Select
  const CustomOption = ({
    innerRef,
    innerProps,
    data,
    isSelected,
    isFocused,
  }) => (
    <div
      ref={innerRef}
      {...innerProps}
      className={`
        flex items-center px-3 py-2 cursor-pointer text-sm
        ${
          isSelected ? 'bg-blue-500 text-white' : isFocused ? 'bg-gray-100' : ''
        }
      `}
    >
      <User className="h-4 w-4 mr-2 text-gray-500" />
      <div className="flex-1">
        <div className="font-medium">{data.label}</div>
        <div
          className={`text-xs ${
            isSelected ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {data.email}
        </div>
      </div>
      {isSelected && <Check className="h-4 w-4 ml-2" />}
    </div>
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
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
              Créez ou modifiez une ligne de revenu ou de dépense
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="space-y-4">
            {/* Type (Revenu/Dépense) */}
            <div className="space-y-2">
              <Label htmlFor="type-select">Type *</Label>
              <div ref={typeRef} className="relative w-full">
                <button
                  id="type-select"
                  onClick={() => setTypeOpen(!typeOpen)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="truncate">{getTypeLabel()}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {typeOpen && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {categoryTypes.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => {
                          handleChange('type', type.value);
                          setTypeOpen(false);
                        }}
                        className={`
                          relative flex cursor-pointer items-center py-2 px-3 text-sm
                          ${
                            formData.type === type.value
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-100'
                          }
                        `}
                      >
                        <span className="flex-1">{type.label}</span>
                        {formData.type === type.value && (
                          <Check className="h-4 w-4 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Catégorie principale */}
            <div className="space-y-2">
              <Label htmlFor="category-select">Catégorie principale *</Label>
              <div ref={categoryRef} className="relative w-full">
                <button
                  id="category-select"
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="truncate">{getCategoryLabel()}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {categoryOpen && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {availableCategories.map((category) => {
                      const colorClass = getColorClasses(getRandomColor());
                      return (
                        <div
                          key={category.id}
                          onClick={() => {
                            handleChange(
                              'mainCategory',
                              category.id.toString()
                            );
                            setCategoryOpen(false);
                          }}
                          className={`
                            relative flex cursor-pointer items-center py-2 px-3 text-sm
                            ${
                              formData.mainCategory === category.id.toString()
                                ? 'bg-blue-500 text-white'
                                : 'hover:bg-gray-100'
                            }
                          `}
                        >
                          <Tag className={`w-4 h-4 mr-2 ${colorClass.text}`} />
                          <span className="flex-1">{category.name}</span>
                          {formData.mainCategory === category.id.toString() && (
                            <Check className="h-4 w-4 ml-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sous-catégorie */}
            <div className="space-y-2">
              <Label htmlFor="subcategory-select">Sous-catégorie *</Label>
              <div ref={subcategoryRef} className="relative w-full">
                <button
                  id="subcategory-select"
                  onClick={() => {
                    if (
                      formData.mainCategory &&
                      availableSubcategories.length > 0
                    ) {
                      setSubcategoryOpen(!subcategoryOpen);
                    }
                  }}
                  disabled={
                    !formData.mainCategory ||
                    availableSubcategories.length === 0
                  }
                  className={`
                    flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${
                      !formData.mainCategory ||
                      availableSubcategories.length === 0
                        ? 'opacity-50 cursor-not-allowed bg-gray-50'
                        : ''
                    }
                  `}
                >
                  <span className="truncate">{getSubcategoryLabel()}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {subcategoryOpen && availableSubcategories.length > 0 && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {availableSubcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        onClick={() => {
                          handleChange(
                            'subcategory',
                            subcategory.id.toString()
                          );
                          setSubcategoryOpen(false);
                        }}
                        className={`
                          relative flex cursor-pointer items-center py-2 px-3 text-sm
                          ${
                            formData.subcategory === subcategory.id.toString()
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-100'
                          }
                        `}
                      >
                        <span className="flex-1">{subcategory.name}</span>
                        {formData.subcategory === subcategory.id.toString() && (
                          <Check className="h-4 w-4 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Montant et Devise */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency-select">Devise *</Label>
                <div ref={currencyRef} className="relative w-full">
                  <button
                    id="currency-select"
                    onClick={() => setCurrencyOpen(!currencyOpen)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="truncate">{getCurrencyLabel()}</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  {currencyOpen && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      {currencies.map((currency) => (
                        <div
                          key={currency.value}
                          onClick={() => {
                            handleChange('currency', currency.value);
                            setCurrencyOpen(false);
                          }}
                          className={`
                            relative flex cursor-pointer items-center py-2 px-3 text-sm
                            ${
                              formData.currency === currency.value
                                ? 'bg-blue-500 text-white'
                                : 'hover:bg-gray-100'
                            }
                          `}
                        >
                          <span className="flex-1">{currency.label}</span>
                          {formData.currency === currency.value && (
                            <Check className="h-4 w-4 ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fréquence */}
            <div className="space-y-2">
              <Label htmlFor="frequency-select">Fréquence *</Label>
              <div ref={frequencyRef} className="relative w-full">
                <button
                  id="frequency-select"
                  onClick={() => setFrequencyOpen(!frequencyOpen)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="truncate">{getFrequencyLabel()}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {frequencyOpen && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {frequencies.map((frequency) => (
                      <div
                        key={frequency.value}
                        onClick={() => {
                          handleChange('frequency', frequency.value);
                          setFrequencyOpen(false);
                        }}
                        className={`
                          relative flex cursor-pointer items-center py-2 px-3 text-sm
                          ${
                            formData.frequency === frequency.value
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-100'
                          }
                        `}
                      >
                        <span className="flex-1">{frequency.label}</span>
                        {formData.frequency === frequency.value && (
                          <Check className="h-4 w-4 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tiers */}
            <div className="space-y-2">
              <Label htmlFor="thirdparty-select">Tiers *</Label>
              <Select
                id="thirdparty-select"
                value={formData.thirdParty}
                onChange={(selectedOption) =>
                  handleChange('thirdParty', selectedOption)
                }
                options={thirdPartyOptions}
                placeholder={getThirdPartyPlaceholder()}
                isClearable
                styles={customStyles}
                components={{ Option: CustomOption }}
                className="react-select-container"
                classNamePrefix="react-select"
                isDisabled={thirdPartyOptions.length === 0}
              />
              {thirdPartyOptions.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.type === '1'
                    ? 'Aucun fournisseur ou prêteur disponible'
                    : 'Aucun client ou emprunteur disponible'}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  disabled={formData.isIndefinite}
                  className="w-full"
                />
              </div>
            </div>

            {/* Indéterminé */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isIndefinite"
                checked={formData.isIndefinite}
                onCheckedChange={(checked) => {
                  handleChange('isIndefinite', checked);
                  if (checked) {
                    handleChange('endDate', '');
                  }
                }}
              />
              <Label htmlFor="isIndefinite" className="cursor-pointer">
                Durée indéterminée
              </Label>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Description de la ligne budgétaire..."
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            {editLine ? 'Sauvegarder' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BudgetLineDialog;
