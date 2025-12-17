// Fonction pour formater les labels de l'axe X en responsive
export const formatXAxisLabels = (
  value,
  index,
  isMobile = false,
  maxValue = 0,
  settings = {}
) => {
  if (!isMobile) {
    // En desktop, afficher toutes les valeurs normalement
    return formatCurrency(value, settings);
  }

  // En mobile, n'afficher que 0 et la valeur max
  if (value === 0 || Math.abs(value - maxValue) < 0.01) {
    return formatCurrency(value, settings);
  }

  // Pour les autres valeurs, retourner chaîne vide
  return '';
};

// Fonctions utilitaires
export const formatCurrency = (amount, settings) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: settings?.currency || 'EUR',
  }).format(amount || 0);
};

// Fonction pour générer les transactions récurrentes à partir des budgets
export const transformBudgetDataWithDates = (
  budgetData,
  currentPeriod = null
) => {
  const transactions = [];

  // Calculer la plage de dates pour la période actuelle
  const periodRange = currentPeriod
    ? calculateDateRange(null, null, currentPeriod)
    : null;

  budgetData.forEach((budget) => {
    const frequencyId = budget.frequency_id;
    const type = budget.category_type_id == 2 ? 'receivable' : 'payable';

    // Générer les dates selon la fréquence et la période
    const dates = generateDatesByFrequency(
      frequencyId,
      budget.start_date,
      budget.end_date,
      currentPeriod
    );

    dates.forEach((date, occurrenceIndex) => {
      const dateKey = date.toISOString().split('T')[0];

      const uniqueId = `budget-${budget.budget_id}-${dateKey}-${occurrenceIndex}`;

      // Créer le nom du tiers
      const thirdPartyName = budget.third_party_firstname
        ? `${budget.third_party_name} ${budget.third_party_firstname}`
        : budget.third_party_name;

      transactions.push({
        id: uniqueId,
        thirdParty: thirdPartyName || budget.category_name,
        thirdPartyId: budget.user_third_party_id,
        amount: parseFloat(budget.budget_amount || 0),
        type: type,
        category: budget.category_name,
        subCategory: budget.sub_category_name,
        date: dateKey,
        yearMonth: dateKey.substring(0, 7), // YYYY-MM pour le regroupement par mois
        budget_id: budget.budget_id,
        start_date: budget.start_date,
        end_date: budget.end_date,
        frequency_id: frequencyId,
        frequency_name: budget.frequency_name,
        budget_type_id: budget.budget_type_id,
        budget_type_name: budget.budget_type_name,
        category_type_id: budget.category_type_id,
        category_type_name: budget.category_type_name,
        entity_status_id: budget.entity_status_id,
        is_duration_indefinite: budget.is_duration_indefinite,
        due_date: dateKey,
        occurrence_index: occurrenceIndex,
        project_id: budget.project_id,
        project_name: budget.project_name,
      });
    });
  });

  return transactions;
};

