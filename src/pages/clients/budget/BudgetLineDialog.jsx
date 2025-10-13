import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Tag } from 'lucide-react';

// Données de test pour remplacer les services
const testCategories = {
  expense: [
    {
      id: '1',
      name: 'Fournitures Bureau',
      color: 'blue',
      icon: Tag,
      isBase: true,
      subcategories: [
        { id: '1-1', name: 'Papeterie' },
        { id: '1-2', name: 'Équipement IT' },
        { id: '1-3', name: 'Mobilier' },
      ],
    },
    {
      id: '2',
      name: 'Services Externes',
      color: 'purple',
      icon: Tag,
      isBase: false,
      subcategories: [
        { id: '2-1', name: 'Consulting' },
        { id: '2-2', name: 'Maintenance' },
        { id: '2-3', name: 'Formation' },
      ],
    },
    {
      id: '3',
      name: 'Rémunération du personnel',
      color: 'indigo',
      icon: Tag,
      isBase: true,
      subcategories: [
        { id: '3-1', name: 'Salaires' },
        { id: '3-2', name: 'Formation' },
        { id: '3-3', name: 'Avantages' },
      ],
    },
  ],
  income: [
    {
      id: '4',
      name: 'Ventes Produits',
      color: 'green',
      icon: Tag,
      isBase: true,
      subcategories: [
        { id: '4-1', name: 'Logiciels' },
        { id: '4-2', name: 'Hardware' },
      ],
    },
    {
      id: '5',
      name: 'Services',
      color: 'emerald',
      icon: Tag,
      isBase: false,
      subcategories: [
        { id: '5-1', name: 'Développement' },
        { id: '5-2', name: 'Support' },
      ],
    },
  ],
};

// Service de catégories simulé
const categoryService = {
  getAllCategories: (type) => testCategories[type] || [],
  getCategoryById: (id, type) => {
    const categories = testCategories[type] || [];
    return categories.find((cat) => cat.id === id);
  },
};

// Devises disponibles
const currencies = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dollar US' },
  { code: 'CAD', symbol: '$', name: 'Dollar Canadien' },
  { code: 'GBP', symbol: '£', name: 'Livre Sterling' },
  { code: 'CHF', symbol: 'CHF', name: 'Franc Suisse' },
];

const BudgetLineDialog = ({ open, onOpenChange, onSave, editLine = null }) => {
  const currency = 'EUR'; // Devise par défaut

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
    type: 'Depense',
    mainCategory: '',
    subcategory: '',
    amount: '',
    currency: currency,
    frequency: 'monthly',
    startDate: '',
    endDate: '',
    isIndefinite: false,
    description: '',
  });

  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

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

  // Reset form when dialog opens/closes or when editing
  useEffect(() => {
    if (open) {
      if (editLine) {
        setFormData({
          type: editLine.type,
          mainCategory: editLine.mainCategory || '',
          subcategory: editLine.subcategory || '',
          amount: editLine.amount || '',
          currency: editLine.currency || currency,
          frequency: editLine.frequency || 'monthly',
          startDate: editLine.startDate || '',
          endDate: editLine.endDate || '',
          isIndefinite: editLine.isIndefinite || false,
          description: editLine.description || '',
        });
      } else {
        setFormData({
          type: 'Depense',
          mainCategory: '',
          subcategory: '',
          amount: '',
          currency: currency,
          frequency: 'monthly',
          startDate: '',
          endDate: '',
          isIndefinite: false,
          description: '',
        });
      }
    }
  }, [open, editLine, currency]);

  // Load categories when dialog opens or type changes
  useEffect(() => {
    if (open) {
      const categoryType = formData.type === 'Revenue' ? 'income' : 'expense';
      const categories = categoryService.getAllCategories(categoryType);
      setAvailableCategories(categories || []);
      if (!editLine) {
        setAvailableSubcategories([]);
      }
    }
  }, [open, formData.type, editLine]);

  // Load subcategories when main category changes
  useEffect(() => {
    if (formData.mainCategory) {
      const categoryType = formData.type === 'Revenue' ? 'income' : 'expense';
      const category = categoryService.getCategoryById(
        formData.mainCategory,
        categoryType
      );
      if (category && category.subcategories) {
        setAvailableSubcategories(category.subcategories);
        if (!editLine) {
          setFormData((prev) => ({ ...prev, subcategory: '' }));
        }
      } else {
        setAvailableSubcategories([]);
      }
    } else {
      setAvailableSubcategories([]);
      if (!editLine) {
        setFormData((prev) => ({ ...prev, subcategory: '' }));
      }
    }
  }, [formData.mainCategory, formData.type, editLine]);

  const frequencies = [
    { value: 'one_time', label: 'Une fois' },
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'biweekly', label: 'Bimensuel' },
    { value: 'monthly', label: 'Mensuel' },
    { value: 'bimonthly', label: 'Bimestriel' },
    { value: 'quarterly', label: 'Trimestriel' },
    { value: 'semiannual', label: 'Semestriel' },
    { value: 'annual', label: 'Annuel' },
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Submitting form:', formData);

    if (!formData.mainCategory || !formData.subcategory || !formData.amount) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const categoryType = formData.type === 'Revenue' ? 'income' : 'expense';
    const category = categoryService.getCategoryById(
      formData.mainCategory,
      categoryType
    );

    let subcategoryName = '';
    if (category && category.subcategories) {
      const subcategoryObj = category.subcategories.find(
        (sub) => sub.id === formData.subcategory
      );
      subcategoryName = subcategoryObj?.name || '';
    }

    const budgetLineData = {
      ...formData,
      categoryName: category?.name || '',
      subcategoryName: subcategoryName,
      categoryIcon: category?.icon,
      categoryColor: category?.color || 'gray',
    };

    console.log('Saving data:', budgetLineData);
    onSave(budgetLineData);
    onOpenChange(false);
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

  // Get current category for display
  const getCurrentCategory = () => {
    if (!formData.mainCategory) return null;
    const categoryType = formData.type === 'Revenue' ? 'income' : 'expense';
    return categoryService.getCategoryById(formData.mainCategory, categoryType);
  };

  const currentCategory = getCurrentCategory();
  const currentSubcategory = availableSubcategories.find(
    (sub) => sub.id === formData.subcategory
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-10 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
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
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Depense">Dépense</SelectItem>
                  <SelectItem value="Revenue">Revenu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Catégorie principale */}
            <div className="space-y-2">
              <Label>Catégorie principale *</Label>
              <Select
                value={formData.mainCategory}
                onValueChange={(value) => handleChange('mainCategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => {
                    const colorClass = getColorClasses(category.color);
                    const IconComponent = category.icon || Tag;

                    return (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          <IconComponent
                            className={`w-4 h-4 ${colorClass.text}`}
                          />
                          <span>{category.name}</span>
                          {category.isBase && (
                            <Badge variant="secondary" className="text-xs ml-2">
                              Base
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Sous-catégorie */}
            <div className="space-y-2">
              <Label>Sous-catégorie *</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) => handleChange('subcategory', value)}
                disabled={
                  !formData.mainCategory || availableSubcategories.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !formData.mainCategory
                        ? "Sélectionnez d'abord une catégorie principale..."
                        : availableSubcategories.length === 0
                        ? 'Aucune sous-catégorie disponible'
                        : 'Choisir une sous-catégorie...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Montant et Devise */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="5000.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Devise</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.code} - {curr.symbol} {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fréquence */}
            <div className="space-y-2">
              <Label>Fréquence</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => handleChange('frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une fréquence" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
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
