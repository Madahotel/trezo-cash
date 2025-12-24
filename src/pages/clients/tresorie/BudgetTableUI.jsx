import React from 'react';
import ResizableTh from './ResizableTh.jsx';
import CommentButton from './CommentButton.jsx';
import BudgetTableRow from './BudgetTableRow.jsx';
import {
    Edit,
    Search,
    ChevronDown,
    TrendingUp,
    TrendingDown,
    XCircle,
    Trash2,
    ArrowRightLeft,
    Lock,
    ChevronUp
} from 'lucide-react';

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

        if (effectiveStartDate > periodEndDate) return false;

        let frequencyId;
        let frequencyName;
        let entryEndDate;

        if (typeof entryFrequency === 'object') {
            frequencyId = entryFrequency.id ? entryFrequency.id.toString() :
                entryFrequency.frequency_id ? entryFrequency.frequency_id.toString() : null;
            frequencyName = entryFrequency.frequency_name || entryFrequency.frequency || '';
            entryEndDate = entryFrequency.endDate ? new Date(entryFrequency.endDate) :
                (entryFrequency.end_date ? new Date(entryFrequency.end_date) : null);
        } else {
            frequencyId = entryFrequency ? entryFrequency.toString() : null;
            frequencyName = typeof entryFrequency === 'string' ? entryFrequency : '';
            entryEndDate = null;
        }

        const isOneTime = frequencyId === "1" ||
            frequencyName === "Ponctuel" ||
            frequencyName === "ponctuel" ||
            frequencyName === "Ponctuelle" ||
            frequencyName === "ponctuelle";

        if (isOneTime) {
            return effectiveStartDate >= periodStartDate && effectiveStartDate <= periodEndDate;
        }

        const isMonthly = frequencyId === "3" ||
            frequencyName === "Mensuel" ||
            frequencyName === "mensuel" ||
            frequencyName === "Monsuel" ||
            frequencyName === "monsuel";

        if (isMonthly) {
            if (entryEndDate && entryEndDate < periodStartDate) return false;
            if (effectiveStartDate > periodEndDate) return false;

            const paymentDay = effectiveStartDate.getDate();
            const paymentMonth = effectiveStartDate.getMonth();
            const paymentYear = effectiveStartDate.getFullYear();
            const periodStartMonth = periodStartDate.getMonth();
            const periodEndMonth = periodEndDate.getMonth();
            const periodStartYear = periodStartDate.getFullYear();
            const periodEndYear = periodEndDate.getFullYear();

            if (timeView === 'bimester') {
                let currentMonth = paymentMonth;
                let currentYear = paymentYear;

                while (currentYear < periodStartYear ||
                    (currentYear === periodStartYear && currentMonth < periodStartMonth)) {
                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                }

                while (currentYear < periodEndYear ||
                    (currentYear === periodEndYear && currentMonth <= periodEndMonth)) {

                    if ((currentYear > periodStartYear || (currentYear === periodStartYear && currentMonth >= periodStartMonth)) &&
                        (currentYear < periodEndYear || (currentYear === periodEndYear && currentMonth <= periodEndMonth))) {

                        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        if (paymentDay <= lastDayOfMonth) {
                            const paymentDate = new Date(currentYear, currentMonth, Math.min(paymentDay, lastDayOfMonth));
                            if (paymentDate >= periodStartDate && paymentDate <= periodEndDate) {
                                return true;
                            }
                        }
                    }

                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                }

                return false;
            }

            if (timeView === 'trimester') {
                const periodStartDay = periodStartDate.getDate();
                const periodEndDay = periodEndDate.getDate();

                const isFirstHalf = periodStartDay >= 1 && periodStartDay <= 15;
                const isSecondHalf = periodStartDay >= 16;

                let currentMonth = paymentMonth;
                let currentYear = paymentYear;
                let currentDate = new Date(paymentYear, paymentMonth, paymentDay);

                if (currentDate < periodStartDate) {
                    const periodYear = periodStartDate.getFullYear();
                    const periodMonth = periodStartDate.getMonth();

                    const monthsDiff = (periodYear - paymentYear) * 12 + (periodMonth - paymentMonth);

                    if (monthsDiff >= 0) {
                        currentYear = periodYear;
                        currentMonth = periodMonth;

                        const lastDayOfPeriodMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        const adjustedPaymentDay = Math.min(paymentDay, lastDayOfPeriodMonth);
                        currentDate = new Date(currentYear, currentMonth, adjustedPaymentDay);

                        if (currentDate < periodStartDate) {
                            currentMonth++;
                            if (currentMonth > 11) {
                                currentMonth = 0;
                                currentYear++;
                            }
                            const nextMonthLastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
                            const nextMonthPaymentDay = Math.min(paymentDay, nextMonthLastDay);
                            currentDate = new Date(currentYear, currentMonth, nextMonthPaymentDay);
                        }
                    }
                }

                while (currentDate <= periodEndDate) {
                    if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                        const currentDay = currentDate.getDate();
                        const currentMonth = currentDate.getMonth();
                        const periodMonth = periodStartDate.getMonth();

                        if (currentMonth === periodMonth) {
                            if (isFirstHalf) {
                                if (currentDay >= 1 && currentDay <= 15) {
                                    return true;
                                }
                            } else if (isSecondHalf) {
                                const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                                if (currentDay >= 16 && currentDay <= lastDayOfMonth) {
                                    return true;
                                }
                            }
                        }
                    }

                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }

                    const lastDayOfNextMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                    const nextPaymentDay = Math.min(paymentDay, lastDayOfNextMonth);
                    currentDate = new Date(currentYear, currentMonth, nextPaymentDay);
                }

                return false;
            }

            if (timeView === 'semester') {
                let currentMonth = paymentMonth;
                let currentYear = paymentYear;

                while (currentYear < periodStartYear ||
                    (currentYear === periodStartYear && currentMonth < periodStartMonth)) {
                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                }

                while (currentYear < periodEndYear ||
                    (currentYear === periodEndYear && currentMonth <= periodEndMonth)) {

                    if ((currentYear > periodStartYear || (currentYear === periodStartYear && currentMonth >= periodStartMonth)) &&
                        (currentYear < periodEndYear || (currentYear === periodEndYear && currentMonth <= periodEndMonth))) {

                        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        if (paymentDay <= lastDayOfMonth) {
                            const paymentDate = new Date(currentYear, currentMonth, Math.min(paymentDay, lastDayOfMonth));
                            if (paymentDate >= periodStartDate && paymentDate <= periodEndDate) {
                                return true;
                            }
                        }
                    }

                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                }

                return false;
            }

            if (['year', 'year3', 'year5', 'year7'].includes(timeView)) {
                let currentMonth = paymentMonth;
                let currentYear = paymentYear;

                while (currentYear < periodStartYear ||
                    (currentYear === periodStartYear && currentMonth < periodStartMonth)) {
                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                }

                while (currentYear < periodEndYear ||
                    (currentYear === periodEndYear && currentMonth <= periodEndMonth)) {

                    if (currentYear >= periodStartYear && currentYear <= periodEndYear) {
                        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        if (paymentDay <= lastDayOfMonth) {
                            const paymentDate = new Date(currentYear, currentMonth, Math.min(paymentDay, lastDayOfMonth));
                            if (paymentDate >= periodStartDate && paymentDate <= periodEndDate) {
                                return true;
                            }
                        }
                    }

                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                }

                return false;
            }

            const isPaymentDateInPeriod = (checkDate) => {
                return checkDate >= effectiveStartDate &&
                    checkDate >= periodStartDate &&
                    checkDate <= periodEndDate;
            };

            let currentYear = periodStartYear;
            let currentMonth = periodStartMonth;

            while (currentYear < periodEndYear ||
                (currentYear === periodEndYear && currentMonth <= periodEndMonth)) {

                const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                const actualPaymentDay = Math.min(paymentDay, lastDayOfMonth);
                const paymentDateThisMonth = new Date(currentYear, currentMonth, actualPaymentDay);
                paymentDateThisMonth.setHours(0, 0, 0, 0);

                if (isPaymentDateInPeriod(paymentDateThisMonth)) {
                    return true;
                }

                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
            }

            return false;
        }

        if (frequencyId === "4" || frequencyName === "Hebdomadaire" || frequencyName === "hebdomadaire") {
            if (effectiveStartDate <= periodEndDate) {
                if (timeView === 'bimester' || timeView === 'semester' || timeView === 'trimester' ||
                    timeView === 'year' || timeView === 'year3' || timeView === 'year5' || timeView === 'year7') {
                    let currentWeek = new Date(effectiveStartDate);
                    while (currentWeek <= periodEndDate) {
                        if (currentWeek >= periodStartDate && currentWeek <= periodEndDate) {
                            return true;
                        }
                        currentWeek.setDate(currentWeek.getDate() + 7);
                    }
                } else {
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

        if (frequencyId === "5" || frequencyName === "Bimensuel" || frequencyName === "bimensuel") {
            if (effectiveStartDate <= periodEndDate) {
                const paymentDay = effectiveStartDate.getDate();
                let currentDate = new Date(effectiveStartDate);
                while (currentDate <= periodEndDate) {
                    if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                        if (currentDate.getDate() === paymentDay) {
                            return true;
                        }
                    }
                    currentDate.setMonth(currentDate.getMonth() + 2);
                    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    const actualDay = Math.min(paymentDay, lastDayOfMonth);
                    currentDate.setDate(actualDay);
                }
            }
            return false;
        }

        if (frequencyId === "6" || frequencyName === "Trimestriel" || frequencyName === "trimestriel") {
            if (effectiveStartDate <= periodEndDate) {
                const paymentDay = effectiveStartDate.getDate();
                let currentDate = new Date(effectiveStartDate);
                while (currentDate <= periodEndDate) {
                    if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                        if (currentDate.getDate() === paymentDay) {
                            return true;
                        }
                    }
                    currentDate.setMonth(currentDate.getMonth() + 3);
                    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    const actualDay = Math.min(paymentDay, lastDayOfMonth);
                    currentDate.setDate(actualDay);
                }
            }
            return false;
        }

        if (frequencyId === "7" || frequencyName === "Semestriel" || frequencyName === "semestriel") {
            if (effectiveStartDate <= periodEndDate) {
                const paymentDay = effectiveStartDate.getDate();
                const paymentMonth = effectiveStartDate.getMonth();
                let currentDate = new Date(effectiveStartDate);
                while (currentDate <= periodEndDate) {
                    if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                        if (currentDate.getDate() === paymentDay &&
                            (currentDate.getMonth() === paymentMonth ||
                                currentDate.getMonth() === (paymentMonth + 6) % 12)) {
                            return true;
                        }
                    }
                    currentDate.setMonth(currentDate.getMonth() + 6);
                    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    const actualDay = Math.min(paymentDay, lastDayOfMonth);
                    currentDate.setDate(actualDay);
                }
            }
            return false;
        }

        if (frequencyId === "8" || frequencyName === "Annuel" || frequencyName === "annuel") {
            if (effectiveStartDate <= periodEndDate) {
                const paymentDay = effectiveStartDate.getDate();
                const paymentMonth = effectiveStartDate.getMonth();
                let currentDate = new Date(effectiveStartDate);
                while (currentDate <= periodEndDate) {
                    if (currentDate >= periodStartDate && currentDate <= periodEndDate) {
                        if (currentDate.getMonth() === paymentMonth && currentDate.getDate() === paymentDay) {
                            return true;
                        }
                    }
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    const lastDayOfMonth = new Date(currentDate.getFullYear(), paymentMonth + 1, 0).getDate();
                    const actualDay = Math.min(paymentDay, lastDayOfMonth);
                    currentDate.setMonth(paymentMonth);
                    currentDate.setDate(actualDay);
                }
            }
            return false;
        }
        return effectiveStartDate <= periodEndDate;
    }, [projectStartDate, timeView]);

    const totalInitialBalance = React.useMemo(() => {
        if (!effectiveCashAccounts || effectiveCashAccounts.length === 0) {
            return 0;
        }

        const total = effectiveCashAccounts.reduce((sum, account) => {
            const initialAmount = parseFloat(account.initial_amount || account.initialBalance || 0);
            if (initialAmount === 10000) {
                if (account.is_configured === false || account.has_initial_balance === false) {
                    return sum;
                }
            }

            return sum + (isNaN(initialAmount) ? 0 : initialAmount);
        }, 0);

        if (isNaN(total)) {
            return 0;
        }
        if (total === 10000 && effectiveCashAccounts.every(acc => !acc.is_active || !acc.is_configured)) {
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

    const allNetFlows = React.useMemo(() => {
        if (!periods || periods.length === 0) return [];

        return periods.map((_, periodIndex) => {
            const entreesTotals = calculateCategoryTotalsByPeriod('entree', periodIndex);
            const sortiesTotals = calculateCategoryTotalsByPeriod('sortie', periodIndex);

            return {
                budget: entreesTotals.periodBudget - sortiesTotals.periodBudget,
                actual: entreesTotals.periodActual - sortiesTotals.periodActual,
                reste: (entreesTotals.periodBudget - sortiesTotals.periodBudget) - (entreesTotals.periodActual - sortiesTotals.periodActual)
            };
        });
    }, [periods, calculateCategoryTotalsByPeriod]);

    const allInitialBalances = React.useMemo(() => {
        if (!periods || periods.length === 0) {
            return { budget: [], actual: [] };
        }

        const initialBudgetBalances = new Array(periods.length).fill(0);
        const initialActualBalances = new Array(periods.length).fill(0);

        initialBudgetBalances[0] = totalInitialBalance || 0;
        initialActualBalances[0] = totalInitialBalance || 0;

        for (let i = 1; i < periods.length; i++) {
            const previousBudget = initialBudgetBalances[i - 1];
            const previousActual = initialActualBalances[i - 1];

            const netFlowBudgetPrev = allNetFlows[i - 1]?.budget || 0;
            const netFlowActualPrev = allNetFlows[i - 1]?.actual || 0;

            initialBudgetBalances[i] = previousBudget + netFlowBudgetPrev;
            initialActualBalances[i] = previousActual + netFlowActualPrev;
        }

        return {
            budget: initialBudgetBalances,
            actual: initialActualBalances
        };
    }, [periods, totalInitialBalance, allNetFlows]);

    const calculateInitialBalance = React.useCallback((periodIndex, type = 'actual') => {
        if (!allInitialBalances ||
            !allInitialBalances.budget ||
            !allInitialBalances.actual) {
            return periodIndex === 0 ? (totalInitialBalance || 0) : 0;
        }

        return type === 'budget'
            ? allInitialBalances.budget[periodIndex] || 0
            : allInitialBalances.actual[periodIndex] || 0;
    }, [allInitialBalances, totalInitialBalance]);

    const calculateNetFlow = React.useCallback((periodIndex) => {
        return allNetFlows[periodIndex] || { budget: 0, actual: 0, reste: 0 };
    }, [allNetFlows]);

    const calculateFinalCash = React.useCallback((periodIndex) => {
        const initialBudget = calculateInitialBalance(periodIndex, 'budget');
        const initialActual = calculateInitialBalance(periodIndex, 'actual');
        const netFlow = calculateNetFlow(periodIndex);

        const budgetFinal = initialBudget + netFlow.budget;
        const actualFinal = initialActual + netFlow.actual;
        const reste = netFlow.budget - netFlow.actual;

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

    React.useEffect(() => {
        if (periods.length === 0) return;

        console.log("=== VÉRIFICATION COHÉRENCE TRÉSORERIE ===");

        periods.forEach((period, i) => {
            const initial = calculateInitialBalance(i);
            const netFlow = calculateNetFlow(i);
            const final = calculateFinalCash(i);

            console.log(`Période ${i} (${period.label}):`);
            console.log(`  - Trésorerie début: ${formatCurrency(initial, currencySettings)}`);
            console.log(`  - Flux net: ${formatCurrency(netFlow.actual, currencySettings)}`);
            console.log(`  - Trésorerie fin: ${formatCurrency(final.actual, currencySettings)}`);
            console.log(`  - Calcul: ${initial} + ${netFlow.actual} = ${initial + netFlow.actual}`);

            if (i > 0) {
                const previousFinal = calculateFinalCash(i - 1);
                const currentInitial = calculateInitialBalance(i);
            }
        });
    }, [periods, calculateInitialBalance, calculateNetFlow, calculateFinalCash, formatCurrency, currencySettings]);

    const shouldDisplayEntryByFocus = React.useCallback((entryType) => {
        if (focusType === 'entree') {
            return entryType === 'entree';
        } else if (focusType === 'sortie') {
            return entryType === 'sortie';
        } else {
            return true;
        }
    }, [focusType]);

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
                <tr className="bg-gray-200 border-gray-300 cursor-pointer border-y-2" onClick={toggleMainCollapse}>
                    <td className="sticky left-0 z-20 px-4 py-1 bg-gray-200 text-text-primary" style={{ width: columnWidths.category }}>
                        <div className="flex items-center gap-2 font-bold">
                            <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />

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

                {!isCollapsed && mainCategories.length > 0 && mainCategories.map((mainCategory) => {
                    const isMainCollapsed = collapsedItems[mainCategory.id];

                    return (
                        <React.Fragment key={mainCategory.id}>
                            <tr onClick={() => toggleCollapse(mainCategory.id)} className="text-gray-700 bg-gray-100 cursor-pointer hover:bg-gray-200">
                                <td className="sticky left-0 z-20 px-4 py-1 bg-gray-100" style={{
                                    width: columnWidths.category,
                                    paddingLeft: mainCategory.entries?.some(e => e.sub_category_id) ? '30px' : '16px'
                                    // ^^ Raha misy entry misy sub_category_id, dia ampitombo ny padding
                                }}>
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
                                const indentLevel = entry.sub_category_id ? 1 : 0;

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
                                        indentLevel={indentLevel}
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
                                                            <div className={`relative font-bold text-center text-text-primary group`}>
                                                                {formatCurrency(initialBudget, currencySettings)}
                                                                <div className="absolute z-50 hidden p-2 text-xs transform -translate-x-1/2 bg-white border rounded shadow-lg group-hover:block bottom-full left-1/2 whitespace-nowrap">
                                                                    Budget {periodIndex === 0 ? '(Solde initial)' : '(Propagation de la période précédente)'}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {visibleColumns.actual && (
                                                            <div className={`relative font-bold text-center text-text-primary group`}>
                                                                {formatCurrency(initialActual, currencySettings)}
                                                                <div className="absolute z-50 hidden p-2 text-xs transform -translate-x-1/2 bg-white border rounded shadow-lg group-hover:block bottom-full left-1/2 whitespace-nowrap">
                                                                    Réel {periodIndex === 0 ? '(Solde initial)' : '(Propagation de la période précédente)'}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className={`relative font-bold text-center ${getResteColor(initialBudget - initialActual, true)} group`}>
                                                            {formatCurrency(initialBudget - initialActual, currencySettings)}
                                                            <div className="absolute z-50 hidden p-2 text-xs transform -translate-x-1/2 bg-white border rounded shadow-lg group-hover:block bottom-full left-1/2 whitespace-nowrap">
                                                                Différence budget/réel
                                                            </div>
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

                            {renderBudgetRows('entree')}

                            <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>

                            {renderBudgetRows('sortie')}

                            <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>

                            {/* FLUX DE TRÉSORERIE (NET) */}
                            <tr className="bg-gray-200 border-t-2 border-gray-300">
                                <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-200 text-text-primary" style={{ width: columnWidths.category }}>
                                    <div className="flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Flux de trésorerie
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

                            {/* TRÉSORERIE FIN DE PÉRIODE */}
                            <tr className="bg-gray-300 border-t-2 border-gray-400">
                                <td
                                    className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-300 text-text-primary"
                                    style={{ width: columnWidths.category }}
                                >
                                    <div className="flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Trésorerie fin de période
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
                                                            <div className={`relative font-bold text-center ${finalCash.budget < 0 ? 'text-red-700' : 'text-text-primary'} group`}>
                                                                {formatCurrency(finalCash.budget, currencySettings)}
                                                                <div className="absolute z-50 hidden p-2 text-xs transform -translate-x-1/2 bg-white border rounded shadow-lg group-hover:block bottom-full left-1/2 whitespace-nowrap">
                                                                    = {formatCurrency(finalCash.initialBudget, currencySettings)} (début)
                                                                    + {formatCurrency(finalCash.netFlowBudget, currencySettings)} (flux net)
                                                                </div>
                                                            </div>
                                                        )}
                                                        {visibleColumns.actual && (
                                                            <div className={`relative font-bold text-center ${finalCash.actual < 0 ? 'text-red-700' : 'text-text-primary'} group`}>
                                                                {formatCurrency(finalCash.actual, currencySettings)}
                                                                <div className="absolute z-50 hidden p-2 text-xs transform -translate-x-1/2 bg-white border rounded shadow-lg group-hover:block bottom-full left-1/2 whitespace-nowrap">
                                                                    = {formatCurrency(finalCash.initialActual, currencySettings)} (début)
                                                                    + {formatCurrency(finalCash.netFlowActual, currencySettings)} (flux net)
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className={`relative font-bold text-center ${getResteColor(finalCash.reste, true)} group`}>
                                                            {formatCurrency(finalCash.reste, currencySettings)}
                                                            <div className="absolute z-50 hidden p-2 text-xs transform -translate-x-1/2 bg-white border rounded shadow-lg group-hover:block bottom-full left-1/2 whitespace-nowrap">
                                                                Différence entre budget et réel
                                                            </div>
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