export const generateDatesByFrequency = (
  frequencyId,
  startDate,
  endDate = null,
  currentPeriod = null
) => {
  const dates = [];

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const datePart = dateStr.split(' ')[0];
    const [year, month, day] = datePart
      .split('-')
      .map((num) => parseInt(num, 10));
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  };

  const start = parseDate(startDate);
  if (!start || isNaN(start.getTime())) {
    return dates;
  }

  // Calculer la période d'analyse
  let periodStart, periodEnd;
  if (currentPeriod) {
    const dateRange = calculateDateRange(null, null, currentPeriod);
    periodStart = dateRange.rangeStart;
    periodEnd = dateRange.rangeEnd;
  } else {
    const now = new Date();
    periodStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
    periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999)
    );
  }

  // S'assurer que ce sont des dates UTC
  periodStart = new Date(
    Date.UTC(
      periodStart.getUTCFullYear(),
      periodStart.getUTCMonth(),
      periodStart.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

  periodEnd = new Date(
    Date.UTC(
      periodEnd.getUTCFullYear(),
      periodEnd.getUTCMonth(),
      periodEnd.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );

  // Cas des fréquences ponctuelles
  if (frequencyId === 1 || frequencyId === 9) {
    if (start >= periodStart && start <= periodEnd) {
      dates.push(new Date(start));
    }
    return dates;
  }

  // Fonction utilitaire pour ajouter des mois en gérant les jours limites
  const addMonthsUTC = (date, months) => {
    const result = new Date(date);
    const dayOfMonth = result.getUTCDate();
    result.setUTCMonth(result.getUTCMonth() + months);

    // Ajustement pour les cas où le jour n'existe pas dans le nouveau mois
    const expectedDay = result.getUTCDate();
    if (expectedDay !== dayOfMonth) {
      // On revient au dernier jour du mois précédent
      result.setUTCDate(0);
    }

    return result;
  };

  // Fonction pour trouver la prochaine occurrence à partir d'une date de référence
  const getNextOccurrence = (refDate, firstOccurrenceDate) => {
    const dayOfMonth = firstOccurrenceDate.getUTCDate();
    let nextDate = new Date(refDate);

    // Déterminer l'intervalle en mois selon la fréquence
    let monthIncrement = 0;
    let weekIncrement = 0;

    switch (frequencyId) {
      case 2: // Quotidienne
        return new Date(refDate.setUTCDate(refDate.getUTCDate() + 1));
      case 3: // Mensuelle
        monthIncrement = 1;
        break;
      case 4: // Hebdomadaire
        weekIncrement = 7;
        break;
      case 5: // Bimestrielle
        monthIncrement = 2;
        break;
      case 6: // Trimestrielle
        monthIncrement = 3;
        break;
      case 7: // Semestrielle
        monthIncrement = 6;
        break;
      case 8: // Annuelle
        monthIncrement = 12;
        break;
      default:
        return refDate;
    }

    if (weekIncrement > 0) {
      // Pour hebdomadaire
      nextDate.setUTCDate(nextDate.getUTCDate() + weekIncrement);
      return nextDate;
    } else {
      // Pour les fréquences mensuelles et supérieures
      nextDate = addMonthsUTC(refDate, monthIncrement);

      // S'assurer qu'on garde le même jour du mois (avec ajustement si nécessaire)
      const tempDate = new Date(nextDate);
      tempDate.setUTCDate(dayOfMonth);

      // Si le jour n'existe pas dans ce mois, on prend le dernier jour
      if (tempDate.getUTCMonth() !== nextDate.getUTCMonth()) {
        tempDate.setUTCDate(0); // Dernier jour du mois précédent
      }

      return tempDate;
    }
  };

  // Déterminer la première occurrence dans la période
  let currentDate = new Date(start);

  // Si start_date est avant la période, trouver la première occurrence dans la période
  if (currentDate < periodStart) {
    // Pour les fréquences quotidiennes
    if (frequencyId === 2) {
      currentDate = new Date(periodStart);
    }
    // Pour les fréquences hebdomadaires
    else if (frequencyId === 4) {
      const daysDiff = Math.ceil(
        (periodStart - currentDate) / (1000 * 60 * 60 * 24)
      );
      const weeksDiff = Math.ceil(daysDiff / 7);
      currentDate.setUTCDate(currentDate.getUTCDate() + weeksDiff * 7);
    }
    // Pour les fréquences mensuelles et supérieures
    else if (frequencyId >= 3 && frequencyId <= 8) {
      // Trouver combien d'occurrences sont passées depuis start_date jusqu'à periodStart
      let tempDate = new Date(start);
      let iterations = 0;
      const maxIterations = 1000;

      while (tempDate < periodStart && iterations < maxIterations) {
        tempDate = getNextOccurrence(tempDate, start);
        iterations++;

        // Si on dépasse periodStart, on a trouvé la première occurrence dans la période
        if (tempDate >= periodStart) {
          currentDate = tempDate;
          break;
        }
      }

      // Si on n'a pas trouvé, prendre periodStart ajusté au jour du mois
      if (currentDate < periodStart) {
        currentDate = new Date(periodStart);
        const dayOfMonth = start.getUTCDate();
        currentDate.setUTCDate(dayOfMonth);

        // Si le jour n'existe pas dans ce mois, prendre le dernier jour
        if (
          currentDate < periodStart ||
          currentDate.getUTCMonth() !== periodStart.getUTCMonth()
        ) {
          currentDate = new Date(
            periodStart.getUTCFullYear(),
            periodStart.getUTCMonth() + 1,
            0
          );
        }
      }
    }
  }

  // S'assurer que currentDate est dans la période
  if (currentDate < periodStart) {
    currentDate = new Date(periodStart);
  }

  // Déterminer la date de fin
  let generationEnd = new Date(periodEnd);
  if (endDate) {
    const end = parseDate(endDate);
    if (end && !isNaN(end.getTime()) && end < periodEnd) {
      generationEnd = end;
    }
  }

  // Générer les occurrences
  let iteration = 0;
  const maxIterations = 10000;

  while (currentDate <= generationEnd && iteration < maxIterations) {
    // Vérifier que la date est dans la plage
    if (currentDate >= periodStart && currentDate <= generationEnd) {
      dates.push(new Date(currentDate));
    }

    // Passer à la prochaine occurrence
    currentDate = getNextOccurrence(currentDate, start);
    iteration++;
  }

  return dates;
};

// Gestion des périodes
export const getInitialPeriod = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return {
    type: 'month',
    year: currentYear,
    month: currentMonth,
    quarter: Math.floor(currentMonth / 3) + 1,
    semester: Math.floor(currentMonth / 6) + 1,
    bimester: Math.floor(currentMonth / 2) + 1,
  };
};

export const handlePeriodChange = (currentPeriod, direction) => {
  const prev = currentPeriod;

  switch (prev.type) {
    case 'month':
      let newMonth = prev.month + direction;
      let newYear = prev.year;

      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }

      return {
        ...prev,
        year: newYear,
        month: newMonth,
        quarter: Math.floor(newMonth / 3) + 1,
        semester: Math.floor(newMonth / 6) + 1,
        bimester: Math.floor(newMonth / 2) + 1,
      };

    case 'bimester':
      let newBimester = prev.bimester + direction;
      let newYearB = prev.year;

      if (newBimester < 1) {
        newBimester = 6; // 6 bimester par an
        newYearB--;
      } else if (newBimester > 6) {
        newBimester = 1;
        newYearB++;
      }

      // Calculer le mois correspondant (bimester 1 = mois 0-1, bimester 2 = mois 2-3, etc.)
      const newMonthB = (newBimester - 1) * 2;

      return {
        ...prev,
        type: 'bimester',
        year: newYearB,
        bimester: newBimester,
        month: newMonthB,
        quarter: Math.floor(newMonthB / 3) + 1,
        semester: Math.floor(newMonthB / 6) + 1,
      };

    case 'quarter':
      let newQuarter = prev.quarter + direction;
      let newYearQ = prev.year;

      if (newQuarter < 1) {
        newQuarter = 4;
        newYearQ--;
      } else if (newQuarter > 4) {
        newQuarter = 1;
        newYearQ++;
      }

      // Calculer le mois correspondant (trimestre 1 = mois 0-2, trimestre 2 = mois 3-5, etc.)
      const newMonthQ = (newQuarter - 1) * 3;

      return {
        ...prev,
        type: 'quarter',
        year: newYearQ,
        quarter: newQuarter,
        month: newMonthQ,
        semester: Math.floor(newMonthQ / 6) + 1,
        bimester: Math.floor(newMonthQ / 2) + 1,
      };

    case 'semester':
      let newSemester = prev.semester + direction;
      let newYearS = prev.year;

      if (newSemester < 1) {
        newSemester = 2;
        newYearS--;
      } else if (newSemester > 2) {
        newSemester = 1;
        newYearS++;
      }

      // Calculer le mois correspondant (semestre 1 = mois 0-5, semestre 2 = mois 6-11)
      const newMonthS = (newSemester - 1) * 6;

      return {
        ...prev,
        type: 'semester',
        year: newYearS,
        semester: newSemester,
        month: newMonthS,
        quarter: Math.floor(newMonthS / 3) + 1,
        bimester: Math.floor(newMonthS / 2) + 1,
      };

    case 'year':
      return {
        ...prev,
        year: prev.year + direction,
        month: 0,
        quarter: 1,
        semester: 1,
        bimester: 1,
      };

    default:
      // Type 'month' par défaut
      let newMonthDefault = prev.month + direction;
      let newYearDefault = prev.year;

      if (newMonthDefault < 0) {
        newMonthDefault = 11;
        newYearDefault--;
      } else if (newMonthDefault > 11) {
        newMonthDefault = 0;
        newYearDefault++;
      }

      return {
        ...prev,
        year: newYearDefault,
        month: newMonthDefault,
        quarter: Math.floor(newMonthDefault / 3) + 1,
        semester: Math.floor(newMonthDefault / 6) + 1,
        bimester: Math.floor(newMonthDefault / 2) + 1,
      };
  }
};

