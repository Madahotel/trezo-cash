import React, { useMemo } from 'react';
import {
    ChevronDown, ChevronLeft, ChevronRight,
    Plus, TableProperties, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BudgetTableHeader = ({
    timeUnit,
    periodOffset,
    activeQuickSelect,
    tableauMode,
    setTableauMode,
    showViewModeSwitcher = true,
    showNewEntryButton = true,
    isConsolidated = false,
    isCustomConsolidated = false,
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

    const periodLabel = useMemo(() => {
        if (periodOffset === 0) return 'Actuel';
        const label = timeUnitLabels[timeUnit] || 'Période';
        const plural = Math.abs(periodOffset) > 1 ? 's' : '';
        return `${periodOffset > 0 ? '+' : ''}${periodOffset} ${label}${plural}`;
    }, [periodOffset, timeUnit, timeUnitLabels]);

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

    // Déterminer si on est en vue consolidée
    const isConsolidatedView = isConsolidated || isCustomConsolidated;

    return (
        <div className="relative z-50 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                {/* Section gauche : Navigation temporelle et filtres */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    {/* Navigation période */}
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
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${isFrequencyFilterOpen ? 'rotate-180' : ''}`}
                            />
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
                                        <div className="text-xs font-semibold text-gray-500 uppercase">
                                            Filtrer par fréquence
                                        </div>
                                    </div>
                                    <ul className="p-1 overflow-y-auto max-h-60">
                                        {frequencyOptions.map(option => (
                                            <li key={option.id}>
                                                <button
                                                    onClick={() => handleFrequencySelect(option.id)}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between 
                                                        ${frequencyFilter === option.id
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

                    {/* Menu période rapide */}
                    <div className="relative" ref={periodMenuRef}>
                        <button
                            onClick={handlePeriodClick}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 hover:text-blue-600"
                        >
                            <span>{selectedPeriodLabel}</span>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${isPeriodMenuOpen ? 'rotate-180' : ''}`}
                            />
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
                                                    className={`w-full text-left px-3 py-1.5 text-sm rounded-md 
                                                        ${activeQuickSelect === option.id
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
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setTableauMode('edition')}
                        className={`flex items-center gap-2 text-sm font-semibold transition-colors 
                            ${tableauMode === 'edition'
                                ? 'text-blue-600'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                        title="Mode Tableau Croisé Dynamique"
                    >
                        <TableProperties size={16} />
                        TCD
                    </button>

                    {(!isConsolidatedView || showNewEntryButton) && (
                        <button
                            onClick={handleNewBudget}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isConsolidatedView}
                            title={isConsolidatedView
                                ? "Non disponible en vue consolidée"
                                : "Ajouter une nouvelle entrée"
                            }
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

export default BudgetTableHeader;