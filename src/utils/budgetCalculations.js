const calculationCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const getCachedResult = (key, calculationFn, dependencies) => {
  const cacheKey = `${key}-${JSON.stringify(dependencies)}`;
  const cached = calculationCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  const result = calculationFn();
  calculationCache.set(cacheKey, { result, timestamp: Date.now() });

  // Nettoyer le cache périodiquement
  if (calculationCache.size > 100) {
    const firstKey = calculationCache.keys().next().value;
    calculationCache.delete(firstKey);
  }

  return result;
};

export const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setHours(0, 0, 0, 0);
  return new Date(d.setDate(diff));
};

export const getWeeksInMonth = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstWeekDay = firstDay.getDay() || 7; // 1=lundi, 7=dimanche
  const daysInMonth = lastDay.getDate();

  return Math.ceil((daysInMonth + firstWeekDay - 1) / 7);
};

export const getEntryAmountForMonth = (entry, monthIndex, year) => {
  const cacheKey = `monthly-${entry.id}-${year}-${monthIndex}`;

  return getCachedResult(
    cacheKey,
    () => {
      const targetMonthStart = new Date(year, monthIndex, 1);
      const targetMonthEnd = new Date(year, monthIndex + 1, 0);

      if (entry.isProvision || entry.frequency === "irregulier") {
        if (!entry.payments?.length) return 0;

        let total = 0;
        for (let i = 0; i < entry.payments.length; i++) {
          const payment = entry.payments[i];
          if (!payment.date || !payment.amount) continue;

          const paymentDate = new Date(payment.date);
          if (
            paymentDate.getFullYear() === year &&
            paymentDate.getMonth() === monthIndex
          ) {
            total += parseFloat(payment.amount);
          }
        }
        return total;
      }

      if (entry.frequency === "ponctuel") {
        if (!entry.date) return 0;
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() === year &&
          entryDate.getMonth() === monthIndex
          ? parseFloat(entry.amount)
          : 0;
      }

      if (!entry.startDate) return 0;
      const startDate = new Date(entry.startDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = entry.endDate ? new Date(entry.endDate) : null;
      if (endDate) endDate.setHours(23, 59, 59, 999);

      if (targetMonthEnd < startDate || (endDate && targetMonthStart > endDate))
        return 0;

      const entryAmount = parseFloat(entry.amount);

      switch (entry.frequency) {
        case "journalier":
          return entryAmount * targetMonthEnd.getDate();
        case "mensuel":
          return entryAmount;
        case "hebdomadaire":
          return entryAmount * getWeeksInMonth(year, monthIndex);
        case "bimestriel":
          return (monthIndex - startDate.getMonth()) % 2 === 0 &&
            monthIndex >= startDate.getMonth()
            ? entryAmount
            : 0;
        case "trimestriel":
          return (monthIndex - startDate.getMonth()) % 3 === 0 &&
            monthIndex >= startDate.getMonth()
            ? entryAmount
            : 0;
        case "annuel":
          return monthIndex === startDate.getMonth() ? entryAmount : 0;
        default:
          return 0;
      }
    },
    [entry, monthIndex, year]
  );
};

const addMonths = (date, months) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) {
    d.setDate(0);
  }
  return d;
};

