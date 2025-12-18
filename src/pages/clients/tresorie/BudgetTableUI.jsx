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

    const shouldDisplayForPeriod = React.useCallback((entryStartDate, periodStart, periodEnd, entryFrequency, timeView) => {
        if (!entryStartDate) return false;

        const effectiveStartDate = new Date(entryStartDate);
        const periodStartDate = new Date(periodStart);
        const periodEndDate = new Date(periodEnd);

        periodStartDate.setHours(0, 0, 0, 0);
        periodEndDate.setHours(23, 59, 59, 999);
        effectiveStartDate.setHours(0, 0, 0, 0);

        // Vérifier d'abord si l'entrée commence après la période
        if (effectiveStartDate > periodEndDate) return false;

        let frequencyId;
        if (typeof entryFrequency === 'object') {
            frequencyId = entryFrequency.id ? entryFrequency.id.toString() :
                entryFrequency.frequency_id ? entryFrequency.frequency_id.toString() : null;
        } else {
            frequencyId = entryFrequency ? entryFrequency.toString() : null;
        }

        const isOneTime = frequencyId === "1" || entryFrequency === "Ponctuel" || entryFrequency === "ponctuel";

        // CAS 1: FRÉQUENCE PONCTUELLE
        if (isOneTime) {
            return effectiveStartDate >= periodStartDate && effectiveStartDate <= periodEndDate;
        }

        // CAS 2: FRÉQUENCE MENSUELLE - CORRIGÉ POUR TOUTES LES VUES
        if (frequencyId === "3" || entryFrequency === "Mensuel" || entryFrequency === "mensuel") {
            // Ne pas afficher si l'entrée commence après la période
            if (effectiveStartDate > periodEndDate) return false;

            // Récupérer le jour du mois du paiement (ex: 17)
            const paymentDay = effectiveStartDate.getDate();

            // Fonction pour vérifier si une date de paiement tombe dans une période
            const isPaymentDateInPeriod = (checkDate) => {
                return checkDate >= effectiveStartDate &&
                    checkDate >= periodStartDate &&
                    checkDate <= periodEndDate;
            };

            // 1. Déterminer le(s) mois qui se chevauchent avec cette période
            const periodStartMonth = periodStartDate.getMonth();
            const periodStartYear = periodStartDate.getFullYear();
            const periodEndMonth = periodEndDate.getMonth();
            const periodEndYear = periodEndDate.getFullYear();

            // Vérifier chaque mois qui se chevauche avec la période
            let currentYear = periodStartYear;
            let currentMonth = periodStartMonth;

            while (currentYear < periodEndYear ||
                (currentYear === periodEndYear && currentMonth <= periodEndMonth)) {

                // Calculer la date de paiement pour ce mois
                const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                const actualPaymentDay = Math.min(paymentDay, lastDayOfMonth);
                const paymentDateThisMonth = new Date(currentYear, currentMonth, actualPaymentDay);
                paymentDateThisMonth.setHours(0, 0, 0, 0);

                // Vérifier si cette date de paiement est dans la période
                if (isPaymentDateInPeriod(paymentDateThisMonth)) {
                    return true;
                }

                // Passer au mois suivant
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
            }

            return false;
        }

        // CAS 3: FRÉQUENCE HEBDOMADAIRE - CORRIGÉ
        if (frequencyId === "4" || entryFrequency === "Hebdomadaire" || entryFrequency === "hebdomadaire") {
            if (effectiveStartDate <= periodEndDate) {
                // Pour la vue Bimestre (8 semaines), on doit vérifier chaque semaine
                if (timeView === 'bimester') {
                    // Calculer toutes les semaines depuis la date de début
                    let currentWeek = new Date(effectiveStartDate);

                    while (currentWeek <= periodEndDate) {
                        if (currentWeek >= periodStartDate && currentWeek <= periodEndDate) {
                            return true;
                        }
                        // Passer à la semaine suivante
                        currentWeek.setDate(currentWeek.getDate() + 7);
                    }
                } else {
                    // Pour les autres vues, vérifier si un multiple de 7 jours tombe dans la période
                    const diffInDays = Math.floor((periodStartDate - effectiveStartDate) / (1000 * 60 * 60 * 24));

                    if (diffInDays >= 0 && diffInDays % 7 === 0) {
                        const paymentDate = new Date(effectiveStartDate);
                        paymentDate.setDate(paymentDate.getDate() + diffInDays);

                        if (paymentDate >= periodStartDate && paymentDate <= periodEndDate) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        // CAS 4: FRÉQUENCE BIMENSUELLE (tous les 2 mois)
        if (frequencyId === "5" || entryFrequency === "Bimensuel" || entryFrequency === "bimensuel") {
            if (effectiveStartDate <= periodEndDate) {
                const paymentDay = effectiveStartDate.getDate();

                // Vérifier tous les 2 mois
                let currentDate = new Date(effectiveStartDate);

                while (currentDate <= periodEndDate) {
                    if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                        // Vérifier aussi le jour du mois
                        if (currentDate.getDate() === paymentDay) {
                            return true;
                        }
                    }
                    // Passer à 2 mois suivants
                    currentDate.setMonth(currentDate.getMonth() + 2);
                    // Réappliquer le jour exact
                    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    const actualDay = Math.min(paymentDay, lastDayOfMonth);
                    currentDate.setDate(actualDay);
                }
            }
            return false;
        }

        // CAS 5: FRÉQUENCE TRIMESTRIELLE
        if (frequencyId === "6" || entryFrequency === "Trimestriel" || entryFrequency === "trimestriel") {
            if (effectiveStartDate <= periodEndDate) {
                const paymentDay = effectiveStartDate.getDate();

                // Vérifier tous les trimestres (tous les 3 mois)
                let currentDate = new Date(effectiveStartDate);

                while (currentDate <= periodEndDate) {
                    if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                        // Vérifier aussi le jour du mois
                        if (currentDate.getDate() === paymentDay) {
                            return true;
                        }
                    }
                    // Passer au trimestre suivant (+3 mois)
                    currentDate.setMonth(currentDate.getMonth() + 3);
                    // Réappliquer le jour exact
                    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    const actualDay = Math.min(paymentDay, lastDayOfMonth);
                    currentDate.setDate(actualDay);
                }
            }
            return false;
        }

        // CAS 6: FRÉQUENCE SEMESTRIELLE
        if (frequencyId === "7" || entryFrequency === "Semestriel" || entryFrequency === "semestriel") {
            if (effectiveStartDate <= periodEndDate) {
                const paymentDay = effectiveStartDate.getDate();
                const paymentMonth = effectiveStartDate.getMonth();

                // Vérifier tous les 6 mois
                let currentDate = new Date(effectiveStartDate);

                while (currentDate <= periodEndDate) {
                    if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                        // Vérifier aussi le jour du mois
                        if (currentDate.getDate() === paymentDay &&
                            (currentDate.getMonth() === paymentMonth ||
                                currentDate.getMonth() === (paymentMonth + 6) % 12)) {
                            return true;
                        }
                    }
                    // Passer au semestre suivant (+6 mois)
                    currentDate.setMonth(currentDate.getMonth() + 6);
                    // Réappliquer le jour exact
                    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    const actualDay = Math.min(paymentDay, lastDayOfMonth);
                    currentDate.setDate(actualDay);
                }
            }
            return false;
        }

        // CAS 7: FRÉQUENCE ANNUELLE
        if (frequencyId === "8" || entryFrequency === "Annuel" || entryFrequency === "annuel") {
            if (effectiveStartDate <= periodEndDate) {
                const paymentDay = effectiveStartDate.getDate();
                const paymentMonth = effectiveStartDate.getMonth();

                // Vérifier chaque année
                let currentDate = new Date(effectiveStartDate);

                while (currentDate <= periodEndDate) {
                    if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                        // Vérifier le mois et le jour exacts
                        if (currentDate.getMonth() === paymentMonth && currentDate.getDate() === paymentDay) {
                            return true;
                        }
                    }
                    // Passer à l'année suivante
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    // Réappliquer le jour et mois exacts
                    const lastDayOfMonth = new Date(currentDate.getFullYear(), paymentMonth + 1, 0).getDate();
                    const actualDay = Math.min(paymentDay, lastDayOfMonth);
                    currentDate.setMonth(paymentMonth);
                    currentDate.setDate(actualDay);
                }
            }
            return false;
        }

        // CAS PAR DÉFAUT: Si l'entrée commence avant la fin de la période
        return effectiveStartDate <= periodEndDate;
    }, [projectStartDate, timeView]);

    // Calculer le solde initial total
    const totalInitialBalance = React.useMemo(() => {
        if (!effectiveCashAccounts || effectiveCashAccounts.length === 0) {
            console.log('🔍 DEBUG: Aucun compte de trésorerie trouvé');
            return 0;
        }

        const total = effectiveCashAccounts.reduce((sum, account) => {
            const initialAmount = parseFloat(account.initial_amount || account.initialBalance || 0);
            if (initialAmount === 10000) {
                if (account.is_configured === false || account.has_initial_balance === false) {
                    console.log('🔄 Compte non configuré - on ignore les 10000€');
                    return sum;
                }
            }

            return sum + (isNaN(initialAmount) ? 0 : initialAmount);
        }, 0);

        if (isNaN(total)) {
            return 0;
        }
        if (total === 10000 && effectiveCashAccounts.every(acc => !acc.is_active || !acc.is_configured)) {
            console.log('🔄 Correction: Aucun compte actif avec solde réel - retourne 0');
            return 0;
        }

        return total;
    }, [effectiveCashAccounts]);

    const calculateCategoryTotalsByPeriod = React.useCallback((type, periodIndex) => {
        const mainCategories = groupedData[type] || [];
        let periodBudget = 0;
        let periodActual = 0;

        const period = periods[periodIndex];
        if (!period) return { periodBudget: 0, periodActual: 0, periodReste: 0 };

        mainCategories.forEach(mainCategory => {
            mainCategory.entries?.forEach(entry => {
                const shouldDisplay = shouldDisplayForPeriod(
                    entry.startDate,
                    period.startDate,
                    period.endDate,
                    entry.frequency,
                    timeView
                );

                if (shouldDisplay) {
                    const budget = calculateEntryBudgetForPeriod(entry, period.startDate, period.endDate, periodIndex, period);
                    const actual = calculateActualAmountForPeriod(entry, finalActualTransactions, period.startDate, period.endDate, realBudgetData);

                    periodBudget += budget;
                    periodActual += actual;
                }
            });
        });

        return {
            periodBudget,
            periodActual,
            periodReste: periodBudget - periodActual
        };
    }, [groupedData, periods, calculateEntryBudgetForPeriod, calculateActualAmountForPeriod, finalActualTransactions, realBudgetData, shouldDisplayForPeriod]);

    // ✅ CORRIGÉ: Calculer les soldes initiaux BUDGET et RÉEL séparément
    const calculateAllInitialBalances = React.useMemo(() => {
        if (!periods || periods.length === 0) {
            return { budget: [], actual: [] };
        }

        const initialBudgetBalances = new Array(periods.length).fill(0);
        const initialActualBalances = new Array(periods.length).fill(0);

        // Premier solde initial = totalInitialBalance
        initialBudgetBalances[0] = totalInitialBalance || 0;
        initialActualBalances[0] = totalInitialBalance || 0;

        console.log('🔢 DEBUG calculateAllInitialBalances - Solde initial période 0:', {
            budget: initialBudgetBalances[0],
            actual: initialActualBalances[0]
        });

        // Pour chaque période suivante
        for (let i = 1; i < periods.length; i++) {
            // 1. Récupérer les soldes précédents
            const previousBudget = initialBudgetBalances[i - 1];
            const previousActual = initialActualBalances[i - 1];

            // 2. Calculer les flux nets POUR LA PÉRIODE PRÉCÉDENTE (i-1)
            const entreesPrev = calculateCategoryTotalsByPeriod('entree', i - 1);
            const sortiesPrev = calculateCategoryTotalsByPeriod('sortie', i - 1);

            // Flux NET pour la période précédente
            const netFlowBudgetPrev = entreesPrev.periodBudget - sortiesPrev.periodBudget;
            const netFlowActualPrev = entreesPrev.periodActual - sortiesPrev.periodActual;

            // 3. Solde initial actuel = solde précédent + flux net précédent
            initialBudgetBalances[i] = previousBudget + netFlowBudgetPrev;
            initialActualBalances[i] = previousActual + netFlowActualPrev;

            console.log(`🔢 DEBUG Propagation pour période ${i}:`, {
                previousBudget,
                previousActual,
                netFlowBudgetPrev,
                netFlowActualPrev,
                newBudget: initialBudgetBalances[i],
                newActual: initialActualBalances[i]
            });
        }

        return {
            budget: initialBudgetBalances,
            actual: initialActualBalances
        };
    }, [periods, totalInitialBalance, calculateCategoryTotalsByPeriod]);

    // ✅ CORRIGÉ: Fonction pour le solde initial (version avec budget/réel)
    const calculateInitialBalance = React.useCallback((periodIndex, type = 'actual') => {
        if (!calculateAllInitialBalances ||
            !calculateAllInitialBalances.budget ||
            !calculateAllInitialBalances.actual) {
            return periodIndex === 0 ? (totalInitialBalance || 0) : 0;
        }

        return type === 'budget'
            ? calculateAllInitialBalances.budget[periodIndex] || 0
            : calculateAllInitialBalances.actual[periodIndex] || 0;
    }, [calculateAllInitialBalances, totalInitialBalance]);

    // ✅ CORRECTION: Fonction pour calculer le flux net
    const calculateNetFlow = React.useCallback((periodIndex) => {
        const entreesTotals = calculateCategoryTotalsByPeriod('entree', periodIndex);
        const sortiesTotals = calculateCategoryTotalsByPeriod('sortie', periodIndex);

        const netBudget = entreesTotals.periodBudget - sortiesTotals.periodBudget;
        const netActual = entreesTotals.periodActual - sortiesTotals.periodActual;
        const netReste = netBudget - netActual;

        return {
            budget: netBudget,
            actual: netActual,
            reste: netReste
        };
    }, [calculateCategoryTotalsByPeriod]);

    // ✅ CORRIGÉ: Fonction pour le solde final
    const calculateFinalCash = React.useCallback((periodIndex) => {
        const initialBudget = calculateInitialBalance(periodIndex, 'budget');
        const initialActual = calculateInitialBalance(periodIndex, 'actual');
        const netFlow = calculateNetFlow(periodIndex);

        const budgetFinal = initialBudget + netFlow.budget;
        const actualFinal = initialActual + netFlow.actual;
        const reste = netFlow.budget - netFlow.actual; // ou budgetFinal - actualFinal

        return {
            budget: budgetFinal,
            actual: actualFinal,
            reste: reste,
            netFlowBudget: netFlow.budget,
            netFlowActual: netFlow.actual,
            initialBudget: initialBudget,
            initialActual: initialActual
        };
    }, [calculateInitialBalance, calculateNetFlow]);
    // Fonction pour vérifier si une entry doit être affichée selon le focus
    const shouldDisplayEntryByFocus = React.useCallback((entryType) => {
        if (focusType === 'entree') {
            return entryType === 'entree';
        } else if (focusType === 'sortie') {
            return entryType === 'sortie';
        } else {
            return true;
        }
    }, [focusType]);

    // ✅ DEBUG: Ajouter un useEffect pour vérifier la cohérence
    React.useEffect(() => {
        console.log("=== VÉRIFICATION COHÉRENCE TRÉSORERIE ===");

        periods.forEach((period, i) => {
            const initial = calculateInitialBalance(i);
            const netFlow = calculateNetFlow(i);
            const final = calculateFinalCash(i);

            console.log(`Période ${i} (${period.label}):`);
            console.log(`  - Trésorerie début: ${formatCurrency(initial, currencySettings)}`);
            console.log(`  - Flux net: ${formatCurrency(netFlow.actual, currencySettings)}`);
            console.log(`  - Trésorerie fin calculée: ${formatCurrency(final.actual, currencySettings)}`);
            console.log(`  - Vérification: ${initial} + ${netFlow.actual} = ${initial + netFlow.actual}`);
            console.log(`  - Correspond à trésorerie fin: ${(initial + netFlow.actual) === final.actual ? '✅' : '❌'}`);

            // Vérifier la propagation
            if (i > 0) {
                const previousFinal = calculateFinalCash(i - 1);
                console.log(`  - Propagation: trésorerie fin p${i - 1} = ${formatCurrency(previousFinal.actual, currencySettings)}`);
                console.log(`  - Doit être égale à trésorerie début p${i}: ${formatCurrency(initial, currencySettings)}`);
                console.log(`  - Correspondance: ${previousFinal.actual === initial ? '✅' : '❌'}`);
            }
        });
    }, [periods, calculateInitialBalance, calculateNetFlow, calculateFinalCash, formatCurrency, currencySettings]);

    const renderBudgetRows = (type) => {
        const isEntree = type === 'entree';

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
                            {isEntree ? 'Total Entrées' : 'Total Sorties'}
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
                                                        rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`}
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
                                                        rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`}
                                                        columnName={`${period.label} (Réel)`}
                                                    />
                                                </div>
                                            )}
                                            <div className={`relative text-center font-normal ${getResteColor(periodTotals.periodReste, isEntree)}`}>
                                                {formatCurrency(periodTotals.periodReste, currencySettings)}
                                                <CommentButton
                                                    rowId={rowId}
                                                    columnId={`${columnIdBase}_reste`}
                                                    rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`}
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
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                        <ChevronDown className={`w-4 h-4 transition-transform ${isMainCollapsed ? '-rotate-90' : ''}`} />
                                        {mainCategory.name}
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-1 bg-gray-100" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && (
                                    <td className="sticky z-20 px-4 py-1 bg-gray-100" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                                )}
                                <td className="bg-surface"></td>
                                {periods.map((period, periodIndex) => {
                                    const filteredEntries = mainCategory.entries?.filter(entry =>
                                        shouldDisplayForPeriod(
                                            entry.startDate,
                                            period.startDate,
                                            period.endDate,
                                            entry.frequency,
                                            timeView
                                        )
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
                                const hasVisiblePeriods = periods.some(period =>
                                    shouldDisplayForPeriod(
                                        entry.startDate,
                                        period.startDate,
                                        period.endDate,
                                        entry.frequency,
                                        timeView
                                    )
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
                                        shouldDisplayForPeriod={(periodStart, periodEnd) =>
                                            shouldDisplayForPeriod(
                                                entry.startDate,
                                                periodStart,
                                                periodEnd,
                                                entry.frequency,
                                                timeView
                                            )
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
                                                <div className={`text-base mb-1 ${isTodayPeriod ? 'text-blue-700 font-semibold' : isNegativeFlow && !isPast ? 'text-red-700' : 'text-text-primary'}`}>
                                                    {period.label}
                                                    {isTodayPeriod && (
                                                        <span className="ml-1 text-xs font-normal text-blue-500">(Aujourd'hui)</span>
                                                    )}
                                                </div>
                                                {numVisibleCols > 0 && (
                                                    <div className="flex justify-around gap-2 text-xs font-medium text-text-secondary">
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
                            <tr className="bg-gray-200 border-t-2 border-gray-300">
                                <td
                                    className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-200 text-text-primary"
                                    style={{ width: columnWidths.category }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Trésorerie début de période
                                    </div>
                                    <div className="mt-1 text-xs font-normal text-gray-500">
                                        {effectiveCashAccounts.length} compte(s) – Solde initial: {formatCurrency(totalInitialBalance, currencySettings)}
                                    </div>
                                </td>

                                <td
                                    className="sticky z-20 px-4 py-2 bg-gray-200"
                                    style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}
                                ></td>

                                {visibleColumns.description && (
                                    <td
                                        className="sticky z-20 px-4 py-2 bg-gray-200"
                                        style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}
                                    ></td>
                                )}

                                <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>
                                {periods.map((period, periodIndex) => {
                                    const initialBudget = calculateInitialBalance(periodIndex, 'budget');
                                    const initialActual = calculateInitialBalance(periodIndex, 'actual');
                                    const columnIdBase = period.startDate.toISOString();
                                    const rowId = 'initial_cash';

                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-1 py-2" style={periodCellStyle}>
                                                {numVisibleCols > 0 && (
                                                    <div className="grid grid-cols-3 gap-1 text-sm">
                                                        {visibleColumns.budget && (
                                                            <div className={`relative font-bold text-center text-text-primary`}>
                                                                {formatCurrency(initialBudget, currencySettings)}
                                                            </div>
                                                        )}
                                                        {visibleColumns.actual && (
                                                            <div className={`relative font-bold text-center text-text-primary`}>
                                                                {formatCurrency(initialActual, currencySettings)}
                                                            </div>
                                                        )}
                                                        <div className={`relative font-bold text-center ${getResteColor(initialBudget - initialActual, true)}`}>
                                                            {formatCurrency(initialBudget - initialActual, currencySettings)}
                                                        </div>
                                                    </div>
                                                )}
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

                            {/* FLUX DE TRÉSORERIE (NET) */}
                            <tr className="bg-gray-200 border-t-2 border-gray-300">
                                <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-200 text-text-primary" style={{ width: columnWidths.category }}>
                                    <div className="flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Flux de trésorerie
                                    </div>
                                    <div className="mt-1 text-xs font-normal text-gray-500">
                                        Entrées - Sorties
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && (
                                    <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>
                                )}
                                <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>
                                {periods.map((period, periodIndex) => {
                                    const netFlow = calculateNetFlow(periodIndex);
                                    const columnIdBase = period.startDate.toISOString();
                                    const rowId = 'net_flow';

                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-1 py-2" style={periodCellStyle}>
                                                {numVisibleCols > 0 && (
                                                    <div className="grid grid-cols-3 gap-1 text-sm">
                                                        {visibleColumns.budget && (
                                                            <div className={`relative font-bold text-center ${netFlow.budget < 0 ? 'text-red-600' : 'text-text-primary'} group/subcell`}>
                                                                {formatCurrency(netFlow.budget, currencySettings)}
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_budget`}
                                                                    rowName="Flux de trésorerie"
                                                                    columnName={`${period.label} (Prév.)`}
                                                                    tooltip={`Flux net prévisionnel: ${formatCurrency(netFlow.budget, currencySettings)}`}
                                                                />
                                                            </div>
                                                        )}
                                                        {visibleColumns.actual && (
                                                            <div className="relative font-bold text-center text-text-primary group/subcell">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        if (netFlow.actual !== 0) {
                                                                            handleActualClick({ type: 'net', period, source: 'globalTotal' });
                                                                        }
                                                                    }}
                                                                    disabled={netFlow.actual === 0}
                                                                    className="hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {formatCurrency(netFlow.actual, currencySettings)}
                                                                </button>
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_actual`}
                                                                    rowName="Flux de trésorerie"
                                                                    columnName={`${period.label} (Réel)`}
                                                                    tooltip={`Flux net réel: ${formatCurrency(netFlow.actual, currencySettings)}`}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className={`relative font-bold text-center ${getResteColor(netFlow.reste, true)}`}>
                                                            {formatCurrency(netFlow.reste, currencySettings)}
                                                            <CommentButton
                                                                rowId={rowId}
                                                                columnId={`${columnIdBase}_reste`}
                                                                rowName="Flux de trésorerie"
                                                                columnName={`${period.label} (Reste)`}
                                                                tooltip={`Différence prévu/réel: ${formatCurrency(netFlow.reste, currencySettings)}`}
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

                            {/* TRÉSORERIE FIN DE PÉRIODE - CORRECTEMENT PROPAGÉE */}
                            <tr className="bg-gray-300 border-t-2 border-gray-400">
                                <td
                                    className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-300 text-text-primary"
                                    style={{ width: columnWidths.category }}
                                >
                                    <div className="flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Trésorerie fin de période
                                    </div>
                                    <div className="mt-1 text-xs font-normal text-gray-600">
                                        Solde initial + Flux net
                                    </div>
                                </td>

                                <td
                                    className="sticky z-20 px-4 py-2 bg-gray-300"
                                    style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}
                                ></td>

                                {visibleColumns.description && (
                                    <td
                                        className="sticky z-20 px-4 py-2 bg-gray-300"
                                        style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}
                                    ></td>
                                )}

                                <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>

                                {periods.map((period, periodIndex) => {
                                    const finalCash = calculateFinalCash(periodIndex);
                                    const columnIdBase = period.startDate.toISOString();
                                    const rowId = 'final_cash';

                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-1 py-2" style={periodCellStyle}>
                                                {numVisibleCols > 0 && (
                                                    <div className="grid grid-cols-3 gap-1 text-sm">
                                                        {visibleColumns.budget && (
                                                            <div className={`relative font-bold text-center ${finalCash.budget < 0 ? 'text-red-700' : 'text-text-primary'}`}>
                                                                {formatCurrency(finalCash.budget, currencySettings)}
                                                            </div>
                                                        )}
                                                        {visibleColumns.actual && (
                                                            <div className={`relative font-bold text-center ${finalCash.actual < 0 ? 'text-red-700' : 'text-text-primary'}`}>
                                                                {formatCurrency(finalCash.actual, currencySettings)}
                                                            </div>
                                                        )}
                                                        {/* REMA: Reste = différence entre budget sy réel */}
                                                        <div className={`relative font-bold text-center ${getResteColor(finalCash.reste, true)}`}>
                                                            {formatCurrency(finalCash.reste, currencySettings)}
                                                        </div>
                                                    </div>
                                                )}
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