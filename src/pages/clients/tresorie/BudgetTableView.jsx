import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Search, ChevronDown, Folder, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, XCircle, Trash2, ArrowRightLeft, Lock, MessageSquare, ChevronUp, TableProperties, Filter } from 'lucide-react';
import TransactionDetailDrawer from './TransactionDetailDrawer.jsx';
import ResizableTh from './ResizableTh.jsx';
import { getStartOfWeek } from '../../../utils/budgetCalculations.js';
import { getTodayInTimezone } from '../../../utils/getTodayInTimezone.js';
import { calculateGeneralTotals } from '../../../hooks/calculateGeneralTotals.jsx';
import { useProcessedEntries } from '../../../hooks/useProcessedEntries.jsx';
import { useGroupedData } from '../../../hooks/useGroupedData.jsx';
import { calculateMainCategoryTotals } from '../../../hooks/calculateMainCategoryTotals.jsx';
import { formatCurrency } from '../../../utils/formatting.js';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteEntry, saveEntry } from '../../../components/context/actions.js';
import LectureView from './LectureView.jsx';
import CommentButton from './CommentButton.jsx';
import { useData } from '../../../components/context/DataContext.jsx';
import {
    getCollection,
} from '../../../components/context/collectionActions';
import { trezoTableService } from '../../../services/trezoTableService';
import axios from '../../../components/config/Axios.jsx';

