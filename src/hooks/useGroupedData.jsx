import { useMemo } from "react";
export const useGroupedData = (processedEntries, categories, isRowVisibleInPeriods) => {
    const isFilterFunction = typeof isRowVisibleInPeriods === 'function';

    return useMemo(() => {
        if (!categories || !processedEntries) return { entree: [], sortie: [] };

        const safeIsRowVisibleInPeriods = isFilterFunction ? isRowVisibleInPeriods : () => true;

        const groupByType = (type) => {
            const catType = type === 'entree' ? 'revenue' : 'expense';
            if (!categories[catType] || !Array.isArray(categories[catType])) return [];

            const entriesForType = processedEntries.filter(e => e.type === (type === 'entree' ? 'revenu' : 'depense'));

            return categories[catType].map(mainCat => {
                if (!mainCat || !Array.isArray(mainCat.subCategories)) return null;

                const entriesForMainCat = entriesForType.filter(entry => {
                    const isInCategory = mainCat.subCategories.some(sc => sc && sc.name === entry.category);
                    const isVatEntry = (entry.is_vat_child || entry.is_vat_payment) && mainCat.name === 'IMPÔTS & CONTRIBUTIONS';
                    const isTaxEntry = entry.is_tax_payment && mainCat.name === 'IMPÔTS & CONTRIBUTIONS';
                    return isInCategory || isVatEntry || isTaxEntry;
                });

                if (entriesForMainCat.length === 0) return null;

                const visibleEntries = entriesForMainCat.filter(safeIsRowVisibleInPeriods);
                if (visibleEntries.length === 0) return null;

                return { ...mainCat, entries: visibleEntries };

            }).filter(Boolean);
        };
        return { entree: groupByType('entree'), sortie: groupByType('sortie') };
    }, [processedEntries, categories, isRowVisibleInPeriods, isFilterFunction]);
};