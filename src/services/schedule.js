// Fonction pour formater une date en YYYY-MM-DD
export const formatDateToKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fonction pour obtenir la date de fin du mois (dernier jour du mois)
export const getEndOfMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  // Le jour 0 du mois suivant donne le dernier jour du mois courant
  return new Date(year, month + 1, 0);
};

// Fonction pour obtenir la date de début du mois (premier jour du mois)
export const getStartOfMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month, 1);
};

// Fonction pour générer les dates selon la fréquence
export const generateDatesByFrequency = (
  frequencyId,
  startDate,
  endDate = null,
  // Nouveau paramètre optionnel pour définir la date limite de génération
  limitDate = null
) => {
  const dates = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  // Cas des fréquences sans répétition
  if (frequencyId === 1 || frequencyId === 9) {
    dates.push(new Date(start));
    return dates;
  }

  const calculateNextDate = (currentDate, frequency) => {
    const nextDate = new Date(currentDate);
    switch (frequency) {
      case 2: // Quotidienne
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 3: // Mensuelle
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 4: // Hebdomadaire
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 5: // Bimestrielle
        nextDate.setMonth(nextDate.getMonth() + 2);
        break;
      case 6: // Trimestrielle
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 7: // Semestrielle
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 8: // Annuelle
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        return currentDate;
    }
    return nextDate;
  };

  // Déterminer la date limite
  let limit = endDate;

  if (!endDate) {
    if (limitDate) {
      // Utiliser la date limite fournie (par exemple, fin du mois affiché)
      limit = limitDate;
    } else {
      // Par défaut, générer pour les 2 prochaines années
      const futureEndDate = new Date(start);
      futureEndDate.setFullYear(futureEndDate.getFullYear() + 2);
      limit = futureEndDate;
    }
  }

  // Convertir la date limite en fin de journée
  const end = new Date(limit);
  end.setHours(23, 59, 59, 999);

  let currentDate = new Date(start);

  // Ne générer que les dates à partir de la start_date
  if (currentDate > end) {
    return dates;
  }

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate = calculateNextDate(currentDate, frequencyId);
  }

  return dates;
};

// Fonction principale pour transformer les données budgétaires avec support du mois courant
export const transformBudgetDataWithDates = (
  budgetData,
  currentMonthDate = null
) => {
  const transactions = [];

  // Si une date de mois courant est fournie, on génère jusqu'à la fin de ce mois
  let limitDate = null;
  if (currentMonthDate) {
    limitDate = getEndOfMonth(currentMonthDate);
  }

  budgetData.forEach((budget) => {
    const frequencyId = budget.frequency_id;
    const type = budget.category_type_id == 2 ? 'receivable' : 'payable';

    // Générer les dates avec la limite du mois courant si spécifiée
    const dates = generateDatesByFrequency(
      frequencyId,
      budget.start_date,
      budget.end_date,
      limitDate
    );

    dates.forEach((date, occurrenceIndex) => {
      const dateKey = formatDateToKey(date);

      const uniqueId = `budget-${budget.budget_id}-${dateKey}-${occurrenceIndex}`;

      // Préparation du nom du tiers
      let thirdParty = budget.category_name;
      if (budget.third_party_name && budget.third_party_firstname) {
        thirdParty = `${budget.third_party_name} ${budget.third_party_firstname}`;
      } else if (budget.third_party_name) {
        thirdParty = budget.third_party_name;
      }

      transactions.push({
        id: uniqueId,
        thirdParty: thirdParty,
        amount: parseFloat(budget.budget_amount || 0),
        type: type,
        category: budget.category_name,
        subCategory: budget.sub_category_name,
        date: dateKey,
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
      });
    });
  });

  return transactions;
};

// Fonction pour organiser les transactions par date avec support du mois courant
export const transformBudgetData = (budgetData, currentMonthDate = null) => {
  const transactions = {};

  // D'abord transformer les données avec les dates générées
  const transformedData = transformBudgetDataWithDates(
    budgetData,
    currentMonthDate
  );

  // Puis organiser par date
  transformedData.forEach((transaction) => {
    const dateKey = transaction.date;

    if (!transactions[dateKey]) {
      transactions[dateKey] = [];
    }

    transactions[dateKey].push({
      ...transaction,
      amount: parseFloat(transaction.amount || 0),
    });
  });

  return transactions;
};

// Fonction pour obtenir la date d'aujourd'hui formatée
export const getTodayKey = () => {
  return formatDateToKey(new Date());
};
