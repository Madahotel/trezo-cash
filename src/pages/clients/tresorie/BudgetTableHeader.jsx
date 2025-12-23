import React, { useMemo, useEffect } from 'react';
import {
    ChevronDown, ChevronLeft, ChevronRight,
    Plus, Filter,
    CalendarRange,
    Eye, EyeOff,
    TrendingUp, TrendingDown, ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GRANULARITY = {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    BIMESTER: 'bimester',
    TRIMESTER: 'trimester',
    SEMESTER: 'semester',
    YEAR: 'year',
    YEAR3: 'year3',
    YEAR5: 'year5',
    YEAR7: 'year7',
};

const BudgetTableHeader = ({
    timeView,
    timeRange,
    handleTimeNavigation,
    handleTimeViewSelect,
    handleNewBudget,
    showTotals,
    setShowTotals,
    frequencyFilter,
    setFrequencyFilter,
    isPeriodMenuOpen,
    setIsPeriodMenuOpen,
    periodMenuRef,
    isFrequencyFilterOpen,
    setIsFrequencyFilterOpen,
    frequencyFilterRef,
    showNewEntryButton = true,
    today = new Date(),
    isConsolidated = false,
    isCustomConsolidated = false,
    tableauMode = 'edition',
    setTableauMode,
    showViewModeSwitcher = true,
    focusType = 'net',
    onFocusChange,
}) => {

    const periodOptions = useMemo(() => [
        { id: 'P1W', label: 'Semaine', range: 'P7D', granularity: GRANULARITY.WEEK, description: '7 jours (affichage par jour)' },
        { id: 'P1M', label: 'Mois', range: 'P1M', granularity: GRANULARITY.MONTH, description: '1 mois (affichage par semaine)' },
        { id: 'P2M', label: 'Bimestre', range: 'P2M', granularity: GRANULARITY.BIMESTER, description: '2 mois (affichage par semaine)' },
        { id: 'P3M', label: 'Trimestre', range: 'P3M', granularity: GRANULARITY.TRIMESTER, description: '3 mois (affichage par quinzaine)' },
        { id: 'P6M', label: 'Semestre', range: 'P6M', granularity: GRANULARITY.SEMESTER, description: '6 mois (affichage par mois)' },
        { id: 'P1Y', label: 'Année', range: 'P1Y', granularity: GRANULARITY.YEAR, description: '12 mois (affichage par mois)' },
        { id: 'P3Y', label: 'Année +3', range: 'P3Y', granularity: GRANULARITY.YEAR3, description: '3 ans (affichage par semestre)' },
        { id: 'P5Y', label: 'Année +5', range: 'P5Y', granularity: GRANULARITY.YEAR5, description: '5 ans (affichage par année)' },
        { id: 'P7Y', label: 'Année +7', range: 'P7Y', granularity: GRANULARITY.YEAR7, description: '7 ans (affichage par année)' },
    ], []);

    const frequencyOptions = [
        { id: 'all', label: 'Toutes fréquences' },
        { id: '1', label: 'Ponctuel' },
        { id: '2', label: 'Journalier' },
        { id: '3', label: 'Hebdomadaire' },
        { id: '4', label: 'Mensuel' },
        { id: '5', label: 'Bimensuel' },
        { id: '6', label: 'Trimestriel' },
        { id: '7', label: 'Semestriel' },
        { id: '8', label: 'Annuel' },
    ];

    const selectedFrequencyLabel = useMemo(
        () => frequencyOptions.find(f => f.id === frequencyFilter)?.label || 'Fréquence',
        [frequencyFilter]
    );

    const findCurrentPeriod = () => {
        if (!timeRange) return null;
        const normalizedTimeRange = timeRange.toString().trim().toLowerCase();

        for (const option of periodOptions) {
            if (normalizedTimeRange === option.id.toLowerCase()) {
                return option;
            }
            if (normalizedTimeRange === option.range.toLowerCase()) {
                return option;
            }
            if (normalizedTimeRange === option.granularity.toLowerCase()) {
                return option;
            }
        }

        return null;
    };

    const currentPeriod = useMemo(() => findCurrentPeriod(), [timeRange, periodOptions]);

    const displayLabel = useMemo(() => {
        if (!currentPeriod) return 'Sélectionner';
        if (currentPeriod.range === 'P1D' || currentPeriod.granularity === 'day') {
            return `Aujourd'hui – ${today.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })}`;
        }
        return currentPeriod.label;
    }, [currentPeriod, today]);

    const getNavigationLabel = (direction) => {
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
        return labels[timeView]?.[direction] || 'Navigation';
    };

    const handlePeriodSelect = (opt) => {
        console.log('Selecting period:', opt);
        handleTimeViewSelect(opt.granularity, opt.range);
        setIsPeriodMenuOpen(false);
    };

    const isPeriodSelected = (opt) => {
        if (!timeRange || !currentPeriod) return false;
        return opt.id === currentPeriod.id ||
            opt.range === currentPeriod.range ||
            opt.granularity === currentPeriod.granularity;
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (periodMenuRef?.current && !periodMenuRef.current.contains(e.target)) {
                setIsPeriodMenuOpen(false);
            }
            if (frequencyFilterRef?.current && !frequencyFilterRef.current.contains(e.target)) {
                setIsFrequencyFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative z-20 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button onClick={() => handleTimeNavigation(-1)}
                        title={getNavigationLabel(-1)}
                        className="p-2 border rounded-lg hover:bg-gray-100">
                        <ChevronLeft size={18} />
                    </button>

                    <button onClick={() => handleTimeNavigation('today')}
                        className="px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg">
                        Aujourd'hui
                    </button>

                    <button onClick={() => handleTimeNavigation(1)}
                        title={getNavigationLabel(1)}
                        className="p-2 border rounded-lg hover:bg-gray-100">
                        <ChevronRight size={18} />
                    </button>

                    {/* PERIOD SELECT */}
                    <div ref={periodMenuRef} className="relative">
                        <button
                            onClick={() => setIsPeriodMenuOpen(v => !v)}
                            className="flex items-center justify-between min-w-[220px] px-4 py-2 border rounded-lg bg-white hover:bg-blue-50">
                            <span className="flex items-center gap-2">
                                <CalendarRange size={16} />
                                {displayLabel}
                            </span>
                            <ChevronDown size={14} />
                        </button>

                        <AnimatePresence>
                            {isPeriodMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute mt-2 w-[320px] bg-white border rounded-lg shadow-xl z-50"
                                >
                                    {periodOptions.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handlePeriodSelect(opt)}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50
                                                ${isPeriodSelected(opt) ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}>
                                            <div className="font-medium">{opt.label}</div>
                                            <div className="text-xs text-gray-500">{opt.description}</div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* VIEW MODE SWITCHER */}
                    {showViewModeSwitcher && (
                        <div className="flex items-center gap-2 ml-2">
                            <button
                                onClick={() => setTableauMode('edition')}
                                className={`px-3 py-2 text-sm font-medium rounded-lg ${tableauMode === 'edition' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                TCD
                            </button>
                            <button
                                onClick={() => setTableauMode('lecture')}
                                className={`px-3 py-2 text-sm font-medium rounded-lg ${tableauMode === 'lecture' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Lecture
                            </button>
                        </div>
                    )}
                </div>

                {/* FREQUENCY FILTER */}
                <div ref={frequencyFilterRef} className="relative">
                    <button
                        onClick={() => setIsFrequencyFilterOpen(v => !v)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg">
                        <Filter size={14} />
                        {selectedFrequencyLabel}
                        <ChevronDown size={12} />
                    </button>

                    <AnimatePresence>
                        {isFrequencyFilterOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute z-50 w-56 mt-2 bg-white border rounded-lg shadow-xl"
                            >
                                {frequencyOptions.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => {
                                            setFrequencyFilter(opt.id);
                                            setIsFrequencyFilterOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left hover:bg-gray-50
                                            ${frequencyFilter === opt.id ? 'bg-blue-50' : ''}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
            <div className="px-4 py-2 mt-3 text-xs border border-blue-100 rounded-lg bg-blue-50">
                <strong>Mode d'affichage :</strong> {currentPeriod ? currentPeriod.description : 'Non sélectionné'}
                {tableauMode === 'lecture' && ' | Mode Lecture'}
                {currentPeriod && ` (${currentPeriod.label})`}
                {focusType && ` | Focus: ${focusType === 'entree' ? 'Entrées' : focusType === 'sortie' ? 'Sorties' : 'Net'}`}
            </div>
        </div>
    );
};

export default BudgetTableHeader;