export const getEntryAmountForPeriod = (entry, periodStart, periodEnd) => {
  if (!entry || !entry.amount || isNaN(entry.amount)) {
    return 0;
  }

  // ✅ CORRECTION: S'assurer que les dates sont valides
  if (
    !periodStart ||
    !periodEnd ||
    isNaN(periodStart.getTime()) ||
    isNaN(periodEnd.getTime())
  ) {
    return 0;
  }

  const cacheKey = `period-${
    entry.id
  }-${periodStart.getTime()}-${periodEnd.getTime()}`;

  return getCachedResult(
    cacheKey,
    () => {
      const entryAmount = parseFloat(entry.amount);

      if (entry.isProvision || entry.frequency === "irregulier") {
        if (!entry.payments?.length) {
          return 0;
        }

        let total = 0;
        for (let i = 0; i < entry.payments.length; i++) {
          const payment = entry.payments[i];
          if (!payment.date || !payment.amount) continue;

          const paymentDate = new Date(payment.date);
          paymentDate.setHours(0, 0, 0, 0);

          if (paymentDate >= periodStart && paymentDate < periodEnd) {
            const paymentAmount = parseFloat(payment.amount);
            total += paymentAmount;
          }
        }
        return total;
      }

      if (entry.frequency === "ponctuel") {
        if (!entry.date) {
          return 0;
        }

        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);

        const isInPeriod = entryDate >= periodStart && entryDate < periodEnd;

        return isInPeriod ? entryAmount : 0;
      }

      if (!entry.startDate) {
        return 0;
      }

      const startDate = new Date(entry.startDate);
      startDate.setHours(0, 0, 0, 0);

      const entryEndDate = entry.endDate ? new Date(entry.endDate) : null;
      if (entryEndDate) entryEndDate.setHours(23, 59, 59, 999);

      if (
        periodEnd <= startDate ||
        (entryEndDate && periodStart > entryEndDate)
      ) {
        return 0;
      }

      const frequency = entry.frequency;

      if (frequency === "mensuel") {
        const monthDiff =
          (periodEnd.getFullYear() - startDate.getFullYear()) * 12 +
          (periodEnd.getMonth() - startDate.getMonth());

        if (monthDiff >= 0) {
          let count = 0;
          for (let i = 0; i <= monthDiff; i++) {
            const currentDate = addMonths(new Date(startDate), i);
            currentDate.setHours(0, 0, 0, 0);

            if (
              currentDate >= periodStart &&
              currentDate < periodEnd &&
              (!entryEndDate || currentDate <= entryEndDate)
            ) {
              count++;
            }
          }
          const total = count * entryAmount;
          return total;
        }
        return 0;
      }

      let totalAmount = 0;
      let currentDate = new Date(startDate);
      currentDate.setHours(0, 0, 0, 0);

      const incrementFns = {
        journalier: (d) => {
          const newDate = new Date(d);
          newDate.setDate(newDate.getDate() + 1);
          return newDate;
        },
        hebdomadaire: (d) => {
          const newDate = new Date(d);
          newDate.setDate(newDate.getDate() + 7);
          return newDate;
        },
        mensuel: (d) => addMonths(d, 1),
        bimestriel: (d) => addMonths(d, 2),
        trimestriel: (d) => addMonths(d, 3),
        annuel: (d) => addMonths(d, 12),
      };

      const incrementFn = incrementFns[frequency];
      if (!incrementFn) {
        return 0;
      }

      // ✅ CORRECTION: Avancer jusqu'au début de la période
      while (
        currentDate < periodStart &&
        (!entryEndDate || currentDate <= entryEndDate)
      ) {
        const nextDate = incrementFn(new Date(currentDate));
        if (isNaN(nextDate.getTime()) || nextDate <= currentDate) break;
        if (nextDate > periodStart) break;
        currentDate = nextDate;
      }

      // ✅ CORRECTION: Compter les occurrences dans la période
      let occurrenceCount = 0;
      while (
        (!entryEndDate || currentDate <= entryEndDate) &&
        currentDate < periodEnd
      ) {
        if (currentDate >= periodStart) {
          totalAmount += entryAmount;
          occurrenceCount++;
        }

        const nextDate = incrementFn(new Date(currentDate));
        if (isNaN(nextDate.getTime()) || nextDate <= currentDate) break;
        currentDate = nextDate;
      }

      return totalAmount;
    },
    [entry, periodStart, periodEnd]
  );
};

// ✅ CORRECTION: Fonction getActualAmountForPeriod bien exportée
export const getActualAmountForPeriod = (
  entry,
  actualTransactions,
  periodStart,
  periodEnd
) => {
  if (!entry || !actualTransactions || !periodStart || !periodEnd) {
    return 0;
  }

  const cacheKey = `actual-${
    entry.id
  }-${periodStart.getTime()}-${periodEnd.getTime()}`;

  return getCachedResult(
    cacheKey,
    () => {
      let total = 0;

      // ✅ CORRECTION: Vérification que actualTransactions est un tableau
      if (!Array.isArray(actualTransactions)) {
        return 0;
      }

      for (let i = 0; i < actualTransactions.length; i++) {
        const actual = actualTransactions[i];

        if (!actual || actual.budgetId !== entry.id) continue;

        const payments = actual.payments || [];
        for (let j = 0; j < payments.length; j++) {
          const payment = payments[j];

          if (!payment || !payment.paymentDate || payment.paidAmount == null) {
            continue;
          }

          try {
            const paymentDate = new Date(payment.paymentDate);
            if (isNaN(paymentDate.getTime())) continue;

            if (paymentDate >= periodStart && paymentDate < periodEnd) {
              const paidAmount = parseFloat(payment.paidAmount) || 0;
              total += paidAmount;
            }
          } catch (error) {
            console.error("❌ Erreur lors du traitement du paiement:", error);
            continue;
          }
        }
      }

      return total;
    },
    [entry, actualTransactions, periodStart, periodEnd]
  );
};

