import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollectionModal } from './collection-modal';
import { getBudgets } from '../../../components/context/collectionActions';
import { useUI } from '../../../components/context/UIContext';

// Fonction CORRIGÉE pour générer les dates d'échéance
const generateDatesByFrequency = (frequencyId, startDate, endDate = null) => {
  const dates = [];
  const firstDueDate = new Date(startDate);
  firstDueDate.setHours(0, 0, 0, 0);

  // CAS 1: Transaction ponctuelle (fréquence ponctuelle/irrégulière)
  if (frequencyId === 1 || frequencyId === 9) {
    dates.push(new Date(firstDueDate));
    return dates;
  }

  // CAS 2: Budget avec end_date défini → la PREMIÈRE échéance est à l'end_date
  if (endDate) {
    const firstOccurrence = new Date(endDate); // ← PREMIÈRE ÉCHÉANCE = end_date
    firstOccurrence.setHours(0, 0, 0, 0);
    dates.push(firstOccurrence);

    // Pour les fréquences récurrentes, continuer à générer après l'end_date
    if (frequencyId !== 1 && frequencyId !== 9) {
      const futureEndDate = new Date(firstOccurrence);
      futureEndDate.setFullYear(futureEndDate.getFullYear() + 2);
      futureEndDate.setHours(23, 59, 59, 999);

      let currentDate = new Date(firstOccurrence);

      while (currentDate <= futureEndDate) {
        const nextDate = new Date(currentDate);
        switch (frequencyId) {
          case 2: // Quotidienne
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 3: // Mensuelle
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 4: // Hebdomadaire
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 5: // Bimensuelle
            nextDate.setDate(nextDate.getDate() + 15);
            break;
          case 6: // Trimestrielle
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 7: // Semestrielle
            nextDate.setMonth(nextDate.getMonth() + 6);
            break;
          case 8: // Annuelle
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          default:
            return dates;
        }

        if (nextDate <= futureEndDate) {
          dates.push(nextDate);
        }
        currentDate = nextDate;
      }
    }
  }
  // CAS 3: Budget sans end_date → commencer au start_date
  else {
    const futureEndDate = new Date(firstDueDate);
    futureEndDate.setFullYear(futureEndDate.getFullYear() + 2);
    futureEndDate.setHours(23, 59, 59, 999);

    let currentDate = new Date(firstDueDate);

    while (currentDate <= futureEndDate) {
      dates.push(new Date(currentDate));

      const nextDate = new Date(currentDate);
      switch (frequencyId) {
        case 2: // Quotidienne
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 3: // Mensuelle
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 4: // Hebdomadaire
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 5: // Bimensuelle
          nextDate.setDate(nextDate.getDate() + 15);
          break;
        case 6: // Trimestrielle
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 7: // Semestrielle
          nextDate.setMonth(nextDate.getMonth() + 6);
          break;
        case 8: // Annuelle
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          return dates;
      }

      currentDate = nextDate;
    }
  }

  return dates;
};
// Fonction transformBudgetData (inchangée sauf l'appel)
const transformBudgetData = (budgetData) => {
  const transactions = {};

  budgetData.forEach((budget) => {
    const frequencyId = budget.frequency_id;
    const type = budget.category_type_id === 2 ? 'receivable' : 'payable';

    // Appel simplifié sans is_duration_indefinite
    const dates = generateDatesByFrequency(
      frequencyId,
      budget.start_date,
      budget.end_date
    );

    dates.forEach((date, occurrenceIndex) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      if (!transactions[dateKey]) {
        transactions[dateKey] = [];
      }

      const uniqueId = `budget-${budget.budget_id}-${dateKey}-${occurrenceIndex}`;

      transactions[dateKey].push({
        id: uniqueId,
        thirdParty:
          budget.third_party_name && budget.third_party_firstname
            ? `${budget.third_party_name} ${budget.third_party_firstname}`
            : budget.third_party_name || budget.category_name,
        amount: parseFloat(budget.budget_amount || 0),
        type: type,
        category: budget.category_name,
        subCategory: budget.sub_category_name,
        date: dateKey,
        budget_id: budget.budget_id,
        start_date: budget.start_date,
        end_date: budget.end_date,
        frequency_id: frequencyId,
        frequency_name: budget.frequency_name,
        budget_type_id: budget.budget_type_id,
        budget_type_name: budget.budget_type_name,
        category_type_name: budget.category_type_name,
        entity_status_id: budget.entity_status_id,
        is_duration_indefinite: budget.is_duration_indefinite, // Gardé pour référence mais pas utilisé
        due_date: dateKey,
        occurrence_index: occurrenceIndex,
      });
    });
  });

  return transactions;
};
// Fonction pour calculer les transactions en retard
const calculateOverdueTransactions = (transactions) => {
  // Aujourd'hui en YYYY-MM-DD
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().split('T')[0];

  const overdue = [];

  Object.keys(transactions).forEach((dateKey) => {
    // Comparer directement les strings YYYY-MM-DD
    if (dateKey < todayKey) {
      transactions[dateKey].forEach((tx) => {
        if (tx.type === 'payable') {
          // Calculer les jours de retard
          const transactionDate = new Date(dateKey);
          const todayDate = new Date(todayKey);
          const daysOverdue = Math.floor(
            (todayDate - transactionDate) / (1000 * 60 * 60 * 24)
          );
          overdue.push({
            ...tx,
            daysOverdue,
          });
        }
      });
    }
  });

  return overdue;
};