export const handleQuickPeriodSelect = (periodType) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return {
    type: periodType,
    year: currentYear,
    month: currentMonth,
    quarter: Math.floor(currentMonth / 3) + 1,
    semester: Math.floor(currentMonth / 6) + 1,
    bimester: Math.floor(currentMonth / 2) + 1,
  };
};

// Calcul de la plage de dates
export const calculateDateRange = (
  rangeStartProp,
  rangeEndProp,
  currentPeriod
) => {
  // Si les dates sont fournies en props, on les utilise
  if (rangeStartProp && rangeEndProp) {
    const start = new Date(rangeStartProp);
    const end = new Date(rangeEndProp);

    let periodName = '';
    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      // C'est un mois
      periodName = start.toLocaleString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
    } else {
      // Période personnalisée
      const startStr = start.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const endStr = end.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      periodName = `${startStr} - ${endStr}`;
    }

    return {
      rangeStart: start,
      rangeEnd: end,
      analysisPeriodName: periodName,
    };
  }

  // Sinon, calculer selon le type de période
  let startDate, endDate, periodName;
  const { type, year, month, quarter, semester, bimester } = currentPeriod;

  // **CORRECTION : Utiliser UTC pour éviter les problèmes de fuseau horaire**
  switch (type) {
    case 'month':
      // Mois : du 1er au dernier jour du mois EN UTC
      startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)); // 1er jour du mois à 00:00:00 UTC
      endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)); // Dernier jour du mois à 23:59:59.999 UTC

      // Pour le nom de la période, utiliser la date locale
      const localStart = new Date(year, month, 1);
      periodName = localStart.toLocaleString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
      break;

    case 'bimester':
      // Bimestre : du 1er jour du premier mois au dernier jour du deuxième mois EN UTC
      const bimStartMonth = (bimester - 1) * 2;
      startDate = new Date(Date.UTC(year, bimStartMonth, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, bimStartMonth + 2, 0, 23, 59, 59, 999));

      // Pour le nom
      const localBimStart = new Date(year, bimStartMonth, 1);
      const bimMonth1 = localBimStart.toLocaleString('fr-FR', {
        month: 'short',
      });
      const bimMonth2 = new Date(year, bimStartMonth + 1, 1).toLocaleString(
        'fr-FR',
        { month: 'short' }
      );
      periodName = `Bimestre ${bimester} (${bimMonth1}-${bimMonth2}) ${year}`;
      break;

    case 'quarter':
      // Trimestre : du 1er jour du premier mois au dernier jour du troisième mois EN UTC
      const qStartMonth = (quarter - 1) * 3;
      startDate = new Date(Date.UTC(year, qStartMonth, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, qStartMonth + 3, 0, 23, 59, 59, 999));
      periodName = `Trimestre ${quarter} ${year}`;
      break;

    case 'semester':
      // Semestre : du 1er jour du premier mois au dernier jour du sixième mois EN UTC
      const sStartMonth = (semester - 1) * 6;
      startDate = new Date(Date.UTC(year, sStartMonth, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, sStartMonth + 6, 0, 23, 59, 59, 999));
      periodName = `Semestre ${semester} ${year}`;
      break;

    case 'year':
      // Année : du 1er janvier au 31 décembre EN UTC
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      periodName = `Année ${year}`;
      break;

    default: // 'month'
      startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      const defaultLocalStart = new Date(year, month, 1);
      periodName = defaultLocalStart.toLocaleString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
  }

  return {
    rangeStart: startDate,
    rangeEnd: endDate,
    analysisPeriodName: periodName,
  };
};
// Transformation des données API
export const transformApiData = (
  apiData,
  defaultSettings,
  currentPeriod = null
) => {
  if (!apiData) return null;

  const { budgets, collections } = apiData;

  // Générer les transactions récurrentes à partir des budgets
  const budgetTransactions = transformBudgetDataWithDates(
    budgets,
    currentPeriod
  );

  // Extraire les catégories uniques
  const categories = {
    expense: [],
    revenue: [],
  };

  // Extraire les tiers uniques
  const tiers = {
    expense: [],
    revenue: [],
  };

  // Organiser par catégorie (Dépense ou Revenue) et par tiers
  budgets.forEach((budget) => {
    const isExpense = budget.category_type_id === 1;
    const categoryList = isExpense ? categories.expense : categories.revenue;
    const tierList = isExpense ? tiers.expense : tiers.revenue;

    // Créer le nom du tiers
    const thirdPartyName = budget.third_party_firstname
      ? `${budget.third_party_name} ${budget.third_party_firstname}`
      : budget.third_party_name;

    // Trouver ou créer la catégorie principale
    let mainCategory = categoryList.find(
      (cat) => cat.name === budget.category_name
    );

    if (!mainCategory) {
      mainCategory = {
        name: budget.category_name,
        subCategories: [],
      };
      categoryList.push(mainCategory);
    }

    // Ajouter la sous-catégorie si elle n'existe pas
    const subCategoryExists = mainCategory.subCategories.some(
      (sub) => sub.name === budget.sub_category_name
    );

    if (!subCategoryExists && budget.sub_category_name) {
      mainCategory.subCategories.push({
        name: budget.sub_category_name,
      });
    }

    // Trouver ou créer le tiers
    let tier = tierList.find(
      (t) => t.name === thirdPartyName || t.id === budget.user_third_party_id
    );

    if (!tier && thirdPartyName) {
      tier = {
        id: budget.user_third_party_id,
        name: thirdPartyName,
        email: budget.third_party_email,
      };
      tierList.push(tier);
    }
  });

  // Transformer les collections en actuals (paiements réels)
  const actualsMap = {};

  // Les collections sont un tableau de tableaux, on les aplatie
  const flatCollections = collections.flat();

  flatCollections.forEach((collection) => {
    const relatedBudget = budgets.find(
      (b) => b.budget_id === collection.budget_id
    );

    if (relatedBudget) {
      const projectId = relatedBudget.project_id;
      if (!actualsMap[projectId]) {
        actualsMap[projectId] = [];
      }

      // Déterminer le type basé sur category_type_id
      const type =
        relatedBudget.category_type_id === 2 ? 'receivable' : 'payable';

      // Créer le nom du tiers
      const thirdPartyName = relatedBudget.third_party_firstname
        ? `${relatedBudget.third_party_name} ${relatedBudget.third_party_firstname}`
        : relatedBudget.third_party_name;

      actualsMap[projectId].push({
        id: collection.id,
        type: type,
        category: relatedBudget.category_name,
        subCategory: relatedBudget.sub_category_name,
        thirdParty: thirdPartyName || relatedBudget.category_name,
        thirdPartyId: relatedBudget.user_third_party_id,
        amount: parseFloat(collection.collection_amount || 0),
        payments: [
          {
            paymentDate: collection.collection_date,
            paidAmount: parseFloat(collection.collection_amount || 0),
          },
        ],
        budgetId: collection.budget_id,
        projectId: projectId,
        budget_type_id: relatedBudget.budget_type_id,
        category_type_id: relatedBudget.category_type_id,
        yearMonth: collection.collection_date.substring(0, 7), // YYYY-MM
      });
    }
  });

  // Organiser les transactions par projet
  const entriesMap = {};
  const projectsMap = {};

  budgets.forEach((budget) => {
    const projectId = budget.project_id;

    if (!projectsMap[projectId]) {
      projectsMap[projectId] = {
        id: projectId,
        name: budget.project_name,
        isArchived: budget.entity_status_name !== 'active',
      };
    }
  });

  // Regrouper les transactions par projet
  budgetTransactions.forEach((transaction) => {
    const projectId = transaction.project_id;
    if (!entriesMap[projectId]) {
      entriesMap[projectId] = [];
    }

    entriesMap[projectId].push({
      ...transaction,
      supplier: transaction.thirdParty,
    });
  });

  return {
    projects: Object.values(projectsMap),
    categories,
    tiers,
    allEntries: entriesMap,
    allActuals: actualsMap,
    settings: defaultSettings,
    consolidatedViews: [],
    budgetTransactions, // Ajout des transactions générées
  };
};

