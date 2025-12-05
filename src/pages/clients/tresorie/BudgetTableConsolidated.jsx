import React, {
    useState,
    useMemo,
    useEffect,
    useRef,
    useCallback,
} from 'react';
import {
    Search,
    ChevronDown,
    Folder,
    TrendingUp,
    TrendingDown,
    XCircle,
    ArrowRightLeft,
    Lock,
    ChevronUp,
} from 'lucide-react';
import TransactionDetailDrawer from './TransactionDetailDrawer.jsx';
import ResizableTh from './ResizableTh.jsx';
import {
    getStartOfWeek,
    calculateEntryAmountForPeriod,
    calculateActualAmountForPeriod,
    getEntryDescription,
} from '../../../utils/budgetCalculations.js';
import { getTodayInTimezone } from '../../../utils/getTodayInTimezone.js';
import { calculateGeneralTotals } from '../../../hooks/calculateGeneralTotals.jsx';
import { useProcessedEntries } from '../../../hooks/useProcessedEntries.jsx';
import { useGroupedData } from '../../../hooks/useGroupedData.jsx';
import { calculateMainCategoryTotals } from '../../../hooks/calculateMainCategoryTotals.jsx';
import { formatCurrency } from '../../../utils/formatting.js';
import CommentButton from './CommentButton.jsx';
import { useData } from '../../../components/context/DataContext.jsx';
import BudgetTableHeader from './BudgetTableHeader.jsx';

// Configuration et fonctions utilitaires
const criticalityConfig = {
    critical: { label: 'Critique', color: 'bg-red-500' },
    essential: { label: 'Essentiel', color: 'bg-yellow-500' },
    discretionary: { label: 'Discrétionnaire', color: 'bg-blue-500' },
};

