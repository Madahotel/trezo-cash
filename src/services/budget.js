export const filterDataByYear = (data, yearToFilter) => {
  if (!yearToFilter || !data) return data;

  // Deep clone pour éviter les mutations
  const filteredData = JSON.parse(JSON.stringify(data));

  // Fonction helper pour vérifier si une période couvre l'année
  const periodCoversYear = (item) => {
    if (!item.start_date) return false;

    const startDate = new Date(item.start_date);
    const startYear = startDate.getFullYear();

    // Si la durée est indéfinie et que l'année de début est <= année filtrée
    if (item.is_duration_indefinite || item.is_budget_duration_indefinite) {
      return yearToFilter >= startYear;
    }

    // Si pas de date de fin, on considère que c'est pour l'année de début uniquement
    if (!item.end_date) {
      return yearToFilter === startYear;
    }

    const endDate = new Date(item.end_date);
    const endYear = endDate.getFullYear();

    // Vérifier si l'année filtrée est dans l'intervalle
    return yearToFilter >= startYear && yearToFilter <= endYear;
  };

  // Structure budgetEntries (consolidée)
  if (filteredData.budgetEntries) {
    filteredData.budgetEntries =
      filteredData.budgetEntries.filter(periodCoversYear);

    // Reconstruire les regroupements par catégorie
    const categoryMap = new Map();
    filteredData.budgetEntries.forEach((item) => {
      const categoryId = item.category_id;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          categoryName: item.category_name,
          items: [],
        });
      }
      const category = categoryMap.get(categoryId);
      category.items.push({
        id: item.id,
        sub_category_name: item.sub_category_name,
        amount: item.budget_forecast_amount,
        start_date: item.start_date,
        end_date: item.end_date,
        is_budget_duration_indefinite: item.is_budget_duration_indefinite,
        frequency_name: item.frequency_name,
        budget_type_id: item.budget_type_id,
        ...item,
      });
    });

    // Ajouter les catégories au filteredData
    filteredData.categories = Array.from(categoryMap.values()).map(
      (category) => ({
        ...category,
        amount: category.items.reduce(
          (sum, item) => sum + parseFloat(item.amount || 0),
          0
        ),
        subcategoryName: `${category.items.length} sous-catégorie${
          category.items.length > 1 ? 's' : ''
        }`,
      })
    );
  }

  // Structure normale (revenus/dépenses séparés)
  const filterSubCategories = (subCategories) => {
    if (!subCategories) return [];
    return subCategories.filter(periodCoversYear);
  };

  // Filtrer les entrées (revenus)
  if (filteredData.entries?.entry_items?.sub_categories) {
    const filteredSubCategories = filterSubCategories(
      filteredData.entries.entry_items.sub_categories
    );

    // Grouper par catégorie
    const categoryMap = new Map();
    filteredSubCategories.forEach((item) => {
      if (!categoryMap.has(item.category_id)) {
        categoryMap.set(item.category_id, {
          category_id: item.category_id,
          category_name: item.category_name,
          items: [],
        });
      }
      categoryMap.get(item.category_id).items.push(item);
    });

    // Mettre à jour les données filtrées
    filteredData.entries.entry_items.sub_categories = filteredSubCategories;
    filteredData.entries.entry_items.category_names = Array.from(
      categoryMap.values()
    );
    filteredData.entries.entry_count = filteredSubCategories.length;
  }

  // Filtrer les sorties (dépenses)
  if (filteredData.exits?.exit_items?.sub_categories) {
    const filteredSubCategories = filterSubCategories(
      filteredData.exits.exit_items.sub_categories
    );

    // Grouper par catégorie
    const categoryMap = new Map();
    filteredSubCategories.forEach((item) => {
      if (!categoryMap.has(item.category_id)) {
        categoryMap.set(item.category_id, {
          category_id: item.category_id,
          category_name: item.category_name,
          items: [],
        });
      }
      categoryMap.get(item.category_id).items.push(item);
    });

    // Mettre à jour les données filtrées
    filteredData.exits.exit_items.sub_categories = filteredSubCategories;
    filteredData.exits.exit_items.category_names = Array.from(
      categoryMap.values()
    );
    filteredData.exits.exit_count = filteredSubCategories.length;
  }

  return filteredData;
};

{
  /** GENERATION FREQUENCE DE BUDGET**/
}