// Filtrage des données par projet et période
export const filterProjectData = ({
  budgetTransactions,
  allActuals,
  consolidatedViews,
  activeProjectId,
  analysisType,
  rangeStart,
  rangeEnd,
  isConsolidated,
  isCustomConsolidated,
}) => {
  // Filtrer les entrées du projet (transactions générées à partir des budgets) pour la période
  const projectEntries = (() => {
    if (!budgetTransactions || budgetTransactions.length === 0) return [];

    let relevant;
    if (isConsolidated) {
      relevant = budgetTransactions;
    } else if (isCustomConsolidated) {
      const viewId = activeProjectId.replace('consolidated_view_', '');
      const view = consolidatedViews.find((v) => v.id === viewId);
      if (!view || !view.project_ids) return [];
      // Filtrer par projets de la vue consolidée
      relevant = budgetTransactions.filter((transaction) =>
        view.project_ids.includes(transaction.project_id.toString())
      );
    } else {
      // Filtrer par projet actif
      relevant = budgetTransactions.filter(
        (transaction) => transaction.project_id.toString() === activeProjectId
      );
    }

    // Filtrer par type d'analyse et période
    return relevant.filter((transaction) => {
      // Vérifier le type
      const isCorrectType =
        analysisType === 'expense'
          ? transaction.type === 'payable'
          : transaction.type === 'receivable';

      if (!isCorrectType) return false;

      // Vérifier si la transaction est dans la période
      const transactionDate = new Date(transaction.date);
      return transactionDate >= rangeStart && transactionDate <= rangeEnd;
    });
  })();

  // Filtrer les actuals du projet (collections = paiements réels) pour la période
  const projectActuals = (() => {
    if (!rangeStart || !rangeEnd) return [];

    let relevant;
    if (isConsolidated) {
      relevant = Object.values(allActuals).flat();
    } else if (isCustomConsolidated) {
      const viewId = activeProjectId.replace('consolidated_view_', '');
      const view = consolidatedViews.find((v) => v.id === viewId);
      if (!view || !view.project_ids) return [];
      relevant = view.project_ids.flatMap(
        (projectId) => allActuals[projectId] || []
      );
    } else {
      relevant = allActuals[activeProjectId] || [];
    }

    // Filtrer par type et période
    return relevant.filter((actual) => {
      // Vérifier le type selon l'analyse
      const isCorrectType =
        analysisType === 'expense'
          ? actual.type === 'payable'
          : actual.type === 'receivable';

      if (!isCorrectType) return false;

      // Vérifier si au moins un paiement est dans la période
      return (actual.payments || []).some((p) => {
        const paymentDate = new Date(p.paymentDate);
        return paymentDate >= rangeStart && paymentDate <= rangeEnd;
      });
    });
  })();

  return { projectEntries, projectActuals };
};

