import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Plus,
  User,
  Building,
  Mail,
  Phone,
  CreditCard,
  HandCoins,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const QuickAddThirdPartyModal = ({
  showThirdPartyModal,
  setShowThirdPartyModal,
  isCreatingThirdParty,
  newThirdPartyData,
  setNewThirdPartyData,
  formData,
  handleAddNewThirdParty,
}) => {
  const [selectedThirdPartyType, setSelectedThirdPartyType] = useState('');

  const handleModalClose = () => {
    if (!isCreatingThirdParty) {
      setShowThirdPartyModal(false);
      setNewThirdPartyData({
        name: '',
        firstname: '',
        email: '',
        phone_number: '',
        user_type_id: '',
      });
      setSelectedThirdPartyType('');
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleInputChange = (field, value) => {
    setNewThirdPartyData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleThirdPartyTypeSelect = (type) => {
    setSelectedThirdPartyType(type);

    // Mapping des 4 types vers les IDs
    const typeToIdMap = {
      supplier: '6', // Fournisseur
      client: '4', // Client
      borrower: '5', // Emprunteur
      lender: '7', // Prêteur
    };

    setNewThirdPartyData((prev) => ({
      ...prev,
      user_type_id: typeToIdMap[type],
    }));
  };

  // Références pour chaque champ
  const nameInputRef = useRef(null);
  const firstnameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const hasFocused = useRef(false);

  // Focus seulement sur le premier champ quand le modal s'ouvre
  useEffect(() => {
    if (showThirdPartyModal && !hasFocused.current && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current.focus();
        hasFocused.current = true;
      }, 100);
    }

    if (!showThirdPartyModal) {
      hasFocused.current = false;
      setSelectedThirdPartyType('');
    }
  }, [showThirdPartyModal]);

  if (!showThirdPartyModal) return null;

  // Les 4 types de tiers disponibles
  const thirdPartyTypes = [
    {
      id: 'supplier',
      label: 'Fournisseur',
      description:
        'Personne ou entreprise qui vous fournit des biens ou services',
      icon: Building,
      color: 'blue',
    },
    {
      id: 'client',
      label: 'Client',
      description: 'Personne ou entreprise qui achète vos produits/services',
      icon: User,
      color: 'green',
    },
    {
      id: 'borrower',
      label: 'Emprunteur',
      description: "Personne ou entreprise à qui vous prêtez de l'argent",
      icon: CreditCard,
      color: 'purple',
    },
    {
      id: 'lender',
      label: 'Prêteur',
      description: "Personne ou institution qui vous prête de l'argent",
      icon: HandCoins,
      color: 'amber',
    },
  ];

  // Obtenir la couleur pour un type
  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-200',
        hover: 'hover:border-blue-500 hover:bg-blue-50',
        darkText: 'text-blue-900',
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-200',
        hover: 'hover:border-green-500 hover:bg-green-50',
        darkText: 'text-green-900',
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        border: 'border-purple-200',
        hover: 'hover:border-purple-500 hover:bg-purple-50',
        darkText: 'text-purple-900',
      },
      amber: {
        bg: 'bg-amber-100',
        text: 'text-amber-600',
        border: 'border-amber-200',
        hover: 'hover:border-amber-500 hover:bg-amber-50',
        darkText: 'text-amber-900',
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  // Obtenir le type sélectionné
  const selectedType = thirdPartyTypes.find(
    (t) => t.id === selectedThirdPartyType
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden border border-gray-200"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Nouveau tiers
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Ajouter un nouveau tiers à votre liste
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleModalClose}
            disabled={isCreatingThirdParty}
            className="h-8 w-8 p-0 hover:bg-white/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Sélection du type de tiers */}
          {!selectedThirdPartyType && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Type de tiers *
              </Label>
              <p className="text-sm text-gray-600 mb-3">
                Sélectionnez le type de tiers que vous souhaitez créer
              </p>
              <div className="grid grid-cols-2 gap-3">
                {thirdPartyTypes.map((type) => {
                  const IconComponent = type.icon;
                  const colors = getColorClasses(type.color);
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleThirdPartyTypeSelect(type.id)}
                      className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors text-left ${colors.border} ${colors.hover}`}
                    >
                      <div className={`p-3 rounded-full mb-2 ${colors.bg}`}>
                        <IconComponent className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <h4 className="font-medium text-gray-900 text-center">
                        {type.label}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 text-center">
                        {type.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formulaire de création */}
          {selectedThirdPartyType && (
            <>
              {/* Type sélectionné */}
              <div
                className={`rounded-lg p-3 ${
                  getColorClasses(selectedType?.color).bg
                } ${getColorClasses(selectedType?.color).border} border`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-white rounded">
                      {selectedType && (
                        <selectedType.icon
                          className={`h-3 w-3 ${
                            getColorClasses(selectedType.color).text
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        getColorClasses(selectedType?.color).darkText
                      }`}
                    >
                      {selectedType?.label}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedThirdPartyType('')}
                    className={`h-6 text-xs ${
                      getColorClasses(selectedType?.color).text
                    } hover:${getColorClasses(selectedType?.color).darkText}`}
                  >
                    Changer
                  </Button>
                </div>
              </div>

              {/* Nom */}
              <div className="space-y-2">
                <Label
                  htmlFor="thirdparty-name"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Building className="h-4 w-4 text-gray-500" />
                  Nom *
                </Label>
                <Input
                  ref={nameInputRef}
                  id="thirdparty-name"
                  name="thirdparty-name"
                  type="text"
                  value={newThirdPartyData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={
                    selectedThirdPartyType === 'client'
                      ? 'Nom du client'
                      : selectedThirdPartyType === 'borrower'
                      ? "Nom de l'emprunteur"
                      : selectedThirdPartyType === 'supplier'
                      ? 'Nom du fournisseur'
                      : 'Nom du prêteur'
                  }
                  disabled={isCreatingThirdParty}
                  className="w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      firstnameInputRef.current?.focus();
                    }
                  }}
                />
                <p className="text-xs text-gray-500">Le nom est obligatoire</p>
              </div>

              {/* Prénom */}
              <div className="space-y-2">
                <Label
                  htmlFor="thirdparty-contact-firstname"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-gray-500" />
                  Prénom
                </Label>
                <Input
                  ref={firstnameInputRef}
                  id="thirdparty-contact-firstname"
                  name="thirdparty-contact-firstname"
                  type="text"
                  value={newThirdPartyData.firstname}
                  onChange={(e) =>
                    handleInputChange('firstname', e.target.value)
                  }
                  placeholder="Prénom (optionnel)"
                  disabled={isCreatingThirdParty}
                  className="w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      emailInputRef.current?.focus();
                    }
                  }}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="thirdparty-contact-email"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Mail className="h-4 w-4 text-gray-500" />
                  Email
                </Label>
                <Input
                  ref={emailInputRef}
                  id="thirdparty-contact-email"
                  name="thirdparty-contact-email"
                  type="email"
                  value={newThirdPartyData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@exemple.com"
                  disabled={isCreatingThirdParty}
                  className="w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      phoneInputRef.current?.focus();
                    }
                  }}
                />
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label
                  htmlFor="thirdparty-contact-phone"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Phone className="h-4 w-4 text-gray-500" />
                  Téléphone
                </Label>
                <Input
                  ref={phoneInputRef}
                  id="thirdparty-contact-phone"
                  name="thirdparty-contact-phone"
                  type="tel"
                  value={newThirdPartyData.phone_number}
                  onChange={(e) =>
                    handleInputChange('phone_number', e.target.value)
                  }
                  placeholder="+33 1 23 45 67 89"
                  disabled={isCreatingThirdParty}
                  className="w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNewThirdParty();
                    }
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleModalClose}
            disabled={isCreatingThirdParty}
            className="min-w-[80px]"
          >
            Annuler
          </Button>
          <Button
            onClick={handleAddNewThirdParty}
            disabled={
              isCreatingThirdParty ||
              !newThirdPartyData.name.trim() ||
              !selectedThirdPartyType
            }
            className="min-w-[100px] bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingThirdParty ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Créer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddThirdPartyModal;