// Composant DayCell avec liste déroulante complète
const DayCell = ({
  day,
  transactions = [],
  isToday,
  isCurrentMonth,
  viewMode,
}) => {
  const dayNumber = day.getDate();
  const dropdownRef = useRef(null);

  // États pour la liste déroulante et le modal
  const [showTransactionList, setShowTransactionList] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Calcul des totaux
  const { totalPayable, totalReceivable } = useMemo(() => {
    const payable = transactions.filter((tx) => tx.type === 'payable');
    const receivable = transactions.filter((tx) => tx.type === 'receivable');

    return {
      totalPayable: payable.reduce(
        (sum, tx) => sum + parseFloat(tx.amount || 0),
        0
      ),
      totalReceivable: receivable.reduce(
        (sum, tx) => sum + parseFloat(tx.amount || 0),
        0
      ),
    };
  }, [transactions]);

  // Fermeture au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTransactionList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTransactionClick = (e, tx) => {
    e.stopPropagation();
    setSelectedTransaction(tx);
    setShowPaymentModal(true);
    setShowTransactionList(false);
  };

  const handleCellClick = () => {
    if (transactions.length > 0) {
      setShowTransactionList(!showTransactionList);
    }
  };

  const cellHeightClass =
    viewMode === 'week' ? 'h-[calc(100vh-22rem)]' : 'h-32';

  return (
    <>
      <div
        className={`border-t border-r border-gray-200 p-2 flex flex-col ${cellHeightClass} ${
          isCurrentMonth ? 'bg-white' : 'bg-gray-50'
        } relative`}
      >
        {/* Numéro du jour en haut à droite */}
        <div
          className={`flex-shrink-0 text-sm font-medium ${
            isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
          } self-end`}
        >
          <span
            className={`w-6 h-6 flex items-center justify-center rounded-full ${
              isToday ? 'bg-blue-600 text-white' : ''
            }`}
          >
            {dayNumber}
          </span>
        </div>

        {/* Totaux centraux - bouton pour ouvrir la liste */}
        <div
          className="flex-grow flex flex-col justify-center space-y-1"
          ref={dropdownRef}
        >
          {/* Bouton principal pour ouvrir la liste */}
          {transactions.length > 0 && (
            <div className="relative">
              <button
                onClick={handleCellClick}
                className="w-full text-center space-y-1 hover:bg-gray-100 rounded transition-colors p-1"
              >
                {/* Total des revenus (vert) */}
                {totalReceivable > 0 && (
                  <div className="text-sm font-semibold text-green-600">
                    +{totalReceivable.toFixed(2)} €
                  </div>
                )}

                {/* Total des dépenses (rouge) */}
                {totalPayable > 0 && (
                  <div className="text-sm font-semibold text-red-600">
                    -{totalPayable.toFixed(2)} €
                  </div>
                )}
              </button>

              {/* Liste déroulante complète avec toutes les transactions */}
              <AnimatePresence>
                {showTransactionList && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {/* Transactions de revenus */}
                      {transactions
                        .filter((tx) => tx.type === 'receivable')
                        .map((tx, index) => (
                          <div
                            key={`receivable-${tx.id}-${index}`}
                            className="px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-green-50 transition-colors flex justify-between items-center cursor-pointer"
                            onClick={(e) => handleTransactionClick(e, tx)}
                          >
                            <div className="flex-1 min-w-0">
                              {tx.category && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {tx.subCategory}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                              <span className="text-xs font-mono text-green-600 whitespace-nowrap">
                                +{parseFloat(tx.amount).toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        ))}

                      {/* Transactions de dépenses */}
                      {transactions
                        .filter((tx) => tx.type === 'payable')
                        .map((tx, index) => (
                          <div
                            key={`payable-${tx.id}-${index}`}
                            className="px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-red-50 transition-colors flex justify-between items-center cursor-pointer"
                            onClick={(e) => handleTransactionClick(e, tx)}
                          >
                            <div className="flex-1 min-w-0">
                              {tx.category && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {tx.subCategory}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                              <span className="text-xs font-mono text-red-600 whitespace-nowrap">
                                -{parseFloat(tx.amount).toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'encaissement - Ajout de la prop cellDate */}
      <CollectionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        transaction={selectedTransaction}
        cellDate={day} // ← Ici on passe la date de la cellule
      />
    </>
  );
};

// Composant principal ScheduleView
const ScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [isViewModeMenuOpen, setIsViewModeMenuOpen] = useState(false);
  const viewModeMenuRef = useRef(null);
  const [budgetData, setBudgetData] = useState([]);
  const [frequency, setFrequency] = useState([]);
  const [loading, setLoading] = useState(true);
  const { uiState } = useUI();
  const projectId = uiState.activeProject?.id;

  // Définir todayKey une fois pour toutes
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().split('T')[0];

  // Gestion du clic en dehors du menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        viewModeMenuRef.current &&
        !viewModeMenuRef.current.contains(event.target)
      ) {
        setIsViewModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Transformation des données de l'API
  const { transactionsByDate, overdueTransactions } = useMemo(() => {
    if (!budgetData || budgetData.length === 0) {
      return { transactionsByDate: {}, overdueTransactions: [] };
    }

    const transformedTransactions = transformBudgetData(budgetData);

    const overdue = calculateOverdueTransactions(transformedTransactions);

    return {
      transactionsByDate: transformedTransactions,
      overdueTransactions: overdue,
    };
  }, [budgetData]);

  // Génération de la grille du calendrier
  const calendarGrid = useMemo(() => {
    const grid = [];
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const firstDayOfWeek = firstDayOfMonth.getDay();
      const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      const gridStartDate = new Date(firstDayOfMonth);
      gridStartDate.setDate(gridStartDate.getDate() - startOffset);

      for (let i = 0; i < 42; i++) {
        const day = new Date(gridStartDate);
        day.setDate(day.getDate() + i);
        grid.push(day);
      }
    } else {
      const currentDayOfWeek = currentDate.getDay();
      const startOffset = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      const weekStartDate = new Date(currentDate);
      weekStartDate.setDate(weekStartDate.getDate() - startOffset);

      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStartDate);
        day.setDate(day.getDate() + i);
        grid.push(day);
      }
    }
    return grid;
  }, [currentDate, viewMode]);

  // Libellé de l'en-tête
  const headerLabel = useMemo(() => {
    if (viewMode === 'month') {
      const label = currentDate.toLocaleString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
      return label.charAt(0).toUpperCase() + label.slice(1);
    } else {
      if (calendarGrid.length === 0) return '';
      const startOfWeek = new Date(calendarGrid[0]);
      const endOfWeek = new Date(calendarGrid[6]);
      const startFormatted = startOfWeek.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      });
      const endFormatted = endOfWeek.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return `Semaine du ${startFormatted} au ${endFormatted}`;
    }
  }, [currentDate, viewMode, calendarGrid]);

  // Navigation
  const goToPrevious = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setDate(newDate.getDate() - 7);
      }
      return newDate;
    });
  };

  const goToNext = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // const handleTransactionClick = (e, tx) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   console.log('Transaction cliquée:', tx);
  // };

  // Chargement des données
  const fetchData = async () => {
    if (projectId) {
      try {
        setLoading(true);
        const res = await getBudgets(projectId);
        if (res.status === 200) {
          setBudgetData(res.budget);
          setFrequency(res.frequencies);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const daysOfWeek = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche',
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-full">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Chargement des données...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-full">
      <div className="flex flex-col lg:flex-row gap-8 h-full">
        {/* Calendrier - Partie principale */}
        <div className="flex-grow flex flex-col">
          {/* En-tête avec contrôles */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xl font-semibold text-gray-800">
                  {headerLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Sélecteur de vue */}
              <div className="relative" ref={viewModeMenuRef}>
                <button
                  onClick={() => setIsViewModeMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 h-9 rounded-md bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition-colors"
                >
                  <span>{viewMode === 'month' ? 'Mois' : 'Semaine'}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isViewModeMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isViewModeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border z-20"
                    >
                      <ul className="p-1">
                        <li>
                          <button
                            onClick={() => {
                              setViewMode('month');
                              setIsViewModeMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${
                              viewMode === 'month'
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            Mois
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              setViewMode('week');
                              setIsViewModeMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${
                              viewMode === 'week'
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            Semaine
                          </button>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Contrôles de navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={goToPrevious}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={goToNext}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendrier */}
          <div className="bg-white rounded-lg shadow-md border overflow-hidden flex flex-col flex-grow">
            {/* En-tête des jours de la semaine */}
            <div className="grid grid-cols-7 border-b">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-semibold text-gray-500 uppercase"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grille des jours */}
            <div className="grid grid-cols-7 flex-grow">
              {calendarGrid.map((day, index) => {
                // Créer la dateKey de manière cohérente
                const year = day.getFullYear();
                const month = String(day.getMonth() + 1).padStart(2, '0');
                const dayNumber = String(day.getDate()).padStart(2, '0');
                const dateKey = `${year}-${month}-${dayNumber}`;

                const isTodayCell = dateKey === todayKey;
                const isCurrentMonth =
                  day.getMonth() === currentDate.getMonth();

                return (
                  <DayCell
                    key={index}
                    day={day}
                    transactions={transactionsByDate[dateKey] || []}
                    isToday={isTodayCell}
                    isCurrentMonth={isCurrentMonth}
                    viewMode={viewMode}
                  />
                );
              })}
            </div>
            <div className="border-t bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Vert : Revenus (entrées d'argent)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Rouge : Dépenses (sorties d'argent)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panneau latéral pour les échéances en retard */}
        {/* <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Échéances en Retard
          </h2>
          <div className="bg-white rounded-lg shadow-md border p-4 h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
            {overdueTransactions.length > 0 ? (
              <ul className="space-y-2">
                {overdueTransactions.map((tx, index) => {
                  const isPayable = tx.type === 'payable';
                  return (
                    <li key={index}>
                      <button
                        onClick={(e) => handleTransactionClick(e, tx)}
                        className="w-full text-left p-2 rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${
                                isPayable ? 'bg-red-100' : 'bg-green-100'
                              }`}
                            >
                              {isPayable ? (
                                <ArrowDown className="w-4 h-4 text-red-600" />
                              ) : (
                                <ArrowUp className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <p
                                className="font-semibold truncate text-gray-800"
                                title={tx.thirdParty}
                              >
                                {tx.thirdParty}
                              </p>
                              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                <span>
                                  {new Date(tx.date).toLocaleDateString(
                                    'fr-FR'
                                  )}
                                </span>
                                <span className="text-gray-500">
                                  ({tx.daysOverdue}j en retard)
                                </span>
                              </div>
                              <div className="text-xs text-blue-600 mt-0.5">
                                {tx.frequency_name &&
                                tx.frequency_name !== 'Ponctuelle' &&
                                tx.frequency_name !== 'Irrégulière' ? (
                                  <span>
                                    À partir du{' '}
                                    {new Date(tx.start_date).toLocaleDateString(
                                      'fr-FR'
                                    )}
                                    {` (${tx.frequency_name.toLowerCase()})`}
                                  </span>
                                ) : (
                                  <span>
                                    Le{' '}
                                    {new Date(tx.start_date).toLocaleDateString(
                                      'fr-FR'
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-base font-normal whitespace-nowrap pl-2 text-gray-600">
                            {parseFloat(tx.amount || 0).toFixed(2)} €
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>Aucune échéance en retard.</p>
                <p className="text-sm mt-1">Félicitations !</p>
              </div>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default ScheduleView;