// Calcul des totaux par catégorie
export const calculateBudgetByCategory = (
  transactions,
  rangeStart,
  rangeEnd
) => {
  const categoryTotals = {};

  transactions.forEach((transaction) => {
    const category = transaction.category;
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }
    categoryTotals[category] += parseFloat(transaction.amount || 0);
  });

  return categoryTotals;
};

export const calculateActualByCategory = (actuals, rangeStart, rangeEnd) => {
  const categoryTotals = {};

  actuals.forEach((actual) => {
    const category = actual.category;
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }

    // Somme des paiements pour cette période
    const periodTotal = (actual.payments || []).reduce((sum, payment) => {
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate >= rangeStart && paymentDate <= rangeEnd) {
        return sum + parseFloat(payment.paidAmount || 0);
      }
      return sum;
    }, 0);

    categoryTotals[category] += periodTotal;
  });

  return categoryTotals;
};

// Calcul des totaux par tiers
export const calculateBudgetByTier = (transactions, rangeStart, rangeEnd) => {
  const tierTotals = {};

  transactions.forEach((transaction) => {
    const tierName = transaction.thirdParty || 'Non spécifié';
    if (!tierTotals[tierName]) {
      tierTotals[tierName] = 0;
    }
    tierTotals[tierName] += parseFloat(transaction.amount || 0);
  });

  return tierTotals;
};

export const calculateActualByTier = (actuals, rangeStart, rangeEnd) => {
  const tierTotals = {};

  actuals.forEach((actual) => {
    const tierName = actual.thirdParty || 'Non spécifié';
    if (!tierTotals[tierName]) {
      tierTotals[tierName] = 0;
    }

    // Somme des paiements pour cette période
    const periodTotal = (actual.payments || []).reduce((sum, payment) => {
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate >= rangeStart && paymentDate <= rangeEnd) {
        return sum + parseFloat(payment.paidAmount || 0);
      }
      return sum;
    }, 0);

    tierTotals[tierName] += periodTotal;
  });

  return tierTotals;
};

