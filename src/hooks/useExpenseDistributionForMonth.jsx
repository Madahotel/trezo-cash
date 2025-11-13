import { useMemo } from "react";
export const useExpenseDistributionForMonth = (actualTransactions, categories, settings) => {
    return useMemo(() => {
        if (!settings || !categories || !categories.expense) return [];
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const expensesThisMonth = actualTransactions.filter(actual => 
            actual.type === 'payable' && 
            (actual.payments || []).some(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
            })
        );

        const dataByMainCategory = {};
        const mainCategoryMap = new Map();
        categories.expense.forEach(mc => {
            if (mc && mc.subCategories) {
                mc.subCategories.forEach(sc => {
                    mainCategoryMap.set(sc.name, mc.name);
                });
            }
        });

        expensesThisMonth.forEach(actual => {
            const mainCategoryName = mainCategoryMap.get(actual.category) || 'Autres';
            const paymentAmount = (actual.payments || []).reduce((sum, p) => {
                const paymentDate = new Date(p.paymentDate);
                return (paymentDate >= startOfMonth && paymentDate <= endOfMonth) ? sum + p.paidAmount : sum;
            }, 0);
            dataByMainCategory[mainCategoryName] = (dataByMainCategory[mainCategoryName] || 0) + paymentAmount;
        });

        return Object.entries(dataByMainCategory)
          .map(([name, value]) => ({ name, value }))
          .filter(item => item.value > 0)
          .sort((a, b) => b.value - a.value);
    }, [actualTransactions, categories, settings]);
};
