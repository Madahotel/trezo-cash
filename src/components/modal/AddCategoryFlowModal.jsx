import React, { useState, useMemo } from 'react';
import { X, Save, FolderPlus, Plus, Search, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { saveMainCategory } from '../context/actions';

const AddCategoryFlowModal = ({ isOpen, onClose, type, onCategorySelected }) => {
    const { dataState, dataDispatch } = useData();
    const { uiState } = useUI();
    const { categories, allEntries, session } = dataState;
    const { activeProjectId } = uiState;

    const [newMainCategoryName, setNewMainCategoryName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    const unusedMainCategories = useMemo(() => {
        if (!type) return [];
        const projectEntries = allEntries[activeProjectId] || [];
        const usedSubCategoryNames = new Set(projectEntries.map(e => e.category));
        
        const filteredCategories = categories[type === 'revenu' ? 'revenue' : 'expense'].filter(mainCat => 
            !mainCat.subCategories.some(subCat => usedSubCategoryNames.has(subCat.name))
        );

        // Filtrer par recherche
        if (searchTerm.trim()) {
            return filteredCategories.filter(cat => 
                cat.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        return filteredCategories;
    }, [type, categories, allEntries, activeProjectId, searchTerm]);

    const handleCreateAndSelect = async (e) => {
        e.preventDefault();
        if (!newMainCategoryName.trim()) return;
        const newCategory = await saveMainCategory({dataDispatch, uiDispatch}, { 
            type: type === 'revenu' ? 'revenue' : 'expense', 
            name: newMainCategoryName.trim(), 
            user: session.user 
        });
        if (newCategory) {
            onCategorySelected(newCategory.id);
            handleClose();
        }
    };

    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
        onCategorySelected(categoryId);
        handleClose();
    };

    const handleClose = () => {
        setNewMainCategoryName('');
        setSearchTerm('');
        setSelectedCategory(null);
        onClose();
    };

    if (!isOpen) return null;

    const isRevenue = type === 'revenu';
    const accentColor = isRevenue ? 'green' : 'blue';
    const colorClasses = {
        green: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-700',
            icon: 'text-green-600',
            button: 'bg-green-600 hover:bg-green-700',
            hover: 'hover:bg-green-50 hover:border-green-300'
        },
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-700',
            icon: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700',
            hover: 'hover:bg-blue-50 hover:border-blue-300'
        }
    };

    const colors = colorClasses[accentColor];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all duration-300 scale-100">
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${colors.border} rounded-t-2xl`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                            {isRevenue ? (
                                <TrendingUp className={`w-6 h-6 ${colors.icon}`} />
                            ) : (
                                <TrendingDown className={`w-6 h-6 ${colors.icon}`} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Ajouter une catégorie {isRevenue ? 'de revenu' : 'de dépense'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Choisissez une catégorie existante ou créez-en une nouvelle
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
                    {/* Section 1: Recherche et catégories existantes */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Catégories disponibles
                            </h3>
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {unusedMainCategories.length} disponible{unusedMainCategories.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Barre de recherche */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher une catégorie..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>

                        {/* Liste des catégories */}
                        {unusedMainCategories.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {unusedMainCategories.map(cat => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => handleCategorySelect(cat.id)}
                                        className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                                            selectedCategory === cat.id 
                                                ? `${colors.border} ${colors.bg} border-2 shadow-sm`
                                                : `border-gray-200 hover:shadow-md ${colors.hover}`
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900">{cat.name}</span>
                                            {selectedCategory === cat.id && (
                                                <Check className={`w-5 h-5 ${colors.icon}`} />
                                            )}
                                        </div>
                                        {cat.subCategories && cat.subCategories.length > 0 && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                {cat.subCategories.length} sous-catégorie{cat.subCategories.length !== 1 ? 's' : ''} disponible{cat.subCategories.length !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FolderPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">
                                    {searchTerm ? 'Aucune catégorie trouvée' : 'Toutes vos catégories sont déjà utilisées'}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {searchTerm ? 'Essayez avec d\'autres termes' : 'Créez une nouvelle catégorie pour continuer'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Séparateur */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-4 text-sm font-medium text-gray-500">OU</span>
                        </div>
                    </div>

                    {/* Section 2: Création de nouvelle catégorie */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Créer une nouvelle catégorie
                        </h3>
                        
                        <form onSubmit={handleCreateAndSelect} className="space-y-3">
                            <div>
                                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom de la catégorie principale
                                </label>
                                <input
                                    id="categoryName"
                                    type="text"
                                    value={newMainCategoryName}
                                    onChange={(e) => setNewMainCategoryName(e.target.value)}
                                    placeholder={`Ex: ${isRevenue ? 'Investissements' : 'Loisirs et Culture'}...`}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    required
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={!newMainCategoryName.trim()}
                                className={`w-full ${colors.button} text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-[1.02]`}
                            >
                                <Plus className="w-5 h-5" />
                                Créer et Sélectionner
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200 rounded-b-2xl bg-gray-50">
                    <button 
                        onClick={handleClose}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCategoryFlowModal;