import { useMemo } from 'react';

export const useGroupedData = (entries, categories, isRowVisibleInPeriods) => {
    return useMemo(() => {
        console.log('=== useGroupedData SIMPLIFIED ===');
        console.log('Entries:', entries?.length);
        console.log('Categories keys:', categories ? Object.keys(categories) : 'none');

        if (!entries || entries.length === 0) {
            return { entree: [], sortie: [] };
        }

        // Séparer par type
        const entreeEntries = entries.filter(entry => entry.type === 'revenu');
        const sortieEntries = entries.filter(entry => entry.type === 'depense');

        // CORRECTION: Créer des groupes basés sur mainCategory ou category
        const createGroups = (entriesArray, type) => {
            const groupsMap = {};
            
            entriesArray.forEach(entry => {
                // Utiliser mainCategory si disponible, sinon category
                const groupName = entry.mainCategory || entry.category || `${type}-non-categorise`;
                
                if (!groupsMap[groupName]) {
                    groupsMap[groupName] = {
                        id: groupName,
                        name: groupName,
                        entries: []
                    };
                }
                groupsMap[groupName].entries.push(entry);
            });

            return Object.values(groupsMap);
        };

        const entree = createGroups(entreeEntries, 'entree');
        const sortie = createGroups(sortieEntries, 'sortie');

        console.log('Groupes créés:', {
            entree: entree.length,
            sortie: sortie.length,
            totalEntries: entree.reduce((sum, cat) => sum + cat.entries.length, 0) + 
                         sortie.reduce((sum, cat) => sum + cat.entries.length, 0)
        });

        return { entree, sortie };
    }, [entries, categories, isRowVisibleInPeriods]);
};