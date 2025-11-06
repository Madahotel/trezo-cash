import { useMemo } from "react";
export const useDailyForecast = (dataState, uiState, days = 30) => {
    const { settings, categories, vatRegimes, taxConfigs } = dataState;
    const { budgetEntries, actualTransactions, cashAccounts, activeProjectId, isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);

    const periods = useMemo(() => {
        if (!settings) return [];
        const today = getTodayInTimezone(settings.timezoneOffset);
        return Array.from({ length: days }).map((_, i) => {
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() + i);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            return {
                label: startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                startDate,
                endDate,
            };
        });
    }, [settings, days]);

    const isRowVisible = useCallback(() => true, []);
    const processedEntries = useProcessedEntries(budgetEntries, actualTransactions, categories, vatRegimes, taxConfigs, activeProjectId, periods, isConsolidated, isCustomConsolidated);
    const groupedData = useGroupedData(processedEntries, categories, isRowVisible);
    const hasOffBudgetRevenues = useMemo(() => processedEntries.some(e => e.isOffBudget && e.type === 'revenu'), [processedEntries]);
    const hasOffBudgetExpenses = useMemo(() => processedEntries.some(e => e.isOffBudget && e.type === 'depense'), [processedEntries]);

    return useMemo(() => {
        if (!settings || periods.length === 0) return { labels: [], data: [] };
        const positions = calculatePeriodPositions(periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, processedEntries);
        return {
            labels: periods.map(p => p.label),
            data: positions.map(p => p.final),
        };
    }, [settings, periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, processedEntries]);
};