// Analyse par catégorie
export const getCategoryAnalysisData = ({
  categories,
  projectEntries,
  projectActuals,
  analysisType,
  rangeStart,
  rangeEnd,
}) => {
  if (!rangeStart || !rangeEnd) {
    return {
      categories: [], // ← Maintenant c'est un tableau d'objets
      budgetData: [],
      actualData: [],
      totalBudget: 0,
      totalActual: 0,
      rawData: [],
    };
  }

  const mainCategories =
    analysisType === 'expense' ? categories.expense : categories.revenue;

  if (!mainCategories || mainCategories.length === 0) {
    return {
      categories: [],
      budgetData: [],
      actualData: [],
      totalBudget: 0,
      totalActual: 0,
      rawData: [],
    };
  }

  // Calculer les totaux par catégorie
  const budgetByCategory = calculateBudgetByCategory(
    projectEntries,
    rangeStart,
    rangeEnd
  );
  const actualByCategory = calculateActualByCategory(
    projectActuals,
    rangeStart,
    rangeEnd
  );

  // Créer les données pour le graphique - CHANGEMENT ICI
  const data = mainCategories
    .map((mainCat) => {
      const budgetAmount = budgetByCategory[mainCat.name] || 0;
      const actualAmount = actualByCategory[mainCat.name] || 0;

      // Retourner un objet complet avec toutes les propriétés nécessaires
      return {
        name: mainCat.name,
        budget: budgetAmount,
        actual: actualAmount,
        count: 1, // Ou calculez le vrai count si nécessaire
      };
    })
    .filter((item) => item.budget > 0 || item.actual > 0);

  // Trier par montant réel (ou budget si aucun réel)
  data.sort((a, b) => {
    if (a.actual > 0 || b.actual > 0) {
      return b.actual - a.actual;
    }
    return b.budget - a.budget;
  });

  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0);

  // IMPORTANT: Retournez les objets complets dans categories
  return {
    categories: data, // ← Maintenant un tableau d'objets
    budgetData: data.map((item) => item.budget),
    actualData: data.map((item) => item.actual),
    totalBudget,
    totalActual,
    rawData: data,
  };
};

// Analyse par tiers
export const getTierAnalysisData = ({
  tiers,
  projectEntries,
  projectActuals,
  analysisType,
  rangeStart,
  rangeEnd,
}) => {
  if (!rangeStart || !rangeEnd) {
    return {
      tiers: [], // ← Tableau d'objets
      budgetData: [],
      actualData: [],
      totalBudget: 0,
      totalActual: 0,
      rawData: [],
    };
  }

  const tierList = analysisType === 'expense' ? tiers.expense : tiers.revenue;

  // Calculer les totaux par tiers
  const budgetByTier = calculateBudgetByTier(
    projectEntries,
    rangeStart,
    rangeEnd
  );
  const actualByTier = calculateActualByTier(
    projectActuals,
    rangeStart,
    rangeEnd
  );

  // Si aucun tiers défini, utiliser ceux des transactions
  if (tierList.length === 0) {
    // Créer une liste de tous les tiers uniques à partir des transactions
    const allTiers = new Set();

    projectEntries.forEach((transaction) => {
      if (transaction.thirdParty) {
        allTiers.add(transaction.thirdParty);
      }
    });

    projectActuals.forEach((actual) => {
      if (actual.thirdParty) {
        allTiers.add(actual.thirdParty);
      }
    });

    // Convertir en tableau d'objets
    Array.from(allTiers).forEach((tierName) => {
      tierList.push({ name: tierName, email: '' });
    });
  }

  // Créer les données pour le graphique
  const data = tierList
    .map((tier) => {
      const tierName = tier.name;
      const budgetAmount = budgetByTier[tierName] || 0;
      const actualAmount = actualByTier[tierName] || 0;

      return {
        name: tierName,
        budget: budgetAmount,
        actual: actualAmount,
        email: tier.email,
        count: 1, // Ajoutez count
      };
    })
    .filter((item) => item.budget > 0 || item.actual > 0);

  // Trier par montant réel (ou budget si aucun réel)
  data.sort((a, b) => {
    if (a.actual > 0 || b.actual > 0) {
      return b.actual - a.actual;
    }
    return b.budget - a.budget;
  });

  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0);

  // Retournez les objets complets
  return {
    tiers: data, // ← Tableau d'objets
    budgetData: data.map((item) => item.budget),
    actualData: data.map((item) => item.actual),
    totalBudget,
    totalActual,
    rawData: data,
  };
};

