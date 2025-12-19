// cashflow.js - Fonctions utilitaires pour le composant CashflowView

/**
 * Formate un montant en devise MGA
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MGA',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Obtient le nom court du mois
 */
export const getMonthShort = (monthIndex) => {
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

/**
 * Obtient le nom complet du mois
 */
export const getMonthFull = (monthIndex) => {
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

/**
 * Obtient le nom complet de la période bimensuelle
 */
export const getBimonthFull = (bimonthIndex) => {
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

/**
 * Obtient le nom court de la période bimensuelle
 */
export const getBimonthShort = (bimonthIndex) => {
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

/**
 * Calcule le numéro de semaine ISO pour une date donnée
 */
export const getWeekNumber = (date) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

/**
 * Formate une plage de dates
 */
export const formatDateRange = (startDate, endDate) => {
  const formatDayMonth = (date) => {
    return `${date.getDate()} ${getMonthShort(date.getMonth())}`;
  };

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDate.getDate()}-${formatDayMonth(endDate)}`;
  } else {
    return `${formatDayMonth(startDate)}-${formatDayMonth(endDate)}`;
  }
};

/**
 * Obtient les semaines d'un mois spécifique
 */
export const getWeeksForMonth = (year, month, currentDate = new Date()) => {
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

/**
 * Calcule la balance cumulative depuis le début
 */
export const calculateCumulativeData = (data) => {
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

/**
 * Obtient les options de mode de vue
 */
export const getViewModeOptions = () => [
  { id: 'week', label: 'Vue Hebdomadaire' },
  { id: 'bimonth', label: 'Vue Bimensuelle' },
  { id: 'month', label: 'Vue Mensuelle' },
  { id: 'quarter', label: 'Vue Trimestrielle' },
  { id: 'semester', label: 'Vue Semestrielle' },
  { id: 'year', label: 'Vue Annuelle' },
];

/**
 * Obtient le libellé du mode de vue
 */
export const getViewModeLabel = (mode) => {
  const option = getViewModeOptions().find((opt) => opt.id === mode);
  return option ? option.label : 'Vue Mensuelle';
};

/**
 * Obtient les options des mois
 */
export const getMonthOptions = () => [
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

/**
 * Obtient les options des périodes bimensuelles
 */
export const getBimonthOptions = () => [
  { id: 0, label: 'Janvier-Février' },
  { id: 1, label: 'Mars-Avril' },
  { id: 2, label: 'Mai-Juin' },
  { id: 3, label: 'Juillet-Août' },
  { id: 4, label: 'Septembre-Octobre' },
  { id: 5, label: 'Novembre-Décembre' },
];

/**
 * Obtient les options des années (5 ans en arrière, année courante, 4 ans en avant)
 */
export const getYearOptions = (currentYear = new Date().getFullYear()) => {
  return Array.from({ length: 10 }, (_, i) => {
    const yearValue = currentYear - 5 + i;
    return { id: yearValue.toString(), label: yearValue.toString() };
  });
};

/**
 * Calcule les périodes selon le mode de vue
 */
export const calculatePeriods = (
  viewMode,
  selectedYear,
  selectedMonth,
  selectedBimonth,
  currentYear,
  currentMonth,
  currentDate = new Date()
) => {
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
    return getWeeksForMonth(selectedYear, selectedMonth, currentDate);
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
};

/**
 * Calcule les données du graphique
 */
export const calculateChartData = (
  data,
  periods,
  selectedYear,
  selectedMonth,
  selectedBimonth,
  viewMode,
  currentYear = new Date().getFullYear(),
  currentMonth = new Date().getMonth()
) => {
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
  const { cumulativeBalances, initialBalance } = calculateCumulativeData(data);

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
};

/**
 * Calcule les statistiques basées sur les données réelles
 */
export const calculateStats = (chartData, periods) => {
  const { inflows, outflows, balances } = chartData;

  // Calculer les moyennes uniquement sur les périodes avec données
  const periodsWithData =
    inflows.filter((val, idx) => val !== 0 || outflows[idx] !== 0).length ||
    periods.length;

  const totalInflow = inflows.reduce((a, b) => a + b, 0);
  const totalOutflow = outflows.reduce((a, b) => a + b, 0);

  // La balance totale est la dernière balance cumulative
  const totalBalance = balances.length > 0 ? balances[balances.length - 1] : 0;

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
};
