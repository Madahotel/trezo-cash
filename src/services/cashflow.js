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

  const formatDayMonthYear = (date) => {
    return `${date.getDate()} ${getMonthShort(
      date.getMonth()
    )} ${date.getFullYear()}`;
  };

  // Si même mois et même année
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${startDate.getDate()}-${formatDayMonth(endDate)}`;
  }
  // Si même année mais mois différent
  else if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${formatDayMonth(startDate)}-${formatDayMonth(endDate)}`;
  }
  // Si années différentes
  else {
    return `${formatDayMonthYear(startDate)}-${formatDayMonthYear(endDate)}`;
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

  // Déterminer le premier lundi du mois
  let currentWeekStart = new Date(startOfMonth);

  // Si le 1er n'est pas un lundi, trouver le lundi précédent
  if (currentWeekStart.getDay() !== 1) {
    const daysToMonday =
      currentWeekStart.getDay() === 0 ? -6 : 1 - currentWeekStart.getDay();
    currentWeekStart.setDate(currentWeekStart.getDate() + daysToMonday);
  }

  let weekIndex = 0;

  // Parcourir les semaines jusqu'à couvrir tout le mois
  while (currentWeekStart <= endOfMonth && weekIndex < 6) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Ajouter 6 jours pour avoir dimanche

    // Ajuster la fin de la semaine si elle dépasse la fin du mois
    const weekEndInMonth = weekEnd > endOfMonth ? endOfMonth : weekEnd;

    // Cette semaine doit contenir au moins un jour du mois
    if (currentWeekStart <= endOfMonth) {
      const isPast = weekEndInMonth < currentDate;
      const isCurrent =
        currentDate >= currentWeekStart && currentDate <= weekEndInMonth;

      weeks.push({
        label: `S${weekIndex + 1}`, // S1, S2, S3... pour le mois
        weekNumberLabel: `S${getWeekNumber(currentWeekStart)}`, // Numéro ISO
        fullLabel: `Semaine ${weekIndex + 1} (${formatDateRange(
          currentWeekStart,
          weekEndInMonth
        )})`,
        weekStart: new Date(currentWeekStart),
        weekEnd: new Date(weekEndInMonth),
        weekNumber: getWeekNumber(currentWeekStart),
        weekIndex,
        isPastOrCurrent: isPast || isCurrent,
        isFuture: currentWeekStart > currentDate,
        month: month, // Stocker le mois pour référence
        year: year, // Stocker l'année pour référence
      });
    }

    // Passer à la semaine suivante
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
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
 * Obtient les options de mode de vue (AVEC VUE GLOBALE)
 */
export const getViewModeOptions = () => [
  { id: 'global', label: 'Vue Globale' },
  { id: 'year', label: 'Vue Annuelle' },
  { id: 'semester', label: 'Vue Semestrielle' },
  { id: 'quarter', label: 'Vue Trimestrielle' },
  { id: 'bimonth', label: 'Vue Bimensuelle' },
  { id: 'month', label: 'Vue Mensuelle' },
  { id: 'week', label: 'Vue Hebdomadaire' },
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
 * Obtient les options des semaines pour un mois donné
 */
export const getWeekOptions = (year, month) => {
  const weeks = getWeeksForMonth(year, month);
  return weeks.map((week, index) => ({
    id: index,
    label: week.label, // S1, S2, S3...
    fullLabel: week.fullLabel,
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
  }));
};

/**
 * Obtient les semaines pour l'année complète (pour la vue globale)
 */
export const getWeeksForYear = (year, currentDate = new Date()) => {
  const weeks = [];

  for (let month = 0; month < 12; month++) {
    const monthWeeks = getWeeksForMonth(year, month, currentDate);
    monthWeeks.forEach((week) => {
      weeks.push({
        ...week,
        monthIndex: month,
        year: year,
        label: `${getMonthShort(month)} ${week.label}`,
        fullLabel: `${getMonthFull(month)} ${week.fullLabel}`,
      });
    });
  }

  return weeks;
};

/**
 * Calcule les périodes selon le mode de vue - CORRIGÉ
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
  } else if (viewMode === 'month') {
    // Vue mensuelle - Afficher les semaines du mois (S1, S2, S3...)
    return getWeeksForMonth(selectedYear, selectedMonth, currentDate);
  } else if (viewMode === 'bimonth') {
    // Vue bimensuelle - Afficher les semaines des 2 mois
    const startMonth = selectedBimonth * 2;
    const endMonth = startMonth + 1;
    const bimonthPeriods = [];

    for (let i = startMonth; i <= endMonth && i < 12; i++) {
      const monthWeeks = getWeeksForMonth(selectedYear, i, currentDate);
      monthWeeks.forEach((week) => {
        const isPastOrCurrent =
          selectedYear < currentYear ||
          (selectedYear === currentYear && i < currentMonth) ||
          (selectedYear === currentYear &&
            i === currentMonth &&
            week.isPastOrCurrent);
        const isFuture =
          selectedYear > currentYear ||
          (selectedYear === currentYear && i > currentMonth) ||
          (selectedYear === currentYear && i === currentMonth && week.isFuture);

        bimonthPeriods.push({
          ...week,
          label: `${monthsShort[i]} ${week.label}`,
          fullLabel: `${monthsFull[i]} ${week.fullLabel}`,
          monthNumber: i + 1,
          monthIndex: i,
          isPastOrCurrent,
          isFuture,
        });
      });
    }
    return bimonthPeriods;
  } else if (viewMode === 'quarter') {
    // Vue trimestrielle - 4 trimestres (T1, T2, T3, T4)
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
        quarterIndex: i,
      });
    }
    return quarters;
  } else if (viewMode === 'semester') {
    // Vue semestrielle - 2 semestres (S1, S2)
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
        semesterIndex: i,
      });
    }
    return semesters;
  } else if (viewMode === 'year') {
    // Vue annuelle - 12 mois
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
  } else if (viewMode === 'global') {
    // Vue globale - 10 ans
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

  // Par défaut, retourner les mois
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
};

/**
 * Calcule les données du graphique pour toutes les vues - CORRIGÉ
 */
export const calculateChartData = (
  data,
  periods,
  selectedYear,
  selectedMonth,
  selectedBimonth,
  viewMode,
  currentYear = new Date().getFullYear(),
  currentMonth = new Date().getMonth(),
  currentDate = new Date()
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
      // Pour la vue hebdo, on gère différemment (dans le composant)
      if (
        date.getFullYear() === selectedYear &&
        date.getMonth() === selectedMonth
      ) {
        periodIndex = periods.findIndex((p) => {
          return date >= p.weekStart && date <= p.weekEnd;
        });
      }
    } else if (viewMode === 'month') {
      // Vue mensuelle - par semaine
      if (
        date.getFullYear() === selectedYear &&
        date.getMonth() === selectedMonth
      ) {
        periodIndex = periods.findIndex((p) => {
          return date >= p.weekStart && date <= p.weekEnd;
        });
      }
    } else if (viewMode === 'bimonth') {
      // Vue bimensuelle - par semaine
      if (date.getFullYear() === selectedYear) {
        const month = date.getMonth();
        const startMonth = selectedBimonth * 2;
        const endMonth = startMonth + 1;

        if (month >= startMonth && month <= endMonth) {
          periodIndex = periods.findIndex((p) => {
            return date >= p.weekStart && date <= p.weekEnd;
          });
        }
      }
    } else if (viewMode === 'quarter') {
      // Vue trimestrielle - par trimestre
      if (date.getFullYear() === selectedYear) {
        const month = date.getMonth();
        periodIndex = Math.floor(month / 3);
      }
    } else if (viewMode === 'semester') {
      // Vue semestrielle - par semestre
      if (date.getFullYear() === selectedYear) {
        const month = date.getMonth();
        periodIndex = Math.floor(month / 6);
      }
    } else if (viewMode === 'year') {
      // Vue annuelle - par mois
      if (date.getFullYear() === selectedYear) {
        periodIndex = date.getMonth();
      }
    } else if (viewMode === 'global') {
      // Vue globale - par année
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

  // Calculer les balances
  if (cumulativeBalances.length > 0) {
    // Pour chaque période, trouver la dernière balance cumulative
    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];

      // Déterminer la date de fin de la période
      let periodEndDate;
      if (period.weekEnd) {
        periodEndDate = period.weekEnd;
      } else if (viewMode === 'month' && period.monthIndex !== undefined) {
        periodEndDate = new Date(selectedYear, period.monthIndex + 1, 0);
      } else if (viewMode === 'bimonth' && period.monthIndex !== undefined) {
        periodEndDate = new Date(selectedYear, period.monthIndex + 1, 0);
      } else if (viewMode === 'quarter' && period.endMonth !== undefined) {
        periodEndDate = new Date(selectedYear, period.endMonth + 1, 0);
      } else if (viewMode === 'semester' && period.endMonth !== undefined) {
        periodEndDate = new Date(selectedYear, period.endMonth + 1, 0);
      } else if (viewMode === 'year' && period.monthIndex !== undefined) {
        periodEndDate = new Date(selectedYear, period.monthIndex + 1, 0);
      } else if (viewMode === 'global' && period.year !== undefined) {
        periodEndDate = new Date(period.year, 11, 31);
      } else {
        periodEndDate = currentDate;
      }

      // Chercher la dernière balance cumulative <= à la fin de la période
      let lastBalanceForPeriod = initialBalance;
      for (let j = cumulativeBalances.length - 1; j >= 0; j--) {
        if (cumulativeBalances[j].date <= periodEndDate) {
          lastBalanceForPeriod = cumulativeBalances[j].balance;
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

  // Pour les vues qui affichent des semaines, ajuster la balance de départ
  let startingBalance = initialBalance;
  if (
    ['week', 'month', 'bimonth'].includes(viewMode) &&
    cumulativeBalances.length > 0
  ) {
    // Trouver la date de début de la première période
    const firstPeriod = periods[0];
    if (firstPeriod && firstPeriod.weekStart) {
      const startOfFirstPeriod = firstPeriod.weekStart;
      let balanceAtStartOfPeriod = initialBalance;

      for (let i = 0; i < cumulativeBalances.length; i++) {
        if (cumulativeBalances[i].date < startOfFirstPeriod) {
          balanceAtStartOfPeriod = cumulativeBalances[i].balance;
        } else {
          break;
        }
      }

      startingBalance = balanceAtStartOfPeriod;
    }
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
 * Calcule les données du graphique pour la vue hebdomadaire (par jours)
 */
export const calculateWeeklyChartData = (
  data,
  periods,
  weekOptions,
  selectedWeek,
  startingBalance
) => {
  const labels = periods.map((p) => p.label);
  const inflows = Array(periods.length).fill(0);
  const outflows = Array(periods.length).fill(0);
  const balances = Array(periods.length).fill(0);

  // Si pas de données, retourner des données vides
  if (!data || !data.balanceMovements) {
    return {
      labels,
      inflows,
      outflows,
      balances,
      startingBalance: data?.initialBalance
        ? parseFloat(data.initialBalance)
        : 0,
    };
  }

  // Calculer les balances cumulatives depuis le début
  const { cumulativeBalances } = calculateCumulativeData(data);

  // Pour chaque mouvement, le répartir dans le jour approprié
  data.balanceMovements.forEach((movement) => {
    const date = new Date(movement.operation_date);
    const amount = parseFloat(movement.operation_amount) || 0;

    // Vérifier si la date est dans la semaine sélectionnée
    const selectedWeekOption = weekOptions[selectedWeek];
    if (
      selectedWeekOption &&
      date >= selectedWeekOption.weekStart &&
      date <= selectedWeekOption.weekEnd
    ) {
      // Trouver le jour de la semaine (0-6, où 0 = dimanche)
      let dayOfWeek = date.getDay();
      // Convertir en format Lundi=0, Mardi=1, etc.
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      if (dayOfWeek >= 0 && dayOfWeek < periods.length) {
        if (movement.movement_type_id === 1) {
          inflows[dayOfWeek] += amount;
        } else if (movement.movement_type_id === 2) {
          outflows[dayOfWeek] += amount;
        }
      }
    }
  });

  // Pour chaque jour, trouver la balance cumulative correspondante
  for (let i = 0; i < periods.length; i++) {
    const dayDate = periods[i].date;

    // Chercher la dernière balance cumulative qui est <= à la fin de la journée
    let lastBalanceForDay = startingBalance;
    const endOfDay = new Date(dayDate);
    endOfDay.setHours(23, 59, 59, 999);

    for (let j = cumulativeBalances.length - 1; j >= 0; j--) {
      const balanceData = cumulativeBalances[j];
      if (balanceData.date <= endOfDay) {
        lastBalanceForDay = balanceData.balance;
        break;
      }
    }

    balances[i] = Math.round(lastBalanceForDay);
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

/**
 * Obtient l'étiquette de période complète pour le header
 */
export const getFullPeriodLabel = (
  viewMode,
  selectedYear,
  selectedMonth,
  selectedBimonth,
  weekOptions,
  selectedWeek
) => {
  if (viewMode === 'week') {
    if (weekOptions && weekOptions.length > 0) {
      const weekOption = weekOptions[selectedWeek];
      if (weekOption) {
        return `Vue Hebdomadaire - ${weekOption.fullLabel}`;
      }
    }
    return `Vue Hebdomadaire - ${getMonthFull(selectedMonth)} ${selectedYear}`;
  } else if (viewMode === 'month') {
    return `Vue Mensuelle - ${getMonthFull(selectedMonth)} ${selectedYear}`;
  } else if (viewMode === 'bimonth') {
    return `Vue Bimensuelle - ${getBimonthFull(
      selectedBimonth
    )} ${selectedYear}`;
  } else if (viewMode === 'quarter') {
    return `Vue Trimestrielle - ${selectedYear}`;
  } else if (viewMode === 'semester') {
    return `Vue Semestrielle - ${selectedYear}`;
  } else if (viewMode === 'year') {
    return `Vue Annuelle - ${selectedYear}`;
  } else if (viewMode === 'global') {
    return `Vue Globale (${selectedYear - 5}-${selectedYear + 4})`;
  }
  return '';
};

/**
 * Détermine si une période est dans le passé
 */
export const isPeriodInPast = (period, currentDate = new Date()) => {
  if (period.weekEnd) {
    return period.weekEnd < currentDate;
  } else if (period.monthIndex !== undefined) {
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      period.monthIndex + 1,
      0
    );
    return endOfMonth < currentDate;
  } else if (period.year !== undefined) {
    const endOfYear = new Date(period.year, 11, 31);
    return endOfYear < currentDate;
  }
  return false;
};

/**
 * Détermine si une période est actuelle
 */
export const isPeriodCurrent = (period, currentDate = new Date()) => {
  if (period.weekStart && period.weekEnd) {
    return currentDate >= period.weekStart && currentDate <= period.weekEnd;
  } else if (period.monthIndex !== undefined) {
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      period.monthIndex,
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      period.monthIndex + 1,
      0
    );
    return currentDate >= startOfMonth && currentDate <= endOfMonth;
  } else if (period.year !== undefined) {
    const startOfYear = new Date(period.year, 0, 1);
    const endOfYear = new Date(period.year, 11, 31);
    return currentDate >= startOfYear && currentDate <= endOfYear;
  }
  return false;
};
