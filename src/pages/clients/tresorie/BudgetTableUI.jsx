import React from 'react';
import ResizableTh from './ResizableTh.jsx';
import CommentButton from './CommentButton.jsx';
import BudgetTableRow from './BudgetTableRow.jsx';
import { Edit, Search, ChevronDown, TrendingUp, TrendingDown, XCircle, Trash2, ArrowRightLeft, Lock, ChevronUp } from 'lucide-react';

const BudgetTableUI = ({
    topScrollRef,
    mainScrollRef,
    drawerData,
    periods,
    groupedData,
    columnWidths,
    visibleColumns,
    currencySettings,
    filteredExpandedAndVatEntries,
    finalActualTransactions,
    hasOffBudgetRevenues,
    hasOffBudgetExpenses,
    effectiveCashAccounts,
    periodPositions,
    isTierSearchOpen,
    setIsTierSearchOpen,
    tierSearchRef,
    searchTerm,
    setSearchTerm,
    collapsedItems,
    isEntreesCollapsed,
    setIsEntreesCollapsed,
    isSortiesCollapsed,
    setIsSortiesCollapsed,
    toggleCollapse,
    handleResize,
    handleEditBudget,
    handleDeleteEntry,
    handleActualClick,
    handleDrillUp,
    handleDrillDown,
    criticalityConfig,
    realBudgetData,
    today,
    isDateToday,
    calculateGeneralTotals,
    calculateMainCategoryTotals,
    calculateEntryBudgetForPeriod,
    calculateActualAmountForPeriod,
    getEntryDescription,
    getFrequencyTitle,
    getResteColor,
    formatCurrency,
    projectStartDate,
    timeView,
    focusType = 'net',
}) => {
    const numVisibleCols = (visibleColumns.budget ? 1 : 0) + (visibleColumns.actual ? 1 : 0) + 1;
    const periodColumnWidth = numVisibleCols > 0 ? numVisibleCols * 90 : 50;
    const separatorWidth = 4;
    const fixedColsWidth = columnWidths.category + columnWidths.supplier + (visibleColumns.description ? columnWidths.description : 0);
    const totalTableWidth = fixedColsWidth + separatorWidth + periods.length * (periodColumnWidth + separatorWidth);
    const totalCols = 4 + periods.length * 2;
    const supplierColLeft = columnWidths.category;
    const descriptionColLeft = supplierColLeft + columnWidths.supplier;

    const periodCellStyle = {
        minWidth: `${periodColumnWidth}px`,
        width: `${periodColumnWidth}px`,
    };

    const shouldDisplayForPeriod = React.useCallback((entryStartDate, periodStart, periodEnd, entryFrequency) => {
        if (!entryStartDate) return false;

        const effectiveStartDate = new Date(entryStartDate);
        const periodStartDate = new Date(periodStart);
        const periodEndDate = new Date(periodEnd);

        // CORRECTION: Ajuster les heures pour la comparaison
        periodStartDate.setHours(0, 0, 0, 0);
        periodEndDate.setHours(23, 59, 59, 999);
        effectiveStartDate.setHours(0, 0, 0, 0);

        // Vérifier si la date de début est dans la période
        if (effectiveStartDate >= periodStartDate && effectiveStartDate <= periodEndDate) {
            return true;
        }

        // Récupérer l'ID de fréquence correctement
        let frequencyId;
        if (typeof entryFrequency === 'object') {
            frequencyId = entryFrequency.id ? entryFrequency.id.toString() :
                entryFrequency.frequency_id ? entryFrequency.frequency_id.toString() : null;
        } else {
            frequencyId = entryFrequency ? entryFrequency.toString() : null;
        }

        // Si pas de fréquence spécifique, vérifier seulement la date de début
        if (!frequencyId && typeof entryFrequency !== 'string') {
            return effectiveStartDate >= periodStartDate && effectiveStartDate <= periodEndDate;
        }

        // Fréquence ponctuelle: seulement à la date de début
        if (frequencyId === "1" || entryFrequency === "Ponctuel" || entryFrequency === "ponctuel") {
            return false; // Déjà vérifié ci-dessus
        }

        // Fréquence mensuelle: vérifier selon le jour du mois
        if (frequencyId === "3" || entryFrequency === "Mensuel" || entryFrequency === "mensuel") {
            const entryDayOfMonth = effectiveStartDate.getDate();
            const entryMonth = effectiveStartDate.getMonth();
            const entryYear = effectiveStartDate.getFullYear();

            const periodDay = periodStartDate.getDate();
            const periodMonth = periodStartDate.getMonth();
            const periodYear = periodStartDate.getFullYear();

            // Pour la vue semaine, vérifier si c'est le même jour
            if (timeView === 'week') {
                return effectiveStartDate.getDate() === periodDay &&
                    effectiveStartDate.getMonth() === periodMonth &&
                    effectiveStartDate.getFullYear() === periodYear;
            }

            // Pour la vue mois, vérifier si le jour correspond
            if (timeView === 'month') {
                // Vérifier si c'est le même mois et année
                if (periodMonth === entryMonth && periodYear === entryYear) {
                    // Vérifier si le jour est dans cette période (semaine)
                    return effectiveStartDate >= periodStartDate && effectiveStartDate <= periodEndDate;
                }
                return false;
            }

            // Pour les autres vues, vérifier récurrence mensuelle
            let currentDate = new Date(effectiveStartDate);
            while (currentDate <= periodEndDate) {
                if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                    return true;
                }
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            return false;
        }

        // Fréquence hebdomadaire: vérifier chaque semaine
        if (frequencyId === "4" || entryFrequency === "Hebdomadaire" || entryFrequency === "hebdomadaire") {
            let currentDate = new Date(effectiveStartDate);
            while (currentDate <= periodEndDate) {
                // Pour la vue semaine (affichage par jour), vérifier jour par jour
                if (timeView === 'week') {
                    if (currentDate.getDate() === periodStartDate.getDate() &&
                        currentDate.getMonth() === periodStartDate.getMonth() &&
                        currentDate.getFullYear() === periodStartDate.getFullYear()) {
                        return true;
                    }
                } else {
                    // Pour les autres vues, vérifier si la date tombe dans la période
                    if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                        return true;
                    }
                }
                currentDate.setDate(currentDate.getDate() + 7);
            }
            return false;
        }

        // Fréquence trimestrielle
        if (frequencyId === "6" || entryFrequency === "Trimestriel" || entryFrequency === "trimestriel") {
            let currentDate = new Date(effectiveStartDate);
            while (currentDate <= periodEndDate) {
                if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                    return true;
                }
                currentDate.setMonth(currentDate.getMonth() + 3);
            }
            return false;
        }

        // Fréquence semestrielle
        if (frequencyId === "7" || entryFrequency === "Semestriel" || entryFrequency === "semestriel") {
            let currentDate = new Date(effectiveStartDate);
            while (currentDate <= periodEndDate) {
                if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                    return true;
                }
                currentDate.setMonth(currentDate.getMonth() + 6);
            }
            return false;
        }

        // Fréquence annuelle
        if (frequencyId === "8" || entryFrequency === "Annuel" || entryFrequency === "annuel") {
            let currentDate = new Date(effectiveStartDate);
            while (currentDate <= periodEndDate) {
                if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                    return true;
                }
                currentDate.setFullYear(currentDate.getFullYear() + 1);
            }
            return false;
        }

        // Pour les autres cas (journalier, etc.)
        return effectiveStartDate >= periodStartDate && effectiveStartDate <= periodEndDate;
    }, [projectStartDate, timeView]);

    // Fonction pour vérifier si une entry doit être affichée selon le focus
    const shouldDisplayEntryByFocus = React.useCallback((entryType) => {
        if (focusType === 'entree') {
            return entryType === 'entree';
        } else if (focusType === 'sortie') {
            return entryType === 'sortie';
        } else {
            return true; // Net: afficher tout
        }
    }, [focusType]);

    // Calcul des totaux globaux par type
    const calculateTotalByType = React.useCallback((type) => {
        const mainCategories = groupedData[type] || [];
        let totalBudget = 0;
        let totalActual = 0;

        mainCategories.forEach(mainCategory => {
            mainCategory.entries?.forEach(entry => {
                periods.forEach((period, periodIndex) => {
                    if (shouldDisplayForPeriod(entry.startDate, period.startDate, period.endDate, entry.frequency)) {
                        const budget = calculateEntryBudgetForPeriod(entry, period.startDate, period.endDate, periodIndex, period);
                        const actual = calculateActualAmountForPeriod(entry, finalActualTransactions, period.startDate, period.endDate, realBudgetData);
                        totalBudget += budget;
                        totalActual += actual;
                    }
                });
            });
        });

        return { totalBudget, totalActual, totalReste: totalBudget - totalActual };
    }, [groupedData, periods, calculateEntryBudgetForPeriod, calculateActualAmountForPeriod, finalActualTransactions, realBudgetData, shouldDisplayForPeriod]);

    // Calcul des totaux par période pour une catégorie spécifique
    const calculateCategoryTotalsByPeriod = React.useCallback((type, periodIndex) => {
        const mainCategories = groupedData[type] || [];
        let periodBudget = 0;
        let periodActual = 0;

        const period = periods[periodIndex];
        if (!period) return { periodBudget: 0, periodActual: 0, periodReste: 0 };

        mainCategories.forEach(mainCategory => {
            mainCategory.entries?.forEach(entry => {
                if (shouldDisplayForPeriod(entry.startDate, period.startDate, period.endDate, entry.frequency)) {
                    const budget = calculateEntryBudgetForPeriod(entry, period.startDate, period.endDate, periodIndex, period);
                    const actual = calculateActualAmountForPeriod(entry, finalActualTransactions, period.startDate, period.endDate, realBudgetData);
                    periodBudget += budget;
                    periodActual += actual;
                }
            });
        });

        return { periodBudget, periodActual, periodReste: periodBudget - periodActual };
    }, [groupedData, periods, calculateEntryBudgetForPeriod, calculateActualAmountForPeriod, finalActualTransactions, realBudgetData, shouldDisplayForPeriod]);

    // Totaux globaux
    const totalEntrees = React.useMemo(() => calculateTotalByType('entree'), [calculateTotalByType]);
    const totalSorties = React.useMemo(() => calculateTotalByType('sortie'), [calculateTotalByType]);
    const totalNet = {
        totalBudget: totalEntrees.totalBudget - totalSorties.totalBudget,
        totalActual: totalEntrees.totalActual - totalSorties.totalActual,
        totalReste: totalEntrees.totalReste - totalSorties.totalReste
    };

    // Fonction pour obtenir les totaux selon le focus
    const getFocusedTotals = React.useCallback((periodIndex) => {
        if (focusType === 'entree') {
            return calculateCategoryTotalsByPeriod('entree', periodIndex);
        } else if (focusType === 'sortie') {
            return calculateCategoryTotalsByPeriod('sortie', periodIndex);
        } else {
            const entrees = calculateCategoryTotalsByPeriod('entree', periodIndex);
            const sorties = calculateCategoryTotalsByPeriod('sortie', periodIndex);
            return {
                periodBudget: entrees.periodBudget - sorties.periodBudget,
                periodActual: entrees.periodActual - sorties.periodActual,
                periodReste: (entrees.periodBudget - sorties.periodBudget) - (entrees.periodActual - sorties.periodActual)
            };
        }
    }, [focusType, calculateCategoryTotalsByPeriod]);

    const renderBudgetRows = (type) => {
        const isEntree = type === 'entree';

        // Vérifier si ce type doit être affiché selon le focus
        if (!shouldDisplayEntryByFocus(type === 'entree' ? 'entree' : 'sortie')) {
            return null;
        }

        const mainCategories = groupedData[type] || [];
        const isCollapsed = type === 'entree' ? isEntreesCollapsed : isSortiesCollapsed;
        const toggleMainCollapse = type === 'entree' ? () => setIsEntreesCollapsed((p) => !p) : () => setIsSortiesCollapsed((p) => !p);
        const Icon = type === 'entree' ? TrendingUp : TrendingDown;
        const colorClass = type === 'entree' ? 'text-success-600' : 'text-danger-600';

        return (
            <>
                {/* LIGNE DU TOTAL DES CATÉGORIES */}
                <tr className="bg-gray-200 border-gray-300 cursor-pointer border-y-2" onClick={toggleMainCollapse}>
                    <td className="sticky left-0 z-20 px-4 py-1 bg-gray-200 text-text-primary" style={{ width: columnWidths.category }}>
                        <div className="flex items-center gap-2 font-bold">
                            <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                            <Icon className={`w-4 h-4 ${colorClass}`} />
                            {isEntree ? 'Total Entrées par Catégorie' : 'Total Sorties par Catégorie'}
                        </div>
                    </td>
                    <td className="sticky z-20 px-4 py-1 bg-gray-200" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                    {visibleColumns.description && (
                        <td className="sticky z-20 px-4 py-1 bg-gray-200" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                    )}
                    <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>
                    {periods.map((period, periodIndex) => {
                        const periodTotals = calculateCategoryTotalsByPeriod(type, periodIndex);
                        const columnIdBase = period.startDate.toISOString();
                        const rowId = `total_${type}`;

                        return (
                            <React.Fragment key={periodIndex}>
                                <td className="px-1 py-1" style={periodCellStyle}>
                                    {numVisibleCols > 0 && (
                                        <div className="grid grid-cols-3 gap-1 text-xs">
                                            {visibleColumns.budget && (
                                                <div className="relative text-center text-gray-500 group/subcell">
                                                    {formatCurrency(periodTotals.periodBudget, currencySettings)}
                                                    <CommentButton
                                                        rowId={rowId}
                                                        columnId={`${columnIdBase}_budget`}
                                                        rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'} par Catégorie`}
                                                        columnName={`${period.label} (Prév.)`}
                                                    />
                                                </div>
                                            )}
                                            {visibleColumns.actual && (
                                                <div className="relative text-center group/subcell">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            if (periodTotals.periodActual !== 0) {
                                                                handleActualClick({ type, period, source: isEntree ? 'totalEntrees' : 'totalSorties' });
                                                            }
                                                        }}
                                                        disabled={periodTotals.periodActual === 0}
                                                        className="font-normal text-text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {formatCurrency(periodTotals.periodActual, currencySettings)}
                                                    </button>
                                                    <CommentButton
                                                        rowId={rowId}
                                                        columnId={`${columnIdBase}_actual`}
                                                        rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'} par Catégorie`}
                                                        columnName={`${period.label} (Réel)`}
                                                    />
                                                </div>
                                            )}
                                            <div className={`relative text-center font-normal ${getResteColor(periodTotals.periodReste, isEntree)}`}>
                                                {formatCurrency(periodTotals.periodReste, currencySettings)}
                                                <CommentButton
                                                    rowId={rowId}
                                                    columnId={`${columnIdBase}_reste`}
                                                    rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'} par Catégorie`}
                                                    columnName={`${period.label} (Reste)`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="bg-surface"></td>
                            </React.Fragment>
                        );
                    })}
                </tr>

                {/* CATÉGORIES ET ENTRIES */}
                {!isCollapsed && mainCategories.length > 0 && mainCategories.map((mainCategory) => {
                    const isMainCollapsed = collapsedItems[mainCategory.id];

                    return (
                        <React.Fragment key={mainCategory.id}>
                            {/* LIGNE DE LA CATÉGORIE AVEC TOTAUX */}
                            <tr onClick={() => toggleCollapse(mainCategory.id)} className="text-gray-700 bg-gray-100 cursor-pointer hover:bg-gray-200">
                                <td className="sticky left-0 z-20 px-4 py-1 bg-gray-100" style={{ width: columnWidths.category }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-semibold">
                                            <ChevronDown className={`w-4 h-4 transition-transform ${isMainCollapsed ? '-rotate-90' : ''}`} />
                                            {mainCategory.name}
                                        </div>
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-1 bg-gray-100" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && (
                                    <td className="sticky z-20 px-4 py-1 bg-gray-100" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                                )}
                                <td className="bg-surface"></td>
                                {periods.map((period, periodIndex) => {
                                    // Filtrer les entries qui doivent s'afficher pour cette période
                                    const filteredEntries = mainCategory.entries?.filter(entry =>
                                        shouldDisplayForPeriod(entry.startDate, period.startDate, period.endDate, entry.frequency)
                                    ) || [];

                                    const totals = calculateMainCategoryTotals(filteredEntries, period, finalActualTransactions);
                                    const reste = totals.budget - totals.actual;
                                    const columnIdBase = period.startDate.toISOString();
                                    const rowId = `main_cat_${mainCategory.id}`;

                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-1 py-1" style={periodCellStyle}>
                                                {numVisibleCols > 0 && (
                                                    <div className="grid grid-cols-3 gap-1 text-xs">
                                                        {visibleColumns.budget && (
                                                            <div className="relative text-center text-gray-500 group/subcell">
                                                                {formatCurrency(totals.budget, currencySettings)}
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_budget`}
                                                                    rowName={mainCategory.name}
                                                                    columnName={`${period.label} (Prév.)`}
                                                                />
                                                            </div>
                                                        )}
                                                        {visibleColumns.actual && (
                                                            <div className="relative text-center group/subcell">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        if (totals.actual !== 0) {
                                                                            handleActualClick({ mainCategory, period, source: 'mainCategory' });
                                                                        }
                                                                    }}
                                                                    disabled={totals.actual === 0}
                                                                    className="hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {formatCurrency(totals.actual, currencySettings)}
                                                                </button>
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_actual`}
                                                                    rowName={mainCategory.name}
                                                                    columnName={`${period.label} (Réel)`}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className={`relative text-center font-normal ${getResteColor(reste, isEntree)}`}>
                                                            {formatCurrency(reste, currencySettings)}
                                                            <CommentButton
                                                                rowId={rowId}
                                                                columnId={`${columnIdBase}_reste`}
                                                                rowName={mainCategory.name}
                                                                columnName={`${period.label} (Reste)`}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="bg-surface"></td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>

                            {/* ENTRIES DE LA CATÉGORIE */}
                            {!isMainCollapsed && mainCategory.entries && mainCategory.entries.map((entry) => {
                                // Vérifier si cette entry doit être affichée dans au moins une période
                                const hasVisiblePeriods = periods.some(period =>
                                    shouldDisplayForPeriod(entry.startDate, period.startDate, period.endDate, entry.frequency)
                                );

                                if (!hasVisiblePeriods) return null;

                                return (
                                    <BudgetTableRow
                                        key={entry.id}
                                        entry={entry}
                                        periods={periods}
                                        columnWidths={columnWidths}
                                        visibleColumns={visibleColumns}
                                        currencySettings={currencySettings}
                                        isEntree={isEntree}
                                        supplierColLeft={supplierColLeft}
                                        descriptionColLeft={descriptionColLeft}
                                        periodCellStyle={periodCellStyle}
                                        numVisibleCols={numVisibleCols}
                                        handleEditBudget={handleEditBudget}
                                        handleDeleteEntry={handleDeleteEntry}
                                        handleActualClick={handleActualClick}
                                        calculateEntryBudgetForPeriod={calculateEntryBudgetForPeriod}
                                        calculateActualAmountForPeriod={calculateActualAmountForPeriod}
                                        getEntryDescription={getEntryDescription}
                                        getFrequencyTitle={getFrequencyTitle}
                                        getResteColor={getResteColor}
                                        formatCurrency={formatCurrency}
                                        criticalityConfig={criticalityConfig}
                                        realBudgetData={realBudgetData}
                                        finalActualTransactions={finalActualTransactions}
                                        // Passer la fonction shouldDisplayForPeriod au BudgetTableRow
                                        shouldDisplayForPeriod={(periodStart, periodEnd) =>
                                            shouldDisplayForPeriod(entry.startDate, periodStart, periodEnd, entry.frequency)
                                        }
                                    />
                                );
                            })}
                        </React.Fragment>
                    );
                })}
            </>
        );
    };

    return (
        <div className={`relative mb-6 transition-opacity duration-300 ${drawerData.isOpen ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="relative z-10 overflow-hidden rounded-lg shadow-lg bg-surface">
                <div ref={topScrollRef} className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                    <div style={{ width: `${totalTableWidth}px`, height: '1px' }}></div>
                </div>
                <div ref={mainScrollRef} className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-30">
                            <tr>
                                <ResizableTh
                                    id="category"
                                    width={columnWidths.category}
                                    onResize={handleResize}
                                    className="sticky left-0 z-40 bg-gray-100"
                                >
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
                                <ResizableTh
                                    id="supplier"
                                    width={columnWidths.supplier}
                                    onResize={handleResize}
                                    className="sticky z-30 bg-gray-100"
                                    style={{ left: `${supplierColLeft}px` }}
                                >
                                    {isTierSearchOpen ? (
                                        <div ref={tierSearchRef} className="flex items-center w-full gap-1">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Rechercher..."
                                                className="w-full px-2 py-1 text-sm bg-white border rounded-md"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <button onClick={() => setSearchTerm('')} className="p-1 text-gray-500 hover:text-gray-800" title="Effacer">
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <span>Tiers</span>
                                            <button onClick={() => setIsTierSearchOpen(true)} className="p-1 text-gray-500 hover:text-gray-800" title="Rechercher par tiers">
                                                <Search size={14} />
                                            </button>
                                        </div>
                                    )}
                                </ResizableTh>
                                {visibleColumns.description && (
                                    <ResizableTh
                                        id="description"
                                        width={columnWidths.description}
                                        onResize={handleResize}
                                        className="sticky z-30 bg-gray-100"
                                        style={{ left: `${descriptionColLeft}px` }}
                                    >
                                        Description
                                    </ResizableTh>
                                )}
                                <th className="border-b-2 bg-surface" style={{ width: `${separatorWidth}px` }}></th>
                                {periods.map((period, periodIndex) => {
                                    const isPast = period.endDate <= today;
                                    const isTodayPeriod = period.isToday || isDateToday(period.startDate);
                                    const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                                    const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                                    const netBudget = revenueTotals.budget - expenseTotals.budget;
                                    const isNegativeFlow = netBudget < 0;

                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <th
                                                className={`px-2 py-2 text-center font-medium border-b-2 ${isPast ? 'bg-gray-50' : 'bg-surface'} ${isNegativeFlow && !isPast ? 'bg-red-50' : ''} ${isTodayPeriod ? 'bg-blue-50 border-blue-200' : ''}`}
                                                style={{ minWidth: `${periodColumnWidth}px` }}
                                            >
                                                <div className={`text-base mb-1 ${isTodayPeriod ? 'text-blue-700 font-semibold' : isNegativeFlow && !isPast ? 'text-red-700' : 'text-gray-600'}`}>
                                                    {period.label}
                                                    {isTodayPeriod && (
                                                        <span className="ml-1 text-xs font-normal text-blue-500">(Aujourd'hui)</span>
                                                    )}
                                                </div>
                                                {numVisibleCols > 0 && (
                                                    <div className="flex justify-around gap-2 text-xs font-medium text-gray-600">
                                                        {visibleColumns.budget && <div className="flex-1">Prév.</div>}
                                                        {visibleColumns.actual && <div className="flex-1">Réel</div>}
                                                        <div className="flex-1">Reste</div>
                                                    </div>
                                                )}
                                            </th>
                                            <th className="border-b-2 bg-surface" style={{ width: `${separatorWidth}px` }}></th>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {/* TRÉSORERIE DÉBUT DE PÉRIODE */}
                            <tr className="text-gray-800 bg-gray-200">
                                <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-200" style={{ width: columnWidths.category }}>
                                    Trésorerie début de période
                                    <div className="mt-1 text-xs font-normal text-gray-500">
                                        {effectiveCashAccounts.length} compte(s) - Solde initial
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && (
                                    <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                                )}
                                <td className="bg-surface"></td>
                                {periods.map((_, periodIndex) => {
                                    const position = periodPositions[periodIndex];
                                    const initialAmount = position?.initial || 0;
                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-2 py-2 font-normal text-center" colSpan={numVisibleCols}>
                                                {formatCurrency(initialAmount, currencySettings)}
                                            </td>
                                            <td className="bg-surface"></td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>

                            <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>

                            {/* ENTRÉES */}
                            {renderBudgetRows('entree')}

                            <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>

                            {/* SORTIES */}
                            {renderBudgetRows('sortie')}

                            <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>

                            {/* LIGNE DU FLUX DE TRÉSORERIE (PAR PÉRIODE) (selon focus) */}
                            <tr className="border-t-2 border-b-2 border-indigo-200 bg-indigo-50">
                                <td className="sticky left-0 z-20 px-4 py-2 font-bold text-indigo-900 bg-indigo-50" style={{ width: columnWidths.category }}>
                                    <div className="flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4" />
                                        {focusType === 'entree' ? 'Total Entrées Global' :
                                            focusType === 'sortie' ? 'Total Sorties Global' :
                                                'Flux de trésorerie (par période)'}
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-2 bg-indigo-50" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && (
                                    <td className="sticky z-20 px-4 py-2 bg-indigo-50" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                                )}
                                <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>
                                {periods.map((period, periodIndex) => {
                                    const totals = getFocusedTotals(periodIndex);
                                    const columnIdBase = period.startDate.toISOString();
                                    const rowId = `global_${focusType}_total`;

                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-1 py-2" style={periodCellStyle}>
                                                {numVisibleCols > 0 && (
                                                    <div className="grid grid-cols-3 gap-1 text-sm">
                                                        {visibleColumns.budget && (
                                                            <div className={`relative font-bold text-center ${totals.periodBudget < 0 && focusType === 'net' ? 'text-red-700' : 'text-indigo-700'} group/subcell`}>
                                                                {formatCurrency(totals.periodBudget, currencySettings)}
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_budget`}
                                                                    rowName={focusType === 'entree' ? 'Total Entrées Global' :
                                                                        focusType === 'sortie' ? 'Total Sorties Global' :
                                                                            'Flux de trésorerie (par période)'}
                                                                    columnName={`${period.label} (Prév.)`}
                                                                />
                                                            </div>
                                                        )}
                                                        {visibleColumns.actual && (
                                                            <div className="relative font-bold text-center text-indigo-700 group/subcell">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        if (totals.periodActual !== 0) {
                                                                            handleActualClick({ type: focusType, period, source: 'globalTotal' });
                                                                        }
                                                                    }}
                                                                    disabled={totals.periodActual === 0}
                                                                    className="hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {formatCurrency(totals.periodActual, currencySettings)}
                                                                </button>
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_actual`}
                                                                    rowName={focusType === 'entree' ? 'Total Entrées Global' :
                                                                        focusType === 'sortie' ? 'Total Sorties Global' :
                                                                            'Flux de trésorerie (par période)'}
                                                                    columnName={`${period.label} (Réel)`}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className={`relative font-bold text-center ${getResteColor(totals.periodReste, focusType !== 'sortie')}`}>
                                                            {formatCurrency(totals.periodReste, currencySettings)}
                                                            <CommentButton
                                                                rowId={rowId}
                                                                columnId={`${columnIdBase}_reste`}
                                                                rowName={focusType === 'entree' ? 'Total Entrées Global' :
                                                                    focusType === 'sortie' ? 'Total Sorties Global' :
                                                                        'Flux de trésorerie (par période)'}
                                                                columnName={`${period.label} (Reste)`}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="bg-surface"></td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>


                            {/* TRÉSORERIE FIN DE PÉRIODE */}
                            <tr className="text-gray-900 bg-gray-300">
                                <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-300" style={{ width: columnWidths.category }}>
                                    Trésorerie fin de période
                                    <div className="mt-1 text-xs font-normal text-gray-600">Solde initial + Flux net</div>
                                </td>
                                <td className="sticky z-20 px-4 py-2 bg-gray-300" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && (
                                    <td className="sticky z-20 px-4 py-2 bg-gray-300" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                                )}
                                <td className="bg-surface"></td>
                                {periods.map((_, periodIndex) => {
                                    const position = periodPositions[periodIndex];
                                    const finalAmount = position?.final || 0;
                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-2 py-2 font-normal text-center" colSpan={numVisibleCols}>
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
        </div>
    );
};

export default BudgetTableUI;