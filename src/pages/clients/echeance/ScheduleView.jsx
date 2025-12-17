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
import {
  transformBudgetDataWithDates,
  formatDateToKey,
  getTodayKey,
  getEndOfMonth,
} from '../../../services/schedule';

// Composant DayCell
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
        <div className="flex items-start justify-between mb-1">
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
          className="flex flex-col justify-center flex-grow space-y-1"
          ref={dropdownRef}
        >
          {transactions.length > 0 && (
            <div className="relative">
              <button
                onClick={handleCellClick}
                className="w-full p-1 space-y-1 text-center transition-colors rounded-lg hover:bg-white/60"
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
                    className="absolute z-20 w-64 mt-1 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg left-1/2 top-full"
                  >
                    <div className="p-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {day.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </h3>
                    </div>

                    <div className="overflow-y-auto max-h-64">
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
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {tx.subCategory}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {tx.thirdParty}
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

// Composant principal ScheduleView
const ScheduleView = () => {
  const { uiState } = useUI();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [isViewModeMenuOpen, setIsViewModeMenuOpen] = useState(false);
  const viewModeMenuRef = useRef(null);
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasValidProject, setHasValidProject] = useState(false);

  const activeProject = uiState.activeProject;
  const todayKey = getTodayKey();

  // Vérifier si le projet actif est un projet simple (pas une consolidation)
  useEffect(() => {
    if (!activeProject) {
      setHasValidProject(false);
      return;
    }

    const activeId = String(activeProject.id || '');
    // C'est un projet simple si ce n'est pas "consolidated" et ne commence pas par "consolidated_view_"
    const isSimpleProject =
      activeId !== 'consolidated' && !activeId.startsWith('consolidated_view_');

    setHasValidProject(isSimpleProject);
  }, [activeProject]);

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

  // Transformation des données avec génération limitée au mois courant
  const { transactionsByDate } = useMemo(() => {
    if (!budgetData || budgetData.length === 0) {
      return { transactionsByDate: {} };
    }

    let limitDate = null;

    if (viewMode === 'month') {
      // Pour la vue mensuelle, générer jusqu'à la fin du mois affiché
      limitDate = getEndOfMonth(currentDate);
    } else {
      // Pour la vue hebdomadaire, générer jusqu'à la fin du mois suivant pour couvrir les transactions qui pourraient être visibles
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      limitDate = getEndOfMonth(nextMonth);
    }

    // Organiser les données budgétaires par date
    const transactions = {};

    // Transformez chaque élément budgétaire en transactions avec dates générées
    budgetData.forEach((budget) => {
      const frequencyId = budget.frequency_id;
      const type = budget.category_type_id == 2 ? 'receivable' : 'payable';

      // Préparation du nom du tiers
      let thirdParty = budget.category_name;
      if (budget.third_party_name && budget.third_party_firstname) {
        thirdParty = `${budget.third_party_name} ${budget.third_party_firstname}`;
      } else if (budget.third_party_name) {
        thirdParty = budget.third_party_name;
      }

      // Utiliser la fonction transformBudgetDataWithDates pour générer les dates
      const budgetArray = [budget];
      const generatedTransactions = transformBudgetDataWithDates(
        budgetArray,
        limitDate
      );

      // Ajouter chaque transaction générée au dictionnaire par date
      generatedTransactions.forEach((transaction, occurrenceIndex) => {
        const dateKey = transaction.date;

        if (!transactions[dateKey]) {
          transactions[dateKey] = [];
        }

        // Vérifier si la transaction est dans l'intervalle de dates affiché
        const transactionDate = new Date(transaction.date);

        // Pour la vue mensuelle, filtrer par mois
        if (viewMode === 'month') {
          if (
            transactionDate.getMonth() !== currentDate.getMonth() ||
            transactionDate.getFullYear() !== currentDate.getFullYear()
          ) {
            return; // Ignorer les transactions hors du mois affiché
          }
        }

        // Pour la vue hebdomadaire, vérifier si dans la semaine affichée
        if (viewMode === 'week') {
          const currentDayOfWeek = currentDate.getDay();
          const startOffset = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
          const weekStartDate = new Date(currentDate);
          weekStartDate.setDate(weekStartDate.getDate() - startOffset);

          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekEndDate.getDate() + 6);

          if (
            transactionDate < weekStartDate ||
            transactionDate > weekEndDate
          ) {
            return; // Ignorer les transactions hors de la semaine affichée
          }
        }

        transactions[dateKey].push({
          ...transaction,
          amount: parseFloat(transaction.amount || 0),
        });
      });
    });

    return { transactionsByDate: transactions };
  }, [budgetData, currentDate, viewMode]);

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
    if (!activeProject || !hasValidProject) {
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await apiGet(
        `/schedules/budgets/project/${activeProject.id}`
      );

      if (res.status === 200) {
        // Stocker les données brutes du budget
        setBudgetData(res.budget || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeProject, hasValidProject]);

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Si ce n'est pas un projet simple, on ne devrait pas être dans ce composant
  if (!hasValidProject) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="mb-4 text-gray-400">📅</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Projet non valide
          </h3>
          <p className="text-gray-600">
            Cette vue est réservée aux projets simples. Pour les vues
            consolidées, utilisez le sélecteur.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="mx-auto">
        {/* En-tête épuré */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Calendrier Financier
              </h1>
              <p className="mt-1 text-gray-600">
                Projet : {activeProject?.name || 'Sans nom'}
              </p>
              <p className="text-sm text-gray-500">
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
                className="p-2 text-gray-500 transition-colors rounded-lg hover:text-gray-700"
                title="Rafraîchir"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>

              <div className="relative" ref={viewModeMenuRef}>
                <button
                  onClick={() => setIsViewModeMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
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
                      className="absolute right-0 z-10 w-40 mt-1 bg-white border border-gray-200 rounded-lg top-full"
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
                className="py-2 text-xs font-medium text-center text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-t border-l border-gray-100">
            {calendarGrid.map((day, index) => {
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
        <div className="flex justify-center mt-4">
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
