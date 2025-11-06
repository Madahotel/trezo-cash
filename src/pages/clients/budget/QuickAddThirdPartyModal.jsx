import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, User, Building, Mail, Phone, CreditCard, HandCoins } from 'lucide-react';
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
    handleAddNewThirdParty
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
                user_type_id: ''
            });
            setSelectedThirdPartyType('');
        }
    };

    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    const handleInputChange = (field, value) => {
        setNewThirdPartyData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleThirdPartyTypeSelect = (type) => {
        setSelectedThirdPartyType(type);
        // NOUVELLE LOGIQUE : Fournisseur + Emprunteur ensemble, Client + Prêteur ensemble
        let userTypeId = '';
        if (formData.type === '1') { // Dépense
            userTypeId = type === 'supplier' ? '6' : '5'; // Fournisseur (6) ou Emprunteur (5)
        } else { // Revenu
            userTypeId = type === 'client' ? '4' : '7'; // Client (4) ou Prêteur (7)
        }

        setNewThirdPartyData(prev => ({
            ...prev,
            user_type_id: userTypeId
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

    // NOUVELLE LOGIQUE : Déterminer les types disponibles selon le contexte
    const isExpense = formData.type === '1'; // 1 = Dépense, 2 = Revenu
    
    // Dépense : Fournisseur ou Emprunteur
    // Revenu : Client ou Prêteur
    const availableTypes = isExpense
        ? [
            { 
                id: 'supplier', 
                label: 'Fournisseur', 
                description: 'Personne ou entreprise qui vous fournit des biens ou services', 
                icon: Building 
            },
            { 
                id: 'borrower', 
                label: 'Emprunteur', 
                description: 'Personne ou entreprise à qui vous prêtez de l\'argent', 
                icon: CreditCard 
            }
        ]
        : [
            { 
                id: 'client', 
                label: 'Client', 
                description: 'Personne ou entreprise qui achète vos produits/services', 
                icon: User 
            },
            { 
                id: 'lender', 
                label: 'Prêteur', 
                description: 'Personne ou institution qui vous prête de l\'argent', 
                icon: HandCoins 
            }
        ];

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
                                {isExpense ? 'Ajouter un fournisseur ou un emprunteur' : 'Ajouter un client ou un prêteur'}
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
                            <div className="grid grid-cols-1 gap-3">
                                {availableTypes.map((type) => {
                                    const IconComponent = type.icon;
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => handleThirdPartyTypeSelect(type.id)}
                                            className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                                        >
                                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                                <IconComponent className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{type.label}</h4>
                                                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                                            </div>
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
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="p-1 bg-blue-100 rounded">
                                            {(() => {
                                                const type = availableTypes.find(t => t.id === selectedThirdPartyType);
                                                const IconComponent = type?.icon || Building;
                                                return <IconComponent className="h-3 w-3 text-blue-600" />;
                                            })()}
                                        </div>
                                        <span className="text-sm font-medium text-blue-900">
                                            {availableTypes.find(t => t.id === selectedThirdPartyType)?.label}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedThirdPartyType('')}
                                        className="h-6 text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        Changer
                                    </Button>
                                </div>
                            </div>

                            {/* Nom de l'entreprise */}
                            <div className="space-y-2">
                                <Label htmlFor="thirdparty-company-name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Building className="h-4 w-4 text-gray-500" />
                                    Nom {selectedThirdPartyType === 'client' || selectedThirdPartyType === 'borrower' ? 'du client' : 'de l\'entreprise'} *
                                </Label>
                                <Input
                                    ref={nameInputRef}
                                    id="thirdparty-company-name"
                                    name="thirdparty-company-name"
                                    type="text"
                                    value={newThirdPartyData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder={
                                        selectedThirdPartyType === 'client' ? 'Nom du client' :
                                        selectedThirdPartyType === 'borrower' ? 'Nom de l\'emprunteur' :
                                        selectedThirdPartyType === 'supplier' ? 'Nom du fournisseur' :
                                        'Nom du prêteur'
                                    }
                                    disabled={isCreatingThirdParty}
                                    className="w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            firstnameInputRef.current?.focus();
                                        }
                                    }}
                                />
                                <p className="text-xs text-gray-500">
                                    Le nom est obligatoire
                                </p>
                            </div>

                            {/* Prénom du contact */}
                            <div className="space-y-2">
                                <Label htmlFor="thirdparty-contact-firstname" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    Prénom du contact
                                </Label>
                                <Input
                                    ref={firstnameInputRef}
                                    id="thirdparty-contact-firstname"
                                    name="thirdparty-contact-firstname"
                                    type="text"
                                    value={newThirdPartyData.firstname}
                                    onChange={(e) => handleInputChange('firstname', e.target.value)}
                                    placeholder="Prénom du contact principal"
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
                                <Label htmlFor="thirdparty-contact-email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
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
                                    placeholder="email@entreprise.com"
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
                                <Label htmlFor="thirdparty-contact-phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    Téléphone
                                </Label>
                                <Input
                                    ref={phoneInputRef}
                                    id="thirdparty-contact-phone"
                                    name="thirdparty-contact-phone"
                                    type="tel"
                                    value={newThirdPartyData.phone_number}
                                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
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
                        disabled={isCreatingThirdParty || !newThirdPartyData.name.trim() || !selectedThirdPartyType}
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