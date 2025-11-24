import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollectionModal } from './collection-modal';
import { useUI } from '../../../components/context/UIContext';
import { apiGet } from '../../../components/context/actionsMethode';

// Fonction pour formater une date en YYYY-MM-DD (temps local)
const formatDateToKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fonction pour obtenir la date d'aujourd'hui
const getTodayKey = () => {
  return formatDateToKey(new Date());
};

// Fonction pour générer les dates d'échéance (utilise le format local)
const generateDatesByFrequency = (frequencyId, startDate, endDate = null) => {
  const dates = [];

  // Convertir les dates d'entrée en objets Date avec heure locale
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  if (frequencyId === 1 || frequencyId === 9) {
    dates.push(new Date(start));
    return dates;
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let currentDate = new Date(start);

    while (currentDate <= end) {
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
  } else {
    const futureEndDate = new Date(start);
    futureEndDate.setFullYear(futureEndDate.getFullYear() + 2);
    futureEndDate.setHours(23, 59, 59, 999);

    let currentDate = new Date(start);

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

const transformBudgetData = (budgetData) => {
  const transactions = {};

  budgetData.forEach((budget) => {
    const frequencyId = budget.frequency_id;
    const type = budget.category_type_id === 2 ? 'receivable' : 'payable';

    const dates = generateDatesByFrequency(
      frequencyId,
      budget.start_date,
      budget.end_date
    );

    dates.forEach((date, occurrenceIndex) => {
      // Utiliser formatDateToKey au lieu de manipulation manuelle
      const dateKey = formatDateToKey(date);

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
        is_duration_indefinite: budget.is_duration_indefinite,
        due_date: dateKey,
        occurrence_index: occurrenceIndex,
      });
    });
  });

  return transactions;
};

// Composant DayCell (inchangé sauf pour le formatage des dates)
const DayCell = ({
  day,
  transactions = [],
  isToday,
  isCurrentMonth,
  viewMode,
}) => {
  const dayNumber = day.getDate();
  const dropdownRef = useRef(null);

  const [showTransactionList, setShowTransactionList] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
    viewMode === 'week' ? 'h-[calc(100vh-20rem)]' : 'h-28';

  return (
    <>
      <div
        className={`p-2 flex flex-col ${cellHeightClass} ${
          isCurrentMonth
            ? isToday
              ? 'bg-blue-50'
              : 'bg-white hover:bg-gray-50'
            : 'bg-gray-50/30'
        } transition-colors duration-150 relative group`}
      >
        <div className="flex justify-between items-start mb-1">
          <span
            className={`text-sm font-medium ${
              isCurrentMonth
                ? isToday
                  ? 'text-blue-600'
                  : 'text-gray-700'
                : 'text-gray-400'
            }`}
          >
            {dayNumber}
          </span>
        </div>

        <div
          className="flex-grow flex flex-col justify-center space-y-1"
          ref={dropdownRef}
        >
          {transactions.length > 0 && (
            <div className="relative">
              <button
                onClick={handleCellClick}
                className="w-full text-center space-y-1 hover:bg-white/60 rounded-lg transition-colors p-1"
              >
                {totalReceivable > 0 && (
                  <div className="text-xs font-semibold text-green-600">
                    +{totalReceivable.toFixed(0)}€
                  </div>
                )}

                {totalPayable > 0 && (
                  <div className="text-xs font-semibold text-red-600">
                    -{totalPayable.toFixed(0)}€
                  </div>
                )}
              </button>

              <AnimatePresence>
                {showTransactionList && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 w-64 bg-white rounded-lg border border-gray-200 z-20"
                  >
                    <div className="p-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {day.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </h3>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {transactions.map((tx, index) => (
                        <div
                          key={`${tx.id}-${index}`}
                          className={`p-3 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer ${
                            tx.type === 'receivable'
                              ? 'hover:bg-green-50'
                              : 'hover:bg-red-50'
                          }`}
                          onClick={(e) => handleTransactionClick(e, tx)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {tx.thirdParty}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {tx.subCategory}
                              </p>
                            </div>
                            <div
                              className={`text-sm font-semibold ml-2 ${
                                tx.type === 'receivable'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {tx.type === 'receivable' ? '+' : '-'}
                              {parseFloat(tx.amount).toFixed(2)}€
                            </div>
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

      <CollectionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        transaction={selectedTransaction}
        cellDate={day}
      />
    </>
  );
};

// Composant principal ScheduleView avec corrections des dates
const ScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [isViewModeMenuOpen, setIsViewModeMenuOpen] = useState(false);
  const viewModeMenuRef = useRef(null);
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { uiState } = useUI();
  const projectId = uiState.activeProject?.id;

  // CORRECTION : Utiliser getTodayKey() au lieu de toISOString()
  const todayKey = getTodayKey();

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

  // Transformation des données
  const { transactionsByDate } = useMemo(() => {
    if (!budgetData || budgetData.length === 0) {
      return { transactionsByDate: {} };
    }
    return { transactionsByDate: transformBudgetData(budgetData) };
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

  // Chargement des données
  const fetchData = async (showRefresh = false) => {
    if (projectId) {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const res = await apiGet(`/schedules/budgets/project/${projectId}`);
        if (res.status === 200) {
          setBudgetData(res.budget);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className=" mx-auto">
        {/* En-tête épuré */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Calendrier Financier
              </h1>
              <p className="text-gray-600 mt-1">
                Aujourd'hui :{' '}
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                title="Rafraîchir"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>

              <div className="relative" ref={viewModeMenuRef}>
                <button
                  onClick={() => setIsViewModeMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {viewMode === 'month' ? 'Mois' : 'Semaine'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isViewModeMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isViewModeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-gray-200 z-10"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setViewMode('month');
                            setIsViewModeMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            viewMode === 'month'
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Vue mensuelle
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('week');
                            setIsViewModeMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            viewMode === 'week'
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Vue hebdomadaire
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Contrôles de navigation */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">{headerLabel}</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Aujourd'hui
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevious}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={goToNext}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendrier */}
        <div className="bg-white">
          <div className="grid grid-cols-7 mb-2">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-t border-l border-gray-100">
            {calendarGrid.map((day, index) => {
              // CORRECTION : Utiliser formatDateToKey au lieu de manipulation manuelle
              const dateKey = formatDateToKey(day);
              const isTodayCell = dateKey === todayKey;
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();

              return (
                <div key={index} className="border-b border-r border-gray-100">
                  <DayCell
                    day={day}
                    transactions={transactionsByDate[dateKey] || []}
                    isToday={isTodayCell}
                    isCurrentMonth={isCurrentMonth}
                    viewMode={viewMode}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Légende simple */}
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Revenus</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Dépenses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;
