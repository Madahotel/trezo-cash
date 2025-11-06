import { useMemo } from "react";
export const useProcessedEntries = (budgetEntries, actualTransactions, categories, vatRegimes, taxConfigs, activeProjectId, periods, isConsolidated, isCustomConsolidated) => {
    return useMemo(() => {
        if (!categories) return [];
        const expanded = expandVatEntries(budgetEntries, categories);
        let dynamicEntries = [...expanded];

        if (isConsolidated || isCustomConsolidated || !periods || periods.length === 0) {
            return dynamicEntries;
        }

        // VAT entries generation
        const vatRegime = vatRegimes[activeProjectId];
        if (vatRegime) {
            const dynamicVatEntries = periods.flatMap(period => generateVatPaymentEntries(expanded, period, vatRegime));
            dynamicEntries.push(...dynamicVatEntries);
        }

        // Tax entries generation
        if (taxConfigs && Array.isArray(taxConfigs) && taxConfigs.length > 0) {
            const currentYear = periods[0].startDate.getFullYear();
            const dynamicTaxEntries = taxConfigs.flatMap(taxConfig => {
                const taxPeriods = getDeclarationPeriods(currentYear, taxConfig.declaration_periodicity);
                
                return taxPeriods.flatMap(taxPeriod => {
                    const overlaps = periods.some(p => p.startDate < taxPeriod.endDate && p.endDate > taxPeriod.startDate);
                    if (overlaps) {
                        return generateTaxPaymentEntries(actualTransactions, taxPeriod, taxConfig);
                    }
                    return [];
                });
            });
            dynamicEntries.push(...dynamicTaxEntries);
        }

        return dynamicEntries;
    }, [budgetEntries, actualTransactions, categories, vatRegimes, taxConfigs, activeProjectId, periods, isConsolidated, isCustomConsolidated]);
};