// Composant Header séparé
const BudgetTableHeader = ({
    timeUnit,
    periodOffset,
    activeQuickSelect,
    tableauMode,
    setTableauMode,
    showViewModeSwitcher,
    showNewEntryButton,
    isConsolidated,
    isCustomConsolidated,
    handlePeriodChange,
    handleQuickPeriodSelect,
    handleNewBudget,
    periodMenuRef,
    isPeriodMenuOpen,
    setIsPeriodMenuOpen,
    frequencyFilter,
    setFrequencyFilter,
    isFrequencyFilterOpen,
    setIsFrequencyFilterOpen,
    frequencyFilterRef,
}) => {
    const timeUnitLabels = {
        day: 'Jour',
        week: 'Semaine',
        fortnightly: 'Quinzaine',
        month: 'Mois',
        bimonthly: 'Bimestre',
        quarterly: 'Trimestre',
        semiannually: 'Semestre',
        annually: 'Année',
    };

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

    const periodLabel = useMemo(() => {
        if (periodOffset === 0) return 'Actuel';
        const label = timeUnitLabels[timeUnit] || 'Période';
        const plural = Math.abs(periodOffset) > 1 ? 's' : '';
        return `${periodOffset > 0 ? '+' : ''}${periodOffset} ${label}${plural}`;
    }, [periodOffset, timeUnit, timeUnitLabels]);

    const quickPeriodOptions = [
        { id: 'today', label: 'Jour' },
        { id: 'week', label: 'Semaine' },
        { id: 'month', label: 'Mois' },
        { id: 'quarter', label: 'Trimestre' },
        { id: 'year', label: 'Année' },
        { id: 'short_term', label: 'CT (3a)' },
        { id: 'medium_term', label: 'MT (5a)' },
        { id: 'long_term', label: 'LT (10a)' },
    ];

    const selectedPeriodLabel = quickPeriodOptions.find(opt => opt.id === activeQuickSelect)?.label || 'Période';
    const selectedFrequencyLabel = frequencyOptions.find(opt => opt.id === frequencyFilter)?.label || 'Fréquence';

    const handleFrequencyClick = () => {
        setIsFrequencyFilterOpen(prev => !prev);
        if (!isFrequencyFilterOpen) {
            setIsPeriodMenuOpen(false);
        }
    };

    const handlePeriodClick = () => {
        setIsPeriodMenuOpen(prev => !prev);
        if (!isPeriodMenuOpen) {
            setIsFrequencyFilterOpen(false);
        }
    };

    const handleFrequencySelect = (optionId) => {
        setFrequencyFilter(optionId);
        setIsFrequencyFilterOpen(false);
    };

    const handlePeriodSelect = (optionId) => {
        handleQuickPeriodSelect(optionId);
        setIsPeriodMenuOpen(false);
    };

    return (
        <div className="relative z-50 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePeriodChange(-1)}
                            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                            title="Période précédente"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span
                            className="w-24 text-sm font-semibold text-center text-gray-700"
                            title="Décalage par rapport à la période actuelle"
                        >
                            {periodLabel}
                        </span>
                        <button
                            onClick={() => handlePeriodChange(1)}
                            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                            title="Période suivante"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Filtre de fréquence */}
                    <div className="relative" ref={frequencyFilterRef}>
                        <button
                            onClick={handleFrequencyClick}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 hover:text-blue-600"
                        >
                            <Filter size={16} className="text-gray-600" />
                            <span>{selectedFrequencyLabel}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isFrequencyFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isFrequencyFilterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 z-50 w-56 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl top-full"
                                >
                                    <div className="p-2 border-b border-gray-100">
                                        <div className="text-xs font-semibold text-gray-500 uppercase">Filtrer par fréquence</div>
                                    </div>
                                    <ul className="p-1 overflow-y-auto max-h-60">
                                        {frequencyOptions.map(option => (
                                            <li key={option.id}>
                                                <button
                                                    onClick={() => handleFrequencySelect(option.id)}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between ${frequencyFilter === option.id
                                                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                                                        : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                                                        }`}
                                                >
                                                    <span>{option.label}</span>
                                                    {frequencyFilter === option.id && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    )}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Menu période */}
                    <div className="relative" ref={periodMenuRef}>
                        <button
                            onClick={handlePeriodClick}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 hover:text-blue-600"
                        >
                            <span>{selectedPeriodLabel}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isPeriodMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isPeriodMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 z-50 w-48 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl top-full"
                                >
                                    <ul className="p-1">
                                        {quickPeriodOptions.map(option => (
                                            <li key={option.id}>
                                                <button
                                                    onClick={() => handlePeriodSelect(option.id)}
                                                    className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${activeQuickSelect === option.id
                                                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                                                        : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {showViewModeSwitcher && (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setTableauMode('edition')}
                                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${tableauMode === 'edition' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                <TableProperties size={16} />
                                TCD
                            </button>
                        </div>
                    )}
                    {showNewEntryButton && (
                        <button
                            onClick={handleNewBudget}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isConsolidated || isCustomConsolidated}
                        >
                            <Plus className="w-5 h-5" />
                            Nouvelle Entrée
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Configuration et fonctions utilitaires
const criticalityConfig = {
    critical: { label: 'Critique', color: 'bg-red-500' },
    essential: { label: 'Essentiel', color: 'bg-yellow-500' },
    discretionary: { label: 'Discrétionnaire', color: 'bg-blue-500' },
};

// CORRECTION COMPLÈTE de calculateEntryAmountForPeriod
const calculateEntryAmountForPeriod = (entry, startDate, endDate) => {
    if (!entry || !entry.amount) {
        return 0;
    }

    const frequency = entry.frequency_name || entry.frequency;
    const amount = parseFloat(entry.amount) || 0;

    // Si pas de fréquence, retourner le montant complet
    if (!frequency) {
        return amount;
    }

    const freqLower = frequency.toLowerCase();

    // CORRECTION: Pour "Monsuel" (mensuel), toujours retourner le montant
    if (freqLower === 'monsuel' || freqLower === 'mensuel') {
        return amount;
    }

    // CORRECTION: Pour les autres fréquences récurrentes, retourner le montant
    if (freqLower === 'hebdomadaire' || freqLower === 'bimestriel' ||
        freqLower === 'trimestriel' || freqLower === 'semestriel' ||
        freqLower === 'annuel') {
        return amount;
    }

    // Pour ponctuel, vérifier si la date est dans la période
    if (freqLower === 'ponctuel' || freqLower === 'ponctuelle') {
        const entryDate = entry.date ? new Date(entry.date) : (entry.start_date ? new Date(entry.start_date) : null);
        if (!entryDate) {
            return amount;
        }

        const isInPeriod = entryDate >= startDate && entryDate <= endDate;

        return isInPeriod ? amount : 0;
    }

    // Par défaut, retourner le montant
    return amount;
};

const calculateActualAmountForPeriod = (entry, actualTransactions, startDate, endDate) => {
    if (!entry) return 0;

    // PRIORITÉ 1: Utiliser les données de collection si disponibles
    if (entry.collectionData && entry.collectionData.collection) {
        let collectionAmount = 0;

        if (Array.isArray(entry.collectionData.collection)) {
            const collectionInPeriod = entry.collectionData.collection.filter(collection => {
                if (!collection.collection_date) return false;
                try {
                    const collectionDate = new Date(collection.collection_date);
                    return collectionDate >= startDate && collectionDate <= endDate;
                } catch (error) {
                    console.error('Erreur parsing date collection:', error);
                    return false;
                }
            });

            collectionAmount = collectionInPeriod.reduce((sum, coll) => {
                const amount = parseFloat(coll.collection_amount) || 0;
                return sum + amount;
            }, 0);
        }

        // Si on a un montant de collection, on le retourne directement
        if (collectionAmount > 0) {
            return collectionAmount;
        }
    }

    // PRIORITÉ 2: Fallback sur les paiements traditionnels
    const entryActuals = actualTransactions.filter(actual =>
        actual.budgetId === entry.id ||
        actual.budgetId === entry.id.replace('_vat', '')
    );

    const paymentsAmount = entryActuals.reduce((sum, actual) => {
        const paymentsInPeriod = (actual.payments || []).filter(p => {
            const paymentDate = new Date(p.paymentDate);
            return paymentDate >= startDate && paymentDate <= endDate;
        });
        return sum + paymentsInPeriod.reduce((paymentSum, p) => paymentSum + (p.paidAmount || 0), 0);
    }, 0);

    return paymentsAmount;
};

const calculatePeriodPositions = (periods, cashAccounts, groupedData, expandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses) => {
    if (!periods || periods.length === 0 || !cashAccounts || cashAccounts.length === 0) {
        return periods?.map(() => ({ initial: 0, final: 0, netCashFlow: 0 })) || [];
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

        const netCashFlow = (revenueTotals.actual || 0) - (expenseTotals.actual || 0);

        const initialBalance = runningBalance;
        const finalBalance = initialBalance + netCashFlow;

        runningBalance = finalBalance;

        positions.push({
            initial: initialBalance,
            final: finalBalance,
            netCashFlow: netCashFlow
        });
    }

    return positions;
};

// Fonction helper pour la description
const getEntryDescription = (entry) => {
    return entry.description ||
        entry.budget_description ||
        entry.amount_type_description ||
        'Aucune description disponible';
};

// Composant principal
const BudgetTableView = (props) => {
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
        visibleColumns,
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
        setIsPeriodMenuOpen
    } = props;

    const { dataState: contextDataState } = useData();

    // États pour l'API
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasNoData, setHasNoData] = useState(false);

    // États locaux
    const [collectionData, setCollectionData] = useState({});
    const [loadingCollections, setLoadingCollections] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [drawerData, setDrawerData] = useState({ isOpen: false, transactions: [], title: '' });
    const [collapsedItems, setCollapsedItems] = useState({});
    const [isEntreesCollapsed, setIsEntreesCollapsed] = useState(false);
    const [isSortiesCollapsed, setIsSortiesCollapsed] = useState(false);
    const [columnWidths, setColumnWidths] = useState(() => {
        try {
            const savedWidths = localStorage.getItem('budgetAppColumnWidths');
            if (savedWidths) return JSON.parse(savedWidths);
        } catch (error) {
            console.error("Failed to parse column widths from localStorage", error);
        }
        return { category: 192, supplier: 160, description: 200, project: 192 };
    });
    const [isTierSearchOpen, setIsTierSearchOpen] = useState(false);
    const [isProjectSearchOpen, setIsProjectSearchOpen] = useState(false);

    // États pour le filtre de fréquence
    const [frequencyFilter, setFrequencyFilter] = useState('all');
    const [isFrequencyFilterOpen, setIsFrequencyFilterOpen] = useState(false);
    const frequencyFilterRef = useRef(null);

    // Références
    const topScrollRef = useRef(null);
    const mainScrollRef = useRef(null);
    const tierSearchRef = useRef(null);
    const projectSearchRef = useRef(null);

    const today = getTodayInTimezone(settings.timezoneOffset);
    const currencySettings = useMemo(() => ({
        currency: activeProject?.currency,
        displayUnit: activeProject?.display_unit,
        decimalPlaces: activeProject?.decimal_places,
    }), [activeProject]);

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

const fetchProjectData = async (projectId, frequencyId = null) => {
    if (!projectId) return;

    setLoading(true);
    setError(null);
    setHasNoData(false);

    try {
        const params = {};

        if (frequencyId && frequencyId !== 'all') {
            params.frequency_id = frequencyId;
        }

        const response = await axios.get(`/trezo-tables/projects/${projectId}`, { params });
        const data = response.data;

        // CORRECTION : Gestion simplifiée et robuste de la réponse
        if (data && data.budgets) {
            const hasBudgetItems = data.budgets.budget_items && data.budgets.budget_items.length > 0;
            
            if (hasBudgetItems) {
                setProjectData(data);
                setHasNoData(false);
            } else {
                // Aucune donnée trouvée pour ce filtre - ce n'est pas une erreur
                setProjectData({ budgets: { budget_items: [] } });
                setHasNoData(true);
            }
        } else {
            // Format de réponse inattendu mais on gère gracieusement
            console.warn('Format de réponse inattendu, mais traitement continué:', data);
            setProjectData({ budgets: { budget_items: [] } });
            setHasNoData(true);
        }

    } catch (err) {
        console.error('❌ Erreur détaillée:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status
        });

        let errorMessage = 'Erreur de chargement des données';

        if (err.response) {
            // Erreur avec réponse du serveur
            if (err.response.status === 404) {
                errorMessage = 'Projet non trouvé';
            } else if (err.response.status === 204) {
                // Aucune donnée - ce n'est pas une erreur
                setProjectData({ budgets: { budget_items: [] } });
                setHasNoData(true);
                setError(null);
                setLoading(false);
                return;
            } else {
                errorMessage = err.response.data?.message || `Erreur ${err.response.status}`;
            }
        } else if (err.request) {
            // Erreur de réseau
            errorMessage = 'Erreur de connexion au serveur';
        } else {
            // Autre erreur
            errorMessage = err.message;
        }

        setError(errorMessage);
        setHasNoData(false);
    } finally {
        setLoading(false);
    }
};

    // Récupération des données de l'API quand projectId ou frequencyFilter change
    useEffect(() => {
        fetchProjectData(activeProjectId, frequencyFilter);
    }, [activeProjectId, frequencyFilter]);

    // Fonction pour traiter les données de l'API
    const processBudgetItems = (budgetItems) => {
        if (!budgetItems || !Array.isArray(budgetItems)) return [];

        return budgetItems.map(item => {
            // CORRECTION: Gestion du type (entree/sortie)
            let type;
            if (item.category_type_name === 'Revenue') {
                type = 'entree';
            } else if (item.category_type_name === 'Dépense') {
                type = 'sortie';
            } else {
                // Fallback basé sur budget_type_name
                type = item.budget_type_name === 'Entrée' ? 'entree' : 'sortie';
            }

            // CORRECTION: Gestion des IDs
            const id = item.budget_detail_id?.toString() || `budget_${item.budget_id}`;

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
                supplier: `${item.third_party_firstname || ''} ${item.third_party_name || ''}`.trim() || 'Non spécifié',
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
                // Champs calculés ou par défaut
                type: type,
                isProvision: false,
                is_vat_child: false,
                is_vat_payment: false,
                is_tax_payment: false,
                // AJOUT: Champs requis pour les calculs
                date: item.start_date,
                startDate: item.start_date ? new Date(item.start_date) : null,
                endDate: item.end_date ? new Date(item.end_date) : null
            };
        });
    };

    // Utiliser les données récupérées
    const processedBudgetEntries = useMemo(() => {
        if (projectData && projectData.budgets && projectData.budgets.budget_items) {
            const processed = processBudgetItems(projectData.budgets.budget_items);
            return processed;
        }
        return finalBudgetEntries || [];
    }, [projectData, finalBudgetEntries]);

    // Logique des périodes
    const periods = useMemo(() => {
        const today = getTodayInTimezone(settings.timezoneOffset);
        let baseDate;
        switch (timeUnit) {
            case 'day': baseDate = new Date(today); baseDate.setHours(0, 0, 0, 0); break;
            case 'week': baseDate = getStartOfWeek(today); break;
            case 'fortnightly': const day = today.getDate(); baseDate = new Date(today.getFullYear(), today.getMonth(), day <= 15 ? 1 : 16); break;
            case 'month': baseDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
            case 'bimonthly': const bimonthStartMonth = Math.floor(today.getMonth() / 2) * 2; baseDate = new Date(today.getFullYear(), bimonthStartMonth, 1); break;
            case 'quarterly': const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3; baseDate = new Date(today.getFullYear(), quarterStartMonth, 1); break;
            case 'semiannually': const semiAnnualStartMonth = Math.floor(today.getMonth() / 6) * 6; baseDate = new Date(today.getFullYear(), semiAnnualStartMonth, 1); break;
            case 'annually': baseDate = new Date(today.getFullYear(), 0, 1); break;
            default: baseDate = getStartOfWeek(today);
        }

        const periodList = [];
        for (let i = 0; i < horizonLength; i++) {
            const periodIndex = i + periodOffset;
            const periodStart = new Date(baseDate);
            switch (timeUnit) {
                case 'day': periodStart.setDate(periodStart.getDate() + periodIndex); break;
                case 'week': periodStart.setDate(periodStart.getDate() + periodIndex * 7); break;
                case 'fortnightly': {
                    const d = new Date(baseDate);
                    let numFortnights = periodIndex;
                    let currentMonth = d.getMonth();
                    let isFirstHalf = d.getDate() === 1;
                    const monthsToAdd = Math.floor(((isFirstHalf ? 0 : 1) + numFortnights) / 2);
                    d.setMonth(currentMonth + monthsToAdd);
                    const newIsFirstHalf = (((isFirstHalf ? 0 : 1) + numFortnights) % 2 + 2) % 2 === 0;
                    d.setDate(newIsFirstHalf ? 1 : 16);
                    periodStart.setTime(d.getTime());
                    break;
                }
                case 'month': periodStart.setMonth(periodStart.getMonth() + periodIndex); break;
                case 'bimonthly': periodStart.setMonth(periodStart.getMonth() + periodIndex * 2); break;
                case 'quarterly': periodStart.setMonth(periodStart.getMonth() + periodIndex * 3); break;
                case 'semiannually': periodStart.setMonth(periodStart.getMonth() + periodIndex * 6); break;
                case 'annually': periodStart.setFullYear(periodStart.getFullYear() + periodIndex); break;
            }
            periodList.push(periodStart);
        }

        return periodList.map((periodStart) => {
            const periodEnd = new Date(periodStart);
            switch (timeUnit) {
                case 'day': periodEnd.setDate(periodEnd.getDate() + 1); break;
                case 'week': periodEnd.setDate(periodEnd.getDate() + 7); break;
                case 'fortnightly': if (periodStart.getDate() === 1) { periodEnd.setDate(16); } else { periodEnd.setMonth(periodEnd.getMonth() + 1); periodEnd.setDate(1); } break;
                case 'month': periodEnd.setMonth(periodEnd.getMonth() + 1); break;
                case 'bimonthly': periodEnd.setMonth(periodEnd.getMonth() + 2); break;
                case 'quarterly': periodEnd.setMonth(periodEnd.getMonth() + 3); break;
                case 'semiannually': periodEnd.setMonth(periodEnd.getMonth() + 6); break;
                case 'annually': periodEnd.setFullYear(periodEnd.getFullYear() + 1); break;
            }
            periodEnd.setMilliseconds(periodEnd.getMilliseconds() - 1);

            const year = periodStart.toLocaleDateString('fr-FR', { year: '2-digit' });
            const monthsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            let label = '';
            switch (timeUnit) {
                case 'day':
                    if (activeQuickSelect === 'week') {
                        const dayLabel = periodStart.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
                        label = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
                    } else {
                        label = periodStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                    }
                    break;
                case 'week': label = `S ${periodStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`; break;
                case 'fortnightly': const fortnightNum = periodStart.getDate() === 1 ? '1' : '2'; label = `${fortnightNum}Q-${monthsShort[periodStart.getMonth()]}'${year}`; break;
                case 'month': label = `${periodStart.toLocaleString('fr-FR', { month: 'short' })} '${year}`; break;
                case 'bimonthly': const startMonthB = monthsShort[periodStart.getMonth()]; const endMonthB = monthsShort[(periodStart.getMonth() + 1) % 12]; label = `${startMonthB}-${endMonthB}`; break;
                case 'quarterly': const quarter = Math.floor(periodStart.getMonth() / 3) + 1; label = `T${quarter} '${year}`; break;
                case 'semiannually': const semester = Math.floor(periodStart.getMonth() / 6) + 1; label = `S${semester} '${year}`; break;
                case 'annually': label = String(periodStart.getFullYear()); break;
            }
            return { label, startDate: periodStart, endDate: periodEnd };
        });
    }, [timeUnit, horizonLength, periodOffset, activeQuickSelect, settings.timezoneOffset]);