export const expandVatEntries = (entries, categories) => {
  if (!entries || !categories) return [];

  const cacheKey = `vat-expand-${entries.length}-${
    categories.version || "1.0"
  }`;

  return getCachedResult(
    cacheKey,
    () => {
      const tvaCollectedCategoryName = "TVA collectée";
      const tvaDeductibleCategoryName = "TVA déductible";
      const expanded = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (
          entry.amount_type === "ht" &&
          entry.vat_rate_id &&
          entry.ht_amount != null &&
          entry.ttc_amount != null
        ) {
          const isRevenue = entry.type === "revenu";
          const vatAmount = entry.ttc_amount - entry.ht_amount;

          if (Math.abs(vatAmount) > 0.01) {
            expanded.push({
              ...entry,
              amount: entry.ht_amount,
              is_vat_parent: true,
            });

            expanded.push({
              ...entry,
              id: entry.id + "_vat",
              category: isRevenue
                ? tvaCollectedCategoryName
                : tvaDeductibleCategoryName,
              amount: vatAmount,
              description: `TVA sur ${entry.supplier}`,
              is_vat_child: true,
              amount_type: "ttc",
              vat_rate_id: null,
              ht_amount: vatAmount,
              ttc_amount: vatAmount,
            });
          } else {
            expanded.push(entry);
          }
        } else {
          expanded.push(entry);
        }
      }

      return expanded;
    },
    [entries, categories]
  );
};

export const generateVatPaymentEntries = (entries, period, vatRegime) => {
  if (!vatRegime || vatRegime.regime_type === "franchise_en_base") {
    return [];
  }

  const cacheKey = `vat-payment-${period.startDate.getTime()}-${vatRegime.id}`;

  return getCachedResult(
    cacheKey,
    () => {
      let tvaCollected = 0;
      let tvaDeductible = 0;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry.category === "TVA collectée") {
          tvaCollected += getEntryAmountForPeriod(
            entry,
            period.startDate,
            period.endDate
          );
        } else if (entry.category === "TVA déductible") {
          tvaDeductible += getEntryAmountForPeriod(
            entry,
            period.startDate,
            period.endDate
          );
        }
      }

      const netVat = tvaCollected - tvaDeductible;

      if (Math.abs(netVat) < 0.01) {
        return [];
      }

      const paymentDueDate = new Date(period.endDate);
      paymentDueDate.setMonth(
        paymentDueDate.getMonth() + (vatRegime.payment_delay_months || 1)
      );

      if (netVat > 0) {
        return [
          {
            id: `vat_payment_${period.startDate.getTime()}`,
            type: "depense",
            category: "TVA à payer",
            supplier: "État - TVA",
            amount: netVat,
            frequency: "ponctuel",
            date: paymentDueDate.toISOString().split("T")[0],
            startDate: paymentDueDate.toISOString().split("T")[0],
            is_vat_payment: true,
            description: `TVA à payer pour ${period.label}`,
          },
        ];
      } else {
        return [
          {
            id: `vat_credit_${period.startDate.getTime()}`,
            type: "revenu",
            category: "Crédit de TVA",
            supplier: "État - TVA",
            amount: -netVat,
            frequency: "ponctuel",
            date: paymentDueDate.toISOString().split("T")[0],
            startDate: paymentDueDate.toISOString().split("T")[0],
            is_vat_payment: true,
            description: `Crédit de TVA pour ${period.label}`,
          },
        ];
      }
    },
    [entries, period, vatRegime]
  );
};

export const getDeclarationPeriods = (year, periodicity) => {
  const cacheKey = `declaration-periods-${year}-${periodicity}`;

  return getCachedResult(
    cacheKey,
    () => {
      const periods = [];
      switch (periodicity) {
        case "monthly":
          for (let i = 0; i < 12; i++) {
            periods.push({
              startDate: new Date(year, i, 1),
              endDate: new Date(year, i + 1, 0),
            });
          }
          break;
        case "quarterly":
          for (let i = 0; i < 4; i++) {
            periods.push({
              startDate: new Date(year, i * 3, 1),
              endDate: new Date(year, i * 3 + 3, 0),
            });
          }
          break;
        case "annually":
          periods.push({
            startDate: new Date(year, 0, 1),
            endDate: new Date(year, 11, 31),
          });
          break;
      }
      return periods;
    },
    [year, periodicity]
  );
};

export const generateTaxPaymentEntries = (actuals, period, taxConfig) => {
  if (!taxConfig || taxConfig.rate <= 0) {
    return [];
  }

  const cacheKey = `tax-payment-${period.startDate.getTime()}-${taxConfig.id}`;

  return getCachedResult(
    cacheKey,
    () => {
      const { startDate, endDate } = period;
      let baseAmount = 0;

      switch (taxConfig.base_type) {
        case "revenue":
          for (let i = 0; i < actuals.length; i++) {
            const actual = actuals[i];
            if (actual.type === "receivable") {
              const payments = actual.payments || [];
              for (let j = 0; j < payments.length; j++) {
                const payment = payments[j];
                const pDate = new Date(payment.paymentDate);
                if (pDate >= startDate && pDate < endDate) {
                  baseAmount += payment.paidAmount;
                }
              }
            }
          }
          break;

        case "profit":
          let revenue = 0;
          let expense = 0;

          for (let i = 0; i < actuals.length; i++) {
            const actual = actuals[i];
            const payments = actual.payments || [];

            for (let j = 0; j < payments.length; j++) {
              const payment = payments[j];
              const pDate = new Date(payment.paymentDate);
              if (pDate >= startDate && pDate < endDate) {
                if (actual.type === "receivable") {
                  revenue += payment.paidAmount;
                } else if (actual.type === "payable") {
                  expense += payment.paidAmount;
                }
              }
            }
          }

          baseAmount = revenue - expense;
          break;

        case "salary":
          const salarySubCategory = "Salaires, traitements et charges";
          for (let i = 0; i < actuals.length; i++) {
            const actual = actuals[i];
            if (
              actual.type === "payable" &&
              actual.category === salarySubCategory
            ) {
              const payments = actual.payments || [];
              for (let j = 0; j < payments.length; j++) {
                const payment = payments[j];
                const pDate = new Date(payment.paymentDate);
                if (pDate >= startDate && pDate < endDate) {
                  baseAmount += payment.paidAmount;
                }
              }
            }
          }
          break;
        default:
          baseAmount = 0;
      }

      if (baseAmount <= 0) {
        return [];
      }

      const taxAmount = baseAmount * (taxConfig.rate / 100);

      if (taxAmount <= 0) {
        return [];
      }

      const paymentDueDate = new Date(endDate);
      paymentDueDate.setMonth(
        paymentDueDate.getMonth() + (taxConfig.payment_delay_months || 1)
      );

      return [
        {
          id: `tax_payment_${taxConfig.id}_${period.startDate.getTime()}`,
          type: "depense",
          category: taxConfig.name,
          supplier: `État - ${taxConfig.name}`,
          amount: taxAmount,
          frequency: "ponctuel",
          date: paymentDueDate.toISOString().split("T")[0],
          startDate: paymentDueDate.toISOString().split("T")[0],
          is_tax_payment: true,
          description: `${taxConfig.name} pour ${startDate.toLocaleDateString(
            "fr-FR"
          )} - ${endDate.toLocaleDateString("fr-FR")}`,
        },
      ];
    },
    [actuals, period, taxConfig]
  );
};

// Fonction pour vider le cache si nécessaire
export const clearBudgetCalculationsCache = () => {
  calculationCache.clear();
};

// NOUVELLE FONCTION: calculateEntryAmountForPeriod simplifiée
export const calculateEntryAmountForPeriod = (entry, startDate, endDate) => {
  if (!entry || !entry.amount) {
    return 0;
  }

  const frequency = entry.frequency_name || entry.frequency;
  const amount = parseFloat(entry.amount) || 0;

  // Si pas de fréquence, retourner le montant complet
  if (!frequency) {
    return amount;
  }

  const freqLower = frequency.toLowerCase();

  // CORRECTION: Pour "Monsuel" (mensuel), toujours retourner le montant
  if (freqLower === 'monsuel' || freqLower === 'mensuel') {
    return amount;
  }

  // CORRECTION: Pour les autres fréquences récurrentes, retourner le montant
  if (freqLower === 'hebdomadaire' || freqLower === 'bimestriel' ||
      freqLower === 'trimestriel' || freqLower === 'semestriel' ||
      freqLower === 'annuel') {
    return amount;
  }

  // Pour ponctuel, vérifier si la date est dans la période
  if (freqLower === 'ponctuel' || freqLower === 'ponctuelle') {
    const entryDate = entry.date ? new Date(entry.date) : (entry.start_date ? new Date(entry.start_date) : null);
    if (!entryDate) {
      return amount;
    }

    const isInPeriod = entryDate >= startDate && entryDate <= endDate;

    return isInPeriod ? amount : 0;
  }

  // Par défaut, retourner le montant
  return amount;
};

