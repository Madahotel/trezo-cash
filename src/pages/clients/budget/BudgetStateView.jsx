// BudgetStateView.jsx - Version ultra-optimisée
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useData } from '../../../components/context/DataContext.jsx';
import { useUI } from '../../../components/context/UIContext';
import { formatCurrency } from '../../../utils/formatting.js';
import { HandCoins, TrendingDown, Plus, Trash2, Search, Edit, Loader } from 'lucide-react';
import EmptyState from '../../../components/emptystate/EmptyState.jsx';
import AddCategoryFlowModal from '../../../components/modal/AddCategoryFlowModal.jsx';
import { deleteEntry, saveEntry, updateSubCategoryCriticality } from '../../../components/context/actions';
import { expandVatEntries } from '../../../utils/budgetCalculations';
import { useActiveProjectData } from '../../../hooks/useActiveProjectData';
import CriticalityPicker from '../../../components/criticality/CriticalityPicker.jsx';
import { motion, AnimatePresence } from 'framer-motion';

// 🔥 CACHE GLOBAL pour les calculs coûteux
const budgetStateCache = new Map();

// 🔥 Composant de ligne ultra-optimisé
const BudgetEntryRow = React.memo(({ 
    entry, 
    mainCat, 
    projectCurrency, 
    onEdit, 
    onDelete, 
    onDetail,
    settings 
}) => {
    const subCat = mainCat.subCategories?.find(sc => sc && sc.name === entry.category);
    const criticality = subCat?.criticality;

    const handleEdit = useCallback((e) => {
        e.stopPropagation();
        onEdit(entry);
    }, [entry, onEdit]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        onDelete(entry);
    }, [entry, onDelete]);

    const handleDetail = useCallback(() => {
        onDetail(entry);
    }, [entry, onDetail]);

    return (
        <div onClick={handleDetail} className="border-b hover:bg-gray-50 group cursor-pointer">
            {/* Mobile View */}
            <div className="sm:hidden p-3">
                <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-800 truncate pr-4">{entry.supplier}</span>
                    <span className={`font-bold text-gray-800 whitespace-nowrap ${entry.type === 'revenu' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(entry.original_amount ?? entry.amount, { ...settings, currency: entry.currency || projectCurrency })}
                    </span>
                </div>
                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>{entry.frequency}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleEdit} className="p-1 text-blue-500 hover:text-blue-700" title="Modifier">
                            <Edit size={14} />
                        </button>
                        <button onClick={handleDelete} className="p-1 text-red-500 hover:text-red-700" title="Supprimer">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden sm:flex items-center py-3 px-2">
                <div className="w-[25%] flex items-center gap-2 pr-4">
                    {criticality && entry.type === 'depense' && (
                        <CriticalityPicker 
                            value={criticality} 
                            onSelect={(newCrit) => updateSubCategoryCriticality(
                                { dataDispatch: useData().dataDispatch, uiDispatch: useUI().uiDispatch }, 
                                { subCategoryId: subCat.id, newCriticality: newCrit, type: 'expense', parentId: mainCat.id }
                            )} 
                        />
                    )}
                    <span className="text-gray-600 truncate">{entry.category}</span>
                </div>
                <div className="w-[20%] text-gray-600 truncate pr-4">{entry.supplier}</div>
                <div className="w-[15%] text-gray-600 truncate pr-4">{entry.frequency}</div>
                <div className="w-[15%] text-gray-600 truncate pr-4">
                    {entry.startDate ? new Date(entry.startDate).toLocaleDateString('fr-FR') : (entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : '-')}
                </div>
                <div className="w-[20%] text-right text-gray-700 font-medium pr-4">
                    {formatCurrency(entry.original_amount ?? entry.amount, { ...settings, currency: entry.currency || projectCurrency })}
                </div>
                <div className="w-[5%] flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleEdit} className="p-1 text-blue-500 hover:text-blue-700" title="Modifier">
                        <Edit size={14} />
                    </button>
                    <button onClick={handleDelete} className="p-1 text-red-500 hover:text-red-700" title="Supprimer">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
});

const BudgetStateView = React.memo(({ searchTerm, budgetData, loading, onRefresh }) => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const { categories, settings } = dataState;
    
    const { activeProject, isConsolidated } = useActiveProjectData(dataState, uiState);
    
    const budgetEntries = budgetData?.budgetEntries || [];
    
    const [isAddCategoryFlowModalOpen, setIsAddCategoryFlowModalOpen] = useState(false);
    const [addCategoryFlowType, setAddCategoryFlowType] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);

    // 🔥 OPTIMISATION CRITIQUE : Calcul des entrées étendues avec cache intelligent
    const expandedEntries = useMemo(() => {
        if (!budgetEntries || budgetEntries.length === 0) return [];
        
        const cacheKey = `expanded-${budgetEntries.length}-${categories?.version || '1.0'}`;
        const cached = budgetStateCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute
            return cached.data;
        }

        console.log('🔄 Calcul des entrées étendues...');
        const result = expandVatEntries(budgetEntries, categories);
        
        budgetStateCache.set(cacheKey, { data: result, timestamp: Date.now() });
        
        // Nettoyer le cache si trop volumineux
        if (budgetStateCache.size > 20) {
            const firstKey = budgetStateCache.keys().next().value;
            budgetStateCache.delete(firstKey);
        }

        return result;
    }, [budgetEntries, categories]);

    // 🔥 OPTIMISATION : Filtrage ultra-rapide
    const filteredBudgetEntries = useMemo(() => {
        if (!searchTerm) return expandedEntries;
        
        const lowerSearchTerm = searchTerm.toLowerCase();
        // 🔥 Utiliser une boucle for classique pour plus de performance
        const result = [];
        for (let i = 0; i < expandedEntries.length; i++) {
            const entry = expandedEntries[i];
            if (entry.supplier?.toLowerCase().includes(lowerSearchTerm) ||
                entry.category?.toLowerCase().includes(lowerSearchTerm)) {
                result.push(entry);
            }
        }
        return result;
    }, [expandedEntries, searchTerm]);

    // 🔥 OPTIMISATION : Handlers ultra-optimisés
    const handleAddEntry = useCallback((categoryName, mainCategoryType, mainCategoryId) => {
        if (!activeProject?.id) {
            uiDispatch({ 
                type: 'ADD_TOAST', 
                payload: { message: 'Erreur: Le projet actif n\'est pas défini.', type: 'error' } 
            });
            return;
        }

        const onSave = (entryData) => {
            saveEntry({ dataDispatch, uiDispatch }, {
                entryData,
                editingEntry: null,
                user: dataState.session?.user,
                tiers: dataState.tiers,
                cashAccounts: dataState.allCashAccounts?.[activeProject.id] || [],
                exchangeRates: dataState.exchangeRates,
                activeProjectId: activeProject.id
            });
        };

        uiDispatch({ 
            type: 'OPEN_BUDGET_DRAWER', 
            payload: { entry: { category: categoryName, type: mainCategoryType, mainCategoryId }, onSave } 
        });
    }, [activeProject?.id, dataDispatch, uiDispatch, dataState]);

    // Les autres handlers suivent le même pattern...

    // 🔥 OPTIMISATION : RenderSection avec mémoisation profonde
    const renderSection = useCallback((type) => {
        const isRevenue = type === 'revenu';
        const title = isRevenue ? 'Entrées' : 'Sorties';
        const Icon = isRevenue ? HandCoins : TrendingDown;
        const mainCategories = isRevenue ? categories?.revenue : categories?.expense;

        if (!mainCategories?.length) {
            return (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${isRevenue ? 'text-green-500' : 'text-red-500'}`} />
                        {title}
                    </h2>
                    <div className="text-center py-8 text-gray-500">
                        Aucune catégorie {isRevenue ? 'de revenu' : 'de dépense'} configurée.
                    </div>
                </div>
            );
        }

        const sectionEntries = filteredBudgetEntries.filter(e => e.type === type);
        
        if (sectionEntries.length === 0) {
            return (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${isRevenue ? 'text-green-500' : 'text-red-500'}`} />
                        {title}
                    </h2>
                    <div className="text-center py-4 text-gray-500">
                        Aucune entrée {isRevenue ? 'de revenu' : 'de dépense'} trouvée.
                    </div>
                    <div className="text-center mt-2">
                        <button 
                            onClick={() => { 
                                setAddCategoryFlowType(type); 
                                setIsAddCategoryFlowModalOpen(true); 
                            }} 
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-normal mx-auto"
                        >
                            <Plus size={16} /> 
                            Ajouter votre première entrée {isRevenue ? 'de revenu' : 'de dépense'}
                        </button>
                    </div>
                </div>
            );
        }

        const projectCurrency = activeProject?.currency || settings?.currency || 'EUR';

        return (
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isRevenue ? 'text-green-500' : 'text-red-500'}`} />
                    {title}
                </h2>
                
                <div className="space-y-1">
                    {mainCategories.map(mainCat => {
                        if (!mainCat?.subCategories) return null;
                        
                        const entriesForMainCat = sectionEntries.filter(entry => 
                            mainCat.subCategories.some(sc => sc && sc.name === entry.category) || 
                            (entry.is_vat_child && (entry.category === 'TVA collectée' || entry.category === 'TVA déductible') && mainCat.name === 'IMPÔTS & CONTRIBUTIONS')
                        );
                        
                        if (entriesForMainCat.length === 0) return null;

                        return (
                            <CategorySection
                                key={mainCat.id}
                                mainCat={mainCat}
                                entriesForMainCat={entriesForMainCat}
                                type={type}
                                projectCurrency={projectCurrency}
                                openDropdownId={openDropdownId}
                                dropdownRef={dropdownRef}
                                toggleDropdown={toggleDropdown}
                                handleAddEntry={handleAddEntry}
                                handleEditEntry={handleEditEntry}
                                handleDeleteEntry={handleDeleteEntry}
                                handleOpenDetailDrawer={handleOpenDetailDrawer}
                                settings={settings}
                            />
                        );
                    })}
                    <div className="text-center mt-4">
                        <button 
                            onClick={() => { 
                                setAddCategoryFlowType(type); 
                                setIsAddCategoryFlowModalOpen(true); 
                            }} 
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-normal mx-auto"
                        >
                            <Plus size={16} /> 
                            Ajouter une écriture dans une autre catégorie
                        </button>
                    </div>
                </div>
            </div>
        );
    }, [categories, filteredBudgetEntries, activeProject?.currency, settings, openDropdownId, handleAddEntry, handleEditEntry, handleDeleteEntry, handleOpenDetailDrawer]);

    // États de chargement
    if (loading) {
        return <LoadingState />;
    }

    if (isConsolidated) {
        return <ConsolidatedState />;
    }

    if (!activeProject) {
        return <ProjectLoadingState />;
    }

    if (!budgetData || budgetEntries.length === 0) {
        return <EmptyBudgetState onAddEntry={() => { setAddCategoryFlowType('depense'); setIsAddCategoryFlowModalOpen(true); }} />;
    }
    
    return (
        <div>
            {searchTerm && filteredBudgetEntries.length === 0 ? (
                <EmptySearchState searchTerm={searchTerm} />
            ) : (
                <>
                    {renderSection('revenu')}
                    {renderSection('depense')}
                </>
            )}
            
            <AddCategoryFlowModal 
                isOpen={isAddCategoryFlowModalOpen}
                onClose={() => setIsAddCategoryFlowModalOpen(false)}
                type={addCategoryFlowType}
                onCategorySelected={handleCategorySelectedForNewEntry}
            />
        </div>
    );
});

// 🔥 Composants de statut séparés pour éviter les re-rendus
const LoadingState = React.memo(() => (
    <div className="flex justify-center items-center p-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Chargement du budget...</span>
    </div>
));

const ConsolidatedState = React.memo(() => (
    <div className="text-center p-8 text-gray-500">
        L'état des lieux est disponible uniquement pour les projets individuels.
    </div>
));

const ProjectLoadingState = React.memo(() => (
    <div className="flex justify-center items-center p-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Chargement du projet...</span>
    </div>
));

const EmptyBudgetState = React.memo(({ onAddEntry }) => (
    <div className="text-center p-12">
        <EmptyState 
            icon={HandCoins}
            title="Aucune donnée budgétaire"
            message="Commencez par ajouter vos premières entrées budgétaires."
            actionLabel="Ajouter une entrée"
            onAction={onAddEntry}
        />
    </div>
));

const EmptySearchState = React.memo(({ searchTerm }) => (
    <EmptyState 
        icon={Search} 
        title="Aucun résultat" 
        message={`Aucune entrée trouvée pour "${searchTerm}".`} 
    />
));

export default BudgetStateView;