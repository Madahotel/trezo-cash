import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '../../../components/context/actionsMethode';

// Import des fonctions depuis cashflow.js
import {
  formatCurrency,
  getMonthFull,
  getBimonthFull,
  getViewModeOptions,
  getViewModeLabel,
  getMonthOptions,
  getBimonthOptions,
  getYearOptions,
  calculatePeriods,
  calculateChartData,
  calculateStats,
} from '../../../services/cashflow';

const CashflowView = ({ isFocusMode = false }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedBimonth, setSelectedBimonth] = useState(0); // 0-5 pour Jan-Fév à Nov-Déc
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  const [isBimonthMenuOpen, setIsBimonthMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // 'week', 'bimonth', 'month', 'quarter', 'semester', 'year'
  const [isViewModeMenuOpen, setIsViewModeMenuOpen] = useState(false);
  const yearMenuRef = useRef(null);
  const monthMenuRef = useRef(null);
  const bimonthMenuRef = useRef(null);
  const viewModeMenuRef = useRef(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Obtenir la date actuelle
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (0 = janvier, 11 = décembre)

  // Calculer le bimensuel courant
  const currentBimonth = Math.floor(currentMonth / 2);

  // Charger les données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiGet('/flux');
        setData(response);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Initialiser le bimensuel sélectionné
  useEffect(() => {
    if (viewMode === 'bimonth') {
      setSelectedBimonth(currentBimonth);
    }
  }, [viewMode, currentBimonth]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearMenuRef.current && !yearMenuRef.current.contains(event.target)) {
        setIsYearMenuOpen(false);
      }
      if (
        monthMenuRef.current &&
        !monthMenuRef.current.contains(event.target)
      ) {
        setIsMonthMenuOpen(false);
      }
      if (
        bimonthMenuRef.current &&
        !bimonthMenuRef.current.contains(event.target)
      ) {
        setIsBimonthMenuOpen(false);
      }
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

  const handlePeriodChange = (direction) => {
    setSelectedYear((prev) => prev + direction);
  };

  // Calcul des périodes
  const periods = useMemo(() => {
    return calculatePeriods(
      viewMode,
      selectedYear,
      selectedMonth,
      selectedBimonth,
      currentYear,
      currentMonth,
      currentDate
    );
  }, [
    viewMode,
    selectedYear,
    selectedMonth,
    selectedBimonth,
    currentYear,
    currentMonth,
    currentDate,
  ]);

  // Traitement des données de l'API
  const chartData = useMemo(() => {
    return calculateChartData(
      data,
      periods,
      selectedYear,
      selectedMonth,
      selectedBimonth,
      viewMode,
      currentYear,
      currentMonth
    );
  }, [data, periods, selectedYear, selectedMonth, selectedBimonth, viewMode]);

  // Configuration du graphique ECharts
  const getChartOptions = () => {
    const { labels, inflows, outflows, balances, startingBalance } = chartData;

    // Déterminer l'index de la période courante
    let todayIndex = -1;

    if (viewMode === 'week') {
      todayIndex = periods.findIndex(
        (p) => currentDate >= p.weekStart && currentDate <= p.weekEnd
      );
    } else if (viewMode === 'bimonth') {
      if (selectedYear === currentYear) {
        const month = currentMonth;
        const startMonth = selectedBimonth * 2;
        const endMonth = startMonth + 1;

        if (month >= startMonth && month <= endMonth) {
          todayIndex = month - startMonth;
        } else if (selectedYear < currentYear) {
          todayIndex = periods.length - 1;
        }
      } else if (selectedYear < currentYear) {
        todayIndex = periods.length - 1;
      } else {
        todayIndex = -1;
      }
    } else if (['month', 'quarter', 'semester'].includes(viewMode)) {
      if (selectedYear === currentYear) {
        if (viewMode === 'month') {
          todayIndex = currentMonth;
        } else if (viewMode === 'quarter') {
          todayIndex = Math.floor(currentMonth / 3);
        } else if (viewMode === 'semester') {
          todayIndex = Math.floor(currentMonth / 6);
        }
      } else if (selectedYear < currentYear) {
        todayIndex = periods.length - 1;
      } else {
        todayIndex = -1;
      }
    } else {
      todayIndex = periods.findIndex((p) => p.year === currentYear);
    }

    // Fonction pour formater le label (masquer si 0)
    const formatLabel = (value) => {
      if (value === 0 || value === null || value === undefined) {
        return '';
      }
      return formatCurrency(value);
    };

    // Créer les séries pour la balance cumulative
    const balanceSeries = {
      name: 'Balance',
      type: 'line',
      data: balances,
      smooth: 0.4,
      symbol: 'diamond',
      symbolSize: 8,
      showSymbol: true,
      lineStyle: {
        width: 3,
      },
      itemStyle: {
        color: '#3b82f6',
        borderColor: '#ffffff',
        borderWidth: 1,
      },
      label: {
        show: true,
        position: 'top',
        formatter: (params) => formatLabel(params.value),
        fontSize: 10,
        color: '#3b82f6',
        fontWeight: 500,
      },
      z: 3,
    };

    // Série pour la ligne de balance de départ
    const startingBalanceSeries = {
      name: 'Balance de départ',
      type: 'line',
      data: Array(labels.length).fill(startingBalance),
      lineStyle: {
        width: 1,
        color: '#9ca3af',
        type: 'dashed',
        opacity: 0.5,
      },
      symbol: 'none',
      showSymbol: false,
      label: {
        show: false,
      },
      z: 0,
    };

    // Définir les styles de ligne selon la période
    if (todayIndex !== -1 && todayIndex < periods.length - 1) {
      balanceSeries.lineStyle = (params) => {
        const index = params.dataIndex;
        if (index <= todayIndex) {
          return {
            width: 3,
            color: '#3b82f6',
            type: 'solid',
          };
        } else {
          return {
            width: 3,
            color: '#3b82f6',
            type: 'dashed',
            opacity: 0.8,
          };
        }
      };

      balanceSeries.showSymbol = true;
      balanceSeries.symbol = (params) => {
        const index = params.dataIndex;
        if (index <= todayIndex) {
          return 'diamond';
        } else {
          return 'none';
        }
      };
    } else if (
      todayIndex === periods.length - 1 ||
      todayIndex > periods.length - 1
    ) {
      balanceSeries.lineStyle = {
        width: 3,
        color: '#3b82f6',
        type: 'solid',
      };
    } else {
      balanceSeries.lineStyle = {
        width: 3,
        color: '#3b82f6',
        type: 'dashed',
        opacity: 0.8,
      };
      balanceSeries.showSymbol = false;
    }

    const seriesData = [
      startingBalanceSeries,
      {
        name: 'Entrées',
        type: 'line',
        data: inflows,
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          width: 2,
          color: '#10b981',
        },
        itemStyle: {
          color: '#10b981',
          borderColor: '#ffffff',
          borderWidth: 1,
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => formatLabel(params.value),
          fontSize: 10,
          color: '#10b981',
          fontWeight: 500,
        },
        z: 1,
      },
      {
        name: 'Sorties',
        type: 'line',
        data: outflows,
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          width: 2,
          color: '#ef4444',
        },
        itemStyle: {
          color: '#ef4444',
          borderColor: '#ffffff',
          borderWidth: 1,
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => formatLabel(params.value),
          fontSize: 10,
          color: '#ef4444',
          fontWeight: 500,
        },
        z: 2,
      },
      balanceSeries,
    ];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: '#d1d5db',
            width: 1,
          },
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151',
          fontSize: 12,
        },
        padding: [8, 12],
        formatter: (params) => {
          const periodIndex = params[0].dataIndex;
          const periodName = periods[periodIndex].fullLabel;
          let html = `<div style="margin-bottom: 8px; font-weight: 500; color: #111827;">${periodName}</div>`;

          if (periodIndex === 0) {
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #9ca3af;"></div>
                  <span style="color: #4b5563; font-size: 12px;">Balance de départ</span>
                </div>
                <span style="color: #6b7280; font-weight: 500; font-size: 12px;">${formatCurrency(
                  startingBalance
                )}</span>
              </div>
            `;
          }

          params.forEach((p) => {
            if (p.seriesName === 'Balance de départ') return;

            const value = formatCurrency(p.value);
            const colorMap = {
              Entrées: '#10b981',
              Sorties: '#ef4444',
              Balance: '#3b82f6',
            };
            const color = colorMap[p.seriesName] || '#6b7280';

            const isProjection = periodIndex > todayIndex && todayIndex !== -1;

            const seriesName =
              isProjection && p.seriesName === 'Balance'
                ? `${p.seriesName} (projection)`
                : p.seriesName;

            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></div>
                  <span style="color: #4b5563; font-size: 12px;">${seriesName}</span>
                </div>
                <span style="color: ${color}; font-weight: 500; font-size: 12px;">${value}</span>
              </div>
            `;
          });

          return html;
        },
      },
      legend: {
        data: ['Balance de départ', 'Entrées', 'Sorties', 'Balance'],
        bottom: 0,
        textStyle: {
          color: '#6b7280',
          fontSize: 11,
        },
        itemGap: 20,
        itemWidth: 8,
        itemHeight: 8,
        icon: 'circle',
      },
      grid: {
        left: '2%',
        right: '5%',
        bottom: '18%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
            width: 1,
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          margin: 8,
          interval: 0,
          rotate: viewMode === 'week' ? 45 : 0,
        },
        boundaryGap: false,
        splitLine: {
          show: false,
        },
        interval: 0,
        axisPointer: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          margin: 8,
          formatter: (value) => formatCurrency(value),
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            width: 1,
          },
        },
      },
      series: seriesData,
      padding: [0, 10, 0, 10],
    };
  };

  // Options pour les menus déroulants
  const viewModeOptions = getViewModeOptions();
  const monthOptions = getMonthOptions();
  const bimonthOptions = getBimonthOptions();
  const yearOptions = getYearOptions(currentYear);

  // Calcul des statistiques
  const stats = useMemo(() => {
    return calculateStats(chartData, periods);
  }, [chartData, periods]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Chargement des données...</div>
      </div>
    );
  }

  return (
    <div
      className={
        isFocusMode
          ? 'h-full flex flex-col'
          : 'p-4 sm:p-6 max-w-full flex flex-col h-full'
      }
    >
      {!isFocusMode && (
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              {/* Navigation par année (toujours visible) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePeriodChange(-1)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Année précédente"
                  disabled={isLoading}
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <span className="text-sm text-gray-700 min-w-[80px] text-center font-medium">
                  {selectedYear}
                </span>
                <button
                  onClick={() => handlePeriodChange(1)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Année suivante"
                  disabled={isLoading}
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>

              {/* Sélecteur de vue (liste déroulante) */}
              <div className="relative" ref={viewModeMenuRef}>
                <button
                  onClick={() => setIsViewModeMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors w-full sm:w-auto"
                  disabled={isLoading}
                >
                  <span>{getViewModeLabel(viewMode)}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      isViewModeMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isViewModeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute left-0 top-full mt-1 w-full sm:w-48 bg-white rounded border shadow-sm z-10"
                    >
                      <div className="py-1">
                        {viewModeOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              setViewMode(option.id);
                              // Si on passe en vue hebdo, sélectionner le mois courant
                              if (option.id === 'week') {
                                setSelectedMonth(currentMonth);
                              }
                              // Si on passe en vue bimensuelle, sélectionner le bimensuel courant
                              if (option.id === 'bimonth') {
                                setSelectedBimonth(currentBimonth);
                              }
                              setIsViewModeMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                              viewMode === option.id
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-gray-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sélecteur de mois (uniquement visible en vue hebdo) */}
              {viewMode === 'week' && (
                <div className="relative" ref={monthMenuRef}>
                  <button
                    onClick={() => setIsMonthMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    <span>{getMonthFull(selectedMonth)}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        isMonthMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isMonthMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-1 w-full sm:w-40 bg-white rounded border shadow-sm z-10"
                      >
                        <div className="py-1 max-h-60 overflow-y-auto">
                          {monthOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => {
                                setSelectedMonth(option.id);
                                setIsMonthMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                selectedMonth === option.id
                                  ? 'text-blue-600 bg-blue-50'
                                  : 'text-gray-700'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Sélecteur de bimensuel (uniquement visible en vue bimensuelle) */}
              {viewMode === 'bimonth' && (
                <div className="relative" ref={bimonthMenuRef}>
                  <button
                    onClick={() => setIsBimonthMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    <span>{getBimonthFull(selectedBimonth)}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        isBimonthMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isBimonthMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-1 w-full sm:w-48 bg-white rounded border shadow-sm z-10"
                      >
                        <div className="py-1 max-h-60 overflow-y-auto">
                          {bimonthOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => {
                                setSelectedBimonth(option.id);
                                setIsBimonthMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                selectedBimonth === option.id
                                  ? 'text-blue-600 bg-blue-50'
                                  : 'text-gray-700'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Sélecteur d'année (toujours visible) */}
              <div className="relative" ref={yearMenuRef}>
                <button
                  onClick={() => setIsYearMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors w-full sm:w-auto"
                  disabled={isLoading}
                >
                  <span>{selectedYear}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      isYearMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isYearMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 top-full mt-1 w-full sm:w-32 bg-white rounded border shadow-sm z-10"
                    >
                      <div className="py-1 max-h-60 overflow-y-auto">
                        {yearOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              setSelectedYear(parseInt(option.id));
                              setIsYearMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                              selectedYear === parseInt(option.id)
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-gray-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Stats en ligne */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Entrées</div>
              <div className="text-sm font-medium text-emerald-600">
                {formatCurrency(stats.totalInflow)}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Sorties</div>
              <div className="text-sm font-medium text-rose-600">
                {formatCurrency(stats.totalOutflow)}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Balance</div>
              <div
                className={`text-sm font-medium ${
                  stats.totalBalance >= 0 ? 'text-blue-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(stats.totalBalance)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white rounded border border-gray-200 flex flex-col">
        <div className="flex-1 p-2 sm:p-4">
          {data ? (
            <ReactECharts
              option={getChartOptions()}
              style={{ height: '100%', width: '100%' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">
                Aucune donnée disponible pour{' '}
                {viewMode === 'week'
                  ? `${getMonthFull(selectedMonth)} ${selectedYear}`
                  : viewMode === 'bimonth'
                  ? `${getBimonthFull(selectedBimonth)} ${selectedYear}`
                  : selectedYear}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashflowView;
