import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ArrowLeft,
  Folder,
  ChevronDown,
  User,
  Menu,
  X,
  Layers,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '../../../components/context/actionsMethode';

import {
  formatCurrency,
  getInitialPeriod,
  handlePeriodChange,
  handleQuickPeriodSelect,
  calculateDateRange,
  quickPeriodOptions,
  analysisTypeOptions,
} from '../../../services/analyse';
import { chartStyles } from '../../../services/chartStyles';

const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="flex flex-col items-center justify-center px-4 py-8 text-gray-500 md:py-12">
    <Icon className="w-12 h-12 mb-3 md:w-16 md:h-16 md:mb-4" />
    <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2 text-center">
      {title}
    </h3>
    <p className="text-xs text-center md:text-sm">{message}</p>
  </div>
);

const MobilePeriodNavigation = ({
  currentPeriod,
  handlePeriodNavigation,
  analysisPeriodName,
}) => (
  <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-gray-50">
    <button
      onClick={() => handlePeriodNavigation(-1)}
      className="p-2 text-gray-500 transition-colors rounded-full hover:bg-gray-200"
      title="Période précédente"
    >
      <ChevronLeft size={20} />
    </button>

    <div className="flex flex-col items-center flex-1 mx-3">
      <span className="mb-1 text-xs text-gray-500">Période actuelle</span>
      <span className="max-w-full text-sm font-semibold text-center text-gray-700 truncate">
        {analysisPeriodName}
      </span>
    </div>

    <button
      onClick={() => handlePeriodNavigation(1)}
      className="p-2 text-gray-500 transition-colors rounded-full hover:bg-gray-200"
      title="Période suivante"
    >
      <ChevronRight size={20} />
    </button>
  </div>
);