// NOUVELLE FONCTION: calculateActualAmountForPeriod avec priorité real_budget
export const calculateActualAmountForPeriod = (entry, actualTransactions, startDate, endDate, realBudgetData = null) => {
  if (!entry) return 0;

  // PRIORITÉ 1: Données real_budget API
  if (realBudgetData?.real_budget_items?.data) {
    const realBudgetsForEntry = realBudgetData.real_budget_items.data.filter(rb => {
      const matchesBudget = rb.budget_id === entry.budget_id;

      let matchesDate = false;
      if (rb.collection_date) {
        try {
          const collectionDate = new Date(rb.collection_date);
          collectionDate.setHours(0, 0, 0, 0);

          const periodStart = new Date(startDate);
          periodStart.setHours(0, 0, 0, 0);

          const periodEnd = new Date(endDate);
          periodEnd.setHours(23, 59, 59, 999);

          matchesDate = collectionDate >= periodStart && collectionDate <= periodEnd;
        } catch (error) {
          console.error('Erreur de parsing date:', error);
        }
      }

      const isMatch = matchesBudget && matchesDate;
      return isMatch;
    });

    if (realBudgetsForEntry.length > 0) {
      const totalAmount = realBudgetsForEntry.reduce((sum, rb) => {
        const amount = parseFloat(rb.collection_amount) || 0;
        return sum + amount;
      }, 0);

      return totalAmount;
    }
  }

  // PRIORITÉ 2: Utiliser getActualAmountForPeriod du budgetCalculations
  return getActualAmountForPeriod(entry, actualTransactions, startDate, endDate);
};

// NOUVELLE FONCTION: Calcul des positions de trésorerie
export const calculatePeriodPositions = (periods, cashAccounts, groupedData, expandedAndVatEntries, finalActualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses) => {
  if (!periods || periods.length === 0 || !cashAccounts || cashAccounts.length === 0) {
    return periods?.map(() => ({ initial: 0, final: 0, netCashFlow: 0 })) || [];
  }

  const totalInitialBalance = cashAccounts.reduce((sum, account) => {
    return sum + (account.initialBalance || 0);
  }, 0);

  const positions = [];
  let runningBalance = totalInitialBalance;

  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];

    // Importez ces fonctions depuis vos hooks ou créez-les dans ce fichier
    const revenueTotals = calculateGeneralTotals(
      groupedData.entree || [],
      period,
      'entree',
      expandedAndVatEntries,
      finalActualTransactions,
      hasOffBudgetRevenues,
      hasOffBudgetExpenses
    );

    const expenseTotals = calculateGeneralTotals(
      groupedData.sortie || [],
      period,
      'sortie',
      expandedAndVatEntries,
      finalActualTransactions,
      hasOffBudgetRevenues,
      hasOffBudgetExpenses
    );

    // CORRECTION: Flux de trésorerie = Entrées réelles - Sorties réelles
    const netCashFlow = (revenueTotals.actual || 0) - (expenseTotals.actual || 0);

    const initialBalance = runningBalance;
    const finalBalance = initialBalance + netCashFlow;

    runningBalance = finalBalance;

    positions.push({
      initial: initialBalance,
      final: finalBalance,
      netCashFlow: netCashFlow
    });
  }

  return positions;
};

// Fonction helper pour la description
export const getEntryDescription = (entry) => {
  return entry.description ||
      entry.budget_description ||
      entry.amount_type_description ||
      'Aucune description disponible';
};

export const getTotalsForPeriod = (entries, periodStart, periodEnd, actualTransactions = []) => {
  if (!entries || !Array.isArray(entries)) {
    return { totalEntree: 0, totalSortie: 0 };
  }

  let totalEntree = 0;
  let totalSortie = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Total prévisionnel (budget)
    const budgetAmount = getEntryAmountForPeriod(entry, periodStart, periodEnd);

    // Total réel (paiements)
    const actualAmount = getActualAmountForPeriod(
      entry,
      actualTransactions,
      periodStart,
      periodEnd
    );

    // Somme des deux (prévisionnel + réel)
    const totalAmount = budgetAmount + actualAmount;

    if (entry.type === "revenu") {
      totalEntree += totalAmount;
    } else if (entry.type === "depense") {
      totalSortie += totalAmount;
    }
  }

  return {
    totalEntree,
    totalSortie,
  };
};