// Fonction pour calculer les totaux par année avec fréquence basée sur les dates
export const calculateYearlyTotals = (data, year) => {
  if (!data) return { revenus: 0, depenses: 0, balance: 0 };

  // Helper pour calculer le nombre de périodes dans l'année
  const calculatePeriodsInYear = (
    startDate,
    endDate,
    frequencyId,
    yearToCalculate
  ) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const yearStart = new Date(yearToCalculate, 0, 1);
    const yearEnd = new Date(yearToCalculate, 11, 31, 23, 59, 59);

    // Si la période est en dehors de l'année
    if (end && end < yearStart) return 0;
    if (start > yearEnd) return 0;

    // Dates de début et fin effectives pour l'année
    const effectiveStart = start < yearStart ? yearStart : start;
    const effectiveEnd = end ? (end > yearEnd ? yearEnd : end) : yearEnd;

    // Calcul en fonction de la fréquence
    switch (frequencyId) {
      case 1: // Ponctuel
        return start.getFullYear() === yearToCalculate ? 1 : 0;

      case 2: // Journalier
        const daysDiff =
          Math.floor((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) +
          1;
        return Math.max(0, daysDiff);

      case 3: // Mensuel
        const monthsDiff =
          (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 12 +
          (effectiveEnd.getMonth() - effectiveStart.getMonth());
        return Math.max(0, monthsDiff + 1);

      case 4: // Hebdomadaire
        const weeksDiff =
          Math.floor(
            (effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24 * 7)
          ) + 1;
        return Math.max(0, weeksDiff);

      case 5: // Bimestriel (tous les 2 mois)
        const bimonthlyDiff =
          (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 6 +
          Math.floor((effectiveEnd.getMonth() - effectiveStart.getMonth()) / 2);
        return Math.max(0, bimonthlyDiff + 1);

      case 6: // Trimestriel (tous les 3 mois)
        const quarterlyDiff =
          (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 4 +
          Math.floor((effectiveEnd.getMonth() - effectiveStart.getMonth()) / 3);
        return Math.max(0, quarterlyDiff + 1);

      case 7: // Semestriel (tous les 6 mois)
        const semiannualDiff =
          (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 2 +
          Math.floor((effectiveEnd.getMonth() - effectiveStart.getMonth()) / 6);
        return Math.max(0, semiannualDiff + 1);

      case 8: // Annuel
        const paymentMonth = start.getMonth();
        const paymentDay = start.getDate();

        let annualCount = 0;
        let currentYear = start.getFullYear();
        const lastYear = end ? end.getFullYear() : yearToCalculate;

        while (currentYear <= lastYear) {
          // Vérifier si cette occurrence annuelle tombe dans l'année calculée
          if (currentYear === yearToCalculate) {
            const paymentDate = new Date(currentYear, paymentMonth, paymentDay);
            // Vérifier que la date de paiement est dans la période effective
            if (paymentDate >= effectiveStart && paymentDate <= effectiveEnd) {
              annualCount++;
            }
          }
          currentYear++;
        }

        return annualCount;

      case 9: // Paiement irrégulier (traité comme ponctuel)
        return start.getFullYear() === yearToCalculate ? 1 : 0;

      default:
        return 0;
    }
  };

  // Fonction pour calculer le montant annuel d'un item
  const calculateItemYearlyAmount = (item) => {
    if (!item.amount && !item.budget_forecast_amount) return 0;

    const baseAmount = parseFloat(
      item.amount || item.budget_forecast_amount || 0
    );
    const frequencyId = item.frequency_id || item.frequency?.id;

    if (!item.start_date) return baseAmount;

    // Pour les durées indéfinies, on calcule pour l'année complète
    if (item.is_duration_indefinite || item.is_budget_duration_indefinite) {
      const startYear = new Date(item.start_date).getFullYear();
      if (year < startYear) return 0;

      // Calculer le nombre de périodes pour l'année entière
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);
      const periods = calculatePeriodsInYear(
        item.start_date,
        yearEnd,
        frequencyId,
        year
      );

      return baseAmount * periods;
    }

    // Pour les durées définies
    if (!item.end_date) {
      // Pas de date de fin : seulement pour l'année de début
      const startYear = new Date(item.start_date).getFullYear();
      if (year !== startYear) return 0;

      return baseAmount;
    }

    // Vérifier si la période couvre l'année
    const startYear = new Date(item.start_date).getFullYear();
    const endYear = new Date(item.end_date).getFullYear();

    if (year < startYear || year > endYear) return 0;

    // Calculer le nombre de périodes dans cette année spécifique
    const periods = calculatePeriodsInYear(
      item.start_date,
      item.end_date,
      frequencyId,
      year
    );

    return baseAmount * periods;
  };

  let totalRevenus = 0;
  let totalDepenses = 0;

  // Calculer les revenus
  if (data.entries?.entry_items?.sub_categories) {
    data.entries.entry_items.sub_categories.forEach((item) => {
      totalRevenus += calculateItemYearlyAmount(item);
    });
  }

  // Calculer les dépenses
  if (data.exits?.exit_items?.sub_categories) {
    data.exits.exit_items.sub_categories.forEach((item) => {
      totalDepenses += calculateItemYearlyAmount(item);
    });
  }

  // Pour les données consolidées
  if (data.budgetEntries) {
    data.budgetEntries.forEach((item) => {
      const yearlyAmount = calculateItemYearlyAmount(item);

      if (item.budget_type_id === 1 || item.type === 'entry') {
        totalRevenus += yearlyAmount;
      } else if (item.budget_type_id === 2 || item.type === 'exit') {
        totalDepenses += yearlyAmount;
      }
    });
  }

  return {
    revenus: parseFloat(totalRevenus.toFixed(2)),
    depenses: parseFloat(totalDepenses.toFixed(2)),
    balance: parseFloat((totalRevenus - totalDepenses).toFixed(2)),
  };
};
