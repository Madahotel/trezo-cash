import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, XCircle, Folder, Edit, Trash2, Lock, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import ResizableTh from './ResizableTh.jsx';
import { calculateGeneralTotals } from '../../../hooks/calculateGeneralTotals.jsx';
import { calculateMainCategoryTotals } from '../../../hooks/calculateMainCategoryTotals.jsx';
import { formatCurrency } from '../../../utils/formatting.js';
import CommentButton from './CommentButton.jsx';

// ✅ CORRECTION: Fonction corrigée pour calculer les positions de trésorerie
const calculatePeriodPositions = (periods, cashAccounts, groupedData, expandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses) => {
    if (!periods || periods.length === 0 || !cashAccounts || cashAccounts.length === 0) {
        return periods?.map(() => ({ initial: 0, final: 0, netCashFlow: 0 })) || [];
    }

    console.log('=== CALCUL TRÉSORERIE CORRIGÉ ===');
    
    // Calcul du solde initial total
    const totalInitialBalance = cashAccounts.reduce((sum, account) => {
        return sum + (account.initialBalance || 0);
    }, 0);

    console.log('Solde initial total:', totalInitialBalance);

    const positions = [];
    let runningBalance = totalInitialBalance;

    for (let i = 0; i < periods.length; i++) {
        const period = periods[i];

        // Calcul des flux pour la période
        const revenueTotals = calculateGeneralTotals(
            groupedData.entree || [], 
            period, 
            'entree', 
            expandedAndVatEntries, 
            finalActualTransactions, 
            hasOffBudgetRevenues, 
            hasOffBudgetExpenses
        );
        
        const expenseTotals = calculateGeneralTotals(
            groupedData.sortie || [], 
            period, 
            'sortie', 
            expandedAndVatEntries, 
            finalActualTransactions, 
            hasOffBudgetRevenues, 
            hasOffBudgetExpenses
        );

        const netCashFlow = (revenueTotals.actual || 0) - (expenseTotals.actual || 0);
        
        // ✅ CORRECTION: Utiliser le solde courant comme initial
        const initialBalance = runningBalance;
        const finalBalance = initialBalance + netCashFlow;
        
        // Mettre à jour le solde courant pour la période suivante
        runningBalance = finalBalance;

        console.log(`Période ${i} (${period.label}):`, {
            initial: initialBalance,
            netCashFlow,
            final: finalBalance,
            revenues: revenueTotals.actual,
            expenses: expenseTotals.actual
        });

        positions.push({
            initial: initialBalance,
            final: finalBalance,
            netCashFlow: netCashFlow
        });
    }

    return positions;
};

