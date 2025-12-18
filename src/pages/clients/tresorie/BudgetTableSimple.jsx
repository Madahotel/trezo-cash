import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useData } from '../../../components/context/DataContext.jsx';
import axios from '../../../components/config/Axios.jsx';
import useRealBudgetData from '../../../hooks/useRealBudgetData.jsx';
import { getTodayInTimezone } from '../../../utils/getTodayInTimezone.js';
import { formatCurrency } from '../../../utils/formatting.js';
import BudgetDataManager from './BudgetDataManager.jsx';
import BudgetTableUI from './BudgetTableUI.jsx';
import LectureView from './LectureView.jsx';
import TransactionDetailDrawer from './TransactionDetailDrawer.jsx';
import BudgetTableHeader from './BudgetTableHeader.jsx';

// Configurations
const criticalityConfig = {
    critical: { label: 'Critique', color: 'bg-red-500' },
    essential: { label: 'Essentiel', color: 'bg-yellow-500' },
    discretionary: { label: 'Discrétionnaire', color: 'bg-blue-500' },
};

const frequencyDisplayConfig = {
    '1': { timeUnit: 'day', horizonLength: 30, label: 'Par jour (ponctuel)' },
    '2': { timeUnit: 'day', horizonLength: 30, label: 'Par jour' },
    '3': { timeUnit: 'month', horizonLength: 6, label: 'Par mois' },
    '4': { timeUnit: 'week', horizonLength: 12, label: 'Par semaine' },
    '5': { timeUnit: 'month', horizonLength: 12, label: 'Par mois' },
    '6': { timeUnit: 'quarterly', horizonLength: 4, label: 'Par trimestre' },
    '7': { timeUnit: 'semiannually', horizonLength: 2, label: 'Par semestre' },
    '8': { timeUnit: 'annually', horizonLength: 3, label: 'Par année' },
    'all': { timeUnit: 'month', horizonLength: 6, label: 'Mixte (selon fréquence)' }
};

