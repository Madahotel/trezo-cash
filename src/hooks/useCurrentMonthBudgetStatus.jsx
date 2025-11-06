import { useMemo } from "react";
export const useCurrentMonthBudgetStatus = (dataState, uiState) => {
    const { actualTransactions, budgetEntries, activeProjectId, isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);
    const { categories, vatRegimes, settings, taxConfigs } = dataState;

    const period = useMemo(() => {
        if (!settings) return null;
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return { startDate: startOfMonth, endDate: endOfMonth };
    }, [settings]);

    const processedEntries = useProcessedEntries(budgetEntries, actualTransactions, categories, vatRegimes, taxConfigs, activeProjectId, period ? [period] : [], isConsolidated, isCustomConsolidated);

    return useMemo(() => {
        if (!period) return { totalBudgetedIncome: 0, totalBudgetedExpense: 0, totalActualIncome: 0, totalActualExpense: 0 };
        const { startDate, endDate } = period;

        const totalBudgetedIncome = processedEntries
            .filter(e => e.type === 'revenu')
            .reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, startDate, endDate), 0);

        const totalBudgetedExpense = processedEntries
            .filter(e => e.type === 'depense')
            .reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, startDate, endDate), 0);

        const totalActualIncome = actualTransactions
            .filter(a => a.type === 'receivable')
            .flatMap(a => a.payments || [])
            .filter(p => {
                const pDate = new Date(p.paymentDate);
                return pDate >= startDate && pDate <= endDate;
            })
            .reduce((sum, p) => sum + p.paidAmount, 0);

        const totalActualExpense = actualTransactions
            .filter(a => a.type === 'payable')
            .flatMap(a => a.payments || [])
            .filter(p => {
                const pDate = new Date(p.paymentDate);
                return pDate >= startDate && pDate <= endDate;
            })
            .reduce((sum, p) => sum + p.paidAmount, 0);

        return {
            totalBudgetedIncome,
            totalBudgetedExpense,
            totalActualIncome,
            totalActualExpense,
        };
    }, [processedEntries, actualTransactions, period]);
};
