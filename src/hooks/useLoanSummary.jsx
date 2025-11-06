import { useMemo } from "react";
export const useLoanSummary = (dataState, uiState) => {
    const { categories } = dataState;
    const { budgetEntries, actualTransactions } = useActiveProjectData(dataState, uiState);

    return useMemo(() => {
        if (!categories || !categories.expense || !categories.revenue) {
            return { borrowings: [], lendings: [] };
        }

        const processLoans = (entryType) => {
            const isBorrowing = entryType === 'depense';
            const mainCatName = isBorrowing ? 'FINANCEMENTS & CRÉDITS (Remboursements)' : 'FINANCEMENTS & CRÉDITS (Encaissements)';
            const mainCat = (isBorrowing ? categories.expense : categories.revenue).find(c => c && c.name === mainCatName);

            if (!mainCat || !mainCat.subCategories) {
                return [];
            }
            const subCatNames = mainCat.subCategories.map(sc => sc.name);

            const loanEntries = budgetEntries.filter(e => e.type === entryType && subCatNames.includes(e.category));

            const groupedByLoan = loanEntries.reduce((acc, entry) => {
                const key = `${entry.supplier}-${entry.category}`;
                if (!acc[key]) {
                    acc[key] = {
                        id: entry.id,
                        thirdParty: entry.supplier,
                        category: entry.category,
                        installmentAmount: entry.amount,
                        entries: [],
                    };
                }
                acc[key].entries.push(entry);
                return acc;
            }, {});

            return Object.values(groupedByLoan).map(group => {
                const unsettledActuals = group.entries.flatMap(entry =>
                    actualTransactions.filter(a => a.budgetId === entry.id && ['pending', 'partially_paid', 'partially_received'].includes(a.status))
                );

                const totalRemaining = unsettledActuals.reduce((sum, actual) => {
                    const paidAmount = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
                    return sum + (actual.amount - paidAmount);
                }, 0);

                const remainingInstallments = unsettledActuals.length;

                if (totalRemaining <= 0) return null;

                return {
                    id: group.id,
                    thirdParty: group.thirdParty,
                    category: group.category,
                    totalRemaining,
                    remainingInstallments,
                    installmentAmount: group.installmentAmount,
                };
            }).filter(Boolean);
        };

        const borrowings = processLoans('depense');
        const lendings = processLoans('revenu');

        return { borrowings, lendings };

    }, [budgetEntries, actualTransactions, categories]);
};