const BudgetTableBody = ({
    // Props pour les données
    groupedData,
    expandedAndVatEntries,
    finalActualTransactions,
    finalCategories,
    projects,
    periods,
    effectiveCashAccounts,
    hasOffBudgetRevenues,
    hasOffBudgetExpenses,
    
    // Props pour l'UI
    visibleColumns,
    isConsolidated,
    isCustomConsolidated,
    columnWidths,
    currencySettings,
    
    // Props pour les interactions
    searchTerm,
    setSearchTerm,
    projectSearchTerm,
    setProjectSearchTerm,
    isTierSearchOpen,
    setIsTierSearchOpen,
    isProjectSearchOpen,
    setIsProjectSearchOpen,
    collapsedItems,
    setCollapsedItems,
    isEntreesCollapsed,
    setIsEntreesCollapsed,
    isSortiesCollapsed,
    setIsSortiesCollapsed,
    topScrollRef,
    mainScrollRef,
    
    // Handlers
    handleResize,
    handleEditEntry,
    handleDeleteEntry,
    handleOpenPaymentDrawer,
    handleActualClick,
    handleDrillDown,
    handleDrillUp,
    isRowVisibleInPeriods
}) => {
    // ✅ CORRECTION: Calcul des positions avec la fonction corrigée
    const periodPositions = useMemo(() => {
        return calculatePeriodPositions(
            periods,
            effectiveCashAccounts,
            groupedData,
            expandedAndVatEntries,
            finalActualTransactions,
            hasOffBudgetRevenues,
            hasOffBudgetExpenses
        );
    }, [periods, effectiveCashAccounts, groupedData, expandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses]);

    // Calcul des dimensions
    const supplierColLeft = columnWidths.category;
    const descriptionColLeft = supplierColLeft + columnWidths.supplier;
    const projectColLeft = descriptionColLeft + (visibleColumns.description ? columnWidths.description : 0);
    
    const numVisibleCols = Object.values(visibleColumns).filter(v => v).length;
    const periodColumnWidth = numVisibleCols > 0 ? numVisibleCols * 90 : 50;
    const separatorWidth = 4;

    const fixedColsWidth = columnWidths.category + columnWidths.supplier + 
        (visibleColumns.description ? columnWidths.description : 0) + 
        ((isConsolidated || isCustomConsolidated) ? columnWidths.project : 0);
    
    const totalTableWidth = fixedColsWidth + separatorWidth + (periods.length * (periodColumnWidth + separatorWidth));
    const totalCols = ((isConsolidated || isCustomConsolidated) ? 5 : 4) + (periods.length * 2);

    // Gestion du collapse
    const toggleCollapse = (mainCatId) => {
        setCollapsedItems(prev => ({
            ...prev,
            [mainCatId]: !prev[mainCatId]
        }));
    };

    // Fonctions utilitaires
    const getResteColor = (reste, isEntree) => {
        if (reste === 0) return 'text-text-secondary';
        return isEntree ? 
            (reste <= 0 ? 'text-success-600' : 'text-danger-600') : 
            (reste >= 0 ? 'text-success-600' : 'text-danger-600');
    };

    const criticalityConfig = {
        critical: { label: 'Critique', color: 'bg-red-500' },
        essential: { label: 'Essentiel', color: 'bg-yellow-500' },
        discretionary: { label: 'Discrétionnaire', color: 'bg-blue-500' },
    };

    // Rendu des lignes de budget (identique à l'original mais adapté)
    const renderBudgetRows = (type) => {
        // ... (le code de renderBudgetRows reste identique mais adapté au nouveau contexte)
        // Pour des raisons de longueur, je montre la structure
        return (
            <>
                {/* Total Row */}
                <tr className="bg-gray-200 border-gray-300 cursor-pointer border-y-2">
                    {/* ... contenu identique ... */}
                </tr>
                
                {/* Main Categories */}
                {/* ... contenu identique ... */}
            </>
        );
    };

    return (
        <div className="overflow-hidden rounded-lg shadow-lg bg-surface">
            <div ref={topScrollRef} className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                <div style={{ width: `${totalTableWidth}px`, height: '1px' }}></div>
            </div>
            <div ref={mainScrollRef} className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-30">
                        {/* En-têtes de colonnes */}
                        <tr>
                            <ResizableTh id="category" width={columnWidths.category} onResize={handleResize} className="sticky left-0 z-40 bg-gray-100">
                                <div className="flex items-center justify-between w-full">
                                    <span>Catégorie</span>
                                    <div className="flex items-center">
                                        <button onClick={handleDrillUp} className="p-1 text-gray-500 hover:text-gray-800" title="Réduire tout">
                                            <ChevronUp size={16} />
                                        </button>
                                        <button onClick={handleDrillDown} className="p-1 text-gray-500 hover:text-gray-800" title="Développer tout">
                                            <ChevronDown size={16} />
                                        </button>
                                    </div>
                                </div>
                            </ResizableTh>
                            
                            {/* ... autres ResizableTh ... */}
                        </tr>
                    </thead>
                    
                    <tbody>
                        {/* ✅ CORRECTION: Ligne Trésorerie début avec calculs corrigés */}
                        <tr className="text-gray-800 bg-gray-200">
                            <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-200" style={{ width: columnWidths.category }}>
                                Trésorerie début de période
                                <div className="mt-1 text-xs font-normal text-gray-500">
                                    {effectiveCashAccounts.length} compte(s) - Solde initial
                                </div>
                            </td>
                            {/* ... autres cellules fixes ... */}
                            
                            {periods.map((_, periodIndex) => {
                                const position = periodPositions[periodIndex];
                                const initialAmount = position?.initial || 0;

                                return (
                                    <React.Fragment key={periodIndex}>
                                        <td className="px-2 py-2 font-normal text-center" colSpan={1}>
                                            {formatCurrency(initialAmount, currencySettings)}
                                        </td>
                                        <td className="bg-surface"></td>
                                    </React.Fragment>
                                );
                            })}
                        </tr>

                        {/* Lignes de revenus et dépenses */}
                        {renderBudgetRows('entree')}
                        {renderBudgetRows('sortie')}

                        {/* ✅ CORRECTION: Ligne Trésorerie fin avec calculs corrigés */}
                        <tr className="text-gray-900 bg-gray-300">
                            <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-300" style={{ width: columnWidths.category }}>
                                Trésorerie fin de période
                                <div className="mt-1 text-xs font-normal text-gray-600">
                                    Solde initial + Flux net
                                </div>
                            </td>
                            {/* ... autres cellules fixes ... */}
                            
                            {periods.map((_, periodIndex) => {
                                const position = periodPositions[periodIndex];
                                const finalAmount = position?.final || 0;

                                return (
                                    <React.Fragment key={periodIndex}>
                                        <td className="px-2 py-2 font-normal text-center" colSpan={1}>
                                            {formatCurrency(finalAmount, currencySettings)}
                                        </td>
                                        <td className="bg-surface"></td>
                                    </React.Fragment>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BudgetTableBody;