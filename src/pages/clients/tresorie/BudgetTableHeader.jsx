import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, TableProperties, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    // Props pour le filtre de fréquence
    frequencyFilter,
    setFrequencyFilter,
    isFrequencyFilterOpen,
    setIsFrequencyFilterOpen,
    frequencyFilterRef
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

    // Options de fréquence
    const frequencyOptions = [
        { id: 'all', label: 'Toutes les fréquences' },
        { id: 'ponctuel', label: 'Ponctuel' },
        { id: 'journalier', label: 'Journalier' },
        { id: 'hebdomadaire', label: 'Hebdomadaire' },
        { id: 'mensuel', label: 'Mensuel' },
        { id: 'bimestriel', label: 'Bimestriel' },
        { id: 'trimestriel', label: 'Trimestriel' },
        { id: 'semestriel', label: 'Semestriel' },
        { id: 'annuel', label: 'Annuel' },
        { id: 'irregulier', label: 'Paiement irrégulier' },
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

    return (
        <div className="relative z-50 mb-6"> {/* Z-INDEX TRÈS ÉLEVÉ */}
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
                    
                    {/* Filtre de fréquence - Z-INDEX CORRIGÉ */}
                    <div className="relative" ref={frequencyFilterRef}>
                        <button
                            onClick={() => setIsFrequencyFilterOpen(p => !p)}
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
                                    className="absolute left-0 z-50 w-56 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl top-full"
                                >
                                    <div className="p-2 border-b border-gray-100">
                                        <div className="text-xs font-semibold text-gray-500 uppercase">Filtrer par fréquence</div>
                                    </div>
                                    <ul className="p-1 overflow-y-auto max-h-60">
                                        {frequencyOptions.map(option => (
                                            <li key={option.id}>
                                                <button
                                                    onClick={() => {
                                                        setFrequencyFilter(option.id);
                                                        setIsFrequencyFilterOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between ${
                                                        frequencyFilter === option.id 
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

                    {/* Menu période - Z-INDEX CORRIGÉ */}
                    <div className="relative" ref={periodMenuRef}>
                        <button
                            onClick={() => setIsPeriodMenuOpen(p => !p)}
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
                                    className="absolute left-0 z-50 w-48 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl top-full"
                                >
                                    <ul className="p-1">
                                        {quickPeriodOptions.map(option => (
                                            <li key={option.id}>
                                                <button
                                                    onClick={() => {
                                                        handleQuickPeriodSelect(option.id);
                                                        setIsPeriodMenuOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${
                                                        activeQuickSelect === option.id 
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

export default BudgetTableHeader;