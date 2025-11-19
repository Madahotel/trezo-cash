import { calculateMainCategoryTotals } from './calculateMainCategoryTotals';

export const calculateGeneralTotals = (categories, period, type, allEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses) => {
    if (!categories || !period) return { budget: 0, actual: 0 };

    return Object.values(categories).reduce(
        (acc, category) => {
            if (category && category.entries) {
                const categoryTotals = calculateMainCategoryTotals(category.entries, period, actualTransactions);
                acc.budget += categoryTotals.budget;
                acc.actual += categoryTotals.actual;
            }
            return acc;
        },
        { budget: 0, actual: 0 }
    );
};