// Dans BudgetTableView.jsx - Ajoutez cette fonction
const fetchCollectionAccount = async (budgetId, date) => {
    if (loadingCollections) return;

    try {
        setLoadingCollections(true);
        
        // ESSAYEZ D'ABORD L'APPEL NORMAL
        const res = await getCollection(budgetId, date);

        if (res && res.status === 200) {
            const hasValidCollections = Array.isArray(res.collection) && res.collection.length > 0;

            setCollectionData(prev => {
                const newData = {
                    ...prev,
                    [budgetId]: res
                };

                if (res.budget && res.budget.budget_detail_id && res.budget.budget_detail_id !== budgetId) {
                    newData[res.budget.budget_detail_id] = res;
                }

                return newData;
            });

            if (hasValidCollections) {
                console.log(`✅ Collection trouvée pour ${budgetId}:`, {
                    montant: res.collection[0].collection_amount,
                    date: res.collection[0].collection_date,
                    count: res.collection.length
                });
            }
        }
    } catch (error) {
        console.warn(`⚠️ Erreur fetch collection ${budgetId}, utilisation des données par défaut:`, error);
        
        // EN CAS D'ERREUR, UTILISEZ DES DONNÉES PAR DÉFAUT
        setCollectionData(prev => ({
            ...prev,
            [budgetId]: { 
                collection: [], 
                status: 'no_endpoint',
                message: 'Endpoint collections non disponible'
            }
        }));
    } finally {
        setLoadingCollections(false);
    }
};

    useEffect(() => {
        const fetchCollectionsWithDelay = async () => {
            if (processedBudgetEntries && processedBudgetEntries.length > 0 && periods && periods.length > 0) {
                const currentPeriod = periods[0];
                const dateToUse = currentPeriod.startDate.toISOString().split('T')[0];

                for (let i = 0; i < processedBudgetEntries.length; i++) {
                    const entry = processedBudgetEntries[i];

                    if (i > 0) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    await fetchCollectionAccount(entry.id, dateToUse);
                }
            }
        };

        fetchCollectionsWithDelay();
    }, [processedBudgetEntries, periods]);

    // Récupération des comptes de trésorerie
    const effectiveCashAccounts = useMemo(() => {
        if (finalCashAccounts && finalCashAccounts.length > 0) {
            return finalCashAccounts;
        }

        if (contextDataState.allCashAccounts && activeProjectId && contextDataState.allCashAccounts[activeProjectId]?.length > 0) {
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
                    projectId: activeProjectId
                }
            ];
        }

        return [
            {
                id: 'default-account-demo',
                name: 'Compte Principal',
                initialBalance: 10000,
                currentBalance: 10000,
                initialBalanceDate: new Date().toISOString().split('T')[0]
            }
        ];
    }, [finalCashAccounts, contextDataState.allCashAccounts, activeProjectId]);

    // Gestion du clic en dehors des menus
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (frequencyFilterRef.current && !frequencyFilterRef.current.contains(event.target)) {
                setIsFrequencyFilterOpen(false);
            }
            if (tierSearchRef.current && !tierSearchRef.current.contains(event.target)) {
                setIsTierSearchOpen(false);
            }
            if (projectSearchRef.current && !projectSearchRef.current.contains(event.target)) {
                setIsProjectSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Handlers
    const handlePeriodChange = (direction) => {
        uiDispatch({ type: 'SET_PERIOD_OFFSET', payload: periodOffset + direction });
    };

    const handleQuickPeriodSelect = (quickSelectType) => {
        const today = getTodayInTimezone(settings.timezoneOffset);
        let payload;

        switch (quickSelectType) {
            case 'today':
                payload = { timeUnit: 'day', horizonLength: 1, periodOffset: 0, activeQuickSelect: 'today' };
                break;
            case 'week': {
                const dayOfWeek = today.getDay();
                const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                payload = { timeUnit: 'day', horizonLength: 7, periodOffset: offsetToMonday, activeQuickSelect: 'week' };
                break;
            }
            case 'month': {
                const year = today.getFullYear();
                const month = today.getMonth();
                const firstDayOfMonth = new Date(year, month, 1);
                const lastDayOfMonth = new Date(year, month + 1, 0);

                const startOfWeekOfFirstDay = getStartOfWeek(firstDayOfMonth);
                const startOfWeekOfLastDay = getStartOfWeek(lastDayOfMonth);

                const horizon = Math.round((startOfWeekOfLastDay - startOfWeekOfFirstDay) / (1000 * 60 * 60 * 24 * 7)) + 1;

                const startOfCurrentWeek = getStartOfWeek(today);
                const offsetInTime = startOfWeekOfFirstDay - startOfCurrentWeek;
                const offsetInWeeks = Math.round(offsetInTime / (1000 * 60 * 60 * 24 * 7));

                payload = { timeUnit: 'week', horizonLength: horizon, periodOffset: offsetInWeeks, activeQuickSelect: 'month' };
                break;
            }
            case 'quarter': {
                const currentQuarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
                const firstDayOfQuarter = new Date(today.getFullYear(), currentQuarterStartMonth, 1);
                const currentFortnightStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() <= 15 ? 1 : 16);
                const targetFortnightStart = new Date(firstDayOfQuarter.getFullYear(), firstDayOfQuarter.getMonth(), 1);
                const monthsDiff = (currentFortnightStart.getFullYear() - targetFortnightStart.getFullYear()) * 12 + (currentFortnightStart.getMonth() - targetFortnightStart.getMonth());
                let fortnightOffset = -monthsDiff * 2;
                if (currentFortnightStart.getDate() > 15) {
                    fortnightOffset -= 1;
                }
                payload = { timeUnit: 'fortnightly', horizonLength: 6, periodOffset: fortnightOffset, activeQuickSelect: 'quarter' };
                break;
            }
            case 'year': {
                const currentMonth = today.getMonth();
                const offsetToJanuary = -currentMonth;
                payload = { timeUnit: 'month', horizonLength: 12, periodOffset: offsetToJanuary, activeQuickSelect: 'year' };
                break;
            }
            case 'short_term': {
                payload = { timeUnit: 'annually', horizonLength: 3, periodOffset: 0, activeQuickSelect: 'short_term' };
                break;
            }
            case 'medium_term': {
                payload = { timeUnit: 'annually', horizonLength: 5, periodOffset: 0, activeQuickSelect: 'medium_term' };
                break;
            }
            case 'long_term': {
                payload = { timeUnit: 'annually', horizonLength: 10, periodOffset: 0, activeQuickSelect: 'long_term' };
                break;
            }
            default:
                return;
        }
        uiDispatch({ type: 'SET_QUICK_PERIOD', payload });
    };

    const handleNewBudget = () => {
        if (!isConsolidated && !isCustomConsolidated) {
            const onSave = (entryData) => {
                const user = dataState.session?.user;
                if (!user) return;
                const targetProjectId = entryData.projectId || activeProjectId;
                const cashAccountsForEntry = dataState.allCashAccounts[targetProjectId] || [];
                saveEntry({ dataDispatch, uiDispatch, dataState }, {
                    entryData,
                    editingEntry: null,
                    activeProjectId: targetProjectId,
                    user,
                    tiers: dataState.tiers,
                    cashAccounts: cashAccountsForEntry,
                    exchangeRates: dataState.exchangeRates,
                });
            };
            uiDispatch({ type: 'OPEN_BUDGET_DRAWER', payload: { onSave } });
        }
    };

    const handleEditEntry = (entry) => {
        if (entry.is_vat_payment || entry.is_tax_payment) return;
        const originalEntryId = entry.is_vat_child ? entry.id.replace('_vat', '') : entry.id;

        const originalEntry = processedBudgetEntries.find(e => e.id === originalEntryId);

        if (originalEntry) {
            const onSave = (entryData) => {
                const user = dataState.session?.user;
                if (!user) return;
                const targetProjectId = entryData.projectId || activeProjectId;
                const cashAccountsForEntry = dataState.allCashAccounts[targetProjectId] || [];
                saveEntry({ dataDispatch, uiDispatch, dataState }, {
                    entryData,
                    editingEntry: originalEntry,
                    activeProjectId: targetProjectId,
                    user,
                    tiers: dataState.tiers,
                    cashAccounts: cashAccountsForEntry,
                    exchangeRates: dataState.exchangeRates,
                });
            };
            const onDelete = () => handleDeleteEntry(originalEntry);
            uiDispatch({ type: 'OPEN_BUDGET_DRAWER', payload: { entry: originalEntry, onSave, onDelete } });
        }
    };

    const handleDeleteEntry = (entry) => {
        if (entry.is_vat_payment || entry.is_tax_payment) return;
        const originalEntryId = entry.is_vat_child ? entry.id.replace('_vat', '') : entry.id;

        const originalEntry = processedBudgetEntries.find(e => e.id === originalEntryId);

        if (!originalEntry) return;

        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: `Supprimer "${originalEntry.supplier}" ?`,
                message: "Cette action est irréversible et supprimera l'entrée budgétaire et ses prévisions.",
                onConfirm: () => deleteEntry({ dataDispatch, uiDispatch }, { entryId: originalEntry.id, entryProjectId: originalEntry.projectId }),
            }
        });
    };

    // Filtrage des entrées
    const filteredBudgetEntries = useMemo(() => {
        let entries = processedBudgetEntries || [];

        // Filtre par recherche de tiers
        if (searchTerm) {
            entries = entries.filter(entry => entry.supplier?.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // Filtre par recherche de projet
        if ((isConsolidated || isCustomConsolidated) && projectSearchTerm) {
            entries = entries.filter(entry => {
                const project = projects.find(p => p.id === entry.projectId);
                return project && project.name.toLowerCase().includes(projectSearchTerm.toLowerCase());
            });
        }

        // Filtre par fréquence (maintenant géré par l'API, mais gardé pour la cohérence)
        if (frequencyFilter !== 'all') {
            entries = entries.filter(entry => {
                const entryFrequencyId = entry.frequency_id?.toString();
                return entryFrequencyId === frequencyFilter;
            });
        }

        // Filtres rapides existants
        if (quickFilter !== 'all') {
            if (quickFilter === 'provisions') {
                entries = entries.filter(e => e.isProvision);
            } else if (quickFilter === 'borrowings') {
                const borrowingCat = "Emprunt ( Remboursement d')";
                entries = entries.filter(e => e.category && e.category.startsWith(borrowingCat));
            } else if (quickFilter === 'lendings') {
                const lendingCat = "Prêts (Remboursement de)";
                entries = entries.filter(e => e.category && e.category.startsWith(lendingCat));
            } else if (quickFilter === 'savings') {
                const epargneMainCategory = finalCategories.expense.find(cat => cat.name === 'Épargne');
                const epargneSubCategories = epargneMainCategory ? epargneMainCategory.subCategories.map(sc => sc.name) : [];
                entries = entries.filter(e => e.category && epargneSubCategories.includes(e.category));
            }
        }

        return entries;
    }, [processedBudgetEntries, searchTerm, isConsolidated, isCustomConsolidated, projectSearchTerm, projects, quickFilter, finalCategories, frequencyFilter]);

    // Fonction pour propager le filtre de fréquence aux entrées étendues
    const shouldIncludeExtendedEntry = useCallback((entry, filteredEntries) => {
        if (!entry.is_vat_child && !entry.is_vat_payment && !entry.is_tax_payment) {
            return filteredEntries.some(filteredEntry => filteredEntry.id === entry.id);
        }

        if (entry.is_vat_child) {
            const parentEntryId = entry.id.replace('_vat', '');
            return filteredEntries.some(filteredEntry => filteredEntry.id === parentEntryId);
        }

        if (entry.is_vat_payment || entry.is_tax_payment) {
            const associatedEntryId = entry.associatedEntryId || entry.id.replace('_vat_payment', '').replace('_tax_payment', '');
            return filteredEntries.some(filteredEntry => filteredEntry.id === associatedEntryId);
        }

        return true;
    }, []);

    // Fonction de visibilité
    const isRowVisibleInPeriods = useCallback((entry) => {
        return true;
    }, []);

    // Données traitées
    const safeBudgetEntries = useMemo(() => filteredBudgetEntries || [], [filteredBudgetEntries]);
    const safeActualTransactions = useMemo(() => finalActualTransactions || [], [finalActualTransactions]);
    const safeCategories = useMemo(() => finalCategories || {}, [finalCategories]);
    const safeVatRegimes = useMemo(() => vatRegimes || {}, [vatRegimes]);
    const safeTaxConfigs = useMemo(() => taxConfigs || [], [taxConfigs]);
    const safePeriods = useMemo(() => periods || [], [periods]);

    // Entrées étendues avec TVA
    const expandedAndVatEntries = useProcessedEntries(
        safeBudgetEntries,
        safeActualTransactions,
        safeCategories,
        safeVatRegimes,
        safeTaxConfigs,
        activeProjectId,
        safePeriods,
        isConsolidated,
        isCustomConsolidated,
        collectionData
    );

    // Enrichir les entrées avec les données de collection
    const entriesWithCollectionData = useMemo(() => {
        if (!expandedAndVatEntries || expandedAndVatEntries.length === 0) return [];

        return expandedAndVatEntries.map(entry => {
            const entryCollectionData = collectionData[entry.id] ||
                collectionData[entry.budget_detail_id] ||
                collectionData[entry.budget_id];

            return {
                ...entry,
                collectionData: entryCollectionData
            };
        });
    }, [expandedAndVatEntries, collectionData]);

    const filteredExpandedAndVatEntries = useMemo(() => {
        if (frequencyFilter === 'all') {
            return entriesWithCollectionData;
        }

        const filtered = entriesWithCollectionData.filter(entry =>
            shouldIncludeExtendedEntry(entry, filteredBudgetEntries)
        );

        return filtered;
    }, [entriesWithCollectionData, filteredBudgetEntries, frequencyFilter, shouldIncludeExtendedEntry]);

    const hasOffBudgetRevenues = useMemo(() => filteredExpandedAndVatEntries.some(e => e.isOffBudget && e.type === 'revenu' && isRowVisibleInPeriods(e)), [filteredExpandedAndVatEntries, isRowVisibleInPeriods]);
    const hasOffBudgetExpenses = useMemo(() => filteredExpandedAndVatEntries.some(e => e.isOffBudget && e.type === 'depense' && isRowVisibleInPeriods(e)), [filteredExpandedAndVatEntries, isRowVisibleInPeriods]);
    const groupedData = useGroupedData(filteredExpandedAndVatEntries, finalCategories, isRowVisibleInPeriods);

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
    }, [periods, effectiveCashAccounts, groupedData, filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses]);

    // Gestion des événements
    const toggleCollapse = (mainCatId) => {
        setCollapsedItems(prev => ({
            ...prev,
            [mainCatId]: !prev[mainCatId]
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
                requestAnimationFrame(() => { isSyncing = false; });
            }
        };
        const syncMainToTop = () => {
            if (!isSyncing) {
                isSyncing = true;
                topEl.scrollLeft = mainEl.scrollLeft;
                requestAnimationFrame(() => { isSyncing = false; });
            }
        };

        topEl.addEventListener('scroll', syncTopToMain);
        mainEl.addEventListener('scroll', syncMainToTop);
        return () => {
            topEl.removeEventListener('scroll', syncTopToMain);
            mainEl.removeEventListener('scroll', syncMainToTop);
        };
    }, []);

    const handleResize = (columnId, newWidth) => setColumnWidths(prev => ({ ...prev, [columnId]: Math.max(newWidth, 80) }));

    const supplierColLeft = columnWidths.category;
    const descriptionColLeft = supplierColLeft + columnWidths.supplier;
    const projectColLeft = descriptionColLeft + (visibleColumns.description ? columnWidths.description : 0);

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

    const getFrequencyTitle = (entry) => {
        const freq = (entry.frequency_name || entry.frequency || '');
        const freqFormatted = freq.charAt(0).toUpperCase() + freq.slice(1);

        if (freq.toLowerCase() === 'ponctuel' || freq.toLowerCase() === 'ponctuelle') {
            const dateToShow = entry.date || entry.start_date;
            return `Ponctuel: ${formatDate(dateToShow)}`;
        }
        if (freq.toLowerCase() === 'irregulier') {
            return `Irrégulier: ${entry.payments?.length || 0} paiements`;
        }
        const period = `De ${formatDate(entry.startDate || entry.start_date)} à ${(entry.endDate || entry.end_date) ? formatDate(entry.endDate || entry.end_date) : '...'}`;
        return `${freqFormatted} | ${period}`;
    };

    const getResteColor = (reste, isEntree) => reste === 0 ? 'text-text-secondary' : isEntree ? (reste <= 0 ? 'text-success-600' : 'text-danger-600') : (reste >= 0 ? 'text-success-600' : 'text-danger-600');

    const handleOpenPaymentDrawer = (entry, period) => {
        const entryActuals = finalActualTransactions.filter(actual => actual.budgetId === entry.id);

        uiDispatch({
            type: 'OPEN_INLINE_PAYMENT_DRAWER',
            payload: {
                actuals: entryActuals,
                entry: entry,
                period: period,
                periodLabel: period.label
            }
        });
    };

    const handleActualClick = (context) => {
        const { period } = context;
        let payments = [];
        let title = '';
        if (context.entryId) {
            const entry = filteredExpandedAndVatEntries.find(e => e.id === context.entryId);
            payments = finalActualTransactions.filter(t => t.budgetId === context.entryId).flatMap(t => (t.payments || []).filter(p => new Date(p.paymentDate) >= period.startDate && new Date(p.paymentDate) < period.endDate).map(p => ({ ...p, thirdParty: t.thirdParty, type: t.type })));
            title = `Détails pour ${entry?.supplier || 'Entrée'}`;
        } else if (context.mainCategory) {
            title = `Détails pour ${context.mainCategory.name}`;
        }
        if (payments.length > 0) setDrawerData({ isOpen: true, transactions: payments, title: `${title} - ${period.label}` });
    };

    const handleCloseDrawer = () => setDrawerData({ isOpen: false, transactions: [], title: '' });

    const handleDrillDown = () => {
        const newCollapsedState = {};
        groupedData.entree.forEach(mainCat => newCollapsedState[mainCat.id] = false);
        groupedData.sortie.forEach(mainCat => newCollapsedState[mainCat.id] = false);
        setCollapsedItems(newCollapsedState);
        setIsEntreesCollapsed(false);
        setIsSortiesCollapsed(false);
    };

    const handleDrillUp = () => {
        const newCollapsedState = {};
        groupedData.entree.forEach(mainCat => newCollapsedState[mainCat.id] = true);
        groupedData.sortie.forEach(mainCat => newCollapsedState[mainCat.id] = true);
        setCollapsedItems(newCollapsedState);
    };

    const numVisibleCols = Object.values(visibleColumns).filter(v => v).length;
    const periodColumnWidth = numVisibleCols > 0 ? numVisibleCols * 90 : 50;
    const separatorWidth = 4;

    const fixedColsWidth = columnWidths.category + columnWidths.supplier + (visibleColumns.description ? columnWidths.description : 0) + ((isConsolidated || isCustomConsolidated) ? columnWidths.project : 0);
    const totalTableWidth = fixedColsWidth + separatorWidth + (periods.length * (periodColumnWidth + separatorWidth));
    const totalCols = ((isConsolidated || isCustomConsolidated) ? 5 : 4) + (periods.length * 2);

    // Rendu des lignes de budget
    const renderBudgetRows = (type) => {
        const isEntree = type === 'entree';
        const mainCategories = groupedData[type] || [];
        const isCollapsed = type === 'entree' ? isEntreesCollapsed : isSortiesCollapsed;
        const toggleMainCollapse = type === 'entree' ? () => setIsEntreesCollapsed(p => !p) : () => setIsSortiesCollapsed(p => !p);
        const Icon = type === 'entree' ? TrendingUp : TrendingDown;
        const colorClass = type === 'entree' ? 'text-success-600' : 'text-danger-600';

        return (
            <>
                {/* Total Row for Type */}
                <tr className="bg-gray-200 border-gray-300 cursor-pointer border-y-2" onClick={toggleMainCollapse}>
                    <td className="sticky left-0 z-20 px-4 py-1 bg-gray-200 text-text-primary" style={{ width: columnWidths.category }}>
                        <div className="flex items-center gap-2 font-bold">
                            <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                            <Icon className={`w-4 h-4 ${colorClass}`} />
                            {isEntree ? 'Total Entrées' : 'Total Sorties'}
                        </div>
                    </td>
                    <td className="sticky z-20 px-4 py-1 bg-gray-200" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                    {visibleColumns.description && <td className="sticky z-20 px-4 py-1 bg-gray-200" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>}
                    {(isConsolidated || isCustomConsolidated) && <td className="sticky z-20 px-4 py-1 bg-gray-200" style={{ left: `${projectColLeft}px`, width: columnWidths.project }}></td>}

                    <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>
                    {periods.map((period, periodIndex) => {
                        const totals = calculateGeneralTotals(mainCategories, period, type, filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                        const reste = totals.budget - totals.actual;
                        const columnIdBase = period.startDate.toISOString();
                        const rowId = `total_${type}`;

                        return (
                            <React.Fragment key={periodIndex}>
                                <td className="px-2 py-1">
                                    {numVisibleCols > 0 && (
                                        <div className="flex justify-around gap-2 text-sm">
                                            {visibleColumns.budget && <div className="relative flex-1 font-normal text-center group/subcell text-text-primary">
                                                {formatCurrency(totals.budget, currencySettings)}
                                                <CommentButton rowId={rowId} columnId={`${columnIdBase}_budget`} rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`} columnName={`${period.label} (Prév.)`} />
                                            </div>}
                                            {visibleColumns.actual && <div className="relative flex-1 text-center group/subcell">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (totals.actual !== 0) handleActualClick({ type, period });
                                                    }}
                                                    disabled={totals.actual === 0}
                                                    className="font-normal text-text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {formatCurrency(totals.actual, currencySettings)}
                                                </button>
                                                <CommentButton rowId={rowId} columnId={`${columnIdBase}_actual`} rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`} columnName={`${period.label} (Réel)`} />
                                            </div>}
                                            {visibleColumns.reste && <div className={`relative group/subcell flex-1 text-center font-normal ${getResteColor(reste, isEntree)}`}>
                                                {formatCurrency(reste, currencySettings)}
                                                <CommentButton rowId={rowId} columnId={`${columnIdBase}_reste`} rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`} columnName={`${period.label} (Reste)`} />
                                            </div>}
                                        </div>
                                    )}
                                </td>
                                <td className="bg-surface"></td>
                            </React.Fragment>
                        );
                    })}
                </tr>

                {/* Catégories principales */}
                {!isCollapsed && mainCategories.length > 0 && mainCategories.map(mainCategory => {
                    const isMainCollapsed = collapsedItems[mainCategory.id];

                    return (
                        <React.Fragment key={mainCategory.id}>
                            {/* Main Category Row */}
                            <tr onClick={() => toggleCollapse(mainCategory.id)} className="text-gray-700 bg-gray-100 cursor-pointer hover:bg-gray-200">
                                <td className="sticky left-0 z-20 px-4 py-1 bg-gray-100" style={{ width: columnWidths.category }}>
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                        <ChevronDown className={`w-4 h-4 transition-transform ${isMainCollapsed ? '-rotate-90' : ''}`} />
                                        {mainCategory.name}
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-1 bg-gray-100" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && <td className="sticky z-20 px-4 py-1 bg-gray-100" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>}
                                {(isConsolidated || isCustomConsolidated) && <td className="sticky z-20 px-4 py-1 bg-gray-100" style={{ left: `${projectColLeft}px`, width: columnWidths.project }}></td>}
                                <td className="bg-surface"></td>
                                {periods.map((period, periodIndex) => {
                                    const totals = calculateMainCategoryTotals(mainCategory.entries, period, finalActualTransactions);
                                    const reste = totals.budget - totals.actual;
                                    const columnIdBase = period.startDate.toISOString();
                                    const rowId = `main_cat_${mainCategory.id}`;
                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <td className="px-2 py-1">
                                                {numVisibleCols > 0 && (
                                                    <div className="flex justify-around gap-2 text-xs">
                                                        {visibleColumns.budget && <div className="relative flex-1 font-normal text-center group/subcell">
                                                            {formatCurrency(totals.budget, currencySettings)}
                                                            <CommentButton rowId={rowId} columnId={`${columnIdBase}_budget`} rowName={mainCategory.name} columnName={`${period.label} (Prév.)`} />
                                                        </div>}
                                                        {visibleColumns.actual && <div className="relative flex-1 font-normal text-center group/subcell">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (totals.actual !== 0) handleActualClick({ mainCategory, period });
                                                                }}
                                                                disabled={totals.actual === 0}
                                                                className="hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {formatCurrency(totals.actual, currencySettings)}
                                                            </button>
                                                            <CommentButton rowId={rowId} columnId={`${columnIdBase}_actual`} rowName={mainCategory.name} columnName={`${period.label} (Réel)`} />
                                                        </div>}
                                                        {visibleColumns.reste && <div className={`relative group/subcell flex-1 text-center font-normal ${getResteColor(reste, isEntree)}`}>
                                                            {formatCurrency(reste, currencySettings)}
                                                            <CommentButton rowId={rowId} columnId={`${columnIdBase}_reste`} rowName={mainCategory.name} columnName={`${period.label} (Reste)`} />
                                                        </div>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="bg-surface"></td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>

                            {/* Entrées individuelles */}
                            {!isMainCollapsed && mainCategory.entries && mainCategory.entries
                                .filter(entry => isRowVisibleInPeriods(entry))
                                .map((entry) => {
                                    const project = (isConsolidated || isCustomConsolidated) ? projects.find(p => p.id === entry.projectId) : null;
                                    const subCat = mainCategory.subCategories && mainCategory.subCategories.find(sc => sc.name === entry.category);
                                    const criticality = subCat?.criticality;
                                    const critConfig = criticalityConfig[criticality];

                                    return (
                                        <tr key={entry.id} className={`border-b border-gray-100 hover:bg-gray-50 group ${entry.is_vat_child ? 'bg-gray-50/50' : (entry.is_vat_payment || entry.is_tax_payment ? 'bg-blue-50/50' : '')}`}>
                                            <td className={`px-4 py-1 font-normal text-gray-800 sticky left-0 bg-white group-hover:bg-gray-50 z-20 ${entry.is_vat_child ? 'pl-8' : ''}`} style={{ width: columnWidths.category }}>
                                                <div className="flex items-center gap-2">
                                                    {critConfig && <span className={`w-2 h-2 rounded-full ${critConfig.color}`} title={`Criticité: ${critConfig.label}`}></span>}
                                                    {entry.isProvision && <Lock className="w-3 h-3 text-indigo-500 shrink-0" />}
                                                    <span>{entry.category}</span>
                                                </div>
                                            </td>
                                            <td className="sticky z-10 px-4 py-1 text-gray-700 bg-white group-hover:bg-gray-50" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 truncate" title={getFrequencyTitle(entry)}>
                                                        <span className="truncate">{entry.supplier}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                                                        <button onClick={() => handleEditEntry(entry)} className="p-1 text-blue-500 hover:text-blue-700"><Edit size={14} /></button>
                                                        <button onClick={() => handleDeleteEntry(entry)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            </td>
                                            {visibleColumns.description !== false && (
                                                <td className="sticky z-10 px-4 py-1 text-xs text-gray-500 truncate bg-white group-hover:bg-gray-50"
                                                    style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}
                                                    title={getEntryDescription(entry)}>
                                                    {getEntryDescription(entry) !== 'Aucune description disponible' ? (
                                                        <span className="truncate">{getEntryDescription(entry)}</span>
                                                    ) : (
                                                        <span className="italic text-gray-400">-</span>
                                                    )}
                                                </td>
                                            )}
                                            {(isConsolidated || isCustomConsolidated) && (
                                                <td className="sticky z-10 px-4 py-1 text-gray-600 bg-white group-hover:bg-gray-50" style={{ left: `${projectColLeft}px`, width: columnWidths.project }}>
                                                    <div className="flex items-center gap-2">
                                                        <Folder className="w-4 h-4 text-blue-500" />
                                                        {project?.name || 'N/A'}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="bg-surface"></td>
                                            {periods.map((period, periodIndex) => {
                                                const budget = calculateEntryAmountForPeriod(entry, period.startDate, period.endDate);
                                                const actual = calculateActualAmountForPeriod(entry, finalActualTransactions, period.startDate, period.endDate);
                                                const reste = budget - actual;
                                                const columnIdBase = period.startDate.toISOString();
                                                return (
                                                    <React.Fragment key={periodIndex}>
                                                        <td className="px-2 py-1">
                                                            {numVisibleCols > 0 && (
                                                                <div className="flex justify-around gap-2 text-xs">
                                                                    {visibleColumns.budget && (
                                                                        <div className="relative flex-1 text-center text-gray-500 group/subcell">
                                                                            {formatCurrency(budget, currencySettings)}
                                                                            <CommentButton rowId={entry.id} columnId={`${columnIdBase}_budget`} rowName={entry.supplier} columnName={`${period.label} (Prév.)`} />
                                                                        </div>
                                                                    )}
                                                                    {visibleColumns.actual && (
                                                                        <div className="relative flex-1 text-center group/subcell">
                                                                            <button
                                                                                onClick={() => handleOpenPaymentDrawer(entry, period)}
                                                                                disabled={actual === 0 && budget === 0}
                                                                                className={`text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 ${entry.collectionData && entry.collectionData.collection && entry.collectionData.collection.length > 0
                                                                                    ? 'font-semibold text-green-600'
                                                                                    : ''
                                                                                    }`}
                                                                                title={entry.collectionData ? "Montant provenant des collections" : "Montant provenant des paiements"}
                                                                            >
                                                                                {formatCurrency(actual, currencySettings)}
                                                                                {entry.collectionData && entry.collectionData.collection && entry.collectionData.collection.length > 0 && (
                                                                                    <span className="ml-1 text-xs text-green-600" title="Données de collection">●</span>
                                                                                )}
                                                                            </button>
                                                                            <CommentButton rowId={entry.id} columnId={`${columnIdBase}_actual`} rowName={entry.supplier} columnName={`${period.label} (Réel)`} />
                                                                        </div>
                                                                    )}
                                                                    {visibleColumns.reste && (
                                                                        <div className={`relative group/subcell flex-1 text-center font-normal ${getResteColor(reste, isEntree)}`}>
                                                                            {formatCurrency(reste, currencySettings)}
                                                                            <CommentButton rowId={entry.id} columnId={`${columnIdBase}_reste`} rowName={entry.supplier} columnName={`${period.label} (Reste)`} />
                                                                        </div>
                                                                    )}
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

    // Afficher un état de chargement
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Chargement des données budgétaires...</div>
            </div>
        );
    }

    // Afficher une erreur
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

    // Afficher un message quand il n'y a pas de données
    if (hasNoData) {
        const selectedFrequencyLabel = frequencyOptions.find(opt => opt.id === frequencyFilter)?.label || 'cette fréquence';

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

    // Rendu conditionnel pour le mode lecture
    if (tableauMode === 'lecture') {
        return <LectureView {...props} />;
    }

    return (
        <>
            {/* Header */}
            {showTemporalToolbar && (
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
                    />
                </div>
            )}

            {/* Tableau */}
            <div className="relative z-10 overflow-hidden rounded-lg shadow-lg bg-surface">
                <div ref={topScrollRef} className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                    <div style={{ width: `${totalTableWidth}px`, height: '1px' }}></div>
                </div>
                <div ref={mainScrollRef} className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-30">
                            <tr>
                                <ResizableTh id="category" width={columnWidths.category} onResize={handleResize} className="sticky left-0 z-40 bg-gray-100">
                                    <div className="flex items-center justify-between w-full">
                                        <span>Catégorie</span>
                                        <div className="flex items-center">
                                            <button onClick={handleDrillUp} className="p-1 text-gray-500 hover:text-gray-800" title="Réduire tout"><ChevronUp size={16} /></button>
                                            <button onClick={handleDrillDown} className="p-1 text-gray-500 hover:text-gray-800" title="Développer tout"><ChevronDown size={16} /></button>
                                        </div>
                                    </div>
                                </ResizableTh>
                                <ResizableTh id="supplier" width={columnWidths.supplier} onResize={handleResize} className="sticky z-30 bg-gray-100" style={{ left: `${supplierColLeft}px` }}>
                                    {isTierSearchOpen ? (
                                        <div ref={tierSearchRef} className="flex items-center w-full gap-1">
                                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="w-full px-2 py-1 text-sm bg-white border rounded-md" autoFocus onClick={(e) => e.stopPropagation()} />
                                            <button onClick={() => { setSearchTerm(''); }} className="p-1 text-gray-500 hover:text-gray-800" title="Effacer"><XCircle size={16} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <span>Tiers</span>
                                            <button onClick={() => setIsTierSearchOpen(true)} className="p-1 text-gray-500 hover:text-gray-800" title="Rechercher par tiers"><Search size={14} /></button>
                                        </div>
                                    )}
                                </ResizableTh>
                                {visibleColumns.description && (
                                    <ResizableTh id="description" width={columnWidths.description} onResize={handleResize} className="sticky z-30 bg-gray-100" style={{ left: `${descriptionColLeft}px` }}>
                                        Description
                                    </ResizableTh>
                                )}
                                {(isConsolidated || isCustomConsolidated) && (
                                    <ResizableTh id="project" width={columnWidths.project} onResize={handleResize} className="sticky z-30 bg-gray-100" style={{ left: `${projectColLeft}px` }}>
                                        {isProjectSearchOpen ? (
                                            <div ref={projectSearchRef} className="flex items-center w-full gap-1">
                                                <input type="text" value={projectSearchTerm} onChange={(e) => setProjectSearchTerm(e.target.value)} placeholder="Rechercher..." className="w-full px-2 py-1 text-sm bg-white border rounded-md" autoFocus onClick={(e) => e.stopPropagation()} />
                                                <button onClick={() => { setProjectSearchTerm(''); }} className="p-1 text-gray-500 hover:text-gray-800" title="Effacer">
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between w-full">
                                                <span>Projet</span>
                                                <button onClick={() => setIsProjectSearchOpen(true)} className="p-1 text-gray-500 hover:text-gray-800" title="Rechercher par projet">
                                                    <Search size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </ResizableTh>
                                )}
                                <th className="border-b-2 bg-surface" style={{ width: `${separatorWidth}px` }}></th>
                                {periods.map((period, periodIndex) => {
                                    const isPast = period.endDate <= today;
                                    const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                                    const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                                    const netBudget = revenueTotals.budget - expenseTotals.budget;
                                    const isNegativeFlow = netBudget < 0;
                                    return (
                                        <React.Fragment key={periodIndex}>
                                            <th className={`px-2 py-2 text-center font-medium border-b-2 ${isPast ? 'bg-gray-50' : 'bg-surface'} ${isNegativeFlow && !isPast ? 'bg-red-50' : ''}`} style={{ minWidth: `${periodColumnWidth}px` }}>
                                                <div className={`text-base mb-1 ${isNegativeFlow && !isPast ? 'text-red-700' : 'text-gray-600'}`}>{period.label}</div>
                                                {numVisibleCols > 0 && (
                                                    <div className="flex justify-around gap-2 text-xs font-medium text-gray-600">
                                                        {visibleColumns.budget && <div className="flex-1">Prév.</div>}
                                                        {visibleColumns.actual && <div className="flex-1">Réel</div>}
                                                        {visibleColumns.reste && <div className="flex-1">Reste</div>}
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
                            {/* Ligne Trésorerie début de période */}
                            <tr className="text-gray-800 bg-gray-200">
                                <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-200" style={{ width: columnWidths.category }}>
                                    Trésorerie début de période
                                    <div className="mt-1 text-xs font-normal text-gray-500">
                                        {effectiveCashAccounts.length} compte(s) - Solde initial
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>}
                                {(isConsolidated || isCustomConsolidated) && <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${projectColLeft}px`, width: columnWidths.project }}></td>}
                                <td className="bg-surface"></td>
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

                            <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>
                            {renderBudgetRows('entree')}
                            <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>
                            {renderBudgetRows('sortie')}
                            <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>

                            {/* Ligne Flux de trésorerie */}
                            <tr className="bg-gray-200 border-t-2 border-gray-300">
                                <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-200 text-text-primary" style={{ width: columnWidths.category }}>
                                    <div className="flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4" />
                                        Flux de trésorerie
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>}
                                {(isConsolidated || isCustomConsolidated) && <td className="sticky z-20 px-4 py-2 bg-gray-200" style={{ left: `${projectColLeft}px`, width: columnWidths.project }}></td>}
                                <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>
                                {periods.map((period, periodIndex) => {
                                    const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                                    const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', filteredExpandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
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
                                                        {visibleColumns.budget && <div className={`relative group/subcell flex-1 text-center font-normal ${netBudget < 0 ? 'text-red-600' : 'text-text-primary'}`}>
                                                            {formatCurrency(netBudget, currencySettings)}
                                                            <CommentButton rowId={rowId} columnId={`${columnIdBase}_budget`} rowName="Flux de trésorerie" columnName={`${period.label} (Prév.)`} />
                                                        </div>}
                                                        {visibleColumns.actual && <div className="relative flex-1 font-normal text-center group/subcell">
                                                            <button onClick={() => netActual !== 0 && handleActualClick({ type: 'net', period })} disabled={netActual === 0} className="text-text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60">
                                                                {formatCurrency(netActual, currencySettings)}
                                                            </button>
                                                            <CommentButton rowId={rowId} columnId={`${columnIdBase}_actual`} rowName="Flux de trésorerie" columnName={`${period.label} (Réel)`} />
                                                        </div>}
                                                        {visibleColumns.reste && <div className={`relative group/subcell flex-1 text-center font-normal ${getResteColor(netReste, true)}`}>
                                                            {formatCurrency(netReste, currencySettings)}
                                                            <CommentButton rowId={rowId} columnId={`${columnIdBase}_reste`} rowName="Flux de trésorerie" columnName={`${period.label} (Reste)`} />
                                                        </div>}
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
                                <td className="sticky left-0 z-20 px-4 py-2 font-bold bg-gray-300" style={{ width: columnWidths.category }}>
                                    Trésorerie fin de période
                                    <div className="mt-1 text-xs font-normal text-gray-600">
                                        Solde initial + Flux net
                                    </div>
                                </td>
                                <td className="sticky z-20 px-4 py-2 bg-gray-300" style={{ left: `${supplierColLeft}px`, width: columnWidths.supplier }}></td>
                                {visibleColumns.description && <td className="sticky z-20 px-4 py-2 bg-gray-300" style={{ left: `${descriptionColLeft}px`, width: columnWidths.description }}></td>}
                                {(isConsolidated || isCustomConsolidated) && <td className="sticky z-20 px-4 py-2 bg-gray-300" style={{ left: `${projectColLeft}px`, width: columnWidths.project }}></td>}
                                <td className="bg-surface"></td>
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

export default BudgetTableView;