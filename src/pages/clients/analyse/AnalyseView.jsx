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
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '../../../components/context/actionsMethode';

// Import des fonctions d'analyse
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

// Composant pour les états vides
const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
    <Icon className="w-16 h-16 mb-4" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm">{message}</p>
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
  // États locaux
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

  // États pour les données API
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupération des données depuis l'API
  const fetchData = async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/analyse/project/${projectId}`);

      if (response.status === 200) {
        setApiData(response);
      } else {
        throw new Error('Erreur lors de la récupération des données');
      }
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

  // Configuration par défaut
  const defaultSettings = {
    timezoneOffset: 0,
    currency: 'EUR',
    language: 'fr',
  };

  // Transformer les données API
  const transformedData = useMemo(() => {
    return transformApiData(apiData, defaultSettings);
  }, [apiData]);

  // Utiliser les données transformées
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

  // Gestion des clics en dehors des menus
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

  // Réinitialiser le drill down quand le mode d'analyse change
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

  // Gestion de la période
  const handlePeriodNavigation = (direction) => {
    setCurrentPeriod((prev) => handlePeriodChange(prev, direction));
  };

  const handlePeriodSelect = (periodType) => {
    setCurrentPeriod(handleQuickPeriodSelect(periodType));
  };

  // Calcul de la plage de dates
  const { rangeStart, rangeEnd, analysisPeriodName } = useMemo(() => {
    return calculateDateRange(rangeStartProp, rangeEndProp, currentPeriod);
  }, [rangeStartProp, rangeEndProp, currentPeriod]);

  // Filtrer les données par projet et période
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

  // Données d'analyse par catégorie pour la période
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

  // Données d'analyse par tiers pour la période
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

  // Sélectionner les données selon le mode d'analyse
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

  // Configuration du graphique
  const chartOptions = useMemo(() => {
    return getChartOptions({
      analysisMode,
      categoryAnalysisData,
      tierAnalysisData,
      analysisType,
      analysisPeriodName,
      settings,
      visibleData,
    });
  }, [
    analysisMode,
    categoryAnalysisData,
    tierAnalysisData,
    analysisType,
    analysisPeriodName,
    settings,
    visibleData,
  ]);

  // Gestion du clic sur le graphique
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

  // Sélectionner l'icône appropriée selon le mode
  const getEmptyStateIcon = () => {
    if (analysisMode === 'tier') return User;
    return PieChart;
  };

  // Sélectionner le titre approprié selon le mode
  const getEmptyStateTitle = () => {
    if (analysisMode === 'tier') {
      return `Aucun ${
        analysisType === 'expense' ? 'fournisseur' : 'client'
      } à analyser`;
    }
    return `Aucune ${
      analysisType === 'expense' ? 'dépense' : 'entrée'
    } à analyser`;
  };

  // Rendu du graphique avec gestion du loading et des erreurs
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
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

    const hasData =
      analysisMode === 'tier'
        ? tierAnalysisData.tiers && tierAnalysisData.tiers.length > 0
        : categoryAnalysisData.categories &&
          categoryAnalysisData.categories.length > 0;

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
      <ReactECharts
        option={chartOptions}
        style={{
          height: `${Math.max(
            500,
            currentAnalysisData.data.categories
              ? currentAnalysisData.data.categories.length * 80
              : currentAnalysisData.data.tiers.length * 80
          )}px`,
          width: '100%',
        }}
        onEvents={onEvents}
      />
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
    <div className={isFocusMode ? 'h-full flex flex-col' : 'p-6 max-w-full'}>
      {!isFocusMode && (
        <div className="mb-6">
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

                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

                <div className="relative" ref={periodMenuRef}>
                  <button
                    onClick={() => setIsPeriodMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 h-9 rounded-md bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition-colors"
                  >
                    <span>{selectedPeriodLabel}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isPeriodMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isPeriodMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20"
                      >
                        <ul className="p-1">
                          {quickPeriodOptions.map((option) => (
                            <li key={option.id}>
                              <button
                                onClick={() => {
                                  handlePeriodSelect(option.id);
                                  setIsPeriodMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${
                                  currentPeriod.type === option.id
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
                  className="flex items-center gap-2 px-3 h-9 rounded-md bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition-colors"
                >
                  <span>
                    {selectedAnalysisModeOption?.label || 'Par catégorie'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isAnalysisModeMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isAnalysisModeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20"
                    >
                      <ul className="p-1">
                        {analysisModeOptions.map((option) => (
                          <li key={option.id}>
                            <button
                              onClick={() => {
                                setAnalysisMode(option.id);
                                setIsAnalysisModeMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${
                                analysisMode === option.id
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
                  className="flex items-center gap-2 px-3 h-9 rounded-md bg-gray-200 font-semibold text-sm hover:bg-gray-300 transition-colors"
                >
                  <SelectedIcon
                    className={`w-4 h-4 ${
                      selectedAnalysisTypeOption?.color || 'text-red-600'
                    }`}
                  />
                  <span>{selectedAnalysisTypeOption?.label || 'Sorties'}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isAnalysisTypeMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isAnalysisTypeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20"
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
                                className={`w-full text-left px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${
                                  analysisType === option.id
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

              <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                <button
                  onClick={() =>
                    setVisibleData((p) => ({ ...p, budget: !p.budget }))
                  }
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    visibleData.budget
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
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    visibleData.actual
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
      )}

      <div className="bg-white p-6 rounded-lg shadow">
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>
        )}

        {renderChart()}

        {/* Section d'information des données */}
        {!loading && !error && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Résumé de l'analyse pour {analysisPeriodName}:
            </h3>

            {currentAnalysisData.data.rawData &&
            currentAnalysisData.data.rawData.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-medium text-gray-600">Total Budget</h4>
                    <p className="text-lg font-bold">
                      {formatCurrency(
                        currentAnalysisData.data.totalBudget,
                        settings
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {projectEntries.length} transactions générées
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-medium text-gray-600">Total Réel</h4>
                    <p className="text-lg font-bold">
                      {formatCurrency(
                        currentAnalysisData.data.totalActual,
                        settings
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {projectActuals.length} paiements réels
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <h4 className="font-medium text-gray-600">Différence</h4>
                    <p
                      className={`text-lg font-bold ${
                        currentAnalysisData.data.totalActual <=
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
                    <p className="text-xs text-gray-500">
                      {currentAnalysisData.data.totalActual <=
                      currentAnalysisData.data.totalBudget
                        ? 'Sous le budget'
                        : 'Dépassement'}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-600 mb-2">
                    {analysisMode === 'tier'
                      ? 'Détails par tiers:'
                      : 'Détails par catégorie:'}
                  </h4>
                  <div className="space-y-2">
                    {currentAnalysisData.data.rawData?.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-white rounded border"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                          {analysisMode === 'tier' && item.email && (
                            <span className="text-xs text-gray-500">
                              {item.email}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4">
                          <span className="text-sm">
                            Budget: {formatCurrency(item.budget, settings)}
                          </span>
                          <span className="text-sm">
                            Réel: {formatCurrency(item.actual, settings)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
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