// Configuration des graphiques par catégorie
export const getCategoryChartOptions = ({
  categoryAnalysisData,
  analysisType,
  analysisPeriodName,
  settings,
  visibleData,
  isMobile = false,
}) => {
  const { categories, budgetData, actualData, totalBudget, totalActual } =
    categoryAnalysisData;

  // Calculer la valeur max pour l'axe X
  const allValues = [...budgetData, ...actualData].filter((val) => val > 0);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;

  // Déterminer les couleurs selon le type d'analyse
  const chartColors =
    analysisType === 'expense'
      ? {
          budget: '#fca5a5', // rouge clair pour budget dépense
          actual: '#ef4444', // rouge vif pour réel dépense
          budgetLabel: '#b91c1c',
          actualLabel: '#7f1d1d',
        }
      : {
          budget: '#6ee7b7', // vert clair pour budget revenue
          actual: '#10b981', // vert vif pour réel revenue
          budgetLabel: '#047857',
          actualLabel: '#065f46',
        };

  const series = [];

  if (visibleData.budget && totalBudget > 0) {
    series.push({
      name: `Budget: ${formatCurrency(totalBudget, settings)}`,
      type: 'bar',
      data: budgetData,
      itemStyle: { color: chartColors.budget, borderRadius: [0, 5, 5, 0] },
      emphasis: { focus: 'series' },
      label: {
        show: true,
        position: 'right',
        formatter: (params) => {
          if (params.value <= 0) return '';
          const percentage =
            totalBudget > 0 ? (params.value / totalBudget) * 100 : 0;
          return `${formatCurrency(
            params.value,
            settings
          )} (${percentage.toFixed(0)}%)`;
        },
        color: chartColors.budgetLabel,
        fontSize: isMobile ? 10 : 12,
      },
    });
  }

  if (visibleData.actual && totalActual > 0) {
    series.push({
      name: `Réel: ${formatCurrency(totalActual, settings)}`,
      type: 'bar',
      data: actualData,
      itemStyle: { color: chartColors.actual, borderRadius: [0, 5, 5, 0] },
      emphasis: { focus: 'series' },
      label: {
        show: true,
        position: 'right',
        formatter: (params) => {
          if (params.value <= 0) return '';
          const percentage =
            totalActual > 0 ? (params.value / totalActual) * 100 : 0;
          return `${formatCurrency(
            params.value,
            settings
          )} (${percentage.toFixed(0)}%)`;
        },
        color: chartColors.actualLabel,
        fontSize: isMobile ? 10 : 12,
      },
    });
  }

  if (series.length === 0) {
    return {
      title: {
        text: 'Aucune donnée à analyser',
        left: 'center',
        top: 'center',
        textStyle: {
          fontSize: isMobile ? 14 : 16,
          fontWeight: '600',
          color: '#475569',
        },
      },
      series: [],
    };
  }

  const chartTitle = analysisType === 'expense' ? 'Dépenses' : 'Revenus';

  return {
    title: {
      text: isMobile
        ? `${chartTitle} - ${analysisPeriodName}`
        : `Analyse par Catégorie - ${chartTitle} - ${analysisPeriodName}`,
      left: 'center',
      top: 0,
      textStyle: {
        fontSize: isMobile ? 14 : 16,
        fontWeight: '600',
        color: '#475569',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        let tooltip = `<strong>${params[0].name}</strong><br/>`;
        params
          .slice()
          .reverse()
          .forEach((param) => {
            const seriesName = param.seriesName;
            const total = seriesName.startsWith('Budget')
              ? totalBudget
              : totalActual;
            const percentage = total > 0 ? (param.value / total) * 100 : 0;
            tooltip += `${param.marker} ${
              seriesName.split(':')[0]
            }: <strong>${formatCurrency(
              param.value,
              settings
            )}</strong> (${percentage.toFixed(1)}%)<br/>`;
          });
        return tooltip;
      },
      textStyle: {
        fontSize: isMobile ? 12 : 14,
      },
    },
    legend: {
      show: false,
    },
    grid: {
      left: isMobile ? '15%' : '3%',
      right: isMobile ? '15%' : '10%',
      bottom: '3%',
      top: isMobile ? '15%' : '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value) => {
          // Utiliser la fonction de formatage responsive
          return formatXAxisLabels(value, null, isMobile, maxValue, settings);
        },
        fontSize: isMobile ? 10 : 12,
        interval: isMobile
          ? (value) => {
              // N'afficher que le 0 et le max
              return value === 0 || Math.abs(value - maxValue) < 0.01;
            }
          : 0,
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: isMobile ? 'dashed' : 'solid',
          opacity: isMobile ? 0.3 : 0.5,
        },
      },
      splitNumber: isMobile ? 3 : 5,
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        interval: 0,
        rotate: 0,
        fontSize: isMobile ? 10 : 12,
        formatter: (value) => {
          const maxLength = isMobile ? 15 : 20;
          return value.length > maxLength
            ? value.substring(0, maxLength - 3) + '...'
            : value;
        },
      },
      axisTick: {
        show: false,
      },
    },
    series: series,
  };
};

