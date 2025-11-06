export const calculateGeneralTotals = (mainCategories, period, type, allEntriesForCalc, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses) => {
    const totals = (mainCategories || []).reduce((acc, mainCategory) => {
        const categoryTotals = calculateMainCategoryTotals(mainCategory.entries, period, actualTransactions);
        acc.budget += categoryTotals.budget;
        acc.actual += categoryTotals.actual;
        return acc;
    }, { budget: 0, actual: 0 });

    if (type === 'entree' && hasOffBudgetRevenues) {
        const offBudgetTotals = calculateOffBudgetTotalsForPeriod('revenu', period, allEntriesForCalc, actualTransactions);
        totals.budget += offBudgetTotals.budget;
        totals.actual += offBudgetTotals.actual;
    } else if (type === 'sortie' && hasOffBudgetExpenses) {
        const offBudgetTotals = calculateOffBudgetTotalsForPeriod('depense', period, allEntriesForCalc, actualTransactions);
        totals.budget += offBudgetTotals.budget;
        totals.actual += offBudgetTotals.actual;
    }
    return totals;
};
