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
  getWeekOptions,
  calculatePeriods,
  calculateChartData,
  calculateWeeklyChartData,
  calculateStats,
  calculateCumulativeData,
  getFullPeriodLabel,
  isPeriodInPast,
  isPeriodCurrent,
} from '../../../services/cashflow';

const CashflowView = ({ isFocusMode = false }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedBimonth, setSelectedBimonth] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  const [isBimonthMenuOpen, setIsBimonthMenuOpen] = useState(false);
  const [isWeekMenuOpen, setIsWeekMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('month');
  const [isViewModeMenuOpen, setIsViewModeMenuOpen] = useState(false);
  const yearMenuRef = useRef(null);
  const monthMenuRef = useRef(null);
  const bimonthMenuRef = useRef(null);
  const weekMenuRef = useRef(null);
  const viewModeMenuRef = useRef(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Obtenir la date actuelle
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
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

  // Mettre à jour les sélections quand le mode de vue change
  useEffect(() => {
    if (viewMode === 'bimonth') {
      setSelectedBimonth(currentBimonth);
    }
    if (viewMode === 'week' || viewMode === 'month') {
      setSelectedMonth(currentMonth);
      const weekOptions = getWeekOptions(selectedYear, currentMonth);
      const currentWeekIndex = weekOptions.findIndex(
        (week) => currentDate >= week.weekStart && currentDate <= week.weekEnd
      );
      if (currentWeekIndex !== -1) {
        setSelectedWeek(currentWeekIndex);
      } else if (weekOptions.length > 0) {
        setSelectedWeek(0);
      }
    }
  }, [viewMode]);

  // Réinitialiser la semaine sélectionnée quand on change de mois
  useEffect(() => {
    if (viewMode === 'week') {
      setSelectedWeek(0);
    }
  }, [selectedMonth, viewMode]);

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
      if (weekMenuRef.current && !weekMenuRef.current.contains(event.target)) {
        setIsWeekMenuOpen(false);
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

  // Obtenir les options de semaine pour le mois sélectionné
  const weekOptions = useMemo(() => {
    if (viewMode === 'week' || viewMode === 'month') {
      return getWeekOptions(selectedYear, selectedMonth);
    }
    return [];
  }, [viewMode, selectedYear, selectedMonth]);

  // Calcul des périodes - CORRECTION : AJOUT DE selectedWeek DANS LES DÉPENDANCES
  const periods = useMemo(() => {
    if (
      viewMode === 'week' &&
      weekOptions.length > 0 &&
      selectedWeek < weekOptions.length
    ) {
      // Pour la vue hebdo, on affiche les jours de la semaine sélectionnée
      const selectedWeekOption = weekOptions[selectedWeek];
      if (!selectedWeekOption) return [];

      const days = [];
      const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      const dayFullNames = [
        'Lundi',
        'Mardi',
        'Mercredi',
        'Jeudi',
        'Vendredi',
        'Samedi',
        'Dimanche',
      ];

      const startDate = new Date(selectedWeekOption.weekStart);

      // S'assurer qu'on commence le lundi
      while (startDate.getDay() !== 1) {
        startDate.setDate(startDate.getDate() - 1);
      }

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + i);

        const isToday =
          currentDay.getDate() === currentDate.getDate() &&
          currentDay.getMonth() === currentDate.getMonth() &&
          currentDay.getFullYear() === currentDate.getFullYear();

        const isPast = currentDay < currentDate && !isToday;

        days.push({
          label: `${dayNames[i]} ${currentDay.getDate()}`,
          fullLabel: `${dayFullNames[i]} ${currentDay.getDate()} ${getMonthFull(
            currentDay.getMonth()
          )}`,
          dayIndex: i,
          date: new Date(currentDay),
          isToday,
          isPast,
          isFuture: currentDay > currentDate,
          weekStart: new Date(startDate),
          weekEnd: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000),
        });
      }

      return days;
    } else {
      // Pour les autres vues
      return calculatePeriods(
        viewMode,
        selectedYear,
        selectedMonth,
        selectedBimonth,
        currentYear,
        currentMonth,
        currentDate
      );
    }
  }, [
    viewMode,
    selectedYear,
    selectedMonth,
    selectedBimonth,
    currentYear,
    currentMonth,
    currentDate,
    weekOptions,
    selectedWeek, // IMPORTANT : AJOUTÉ ICI
  ]);

  // Calcul de la balance de départ
  const startingBalance = useMemo(() => {
    if (!data) {
      return data?.initialBalance ? parseFloat(data.initialBalance) : 0;
    }

    const { initialBalance } = calculateCumulativeData(data);

    if (
      viewMode === 'week' &&
      weekOptions.length > 0 &&
      selectedWeek < weekOptions.length
    ) {
      const selectedWeekOption = weekOptions[selectedWeek];
      const startOfWeek = new Date(selectedWeekOption.weekStart);

      const { cumulativeBalances } = calculateCumulativeData(data);
      let balanceAtStartOfWeek = initialBalance;

      for (let i = 0; i < cumulativeBalances.length; i++) {
        if (cumulativeBalances[i].date < startOfWeek) {
          balanceAtStartOfWeek = cumulativeBalances[i].balance;
        } else {
          break;
        }
      }

      return balanceAtStartOfWeek;
    }

    return initialBalance;
  }, [data, viewMode, weekOptions, selectedWeek]);

  // Traitement des données de l'API
  const chartData = useMemo(() => {
    if (
      viewMode === 'week' &&
      weekOptions.length > 0 &&
      selectedWeek < weekOptions.length
    ) {
      return calculateWeeklyChartData(
        data,
        periods,
        weekOptions,
        selectedWeek,
        startingBalance
      );
    } else {
      return calculateChartData(
        data,
        periods,
        selectedYear,
        selectedMonth,
        selectedBimonth,
        viewMode,
        currentDate
      );
    }
  }, [
    data,
    periods,
    viewMode,
    selectedYear,
    selectedMonth,
    selectedBimonth,
    currentDate,
    weekOptions,
    selectedWeek,
    startingBalance,
  ]);

  // Configuration du graphique ECharts - CORRECTION POUR TOUTES LES VUES
  const getChartOptions = () => {
    const { labels, inflows, outflows, balances, startingBalance } = chartData;

    // Fonction pour formater le label (masquer si 0)
    const formatLabel = (value) => {
      if (value === 0 || value === null || value === undefined) {
        return '';
      }
      return formatCurrency(value);
    };

    // Déterminer l'index de la période actuelle - CORRECTION POUR TOUTES LES VUES
    let currentPeriodIndex = -1;

    if (viewMode === 'week') {
      // Vue hebdo : trouver le jour actuel
      currentPeriodIndex = periods.findIndex((p) => p.isToday);
      if (currentPeriodIndex === -1) {
        for (let i = periods.length - 1; i >= 0; i--) {
          if (periods[i].isPast) {
            currentPeriodIndex = i;
            break;
          }
        }
      }
    } else if (viewMode === 'month' || viewMode === 'bimonth') {
      // Vue mensuelle/bimensuelle : trouver la semaine actuelle
      for (let i = 0; i < periods.length; i++) {
        if (periods[i].weekStart && periods[i].weekEnd) {
          if (
            currentDate >= periods[i].weekStart &&
            currentDate <= periods[i].weekEnd
          ) {
            currentPeriodIndex = i;
            break;
          }
        }
      }
      if (currentPeriodIndex === -1) {
        for (let i = periods.length - 1; i >= 0; i--) {
          if (periods[i].weekEnd && periods[i].weekEnd < currentDate) {
            currentPeriodIndex = i;
            break;
          }
        }
      }
    } else if (viewMode === 'quarter') {
      // Vue trimestrielle : trouver le trimestre actuel
      const currentQuarter = Math.floor(currentMonth / 3);
      if (selectedYear === currentYear) {
        currentPeriodIndex = currentQuarter;
      } else if (selectedYear < currentYear) {
        currentPeriodIndex = periods.length - 1; // Dernier trimestre
      }
    } else if (viewMode === 'semester') {
      // Vue semestrielle : trouver le semestre actuel
      const currentSemester = Math.floor(currentMonth / 6);
      if (selectedYear === currentYear) {
        currentPeriodIndex = currentSemester;
      } else if (selectedYear < currentYear) {
        currentPeriodIndex = periods.length - 1; // Dernier semestre
      }
    } else if (viewMode === 'year') {
      // Vue annuelle : trouver le mois actuel
      if (selectedYear === currentYear) {
        currentPeriodIndex = currentMonth;
      } else if (selectedYear < currentYear) {
        currentPeriodIndex = periods.length - 1; // Décembre
      }
    } else if (viewMode === 'global') {
      // Vue globale : trouver l'année actuelle
      currentPeriodIndex = periods.findIndex((p) => p.year === currentYear);
      if (currentPeriodIndex === -1 && selectedYear < currentYear) {
        currentPeriodIndex = periods.length - 1; // Dernière année
      }
    }

    // Créer les séries pour la balance cumulative - TRAIT PLEIN/POINTILLÉ POUR TOUTES LES VUES
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

    // Configurer le style de ligne selon si c'est passé ou futur
    if (currentPeriodIndex !== -1) {
      balanceSeries.lineStyle = (params) => {
        const index = params.dataIndex;
        // Passé ou présent : trait plein
        // Futur : trait pointillé
        if (index <= currentPeriodIndex) {
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

      balanceSeries.showSymbol = (params) => {
        const index = params.dataIndex;
        // Symboles seulement pour passé et présent
        return index <= currentPeriodIndex;
      };
    } else {
      // Si pas de période actuelle trouvée
      if (
        viewMode === 'global' ||
        viewMode === 'year' ||
        viewMode === 'semester' ||
        viewMode === 'quarter'
      ) {
        // Pour les vues agrégées, vérifier si toutes les périodes sont passées
        const allPast = periods.every(
          (p) => p.isPastOrCurrent === true || p.isPastOrCurrent === undefined
        );

        if (allPast) {
          balanceSeries.lineStyle = {
            width: 3,
            color: '#3b82f6',
            type: 'solid',
          };
          balanceSeries.showSymbol = true;
        } else {
          balanceSeries.lineStyle = {
            width: 3,
            color: '#3b82f6',
            type: 'dashed',
            opacity: 0.8,
          };
          balanceSeries.showSymbol = false;
        }
      } else {
        // Par défaut pour les autres vues
        balanceSeries.lineStyle = {
          width: 3,
          color: '#3b82f6',
          type: 'dashed',
          opacity: 0.8,
        };
        balanceSeries.showSymbol = false;
      }
    }

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

    // Configurer la rotation des labels selon la vue
    const labelRotation =
      viewMode === 'week'
        ? 0
        : ['month', 'bimonth'].includes(viewMode)
          ? 45
          : 0;

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
          const periodName =
            periods[periodIndex]?.fullLabel ||
            periods[periodIndex]?.label ||
            '';
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

            const isProjection =
              (currentPeriodIndex !== -1 && periodIndex > currentPeriodIndex) ||
              periods[periodIndex]?.isFuture === true;

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
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
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
          rotate: labelRotation,
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

  // Fonction pour obtenir le label complet de la période affichée
  const fullPeriodLabel = useMemo(() => {
    return getFullPeriodLabel(
      viewMode,
      selectedYear,
      selectedMonth,
      selectedBimonth,
      weekOptions,
      selectedWeek
    );
  }, [
    viewMode,
    selectedYear,
    selectedMonth,
    selectedBimonth,
    weekOptions,
    selectedWeek,
  ]);

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
          <div className="flex flex-col justify-between gap-4 mb-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              {/* Navigation par période */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePeriodChange(-1)}
                  className="p-1 transition-colors rounded hover:bg-gray-100"
                  title="Période précédente"
                  disabled={isLoading}
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <span className="text-sm text-gray-700 min-w-[80px] text-center font-medium">
                  {viewMode === 'global'
                    ? `${selectedYear - 5}-${selectedYear + 4}`
                    : selectedYear}
                </span>
                <button
                  onClick={() => handlePeriodChange(1)}
                  className="p-1 transition-colors rounded hover:bg-gray-100"
                  title="Période suivante"
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
                    className={`w-3 h-3 transition-transform ${isViewModeMenuOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                <AnimatePresence>
                  {isViewModeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute left-0 z-10 w-full mt-1 bg-white border rounded shadow-sm top-full sm:w-48"
                    >
                      <div className="py-1">
                        {viewModeOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              setViewMode(option.id);
                              if (
                                option.id === 'week' ||
                                option.id === 'month'
                              ) {
                                setSelectedMonth(currentMonth);
                              }
                              if (option.id === 'bimonth') {
                                setSelectedBimonth(currentBimonth);
                              }
                              setIsViewModeMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${viewMode === option.id
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
              {/* Sélecteurs spécifiques selon la vue */}
              {viewMode === 'week' && (
                <>
                  <div className="relative" ref={monthMenuRef}>
                    <button
                      onClick={() => setIsMonthMenuOpen((p) => !p)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors w-full sm:w-auto"
                      disabled={isLoading}
                    >
                      <span>{getMonthFull(selectedMonth)}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${isMonthMenuOpen ? 'rotate-180' : ''
                          }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isMonthMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute right-0 z-10 w-full mt-1 bg-white border rounded shadow-sm top-full sm:w-40"
                        >
                          <div className="py-1 overflow-y-auto max-h-60">
                            {monthOptions.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => {
                                  setSelectedMonth(option.id);
                                  setSelectedWeek(0);
                                  setIsMonthMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedMonth === option.id
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

                  {weekOptions.length > 0 && (
                    <div className="relative" ref={weekMenuRef}>
                      <button
                        onClick={() => setIsWeekMenuOpen((p) => !p)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors w-full sm:w-auto"
                        disabled={isLoading}
                      >
                        <span>
                          {weekOptions[selectedWeek]?.label ||
                            `S${selectedWeek + 1}`}
                        </span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${isWeekMenuOpen ? 'rotate-180' : ''
                            }`}
                        />
                      </button>

                      <AnimatePresence>
                        {isWeekMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute right-0 z-10 w-full mt-1 bg-white border rounded shadow-sm top-full sm:w-48"
                          >
                            <div className="py-1 overflow-y-auto max-h-60">
                              {weekOptions.map((option, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setSelectedWeek(index);
                                    setIsWeekMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedWeek === index
                                      ? 'text-blue-600 bg-blue-50'
                                      : 'text-gray-700'
                                    }`}
                                >
                                  {option.fullLabel}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}

              {viewMode === 'month' && (
                <div className="relative" ref={monthMenuRef}>
                  <button
                    onClick={() => setIsMonthMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    <span>{getMonthFull(selectedMonth)}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${isMonthMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isMonthMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 z-10 w-full mt-1 bg-white border rounded shadow-sm top-full sm:w-40"
                      >
                        <div className="py-1 overflow-y-auto max-h-60">
                          {monthOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => {
                                setSelectedMonth(option.id);
                                setIsMonthMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedMonth === option.id
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

              {viewMode === 'bimonth' && (
                <div className="relative" ref={bimonthMenuRef}>
                  <button
                    onClick={() => setIsBimonthMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    <span>{getBimonthFull(selectedBimonth)}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${isBimonthMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isBimonthMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 z-10 w-full mt-1 bg-white border rounded shadow-sm top-full sm:w-48"
                      >
                        <div className="py-1 overflow-y-auto max-h-60">
                          {bimonthOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => {
                                setSelectedBimonth(option.id);
                                setIsBimonthMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedBimonth === option.id
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

              {/* Sélecteur d'année (toujours visible sauf en vue globale) */}
              {viewMode !== 'global' && (
                <div className="relative" ref={yearMenuRef}>
                  <button
                    onClick={() => setIsYearMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    <span>{selectedYear}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${isYearMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isYearMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 z-10 w-full mt-1 bg-white border rounded shadow-sm top-full sm:w-32"
                      >
                        <div className="py-1 overflow-y-auto max-h-60">
                          {yearOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => {
                                setSelectedYear(parseInt(option.id));
                                setIsYearMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedYear === parseInt(option.id)
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
            </div>
          </div>

          {/* Label de la période sélectionnée */}
          <div className="mb-4 text-sm font-medium text-gray-600">
            {fullPeriodLabel}
          </div>

          {/* Stats en ligne */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded bg-gray-50">
              <div className="mb-1 text-xs text-gray-500">Entrées</div>
              <div className="text-sm font-medium text-emerald-600">
                {formatCurrency(stats.totalInflow)}
              </div>
            </div>
            <div className="p-3 rounded bg-gray-50">
              <div className="mb-1 text-xs text-gray-500">Sorties</div>
              <div className="text-sm font-medium text-rose-600">
                {formatCurrency(stats.totalOutflow)}
              </div>
            </div>
            <div className="p-3 rounded bg-gray-50">
              <div className="mb-1 text-xs text-gray-500">Balance</div>
              <div
                className={`text-sm font-medium ${stats.totalBalance >= 0 ? 'text-blue-600' : 'text-rose-600'
                  }`}
              >
                {formatCurrency(stats.totalBalance)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 bg-white border border-gray-200 rounded">
        <div className="flex-1 p-2 sm:p-4">
          {data ? (
            <ReactECharts
              option={getChartOptions()}
              style={{ height: '100%', width: '100%' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">
                Aucune donnée disponible pour {fullPeriodLabel}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashflowView;