// Fonction pour mapper timeView à timeRange
const getTimeRangeFromView = (timeView) => {
    const viewToRangeMap = {
        day: 'P1D',
        week: 'P7D',
        month: 'P1M',
        bimester: 'P2M',
        trimester: 'P3M',
        semester: 'P6M',
        year: 'P1Y',
        year3: 'P3Y',
        year5: 'P5Y',
        year7: 'P7Y',
    };
    return viewToRangeMap[timeView] || 'P1M'; // Par défaut: mois
};

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
        visibleColumns = { description: true, project: true, budget: true, actual: true },
        tableauMode = 'edition',
        setTableauMode,
        showTemporalToolbar = true,
        showViewModeSwitcher = true,
        showNewEntryButton = true,
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
        timeRange: externalTimeRange // Si fourni de l'extérieur
    } = props;

    // États
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [drawerData, setDrawerData] = useState({
        isOpen: false,
        transactions: [],
        title: '',
        period: null,
        source: null,
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
    const [timeView, setTimeView] = useState('trimester');
    const [monthDisplayMode, setMonthDisplayMode] = useState('byMonth');
    const [showTotals, setShowTotals] = useState(true);

    // Calculer timeRange à partir de timeView
    const timeRange = useMemo(() => {
        // Priorité: 1. externalTimeRange, 2. calculé à partir de timeView
        return externalTimeRange || getTimeRangeFromView(timeView);
    }, [externalTimeRange, timeView]);

    // Références
    const topScrollRef = useRef(null);
    const mainScrollRef = useRef(null);
    const tierSearchRef = useRef(null);
    const frequencyFilterRef = useRef(null);

    // Context et hooks
    const { dataState: contextDataState } = useData();
    const { realBudgetData, loading: realBudgetLoading } = useRealBudgetData(activeProjectId);

    const today = useMemo(() =>
        getTodayInTimezone(settings?.timezoneOffset || 0),
        [settings?.timezoneOffset]
    );

    const currencySettings = useMemo(
        () => ({
            currency: activeProject?.currency,
            displayUnit: activeProject?.display_unit,
            decimalPlaces: activeProject?.decimal_places,
        }),
        [activeProject]
    );

    const effectiveCashAccounts = useMemo(() => {
        if (finalCashAccounts?.length > 0) {
            return finalCashAccounts;
        }

        if (contextDataState.allCashAccounts && activeProjectId) {
            const projectAccounts = contextDataState.allCashAccounts[activeProjectId];
            if (projectAccounts?.length > 0) {
                return projectAccounts;
            }
        }

        if (activeProjectId && activeProjectId !== 'null') {
            return [{
                id: `default-account-${activeProjectId}`,
                name: 'Compte Principal',
                initialBalance: 10000,
                currentBalance: 10000,
                initialBalanceDate: new Date().toISOString().split('T')[0],
                projectId: activeProjectId,
            }];
        }

        return [{
            id: 'default-account-demo',
            name: 'Compte Principal',
            initialBalance: 10000,
            currentBalance: 10000,
            initialBalanceDate: new Date().toISOString().split('T')[0],
        }];
    }, [finalCashAccounts, contextDataState.allCashAccounts, activeProjectId]);

    const isDateToday = useCallback((date) => {
        if (!date) return false;
        const todayDate = new Date(today);
        const compareDate = new Date(date);

        return compareDate.getDate() === todayDate.getDate() &&
            compareDate.getMonth() === todayDate.getMonth() &&
            compareDate.getFullYear() === todayDate.getFullYear();
    }, [today]);

    // Fetch des données
    const fetchProjectData = useCallback(async (projectId, frequencyId = null, forceRefresh = false) => {
        if (!projectId) return;

        if (forceRefresh) {
            setLoading(true);
            setError(null);
        }

        try {
            const params = {};
            if (frequencyId && frequencyId !== 'all') {
                params.frequency_id = frequencyId;
            }
            if (forceRefresh) {
                params._t = Date.now();
            }

            const response = await axios.get(`/trezo-tables/projects/${projectId}`, { params });
            const data = response.data;

            if (data?.budgets) {
                const hasBudgetItems = data.budgets.budget_items?.length > 0;
                if (hasBudgetItems) {
                    setProjectData(data);
                    // Stocker aussi les comptes bancaires séparément
                    if (data.bank_accounts?.bank_account_items) {
                        console.log('Bank accounts from API:', data.bank_accounts.bank_account_items);
                    }
                } else {
                    setProjectData({ budgets: { budget_items: [] } });
                }
            } else {
                setProjectData({ budgets: { budget_items: [] } });
            }
        } catch (err) {
            console.error('[fetchProjectData] Erreur:', err);
            setError(err.response?.data?.message || err.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, []);
    const [bankAccounts, setBankAccounts] = useState([]);

    // Mettez à jour quand projectData change
    useEffect(() => {
        if (projectData?.bank_accounts?.bank_account_items) {
            setBankAccounts(projectData.bank_accounts.bank_account_items);
        }
    }, [projectData]);

    // Utilisez bankAccounts au lieu de effectiveCashAccounts
    const displayBankAccounts = useMemo(() => {
        // Priorité: 1. API, 2. finalCashAccounts, 3. contexte, 4. défaut
        if (bankAccounts.length > 0) {
            return bankAccounts;
        }
        return effectiveCashAccounts; // fallback
    }, [bankAccounts, effectiveCashAccounts]);

    useEffect(() => {
        if (activeProjectId) {
            fetchProjectData(activeProjectId, frequencyFilter);
        }
    }, [activeProjectId, frequencyFilter, refreshTrigger, fetchProjectData]);

    // Handlers
    const handleEditBudget = useCallback((item, type, event) => {
        event?.stopPropagation();
        onEdit?.(item, type);
    }, [onEdit]);

    const handleDeleteEntry = useCallback((entry) => {
        console.log('Delete entry:', entry);
    }, []);

    const refreshData = useCallback(async () => {
        try {
            setRefreshTrigger(prev => prev + 1);
            await onRefresh?.();
        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
        }
    }, [onRefresh]);

    const handlePeriodChange = useCallback((direction) => {
        if (direction === 'today') {
            uiDispatch({ type: 'SET_PERIOD_OFFSET', payload: 0 });
            return;
        }

        let offsetIncrement = direction;
        uiDispatch({ type: 'SET_PERIOD_OFFSET', payload: periodOffset + offsetIncrement });
    }, [uiDispatch, periodOffset, timeView]);

    const handleTimeViewSelect = useCallback((newTimeView, selectedTimeRange = null) => {
        let horizon = 1;

        switch (newTimeView) {
            case 'year3':
                horizon = 3;
                break;
            case 'year5':
                horizon = 5;
                break;
            case 'year7':
                horizon = 7;
                break;
            default:
                horizon = 1;
        }

        setTimeView(newTimeView);

        // Mettre à jour timeRange si fourni
        if (selectedTimeRange) {
            console.log('TimeRange sélectionné:', selectedTimeRange);
            // Si vous avez besoin de stocker timeRange séparément
            // Vous pourriez vouloir ajouter un état pour timeRange ici
        }

        uiDispatch({ type: 'SET_PERIOD_OFFSET', payload: 0 });
    }, [uiDispatch]);

    const getNavigationLabel = useCallback((direction) => {
        if (direction === 'today') return "Aujourd'hui";

        const labels = {
            day: { '-1': 'Jour précédent', '1': 'Jour suivant' },
            week: { '-1': 'Semaine précédente', '1': 'Semaine suivante' },
            month: { '-1': 'Mois précédent', '1': 'Mois suivant' },
            bimester: { '-1': 'Bimestre précédent', '1': 'Bimestre suivant' },
            trimester: { '-1': 'Trimestre précédent', '1': 'Trimestre suivant' },
            semester: { '-1': 'Semestre précédent', '1': 'Semestre suivant' },
            year: { '-1': 'Année précédente', '1': 'Année suivante' },
            year3: { '-1': 'Période précédente', '1': 'Période suivante' },
            year5: { '-1': 'Période précédente', '1': 'Période suivante' },
            year7: { '-1': 'Période précédente', '1': 'Période suivante' },
        };

        return labels[timeView]?.[direction] || (direction === -1 ? 'Précédent' : 'Suivant');
    }, [timeView]);

    const toggleCollapse = useCallback((mainCatId) => {
        setCollapsedItems((prev) => ({
            ...prev,
            [mainCatId]: !prev[mainCatId],
        }));
    }, []);

    const handleResize = useCallback((columnId, newWidth) => {
        setColumnWidths((prev) => ({
            ...prev,
            [columnId]: Math.max(newWidth, 80),
        }));
    }, []);

    const handleDrillDown = useCallback(() => {
        const newCollapsedState = {};
        // À implémenter selon votre logique de groupement
        setCollapsedItems(newCollapsedState);
        setIsEntreesCollapsed(false);
        setIsSortiesCollapsed(false);
    }, []);

    const handleDrillUp = useCallback(() => {
        const newCollapsedState = {};
        // À implémenter selon votre logique de groupement
        setCollapsedItems(newCollapsedState);
        setIsEntreesCollapsed(true);
        setIsSortiesCollapsed(true);
    }, []);

    const handleActualClick = useCallback((context) => {
        console.log('Actual click:', context);
        // Implémenter l'ouverture du drawer avec les transactions
    }, []);

    const handleCloseDrawer = useCallback(() => {
        setDrawerData({
            isOpen: false,
            transactions: [],
            title: '',
            period: null,
            source: null
        });
    }, []);

    // Sauvegarde des largeurs de colonnes
    useEffect(() => {
        try {
            localStorage.setItem('budgetAppColumnWidths', JSON.stringify(columnWidths));
        } catch (error) {
            console.error('Failed to save column widths to localStorage', error);
        }
    }, [columnWidths]);

    // Gestion du scroll synchronisé
    useEffect(() => {
        const topEl = topScrollRef.current;
        const mainEl = mainScrollRef.current;
        if (!topEl || !mainEl) return;

        let isSyncing = false;

        const syncScroll = (source, target) => {
            if (!isSyncing) {
                isSyncing = true;
                target.scrollLeft = source.scrollLeft;
                requestAnimationFrame(() => { isSyncing = false; });
            }
        };

        const handleTopScroll = () => syncScroll(topEl, mainEl);
        const handleMainScroll = () => syncScroll(mainEl, topEl);

        topEl.addEventListener('scroll', handleTopScroll);
        mainEl.addEventListener('scroll', handleMainScroll);

        return () => {
            topEl.removeEventListener('scroll', handleTopScroll);
            mainEl.removeEventListener('scroll', handleMainScroll);
        };
    }, []);

    // Gestion des clics externes
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (frequencyFilterRef.current && !frequencyFilterRef.current.contains(event.target)) {
                setIsFrequencyFilterOpen(false);
            }
            if (tierSearchRef.current && !tierSearchRef.current.contains(event.target)) {
                setIsTierSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Rendu conditionnel
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

    if (tableauMode === 'lecture') {
        return (
            <LectureView
                entries={finalBudgetEntries || []}
                periods={[]}
                settings={currencySettings}
                actuals={finalActualTransactions || []}
                isConsolidated={isConsolidated || isCustomConsolidated}
                projects={projects || []}
                visibleColumns={visibleColumns}
                categories={finalCategories || {}}
            />
        );
    }

    return (
        <>
            <BudgetTableHeader
                timeView={timeView}
                timeRange={timeRange}
                handleTimeNavigation={handlePeriodChange}
                handleTimeViewSelect={handleTimeViewSelect}
                handleNewBudget={() => { }}
                showTotals={showTotals}
                setShowTotals={setShowTotals}
                frequencyFilter={frequencyFilter}
                setFrequencyFilter={setFrequencyFilter}
                isPeriodMenuOpen={isPeriodMenuOpen}
                setIsPeriodMenuOpen={setIsPeriodMenuOpen}
                periodMenuRef={periodMenuRef}
                isFrequencyFilterOpen={isFrequencyFilterOpen}
                setIsFrequencyFilterOpen={setIsFrequencyFilterOpen}
                frequencyFilterRef={frequencyFilterRef}
                showNewEntryButton={showNewEntryButton}
                today={today}
                isConsolidated={isConsolidated}
                isCustomConsolidated={isCustomConsolidated}
                tableauMode={tableauMode}
                setTableauMode={setTableauMode}
                showViewModeSwitcher={showViewModeSwitcher}
            />

            <BudgetDataManager
                projectData={projectData}
                finalBudgetEntries={finalBudgetEntries}
                finalActualTransactions={finalActualTransactions}
                finalCategories={finalCategories}
                vatRegimes={vatRegimes}
                taxConfigs={taxConfigs}
                activeProjectId={activeProjectId}
                searchTerm={searchTerm}
                frequencyFilter={frequencyFilter}
                quickFilter={quickFilter}
                timeView={timeView}
                monthDisplayMode={monthDisplayMode}
                settings={settings}
                effectiveHorizonLength={horizonLength}
                periodOffset={periodOffset}
                today={today}
                isDateToday={isDateToday}
            >
                {(dataState) => (
                    <BudgetTableUI
                        topScrollRef={topScrollRef}
                        mainScrollRef={mainScrollRef}
                        drawerData={drawerData}
                        periods={dataState.periods}
                        groupedData={dataState.groupedData}
                        columnWidths={columnWidths}
                        visibleColumns={visibleColumns}
                        currencySettings={currencySettings}
                        filteredExpandedAndVatEntries={dataState.filteredExpandedAndVatEntries}
                        finalActualTransactions={finalActualTransactions}
                        hasOffBudgetRevenues={dataState.hasOffBudgetRevenues}
                        hasOffBudgetExpenses={dataState.hasOffBudgetExpenses}
                        collectionData={realBudgetData}
                        periodPositions={dataState.periodPositions}
                        isTierSearchOpen={isTierSearchOpen}
                        setIsTierSearchOpen={setIsTierSearchOpen}
                        tierSearchRef={tierSearchRef}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        collapsedItems={collapsedItems}
                        isEntreesCollapsed={isEntreesCollapsed}
                        setIsEntreesCollapsed={setIsEntreesCollapsed}
                        isSortiesCollapsed={isSortiesCollapsed}
                        setIsSortiesCollapsed={setIsSortiesCollapsed}
                        toggleCollapse={toggleCollapse}
                        handleResize={handleResize}
                        handleEditBudget={handleEditBudget}
                        handleDeleteEntry={handleDeleteEntry}
                        handleActualClick={handleActualClick}
                        handleDrillUp={handleDrillUp}
                        handleDrillDown={handleDrillDown}
                        criticalityConfig={criticalityConfig}
                        realBudgetData={realBudgetData}
                        today={today}
                        isDateToday={isDateToday}
                        calculateGeneralTotals={dataState.calculateGeneralTotals}
                        calculateMainCategoryTotals={dataState.calculateMainCategoryTotals}
                        calculateEntryBudgetForPeriod={dataState.calculateEntryBudgetForPeriod}
                        calculateActualAmountForPeriod={dataState.calculateActualAmountForPeriod}
                        getEntryDescription={dataState.getEntryDescription}
                        getFrequencyTitle={dataState.getFrequencyTitle}
                        getResteColor={dataState.getResteColor}
                        formatCurrency={formatCurrency}
                        effectiveCashAccounts={displayBankAccounts} 
                        

                    />
                )}
            </BudgetDataManager>

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