import { useMemo } from "react";
export const useAccountBalances = (allCashAccounts, allActuals, activeProjectId, isConsolidated, isCustomConsolidated, consolidatedViews) => {
    return useMemo(() => {
        let accountsToProcess = [];
        if (isConsolidated) {
            accountsToProcess = Object.values(allCashAccounts).flat();
        } else if (isCustomConsolidated) {
            const viewId = activeProjectId?.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            if (view && view.project_ids) {
                accountsToProcess = view.project_ids.flatMap(id => allCashAccounts[id] || []);
            }
        } else {
            accountsToProcess = allCashAccounts[activeProjectId] || [];
        }

        if (!accountsToProcess) return [];

        const allActualsFlat = Object.values(allActuals).flat();

        return accountsToProcess.map(account => {
            let currentBalance = parseFloat(account.initialBalance) || 0;
            const accountPayments = allActualsFlat
                .flatMap(actual => (actual.payments || []).filter(p => p.cashAccount === account.id).map(p => ({ ...p, type: actual.type })));

            for (const payment of accountPayments) {
                if (payment.type === 'receivable') {
                    currentBalance += payment.paidAmount;
                } else if (payment.type === 'payable') {
                    currentBalance -= payment.paidAmount;
                }
            }

            const blockedForProvision = allActualsFlat
                .filter(actual => actual.isProvision && actual.provisionDetails?.destinationAccountId === account.id && actual.status !== 'paid')
                .reduce((sum, actual) => {
                    const paidAmount = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
                    return sum + (actual.amount - paidAmount);
                }, 0);

            return {
                ...account,
                balance: currentBalance,
                blockedForProvision: blockedForProvision,
                actionableBalance: currentBalance - blockedForProvision,
            };
        });
    }, [allCashAccounts, allActuals, activeProjectId, isConsolidated, isCustomConsolidated, consolidatedViews]);
};