// Configuration des graphiques par tiers
export const getTierChartOptions = ({
  tierAnalysisData,
  analysisType,
  analysisPeriodName,
  settings,
  visibleData,
  isMobile = false,
}) => {
  const { tiers, budgetData, actualData, totalBudget, totalActual } =
    tierAnalysisData;

  // Calculer la valeur max pour l'axe X
  const allValues = [...budgetData, ...actualData].filter((val) => val > 0);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;

  // Déterminer les couleurs selon le type d'analyse
  const chartColors =
    analysisType === 'expense'
      ? {
          budget: '#fca5a5', // rouge clair pour budget dépense
          actual: '#ef4444', // rouge vif pour réel dépense
          budgetLabel: '#b91c1c',
          actualLabel: '#7f1d1d',
        }
      : {
          budget: '#6ee7b7', // vert clair pour budget revenue
          actual: '#10b981', // vert vif pour réel revenue
          budgetLabel: '#047857',
          actualLabel: '#065f46',
        };

  const series = [];

  if (visibleData.budget && totalBudget > 0) {
    series.push({
      name: `Budget: ${formatCurrency(totalBudget, settings)}`,
      type: 'bar',
      data: budgetData,
      itemStyle: { color: chartColors.budget, borderRadius: [0, 5, 5, 0] },
      emphasis: { focus: 'series' },
      label: {
        show: true,
        position: 'right',
        formatter: (params) => {
          if (params.value <= 0) return '';
          const percentage =
            totalBudget > 0 ? (params.value / totalBudget) * 100 : 0;
          return `${formatCurrency(
            params.value,
            settings
          )} (${percentage.toFixed(0)}%)`;
        },
        color: chartColors.budgetLabel,
        fontSize: isMobile ? 10 : 12,
      },
    });
  }

  if (visibleData.actual && totalActual > 0) {
    series.push({
      name: `Réel: ${formatCurrency(totalActual, settings)}`,
      type: 'bar',
      data: actualData,
      itemStyle: { color: chartColors.actual, borderRadius: [0, 5, 5, 0] },
      emphasis: { focus: 'series' },
      label: {
        show: true,
        position: 'right',
        formatter: (params) => {
          if (params.value <= 0) return '';
          const percentage =
            totalActual > 0 ? (params.value / totalActual) * 100 : 0;
          return `${formatCurrency(
            params.value,
            settings
          )} (${percentage.toFixed(0)}%)`;
        },
        color: chartColors.actualLabel,
        fontSize: isMobile ? 10 : 12,
      },
    });
  }

  if (series.length === 0) {
    return {
      title: {
        text: 'Aucune donnée à analyser',
        left: 'center',
        top: 'center',
        textStyle: {
          fontSize: isMobile ? 14 : 16,
          fontWeight: '600',
          color: '#475569',
        },
      },
      series: [],
    };
  }

  const chartTitle = analysisType === 'expense' ? 'Dépenses' : 'Revenus';

  return {
    title: {
      text: isMobile
        ? `${chartTitle} - ${analysisPeriodName}`
        : `Analyse par Tiers - ${chartTitle} - ${analysisPeriodName}`,
      left: 'center',
      top: 0,
      textStyle: {
        fontSize: isMobile ? 14 : 16,
        fontWeight: '600',
        color: '#475569',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        let tooltip = `<strong>${params[0].name}</strong><br/>`;
        params
          .slice()
          .reverse()
          .forEach((param) => {
            const seriesName = param.seriesName;
            const total = seriesName.startsWith('Budget')
              ? totalBudget
              : totalActual;
            const percentage = total > 0 ? (param.value / total) * 100 : 0;
            tooltip += `${param.marker} ${
              seriesName.split(':')[0]
            }: <strong>${formatCurrency(
              param.value,
              settings
            )}</strong> (${percentage.toFixed(1)}%)<br/>`;
          });
        return tooltip;
      },
      textStyle: {
        fontSize: isMobile ? 12 : 14,
      },
    },
    legend: {
      show: false,
    },
    grid: {
      left: isMobile ? '15%' : '3%',
      right: isMobile ? '15%' : '10%',
      bottom: '3%',
      top: isMobile ? '15%' : '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value) => {
          // Utiliser la fonction de formatage responsive
          return formatXAxisLabels(value, null, isMobile, maxValue, settings);
        },
        fontSize: isMobile ? 10 : 12,
        interval: isMobile
          ? (value) => {
              // N'afficher que le 0 et le max
              return value === 0 || Math.abs(value - maxValue) < 0.01;
            }
          : 0,
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: isMobile ? 'dashed' : 'solid',
          opacity: isMobile ? 0.3 : 0.5,
        },
      },
      splitNumber: isMobile ? 3 : 5,
    },
    yAxis: {
      type: 'category',
      data: tiers,
      axisLabel: {
        interval: 0,
        rotate: 0,
        fontSize: isMobile ? 10 : 12,
        formatter: (value) => {
          const maxLength = isMobile ? 15 : 20;
          return value.length > maxLength
            ? value.substring(0, maxLength - 3) + '...'
            : value;
        },
      },
      axisTick: {
        show: false,
      },
    },
    series: series,
  };
};

// Fonction générique pour obtenir les options du graphique selon le mode
export const getChartOptions = ({
  analysisMode,
  categoryAnalysisData,
  tierAnalysisData,
  analysisType,
  analysisPeriodName,
  settings,
  visibleData,
  isMobile = false,
}) => {
  if (analysisMode === 'tier') {
    return getTierChartOptions({
      tierAnalysisData,
      analysisType,
      analysisPeriodName,
      settings,
      visibleData,
      isMobile,
    });
  } else {
    // Par défaut, analyse par catégorie
    return getCategoryChartOptions({
      categoryAnalysisData,
      analysisType,
      analysisPeriodName,
      settings,
      visibleData,
      isMobile,
    });
  }
};

// Options pour les menus
export const quickPeriodOptions = [
  { id: 'month', label: 'Mois' },
  { id: 'bimester', label: 'Bimestre' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'semester', label: 'Semestre' },
  { id: 'year', label: 'Année' },
];

export const analysisTypeOptions = [
  {
    id: 'expense',
    label: 'Sorties',
    icon: 'TrendingDown',
    color: 'text-red-600',
  },
  {
    id: 'revenue',
    label: 'Entrées',
    icon: 'TrendingUp',
    color: 'text-green-600',
  },
];

export const getAnalysisModeOptions = (
  isConsolidated,
  isCustomConsolidated
) => {
  return [
    { id: 'category', label: 'Par catégorie' },
    ...(isConsolidated || isCustomConsolidated
      ? [{ id: 'project', label: 'Par projet' }]
      : []),
    { id: 'tier', label: 'Par tiers' },
  ];
};