// Composant pour vues consolidées
const BudgetTableConsolidated = (props) => {
    const {
        finalCashAccounts,
        finalBudgetEntries,
        finalActualTransactions,
        finalCategories,
        vatRegimes,
        taxConfigs,
        activeProjectId,
        isConsolidated,
        isCustomConsolidated,
        projects,
        settings,
        activeProject,
        timeUnit,
        horizonLength,
        periodOffset,
        activeQuickSelect,
        visibleColumns = {
            description: true,
            project: true,
            budget: true,
            actual: true
        },
        tableauMode,
        setTableauMode,
        showTemporalToolbar,
        showViewModeSwitcher,
        showNewEntryButton,
        quickFilter,
        dataState,
        dataDispatch,
        uiDispatch,
        periodMenuRef,
        isPeriodMenuOpen,
        setIsPeriodMenuOpen,
        onRefresh,
        consolidatedData,
    } = props;

    const [isRefreshing, setIsRefreshing] = useState(false);
    const { dataState: contextDataState } = useData();
    const [subCategoryMenuOpen, setSubCategoryMenuOpen] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasNoData, setHasNoData] = useState(false);

    const [collectionData, setCollectionData] = useState({});
    const [loadingCollections, setLoadingCollections] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [drawerData, setDrawerData] = useState({
        isOpen: false,
        transactions: [],
        title: '',
    });
    const [collapsedItems, setCollapsedItems] = useState({});
    const [isEntreesCollapsed, setIsEntreesCollapsed] = useState(false);
    const [isSortiesCollapsed, setIsSortiesCollapsed] = useState(false);
    const [columnWidths, setColumnWidths] = useState(() => {
        try {
            const savedWidths = localStorage.getItem('budgetAppColumnWidths');
            if (savedWidths) return JSON.parse(savedWidths);
        } catch (error) {
            console.error('Failed to parse column widths from localStorage', error);
        }
        return { category: 192, supplier: 160, description: 200, project: 192 };
    });
    const [isTierSearchOpen, setIsTierSearchOpen] = useState(false);
    const [isProjectSearchOpen, setIsProjectSearchOpen] = useState(false);

    const [frequencyFilter, setFrequencyFilter] = useState('all');
    const [isFrequencyFilterOpen, setIsFrequencyFilterOpen] = useState(false);
    const frequencyFilterRef = useRef(null);

    const topScrollRef = useRef(null);
    const mainScrollRef = useRef(null);
    const tierSearchRef = useRef(null);
    const projectSearchRef = useRef(null);

    const today = getTodayInTimezone(settings.timezoneOffset);
    const currencySettings = useMemo(
        () => ({
            currency: activeProject?.currency || 'EUR',
            displayUnit: activeProject?.display_unit || 'euro',
            decimalPlaces: activeProject?.decimal_places || 2,
        }),
        [activeProject]
    );

    const frequencyOptions = [
        { id: 'all', label: 'Toutes les fréquences' },
        { id: '1', label: 'Ponctuel' },
        { id: '2', label: 'Journalier' },
        { id: '3', label: 'Mensuel' },
        { id: '4', label: 'Trimestriel' },
        { id: '5', label: 'Annuel' },
        { id: '6', label: 'Hebdomadaire' },
        { id: '7', label: 'Bimestriel' },
        { id: '8', label: 'Semestriel' },
        { id: '9', label: 'Paiement irrégulier' },
    ];

    const closeAllMenus = () => {
        setSubCategoryMenuOpen(null);
    };

    // Transformation des données consolidées
    const consolidatedEntries = useMemo(() => {

        if (!consolidatedData?.budgetsByProject) {
            return [];
        }

        const entries = consolidatedData.budgetsByProject.flatMap(project => {
            console.log('📋 Processing project:', {
                projectId: project.projectId,
                projectName: project.projectName,
                budgetsCount: project.budgets?.length || 0
            });

            return project.budgets.map(budget => {
                console.log('📝 Processing budget:', {
                    budgetId: budget.id,
                    budgetAmount: budget.budgetAmount,
                    realAmount: budget.realAmount,
                    reste: budget.reste
                });

                return {
                    id: budget.id,
                    budget_id: budget.id,
                    // ⭐ IMPORTANT: Gardez l'ID original si disponible
                    original_budget_id: budget.originalBudgetId || budget.id,
                    category: budget.category,
                    subCategory: budget.subCategory,
                    supplier: budget.thirdParty || 'Non spécifié',
                    description: budget.description || '',
                    projectId: project.projectId,
                    projectName: project.projectName,
                    type: budget.typeId === 2 ? 'entree' : 'sortie',
                    budget_type_id: budget.typeId,
                    budget_type_name: budget.type,
                    frequency_name: budget.frequency || 'Ponctuel',
                    frequency_id: getFrequencyId(budget.frequency),
                    budgetAmount: budget.budgetAmount || 0,
                    // ⭐ ICI: Si budget a déjà un realAmount, on l'utilise
                    realAmount: budget.realAmount || 0,
                    reste: budget.reste || 0,
                    currency: budget.currency || 'EUR',
                    budget_start_date: budget.startDate,
                    budget_end_date: budget.endDate,
                    hasAmount: budget.hasAmount,
                    amount: budget.budgetAmount,
                    start_date: budget.startDate,
                    end_date: budget.endDate,
                    frequency: budget.frequency,
                    isProvision: false,
                    is_vat_child: false,
                    is_vat_payment: false,
                    is_tax_payment: false,
                    isOffBudget: false
                };
            });
        });

        console.log('✅ consolidatedEntries built:', {
            totalEntries: entries.length,
            sampleEntry: entries[0]
        });

        return entries;
    }, [consolidatedData]);

    // Fonction utilitaire pour convertir le nom de fréquence en ID
    const getFrequencyId = (frequencyName) => {
        const frequencyMap = {
            'Ponctuel': '1',
            'Journalier': '2',
            'Mensuel': '3',
            'Trimestriel': '4',
            'Annuel': '5',
            'Hebdomadaire': '6',
            'Bimestriel': '7',
            'Semestriel': '8',
            'Paiement irrégulier': '9'
        };
        return frequencyMap[frequencyName] || '1';
    };

    const processedBudgetEntries = useMemo(() => {
        if ((isConsolidated || isCustomConsolidated) && consolidatedEntries.length > 0) {
            return consolidatedEntries;
        }
        return finalBudgetEntries || [];
    }, [consolidatedEntries, finalBudgetEntries, isConsolidated, isCustomConsolidated]);

    const calculateConsolidatedActualAmount = useCallback((entry, period) => {
        console.log('🔍 DEBUG calculateConsolidatedActualAmount:', {
            entryId: entry.id,
            entryBudgetId: entry.budget_id,
            entryType: entry.type,
            period: period.label,
            hasConsolidatedData: !!consolidatedData,
            consolidatedDataKeys: consolidatedData ? Object.keys(consolidatedData) : []
        });

        // 1. Si l'entrée a déjà un montant réel (depuis consolidatedData)
        if (entry.realAmount !== undefined && entry.realAmount !== null) {
            console.log('✅ Using entry.realAmount:', entry.realAmount);
            return entry.realAmount;
        }

        // 2. Si consolidatedData existe, chercher dedans
        if (consolidatedData) {
            console.log('📊 consolidatedData structure:', {
                real_budgets: consolidatedData.real_budgets,
                actualsByProject: consolidatedData.actualsByProject,
                budgetsByProject: consolidatedData.budgetsByProject
            });

            // Chercher dans real_budgets
            if (consolidatedData.real_budgets?.real_budget_items?.data) {
                const realBudgetItems = consolidatedData.real_budgets.real_budget_items.data;
                console.log('🔎 Searching in real_budgets:', realBudgetItems);

                let total = 0;
                realBudgetItems.forEach(item => {
                    console.log('📋 Checking item:', {
                        itemBudgetId: item.budget_id,
                        entryBudgetId: entry.budget_id,
                        matches: item.budget_id === entry.budget_id,
                        collectionDate: item.collection_date,
                        period: period.label
                    });

                    // Essayez plusieurs façons de matcher
                    const matches =
                        item.budget_id === entry.budget_id ||
                        item.budget_id === parseInt(entry.id) ||
                        (entry.original_budget_id && item.budget_id === entry.original_budget_id);

                    if (matches && item.collection_date) {
                        const collectionDate = new Date(item.collection_date);
                        if (collectionDate >= period.startDate &&
                            collectionDate < period.endDate) {
                            const amount = parseFloat(item.collection_amount || 0);
                            total += amount;
                            console.log('✅ Match found! Adding:', amount, 'Total:', total);
                        }
                    }
                });

                if (total > 0) {
                    console.log('💰 Total from real_budgets:', total);
                    return total;
                }
            }

            // Chercher dans actualsByProject
            if (consolidatedData.actualsByProject) {
                console.log('🔍 Searching in actualsByProject');
                for (const projectData of consolidatedData.actualsByProject) {
                    if (projectData.actuals) {
                        for (const actual of projectData.actuals) {
                            if (actual.budgetId === entry.budget_id ||
                                actual.budgetId === entry.id) {
                                let total = 0;
                                const payments = actual.payments || [];
                                for (const payment of payments) {
                                    if (payment.paymentDate) {
                                        const paymentDate = new Date(payment.paymentDate);
                                        if (paymentDate >= period.startDate &&
                                            paymentDate < period.endDate) {
                                            total += parseFloat(payment.paidAmount || 0);
                                        }
                                    }
                                }
                                if (total > 0) {
                                    console.log('💰 Total from actualsByProject:', total);
                                    return total;
                                }
                            }
                        }
                    }
                }
            }
        } else {
            console.log('⚠️ consolidatedData is undefined/null');
        }

        // 3. Fallback: utiliser les transactions réelles standard
        console.log('🔄 Falling back to calculateActualAmountForPeriod');
        const fallbackResult = calculateActualAmountForPeriod(
            entry,
            finalActualTransactions || [],
            period.startDate,
            period.endDate,
            null
        );

        console.log('🔚 Fallback result:', fallbackResult);
        return fallbackResult;
    }, [consolidatedData, finalActualTransactions]);


    const periods = useMemo(() => {
        const today = getTodayInTimezone(settings.timezoneOffset);
        let baseDate;
        switch (timeUnit) {
            case 'day':
                baseDate = new Date(today);
                baseDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                baseDate = getStartOfWeek(today);
                break;
            case 'fortnightly':
                const day = today.getDate();
                baseDate = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    day <= 15 ? 1 : 16
                );
                break;
            case 'month':
                baseDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'bimonthly':
                const bimonthStartMonth = Math.floor(today.getMonth() / 2) * 2;
                baseDate = new Date(today.getFullYear(), bimonthStartMonth, 1);
                break;
            case 'quarterly':
                const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
                baseDate = new Date(today.getFullYear(), quarterStartMonth, 1);
                break;
            case 'semiannually':
                const semiAnnualStartMonth = Math.floor(today.getMonth() / 6) * 6;
                baseDate = new Date(today.getFullYear(), semiAnnualStartMonth, 1);
                break;
            case 'annually':
                baseDate = new Date(today.getFullYear(), 0, 1);
                break;
            default:
                baseDate = getStartOfWeek(today);
        }

        const periodList = [];
        for (let i = 0; i < horizonLength; i++) {
            const periodIndex = i + periodOffset;
            const periodStart = new Date(baseDate);
            switch (timeUnit) {
                case 'day':
                    periodStart.setDate(periodStart.getDate() + periodIndex);
                    break;
                case 'week':
                    periodStart.setDate(periodStart.getDate() + periodIndex * 7);
                    break;
                case 'fortnightly': {
                    const d = new Date(baseDate);
                    let numFortnights = periodIndex;
                    let currentMonth = d.getMonth();
                    let isFirstHalf = d.getDate() === 1;
                    const monthsToAdd = Math.floor(
                        ((isFirstHalf ? 0 : 1) + numFortnights) / 2
                    );
                    d.setMonth(currentMonth + monthsToAdd);
                    const newIsFirstHalf =
                        ((((isFirstHalf ? 0 : 1) + numFortnights) % 2) + 2) % 2 === 0;
                    d.setDate(newIsFirstHalf ? 1 : 16);
                    periodStart.setTime(d.getTime());
                    break;
                }
                case 'month':
                    periodStart.setMonth(periodStart.getMonth() + periodIndex);
                    break;
                case 'bimonthly':
                    periodStart.setMonth(periodStart.getMonth() + periodIndex * 2);
                    break;
                case 'quarterly':
                    periodStart.setMonth(periodStart.getMonth() + periodIndex * 3);
                    break;
                case 'semiannually':
                    periodStart.setMonth(periodStart.getMonth() + periodIndex * 6);
                    break;
                case 'annually':
                    periodStart.setFullYear(periodStart.getFullYear() + periodIndex);
                    break;
            }
            periodList.push(periodStart);
        }

        return periodList.map((periodStart) => {
            const periodEnd = new Date(periodStart);
            switch (timeUnit) {
                case 'day':
                    periodEnd.setDate(periodEnd.getDate() + 1);
                    break;
                case 'week':
                    periodEnd.setDate(periodEnd.getDate() + 7);
                    break;
                case 'fortnightly':
                    if (periodStart.getDate() === 1) {
                        periodEnd.setDate(16);
                    } else {
                        periodEnd.setMonth(periodEnd.getMonth() + 1);
                        periodEnd.setDate(1);
                    }
                    break;
                case 'month':
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                    break;
                case 'bimonthly':
                    periodEnd.setMonth(periodEnd.getMonth() + 2);
                    break;
                case 'quarterly':
                    periodEnd.setMonth(periodEnd.getMonth() + 3);
                    break;
                case 'semiannually':
                    periodEnd.setMonth(periodEnd.getMonth() + 6);
                    break;
                case 'annually':
                    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                    break;
            }
            periodEnd.setMilliseconds(periodEnd.getMilliseconds() - 1);

            const year = periodStart.toLocaleDateString('fr-FR', { year: '2-digit' });
            const monthsShort = [
                'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
                'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
            ];
            let label = '';
            switch (timeUnit) {
                case 'day':
                    if (activeQuickSelect === 'week') {
                        const dayLabel = periodStart.toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                        });
                        label = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
                    } else {
                        label = periodStart.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                        });
                    }
                    break;
                case 'week':
                    label = `S ${periodStart.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                    })}`;
                    break;
                case 'fortnightly':
                    const fortnightNum = periodStart.getDate() === 1 ? '1' : '2';
                    label = `${fortnightNum}Q-${monthsShort[periodStart.getMonth()]}'${year}`;
                    break;
                case 'month':
                    label = `${periodStart.toLocaleString('fr-FR', {
                        month: 'short',
                    })} '${year}`;
                    break;
                case 'bimonthly':
                    const startMonthB = monthsShort[periodStart.getMonth()];
                    const endMonthB = monthsShort[(periodStart.getMonth() + 1) % 12];
                    label = `${startMonthB}-${endMonthB}`;
                    break;
                case 'quarterly':
                    const quarter = Math.floor(periodStart.getMonth() / 3) + 1;
                    label = `T${quarter} '${year}`;
                    break;
                case 'semiannually':
                    const semester = Math.floor(periodStart.getMonth() / 6) + 1;
                    label = `S${semester} '${year}`;
                    break;
                case 'annually':
                    label = String(periodStart.getFullYear());
                    break;
            }
            return { label, startDate: periodStart, endDate: periodEnd };
        });
    }, [
        timeUnit,
        horizonLength,
        periodOffset,
        activeQuickSelect,
        settings.timezoneOffset,
    ]);

    const effectiveCashAccounts = useMemo(() => {
        return [{
            id: `consolidated_account_${activeProjectId}`,
            name: 'Trésorerie Consolidée',
            initialBalance: 0,
            currentBalance: 0,
            initialBalanceDate: new Date().toISOString().split('T')[0],
            projectId: activeProjectId,
            isConsolidated: true
        }];
    }, [activeProjectId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                frequencyFilterRef.current &&
                !frequencyFilterRef.current.contains(event.target)
            ) {
                setIsFrequencyFilterOpen(false);
            }
            if (
                tierSearchRef.current &&
                !tierSearchRef.current.contains(event.target)
            ) {
                setIsTierSearchOpen(false);
            }
            if (
                projectSearchRef.current &&
                !projectSearchRef.current.contains(event.target)
            ) {
                setIsProjectSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const calculatePeriodPositions = (
        periods,
        cashAccounts,
        groupedData,
        expandedAndVatEntries,
        finalActualTransactions,
        hasOffBudgetRevenues,
        hasOffBudgetExpenses
    ) => {
        if (
            !periods ||
            periods.length === 0 ||
            !cashAccounts ||
            cashAccounts.length === 0
        ) {
            return (
                periods?.map(() => ({
                    initial: 0,
                    final: 0,
                    netCashFlow: 0,
                    totalEntrees: 0,
                    totalSorties: 0,
                })) || []
            );
        }

        const totalInitialBalance = cashAccounts.reduce((sum, account) => {
            return sum + (account.initialBalance || 0);
        }, 0);

        const positions = [];
        let runningBalance = totalInitialBalance;

        for (let i = 0; i < periods.length; i++) {
            const period = periods[i];

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

            const totalEntrees = revenueTotals.actual || 0;
            const totalSorties = expenseTotals.actual || 0;
            const netCashFlow = totalEntrees - totalSorties;

            const initialBalance = runningBalance;
            const finalBalance = initialBalance + netCashFlow;

            runningBalance = finalBalance;

            positions.push({
                initial: initialBalance,
                final: finalBalance,
                netCashFlow: netCashFlow,
                totalEntrees: totalEntrees,
                totalSorties: totalSorties,
            });
        }

        return positions;
    };

    const handlePeriodChange = (direction) => {
        uiDispatch({
            type: 'SET_PERIOD_OFFSET',
            payload: periodOffset + direction,
        });
    };

    const handleQuickPeriodSelect = (quickSelectType) => {
        const today = getTodayInTimezone(settings.timezoneOffset);
        let payload;

        switch (quickSelectType) {
            case 'today':
                payload = {
                    timeUnit: 'day',
                    horizonLength: 1,
                    periodOffset: 0,
                    activeQuickSelect: 'today',
                };
                break;
            case 'week': {
                const dayOfWeek = today.getDay();
                const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                payload = {
                    timeUnit: 'day',
                    horizonLength: 7,
                    periodOffset: offsetToMonday,
                    activeQuickSelect: 'week',
                };
                break;
            }
            case 'month': {
                const year = today.getFullYear();
                const month = today.getMonth();
                const firstDayOfMonth = new Date(year, month, 1);
                const lastDayOfMonth = new Date(year, month + 1, 0);

                const startOfWeekOfFirstDay = getStartOfWeek(firstDayOfMonth);
                const startOfWeekOfLastDay = getStartOfWeek(lastDayOfMonth);

                const horizon =
                    Math.round(
                        (startOfWeekOfLastDay - startOfWeekOfFirstDay) /
                        (1000 * 60 * 60 * 24 * 7)
                    ) + 1;

                const startOfCurrentWeek = getStartOfWeek(today);
                const offsetInTime = startOfWeekOfFirstDay - startOfCurrentWeek;
                const offsetInWeeks = Math.round(
                    offsetInTime / (1000 * 60 * 60 * 24 * 7)
                );

                payload = {
                    timeUnit: 'week',
                    horizonLength: horizon,
                    periodOffset: offsetInWeeks,
                    activeQuickSelect: 'month',
                };
                break;
            }
            case 'quarter': {
                const currentQuarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
                const firstDayOfQuarter = new Date(
                    today.getFullYear(),
                    currentQuarterStartMonth,
                    1
                );
                const currentFortnightStart = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() <= 15 ? 1 : 16
                );
                const targetFortnightStart = new Date(
                    firstDayOfQuarter.getFullYear(),
                    firstDayOfQuarter.getMonth(),
                    1
                );
                const monthsDiff =
                    (currentFortnightStart.getFullYear() -
                        targetFortnightStart.getFullYear()) *
                    12 +
                    (currentFortnightStart.getMonth() - targetFortnightStart.getMonth());
                let fortnightOffset = -monthsDiff * 2;
                if (currentFortnightStart.getDate() > 15) {
                    fortnightOffset -= 1;
                }
                payload = {
                    timeUnit: 'fortnightly',
                    horizonLength: 6,
                    periodOffset: fortnightOffset,
                    activeQuickSelect: 'quarter',
                };
                break;
            }
            case 'year': {
                const currentMonth = today.getMonth();
                const offsetToJanuary = -currentMonth;
                payload = {
                    timeUnit: 'month',
                    horizonLength: 12,
                    periodOffset: offsetToJanuary,
                    activeQuickSelect: 'year',
                };
                break;
            }
            case 'short_term': {
                payload = {
                    timeUnit: 'annually',
                    horizonLength: 3,
                    periodOffset: 0,
                    activeQuickSelect: 'short_term',
                };
                break;
            }
            case 'medium_term': {
                payload = {
                    timeUnit: 'annually',
                    horizonLength: 5,
                    periodOffset: 0,
                    activeQuickSelect: 'medium_term',
                };
                break;
            }
            case 'long_term': {
                payload = {
                    timeUnit: 'annually',
                    horizonLength: 10,
                    periodOffset: 0,
                    activeQuickSelect: 'long_term',
                };
                break;
            }
            default:
                return;
        }
        uiDispatch({ type: 'SET_QUICK_PERIOD', payload });
    };

    const handleNewBudget = () => {
        console.log('Création de budget désactivée pour les vues consolidées');
    };

    const filteredBudgetEntries = useMemo(() => {
        let entries = processedBudgetEntries || [];

        if (searchTerm) {
            entries = entries.filter((entry) =>
                entry.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (projectSearchTerm) {
            entries = entries.filter((entry) => {
                const project = projects.find((p) => p.id === entry.projectId);
                return (
                    project &&
                    project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
                );
            });
        }

        if (frequencyFilter !== 'all') {
            entries = entries.filter((entry) => {
                const entryFrequencyId = entry.frequency_id?.toString();
                return entryFrequencyId === frequencyFilter;
            });
        }

        if (quickFilter !== 'all') {
            if (quickFilter === 'provisions') {
                entries = entries.filter((e) => e.isProvision);
            } else if (quickFilter === 'borrowings') {
                const borrowingCat = "Emprunt ( Remboursement d')";
                entries = entries.filter(
                    (e) => e.category && e.category.startsWith(borrowingCat)
                );
            } else if (quickFilter === 'lendings') {
                const lendingCat = 'Prêts (Remboursement de)';
                entries = entries.filter(
                    (e) => e.category && e.category.startsWith(lendingCat)
                );
            } else if (quickFilter === 'savings') {
                const epargneMainCategory = finalCategories.expense.find(
                    (cat) => cat.name === 'Épargne'
                );
                const epargneSubCategories = epargneMainCategory
                    ? epargneMainCategory.subCategories.map((sc) => sc.name)
                    : [];
                entries = entries.filter(
                    (e) => e.category && epargneSubCategories.includes(e.category)
                );
            }
        }

        return entries;
    }, [
        processedBudgetEntries,
        searchTerm,
        projectSearchTerm,
        projects,
        quickFilter,
        finalCategories,
        frequencyFilter,
    ]);

    const shouldIncludeExtendedEntry = useCallback((entry, filteredEntries) => {
        if (!entry.is_vat_child && !entry.is_vat_payment && !entry.is_tax_payment) {
            return filteredEntries.some(
                (filteredEntry) => filteredEntry.id === entry.id
            );
        }

        if (entry.is_vat_child) {
            const parentEntryId = entry.id.replace('_vat', '');
            return filteredEntries.some(
                (filteredEntry) => filteredEntry.id === parentEntryId
            );
        }

        if (entry.is_vat_payment || entry.is_tax_payment) {
            const associatedEntryId =
                entry.associatedEntryId ||
                entry.id.replace('_vat_payment', '').replace('_tax_payment', '');
            return filteredEntries.some(
                (filteredEntry) => filteredEntry.id === associatedEntryId
            );
        }

        return true;
    }, []);

    const isRowVisibleInPeriods = useCallback((entry) => {
        return true;
    }, []);

    const safeBudgetEntries = useMemo(
        () => filteredBudgetEntries || [],
        [filteredBudgetEntries]
    );
    const safeActualTransactions = useMemo(
        () => finalActualTransactions || [],
        [finalActualTransactions]
    );
    const safeCategories = useMemo(
        () => finalCategories || {},
        [finalCategories]
    );
    const safeVatRegimes = useMemo(() => vatRegimes || {}, [vatRegimes]);
    const safeTaxConfigs = useMemo(() => taxConfigs || [], [taxConfigs]);
    const safePeriods = useMemo(() => periods || [], [periods]);

    const expandedAndVatEntries = useProcessedEntries(
        safeBudgetEntries,
        safeActualTransactions,
        safeCategories,
        safeVatRegimes,
        safeTaxConfigs,
        activeProjectId,
        safePeriods,
        true, // isConsolidated
        isCustomConsolidated,
        collectionData
    );

    const entriesWithCollectionData = useMemo(() => {
        if (!expandedAndVatEntries || expandedAndVatEntries.length === 0) return [];

        return expandedAndVatEntries.map((entry) => {
            const entryCollectionData =
                collectionData[entry.id] ||
                collectionData[entry.budget_detail_id] ||
                collectionData[entry.budget_id];

            return {
                ...entry,
                collectionData: entryCollectionData,
            };
        });
    }, [expandedAndVatEntries, collectionData]);

    const filteredExpandedAndVatEntries = useMemo(() => {
        if (frequencyFilter === 'all') {
            return entriesWithCollectionData;
        }

        const filtered = entriesWithCollectionData.filter((entry) =>
            shouldIncludeExtendedEntry(entry, filteredBudgetEntries)
        );

        return filtered;
    }, [
        entriesWithCollectionData,
        filteredBudgetEntries,
        frequencyFilter,
        shouldIncludeExtendedEntry,
    ]);

    const hasOffBudgetRevenues = useMemo(
        () =>
            filteredExpandedAndVatEntries.some(
                (e) => e.isOffBudget && e.type === 'revenu' && isRowVisibleInPeriods(e)
            ),
        [filteredExpandedAndVatEntries, isRowVisibleInPeriods]
    );
    const hasOffBudgetExpenses = useMemo(
        () =>
            filteredExpandedAndVatEntries.some(
                (e) => e.isOffBudget && e.type === 'depense' && isRowVisibleInPeriods(e)
            ),
        [filteredExpandedAndVatEntries, isRowVisibleInPeriods]
    );
    const groupedData = useGroupedData(
        filteredExpandedAndVatEntries,
        finalCategories,
        isRowVisibleInPeriods
    );

    const periodPositions = useMemo(() => {
        return calculatePeriodPositions(
            periods,
            effectiveCashAccounts,
            groupedData,
            filteredExpandedAndVatEntries,
            finalActualTransactions,
            hasOffBudgetRevenues,
            hasOffBudgetExpenses
        );
    }, [
        periods,
        effectiveCashAccounts,
        groupedData,
        filteredExpandedAndVatEntries,
        finalActualTransactions,
        hasOffBudgetRevenues,
        hasOffBudgetExpenses,
    ]);

    // Gestion des événements
    const toggleCollapse = (mainCatId) => {
        setCollapsedItems((prev) => ({
            ...prev,
            [mainCatId]: !prev[mainCatId],
        }));
    };

    useEffect(() => {
        localStorage.setItem('budgetAppColumnWidths', JSON.stringify(columnWidths));
    }, [columnWidths]);

    useEffect(() => {
        const topEl = topScrollRef.current;
        const mainEl = mainScrollRef.current;
        if (!topEl || !mainEl) return;

        let isSyncing = false;
        const syncTopToMain = () => {
            if (!isSyncing) {
                isSyncing = true;
                mainEl.scrollLeft = topEl.scrollLeft;
                requestAnimationFrame(() => {
                    isSyncing = false;
                });
            }
        };
        const syncMainToTop = () => {
            if (!isSyncing) {
                isSyncing = true;
                topEl.scrollLeft = mainEl.scrollLeft;
                requestAnimationFrame(() => {
                    isSyncing = false;
                });
            }
        };

        topEl.addEventListener('scroll', syncTopToMain);
        mainEl.addEventListener('scroll', syncMainToTop);
        return () => {
            topEl.removeEventListener('scroll', syncTopToMain);
            mainEl.removeEventListener('scroll', syncMainToTop);
        };
    }, []);

    const handleResize = (columnId, newWidth) =>
        setColumnWidths((prev) => ({
            ...prev,
            [columnId]: Math.max(newWidth, 80),
        }));

    const supplierColLeft = columnWidths.category;
    const descriptionColLeft = supplierColLeft + columnWidths.supplier;
    const projectColLeft = visibleColumns.description
        ? descriptionColLeft + columnWidths.description
        : descriptionColLeft;

    const formatDate = (dateString) =>
        dateString
            ? new Date(dateString).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })
            : '';

    const getFrequencyTitle = (entry) => {
        const freq = entry.frequency_name || entry.frequency || '';
        const freqFormatted = freq.charAt(0).toUpperCase() + freq.slice(1);

        if (
            freq.toLowerCase() === 'ponctuel' ||
            freq.toLowerCase() === 'ponctuelle'
        ) {
            const dateToShow = entry.date || entry.start_date;
            return `Ponctuel: ${formatDate(dateToShow)}`;
        }
        if (freq.toLowerCase() === 'irregulier') {
            return `Irrégulier: ${entry.payments?.length || 0} paiements`;
        }
        const period = `De ${formatDate(entry.startDate || entry.start_date)} à ${entry.endDate || entry.end_date
            ? formatDate(entry.endDate || entry.end_date)
            : '...'
            }`;
        return `${freqFormatted} | ${period}`;
    };

    const getResteColor = (reste, isEntree) =>
        reste === 0
            ? 'text-text-secondary'
            : isEntree
                ? reste <= 0
                    ? 'text-success-600'
                    : 'text-danger-600'
                : reste >= 0
                    ? 'text-success-600'
                    : 'text-danger-600';

    const handleActualClick = (context) => {
        const { period } = context;
        let payments = [];
        let title = '';
        if (context.entryId) {
            const entry = filteredExpandedAndVatEntries.find(
                (e) => e.id === context.entryId
            );
            payments = finalActualTransactions
                .filter((t) => t.budgetId === context.entryId)
                .flatMap((t) =>
                    (t.payments || [])
                        .filter(
                            (p) =>
                                new Date(p.paymentDate) >= period.startDate &&
                                new Date(p.paymentDate) < period.endDate
                        )
                        .map((p) => ({ ...p, thirdParty: t.thirdParty, type: t.type }))
                );
            title = `Détails pour ${entry?.supplier || 'Entrée'}`;
        } else if (context.mainCategory) {
            title = `Détails pour ${context.mainCategory.name}`;
        }
        if (payments.length > 0)
            setDrawerData({
                isOpen: true,
                transactions: payments,
                title: `${title} - ${period.label}`,
            });
    };

    const handleCloseDrawer = () =>
        setDrawerData({ isOpen: false, transactions: [], title: '' });

    const handleDrillDown = () => {
        const newCollapsedState = {};
        groupedData.entree.forEach(
            (mainCat) => (newCollapsedState[mainCat.id] = false)
        );
        groupedData.sortie.forEach(
            (mainCat) => (newCollapsedState[mainCat.id] = false)
        );
        setCollapsedItems(newCollapsedState);
        setIsEntreesCollapsed(false);
        setIsSortiesCollapsed(false);
    };

    const handleDrillUp = () => {
        const newCollapsedState = {};
        groupedData.entree.forEach(
            (mainCat) => (newCollapsedState[mainCat.id] = true)
        );
        groupedData.sortie.forEach(
            (mainCat) => (newCollapsedState[mainCat.id] = true)
        );
        setCollapsedItems(newCollapsedState);
    };

    const numVisibleCols =
        (visibleColumns.budget ? 1 : 0) + (visibleColumns.actual ? 1 : 0) + 1;
    const periodColumnWidth = numVisibleCols > 0 ? numVisibleCols * 90 : 50;
    const separatorWidth = 4;

    const fixedColsWidth =
        columnWidths.category +
        columnWidths.supplier +
        (visibleColumns.description ? columnWidths.description : 0) +
        (visibleColumns.project ? columnWidths.project : 0);

    const totalTableWidth =
        fixedColsWidth +
        separatorWidth +
        periods.length * (periodColumnWidth + separatorWidth);
    const totalCols = 5 + periods.length * 2;

    const renderBudgetRows = (type) => {
        const isEntree = type === 'entree';
        const mainCategories = groupedData[type] || [];
        const isCollapsed =
            type === 'entree' ? isEntreesCollapsed : isSortiesCollapsed;
        const toggleMainCollapse =
            type === 'entree'
                ? () => setIsEntreesCollapsed((p) => !p)
                : () => setIsSortiesCollapsed((p) => !p);
        const Icon = type === 'entree' ? TrendingUp : TrendingDown;
        const colorClass =
            type === 'entree' ? 'text-success-600' : 'text-danger-600';

        const periodCellStyle = {
            minWidth: `${periodColumnWidth}px`,
            width: `${periodColumnWidth}px`,
        };

        return (
            <>
                <tr
                    className="bg-gray-200 border-gray-300 cursor-pointer border-y-2"
                    onClick={toggleMainCollapse}
                >
                    <td
                        className="sticky left-0 z-20 px-4 py-1 bg-gray-200 text-text-primary"
                        style={{ width: columnWidths.category }}
                    >
                        <div className="flex items-center gap-2 font-bold">
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''
                                    }`}
                            />
                            <Icon className={`w-4 h-4 ${colorClass}`} />
                            {isEntree ? 'Total Entrées' : 'Total Sorties'}
                        </div>
                    </td>
                    <td
                        className="sticky z-20 px-4 py-1 bg-gray-200"
                        style={{
                            left: `${supplierColLeft}px`,
                            width: columnWidths.supplier,
                        }}
                    ></td>
                    {visibleColumns.description && (
                        <td
                            className="sticky z-20 px-4 py-1 bg-gray-200"
                            style={{
                                left: `${descriptionColLeft}px`,
                                width: columnWidths.description,
                            }}
                        ></td>
                    )}
                    {visibleColumns.project && (
                        <td
                            className="sticky z-20 px-4 py-1 bg-gray-200"
                            style={{
                                left: `${projectColLeft}px`,
                                width: columnWidths.project,
                            }}
                        ></td>
                    )}
                    <td
                        className="bg-surface"
                        style={{ width: `${separatorWidth}px` }}
                    ></td>
                    {periods.map((period, periodIndex) => {
                        const totals = calculateGeneralTotals(
                            mainCategories,
                            period,
                            type,
                            filteredExpandedAndVatEntries,
                            finalActualTransactions,
                            hasOffBudgetRevenues,
                            hasOffBudgetExpenses
                        );
                        const reste = totals.budget - totals.actual;
                        const columnIdBase = period.startDate.toISOString();
                        const rowId = `total_${type}`;

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
                                                            if (totals.actual !== 0)
                                                                handleActualClick({ type, period });
                                                        }}
                                                        disabled={totals.actual === 0}
                                                        className="font-normal text-text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {formatCurrency(totals.actual, currencySettings)}
                                                    </button>
                                                    <CommentButton
                                                        rowId={rowId}
                                                        columnId={`${columnIdBase}_actual`}
                                                        rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`}
                                                        columnName={`${period.label} (Réel)`}
                                                    />
                                                </div>
                                            )}
                                            <div
                                                className={`relative text-center font-normal ${getResteColor(
                                                    reste,
                                                    isEntree
                                                )}`}
                                            >
                                                {formatCurrency(reste, currencySettings)}
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

                {!isCollapsed &&
                    mainCategories.length > 0 &&
                    mainCategories.map((mainCategory) => {
                        const isMainCollapsed = collapsedItems[mainCategory.id];

                        return (
                            <React.Fragment key={mainCategory.id}>
                                {/* Main Category Row */}
                                <tr
                                    onClick={() => toggleCollapse(mainCategory.id)}
                                    className="text-gray-700 bg-gray-100 cursor-pointer hover:bg-gray-200"
                                >
                                    <td
                                        className="sticky left-0 z-20 px-4 py-1 bg-gray-100"
                                        style={{ width: columnWidths.category }}
                                    >
                                        <div className="flex items-center gap-2 text-xs font-semibold">
                                            <ChevronDown
                                                className={`w-4 h-4 transition-transform ${isMainCollapsed ? '-rotate-90' : ''
                                                    }`}
                                            />
                                            {mainCategory.name}
                                        </div>
                                    </td>
                                    <td
                                        className="sticky z-20 px-4 py-1 bg-gray-100"
                                        style={{
                                            left: `${supplierColLeft}px`,
                                            width: columnWidths.supplier,
                                        }}
                                    ></td>
                                    {visibleColumns.description && (
                                        <td
                                            className="sticky z-20 px-4 py-1 bg-gray-100"
                                            style={{
                                                left: `${descriptionColLeft}px`,
                                                width: columnWidths.description,
                                            }}
                                        ></td>
                                    )}
                                    {visibleColumns.project && (
                                        <td
                                            className="sticky z-20 px-4 py-1 bg-gray-100"
                                            style={{
                                                left: `${projectColLeft}px`,
                                                width: columnWidths.project,
                                            }}
                                        ></td>
                                    )}
                                    <td className="bg-surface"></td>
                                    {periods.map((period, periodIndex) => {
                                        const totals = calculateMainCategoryTotals(
                                            mainCategory.entries,
                                            period,
                                            finalActualTransactions
                                        );
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
                                                                    {formatCurrency(
                                                                        totals.budget,
                                                                        currencySettings
                                                                    )}
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
                                                                            if (totals.actual !== 0)
                                                                                handleActualClick({
                                                                                    mainCategory,
                                                                                    period,
                                                                                });
                                                                        }}
                                                                        disabled={totals.actual === 0}
                                                                        className="hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                                    >
                                                                        {formatCurrency(
                                                                            totals.actual,
                                                                            currencySettings
                                                                        )}
                                                                    </button>
                                                                    <CommentButton
                                                                        rowId={rowId}
                                                                        columnId={`${columnIdBase}_actual`}
                                                                        rowName={mainCategory.name}
                                                                        columnName={`${period.label} (Réel)`}
                                                                    />
                                                                </div>
                                                            )}
                                                            <div
                                                                className={`relative text-center font-normal ${getResteColor(
                                                                    reste,
                                                                    isEntree
                                                                )}`}
                                                            >
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

                                {/* Entrées individuelles */}
                                {!isMainCollapsed &&
                                    mainCategory.entries &&
                                    mainCategory.entries
                                        .filter((entry) => isRowVisibleInPeriods(entry))
                                        .map((entry) => {
                                            const project = projects.find((p) => p.id === entry.projectId);
                                            const subCat =
                                                mainCategory.subCategories &&
                                                mainCategory.subCategories.find(
                                                    (sc) => sc.name === entry.category
                                                );
                                            const criticality = subCat?.criticality;
                                            const critConfig = criticalityConfig[criticality];

                                            return (
                                                <tr
                                                    key={entry.id}
                                                    className={`border-b border-gray-100 hover:bg-gray-50 group ${entry.is_vat_child
                                                        ? 'bg-gray-50/50'
                                                        : entry.is_vat_payment || entry.is_tax_payment
                                                            ? 'bg-blue-50/50'
                                                            : ''
                                                        }`}
                                                >
                                                    <td
                                                        className={`px-4 py-1 font-normal text-gray-800 sticky left-0 bg-white group-hover:bg-gray-50 z-20 ${entry.is_vat_child ? 'pl-8' : ''
                                                            }`}
                                                        style={{ width: columnWidths.category }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {critConfig && (
                                                                <span
                                                                    className={`w-2 h-2 rounded-full ${critConfig.color}`}
                                                                    title={`Criticité: ${critConfig.label}`}
                                                                ></span>
                                                            )}
                                                            {entry.isProvision && (
                                                                <Lock className="w-3 h-3 text-indigo-500 shrink-0" />
                                                            )}
                                                            <span>{entry.category}</span>
                                                        </div>
                                                    </td>
                                                    <td
                                                        className="sticky z-10 px-4 py-1 text-gray-700 bg-white group-hover:bg-gray-50"
                                                        style={{
                                                            left: `${supplierColLeft}px`,
                                                            width: columnWidths.supplier,
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div
                                                                className="flex items-center gap-2 truncate"
                                                                title={getFrequencyTitle(entry)}
                                                            >
                                                                <span className="truncate">
                                                                    {entry.supplier}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {visibleColumns.description && (
                                                        <td
                                                            className="sticky z-10 px-4 py-1 text-xs text-gray-500 truncate bg-white group-hover:bg-gray-50"
                                                            style={{
                                                                left: `${descriptionColLeft}px`,
                                                                width: columnWidths.description,
                                                            }}
                                                            title={getEntryDescription(entry)}
                                                        >
                                                            {getEntryDescription(entry) !==
                                                                'Aucune description disponible' ? (
                                                                <span className="truncate">
                                                                    {getEntryDescription(entry)}
                                                                </span>
                                                            ) : (
                                                                <span className="italic text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    {visibleColumns.project && (
                                                        <td
                                                            className="sticky z-10 px-4 py-1 text-gray-600 bg-white group-hover:bg-gray-50"
                                                            style={{
                                                                left: `${projectColLeft}px`,
                                                                width: columnWidths.project,
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Folder className="w-4 h-4 text-blue-500" />
                                                                {entry.projectName || project?.name || 'N/A'}
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="bg-surface"></td>
                                                    {periods.map((period, periodIndex) => {
                                                        const startDate = new Date(period.startDate);
                                                        const endDate = new Date(period.endDate);

                                                        const budget = calculateEntryAmountForPeriod(
                                                            entry,
                                                            startDate,
                                                            endDate
                                                        );

                                                        const actual = calculateConsolidatedActualAmount(entry, {
                                                            ...period,
                                                            startDate,
                                                            endDate
                                                        });

                                                        const reste = budget - actual;
                                                        const columnIdBase = startDate.toISOString();

                                                        return (
                                                            <React.Fragment key={periodIndex}>
                                                                <td className="px-1 py-1" style={periodCellStyle}>
                                                                    {numVisibleCols > 0 && (
                                                                        <div className="grid grid-cols-3 gap-1 text-xs">
                                                                            {visibleColumns.budget && (
                                                                                <div className="relative text-center text-gray-500 group/subcell">
                                                                                    {formatCurrency(budget, currencySettings)}
                                                                                    <CommentButton
                                                                                        rowId={entry.id}
                                                                                        columnId={`${columnIdBase}_budget`}
                                                                                        rowName={entry.supplier}
                                                                                        columnName={`${period.label} (Prév.)`}
                                                                                    />
                                                                                </div>
                                                                            )}

                                                                            {/* --- ACTUAL --- */}
                                                                            {visibleColumns.actual && (
                                                                                <div className="relative text-center group/subcell">
                                                                                    <button
                                                                                        disabled={actual === 0 && budget === 0}
                                                                                        className="text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
                                                                                    >
                                                                                        {formatCurrency(actual, currencySettings)}
                                                                                    </button>
                                                                                    <CommentButton
                                                                                        rowId={entry.id}
                                                                                        columnId={`${columnIdBase}_actual`}
                                                                                        rowName={entry.supplier}
                                                                                        columnName={`${period.label} (Réel)`}
                                                                                    />
                                                                                </div>
                                                                            )}

                                                                            {/* --- RESTE --- */}
                                                                            <div className={`relative text-center font-normal ${getResteColor(reste, isEntree)}`}>
                                                                                {formatCurrency(reste, currencySettings)}
                                                                                <CommentButton
                                                                                    rowId={entry.id}
                                                                                    columnId={`${columnIdBase}_reste`}
                                                                                    rowName={entry.supplier}
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
                                            );
                                        })}
                            </React.Fragment>
                        );
                    })}
            </>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Chargement des données consolidées...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-red-500">Erreur: {error}</div>
            </div>
        );
    }

    if (hasNoData) {
        const selectedFrequencyLabel =
            frequencyOptions.find((opt) => opt.id === frequencyFilter)?.label ||
            'cette fréquence';

        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="mb-4 text-lg text-gray-500">
                    Aucune donnée trouvée pour {selectedFrequencyLabel}
                </div>
                <button
                    onClick={() => setFrequencyFilter('all')}
                    className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                    Voir toutes les fréquences
                </button>
            </div>
        );
    }

    if (tableauMode === 'lecture') {
        return <LectureView {...props} />;
    }

    return (
        <>
            {true && (
                <div className="relative z-50 mb-6">
                    <BudgetTableHeader
                        timeUnit={timeUnit}
                        periodOffset={periodOffset}
                        activeQuickSelect={activeQuickSelect}
                        tableauMode={tableauMode}
                        setTableauMode={setTableauMode}
                        showViewModeSwitcher={showViewModeSwitcher}
                        showNewEntryButton={showNewEntryButton}
                        isConsolidated={isConsolidated}
                        isCustomConsolidated={isCustomConsolidated}
                        handlePeriodChange={handlePeriodChange}
                        handleQuickPeriodSelect={handleQuickPeriodSelect}
                        handleNewBudget={handleNewBudget}
                        periodMenuRef={periodMenuRef}
                        isPeriodMenuOpen={isPeriodMenuOpen}
                        setIsPeriodMenuOpen={setIsPeriodMenuOpen}
                        frequencyFilter={frequencyFilter}
                        setFrequencyFilter={setFrequencyFilter}
                        isFrequencyFilterOpen={isFrequencyFilterOpen}
                        setIsFrequencyFilterOpen={setIsFrequencyFilterOpen}
                        frequencyFilterRef={frequencyFilterRef}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        projectSearchTerm={projectSearchTerm}
                        setProjectSearchTerm={setProjectSearchTerm}
                    />
                </div>
            )}
            <div className="relative z-10 overflow-hidden rounded-lg shadow-lg bg-surface">
                <div
                    ref={topScrollRef}
                    className="overflow-x-auto overflow-y-hidden custom-scrollbar"
                >
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
                                            <button
                                                onClick={handleDrillUp}
                                                className="p-1 text-gray-500 hover:text-gray-800"
                                                title="Réduire tout"
                                            >
                                                <ChevronUp size={16} />
                                            </button>
                                            <button
                                                onClick={handleDrillDown}
                                                className="p-1 text-gray-500 hover:text-gray-800"
                                                title="Développer tout"
                                            >
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
                                        <div
                                            ref={tierSearchRef}
                                            className="flex items-center w-full gap-1"
                                        >
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Rechercher par tiers..."
                                                className="w-full px-2 py-1 text-sm bg-white border rounded-md"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <button
                                                onClick={() => {
                                                    setSearchTerm('');
                                                }}
                                                className="p-1 text-gray-500 hover:text-gray-800"
                                                title="Effacer"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <span>Tiers</span>
                                            <button
                                                onClick={() => setIsTierSearchOpen(true)}
                                                className="p-1 text-gray-500 hover:text-gray-800"
                                                title="Rechercher par tiers"
                                            >
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

                                <th
                                    className="border-b-2 bg-surface"
                                    style={{ width: `${separatorWidth}px` }}
                                ></th>
                                {periods.map((period, periodIndex) => {
                                    const isPast = period.endDate <= today;
                                    const revenueTotals = calculateGeneralTotals(
                                        groupedData.entree || [],
                                        period,
                                        'entree',
                                        filteredExpandedAndVatEntries,
                                        finalActualTransactions,
                                        hasOffBudgetRevenues,
                                        hasOffBudgetExpenses
                                    );
                                    const expenseTotals = calculateGeneralTotals(
                                        groupedData.sortie || [],
                                        period,
                                        'sortie',
                                        filteredExpandedAndVatEntries,
                                        finalActualTransactions,
                                        hasOffBudgetRevenues,
                                        hasOffBudgetExpenses
                                    );
                                    const netBudget = revenueTotals.budget - expenseTotals.budget;
                                    const isNegativeFlow = netBudget < 0;
                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <th
                                                className={`px-2 py-2 text-center font-medium border-b-2 ${isPast ? 'bg-gray-50' : 'bg-surface'
                                                    } ${isNegativeFlow && !isPast ? 'bg-red-50' : ''}`}
                                                style={{ minWidth: `${periodColumnWidth}px` }}
                                            >
                                                <div
                                                    className={`text-base mb-1 ${isNegativeFlow && !isPast
                                                        ? 'text-red-700'
                                                        : 'text-gray-600'
                                                        }`}
                                                >
                                                    {period.label}
                                                </div>
                                                {numVisibleCols > 0 && (
                                                    <div className="flex justify-around gap-2 text-xs font-medium text-gray-600">
                                                        {visibleColumns.budget && (
                                                            <div className="flex-1">Prév.</div>
                                                        )}
                                                        {visibleColumns.actual && (
                                                            <div className="flex-1">Réel</div>
                                                        )}
                                                        <div className="flex-1">Reste</div>
                                                    </div>
                                                )}
                                            </th>
                                            <th
                                                className="border-b-2 bg-surface"
                                                style={{ width: `${separatorWidth}px` }}
                                            ></th>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Ligne Trésorerie début de période */}
                            <tr className="text-gray-800 bg-gray-200">
                                <td
                                    className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-200"
                                    style={{ width: columnWidths.category }}
                                >
                                    Trésorerie début de période
                                    <div className="mt-1 text-xs font-normal text-gray-500">
                                        Trésorerie consolidée - Solde initial
                                    </div>
                                </td>
                                <td
                                    className="sticky z-20 px-4 py-2 bg-gray-200"
                                    style={{
                                        left: `${supplierColLeft}px`,
                                        width: columnWidths.supplier,
                                    }}
                                ></td>
                                {visibleColumns.description && (
                                    <td
                                        className="sticky z-20 px-4 py-2 bg-gray-200"
                                        style={{
                                            left: `${descriptionColLeft}px`,
                                            width: columnWidths.description,
                                        }}
                                    ></td>
                                )}
                                {visibleColumns.project && (
                                    <td
                                        className="sticky z-20 px-4 py-2 bg-gray-200"
                                        style={{
                                            left: `${projectColLeft}px`,
                                            width: columnWidths.project,
                                        }}
                                    ></td>
                                )}
                                <td className="bg-surface"></td>
                                {periods.map((_, periodIndex) => {
                                    const position = periodPositions[periodIndex];
                                    const initialAmount = position?.initial || 0;

                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td
                                                className="px-2 py-2 font-normal text-center"
                                                colSpan={numVisibleCols}
                                            >
                                                {formatCurrency(initialAmount, currencySettings)}
                                            </td>
                                            <td className="bg-surface"></td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>

                            <tr className="bg-surface">
                                <td colSpan={totalCols} className="py-2"></td>
                            </tr>
                            {renderBudgetRows('entree')}
                            <tr className="bg-surface">
                                <td colSpan={totalCols} className="py-2"></td>
                            </tr>
                            {renderBudgetRows('sortie')}
                            <tr className="bg-surface">
                                <td colSpan={totalCols} className="py-2"></td>
                            </tr>

                            {/* Ligne Flux de trésorerie */}
                            <tr className="bg-gray-200 border-t-2 border-gray-300">
                                <td
                                    className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-200 text-text-primary"
                                    style={{ width: columnWidths.category }}
                                >
                                    <div className="flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Flux de trésorerie
                                    </div>
                                </td>
                                <td
                                    className="sticky z-20 px-4 py-2 bg-gray-200"
                                    style={{
                                        left: `${supplierColLeft}px`,
                                        width: columnWidths.supplier,
                                    }}
                                ></td>
                                {visibleColumns.description && (
                                    <td
                                        className="sticky z-20 px-4 py-2 bg-gray-200"
                                        style={{
                                            left: `${descriptionColLeft}px`,
                                            width: columnWidths.description,
                                        }}
                                    ></td>
                                )}
                                {visibleColumns.project && (
                                    <td
                                        className="sticky z-20 px-4 py-2 bg-gray-200"
                                        style={{
                                            left: `${projectColLeft}px`,
                                            width: columnWidths.project,
                                        }}
                                    ></td>
                                )}
                                <td
                                    className="bg-surface"
                                    style={{ width: `${separatorWidth}px` }}
                                ></td>
                                {periods.map((period, periodIndex) => {
                                    const revenueTotals = calculateGeneralTotals(
                                        groupedData.entree || [],
                                        period,
                                        'entree',
                                        filteredExpandedAndVatEntries,
                                        finalActualTransactions,
                                        hasOffBudgetRevenues,
                                        hasOffBudgetExpenses
                                    );
                                    const expenseTotals = calculateGeneralTotals(
                                        groupedData.sortie || [],
                                        period,
                                        'sortie',
                                        filteredExpandedAndVatEntries,
                                        finalActualTransactions,
                                        hasOffBudgetRevenues,
                                        hasOffBudgetExpenses
                                    );
                                    const netBudget = revenueTotals.budget - expenseTotals.budget;
                                    const netActual = revenueTotals.actual - expenseTotals.actual;
                                    const netReste = netBudget - netActual;
                                    const columnIdBase = period.startDate.toISOString();
                                    const rowId = 'net_flow';
                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-2 py-2">
                                                {numVisibleCols > 0 && (
                                                    <div className="flex justify-around gap-2 text-sm">
                                                        {visibleColumns.budget && (
                                                            <div
                                                                className={`relative group/subcell flex-1 text-center font-normal ${netBudget < 0
                                                                    ? 'text-red-600'
                                                                    : 'text-text-primary'
                                                                    }`}
                                                            >
                                                                {formatCurrency(netBudget, currencySettings)}
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_budget`}
                                                                    rowName="Flux de trésorerie"
                                                                    columnName={`${period.label} (Prév.)`}
                                                                />
                                                            </div>
                                                        )}
                                                        {visibleColumns.actual && (
                                                            <div className="relative flex-1 font-normal text-center group/subcell">
                                                                <button
                                                                    onClick={() =>
                                                                        netActual !== 0 &&
                                                                        handleActualClick({ type: 'net', period })
                                                                    }
                                                                    disabled={netActual === 0}
                                                                    className="text-text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    {formatCurrency(netActual, currencySettings)}
                                                                </button>
                                                                <CommentButton
                                                                    rowId={rowId}
                                                                    columnId={`${columnIdBase}_actual`}
                                                                    rowName="Flux de trésorerie"
                                                                    columnName={`${period.label} (Réel)`}
                                                                />
                                                            </div>
                                                        )}
                                                        <div
                                                            className={`relative group/subcell flex-1 text-center font-normal ${getResteColor(
                                                                netReste,
                                                                true
                                                            )}`}
                                                        >
                                                            {formatCurrency(netReste, currencySettings)}
                                                            <CommentButton
                                                                rowId={rowId}
                                                                columnId={`${columnIdBase}_reste`}
                                                                rowName="Flux de trésorerie"
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

                            {/* Ligne Trésorerie fin de période */}
                            <tr className="text-gray-900 bg-gray-300">
                                <td
                                    className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-300"
                                    style={{ width: columnWidths.category }}
                                >
                                    Trésorerie fin de période
                                    <div className="mt-1 text-xs font-normal text-gray-600">
                                        Solde initial + Flux net
                                    </div>
                                </td>
                                <td
                                    className="sticky z-20 px-4 py-2 bg-gray-300"
                                    style={{
                                        left: `${supplierColLeft}px`,
                                        width: columnWidths.supplier,
                                    }}
                                ></td>
                                {visibleColumns.description && (
                                    <td
                                        className="sticky z-20 px-4 py-2 bg-gray-300"
                                        style={{
                                            left: `${descriptionColLeft}px`,
                                            width: columnWidths.description,
                                        }}
                                    ></td>
                                )}
                                {visibleColumns.project && (
                                    <td
                                        className="sticky z-20 px-4 py-2 bg-gray-300"
                                        style={{
                                            left: `${projectColLeft}px`,
                                            width: columnWidths.project,
                                        }}
                                    ></td>
                                )}
                                <td className="bg-surface"></td>
                                {periods.map((_, periodIndex) => {
                                    const position = periodPositions[periodIndex];
                                    const finalAmount = position?.final || 0;

                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td
                                                className="px-2 py-2 font-normal text-center"
                                                colSpan={numVisibleCols}
                                            >
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

            <TransactionDetailDrawer
                isOpen={drawerData.isOpen}
                onClose={handleCloseDrawer}
                transactions={drawerData.transactions}
                title={drawerData.title}
                currency={activeProject?.currency}
            />
        </>
    );
};

export default BudgetTableConsolidated;