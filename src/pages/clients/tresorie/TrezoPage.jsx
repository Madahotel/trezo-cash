import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BudgetTracker from './BudgetTracker';
import { useUI } from '../../../components/context/UIContext';
import { useData } from '../../../components/context/DataContext';
import { updateProjectOnboardingStep } from '../../../components/context/actions';
import { useActiveProjectData } from '../../../hooks/useActiveProjectData';
import { Lock, PiggyBank, Banknote, Coins, Filter, AlertCircle } from 'lucide-react';
import WidgetIcon from '../../../pages/clients/dashboard/WidgetIcon';

const defaultTrezoWidgetSettings = {
    trezo_toolbar: false, trezo_toolbar_temporal: false, trezo_toolbar_viewmode: false, trezo_toolbar_new_entry: false,
    trezo_col_budget: true, trezo_col_actual: true, trezo_col_reste: false, trezo_col_description: true,
    trezo_quick_filters: false, trezo_quickfilter_provisions: false, trezo_quickfilter_savings: false,
    trezo_quickfilter_borrowings: false, trezo_quickfilter_lendings: false,
};

const TrezoPage = () => {
    const { uiState, uiDispatch } = useUI();
    const { dataState, dataDispatch } = useData();
    const navigate = useNavigate();
    const { activeProjectId } = uiState;

    const {
        activeProject,
        isConsolidated,
        isCustomConsolidated,
        budgetEntries,
        actualTransactions,
        cashAccounts,
        loading: dataLoading,
        error: dataError,
        consolidatedBudgetData
    } = useActiveProjectData(dataState, uiState);

    const [quickFilter, setQuickFilter] = useState('all');
    const [showConsolidatedData, setShowConsolidatedData] = useState(false);

    useEffect(() => {
        // Lorsque nous sommes en vue consolidée, forcer l'affichage des données
        if (isConsolidated || isCustomConsolidated) {
            setShowConsolidatedData(true);

            // Debug logging
            console.log('TrezoPage - Vue consolidée détectée:');
            console.log('- activeProjectId:', activeProjectId);
            console.log('- activeProject:', activeProject);
            console.log('- isConsolidated:', isConsolidated);
            console.log('- isCustomConsolidated:', isCustomConsolidated);
            console.log('- budgetEntries count:', budgetEntries?.length);
            console.log('- consolidatedBudgetData:', consolidatedBudgetData);
        }
    }, [isConsolidated, isCustomConsolidated, activeProjectId, activeProject, budgetEntries, consolidatedBudgetData]);

    const widgetVisibility = useMemo(() => ({
        ...defaultTrezoWidgetSettings,
        ...(activeProject?.dashboard_widgets || {})
    }), [activeProject]);

    const handleValidation = () => {
        updateProjectOnboardingStep({ dataDispatch, uiDispatch }, { projectId: activeProjectId, step: 'flux' });
        navigate('/app/flux');
    };

    const showValidationButton = activeProject && activeProject.onboarding_step === 'trezo';

    const filterOptions = [
        { id: 'all', label: 'Tout', color: 'bg-white shadow text-blue-600', hoverColor: '' },
        { id: 'provisions', label: 'Provisions', icon: Lock, color: 'bg-indigo-100 text-indigo-700', hoverColor: 'hover:bg-indigo-200' },
        { id: 'savings', label: 'Épargnes', icon: PiggyBank, color: 'bg-teal-100 text-teal-700', hoverColor: 'hover:bg-teal-200' },
        { id: 'borrowings', label: 'Emprunts', icon: Banknote, color: 'bg-red-100 text-red-700', hoverColor: 'hover:bg-red-200' },
        { id: 'lendings', label: 'Prêts', icon: Coins, color: 'bg-green-100 text-green-700', hoverColor: 'hover:bg-green-200' },
    ];

    const handleOpenSettings = () => {
        uiDispatch({ type: 'OPEN_CUSTOMIZATION_DRAWER', payload: 'trezo' });
    };

    // Afficher un message spécial pour les vues consolidées
    if (isConsolidated || isCustomConsolidated) {
        console.log('Rendu de la vue consolidée dans TrezoPage');

        // Debug: Vérifier si nous avons des données
        const hasBudgetData = budgetEntries && budgetEntries.length > 0;
        const hasConsolidatedData = consolidatedBudgetData &&
            (consolidatedBudgetData.budgetEntries?.length > 0 ||
                consolidatedBudgetData.entries?.length > 0);

        return (
            <div className="min-h-screen p-6 bg-white">
                <div className="">
                    {/* Header avec le nom de la vue consolidée */}
                    <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-xl">
                                    <Filter className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-900 to-indigo-900 bg-clip-text">
                                        Trésorerie Consolidée
                                    </h1>
                                    <p className="text-lg text-gray-600">
                                        Vue globale de la trésorerie de{' '}
                                        <span className="font-semibold text-purple-900">
                                            {activeProject?.name || 'la vue consolidée'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Afficher les données consolidées */}
                    {dataLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="text-lg">Chargement des données consolidées...</div>
                        </div>
                    ) : dataError ? (
                        <div className="p-4 mb-6 rounded-lg bg-red-50">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertCircle className="w-5 h-5" />
                                <span>Erreur: {dataError}</span>
                            </div>
                        </div>
                    ) : (
                        <BudgetTracker
                            quickFilter={quickFilter}
                            showTemporalToolbar={false}
                            visibleColumns={{
                                budget: true,
                                actual: true,
                                reste: false,
                                description: true,
                            }}
                            showViewModeSwitcher={false}
                            showNewEntryButton={false}
                            consolidatedData={consolidatedBudgetData}
                            isConsolidated={isConsolidated}
                            isCustomConsolidated={isCustomConsolidated}

                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {widgetVisibility.trezo_quick_filters && filterOptions.map(opt => {
                            const visibilityKey = `trezo_quickfilter_${opt.id}`;
                            if (opt.id === 'all' || widgetVisibility[visibilityKey]) {
                                const Icon = opt.icon;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => setQuickFilter(opt.id)}
                                        className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${quickFilter === opt.id ? opt.color : `bg-gray-100 text-gray-700 ${opt.hoverColor}`}`}
                                    >
                                        {Icon && <Icon size={14} />}
                                        {opt.label}
                                    </button>
                                );
                            }
                            return null;
                        })}
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                        {showValidationButton && (
                            <button
                                onClick={handleValidation}
                                className="px-4 py-2 text-sm font-semibold text-white transition-colors bg-green-600 rounded-lg shadow-sm hover:bg-green-700"
                            >
                                Valider mon tableau et voir mon flux de trésorerie
                            </button>
                        )}
                        <button
                            onClick={handleOpenSettings}
                            className="hidden p-2 text-gray-600 transition-colors bg-white border rounded-lg md:block hover:bg-gray-100"
                            title="Personnaliser le tableau de trésorerie"
                        >
                            <WidgetIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <BudgetTracker
                    quickFilter={quickFilter}
                    showTemporalToolbar={false}
                    visibleColumns={{
                        budget: true,
                        actual: true,
                        reste: false,
                        description: true,
                        project: true, 
                    }}
                    showViewModeSwitcher={false}
                    showNewEntryButton={false}
                    consolidatedData={consolidatedBudgetData}
                    isConsolidated={isConsolidated}
                    isCustomConsolidated={isCustomConsolidated}
                />
            </div>
        </>
    );
};

export default TrezoPage;