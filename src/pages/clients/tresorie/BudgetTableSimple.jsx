import React, {
    useState,
    useMemo,
    useEffect,
    useRef,
    useCallback,
} from 'react';
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
import { deleteEntry, saveEntry } from '../../../components/context/actions.js';
import LectureView from './LectureView.jsx';
import CommentButton from './CommentButton.jsx';
import { useData } from '../../../components/context/DataContext.jsx';
import axios from '../../../components/config/Axios.jsx';
import BudgetTableHeader from './BudgetTableHeader.jsx';
import useRealBudgetData from '../../../hooks/useRealBudgetData.jsx';

// Configuration et fonctions utilitaires
const criticalityConfig = {
    critical: { label: 'Critique', color: 'bg-red-500' },
    essential: { label: 'Essentiel', color: 'bg-yellow-500' },
    discretionary: { label: 'Discrétionnaire', color: 'bg-blue-500' },
};

// Composant pour projets simples
const BudgetTableSimple = (props) => {
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
        onEdit,
    } = props;

    const [isRefreshing, setIsRefreshing] = useState(false);
    const { dataState: contextDataState } = useData();
    const [subCategoryMenuOpen, setSubCategoryMenuOpen] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasNoData, setHasNoData] = useState(false);

    const { realBudgetData, loading: realBudgetLoading } =
        useRealBudgetData(activeProjectId);
    const [collectionData, setCollectionData] = useState({});
    const [loadingCollections, setLoadingCollections] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [drawerData, setDrawerData] = useState({
        isOpen: false,
        transactions: [],
        title: '',
        period: null,
        source: null, // 'entry', 'mainCategory', 'totalEntrees', 'totalSorties', 'netFlow'
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
        return { category: 192, supplier: 160, description: 200 };
    });
    const [isTierSearchOpen, setIsTierSearchOpen] = useState(false);

    const [frequencyFilter, setFrequencyFilter] = useState('all');
    const [isFrequencyFilterOpen, setIsFrequencyFilterOpen] = useState(false);
    const frequencyFilterRef = useRef(null);

    const topScrollRef = useRef(null);
    const mainScrollRef = useRef(null);
    const tierSearchRef = useRef(null);

    const today = getTodayInTimezone(settings.timezoneOffset);
    const currencySettings = useMemo(
        () => ({
            currency: activeProject?.currency,
            displayUnit: activeProject?.display_unit,
            decimalPlaces: activeProject?.decimal_places,
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

    const handleEditBudget = (item, type, event) => {
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
        closeAllMenus();
        if (onEdit) {
            onEdit(item, type);
        } else {
            console.warn('onEdit function is not defined');
            handleEditEntry(item);
        }
    };

    const fetchProjectData = async (projectId, frequencyId = null, forceRefresh = false) => {
        if (!projectId) return;

        if (forceRefresh) {
            setLoading(true);
            setError(null);
            setHasNoData(false);
        }

        try {
            const params = {};

            if (frequencyId && frequencyId !== 'all') {
                params.frequency_id = frequencyId;
            }
            if (forceRefresh) {
                params._t = Date.now();
            }
            const response = await axios.get(`/trezo-tables/projects/${projectId}`, {
                params,
            });
            const data = response.data;
            if (data && data.budgets) {
                const hasBudgetItems = data.budgets.budget_items && data.budgets.budget_items.length > 0;

                if (hasBudgetItems) {
                    setProjectData(data);
                    setHasNoData(false);
                } else {
                    setProjectData({ budgets: { budget_items: [] } });
                    setHasNoData(true);
                }
            } else {
                setProjectData({ budgets: { budget_items: [] } });
                setHasNoData(true);
            }
        } catch (err) {
            console.error('[fetchProjectData] Erreur détaillée:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                url: err.config?.url
            });

            let errorMessage = 'Erreur de chargement des données';

            if (err.response) {
                if (err.response.status === 404) {
                    errorMessage = 'Projet non trouvé';
                } else if (err.response.status === 204) {
                    setProjectData({ budgets: { budget_items: [] } });
                    setHasNoData(true);
                    setError(null);
                    setLoading(false);
                    return;
                } else {
                    errorMessage = err.response.data?.message || `Erreur ${err.response.status}`;
                }
            } else if (err.request) {
                errorMessage = 'Erreur de connexion au serveur';
            } else {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setHasNoData(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectData(activeProjectId, frequencyFilter);
    }, [activeProjectId, frequencyFilter, refreshTrigger]);

    const refreshData = useCallback(async () => {
        try {
            setIsRefreshing(true);
            setRefreshTrigger(prev => prev + 1);

            await new Promise(resolve => setTimeout(resolve, 500));

            if (onRefresh) {
                await onRefresh();
            }
        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [onRefresh]);

    const forceRefreshData = useCallback(() => {
        fetchProjectData(activeProjectId, frequencyFilter, true);
    }, [activeProjectId, frequencyFilter]);

    const processBudgetItems = (budgetItems) => {
        if (!budgetItems || !Array.isArray(budgetItems)) return [];

        return budgetItems.map((item) => {
            let type;
            if (item.category_type_name === 'Revenue') {
                type = 'entree';
            } else if (item.category_type_name === 'Dépense') {
                type = 'sortie';
            } else {
                type = item.budget_type_name === 'Entrée' ? 'entree' : 'sortie';
            }

            const id =
                item.budget_detail_id?.toString() || `budget_${item.budget_id}`;

            return {
                id: id,
                budget_id: item.budget_id,
                budget_detail_id: item.budget_detail_id,
                frequency_id: item.frequency_id,
                frequency_name: item.frequency_name,
                frequency: item.frequency_name,
                budget_amount: parseFloat(item.budget_amount) || 0,
                amount: parseFloat(item.budget_amount) || 0,
                start_date: item.start_date,
                end_date: item.end_date,
                is_duration_indefinite: item.is_duration_indefinite,
                budget_description: item.project_description,
                description: item.budget_description,
                project_id: item.project_id,
                project_name: item.project_name,
                project_description: item.project_description,
                budget_type_id: item.budget_type_id,
                budget_type_name: item.budget_type_name,
                user_third_party_id: item.user_third_party_id,
                third_party_name: item.third_party_name,
                third_party_firstname: item.third_party_firstname,
                supplier:
                    `${item.third_party_firstname || ''} ${item.third_party_name || ''
                        }`.trim() || 'Non spécifié',
                third_party_email: item.third_party_email,
                amount_type_id: item.amount_type_id,
                amount_type_name: item.amount_type_name,
                amount_type_description: item.amount_type_description,
                currency_id: item.currency_id,
                currency_name: item.currency_name,
                currency_code: item.currency_code,
                currency_symbol: item.currency_symbol,
                user_subscriber_id: item.user_subscriber_id,
                subscriber_name: item.subscriber_name,
                subscriber_firstname: item.subscriber_firstname,
                subscriber_email: item.subscriber_email,
                sub_category_id: item.sub_category_id,
                sub_category_name: item.sub_category_name,
                category: item.sub_category_name,
                criticity_id: item.criticity_id,
                criticity_name: item.criticity_name,
                category_id: item.category_id,
                category_name: item.category_name,
                category_type_id: item.category_type_id,
                category_type_name: item.category_type_name,
                entity_status_id: item.entity_status_id,
                entity_status_name: item.entity_status_name,
                type: type,
                isProvision: false,
                is_vat_child: false,
                is_vat_payment: false,
                is_tax_payment: false,
                date: item.start_date,
                startDate: item.start_date ? new Date(item.start_date) : null,
                endDate: item.end_date ? new Date(item.end_date) : null,
            };
        });
    };

    const processedBudgetEntries = useMemo(() => {
        if (
            projectData &&
            projectData.budgets &&
            projectData.budgets.budget_items
        ) {
            const processed = processBudgetItems(projectData.budgets.budget_items);
            return processed;
        }
        return finalBudgetEntries || [];
    }, [projectData, finalBudgetEntries]);

    const periods = useMemo(() => {
        const todayDate = getTodayInTimezone(settings.timezoneOffset);
        let baseDate;
        switch (timeUnit) {
            case 'day':
                baseDate = new Date(todayDate);
                baseDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                baseDate = getStartOfWeek(todayDate);
                break;
            case 'fortnightly':
                const day = todayDate.getDate();
                baseDate = new Date(
                    todayDate.getFullYear(),
                    todayDate.getMonth(),
                    day <= 15 ? 1 : 16
                );
                break;
            case 'month':
                baseDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
                break;
            case 'bimonthly':
                const bimonthStartMonth = Math.floor(todayDate.getMonth() / 2) * 2;
                baseDate = new Date(todayDate.getFullYear(), bimonthStartMonth, 1);
                break;
            case 'quarterly':
                const quarterStartMonth = Math.floor(todayDate.getMonth() / 3) * 3;
                baseDate = new Date(todayDate.getFullYear(), quarterStartMonth, 1);
                break;
            case 'semiannually':
                const semiAnnualStartMonth = Math.floor(todayDate.getMonth() / 6) * 6;
                baseDate = new Date(todayDate.getFullYear(), semiAnnualStartMonth, 1);
                break;
            case 'annually':
                baseDate = new Date(todayDate.getFullYear(), 0, 1);
                break;
            default:
                baseDate = getStartOfWeek(todayDate);
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
                'Jan',
                'Fév',
                'Mar',
                'Avr',
                'Mai',
                'Juin',
                'Juil',
                'Août',
                'Sep',
                'Oct',
                'Nov',
                'Déc',
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
                    label = `${fortnightNum}Q-${monthsShort[periodStart.getMonth()]
                        }'${year}`;
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
        if (finalCashAccounts && finalCashAccounts.length > 0) {
            return finalCashAccounts;
        }

        if (
            contextDataState.allCashAccounts &&
            activeProjectId &&
            contextDataState.allCashAccounts[activeProjectId]?.length > 0
        ) {
            return contextDataState.allCashAccounts[activeProjectId];
        }

        if (activeProjectId && activeProjectId !== 'null') {
            return [
                {
                    id: `default-account-${activeProjectId}`,
                    name: 'Compte Principal',
                    initialBalance: 10000,
                    currentBalance: 10000,
                    initialBalanceDate: new Date().toISOString().split('T')[0],
                    projectId: activeProjectId,
                },
            ];
        }

        return [
            {
                id: 'default-account-demo',
                name: 'Compte Principal',
                initialBalance: 10000,
                currentBalance: 10000,
                initialBalanceDate: new Date().toISOString().split('T')[0],
            },
        ];
    }, [finalCashAccounts, contextDataState.allCashAccounts, activeProjectId]);

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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fonction pour normaliser les transactions
    const processActualTransactions = useCallback(() => {
        console.log('🔍 Processing actual transactions from API data');

        // Si vous avez des données d'API avec real_budgets
        if (projectData?.real_budgets?.real_budget_items?.data) {
            console.log('📊 Found real_budgets in projectData:', projectData.real_budgets.real_budget_items.data.length, 'items');

            // Transformer les real_budgets en transactions
            return projectData.real_budgets.real_budget_items.data.map(realBudget => {
                console.log('💰 Real budget item:', realBudget);
                return {
                    id: `real_${realBudget.budget_id}_${realBudget.collection_date}`,
                    budgetId: realBudget.budget_id?.toString(),
                    budget_id: realBudget.budget_id,
                    thirdParty: 'Collecté', // Vous devrez peut-être récupérer le tiers depuis le budget correspondant
                    type: 'receivable', // À déterminer selon le type de budget
                    cashAccount: 'default', // À compléter selon vos données
                    payments: [{
                        id: `payment_${realBudget.budget_id}_${realBudget.collection_date}`,
                        paymentDate: realBudget.collection_date,
                        paidAmount: parseFloat(realBudget.collection_amount) || 0,
                        status: 'paid'
                    }]
                };
            });
        }

        // Si vous avez finalActualTransactions depuis les props
        if (finalActualTransactions && Array.isArray(finalActualTransactions)) {
            console.log('📊 Using finalActualTransactions from props:', finalActualTransactions.length, 'items');

            return finalActualTransactions.map(transaction => {
                // Normaliser la structure
                return {
                    id: transaction.id || `trans_${Math.random()}`,
                    budgetId: transaction.budgetId || transaction.budget_id,
                    budget_detail_id: transaction.budget_detail_id,
                    thirdParty: transaction.thirdParty || transaction.third_party,
                    type: transaction.type,
                    cashAccount: transaction.cashAccount || transaction.cash_account,
                    payments: Array.isArray(transaction.payments)
                        ? transaction.payments.map(p => ({
                            id: p.id || `pay_${Math.random()}`,
                            paymentDate: p.paymentDate || p.date || p.payment_date,
                            paidAmount: p.paidAmount || p.amount,
                            status: p.status
                        }))
                        : [],
                };
            });
        }

        console.warn('❌ No actual transactions found');
        return [];
    }, [projectData, finalActualTransactions]);

    const normalizedTransactions = useMemo(() => processActualTransactions(), [processActualTransactions]);

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
        const todayDate = getTodayInTimezone(settings.timezoneOffset);
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
                const dayOfWeek = todayDate.getDay();
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
                const year = todayDate.getFullYear();
                const month = todayDate.getMonth();
                const firstDayOfMonth = new Date(year, month, 1);
                const lastDayOfMonth = new Date(year, month + 1, 0);

                const startOfWeekOfFirstDay = getStartOfWeek(firstDayOfMonth);
                const startOfWeekOfLastDay = getStartOfWeek(lastDayOfMonth);

                const horizon =
                    Math.round(
                        (startOfWeekOfLastDay - startOfWeekOfFirstDay) /
                        (1000 * 60 * 60 * 24 * 7)
                    ) + 1;

                const startOfCurrentWeek = getStartOfWeek(todayDate);
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
                const currentQuarterStartMonth = Math.floor(todayDate.getMonth() / 3) * 3;
                const firstDayOfQuarter = new Date(
                    todayDate.getFullYear(),
                    currentQuarterStartMonth,
                    1
                );
                const currentFortnightStart = new Date(
                    todayDate.getFullYear(),
                    todayDate.getMonth(),
                    todayDate.getDate() <= 15 ? 1 : 16
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
                const currentMonth = todayDate.getMonth();
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
        const onSave = (entryData) => {
            const user = dataState.session?.user;
            if (!user) return;
            const targetProjectId = entryData.projectId || activeProjectId;
            const cashAccountsForEntry =
                dataState.allCashAccounts[targetProjectId] || [];
            saveEntry(
                { dataDispatch, uiDispatch, dataState },
                {
                    entryData,
                    editingEntry: null,
                    activeProjectId: targetProjectId,
                    user,
                    tiers: dataState.tiers,
                    cashAccounts: cashAccountsForEntry,
                    exchangeRates: dataState.exchangeRates,
                }
            );
        };
        uiDispatch({ type: 'OPEN_BUDGET_DRAWER', payload: { onSave } });
    };

    const handleEditEntry = (entry) => {
        if (entry.is_vat_payment || entry.is_tax_payment) return;
        const originalEntryId = entry.is_vat_child
            ? entry.id.replace('_vat', '')
            : entry.id;

        const originalEntry = processedBudgetEntries.find(
            (e) => e.id === originalEntryId
        );

        if (originalEntry) {
            const onSave = (entryData) => {
                const user = dataState.session?.user;
                if (!user) return;
                const targetProjectId = entryData.projectId || activeProjectId;
                const cashAccountsForEntry =
                    dataState.allCashAccounts[targetProjectId] || [];
                saveEntry(
                    { dataDispatch, uiDispatch, dataState },
                    {
                        entryData,
                        editingEntry: originalEntry,
                        activeProjectId: targetProjectId,
                        user,
                        tiers: dataState.tiers,
                        cashAccounts: cashAccountsForEntry,
                        exchangeRates: dataState.exchangeRates,
                    }
                ).then(() => {
                    console.log('✅ Entrée modifiée, rafraîchissement des données...');
                    refreshData();
                });
            };

            const onDelete = () => handleDeleteEntry(originalEntry);
            uiDispatch({
                type: 'OPEN_BUDGET_DRAWER',
                payload: { entry: originalEntry, onSave, onDelete },
            });
        }
    };

    const handleDeleteEntry = (entry) => {
        if (entry.is_vat_payment || entry.is_tax_payment) {
            return;
        }

        const originalEntryId = entry.is_vat_child
            ? entry.id.replace('_vat', '')
            : entry.id;

        const originalEntry = processedBudgetEntries.find(
            (e) => e.id === originalEntryId
        );

        if (!originalEntry) return;

        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: `Supprimer "${originalEntry.supplier}" ?`,
                message:
                    "Cette action est irréversible et supprimera l'entrée budgétaire et ses prévisions.",
                onConfirm: () =>
                    deleteEntry(
                        { dataDispatch, uiDispatch },
                        {
                            entryId: originalEntry.budget_id || originalEntry.id,
                            entryProjectId: originalEntry.projectId,
                        }
                    ).then(() => {
                        console.log('✅ Entrée supprimée, rafraîchissement des données...');
                        refreshData();
                    }),
            },
        });
    };

    const filteredBudgetEntries = useMemo(() => {
        let entries = processedBudgetEntries || [];

        if (searchTerm) {
            entries = entries.filter((entry) =>
                entry.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
            );
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
                const epargneMainCategory = finalCategories.expense?.find(
                    (cat) => cat.name === 'Épargne'
                );
                const epargneSubCategories = epargneMainCategory
                    ? epargneMainCategory.subCategories?.map((sc) => sc.name) || []
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
        false, // isConsolidated
        false, // isCustomConsolidated
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

    const getTransactionsForPeriod = useCallback((period, source, context = {}) => {
        console.log('=== getTransactionsForPeriod DEBUG ===');
        console.log('Source:', source);
        console.log('Period:', period?.label);
        console.log('Total normalized transactions:', normalizedTransactions.length);
        console.log('Total entries:', filteredExpandedAndVatEntries.length);

        let transactions = [];
        const periodStart = new Date(period.startDate);
        const periodEnd = new Date(period.endDate);

        // Récupérer le projet actif
        const currentProject = projects?.find(p => p.id === activeProjectId) || activeProject;
        const projectName = currentProject?.name || 'Projet inconnu';

        switch (source) {
            case 'entry':
                const entry = context.entry;
                if (entry) {
                    console.log('Entry details:', {
                        id: entry.id,
                        budget_id: entry.budget_id,
                        budget_detail_id: entry.budget_detail_id,
                        supplier: entry.supplier,
                        description: entry.description,
                        // Vérifier si le projet est inclus dans l'entrée
                        project_name: entry.project_name,
                        project_description: entry.project_description
                    });

                    // Chercher les transactions qui correspondent
                    const matchingTransactions = normalizedTransactions.filter(t => {
                        const matches = t.budgetId === entry.id ||
                            t.budgetId === entry.budget_id ||
                            t.budget_detail_id === entry.budget_detail_id;

                        if (matches) {
                            console.log('✅ Matching transaction found:', {
                                transactionId: t.id,
                                budgetId: t.budgetId,
                                thirdParty: t.thirdParty,
                                paymentsCount: t.payments?.length || 0
                            });
                        }
                        return matches;
                    });

                    console.log('Matching transactions count:', matchingTransactions.length);

                    // Extraire les paiements pour la période
                    transactions = matchingTransactions.flatMap(t => {
                        return (t.payments || [])
                            .filter(p => {
                                if (!p.paymentDate) {
                                    console.warn('⚠️ Payment without date:', p);
                                    return false;
                                }
                                try {
                                    const paymentDate = new Date(p.paymentDate);
                                    const inPeriod = paymentDate >= periodStart && paymentDate < periodEnd;
                                    return inPeriod;
                                } catch (error) {
                                    console.error('❌ Error parsing payment date:', p.paymentDate, error);
                                    return false;
                                }
                            })
                            .map(p => ({
                                ...p,
                                id: p.id || `${t.id}_${p.paymentDate}`,
                                // CORRECTION : Priorité au supplier de l'entrée
                                thirdParty: entry.supplier || t.thirdParty || 'Non spécifié',
                                type: t.type || (entry.type === 'entree' ? 'receivable' : 'payable'),
                                entryName: entry.supplier || entry.description || entry.budget_description,
                                category: entry.category || entry.sub_category_name || 'Non catégorisé',
                                cashAccount: t.cashAccount,
                                // CORRECTION : Ajouter le projet seulement si différent du projet actuel
                                project_id: entry.project_id || activeProjectId,
                                project_name: (entry.project_id !== activeProjectId && entry.project_name)
                                    ? entry.project_name
                                    : projectName,
                                // Informations supplémentaires
                                budget_id: entry.budget_id,
                                budget_detail_id: entry.budget_detail_id,
                                frequency: entry.frequency_name || entry.frequency,
                                currency: entry.currency_code || activeProject?.currency || 'EUR',
                                // Ajouter le type de flux pour identification
                                flowType: entry.type === 'entree' ? 'entree' : 'sortie'
                            }));
                    });

                    console.log('📋 Final transactions for entry:', transactions.length);
                }
                break;

            case 'mainCategory':
                const mainCategory = context.mainCategory;
                if (mainCategory && mainCategory.entries) {
                    console.log('MainCategory:', mainCategory.name);
                    console.log('Entries in category:', mainCategory.entries.length);

                    mainCategory.entries.forEach(entry => {
                        const matchingTransactions = normalizedTransactions.filter(t =>
                            t.budgetId === entry.id ||
                            t.budgetId === entry.budget_id ||
                            t.budget_detail_id === entry.budget_detail_id
                        );

                        matchingTransactions.forEach(t => {
                            const categoryPayments = (t.payments || [])
                                .filter(p => {
                                    if (!p.paymentDate) return false;
                                    try {
                                        const paymentDate = new Date(p.paymentDate);
                                        return paymentDate >= periodStart && paymentDate < periodEnd;
                                    } catch (error) {
                                        return false;
                                    }
                                })
                                .map(p => ({
                                    ...p,
                                    id: p.id || `${t.id}_${p.paymentDate}`,
                                    thirdParty: entry.supplier || t.thirdParty || 'Non spécifié',
                                    type: t.type || (entry.type === 'entree' ? 'receivable' : 'payable'),
                                    entryName: entry.supplier || entry.description || entry.budget_description,
                                    category: entry.category || entry.sub_category_name || 'Non catégorisé',
                                    mainCategory: mainCategory.name,
                                    cashAccount: t.cashAccount,
                                    // CORRECTION : Ajouter le projet seulement si différent du projet actuel
                                    project_id: entry.project_id || activeProjectId,
                                    project_name: (entry.project_id !== activeProjectId && entry.project_name)
                                        ? entry.project_name
                                        : projectName,
                                    budget_id: entry.budget_id,
                                    budget_detail_id: entry.budget_detail_id,
                                    currency: entry.currency_code || activeProject?.currency || 'EUR',
                                    flowType: entry.type === 'entree' ? 'entree' : 'sortie'
                                }));

                            transactions.push(...categoryPayments);
                        });
                    });

                    console.log('📋 Transactions for mainCategory:', transactions.length);
                }
                break;

            case 'totalEntrees':
                console.log('Looking for all entree transactions');
                const allEntrees = groupedData.entree || [];

                allEntrees.forEach(mainCategory => {
                    (mainCategory.entries || []).forEach(entry => {
                        const matchingTransactions = normalizedTransactions.filter(t =>
                            t.budgetId === entry.id ||
                            t.budgetId === entry.budget_id ||
                            t.budget_detail_id === entry.budget_detail_id
                        );

                        matchingTransactions.forEach(t => {
                            const categoryPayments = (t.payments || [])
                                .filter(p => {
                                    if (!p.paymentDate) return false;
                                    try {
                                        const paymentDate = new Date(p.paymentDate);
                                        return paymentDate >= periodStart && paymentDate < periodEnd;
                                    } catch (error) {
                                        return false;
                                    }
                                })
                                .map(p => ({
                                    ...p,
                                    id: p.id || `${t.id}_${p.paymentDate}`,
                                    thirdParty: entry.supplier || t.thirdParty || 'Non spécifié',
                                    type: t.type || 'receivable',
                                    entryName: entry.supplier || entry.description || entry.budget_description,
                                    category: entry.category || entry.sub_category_name || 'Non catégorisé',
                                    mainCategory: mainCategory.name,
                                    flowType: 'entree',
                                    cashAccount: t.cashAccount,
                                    // CORRECTION : Ajouter le projet seulement si différent du projet actuel
                                    project_id: entry.project_id || activeProjectId,
                                    project_name: (entry.project_id !== activeProjectId && entry.project_name)
                                        ? entry.project_name
                                        : projectName,
                                    budget_id: entry.budget_id,
                                    budget_detail_id: entry.budget_detail_id,
                                    currency: entry.currency_code || activeProject?.currency || 'EUR'
                                }));

                            transactions.push(...categoryPayments);
                        });
                    });
                });

                console.log('📋 Total entree transactions:', transactions.length);
                break;

            case 'totalSorties':
                console.log('Looking for all sortie transactions');
                const allSorties = groupedData.sortie || [];

                allSorties.forEach(mainCategory => {
                    (mainCategory.entries || []).forEach(entry => {
                        const matchingTransactions = normalizedTransactions.filter(t =>
                            t.budgetId === entry.id ||
                            t.budgetId === entry.budget_id ||
                            t.budget_detail_id === entry.budget_detail_id
                        );

                        matchingTransactions.forEach(t => {
                            const categoryPayments = (t.payments || [])
                                .filter(p => {
                                    if (!p.paymentDate) return false;
                                    try {
                                        const paymentDate = new Date(p.paymentDate);
                                        return paymentDate >= periodStart && paymentDate < periodEnd;
                                    } catch (error) {
                                        return false;
                                    }
                                })
                                .map(p => ({
                                    ...p,
                                    id: p.id || `${t.id}_${p.paymentDate}`,
                                    thirdParty: entry.supplier || t.thirdParty || 'Non spécifié',
                                    type: t.type || 'payable',
                                    entryName: entry.supplier || entry.description || entry.budget_description,
                                    category: entry.category || entry.sub_category_name || 'Non catégorisé',
                                    mainCategory: mainCategory.name,
                                    flowType: 'sortie',
                                    cashAccount: t.cashAccount,
                                    // CORRECTION : Ajouter le projet seulement si différent du projet actuel
                                    project_id: entry.project_id || activeProjectId,
                                    project_name: (entry.project_id !== activeProjectId && entry.project_name)
                                        ? entry.project_name
                                        : projectName,
                                    budget_id: entry.budget_id,
                                    budget_detail_id: entry.budget_detail_id,
                                    currency: entry.currency_code || activeProject?.currency || 'EUR'
                                }));

                            transactions.push(...categoryPayments);
                        });
                    });
                });

                console.log('📋 Total sortie transactions:', transactions.length);
                break;

            case 'netFlow':
                console.log('Looking for all transactions (net flow)');
                const allCategories = [...(groupedData.entree || []), ...(groupedData.sortie || [])];

                allCategories.forEach(mainCategory => {
                    (mainCategory.entries || []).forEach(entry => {
                        const matchingTransactions = normalizedTransactions.filter(t =>
                            t.budgetId === entry.id ||
                            t.budgetId === entry.budget_id ||
                            t.budget_detail_id === entry.budget_detail_id
                        );

                        matchingTransactions.forEach(t => {
                            const categoryPayments = (t.payments || [])
                                .filter(p => {
                                    if (!p.paymentDate) return false;
                                    try {
                                        const paymentDate = new Date(p.paymentDate);
                                        return paymentDate >= periodStart && paymentDate < periodEnd;
                                    } catch (error) {
                                        return false;
                                    }
                                })
                                .map(p => ({
                                    ...p,
                                    id: p.id || `${t.id}_${p.paymentDate}`,
                                    thirdParty: entry.supplier || t.thirdParty || 'Non spécifié',
                                    type: t.type || (mainCategory.type === 'entree' ? 'receivable' : 'payable'),
                                    entryName: entry.supplier || entry.description || entry.budget_description,
                                    category: entry.category || entry.sub_category_name || 'Non catégorisé',
                                    mainCategory: mainCategory.name,
                                    flowType: mainCategory.type || (t.type === 'receivable' ? 'entree' : 'sortie'),
                                    cashAccount: t.cashAccount,
                                    // CORRECTION : Ajouter le projet seulement si différent du projet actuel
                                    project_id: entry.project_id || activeProjectId,
                                    project_name: (entry.project_id !== activeProjectId && entry.project_name)
                                        ? entry.project_name
                                        : projectName,
                                    budget_id: entry.budget_id,
                                    budget_detail_id: entry.budget_detail_id,
                                    currency: entry.currency_code || activeProject?.currency || 'EUR'
                                }));

                            transactions.push(...categoryPayments);
                        });
                    });
                });

                console.log('📋 Net flow transactions:', transactions.length);
                break;

            default:
                console.warn('Unknown source:', source);
        }

        console.log('🔚 Returning transactions:', transactions.length);

        // Ajouter un logging détaillé pour le débogage
        if (transactions.length > 0) {
            console.log('📝 Sample transactions (first 2):', transactions.slice(0, 2).map(t => ({
                id: t.id,
                thirdParty: t.thirdParty,
                entryName: t.entryName,
                project_name: t.project_name,
                project_id: t.project_id,
                category: t.category,
                flowType: t.flowType,
                amount: t.paidAmount,
                date: t.paymentDate
            })));
        }

        return transactions;
    }, [
        normalizedTransactions,
        groupedData,
        filteredExpandedAndVatEntries,
        projects,
        activeProjectId,
        activeProject
    ]);


    // Ajoutez un effet pour déboguer
    useEffect(() => {
        console.log('=== TRANSACTIONS DEBUG ===');
        console.log('finalActualTransactions:', {
            count: finalActualTransactions?.length || 0,
            sample: finalActualTransactions?.slice(0, 2)
        });
        console.log('normalizedTransactions:', {
            count: normalizedTransactions.length,
            sample: normalizedTransactions.slice(0, 2)
        });
        console.log('filteredExpandedAndVatEntries:', {
            count: filteredExpandedAndVatEntries.length,
            sample: filteredExpandedAndVatEntries.slice(0, 2).map(e => ({
                id: e.id,
                budget_id: e.budget_id,
                supplier: e.supplier
            }))
        });
    }, [finalActualTransactions, normalizedTransactions, filteredExpandedAndVatEntries]);

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

    const handleOpenPaymentDrawer = (entry, period) => {
        const entryActuals = finalActualTransactions.filter(
            (actual) => actual.budgetId === entry.id
        );

        uiDispatch({
            type: 'OPEN_INLINE_PAYMENT_DRAWER',
            payload: {
                actuals: entryActuals,
                entry: entry,
                period: period,
                periodLabel: period.label,
            },
        });
    };

    const handleActualClick = (context) => {
        console.log('handleActualClick called with context:', context);

        const { period, type, entry, mainCategory, source = 'entry' } = context;
        let transactions = [];
        let title = '';

        console.log('Source:', source);
        console.log('Period:', period?.label);

        if (!period) {
            console.error('No period provided!');
            return;
        }

        switch (source) {
            case 'entry':
                console.log('Entry click:', entry?.supplier);
                if (entry) {
                    transactions = getTransactionsForPeriod(period, 'entry', { entry });
                    // CORRECTION : Utiliser le supplier comme titre principal, sans projet
                    title = `Détails pour ${entry?.supplier || entry?.description || 'Entrée'}`;
                    console.log('Entry transactions found:', transactions.length);
                }
                break;

            case 'mainCategory':
                console.log('MainCategory click:', mainCategory?.name);
                if (mainCategory) {
                    transactions = getTransactionsForPeriod(period, 'mainCategory', { mainCategory });
                    title = `Détails pour ${mainCategory.name}`;
                    console.log('MainCategory transactions found:', transactions.length);
                }
                break;

            case 'totalEntrees':
                transactions = getTransactionsForPeriod(period, 'totalEntrees');
                title = 'Détails de toutes les entrées';
                console.log('TotalEntrees transactions found:', transactions.length);
                break;

            case 'totalSorties':
                transactions = getTransactionsForPeriod(period, 'totalSorties');
                title = 'Détails de toutes les sorties';
                console.log('TotalSorties transactions found:', transactions.length);
                break;

            case 'netFlow':
                transactions = getTransactionsForPeriod(period, 'netFlow');
                title = 'Détails du flux de trésorerie';
                console.log('NetFlow transactions found:', transactions.length);
                break;

            default:
                console.warn('Unknown source:', source);
        }

        console.log('Final transactions to display:', transactions.length);

        // Log supplémentaire pour voir ce qui est transmis
        if (transactions.length > 0) {
            console.log('Sample transaction data:', {
                firstTransaction: {
                    thirdParty: transactions[0].thirdParty,
                    entryName: transactions[0].entryName,
                    project_name: transactions[0].project_name,
                    category: transactions[0].category
                }
            });
        }

        // Ouvrir le drawer
        setDrawerData({
            isOpen: true,
            transactions: transactions,
            // CORRECTION : Titre simplifié - seulement l'entrée et la période
            title: `${title} - ${period.label}`,
            period: period,
            source: source,
        });
        console.log('Drawer opened with', transactions.length, 'transactions');
    };

    const handleCloseDrawer = () =>
        setDrawerData({
            isOpen: false,
            transactions: [],
            title: '',
            period: null,
            source: null
        });

    const handleDrillDown = () => {
        const newCollapsedState = {};
        groupedData.entree?.forEach(
            (mainCat) => (newCollapsedState[mainCat.id] = false)
        );
        groupedData.sortie?.forEach(
            (mainCat) => (newCollapsedState[mainCat.id] = false)
        );
        setCollapsedItems(newCollapsedState);
        setIsEntreesCollapsed(false);
        setIsSortiesCollapsed(false);
    };

    const handleDrillUp = () => {
        const newCollapsedState = {};
        groupedData.entree?.forEach(
            (mainCat) => (newCollapsedState[mainCat.id] = true)
        );
        groupedData.sortie?.forEach(
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
        (visibleColumns.description ? columnWidths.description : 0);
    const totalTableWidth =
        fixedColsWidth +
        separatorWidth +
        periods.length * (periodColumnWidth + separatorWidth);
    const totalCols = 4 + periods.length * 2;

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
                                                        rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'
                                                            }`}
                                                        columnName={`${period.label} (Prév.)`}
                                                    />
                                                </div>
                                            )}
                                            {visibleColumns.actual && (
                                                <div className="relative text-center group/subcell">
                                                    <button
                                                        onClick={(e) => {
                                                            console.log('Total button clicked');
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            if (totals.actual !== 0) {
                                                                handleActualClick({
                                                                    type,
                                                                    period,
                                                                    source: isEntree ? 'totalEntrees' : 'totalSorties'
                                                                });
                                                            }
                                                        }}
                                                        disabled={totals.actual === 0}
                                                        className="font-normal text-text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {formatCurrency(totals.actual, currencySettings)}
                                                    </button>
                                                    <CommentButton
                                                        rowId={rowId}
                                                        columnId={`${columnIdBase}_actual`}
                                                        rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'
                                                            }`}
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
                                                                            console.log('Main category button clicked');
                                                                            e.stopPropagation();
                                                                            e.preventDefault();
                                                                            if (totals.actual !== 0) {
                                                                                handleActualClick({
                                                                                    mainCategory,
                                                                                    period,
                                                                                    source: 'mainCategory'
                                                                                });
                                                                            }
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
                                                            <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                                                                <button
                                                                    onClick={(event) => handleEditBudget(entry, 'entry', event)}
                                                                    className="p-1 text-blue-500 hover:text-blue-700"
                                                                >
                                                                    <Edit size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteEntry(entry)}
                                                                    className="p-1 text-red-500 hover:text-red-700"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {visibleColumns.description !== false && (
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
                                                    <td className="bg-surface"></td>
                                                    {periods.map((period, periodIndex) => {
                                                        const budget = calculateEntryAmountForPeriod(
                                                            entry,
                                                            period.startDate,
                                                            period.endDate
                                                        );
                                                        const actual = calculateActualAmountForPeriod(
                                                            entry,
                                                            finalActualTransactions,
                                                            period.startDate,
                                                            period.endDate,
                                                            realBudgetData
                                                        );
                                                        const reste = budget - actual;
                                                        const columnIdBase = period.startDate.toISOString();
                                                        return (
                                                            <React.Fragment key={periodIndex}>
                                                                <td
                                                                    className="px-1 py-1"
                                                                    style={periodCellStyle}
                                                                >
                                                                    {numVisibleCols > 0 && (
                                                                        <div className="grid grid-cols-3 gap-1 text-xs">
                                                                            {visibleColumns.budget && (
                                                                                <div className="relative text-center text-gray-500 group/subcell">
                                                                                    {formatCurrency(
                                                                                        budget,
                                                                                        currencySettings
                                                                                    )}
                                                                                    <CommentButton
                                                                                        rowId={entry.id}
                                                                                        columnId={`${columnIdBase}_budget`}
                                                                                        rowName={entry.supplier}
                                                                                        columnName={`${period.label} (Prév.)`}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            {visibleColumns.actual && (
                                                                                <div className="relative text-center group/subcell">
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            console.log('Entry actual button clicked');
                                                                                            e.stopPropagation();
                                                                                            e.preventDefault();
                                                                                            handleActualClick({
                                                                                                entry,
                                                                                                period,
                                                                                                source: 'entry'
                                                                                            });
                                                                                        }}
                                                                                        disabled={
                                                                                            actual === 0 && budget === 0
                                                                                        }
                                                                                        className={`hover:underline disabled:cursor-not-allowed disabled:text-gray-400 ${realBudgetData?.real_budget_items
                                                                                            ?.data &&
                                                                                            realBudgetData.real_budget_items.data.some(
                                                                                                (rb) =>
                                                                                                    (rb.budget_id ===
                                                                                                        entry.budget_id ||
                                                                                                        rb.project_id ===
                                                                                                        entry.project_id) &&
                                                                                                    rb.collection_date &&
                                                                                                    new Date(
                                                                                                        rb.collection_date
                                                                                                    ) >= period.startDate &&
                                                                                                    new Date(
                                                                                                        rb.collection_date
                                                                                                    ) <= period.endDate
                                                                                            )
                                                                                            ? 'font-semibold text-green-600'
                                                                                            : entry.collectionData
                                                                                                ?.collection?.length > 0
                                                                                                ? 'font-semibold text-blue-600'
                                                                                                : 'text-blue-600'
                                                                                            }`}
                                                                                        title={
                                                                                            realBudgetData?.real_budget_items
                                                                                                ?.data &&
                                                                                                realBudgetData.real_budget_items.data.some(
                                                                                                    (rb) =>
                                                                                                        (rb.budget_id ===
                                                                                                            entry.budget_id ||
                                                                                                            rb.project_id ===
                                                                                                            entry.project_id) &&
                                                                                                        rb.collection_date &&
                                                                                                        new Date(
                                                                                                            rb.collection_date
                                                                                                        ) >= period.startDate &&
                                                                                                        new Date(
                                                                                                            rb.collection_date
                                                                                                        ) <= period.endDate
                                                                                                )
                                                                                                ? 'Montant provenant des données real_budget API'
                                                                                                : entry.collectionData
                                                                                                    ?.collection?.length > 0
                                                                                                    ? 'Montant provenant des collections'
                                                                                                    : 'Montant provenant des paiements'
                                                                                        }
                                                                                    >
                                                                                        {formatCurrency(
                                                                                            actual,
                                                                                            currencySettings
                                                                                        )}
                                                                                    </button>
                                                                                    <CommentButton
                                                                                        rowId={entry.id}
                                                                                        columnId={`${columnIdBase}_actual`}
                                                                                        rowName={entry.supplier}
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
                                                                                {formatCurrency(
                                                                                    reste,
                                                                                    currencySettings
                                                                                )}
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

    useEffect(() => {
        if (loading) {
            return;
        }
    }, [loading]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Chargement des données...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-red-500">Erreur: {error}</div>
                <button
                    onClick={() => fetchProjectData(activeProjectId, frequencyFilter)}
                    className="px-4 py-2 ml-4 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                    Réessayer
                </button>
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
                <div className={`relative mb-6 transition-opacity duration-300 ${
                    drawerData.isOpen ? 'opacity-50 pointer-events-none' : ''
                }`}>
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
                                                placeholder="Rechercher..."
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
                                        {effectiveCashAccounts.length} compte(s) - Solde initial
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
                                                                    onClick={(e) => {
                                                                        console.log('Net flow button clicked');
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        if (netActual !== 0) {
                                                                            handleActualClick({
                                                                                type: 'net',
                                                                                period,
                                                                                source: 'netFlow'
                                                                            });
                                                                        }
                                                                    }}
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
                period={drawerData.period}
                dataState={dataState}
                projects={projects}
                activeProject={activeProject}
            />
        </>
    );
};

export default BudgetTableSimple;