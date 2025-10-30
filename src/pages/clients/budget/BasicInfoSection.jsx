import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Check, ChevronDown, User, Tag } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import Select from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';
import CustomDropdown from './CustomDropdown';

const BasicInfoSection = ({
  formData,
  onFormChange,
  listCategoryTypes,
  listCategories,
  listSubCategories,
  currencies,
  frequencies,
  thirdPartyOptions,
}) => {
  // États pour les menus déroulants
  const [typeOpen, setTypeOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [frequencyOpen, setFrequencyOpen] = useState(false);

  // Références pour fermer les menus en cliquant à l'extérieur
  const typeRef = useRef(null);
  const categoryRef = useRef(null);
  const subcategoryRef = useRef(null);
  const currencyRef = useRef(null);
  const frequencyRef = useRef(null);

  // Vérifier si la fréquence est ponctuelle ou si elle ne permet pas de choisir la date de fin
  const isPonctualFrequency = formData.frequency === '1'; // Ponctuelle
  const isIrregularFrequency = formData.frequency === '9'; // Irrégulière

  // Fréquences qui ne permettent pas de choisir la date de fin (calcul automatique)
  const autoCalculateFrequencies = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const shouldAutoCalculate = autoCalculateFrequencies.includes(
    formData.frequency
  );
  const shouldHideEndDate = isPonctualFrequency || isIrregularFrequency;

  // Fonction pour calculer la date de fin en fonction de la fréquence et de la date de début
  const calculateEndDate = useCallback((startDate, frequency) => {
    if (!startDate) return '';

    const start = new Date(startDate);

    switch (frequency) {
      case '1': // Ponctuelle
        return startDate; // Même date que le début

      case '2': // Quotidienne
        return startDate; // Même date que le début

      case '3': // Mensuelle
        const monthlyEnd = new Date(start);
        monthlyEnd.setMonth(start.getMonth() + 1); // Même jour du mois suivant
        return monthlyEnd.toISOString().split('T')[0];

      case '4': // Hebdomadaire
        const weeklyEnd = new Date(start);
        weeklyEnd.setDate(start.getDate() + 6); // 7 jours - 1 jour = 6 jours à ajouter
        return weeklyEnd.toISOString().split('T')[0];

      case '5': // Bimensuelle
        const biWeeklyEnd = new Date(start);
        biWeeklyEnd.setDate(start.getDate() + 13); // 14 jours - 1 jour = 13 jours à ajouter
        return biWeeklyEnd.toISOString().split('T')[0];

      case '6': // Trimestrielle
        const quarterlyEnd = new Date(start);
        quarterlyEnd.setMonth(start.getMonth() + 3); // Même jour dans 3 mois
        return quarterlyEnd.toISOString().split('T')[0];

      case '7': // Semestrielle
        const semiAnnualEnd = new Date(start);
        semiAnnualEnd.setMonth(start.getMonth() + 6); // Même jour dans 6 mois
        return semiAnnualEnd.toISOString().split('T')[0];

      case '8': // Annuelle
        const yearlyEnd = new Date(start);
        yearlyEnd.setFullYear(start.getFullYear() + 1); // Même jour l'année suivante
        return yearlyEnd.toISOString().split('T')[0];

      case '9': // Irrégulière
        return ''; // Pas de calcul automatique, l'utilisateur choisit

      default:
        return '';
    }
  }, []);

  // Effet pour calculer automatiquement la date de fin quand la date de début ou la fréquence change
  useEffect(() => {
    if (formData.startDate && shouldAutoCalculate && !formData.isIndefinite) {
      const calculatedEndDate = calculateEndDate(
        formData.startDate,
        formData.frequency
      );
      if (calculatedEndDate && calculatedEndDate !== formData.endDate) {
        onFormChange('endDate', calculatedEndDate);
      }
    }

    // Si fréquence irrégulière, réinitialiser la date de fin
    if (isIrregularFrequency && formData.endDate) {
      onFormChange('endDate', '');
    }
  }, [
    formData.startDate,
    formData.frequency,
    formData.isIndefinite,
    formData.endDate,
    shouldAutoCalculate,
    isIrregularFrequency,
    calculateEndDate,
    onFormChange,
  ]);

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

  // Filtrage des données disponibles
  const availableCategories = listCategories.filter(
    (cat) => cat.category_type_id?.toString() === formData.type
  );

  const availableSubcategories = listSubCategories.filter(
    (sub) => sub.category_id?.toString() === formData.mainCategory
  );

  // Fonctions pour obtenir les labels
  const getTypeLabel = () => {
    const type = listCategoryTypes.find(
      (t) => t.id.toString() === formData.type
    );
    return type?.name || 'Choisir le type';
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

  const getThirdPartyPlaceholder = () => {
    if (formData.type === '1')
      return 'Sélectionnez un fournisseur ou prêteur...';
    if (formData.type === '2') return 'Sélectionnez un client ou emprunteur...';
    return 'Sélectionnez un tiers...';
  };

  // Gestion du changement de fréquence
  const handleFrequencyChange = (frequencyValue) => {
    onFormChange('frequency', frequencyValue);

    // Réinitialiser la durée indéterminée pour les fréquences qui ne la supportent pas
    if (['1', '9'].includes(frequencyValue) && formData.isIndefinite) {
      onFormChange('isIndefinite', false);
    }

    // Pour les fréquences avec calcul automatique, recalculer la date de fin
    if (
      frequencyValue !== '9' &&
      formData.startDate &&
      !formData.isIndefinite
    ) {
      const calculatedEndDate = calculateEndDate(
        formData.startDate,
        frequencyValue
      );
      onFormChange('endDate', calculatedEndDate);
    }

    // Pour la fréquence irrégulière, vider la date de fin
    if (frequencyValue === '9') {
      onFormChange('endDate', '');
    }
  };

  // Gestion du changement de date de début
  const handleStartDateChange = (date) => {
    onFormChange('startDate', date);

    // Recalculer la date de fin si une fréquence avec calcul auto est sélectionnée
    if (date && shouldAutoCalculate && !formData.isIndéfinite) {
      const calculatedEndDate = calculateEndDate(date, formData.frequency);
      onFormChange('endDate', calculatedEndDate);
    }
  };

  // Gestion du changement de durée indéterminée
  const handleIndefiniteChange = (checked) => {
    onFormChange('isIndefinite', checked);
    if (checked) {
      onFormChange('endDate', '');
    } else if (formData.startDate && shouldAutoCalculate) {
      // Si on décoche "indéterminé", recalculer la date de fin
      const calculatedEndDate = calculateEndDate(
        formData.startDate,
        formData.frequency
      );
      onFormChange('endDate', calculatedEndDate);
    }
  };

  // Obtenir la description de la période calculée
  const getPeriodDescription = () => {
    if (!formData.startDate || !formData.endDate || shouldHideEndDate)
      return null;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de début

    return `${diffDays} jour${diffDays > 1 ? 's' : ''} (du ${formatDate(
      formData.startDate
    )} au ${formatDate(formData.endDate)})`;
  };

  // Formater une date en français
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Obtenir le message d'information selon la fréquence
  const getFrequencyInfoMessage = () => {
    if (isPonctualFrequency) {
      return 'La date de fin est automatiquement définie sur la date de début.';
    }

    if (isIrregularFrequency) {
      return 'Pour une fréquence irrégulière, la date de fin doit être définie manuellement.';
    }

    if (shouldAutoCalculate && formData.startDate && !formData.isIndefinite) {
      const frequencyLabel = frequencies.find(
        (f) => f.value === formData.frequency
      )?.label;
      return `La date de fin est calculée automatiquement (${frequencyLabel.toLowerCase()}).`;
    }

    return null;
  };

  const frequencyInfoMessage = getFrequencyInfoMessage();
  const periodDescription = getPeriodDescription();

  // Styles pour le Select React
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
      '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#9ca3af' },
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
      '&:active': { backgroundColor: state.isSelected ? '#3b82f6' : '#e5e7eb' },
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
    input: (base) => ({ ...base, fontSize: '0.875rem' }),
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
      className={`flex items-center px-3 py-2 cursor-pointer text-sm ${
        isSelected ? 'bg-blue-500 text-white' : isFocused ? 'bg-gray-100' : ''
      }`}
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

  return (
    <div className="space-y-4">
      {/* Type (Revenu/Dépense) */}
      <CustomDropdown
        label="Type *"
        id="type-select"
        ref={typeRef}
        isOpen={typeOpen}
        onToggle={() => setTypeOpen(!typeOpen)}
        selectedLabel={getTypeLabel()}
      >
        <AnimatePresence>
          {typeOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
            >
              {listCategoryTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => {
                    onFormChange('type', type.id.toString());
                    setTypeOpen(false);
                  }}
                  className={`relative flex cursor-pointer items-center py-2 px-3 text-sm ${
                    formData.type === type.id.toString()
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="flex-1">{type.name}</span>
                  {formData.type === type.id.toString() && (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CustomDropdown>

      {/* Catégorie principale */}
      <CustomDropdown
        label="Catégorie principale*"
        id="category-select"
        ref={categoryRef}
        isOpen={categoryOpen}
        onToggle={() => setCategoryOpen(!categoryOpen)}
        selectedLabel={getCategoryLabel()}
      >
        <AnimatePresence>
          {categoryOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
            >
              {availableCategories.map((category) => {
                const colorClass = getColorClasses(getRandomColor());
                return (
                  <div
                    key={category.id}
                    onClick={() => {
                      onFormChange('mainCategory', category.id.toString());
                      setCategoryOpen(false);
                    }}
                    className={`relative flex cursor-pointer items-center py-2 px-3 text-sm ${
                      formData.mainCategory === category.id.toString()
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Tag className={`w-4 h-4 mr-2 ${colorClass.text}`} />
                    <span className="flex-1">{category.name}</span>
                    {formData.mainCategory === category.id.toString() && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </CustomDropdown>

      {/* Sous-catégorie */}
      <CustomDropdown
        label="Sous-catégorie *"
        id="subcategory-select"
        ref={subcategoryRef}
        isOpen={subcategoryOpen}
        onToggle={() => {
          if (formData.mainCategory && availableSubcategories.length > 0) {
            setSubcategoryOpen(!subcategoryOpen);
          }
        }}
        selectedLabel={getSubcategoryLabel()}
        disabled={!formData.mainCategory || availableSubcategories.length === 0}
      >
        <AnimatePresence>
          {subcategoryOpen && availableSubcategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
            >
              {availableSubcategories.map((subcategory) => (
                <div
                  key={subcategory.id}
                  onClick={() => {
                    onFormChange('subcategory', subcategory.id.toString());
                    setSubcategoryOpen(false);
                  }}
                  className={`relative flex cursor-pointer items-center py-2 px-3 text-sm ${
                    formData.subcategory === subcategory.id.toString()
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="flex-1">{subcategory.name}</span>
                  {formData.subcategory === subcategory.id.toString() && (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CustomDropdown>

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
            onChange={(e) => onFormChange('amount', e.target.value)}
            placeholder="0.00"
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency-select">Devise *</Label>
          <CustomDropdown
            id="currency-select"
            ref={currencyRef}
            isOpen={currencyOpen}
            onToggle={() => setCurrencyOpen(!currencyOpen)}
            selectedLabel={getCurrencyLabel()}
          >
            <AnimatePresence>
              {currencyOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
                >
                  {currencies.map((currency) => (
                    <div
                      key={currency.value}
                      onClick={() => {
                        onFormChange('currency', currency.value);
                        setCurrencyOpen(false);
                      }}
                      className={`relative flex cursor-pointer items-center py-2 px-3 text-sm ${
                        formData.currency === currency.value
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex-1">{currency.label}</span>
                      {formData.currency === currency.value && (
                        <Check className="h-4 w-4 ml-2" />
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CustomDropdown>
        </div>
      </div>

      {/* Fréquence */}
      <div className="space-y-2">
        <Label htmlFor="frequency-select">Fréquence *</Label>
        <CustomDropdown
          id="frequency-select"
          ref={frequencyRef}
          isOpen={frequencyOpen}
          onToggle={() => setFrequencyOpen(!frequencyOpen)}
          selectedLabel={getFrequencyLabel()}
        >
          <AnimatePresence>
            {frequencyOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
              >
                {frequencies.map((frequency) => (
                  <div
                    key={frequency.value}
                    onClick={() => {
                      handleFrequencyChange(frequency.value);
                      setFrequencyOpen(false);
                    }}
                    className={`relative flex cursor-pointer items-center py-2 px-3 text-sm ${
                      formData.frequency === frequency.value
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex-1">{frequency.label}</span>
                    {formData.frequency === frequency.value && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CustomDropdown>
      </div>

      {/* Tiers */}
      <div className="space-y-2">
        <Label htmlFor="thirdparty-select">Tiers *</Label>
        <Select
          id="thirdparty-select"
          value={formData.thirdParty}
          onChange={(selectedOption) =>
            onFormChange('thirdParty', selectedOption)
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
      <div
        className={`grid gap-4 ${
          shouldHideEndDate ? 'grid-cols-1' : 'grid-cols-2'
        }`}
      >
        <div className="space-y-2">
          <Label htmlFor="startDate">Date de début *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Afficher la date de fin seulement pour les fréquences qui le permettent */}
        {!shouldHideEndDate && (
          <div className="space-y-2">
            <Label htmlFor="endDate">
              Date de fin
              {periodDescription && (
                <span className="text-xs text-gray-500 ml-1 font-normal">
                  {/* {periodDescription} */}
                </span>
              )}
            </Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => onFormChange('endDate', e.target.value)}
              disabled={formData.isIndefinite || shouldAutoCalculate}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Indéterminé - Masquer pour les fréquences ponctuelles et irrégulières */}
      {!shouldHideEndDate && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isIndefinite"
            checked={formData.isIndefinite}
            onCheckedChange={handleIndefiniteChange}
            disabled={shouldAutoCalculate}
          />
          <Label
            htmlFor="isIndefinite"
            className={`cursor-pointer ${
              shouldAutoCalculate ? 'text-gray-400' : ''
            }`}
          >
            Durée indéterminée
            {shouldAutoCalculate && (
              <span className="text-xs text-gray-500 ml-1">
                (non disponible pour cette fréquence)
              </span>
            )}
          </Label>
        </div>
      )}

      {/* Message d'information selon la fréquence */}
      {/* {frequencyInfoMessage && (
        <div
          className={`p-3 rounded-md ${
            isIrregularFrequency
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <p
            className={`text-sm ${
              isIrregularFrequency ? 'text-yellow-700' : 'text-blue-700'
            }`}
          >
            <strong>
              {isPonctualFrequency
                ? 'Ponctuelle'
                : isIrregularFrequency
                ? 'Irregulière'
                : 'Calcul automatique'}{' '}
              :
            </strong>{' '}
            {frequencyInfoMessage}
          </p>
        </div>
      )} */}
    </div>
  );
};

export default BasicInfoSection;