const ConsolidatedAnalyseView = ({ consolidationId }) => {
  const [currentPeriod, setCurrentPeriod] = useState(getInitialPeriod());
  const [analysisType, setAnalysisType] = useState('all');
  const [analysisMode, setAnalysisMode] = useState('category');
  const [visibleData, setVisibleData] = useState({
    budget: true,
    actual: true,
  });
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodMenuRef = useRef(null);
  const [isAnalysisTypeMenuOpen, setIsAnalysisTypeMenuOpen] = useState(false);
  const analysisTypeMenuRef = useRef(null);
  const [isAnalysisModeMenuOpen, setIsAnalysisModeMenuOpen] = useState(false);
  const analysisModeMenuRef = useRef(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [consolidationData, setConsolidationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/consolidations/${consolidationId}/analyse`);
      setConsolidationData(response);
    } catch (err) {
      console.error('Erreur fetchData:', err);
      setError(err.message || 'Erreur lors du chargement des données consolidées');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (consolidationId) {
      fetchData();
    }
  }, [consolidationId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(event.target)) {
        setIsPeriodMenuOpen(false);
      }
      if (analysisTypeMenuRef.current && !analysisTypeMenuRef.current.contains(event.target)) {
        setIsAnalysisTypeMenuOpen(false);
      }
      if (analysisModeMenuRef.current && !analysisModeMenuRef.current.contains(event.target)) {
        setIsAnalysisModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePeriodNavigation = (direction) => {
    setCurrentPeriod((prev) => handlePeriodChange(prev, direction));
  };

  const handlePeriodSelect = (periodType) => {
    setCurrentPeriod(handleQuickPeriodSelect(periodType));
  };

  const { rangeStart, rangeEnd, analysisPeriodName } = useMemo(() => {
    return calculateDateRange(null, null, currentPeriod);
  }, [currentPeriod]);

  const analysisModeOptions = [
    { id: 'category', label: 'Par catégorie' },
    { id: 'tier', label: 'Par tiers' },
    { id: 'project', label: 'Par projet' },
  ];

  const normalizeBudgets = (budgets) => {
    if (!budgets) return [];
    if (Array.isArray(budgets)) return budgets;
    return Object.values(budgets);
  };

  const calculateActualForBudget = (projectId, budgetId) => {
    if (!consolidationData?.collections_by_project?.[projectId]?.[budgetId]) return 0;

    const collections = consolidationData.collections_by_project[projectId][budgetId];
    const collectionsArray = Array.isArray(collections) ? collections : Object.values(collections);

    return collectionsArray.reduce((sum, collection) => {
      return sum + parseFloat(collection.collection_amount || 0);
    }, 0);
  };

  const processedData = useMemo(() => {
    if (!consolidationData) return null;

    let categories = [];
    let totalBudget = 0;
    let totalActual = 0;

    if (analysisMode === 'project') {
      if (consolidationData.budgets_by_project) {
        Object.entries(consolidationData.budgets_by_project).forEach(([projectId, budgets]) => {
          const budgetsArray = normalizeBudgets(budgets);
          if (budgetsArray.length === 0) return;

          let projectBudget = 0;
          let projectActual = 0;

          budgetsArray.forEach(budget => {
            const budgetType = budget.budget_type_name?.toLowerCase();
            const shouldInclude =
              analysisType === 'all' ||
              (analysisType === 'expense' && budgetType === 'sortie') ||
              (analysisType === 'revenue' && budgetType === 'entré');

            if (!shouldInclude) return;

            const budgetAmount = parseFloat(budget.budget_amount || 0);
            projectBudget += budgetAmount;

            const actualAmount = calculateActualForBudget(projectId, budget.budget_id);
            projectActual += actualAmount;
          });

          if (projectBudget > 0) {
            categories.push({
              name: budgetsArray[0]?.project_name || `Projet ${projectId}`,
              budget: projectBudget,
              actual: projectActual,
              count: 1,
            });

            totalBudget += projectBudget;
            totalActual += projectActual;
          }
        });
      }
    } else if (analysisMode === 'category') {
      if (consolidationData.category_stats) {
        const categoryMap = {};

        Object.entries(consolidationData.category_stats).forEach(([categoryName, stats]) => {
          categoryMap[categoryName] = {
            name: categoryName,
            budget: 0,
            actual: 0,
            count: stats.count || 0
          };
        });

        if (consolidationData.budgets_by_project) {
          Object.entries(consolidationData.budgets_by_project).forEach(([projectId, budgets]) => {
            const budgetsArray = normalizeBudgets(budgets);

            budgetsArray.forEach(budget => {
              const categoryName = budget.category_name;
              const budgetType = budget.budget_type_name?.toLowerCase();

              const shouldInclude =
                analysisType === 'all' ||
                (analysisType === 'expense' && budgetType === 'sortie') ||
                (analysisType === 'revenue' && budgetType === 'entré');

              if (!shouldInclude || !categoryMap[categoryName]) return;

              const budgetAmount = parseFloat(budget.budget_amount || 0);
              const actualAmount = calculateActualForBudget(projectId, budget.budget_id);

              categoryMap[categoryName].budget += budgetAmount;
              categoryMap[categoryName].actual += actualAmount;
            });
          });
        }

        Object.values(categoryMap).forEach(category => {
          if (category.budget > 0) {
            categories.push(category);
            totalBudget += category.budget;
            totalActual += category.actual;
          }
        });
      }
    } else if (analysisMode === 'tier') {
      const tierMap = {};

      if (consolidationData.budgets_by_project) {
        Object.entries(consolidationData.budgets_by_project).forEach(([projectId, budgets]) => {
          const budgetsArray = normalizeBudgets(budgets);

          budgetsArray.forEach(budget => {
            const budgetType = budget.budget_type_name?.toLowerCase();

            const shouldInclude =
              analysisType === 'all' ||
              (analysisType === 'expense' && budgetType === 'sortie') ||
              (analysisType === 'revenue' && budgetType === 'entré');

            if (!shouldInclude) return;

            const tierName = `${budget.third_party_name || ''} ${budget.third_party_firstname || ''}`.trim();
            if (!tierName) return;

            const budgetAmount = parseFloat(budget.budget_amount || 0);
            const actualAmount = calculateActualForBudget(projectId, budget.budget_id);

            if (!tierMap[tierName]) {
              tierMap[tierName] = {
                name: tierName,
                budget: 0,
                actual: 0,
                count: 1,
              };
            }

            tierMap[tierName].budget += budgetAmount;
            tierMap[tierName].actual += actualAmount;
          });
        });
      }

      Object.values(tierMap).forEach(tier => {
        if (tier.budget > 0) {
          categories.push(tier);
          totalBudget += tier.budget;
          totalActual += tier.actual;
        }
      });
    }

    categories.sort((a, b) => b.budget - a.budget);

    return {
      categories,
      totalBudget,
      totalActual,
      rawData: categories.map(item => ({
        name: item.name,
        budget: item.budget,
        actual: item.actual,
        ...(item.count && { count: item.count })
      }))
    };
  }, [consolidationData, analysisMode, analysisType]);

  const chartOptions = useMemo(() => {
    if (!processedData || processedData.categories.length === 0) {
      return chartStyles.generateEmptyState();
    }

    return chartStyles.getChartOptionsForConsolidatedView({
      processedData,
      analysisMode,
      analysisType,
      analysisPeriodName,
      visibleData,
      isMobile,
    });
  }, [processedData, analysisMode, analysisType, analysisPeriodName, visibleData, isMobile]);

  const calculateChartHeight = () => {
    const dataLength = processedData?.categories?.length || 0;
    return chartStyles.calculateChartHeight(dataLength, isMobile);
  };

  const getEmptyStateIcon = () => {
    if (analysisMode === 'tier') return User;
    if (analysisMode === 'project') return Layers;
    return PieChartIcon;
  };

  const getEmptyStateTitle = () => {
    if (analysisMode === 'tier') {
      return `Aucun tiers à analyser`;
    } else if (analysisMode === 'project') {
      return `Aucun projet à analyser`;
    }
    return `Aucune donnée à analyser`;
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-8 md:py-12">
          <div className="w-10 h-10 border-b-2 border-blue-600 rounded-full animate-spin md:h-12 md:w-12"></div>
          <p className="mt-3 text-sm text-gray-600 md:mt-4 md:text-base">
            Chargement des données consolidées...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon={Layers}
          title="Erreur de chargement"
          message={error}
        />
      );
    }

    const hasData = processedData?.categories?.length > 0;

    if (!hasData) {
      const EmptyStateIcon = getEmptyStateIcon();
      return (
        <EmptyState
          icon={EmptyStateIcon}
          title={getEmptyStateTitle()}
          message={`Il n'y a pas de données pour le type "${analysisType}" et la période sélectionnée.`}
        />
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[300px]">
          <ReactECharts
            option={chartOptions}
            style={{
              height: `${calculateChartHeight()}px`,
              width: '100%',
              minWidth: '300px',
            }}
            opts={{
              renderer: 'canvas',
              locale: 'FR',
              devicePixelRatio: window.devicePixelRatio || 1,
            }}
            theme="light"
            notMerge={true}
            lazyUpdate={true}
          />
        </div>
      </div>
    );
  };

  const selectedPeriodLabel =
    quickPeriodOptions.find((opt) => opt.id === currentPeriod.type)?.label ||
    'Période';

  const selectedAnalysisTypeOption = analysisTypeOptions.find(
    (opt) => opt.id === analysisType
  );
  const SelectedIcon =
    selectedAnalysisTypeOption?.icon === 'TrendingDown'
      ? TrendingDown
      : analysisType === 'all'
        ? PieChartIcon
        : TrendingUp;

  const selectedAnalysisModeOption = analysisModeOptions.find(
    (opt) => opt.id === analysisMode
  );

  return (
    <div className="max-w-full min-h-screen p-3 bg-white md:p-6">
      {!isMobile && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Analyse consolidée
            </h1>
            {consolidationData?.consolidation && (
              <div className="flex items-center gap-3 mt-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <p className="text-lg font-medium text-blue-700">
                  {consolidationData.consolidation.name}
                </p>
                <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                  {consolidationData.total_projects} projets
                </span>
              </div>
            )}
          </div>

          <div className="hidden mb-6 lg:block">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePeriodNavigation(-1)}
                    className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                    title="Période précédente"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span
                    className="text-sm font-semibold text-gray-700 w-auto min-w-[9rem] text-center"
                    title="Période sélectionnée"
                  >
                    {analysisPeriodName}
                  </span>
                  <button
                    onClick={() => handlePeriodNavigation(1)}
                    className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                    title="Période suivante"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="w-px h-8 bg-gray-200"></div>

                <div className="relative" ref={periodMenuRef}>
                  <button
                    onClick={() => setIsPeriodMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 text-sm font-semibold text-gray-700 transition-colors bg-gray-200 rounded-md h-9 hover:bg-gray-300"
                  >
                    <span>{selectedPeriodLabel}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isPeriodMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isPeriodMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute left-0 z-20 w-48 mt-2 bg-white border rounded-lg shadow-lg top-full"
                      >
                        <ul className="p-1">
                          {quickPeriodOptions.map((option) => (
                            <li key={option.id}>
                              <button
                                onClick={() => {
                                  handlePeriodSelect(option.id);
                                  setIsPeriodMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${currentPeriod.type === option.id
                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                    : 'text-gray-700 hover:bg-gray-100'
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
                <div className="relative" ref={analysisModeMenuRef}>
                  <button
                    onClick={() => setIsAnalysisModeMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 text-sm font-semibold text-gray-700 transition-colors bg-gray-200 rounded-md h-9 hover:bg-gray-300"
                  >
                    <span>
                      {selectedAnalysisModeOption?.label || 'Par catégorie'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isAnalysisModeMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isAnalysisModeMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 z-20 w-48 mt-2 bg-white border rounded-lg shadow-lg top-full"
                      >
                        <ul className="p-1">
                          {analysisModeOptions.map((option) => (
                            <li key={option.id}>
                              <button
                                onClick={() => {
                                  setAnalysisMode(option.id);
                                  setIsAnalysisModeMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${analysisMode === option.id
                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                    : 'text-gray-700 hover:bg-gray-100'
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

                <div className="relative" ref={analysisTypeMenuRef}>
                  <button
                    onClick={() => setIsAnalysisTypeMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 text-sm font-semibold transition-colors bg-gray-200 rounded-md h-9 hover:bg-gray-300"
                  >
                    <SelectedIcon
                      className={`w-4 h-4 ${analysisType === 'expense' ? 'text-red-600' :
                          analysisType === 'revenue' ? 'text-green-600' :
                            'text-blue-600'
                        }`}
                    />
                    <span>
                      {analysisType === 'expense' ? 'Sorties' :
                        analysisType === 'revenue' ? 'Entrées' :
                          'Tous'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isAnalysisTypeMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isAnalysisTypeMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 z-20 w-48 mt-2 bg-white border rounded-lg shadow-lg top-full"
                      >
                        <ul className="p-1">
                          <li>
                            <button
                              onClick={() => {
                                setAnalysisType('all');
                                setIsAnalysisTypeMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${analysisType === 'all'
                                  ? 'bg-blue-50 text-blue-700 font-semibold'
                                  : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                              <PieChartIcon className="w-4 h-4 text-blue-600" />
                              Tous
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setAnalysisType('revenue');
                                setIsAnalysisTypeMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${analysisType === 'revenue'
                                  ? 'bg-blue-50 text-blue-700 font-semibold'
                                  : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              Entrées
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setAnalysisType('expense');
                                setIsAnalysisTypeMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${analysisType === 'expense'
                                  ? 'bg-blue-50 text-blue-700 font-semibold'
                                  : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                              <TrendingDown className="w-4 h-4 text-red-600" />
                              Sorties
                            </button>
                          </li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-lg">
                  <button
                    onClick={() =>
                      setVisibleData((p) => ({ ...p, budget: !p.budget }))
                    }
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${visibleData.budget
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:bg-gray-300'
                      }`}
                  >
                    Budget
                  </button>
                  <button
                    onClick={() =>
                      setVisibleData((p) => ({ ...p, actual: !p.actual }))
                    }
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${visibleData.actual
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:bg-gray-300'
                      }`}
                  >
                    Réel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="lg:hidden">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            Analyse consolidée
          </h1>
          {consolidationData?.consolidation && (
            <p className="text-sm text-gray-600">
              {consolidationData.consolidation.name}
            </p>
          )}
        </div>

        <MobilePeriodNavigation
          currentPeriod={currentPeriod}
          handlePeriodNavigation={handlePeriodNavigation}
          analysisPeriodName={analysisPeriodName}
        />

        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1 max-w-[140px]" ref={periodMenuRef}>
            <button
              onClick={() => setIsPeriodMenuOpen((p) => !p)}
              className="flex items-center justify-between w-full h-10 px-3 text-sm font-semibold text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <span className="truncate">{selectedPeriodLabel}</span>
              <ChevronDown
                className={`w-4 h-4 flex-shrink-0 transition-transform ${isPeriodMenuOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>
            <AnimatePresence>
              {isPeriodMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute left-0 z-20 w-48 mt-1 bg-white border rounded-lg shadow-lg top-full"
                >
                  <ul className="p-1 overflow-y-auto max-h-60">
                    {quickPeriodOptions.map((option) => (
                      <li key={option.id}>
                        <button
                          onClick={() => {
                            handlePeriodSelect(option.id);
                            setIsPeriodMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-md ${currentPeriod.type === option.id
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-gray-700 hover:bg-gray-100'
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

          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="ml-2 p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        <AnimatePresence>
          {isMobileFiltersOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="absolute top-0 right-0 w-4/5 h-full max-w-sm bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Filtres</h2>
                    <button
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-700">Type d'analyse</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setAnalysisType('all');
                          setIsMobileFiltersOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${analysisType === 'all'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                      >
                        <PieChartIcon className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Tous</span>
                      </button>
                      <button
                        onClick={() => {
                          setAnalysisType('revenue');
                          setIsMobileFiltersOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${analysisType === 'revenue'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                      >
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Entrées</span>
                      </button>
                      <button
                        onClick={() => {
                          setAnalysisType('expense');
                          setIsMobileFiltersOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${analysisType === 'expense'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                      >
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        <span className="font-medium">Sorties</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-700">Mode d'analyse</h3>
                    <div className="space-y-2">
                      {analysisModeOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setAnalysisMode(option.id);
                            setIsMobileFiltersOpen(false);
                          }}
                          className={`w-full p-3 rounded-lg text-left font-medium ${analysisMode === option.id
                              ? 'bg-blue-50 border border-blue-200'
                              : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-700">Données à afficher</h3>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() =>
                          setVisibleData((p) => ({
                            ...p,
                            budget: !p.budget,
                          }))
                        }
                        className={`flex items-center justify-between p-3 rounded-lg ${visibleData.budget
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                      >
                        <span className="font-medium">Budget</span>
                        <div
                          className={`w-4 h-4 rounded border ${visibleData.budget
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                            }`}
                        />
                      </button>
                      <button
                        onClick={() =>
                          setVisibleData((p) => ({
                            ...p,
                            actual: !p.actual,
                          }))
                        }
                        className={`flex items-center justify-between p-3 rounded-lg ${visibleData.actual
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                      >
                        <span className="font-medium">Réel</span>
                        <div
                          className={`w-4 h-4 rounded border ${visibleData.actual
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-white rounded-lg shadow md:p-6">
        {renderChart()}

        {!loading && !error && processedData && (
          <div className="p-3 mt-4 rounded-lg md:mt-6 md:p-4 bg-gray-50">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Résumé pour {analysisPeriodName}:
            </h3>

            {processedData.rawData && processedData.rawData.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-4 md:gap-4">
                  <div className="p-3 bg-white border rounded">
                    <h4 className="text-sm font-medium text-gray-600 md:text-base">
                      Total Budget
                    </h4>
                    <p className="text-base font-bold md:text-lg">
                      {formatCurrency(processedData.totalBudget, { currency: 'EUR' })}
                    </p>
                  </div>
                  <div className="p-3 bg-white border rounded">
                    <h4 className="text-sm font-medium text-gray-600 md:text-base">
                      Total Réel
                    </h4>
                    <p className="text-base font-bold md:text-lg">
                      {formatCurrency(processedData.totalActual, { currency: 'EUR' })}
                    </p>
                  </div>
                  <div className="p-3 bg-white border rounded">
                    <h4 className="text-sm font-medium text-gray-600 md:text-base">
                      Différence
                    </h4>
                    <p
                      className={`text-base md:text-lg font-bold ${processedData.totalActual <= processedData.totalBudget
                          ? 'text-green-600'
                          : 'text-red-600'
                        }`}
                    >
                      {formatCurrency(
                        processedData.totalActual - processedData.totalBudget,
                        { currency: 'EUR' }
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-white border rounded">
                    <h4 className="text-sm font-medium text-gray-600 md:text-base">
                      Nombre d'éléments
                    </h4>
                    <p className="text-base font-bold md:text-lg">
                      {processedData.categories.length}
                    </p>
                  </div>
                </div>

                <div className="mt-3 md:mt-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-600 md:text-base">
                    {analysisMode === 'project' ? 'Projets:' :
                      analysisMode === 'tier' ? 'Tiers:' : 'Catégories:'}
                  </h4>
                  <div className="space-y-2 overflow-y-auto max-h-60">
                    {processedData.rawData.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 p-2 bg-white border rounded sm:flex-row sm:justify-between sm:items-center md:p-3"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate">
                            {item.name}
                          </span>
                          {item.count && (
                            <span className="text-xs text-gray-500">
                              {item.count} budgets
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-4">
                          <span className="text-xs sm:text-sm">
                            Budget: {formatCurrency(item.budget, { currency: 'EUR' })}
                          </span>
                          <span className="text-xs sm:text-sm">
                            Réel: {formatCurrency(item.actual, { currency: 'EUR' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-3 text-sm text-center text-gray-500 md:py-4 md:text-base">
                Aucune donnée disponible pour cette période
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsolidatedAnalyseView;