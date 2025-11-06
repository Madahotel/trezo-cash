import { useMemo } from "react";
export const useTrezoScore = (dataState, uiState) => {
    const { loans = [], categories, allCashAccounts, allActuals } = dataState;
    const { actualTransactions, budgetEntries, activeProjectId, isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);
    const accountBalances = useAccountBalances(allCashAccounts, allActuals, activeProjectId, isConsolidated, isCustomConsolidated, dataState.consolidatedViews);

    return useMemo(() => {
        const today = new Date();
        const sixMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 6));

        const recentActuals = actualTransactions.filter(a => (a.payments || []).some(p => new Date(p.paymentDate) >= sixMonthsAgo));

        const monthlyMetrics = Array.from({ length: 6 }).map((_, i) => {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthStart = new Date(monthDate);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

            const monthlyIncome = recentActuals
                .filter(a => a.type === 'receivable')
                .flatMap(a => a.payments || [])
                .filter(p => {
                    const pDate = new Date(p.paymentDate);
                    return pDate >= monthStart && pDate <= monthEnd;
                })
                .reduce((sum, p) => sum + p.paidAmount, 0);

            const monthlyCriticalExpenses = recentActuals
                .filter(a => {
                    if (!categories || !categories.expense) return false;
                    const mainCat = categories.expense.find(mc => mc && mc.subCategories && mc.subCategories.some(sc => sc.name === a.category));
                    const subCat = mainCat?.subCategories.find(sc => sc.name === a.category);
                    return a.type === 'payable' && subCat?.criticality === 'critical';
                })
                .flatMap(a => a.payments || [])
                .filter(p => {
                    const pDate = new Date(p.paymentDate);
                    return pDate >= monthStart && pDate <= monthEnd;
                })
                .reduce((sum, p) => sum + p.paidAmount, 0);

            const monthlyTotalExpenses = recentActuals
                .filter(a => a.type === 'payable')
                .flatMap(a => a.payments || [])
                .filter(p => {
                    const pDate = new Date(p.paymentDate);
                    return pDate >= monthStart && pDate <= monthEnd;
                })
                .reduce((sum, p) => sum + p.paidAmount, 0);

            return { monthlyIncome, monthlyCriticalExpenses, monthlyTotalExpenses };
        });

        const avgMonthlyIncome = monthlyMetrics.reduce((sum, m) => sum + m.monthlyIncome, 0) / 6;
        const avgMonthlyCriticalExpenses = monthlyMetrics.reduce((sum, m) => sum + m.monthlyCriticalExpenses, 0) / 6;
        const avgMonthlyTotalExpenses = monthlyMetrics.reduce((sum, m) => sum + m.monthlyTotalExpenses, 0) / 6;

        // Pillar 1: Critical Expenses Coverage
        let coverageScore = 0;
        let coverageText = '';
        if (avgMonthlyCriticalExpenses > 0) {
            const margin = (avgMonthlyIncome - avgMonthlyCriticalExpenses) / avgMonthlyCriticalExpenses;
            coverageText = `Marge de ${(margin * 100).toFixed(0)}%`;
            if (margin > 0.5) coverageScore = 30;
            else if (margin > 0.25) coverageScore = 24;
            else if (margin > 0) coverageScore = 18;
            else if (margin > -0.1) coverageScore = 12;
            else coverageScore = 6;
        } else if (avgMonthlyIncome > 0) {
            coverageScore = 30; // No critical expenses, excellent coverage
            coverageText = 'Aucune dépense critique';
        }

        // Pillar 2: Resource Stability (simplified)
        const incomeSources = new Set(recentActuals.filter(a => a.type === 'receivable').map(a => a.thirdParty));
        const recurringIncomeEntries = budgetEntries.filter(e => e.type === 'revenu' && e.frequency !== 'ponctuel' && e.frequency !== 'irregulier');
        let stabilityScore = 5;
        if (recurringIncomeEntries.length > 0) stabilityScore = 20;
        if (incomeSources.size > 2) stabilityScore = Math.min(25, stabilityScore + 5);
        if (incomeSources.size <= 1 && recurringIncomeEntries.length === 0) stabilityScore = 10;

        // Pillar 3: Expense Management
        let expenseMgmtScore = 4;
        let savingsRateText = '';
        if (avgMonthlyIncome > 0) {
            const savingsRate = (avgMonthlyIncome - avgMonthlyTotalExpenses) / avgMonthlyIncome;
            savingsRateText = `Taux d'épargne de ${(savingsRate * 100).toFixed(0)}%`;
            if (savingsRate > 0.2) expenseMgmtScore = 20;
            else if (savingsRate > 0.1) expenseMgmtScore = 16;
            else if (savingsRate > 0.05) expenseMgmtScore = 12;
            else if (savingsRate > 0) expenseMgmtScore = 8;
        }

        // Pillar 4: Emergency Savings
        const availableSavings = accountBalances.filter(acc => acc.mainCategoryId === 'savings').reduce((sum, acc) => sum + acc.balance, 0);
        let autonomyScore = 3;
        let autonomyText = '';
        if (avgMonthlyCriticalExpenses > 0) {
            const autonomyMonths = availableSavings / avgMonthlyCriticalExpenses;
            autonomyText = `Autonomie de ${autonomyMonths.toFixed(1)} mois`;
            if (autonomyMonths > 6) autonomyScore = 15;
            else if (autonomyMonths > 3) autonomyScore = 12;
            else if (autonomyMonths > 1) autonomyScore = 9;
            else if (autonomyMonths > 0.5) autonomyScore = 6;
        } else if (availableSavings > 0) {
            autonomyScore = 15; // No critical expenses, infinite autonomy
            autonomyText = 'Autonomie infinie';
        }

        // Pillar 5: Debt
        const monthlyLoanRepayments = loans.filter(l => l.type === 'borrowing').reduce((sum, l) => sum + l.monthlyPayment, 0);
        let debtScore = 10;
        if (avgMonthlyIncome > 0) {
            const debtRatio = monthlyLoanRepayments / avgMonthlyIncome;
            if (debtRatio > 0.6) debtScore = 2;
            else if (debtRatio > 0.45) debtScore = 4;
            else if (debtRatio > 0.3) debtScore = 6;
            else if (debtRatio > 0.15) debtScore = 8;
        }

        const totalScore = Math.round(coverageScore + stabilityScore + expenseMgmtScore + autonomyScore + debtScore);

        let evaluation, color, recommendations = [], strengths = [], weaknesses = [];
        if (totalScore >= 90) {
            evaluation = 'Excellente';
            color = 'blue';
            recommendations.push("Votre situation est très saine. Pensez à investir votre épargne excédentaire.");
        } else if (totalScore >= 70) {
            evaluation = 'Bonne';
            color = 'green';
            recommendations.push("Votre gestion est solide. Surveillez la stabilité de vos revenus.");
        } else if (totalScore >= 50) {
            evaluation = 'Correcte';
            color = 'yellow';
            recommendations.push("Attention aux imprévus. Renforcez votre épargne de précaution.");
        } else if (totalScore >= 30) {
            evaluation = 'Fragile';
            color = 'orange';
            recommendations.push("Situation tendue. Concentrez-vous sur la réduction des dépenses non essentielles.");
        } else {
            evaluation = 'Critique';
            color = 'red';
            recommendations.push("Danger immédiat. Consultez un conseiller financier rapidement.");
        }

        // Populate strengths and weaknesses
        if (coverageScore >= 24) strengths.push({ pillar: 'Couverture des Dépenses Critiques', text: `Dépenses critiques bien couvertes (${coverageText})` }); else weaknesses.push({ pillar: 'Couverture des Dépenses Critiques', text: `Marge de sécurité faible (${coverageText})` });
        if (stabilityScore >= 20) strengths.push({ pillar: 'Stabilité des Ressources', text: 'Revenus stables' }); else weaknesses.push({ pillar: 'Stabilité des Ressources', text: 'Revenus variables à surveiller' });
        if (expenseMgmtScore >= 16) strengths.push({ pillar: 'Maîtrise des Dépenses', text: `Taux d'épargne satisfaisant (${savingsRateText})` }); else weaknesses.push({ pillar: 'Maîtrise des Dépenses', text: `Épargne à améliorer (${savingsRateText})` });
        if (autonomyScore >= 12) strengths.push({ pillar: 'Épargne de Précaution', text: `Bonne épargne de précaution (${autonomyText})` }); else weaknesses.push({ pillar: 'Épargne de Précaution', text: `Épargne de précaution faible (${autonomyText})` });
        if (debtScore >= 8) strengths.push({ pillar: 'Endettement & Engagements', text: 'Endettement maîtrisé' }); else weaknesses.push({ pillar: 'Endettement & Engagements', text: 'Endettement à surveiller' });

        return { score: totalScore, evaluation, color, strengths, weaknesses, recommendations };

    }, [budgetEntries, actualTransactions, accountBalances, categories, loans]);
};
