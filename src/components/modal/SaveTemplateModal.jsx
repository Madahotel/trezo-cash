import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, LayoutTemplate, Eye, EyeOff } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import IconPicker from '../IconPicker/IconPicker';
import { saveTemplate } from '../../services/saveTemplate';
// IMPORT DU COMPOSANT PARTAGÉ

// Hook personnalisé pour la gestion du formulaire
const useTemplateForm = (editingTemplate, isOpen) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    icon: { icon: 'Briefcase', color: 'blue' },
    purpose: 'professional'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      if (editingTemplate) {
        setFormData({
          name: editingTemplate.name || '',
          description: editingTemplate.description || '',
          isPublic: editingTemplate.is_public || false,
          icon: { 
            icon: editingTemplate.icon || 'Briefcase', 
            color: editingTemplate.color || 'blue' 
          },
          purpose: editingTemplate.purpose || 'professional'
        });
      } else {
        setFormData({
          name: '',
          description: '',
          isPublic: false,
          icon: { icon: 'Briefcase', color: 'blue' },
          purpose: 'professional'
        });
      }
    }
  }, [isOpen, editingTemplate]);

  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    formData,
    setFormData: updateFormData,
    isSubmitting,
    setIsSubmitting,
  };
};

// Composant pour afficher l'icône dynamique
const DynamicIcon = ({ iconName, color, size = 16 }) => {
  const [IconComponent, setIconComponent] = useState(() => LayoutTemplate);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        // Import dynamique des icônes Lucide
        const lucideIcons = await import('lucide-react');
        const Icon = lucideIcons[iconName] || LayoutTemplate;
        setIconComponent(() => Icon);
      } catch (error) {
        console.warn(`Icône ${iconName} non trouvée, utilisation de LayoutTemplate`);
        setIconComponent(() => LayoutTemplate);
      }
    };

    loadIcon();
  }, [iconName]);

  return <IconComponent className={`w-${size} h-${size}`} style={{ color }} />;
};

const SaveTemplateModal = ({ isOpen, onClose, editingTemplate }) => {
  const { dataState, dataDispatch } = useData();
  const { uiState, uiDispatch } = useUI();
  const { session, categories, allCashAccounts, tiers, allEntries, allActuals } = dataState;
  const { activeProjectId } = uiState;
  
  const { 
    formData, 
    setFormData, 
    isSubmitting, 
    setIsSubmitting 
  } = useTemplateForm(editingTemplate, isOpen);

  // Gestionnaires d'événements
  const handleInputChange = useCallback((field, value) => {
    setFormData({ [field]: value });
  }, [setFormData]);

  const handleIconChange = useCallback((iconConfig) => {
    setFormData({ icon: iconConfig });
  }, [setFormData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      uiDispatch({ 
        type: 'ADD_TOAST', 
        payload: { 
          message: "Le nom du modèle est obligatoire.", 
          type: 'error' 
        } 
      });
      return;
    }

    if (formData.name.length < 2 || formData.name.length > 150) {
      uiDispatch({ 
        type: 'ADD_TOAST', 
        payload: { 
          message: "Le nom doit contenir entre 2 et 150 caractères.", 
          type: 'error' 
        } 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Préparation des données de structure
      const projectTiers = (tiers || []).filter(t => {
        const entries = allEntries[activeProjectId] || [];
        const actuals = allActuals[activeProjectId] || [];
        return entries.some(e => e.supplier === t.name) || actuals.some(a => a.thirdParty === t.name);
      }).map(({ name, type }) => ({ name, type }));

      const projectStructure = {
        categories: categories || [],
        cashAccounts: (allCashAccounts[activeProjectId] || []).map(({ name, mainCategoryId }) => ({ 
          name, 
          mainCategoryId, 
          initialBalance: 0 
        })),
        tiers: projectTiers,
      };
      
      const templateData = { 
        name: formData.name.trim(), 
        description: formData.description.trim(), 
        is_public: formData.isPublic, 
        icon: formData.icon.icon, 
        color: formData.icon.color, 
        purpose: formData.purpose 
      };

      // Appel de saveTemplate avec apiService
      const result = await saveTemplate(
        { dataDispatch, uiDispatch }, 
        { 
          templateData, 
          editingTemplate, 
          projectStructure, 
          user: session.user 
        }
      );

      if (result.success) {
        console.log('✅ Template sauvegardé, fermeture du modal');
        onClose();
      } else {
        console.error('❌ Échec sauvegarde template:', result.error);
      }
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Fermeture avec ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isSubmitting, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* En-tête compact - ICÔNE DYNAMIQUE */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ 
                backgroundColor: `${formData.icon.color}15`,
                border: `1.5px solid ${formData.icon.color}30`
              }}
            >
              {/* Utilisation de l'icône sélectionnée dynamiquement */}
              <DynamicIcon 
                iconName={formData.icon.icon} 
                color={formData.icon.color}
                size={16}
              />
            </div>
            <span className="text-sm">
              {editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}
            </span>
          </h2>
          <button 
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire compact */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Nom */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nom du modèle *
              <span className="text-xs text-gray-500 ml-1">
                ({formData.name.length}/150)
              </span>
            </label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Ex: Business Plan, Budget Familial..."
              required 
              minLength={2}
              maxLength={150}
              autoFocus 
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Description optionnelle..."
              rows="2"
              disabled={isSubmitting}
            />
          </div>

          {/* IconPicker compact */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-700">
              Icône & Couleur
            </label>
            <IconPicker 
              value={formData.icon} 
              onChange={handleIconChange} 
              disabled={isSubmitting}
            />
          </div>

          {/* Objectif compact */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Objectif
            </label>
            <div className="flex gap-2">
              {[
                { value: 'personal', label: '👤 Perso', description: 'Usage privé' },
                { value: 'professional', label: '💼 Pro', description: 'Usage business' }
              ].map((option) => (
                <label 
                  key={option.value}
                  className={`
                    relative flex-1 cursor-pointer rounded-lg border p-3 focus:outline-none transition-all
                    ${formData.purpose === option.value
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                    }
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="radio"
                    name="purpose"
                    value={option.value}
                    checked={formData.purpose === option.value}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-900 mb-1">
                      {option.label}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Visibilité compacte */}
          <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
            <input 
              type="checkbox" 
              id="isPublic" 
              checked={formData.isPublic} 
              onChange={(e) => handleInputChange('isPublic', e.target.checked)} 
              className="h-3 w-3 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
              disabled={isSubmitting}
            />
            <div className="flex-1">
              <label htmlFor="isPublic" className="block text-xs font-medium text-gray-900">
                <div className="flex items-center gap-1">
                  {formData.isPublic ? <Eye className="w-3 h-3 text-green-600" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
                  Rendre public
                </div>
              </label>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                Partagez avec la communauté
              </p>
            </div>
          </div>

          {/* Actions compactes */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
            >
              <Save className="w-3 h-3" /> 
              {isSubmitting 
                ? 'Enregistrement...' 
                : (editingTemplate ? 'Modifier' : 'Créer')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveTemplateModal;