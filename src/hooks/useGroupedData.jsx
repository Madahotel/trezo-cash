import { useMemo } from 'react';

export const useGroupedData = (entries, categories, isRowVisibleInPeriods) => {
    return useMemo(() => {

        if (!entries || entries.length === 0) {
            return { entree: [], sortie: [] };
        }

        // CORRECTION: Utiliser les bons types (entree/sortie au lieu de revenu/depense)
        const entreeEntries = entries.filter(entry => entry.type === 'entree');
        const sortieEntries = entries.filter(entry => entry.type === 'sortie');

        // CORRECTION: Créer des groupes basés sur mainCategory ou category
        const createGroups = (entriesArray, type) => {
            const groupsMap = {};

            entriesArray.forEach(entry => {
                // CORRECTION: Utiliser category_name ou category
                const groupName = entry.category_name || entry.category || `${type}-non-categorise`;

                if (!groupsMap[groupName]) {
                    groupsMap[groupName] = {
                        id: groupName,
                        name: groupName,
                        entries: []
                    };
                }
                groupsMap[groupName].entries.push(entry);
            });

            const groups = Object.values(groupsMap);

            return groups;
        };

        const entree = createGroups(entreeEntries, 'entree');
        const sortie = createGroups(sortieEntries, 'sortie');

        const result = { entree, sortie };

        return result;
    }, [entries, categories, isRowVisibleInPeriods]);
};