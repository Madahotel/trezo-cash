import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  PieChart,
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
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '../../../components/context/actionsMethode';
import { chartStyles } from '../../../services/chartStyles';

import {
  formatCurrency,
  getInitialPeriod,
  handlePeriodChange,
  handleQuickPeriodSelect,
  calculateDateRange,
  transformApiData,
  filterProjectData,
  getCategoryAnalysisData,
  getTierAnalysisData,
  getChartOptions,
  quickPeriodOptions,
  analysisTypeOptions,
  getAnalysisModeOptions,
} from '../../../services/analyse';
import { useUI } from '../../../components/context/UIContext';

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

const AnalyseView = ({
  isFocusMode = false,
  rangeStart: rangeStartProp,
  rangeEnd: rangeEndProp,
  analysisType: analysisTypeProp,
  analysisMode: analysisModeProp,
  setAnalysisMode: setAnalysisModeProp,
}) => {
  const { uiState } = useUI();
  const projectId = uiState.activeProject?.id;
  const [currentPeriod, setCurrentPeriod] = useState(getInitialPeriod());
  const [localAnalysisType, setLocalAnalysisType] = useState('expense');
  const [localAnalysisMode, setLocalAnalysisMode] = useState('category');
  const [visibleData, setVisibleData] = useState({
    budget: true,
    actual: true,
  });
  const [drillDownState, setDrillDownState] = useState({
    level: 0,
    mainCategoryName: null,
    subCategoryName: null,
    dataType: null,
    color: null,
    tierName: null,
  });
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodMenuRef = useRef(null);
  const [isAnalysisTypeMenuOpen, setIsAnalysisTypeMenuOpen] = useState(false);
  const analysisTypeMenuRef = useRef(null);
  const [isAnalysisModeMenuOpen, setIsAnalysisModeMenuOpen] = useState(false);
  const analysisModeMenuRef = useRef(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [apiData, setApiData] = useState(null);
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

  const fetchData = async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/analyse/project/${projectId}`);
      setApiData(response);
    } catch (err) {
      console.error('Erreur fetchData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchData(projectId);
    }
  }, [projectId]);

  const defaultSettings = {
    timezoneOffset: 0,
    currency: 'EUR',
    language: 'fr',
  };

  const transformedData = useMemo(() => {
    return transformApiData(apiData, defaultSettings, currentPeriod);
  }, [apiData, currentPeriod]);

  const {
    projects = [],
    categories = { expense: [], revenue: [] },
    tiers = { expense: [], revenue: [] },
    allEntries = {},
    allActuals = {},
    settings = defaultSettings,
    consolidatedViews = [],
    budgetTransactions = [],
  } = transformedData || {};

  const activeProjectId = projectId ? projectId.toString() : '1';

  const analysisType = isFocusMode ? analysisTypeProp : localAnalysisType;
  const analysisMode = isFocusMode ? analysisModeProp : localAnalysisMode;
  const setAnalysisMode = isFocusMode
    ? setAnalysisModeProp
    : setLocalAnalysisMode;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        periodMenuRef.current &&
        !periodMenuRef.current.contains(event.target)
      ) {
        setIsPeriodMenuOpen(false);
      }
      if (
        analysisTypeMenuRef.current &&
        !analysisTypeMenuRef.current.contains(event.target)
      ) {
        setIsAnalysisTypeMenuOpen(false);
      }
      if (
        analysisModeMenuRef.current &&
        !analysisModeMenuRef.current.contains(event.target)
      ) {
        setIsAnalysisModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (drillDownState.level > 0) {
      setDrillDownState({
        level: 0,
        mainCategoryName: null,
        subCategoryName: null,
        dataType: null,
        color: null,
        tierName: null,
      });
    }
  }, [analysisMode]);

  const isConsolidated = activeProjectId === 'consolidated';
  const isCustomConsolidated =
    activeProjectId?.startsWith('consolidated_view_');

  const handlePeriodNavigation = (direction) => {
    setCurrentPeriod((prev) => handlePeriodChange(prev, direction));
  };

  const handlePeriodSelect = (periodType) => {
    setCurrentPeriod(handleQuickPeriodSelect(periodType));
  };

  const { rangeStart, rangeEnd, analysisPeriodName } = useMemo(() => {
    return calculateDateRange(rangeStartProp, rangeEndProp, currentPeriod);
  }, [rangeStartProp, rangeEndProp, currentPeriod]);

  const { projectEntries, projectActuals } = useMemo(() => {
    return filterProjectData({
      budgetTransactions,
      allActuals,
      consolidatedViews,
      activeProjectId,
      analysisType,
      rangeStart,
      rangeEnd,
      isConsolidated,
      isCustomConsolidated,
    });
  }, [
    budgetTransactions,
    allActuals,
    consolidatedViews,
    activeProjectId,
    analysisType,
    rangeStart,
    rangeEnd,
    isConsolidated,
    isCustomConsolidated,
  ]);

  const categoryAnalysisData = useMemo(() => {
    return getCategoryAnalysisData({
      categories,
      projectEntries,
      projectActuals,
      analysisType,
      rangeStart,
      rangeEnd,
    });
  }, [
    categories,
    projectEntries,
    projectActuals,
    analysisType,
    rangeStart,
    rangeEnd,
  ]);

  const tierAnalysisData = useMemo(() => {
    return getTierAnalysisData({
      tiers,
      projectEntries,
      projectActuals,
      analysisType,
      rangeStart,
      rangeEnd,
    });
  }, [
    tiers,
    projectEntries,
    projectActuals,
    analysisType,
    rangeStart,
    rangeEnd,
  ]);

  const currentAnalysisData = useMemo(() => {
    if (analysisMode === 'tier') {
      return {
        data: tierAnalysisData,
        type: 'tier',
      };
    } else {
      return {
        data: categoryAnalysisData,
        type: 'category',
      };
    }
  }, [analysisMode, categoryAnalysisData, tierAnalysisData]);

  const chartOptions = useMemo(() => {
    return chartStyles.getChartOptionsForAnalyseView({
      analysisMode,
      categoryAnalysisData,
      tierAnalysisData,
      analysisType,
      analysisPeriodName,
      settings,
      visibleData,
      isMobile,
    });
  }, [analysisMode, categoryAnalysisData, tierAnalysisData, analysisType, analysisPeriodName, settings, visibleData, isMobile]);


  const hasData = analysisMode === 'tier'
    ? tierAnalysisData?.tiers &&
    (Array.isArray(tierAnalysisData.tiers) ? tierAnalysisData.tiers.length > 0 : false)
    : categoryAnalysisData?.categories &&
    (Array.isArray(categoryAnalysisData.categories) ? categoryAnalysisData.categories.length > 0 : false);
  const onChartClick = (params) => {
    if (params.componentType !== 'series') return;

    if (analysisMode === 'category') {
      if (drillDownState.level === 0) {
        setDrillDownState({
          level: 1,
          mainCategoryName: params.name,
          subCategoryName: null,
          dataType: params.seriesName.toLowerCase().startsWith('budget')
            ? 'budget'
            : 'actual',
          color: params.color,
          tierName: null,
        });
      } else if (drillDownState.level === 1) {
        setDrillDownState((prev) => ({
          ...prev,
          level: 2,
          subCategoryName: params.name,
        }));
      }
    } else if (analysisMode === 'tier') {
      if (drillDownState.level === 0) {
        setDrillDownState({
          level: 1,
          mainCategoryName: null,
          subCategoryName: null,
          dataType: params.seriesName.toLowerCase().startsWith('budget')
            ? 'budget'
            : 'actual',
          color: params.color,
          tierName: params.name,
        });
      }
    }
  };
  const onEvents = {
    click: onChartClick,
  };

  const getEmptyStateIcon = () => {
    if (analysisMode === 'tier') return User;
    return PieChart;
  };

  const getEmptyStateTitle = () => {
    if (analysisMode === 'tier') {
      return `Aucun ${analysisType === 'expense' ? 'fournisseur' : 'client'
        } à analyser`;
    }
    return `Aucune ${analysisType === 'expense' ? 'dépense' : 'entrée'
      } à analyser`;
  };

  const calculateChartHeight = () => {
    const dataLength = analysisMode === 'tier'
      ? tierAnalysisData?.tiers?.length || 0
      : categoryAnalysisData?.categories?.length || 0;

    return chartStyles.calculateChartHeight(dataLength, isMobile);
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-8 md:py-12">
          <div className="w-10 h-10 border-b-2 border-blue-600 rounded-full animate-spin md:h-12 md:w-12"></div>
          <p className="mt-3 text-sm text-gray-600 md:mt-4 md:text-base">
            Chargement des données...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          icon={Folder}
          title="Erreur de chargement"
          message={error}
        />
      );
    }

    const hasData = analysisMode === 'tier'
      ? tierAnalysisData?.tiers && Array.isArray(tierAnalysisData.tiers) && tierAnalysisData.tiers.length > 0
      : categoryAnalysisData?.categories && Array.isArray(categoryAnalysisData.categories) && categoryAnalysisData.categories.length > 0;

    console.log('renderChart - hasData:', hasData, {
      analysisMode,
      categoryLength: categoryAnalysisData?.categories?.length,
      tierLength: tierAnalysisData?.tiers?.length,
      categoryAnalysisData,
      tierAnalysisData
    });

    if (!hasData) {
      const EmptyStateIcon = getEmptyStateIcon();
      return (
        <EmptyState
          icon={EmptyStateIcon}
          title={getEmptyStateTitle()}
          message="Il n'y a pas de données pour la période sélectionnée."
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
            onEvents={onEvents}
          />
        </div>
      </div>
    );
  };

  // Options pour les menus
  const selectedPeriodLabel =
    quickPeriodOptions.find((opt) => opt.id === currentPeriod.type)?.label ||
    'Période';

  const selectedAnalysisTypeOption = analysisTypeOptions.find(
    (opt) => opt.id === analysisType
  );
  const SelectedIcon =
    selectedAnalysisTypeOption?.icon === 'TrendingDown'
      ? TrendingDown
      : TrendingUp;

  const analysisModeOptions = getAnalysisModeOptions(
    isConsolidated,
    isCustomConsolidated
  );
  const selectedAnalysisModeOption = analysisModeOptions.find(
    (opt) => opt.id === analysisMode
  );

  return (
    <div
      className={isFocusMode ? 'h-full flex flex-col' : 'p-3 md:p-6 max-w-full'}
    >
      {!isFocusMode && (
        <>
          {/* Version mobile */}
          <div className="mb-4 lg:hidden">
            <MobilePeriodNavigation
              currentPeriod={currentPeriod}
              handlePeriodNavigation={handlePeriodNavigation}
              analysisPeriodName={analysisPeriodName}
            />

            <div className="flex items-center justify-between mb-4">
              <div
                className="relative flex-1 max-w-[140px]"
                ref={periodMenuRef}
              >
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

            {/* Menu mobile des filtres */}
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
                      {/* Type d'analyse */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-700">
                          Type d'analyse
                        </h3>
                        <div className="space-y-2">
                          {analysisTypeOptions.map((option) => {
                            const Icon =
                              option.icon === 'TrendingDown'
                                ? TrendingDown
                                : TrendingUp;
                            return (
                              <button
                                key={option.id}
                                onClick={() => {
                                  setLocalAnalysisType(option.id);
                                  setIsMobileFiltersOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${analysisType === option.id
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'bg-gray-50 hover:bg-gray-100'
                                  }`}
                              >
                                <Icon className={`w-5 h-5 ${option.color}`} />
                                <span className="font-medium">
                                  {option.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mode d'analyse */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-700">
                          Mode d'analyse
                        </h3>
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

                      {/* Données visibles */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-700">
                          Données à afficher
                        </h3>
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

          {/* Version desktop */}
          {/* Version desktop */}
          <div className="hidden mb-6 lg:block">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {!rangeStartProp && (
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
              )}

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
                      className={`w-4 h-4 ${selectedAnalysisTypeOption?.color || 'text-red-600'
                        }`}
                    />
                    <span>
                      {selectedAnalysisTypeOption?.label || 'Sorties'}
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
                          {analysisTypeOptions.map((option) => {
                            const Icon =
                              option.icon === 'TrendingDown'
                                ? TrendingDown
                                : TrendingUp;
                            return (
                              <li key={option.id}>
                                <button
                                  onClick={() => {
                                    setLocalAnalysisType(option.id);
                                    setIsAnalysisTypeMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${analysisType === option.id
                                      ? 'bg-blue-50 text-blue-700 font-semibold'
                                      : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                  <Icon className={`w-4 h-4 ${option.color}`} />
                                  {option.label}
                                </button>
                              </li>
                            );
                          })}
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

      <div className="p-4 bg-white rounded-lg shadow md:p-6">
        {drillDownState.level > 0 && (
          <div className="mb-4">
            <button
              onClick={() =>
                setDrillDownState({
                  level: 0,
                  mainCategoryName: null,
                  subCategoryName: null,
                  dataType: null,
                  color: null,
                  tierName: null,
                })
              }
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg md:px-4 md:py-2 hover:bg-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </button>
          </div>
        )}

        {renderChart()}

        {/* Section d'information des données */}
        {!loading && !error && (
          <div className="p-3 mt-4 rounded-lg md:mt-6 md:p-4 bg-gray-50">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Résumé pour {analysisPeriodName}:
            </h3>

            {currentAnalysisData.data.rawData &&
              currentAnalysisData.data.rawData.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-3 md:gap-4">
                  <div className="p-3 bg-white border rounded">
                    <h4 className="text-sm font-medium text-gray-600 md:text-base">
                      Total Budget
                    </h4>
                    <p className="text-base font-bold md:text-lg">
                      {formatCurrency(
                        currentAnalysisData.data.totalBudget,
                        settings
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-white border rounded">
                    <h4 className="text-sm font-medium text-gray-600 md:text-base">
                      Total Réel
                    </h4>
                    <p className="text-base font-bold md:text-lg">
                      {formatCurrency(
                        currentAnalysisData.data.totalActual,
                        settings
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-white border rounded">
                    <h4 className="text-sm font-medium text-gray-600 md:text-base">
                      Différence
                    </h4>
                    <p
                      className={`text-base md:text-lg font-bold ${currentAnalysisData.data.totalActual <=
                          currentAnalysisData.data.totalBudget
                          ? 'text-green-600'
                          : 'text-red-600'
                        }`}
                    >
                      {formatCurrency(
                        currentAnalysisData.data.totalActual -
                        currentAnalysisData.data.totalBudget,
                        settings
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 md:mt-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-600 md:text-base">
                    {analysisMode === 'tier'
                      ? 'Détails par tiers:'
                      : 'Détails par catégorie:'}
                  </h4>
                  <div className="space-y-2 overflow-y-auto max-h-60">
                    {currentAnalysisData.data.rawData?.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 p-2 bg-white border rounded sm:flex-row sm:justify-between sm:items-center md:p-3"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate">
                            {item.name}
                          </span>
                          {analysisMode === 'tier' && item.email && (
                            <span className="text-xs text-gray-500 truncate">
                              {item.email}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-4">
                          <span className="text-xs sm:text-sm">
                            Budget: {formatCurrency(item.budget, settings)}
                          </span>
                          <span className="text-xs sm:text-sm">
                            Réel: {formatCurrency(item.actual, settings)}
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

export default AnalyseView;
