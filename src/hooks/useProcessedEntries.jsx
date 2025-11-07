// useProcessedEntries.jsx
import { useMemo } from "react";
import { expandVatEntries } from '../pages/clients/analyse/ExpenseAnalysisView'; // Importez la fonction pure

export const useProcessedEntries = (budgetEntries, actualTransactions, categories, vatRegimes, taxConfigs, activeProjectId, periods, isConsolidated, isCustomConsolidated) => {
    return useMemo(() => {
        if (!categories) return [];
        
        // Gestion sécurisée de expandVatEntries
        let expanded;
        try {
            expanded = expandVatEntries(budgetEntries, categories);
        } catch (error) {
            console.error('Error expanding VAT entries:', error);
            expanded = [];
        }
        
        // S'assurer que expanded est itérable
        const safeExpanded = Array.isArray(expanded) ? expanded : [];
        let dynamicEntries = [...safeExpanded];

        if (isConsolidated || isCustomConsolidated || !periods || periods.length === 0) {
            return dynamicEntries;
        }

        // Reste de votre logique...
        // VAT entries generation
        const vatRegime = vatRegimes?.[activeProjectId];
        if (vatRegime) {
            const dynamicVatEntries = periods.flatMap(period => 
                generateVatPaymentEntries(safeExpanded, period, vatRegime) || []
            );
            dynamicEntries.push(...dynamicVatEntries);
        }

        // Tax entries generation
        const safeTaxConfigs = Array.isArray(taxConfigs) ? taxConfigs : [];
        if (safeTaxConfigs.length > 0) {
            const currentYear = periods[0]?.startDate?.getFullYear();
            if (currentYear) {
                const dynamicTaxEntries = safeTaxConfigs.flatMap(taxConfig => {
                    const taxPeriods = getDeclarationPeriods(currentYear, taxConfig.declaration_periodicity) || [];
                    
                    return taxPeriods.flatMap(taxPeriod => {
                        const overlaps = periods.some(p => 
                            p?.startDate < taxPeriod?.endDate && p?.endDate > taxPeriod?.startDate
                        );
                        if (overlaps) {
                            return generateTaxPaymentEntries(actualTransactions, taxPeriod, taxConfig) || [];
                        }
                        return [];
                    });
                });
                dynamicEntries.push(...dynamicTaxEntries);
            }
        }

        return dynamicEntries;
    }, [budgetEntries, actualTransactions, categories, vatRegimes, taxConfigs, activeProjectId, periods, isConsolidated, isCustomConsolidated]);
};