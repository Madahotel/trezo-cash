import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '../../../components/context/actionsMethode';

const CashflowView = ({ isFocusMode = false }) => {
  const [periodOffset, setPeriodOffset] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const yearMenuRef = useRef(null);
  const [data, setData] = useState(null);

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

    return monthsShort.map((month, index) => ({
      label: month,
      fullLabel: `${month} ${selectedYear}`,
      monthNumber: index + 1,
    }));
  }, [selectedYear]);

  // Traitement des données de l'API
  const chartData = useMemo(() => {
    const labels = periods.map((p) => p.label);

    // Si pas de données, retourner des données vides
    if (!data || !data.balanceMovements) {
      return {
        labels,
        inflows: Array(12).fill(0),
        outflows: Array(12).fill(0),
        differences: Array(12).fill(0),
      };
    }

    // Initialiser les tableaux pour chaque mois
    const inflows = Array(12).fill(0);
    const outflows = Array(12).fill(0);

    // Parcourir les mouvements et les regrouper par mois
    data.balanceMovements.forEach((movement) => {
      const date = new Date(movement.operation_date);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11 (Jan = 0, Déc = 11)
      const amount = parseFloat(movement.operation_amount) || 0;

      // Si le mouvement est dans l'année sélectionnée
      if (year === selectedYear) {
        if (movement.movement_type_id === 1) {
          // Entrée (Crédit)
          inflows[month] += amount;
        } else if (movement.movement_type_id === 2) {
          // Sortie (Débit)
          outflows[month] += amount;
        }
      }
    });

    // Calculer les différences (balance) pour chaque mois
    const differences = inflows.map(
      (inflow, index) => inflow - outflows[index]
    );

    return {
      labels,
      inflows: inflows.map((value) => Math.round(value)),
      outflows: outflows.map((value) => Math.round(value)),
      differences: differences.map((value) => Math.round(value)),
    };
  }, [data, periods, selectedYear]);

  const getChartOptions = () => {
    const { labels, inflows, outflows, differences } = chartData;

    const seriesData = [
      {
        name: 'Entrées',
        type: 'line',
        data: inflows,
        smooth: false,
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
        z: 1,
      },
      {
        name: 'Sorties',
        type: 'line',
        data: outflows,
        smooth: false,
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
        z: 2,
      },
      {
        name: 'Balance',
        type: 'line',
        data: differences,
        smooth: false,
        symbol: 'diamond',
        symbolSize: 8,
        showSymbol: true,
        lineStyle: {
          width: 3,
          color: '#3b82f6',
        },
        itemStyle: {
          color: '#3b82f6',
          borderColor: '#ffffff',
          borderWidth: 1,
        },
        z: 3,
      },
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
          const monthName = periods[periodIndex].fullLabel;
          let html = `<div style="margin-bottom: 8px; font-weight: 500; color: #111827;">${monthName}</div>`;

          params.forEach((p) => {
            const value = formatCurrency(p.value);
            const colorMap = {
              Entrées: '#10b981',
              Sorties: '#ef4444',
              Balance: '#3b82f6',
            };
            const color = colorMap[p.seriesName] || '#6b7280';

            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></div>
                  <span style="color: #4b5563; font-size: 12px;">${p.seriesName}</span>
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
        right: '0%',
        bottom: '15%',
        top: '5%',
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
        },
        boundaryGap: true,
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

    const avgInflow = totalInflow / monthsWithData;
    const avgOutflow = totalOutflow / monthsWithData;

    // Trouver la dernière balance non-nulle
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
              <div className="text-xs text-gray-500 mb-1">Entrées moy.</div>
              <div className="text-sm font-medium text-emerald-600">
                {formatCurrency(stats.avgInflow)}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Sorties moy.</div>
              <div className="text-sm font-medium text-rose-600">
                {formatCurrency(stats.avgOutflow)}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Balance</div>
              <div
                className={`text-sm font-medium ${
                  stats.lastBalance >= 0 ? 'text-blue-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(stats.lastBalance)}
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
