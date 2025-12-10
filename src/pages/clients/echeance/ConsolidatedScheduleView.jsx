import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  RefreshCw,
  Layers,
  Building,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../../components/context/UIContext';
import { apiGet } from '../../../components/context/actionsMethode';

// Fonctions utilitaires
const formatDateToKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayKey = () => {
  return formatDateToKey(new Date());
};

const transformBudgetData = (budgetData) => {
  const transactions = {};

  budgetData.forEach((transaction) => {
    const dateKey = transaction.date;

    if (!transactions[dateKey]) {
      transactions[dateKey] = [];
    }

    transactions[dateKey].push({
      ...transaction,
      amount: parseFloat(transaction.amount || 0),
    });
  });

  return transactions;
};

// Composant DayCell pour la consolidation
const ConsolidatedDayCell = ({
  day,
  transactions = [],
  isToday,
  isCurrentMonth,
  viewMode,
}) => {
  const dayNumber = day.getDate();
  const dropdownRef = useRef(null);
  const [showTransactionList, setShowTransactionList] = useState(false);

  const { totalPayable, totalReceivable, projectBreakdown } = useMemo(() => {
    const payable = transactions.filter((tx) => tx.type === 'payable');
    const receivable = transactions.filter((tx) => tx.type === 'receivable');
    
    // Grouper par projet
    const projectGroups = {};
    transactions.forEach(tx => {
      const projectName = tx.project_name || 'Projet inconnu';
      if (!projectGroups[projectName]) {
        projectGroups[projectName] = {
          payable: 0,
          receivable: 0,
          transactions: []
        };
      }
      
      if (tx.type === 'payable') {
        projectGroups[projectName].payable += parseFloat(tx.amount || 0);
      } else {
        projectGroups[projectName].receivable += parseFloat(tx.amount || 0);
      }
      projectGroups[projectName].transactions.push(tx);
    });

    return {
      totalPayable: payable.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0),
      totalReceivable: receivable.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0),
      projectBreakdown: projectGroups
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

  const handleCellClick = () => {
    if (transactions.length > 0) {
      setShowTransactionList(!showTransactionList);
    }
  };

  const cellHeightClass = viewMode === 'week' ? 'h-[calc(100vh-20rem)]' : 'h-28';

  return (
    <div
      className={`p-2 flex flex-col ${cellHeightClass} ${
        isCurrentMonth
          ? isToday
            ? 'bg-purple-50'
            : 'bg-white hover:bg-gray-50'
          : 'bg-gray-50/30'
      } transition-colors duration-150 relative group`}
    >
      <div className="flex items-start justify-between mb-1">
        <span
          className={`text-sm font-medium ${
            isCurrentMonth
              ? isToday
                ? 'text-purple-600'
                : 'text-gray-700'
              : 'text-gray-400'
          }`}
        >
          {dayNumber}
        </span>
        
        {Object.keys(projectBreakdown).length > 1 && (
          <span className="px-1.5 py-0.5 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
            {Object.keys(projectBreakdown).length}
          </span>
        )}
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
                  className="absolute z-20 mt-1 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-xl w-80 left-1/2 top-full"
                >
                  <div className="p-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {day.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Layers className="w-3 h-3" />
                      <span>Consolidation • {Object.keys(projectBreakdown).length} projet(s)</span>
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-96">
                    {Object.entries(projectBreakdown).map(([projectName, data]) => (
                      <div key={projectName} className="border-b border-gray-100 last:border-b-0">
                        <div className="p-2 bg-gray-50">
                          <div className="flex items-center gap-2">
                            <Building className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-700 truncate">
                              {projectName}
                            </span>
                          </div>
                          <div className="flex justify-between mt-1 text-xs">
                            {data.receivable > 0 && (
                              <span className="text-green-600">
                                +{data.receivable.toFixed(0)}€
                              </span>
                            )}
                            {data.payable > 0 && (
                              <span className="text-red-600">
                                -{data.payable.toFixed(0)}€
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="py-1">
                          {data.transactions.map((tx, index) => (
                            <div
                              key={`${tx.id}-${index}`}
                              className="px-3 py-2 hover:bg-gray-50"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {tx.subCategory}
                                    </p>
                                    {tx.criticity && (
                                      <span className="px-1 py-0.5 text-[10px] font-medium text-white bg-orange-500 rounded">
                                        {tx.criticity}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    {tx.thirdParty}
                                  </p>
                                </div>
                                <div
                                  className={`text-xs font-semibold ml-2 whitespace-nowrap ${
                                    tx.type === 'receivable'
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {tx.type === 'receivable' ? '+' : '-'}
                                  {parseFloat(tx.amount).toFixed(0)}€
                                </div>
                              </div>
                              {tx.description && (
                                <p className="mt-1 text-xs text-gray-400 truncate">
                                  {tx.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                                  {tx.frequency}
                                </span>
                                {tx.currency && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                                    {tx.currency}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
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
  );
};

// Composant principal ConsolidatedScheduleView
const ConsolidatedScheduleView = ({ consolidationId: propConsolidationId }) => {
  const { uiState } = useUI();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [isViewModeMenuOpen, setIsViewModeMenuOpen] = useState(false);
  const viewModeMenuRef = useRef(null);
  const [consolidationData, setConsolidationData] = useState(null);
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const todayKey = getTodayKey();

  // Obtenir l'ID de consolidation
  const getConsolidationId = () => {
    // Priorité : prop > contexte
    if (propConsolidationId) return propConsolidationId;
    
    // Vérifier dans le contexte UI
    const activeProject = uiState.activeProject;
    if (activeProject) {
      const activeId = String(activeProject.id || '');
      if (activeId.startsWith('consolidated_view_')) {
        return activeId.replace('consolidated_view_', '');
      }
    }
    
    return null;
  };

  const consolidationId = getConsolidationId();

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
  const { transactionsByDate, summary } = useMemo(() => {
    if (!budgetData || budgetData.length === 0) {
      return { 
        transactionsByDate: {},
        summary: {
          totalTransactions: 0,
          totalReceivable: 0,
          totalPayable: 0,
          netFlow: 0,
          projectCount: 0,
          projects: [],
          dateRange: { min: null, max: null }
        }
      };
    }

    const transactionsByDate = transformBudgetData(budgetData);
    
    // Calculer les statistiques
    let totalReceivable = 0;
    let totalPayable = 0;
    const projects = new Set();
    let minDate = null;
    let maxDate = null;

    budgetData.forEach(tx => {
      if (tx.type === 'receivable') {
        totalReceivable += parseFloat(tx.amount || 0);
      } else {
        totalPayable += parseFloat(tx.amount || 0);
      }
      
      projects.add(tx.project_name);
      
      const txDate = new Date(tx.date);
      if (!minDate || txDate < minDate) minDate = txDate;
      if (!maxDate || txDate > maxDate) maxDate = txDate;
    });

    return { 
      transactionsByDate,
      summary: {
        totalTransactions: budgetData.length,
        totalReceivable: parseFloat(totalReceivable.toFixed(2)),
        totalPayable: parseFloat(totalPayable.toFixed(2)),
        netFlow: parseFloat((totalReceivable - totalPayable).toFixed(2)),
        projectCount: projects.size,
        projects: Array.from(projects),
        dateRange: { 
          min: minDate ? minDate.toISOString().split('T')[0] : null, 
          max: maxDate ? maxDate.toISOString().split('T')[0] : null 
        }
      }
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

  // Chargement des données consolidées
  const fetchConsolidatedData = async (showRefresh = false) => {
    if (!consolidationId) {
      setError('Aucune vue consolidée sélectionnée');
      setLoading(false);
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const res = await apiGet(`/schedules/consolidations/${consolidationId}`);

      if (res.status === 200) {
        setConsolidationData(res.consolidation);
        setBudgetData(res.budget || []);
      } else if (res.status === 404) {
        setError('Vue consolidée non trouvée');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données consolidées:', error);
      setError('Erreur de chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConsolidatedData();
  }, [consolidationId]);

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Chargement de l'échéancier consolidé...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="mb-4 text-red-600">{error}</div>
          <button
            onClick={() => navigate('/client/consolidations')}
            className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Retour aux consolidations
          </button>
        </div>
      </div>
    );
  }

  if (!consolidationData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="mb-4 text-purple-600">
            <Layers className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Vue consolidée
          </h3>
          <p className="mb-4 text-gray-600">
            {uiState.activeProject?.name || 'Sélectionnez une vue consolidée spécifique'}
          </p>
          <button
            onClick={() => navigate('/client/consolidations')}
            className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Voir les consolidations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-white md:p-6">
      <div className="mx-auto">
        {/* En-tête avec informations de consolidation */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
                Échéancier Consolidé
              </h1>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <p className="text-lg font-medium text-purple-700">
                    {consolidationData.name}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    <span>{summary.projectCount} projet(s)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{summary.totalTransactions} échéance(s)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchConsolidatedData(true)}
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
                      className="absolute right-0 z-10 w-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg top-full"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setViewMode('month');
                            setIsViewModeMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            viewMode === 'month'
                              ? 'bg-purple-50 text-purple-700'
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
                              ? 'bg-purple-50 text-purple-700'
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
        <div className="flex flex-col items-start justify-between gap-3 mb-4 sm:flex-row sm:items-center">
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
                title="Précédent"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={goToNext}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Suivant"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendrier */}
        <div className="overflow-x-auto bg-white">
          <div className="min-w-[800px]">
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
                    <ConsolidatedDayCell
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
        </div>

        {/* Légende */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-gray-600 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Revenus consolidés</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Dépenses consolidées</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Multi-projets</span>
          </div>
        </div>

        {/* Informations sur les projets consolidés */}
        {consolidationData && summary.projectCount > 0 && (
          <div className="p-4 mt-6 rounded-lg bg-gray-50">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Projets inclus dans cette consolidation :
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary.projects.map((project, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full"
                >
                  {project}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsolidatedScheduleView;