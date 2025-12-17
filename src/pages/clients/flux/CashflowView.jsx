import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '../../../components/context/actionsMethode';

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

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Fonction pour obtenir les semaines d'un mois spécifique
  const getWeeksForMonth = (year, month) => {
    const weeks = [];

    // Début et fin du mois
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    // Ajuster au lundi pour la première semaine
    let currentWeekStart = new Date(startOfMonth);
    const day = currentWeekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    currentWeekStart.setDate(currentWeekStart.getDate() + diff);

    // S'assurer qu'on commence au premier jour du mois au plus tôt
    if (currentWeekStart < startOfMonth) {
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    let weekNumber = getWeekNumber(currentWeekStart);
    let weekIndex = 0;

    while (currentWeekStart <= endOfMonth && weekIndex < 6) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Ajuster la fin de semaine à la fin du mois si nécessaire
      const weekEndInMonth = weekEnd > endOfMonth ? endOfMonth : weekEnd;

      const isPast = weekEndInMonth < currentDate;
      const isCurrent =
        currentDate >= currentWeekStart && currentDate <= weekEndInMonth;

      // Vérifier si cette semaine appartient bien au mois en cours
      if (
        weekEndInMonth.getMonth() === month ||
        currentWeekStart.getMonth() === month
      ) {
        weeks.push({
          label: `S${weekNumber}`,
          fullLabel: `Semaine ${weekNumber} (${formatDateRange(
            currentWeekStart,
            weekEndInMonth
          )})`,
          weekStart: new Date(currentWeekStart),
          weekEnd: new Date(weekEndInMonth),
          weekNumber,
          isPastOrCurrent: isPast || isCurrent,
          isFuture: currentWeekStart > currentDate,
        });
      }

      // Passer à la semaine suivante
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber = getWeekNumber(currentWeekStart);
      weekIndex++;
    }

    return weeks;
  };

  // Fonction pour obtenir le numéro de semaine
  const getWeekNumber = (date) => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  // Fonction pour formater une plage de dates
  const formatDateRange = (startDate, endDate) => {
    const formatDayMonth = (date) => {
      return `${date.getDate()} ${getMonthShort(date.getMonth())}`;
    };

    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.getDate()}-${formatDayMonth(endDate)}`;
    } else {
      return `${formatDayMonth(startDate)}-${formatDayMonth(endDate)}`;
    }
  };

  // Fonction pour obtenir le nom court du mois
  const getMonthShort = (monthIndex) => {
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
    return monthsShort[monthIndex];
  };

  // Fonction pour obtenir le nom complet du mois
  const getMonthFull = (monthIndex) => {
    const monthsFull = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];
    return monthsFull[monthIndex];
  };

  // Fonction pour obtenir le nom de la période bimensuelle
  const getBimonthFull = (bimonthIndex) => {
    const bimonthNames = [
      'Janvier-Février',
      'Mars-Avril',
      'Mai-Juin',
      'Juillet-Août',
      'Septembre-Octobre',
      'Novembre-Décembre',
    ];
    return bimonthNames[bimonthIndex];
  };

  // Fonction pour obtenir le nom court de la période bimensuelle
  const getBimonthShort = (bimonthIndex) => {
    const bimonthNames = [
      'Jan-Fév',
      'Mar-Avr',
      'Mai-Juin',
      'Juil-Août',
      'Sep-Oct',
      'Nov-Déc',
    ];
    return bimonthNames[bimonthIndex];
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

    const monthsFull = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];

    if (viewMode === 'week') {
      // Vue hebdomadaire - semaines du mois sélectionné
      return getWeeksForMonth(selectedYear, selectedMonth);
    } else if (viewMode === 'bimonth') {
      // Vue bimensuelle - afficher les 2 mois de la période sélectionnée
      const startMonth = selectedBimonth * 2;
      const endMonth = startMonth + 1;

      const bimonthPeriods = [];

      // Créer des périodes pour chaque mois de la période bimensuelle
      for (let i = startMonth; i <= endMonth && i < 12; i++) {
        const isPastOrCurrent =
          selectedYear < currentYear ||
          (selectedYear === currentYear && i <= currentMonth);
        const isFuture =
          selectedYear > currentYear ||
          (selectedYear === currentYear && i > currentMonth);

        bimonthPeriods.push({
          label: monthsShort[i],
          fullLabel: `${monthsFull[i]} ${selectedYear}`,
          monthNumber: i + 1,
          monthIndex: i,
          isPastOrCurrent,
          isFuture,
        });
      }
      return bimonthPeriods;
    } else if (viewMode === 'month') {
      // Vue mensuelle - 12 mois
      return monthsShort.map((month, index) => ({
        label: month,
        fullLabel: `${monthsFull[index]} ${selectedYear}`,
        monthNumber: index + 1,
        monthIndex: index,
        isPastOrCurrent:
          selectedYear < currentYear ||
          (selectedYear === currentYear && index <= currentMonth),
        isFuture:
          selectedYear > currentYear ||
          (selectedYear === currentYear && index > currentMonth),
      }));
    } else if (viewMode === 'quarter') {
      // Vue trimestrielle - 4 trimestres
      const quarters = [];
      const quarterLabels = ['T1', 'T2', 'T3', 'T4'];
      const quarterFullLabels = [
        '1er Trimestre',
        '2ème Trimestre',
        '3ème Trimestre',
        '4ème Trimestre',
      ];

      for (let i = 0; i < 4; i++) {
        const startMonth = i * 3;
        const endMonth = startMonth + 2;
        const isPastOrCurrent =
          selectedYear < currentYear ||
          (selectedYear === currentYear && endMonth <= currentMonth);
        const isFuture =
          selectedYear > currentYear ||
          (selectedYear === currentYear && startMonth > currentMonth);

        quarters.push({
          label: quarterLabels[i],
          fullLabel: `${quarterFullLabels[i]} ${selectedYear}`,
          startMonth,
          endMonth,
          isPastOrCurrent,
          isFuture,
        });
      }
      return quarters;
    } else if (viewMode === 'semester') {
      // Vue semestrielle - 2 semestres
      const semesters = [];
      const semesterLabels = ['S1', 'S2'];
      const semesterFullLabels = ['1er Semestre', '2ème Semestre'];

      for (let i = 0; i < 2; i++) {
        const startMonth = i * 6;
        const endMonth = startMonth + 5;
        const isPastOrCurrent =
          selectedYear < currentYear ||
          (selectedYear === currentYear && endMonth <= currentMonth);
        const isFuture =
          selectedYear > currentYear ||
          (selectedYear === currentYear && startMonth > currentMonth);

        semesters.push({
          label: semesterLabels[i],
          fullLabel: `${semesterFullLabels[i]} ${selectedYear}`,
          startMonth,
          endMonth,
          isPastOrCurrent,
          isFuture,
        });
      }
      return semesters;
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
  }, [
    selectedYear,
    selectedMonth,
    selectedBimonth,
    currentYear,
    currentMonth,
    currentDate,
    viewMode,
  ]);

  // Fonction pour calculer la balance cumulative depuis le début
  const calculateCumulativeData = () => {
    if (!data || !data.balanceMovements || data.balanceMovements.length === 0) {
      return {
        cumulativeBalances: [],
        allPeriodsData: [],
        initialBalance: data?.initialBalance
          ? parseFloat(data.initialBalance)
          : 0,
      };
    }

    // Trier tous les mouvements par date
    const sortedMovements = [...data.balanceMovements].sort(
      (a, b) => new Date(a.operation_date) - new Date(b.operation_date)
    );

    // Calculer les balances cumulatives pour chaque mouvement
    let cumulativeBalance = parseFloat(data.initialBalance) || 0;
    const cumulativeBalances = [];

    sortedMovements.forEach((movement) => {
      const date = new Date(movement.operation_date);
      const amount = parseFloat(movement.operation_amount) || 0;

      if (movement.movement_type_id === 1) {
        cumulativeBalance += amount;
      } else if (movement.movement_type_id === 2) {
        cumulativeBalance -= amount;
      }

      cumulativeBalances.push({
        date,
        balance: cumulativeBalance,
        movement,
      });
    });

    return {
      cumulativeBalances,
      initialBalance: parseFloat(data.initialBalance) || 0,
    };
  };

  // Traitement des données de l'API - logique simplifiée
  const chartData = useMemo(() => {
    const labels = periods.map((p) => p.label);

    // Si pas de données, retourner des données vides
    if (!data || !data.balanceMovements) {
      return {
        labels,
        inflows: Array(periods.length).fill(0),
        outflows: Array(periods.length).fill(0),
        balances: Array(periods.length).fill(0),
        startingBalance: data?.initialBalance
          ? parseFloat(data.initialBalance)
          : 0,
      };
    }

    // Calculer les données cumulatives depuis le début
    const { cumulativeBalances, initialBalance } = calculateCumulativeData();

    // Initialiser les tableaux
    const inflows = Array(periods.length).fill(0);
    const outflows = Array(periods.length).fill(0);
    const balances = Array(periods.length).fill(0);

    // Pour chaque mouvement, le répartir dans la période appropriée
    data.balanceMovements.forEach((movement) => {
      const date = new Date(movement.operation_date);
      const amount = parseFloat(movement.operation_amount) || 0;

      let periodIndex = -1;

      if (viewMode === 'week') {
        // Trouver l'index de la semaine (dans le mois sélectionné)
        if (
          date.getFullYear() === selectedYear &&
          date.getMonth() === selectedMonth
        ) {
          periodIndex = periods.findIndex((p) => {
            return date >= p.weekStart && date <= p.weekEnd;
          });
        }
      } else if (viewMode === 'bimonth') {
        // Pour le bimensuel, on a 2 mois à afficher
        if (date.getFullYear() === selectedYear) {
          const month = date.getMonth();
          const startMonth = selectedBimonth * 2;
          const endMonth = startMonth + 1;

          if (month >= startMonth && month <= endMonth) {
            periodIndex = month - startMonth; // 0 pour premier mois, 1 pour deuxième mois
          }
        }
      } else if (viewMode === 'month') {
        if (date.getFullYear() === selectedYear) {
          periodIndex = date.getMonth();
        }
      } else if (viewMode === 'quarter') {
        if (date.getFullYear() === selectedYear) {
          const month = date.getMonth();
          periodIndex = Math.floor(month / 3);
        }
      } else if (viewMode === 'semester') {
        if (date.getFullYear() === selectedYear) {
          const month = date.getMonth();
          periodIndex = Math.floor(month / 6);
        }
      } else if (viewMode === 'year') {
        periodIndex = periods.findIndex((p) => p.year === date.getFullYear());
      }

      if (
        periodIndex !== -1 &&
        periodIndex >= 0 &&
        periodIndex < periods.length
      ) {
        if (movement.movement_type_id === 1) {
          inflows[periodIndex] += amount;
        } else if (movement.movement_type_id === 2) {
          outflows[periodIndex] += amount;
        }
      }
    });

    // Maintenant, calculer les balances pour chaque période
    // Pour chaque période, trouver la dernière balance cumulative correspondante
    if (cumulativeBalances.length > 0) {
      // Trier les périodes par date de début pour faciliter le calcul
      const sortedPeriods = periods.map((period, index) => ({
        ...period,
        index,
        startDate:
          viewMode === 'week'
            ? period.weekStart
            : viewMode === 'month'
            ? new Date(selectedYear, period.monthIndex, 1)
            : viewMode === 'bimonth'
            ? new Date(selectedYear, period.monthIndex, 1)
            : viewMode === 'quarter'
            ? new Date(selectedYear, period.startMonth, 1)
            : viewMode === 'semester'
            ? new Date(selectedYear, period.startMonth, 1)
            : new Date(period.year, 0, 1),
        endDate:
          viewMode === 'week'
            ? period.weekEnd
            : viewMode === 'month'
            ? new Date(selectedYear, period.monthIndex + 1, 0)
            : viewMode === 'bimonth'
            ? new Date(selectedYear, period.monthIndex + 1, 0)
            : viewMode === 'quarter'
            ? new Date(selectedYear, period.endMonth + 1, 0)
            : viewMode === 'semester'
            ? new Date(selectedYear, period.endMonth + 1, 0)
            : new Date(period.year, 11, 31),
      }));

      // Pour chaque période, trouver la dernière balance cumulative avant ou à la fin de la période
      for (let i = 0; i < sortedPeriods.length; i++) {
        const period = sortedPeriods[i];

        // Chercher la dernière balance cumulative qui est <= à la date de fin de la période
        let lastBalanceForPeriod = initialBalance;

        for (let j = cumulativeBalances.length - 1; j >= 0; j--) {
          const balanceData = cumulativeBalances[j];
          if (balanceData.date <= period.endDate) {
            lastBalanceForPeriod = balanceData.balance;
            break;
          }
        }

        balances[i] = Math.round(lastBalanceForPeriod);
      }
    } else {
      // Si pas de balances cumulatives, calculer simplement
      let cumulativeBalance = initialBalance;
      for (let i = 0; i < periods.length; i++) {
        const balanceChange = inflows[i] - outflows[i];
        cumulativeBalance += balanceChange;
        balances[i] = Math.round(cumulativeBalance);
      }
    }

    // Pour la vue bimensuelle, ajuster la balance de départ pour qu'elle soit correcte
    let startingBalance = initialBalance;

    if (viewMode === 'bimonth' && cumulativeBalances.length > 0) {
      // Trouver la balance au début de la période bimensuelle
      const startMonth = selectedBimonth * 2;
      const startOfPeriod = new Date(selectedYear, startMonth, 1);
      let balanceAtStartOfPeriod = initialBalance;

      for (let i = 0; i < cumulativeBalances.length; i++) {
        if (cumulativeBalances[i].date < startOfPeriod) {
          balanceAtStartOfPeriod = cumulativeBalances[i].balance;
        } else {
          break;
        }
      }

      startingBalance = balanceAtStartOfPeriod;
    }

    return {
      labels,
      inflows: inflows.map((value) => Math.round(value)),
      outflows: outflows.map((value) => Math.round(value)),
      balances,
      startingBalance,
    };
  }, [data, periods, selectedYear, selectedMonth, selectedBimonth, viewMode]);

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
          // Si l'année sélectionnée est dans le passé, dernière période
          todayIndex = periods.length - 1;
        }
      } else if (selectedYear < currentYear) {
        // Si l'année sélectionnée est dans le passé, dernière période
        todayIndex = periods.length - 1;
      } else {
        // Si l'année sélectionnée est dans le futur, pas de période courante
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

    // Créer les séries pour la balance cumulative avec style différent selon la période
    const balanceSeries = {
      name: 'Balance',
      type: 'line',
      data: balances,
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

          // Afficher la balance de départ pour la première période
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
            // Exclure la série de balance de départ du tooltip
            if (p.seriesName === 'Balance de départ') return;

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

  // Options d'années (5 ans en arrière, année courante, 4 ans en avant)
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const yearValue = new Date().getFullYear() - 5 + i;
    return { id: yearValue.toString(), label: yearValue.toString() };
  });

  // Options pour les mois
  const monthOptions = [
    { id: 0, label: 'Janvier' },
    { id: 1, label: 'Février' },
    { id: 2, label: 'Mars' },
    { id: 3, label: 'Avril' },
    { id: 4, label: 'Mai' },
    { id: 5, label: 'Juin' },
    { id: 6, label: 'Juillet' },
    { id: 7, label: 'Août' },
    { id: 8, label: 'Septembre' },
    { id: 9, label: 'Octobre' },
    { id: 10, label: 'Novembre' },
    { id: 11, label: 'Décembre' },
  ];

  // Options pour les périodes bimensuelles
  const bimonthOptions = [
    { id: 0, label: 'Janvier-Février' },
    { id: 1, label: 'Mars-Avril' },
    { id: 2, label: 'Mai-Juin' },
    { id: 3, label: 'Juillet-Août' },
    { id: 4, label: 'Septembre-Octobre' },
    { id: 5, label: 'Novembre-Décembre' },
  ];

  // Options pour la vue avec les nouvelles options
  const viewModeOptions = [
    { id: 'week', label: 'Vue Hebdomadaire' },
    { id: 'bimonth', label: 'Vue Bimensuelle' },
    { id: 'month', label: 'Vue Mensuelle' },
    { id: 'quarter', label: 'Vue Trimestrielle' },
    { id: 'semester', label: 'Vue Semestrielle' },
    { id: 'year', label: 'Vue Annuelle' },
  ];

  const getViewModeLabel = (mode) => {
    const option = viewModeOptions.find((opt) => opt.id === mode);
    return option ? option.label : 'Vue Mensuelle';
  };

  // Calcul des statistiques basées sur les données réelles
  const stats = useMemo(() => {
    const { inflows, outflows, balances } = chartData;

    // Calculer les moyennes uniquement sur les périodes avec données
    const periodsWithData =
      inflows.filter((val, idx) => val !== 0 || outflows[idx] !== 0).length ||
      periods.length;

    const totalInflow = inflows.reduce((a, b) => a + b, 0);
    const totalOutflow = outflows.reduce((a, b) => a + b, 0);

    // La balance totale est la dernière balance cumulative
    const totalBalance =
      balances.length > 0 ? balances[balances.length - 1] : 0;

    const avgInflow = totalInflow / periodsWithData;
    const avgOutflow = totalOutflow / periodsWithData;

    // Trouver la dernière balance non-nulle
    let lastBalance = 0;
    for (let i = balances.length - 1; i >= 0; i--) {
      if (inflows[i] !== 0 || outflows[i] !== 0 || i === 0) {
        lastBalance = balances[i];
        break;
      }
    }

    return {
      avgInflow: Math.round(avgInflow),
      avgOutflow: Math.round(avgOutflow),
      lastBalance,
      totalInflow,
      totalOutflow,
      totalBalance,
    };
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
