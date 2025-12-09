import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '../../../components/context/actionsMethode';

const CashflowView = ({ isFocusMode = false }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // 'week', 'month', 'year'
  const yearMenuRef = useRef(null);
  const [data, setData] = useState(null);

  // Obtenir la date actuelle
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (0 = janvier, 11 = décembre)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiGet('/flux');
        setData(response);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearMenuRef.current && !yearMenuRef.current.contains(event.target)) {
        setIsYearMenuOpen(false);
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

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const periods = useMemo(() => {
    const monthsShort = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];

    if (viewMode === 'week') {
      // Vue hebdomadaire - 52 semaines
      const weeks = [];
      const startOfYear = new Date(selectedYear, 0, 1);
      const endOfYear = new Date(selectedYear, 11, 31);

      let currentWeekStart = new Date(startOfYear);
      // Ajuster au lundi
      const day = currentWeekStart.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      currentWeekStart.setDate(currentWeekStart.getDate() + diff);

      let weekNumber = 1;
      while (currentWeekStart <= endOfYear) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const isPast = weekEnd < currentDate;
        weeks.push({
          label: `S${weekNumber}`,
          fullLabel: `Semaine ${weekNumber} ${selectedYear}`,
          weekStart: new Date(currentWeekStart),
          weekEnd: new Date(weekEnd),
          isPastOrCurrent:
            isPast ||
            (currentDate >= currentWeekStart && currentDate <= weekEnd),
          isFuture: currentWeekStart > currentDate,
        });

        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekNumber++;
      }
      return weeks;
    } else if (viewMode === 'month') {
      // Vue mensuelle - 12 mois
      return monthsShort.map((month, index) => ({
        label: month,
        fullLabel: `${month} ${selectedYear}`,
        monthNumber: index + 1,
        isPastOrCurrent:
          selectedYear < currentYear ||
          (selectedYear === currentYear && index <= currentMonth),
        isFuture:
          selectedYear > currentYear ||
          (selectedYear === currentYear && index > currentMonth),
      }));
    } else {
      // Vue annuelle - 10 ans (5 avant, année courante, 4 après)
      const years = [];
      for (let i = -5; i <= 4; i++) {
        const year = selectedYear + i;
        years.push({
          label: year.toString(),
          fullLabel: year.toString(),
          year: year,
          isPastOrCurrent: year <= currentYear,
          isFuture: year > currentYear,
        });
      }
      return years;
    }
  }, [selectedYear, currentYear, currentMonth, currentDate, viewMode]);

  // Traitement des données de l'API
  const chartData = useMemo(() => {
    const labels = periods.map((p) => p.label);

    // Si pas de données, retourner des données vides
    if (!data || !data.balanceMovements) {
      return {
        labels,
        inflows: Array(periods.length).fill(0),
        outflows: Array(periods.length).fill(0),
        differences: Array(periods.length).fill(0),
      };
    }

    // Initialiser les tableaux
    const inflows = Array(periods.length).fill(0);
    const outflows = Array(periods.length).fill(0);

    // Parcourir les mouvements et les regrouper selon la vue
    data.balanceMovements.forEach((movement) => {
      const date = new Date(movement.operation_date);
      const amount = parseFloat(movement.operation_amount) || 0;

      let periodIndex = -1;

      if (viewMode === 'week') {
        // Trouver l'index de la semaine
        periodIndex = periods.findIndex((p) => {
          return date >= p.weekStart && date <= p.weekEnd;
        });
      } else if (viewMode === 'month') {
        // Trouver l'index du mois
        if (date.getFullYear() === selectedYear) {
          periodIndex = date.getMonth();
        }
      } else {
        // Vue annuelle - trouver l'index de l'année
        periodIndex = periods.findIndex((p) => p.year === date.getFullYear());
      }

      if (periodIndex !== -1) {
        if (movement.movement_type_id === 1) {
          // Entrée (Crédit)
          inflows[periodIndex] += amount;
        } else if (movement.movement_type_id === 2) {
          // Sortie (Débit)
          outflows[periodIndex] += amount;
        }
      }
    });

    // Calculer les différences (balance)
    const differences = inflows.map((inflow, index) =>
      Math.round(inflow - outflows[index])
    );

    return {
      labels,
      inflows: inflows.map((value) => Math.round(value)),
      outflows: outflows.map((value) => Math.round(value)),
      differences,
    };
  }, [data, periods, selectedYear, viewMode]);

  const getChartOptions = () => {
    const { labels, inflows, outflows, differences } = chartData;

    // Déterminer l'index du mois courant pour l'année sélectionnée
    let todayIndex = -1;

    if (viewMode === 'week') {
      todayIndex = periods.findIndex(
        (p) => currentDate >= p.weekStart && currentDate <= p.weekEnd
      );
    } else if (viewMode === 'month') {
      if (selectedYear === currentYear) {
        todayIndex = currentMonth;
      } else if (selectedYear < currentYear) {
        todayIndex = 11;
      } else {
        todayIndex = -1;
      }
    } else {
      // Vue annuelle
      todayIndex = periods.findIndex((p) => p.year === currentYear);
    }

    // Fonction pour formater le label (masquer si 0)
    const formatLabel = (value) => {
      if (value === 0 || value === null || value === undefined) {
        return ''; // Retourner une chaîne vide pour les valeurs 0
      }
      return formatCurrency(value);
    };

    // Créer les séries pour la balance avec style différent selon la période
    const balanceSeries = {
      name: 'Balance',
      type: 'line',
      data: differences,
      smooth: 0.4, // Courbure modérée
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
        formatter: (params) => formatLabel(params.value), // Utiliser formatLabel
        fontSize: 10,
        color: '#3b82f6',
        fontWeight: 500,
      },
      z: 3,
    };

    // Définir les styles de ligne selon la période
    if (todayIndex !== -1 && todayIndex < periods.length - 1) {
      // Il y a des données passées et futures
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

      // Pour les symboles, masquer sur la partie tiretée
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
      // Toutes les périodes sont passées
      balanceSeries.lineStyle = {
        width: 3,
        color: '#3b82f6',
        type: 'solid',
      };
    } else {
      // Toutes les périodes sont futures
      balanceSeries.lineStyle = {
        width: 3,
        color: '#3b82f6',
        type: 'dashed',
        opacity: 0.8,
      };
      balanceSeries.showSymbol = false;
    }

    const seriesData = [
      {
        name: 'Entrées',
        type: 'line',
        data: inflows,
        smooth: 0.4, // Courbure pour les entrées
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
          formatter: (params) => formatLabel(params.value), // Utiliser formatLabel
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
        smooth: 0.4, // Courbure pour les sorties
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
          formatter: (params) => formatLabel(params.value), // Utiliser formatLabel
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

          params.forEach((p) => {
            const value = formatCurrency(p.value);
            const colorMap = {
              Entrées: '#10b981',
              Sorties: '#ef4444',
              Balance: '#3b82f6',
            };
            const color = colorMap[p.seriesName] || '#6b7280';

            // Ajouter un indicateur si c'est une projection
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
        data: ['Entrées', 'Sorties', 'Balance'],
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
        left: '0%',
        right: '3%',
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
          rotate: 0,
        },
        boundaryGap: false, // Changé pour meilleur rendu des courbes
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
  // Options d'années (5 ans en arrière, année courante, 4 ans en avant)
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const yearValue = new Date().getFullYear() - 5 + i;
    return { id: yearValue.toString(), label: yearValue.toString() };
  });

  // Calcul des statistiques basées sur les données réelles
  const stats = useMemo(() => {
    const { inflows, outflows, differences } = chartData;

    // Calculer les moyennes uniquement sur les mois avec données
    const monthsWithData =
      inflows.filter((val, idx) => val !== 0 || outflows[idx] !== 0).length ||
      12;

    const totalInflow = inflows.reduce((a, b) => a + b, 0);
    const totalOutflow = outflows.reduce((a, b) => a + b, 0);
    const totalBalance = totalInflow - totalOutflow; // Ajouter cette ligne

    const avgInflow = totalInflow / monthsWithData;
    const avgOutflow = totalOutflow / monthsWithData;

    // Trouver la dernière balance non-nulle (jusqu'au mois courant pour l'année en cours)
    let lastBalance = 0;
    for (let i = differences.length - 1; i >= 0; i--) {
      if (inflows[i] !== 0 || outflows[i] !== 0) {
        lastBalance = differences[i];
        break;
      }
    }

    return {
      avgInflow: Math.round(avgInflow),
      avgOutflow: Math.round(avgOutflow),
      lastBalance,
      totalInflow,
      totalOutflow,
      totalBalance, // Ajouter cette propriété
    };
  }, [chartData]);

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
              {/* Navigation année */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePeriodChange(-1)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Année précédente"
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
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>

              {/* Sélecteur de vue */}
              <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === 'week'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Semaine
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mois
                </button>
                <button
                  onClick={() => setViewMode('year')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === 'year'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Année
                </button>
              </div>
            </div>

            <div className="relative" ref={yearMenuRef}>
              <button
                onClick={() => setIsYearMenuOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors w-full sm:w-auto"
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

          {/* Stats en ligne - design d'origine */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">
                Entrées {selectedYear}
              </div>
              <div className="text-sm font-medium text-emerald-600">
                {formatCurrency(stats.totalInflow)}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">
                Sorties {selectedYear}
              </div>
              <div className="text-sm font-medium text-rose-600">
                {formatCurrency(stats.totalOutflow)}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">
                Balance {selectedYear}
              </div>
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
          <ReactECharts
            option={getChartOptions()}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CashflowView;
