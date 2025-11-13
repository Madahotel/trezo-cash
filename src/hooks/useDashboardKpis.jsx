import { useMemo } from "react";
export const useDashboardKpis = (dataState, uiState) => {
    const { actualTransactions } = useActiveProjectData(dataState, uiState);
    const { settings } = dataState;
    const balances = useAccountBalances(dataState.allCashAccounts, dataState.allActuals, uiState.activeProjectId, uiState.isConsolidated, uiState.isCustomConsolidated, dataState.consolidatedViews);

    return useMemo(() => {
        if (!settings) {
             return { totalActionableBalance: 0, totalOverduePayables: 0, totalOverdueReceivables: 0, overdueItems: [], totalSavings: 0, totalProvisions: 0 };
        }
        const today = getTodayInTimezone(settings.timezoneOffset);
        const overdueItems = actualTransactions
            .filter(actual => {
                const dueDate = new Date(actual.date);
                return ['pending', 'partially_paid', 'partially_received'].includes(actual.status) && dueDate < today;
            })
            .map(actual => {
                const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0);
                return { ...actual, remainingAmount: actual.amount - totalPaid };
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const totalOverduePayables = overdueItems.filter(i => i.type === 'payable').reduce((sum, i) => sum + i.remainingAmount, 0);
        const totalOverdueReceivables = overdueItems.filter(i => i.type === 'receivable').reduce((sum, i) => sum + i.remainingAmount, 0);

        const totalActionableBalance = balances.filter(acc => ['bank', 'cash', 'mobileMoney'].includes(acc.mainCategoryId)).reduce((sum, acc) => sum + acc.actionableBalance, 0);
        const totalSavings = balances.filter(acc => acc.mainCategoryId === 'savings').reduce((sum, acc) => sum + acc.balance, 0);
        const totalProvisions = balances.filter(acc => acc.mainCategoryId === 'provisions').reduce((sum, acc) => sum + acc.balance, 0);

        return { totalActionableBalance, totalOverduePayables, totalOverdueReceivables, overdueItems, totalSavings, totalProvisions };
    }, [actualTransactions, settings, balances]);
};