import { getEntryAmountForPeriod, getActualAmountForPeriod } from '../utils/budgetCalculations';

export const calculateMainCategoryTotals = (entries, period, actualTransactions) => {
    if (!entries || !period) return { budget: 0, actual: 0 };
    
    const budget = entries.reduce(
        (sum, entry) => sum + getEntryAmountForPeriod(entry, period.startDate, period.endDate),
        0
    );

    const actual = entries.reduce(
        (sum, entry) => sum + getActualAmountForPeriod(entry, actualTransactions, period.startDate, period.endDate),
        0
    );

    return { budget, actual };
};