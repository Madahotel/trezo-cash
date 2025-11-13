import { useCallback, useMemo } from 'react';
import { useActiveProjectData } from './useActiveProjectData';
import { useProcessedEntries } from './useProcessedEntries';
import { useGroupedData } from './useGroupedData';
import { getTodayInTimezone } from '../utils/getTodayInTimezone';
import { calculatePeriodPositions } from '../hooks/calculatePeriodPositions';
import { calculateGeneralTotals } from '../hooks/calculateGeneralTotals';

export const useCashflowChartData = (dataState, uiState, periods) => {
    const { categories, vatRegimes, taxConfigs } = dataState;
    const { budgetEntries, actualTransactions, cashAccounts, activeProjectId, isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);

    const isRowVisible = useCallback(() => true, []);
    const processedEntries = useProcessedEntries(budgetEntries, actualTransactions, categories, vatRegimes, taxConfigs, activeProjectId, periods, isConsolidated, isCustomConsolidated);
    const groupedData = useGroupedData(processedEntries, categories, isRowVisible);
    const hasOffBudgetRevenues = useMemo(() => processedEntries.some(e => e.isOffBudget && e.type === 'revenu'), [processedEntries]);
    const hasOffBudgetExpenses = useMemo(() => processedEntries.some(e => e.isOffBudget && e.type === 'depense'), [processedEntries]);

    return useMemo(() => {
        if (!periods || periods.length === 0 || !dataState.settings) {
            return { labels: [], inflows: [], outflows: [], actualBalance: [], projectedBalance: [] };
        }

        const today = getTodayInTimezone(dataState.settings.timezoneOffset);
        let todayIndex = periods.findIndex(p => today >= p.startDate && today < p.endDate);
        if (todayIndex === -1) {
            if (periods.length > 0 && today < periods[0].startDate) todayIndex = -1;
            else if (periods.length > 0 && today >= periods[periods.length - 1].endDate) todayIndex = periods.length - 1;
        }

        const periodPositions = calculatePeriodPositions(periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, dataState.settings, processedEntries);

        const periodFlows = periods.map((period, index) => {
            const isPastOrPresent = index <= todayIndex;

            const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', processedEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
            const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', processedEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);

            if (isPastOrPresent) {
                return { inflow: revenueTotals.actual, outflow: expenseTotals.actual };
            } else {
                return { inflow: revenueTotals.budget, outflow: expenseTotals.budget };
            }
        });

        const balanceData = periodPositions.map(p => p.final);
        const actualBalance = balanceData.map((val, i) => i <= todayIndex ? val : null);
        const projectedBalance = balanceData.map((val, i) => i >= todayIndex ? val : null);

        if (todayIndex >= 0 && todayIndex < balanceData.length) {
            projectedBalance[todayIndex] = actualBalance[todayIndex];
        }

        return {
            labels: periods.map(p => p.label),
            periods,
            inflows: periodFlows.map(f => ({ value: f.inflow })),
            outflows: periodFlows.map(f => ({ value: f.outflow })),
            actualBalance,
            projectedBalance,
        };
    }, [periods, cashAccounts, actualTransactions, dataState.settings, processedEntries, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses]);
};