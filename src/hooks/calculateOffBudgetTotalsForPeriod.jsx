export const calculateOffBudgetTotalsForPeriod = (type, period, entries, actualTransactions) => {
    const offBudgetEntries = entries.filter(e => e.isOffBudget && e.type === type);
    const budget = offBudgetEntries.reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, period.startDate, period.endDate), 0);
    const actual = offBudgetEntries.reduce((sum, entry) => sum + getActualAmountForPeriod(entry, actualTransactions, period.startDate, period.endDate), 0);
    return { budget, actual };
};