import { useMemo } from "react";
import { calculatePeriodPositions } from "./calculatePeriodPositions";

export const usePeriodPositions = (periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries) => {
    return useMemo(() =>
        calculatePeriodPositions(periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries),
        [periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries]
    );
};
