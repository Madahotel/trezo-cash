import { useMemo } from "react";
export const useActiveProjectData = (dataState, uiState) => {
    const { allEntries = {}, allActuals = {}, allCashAccounts = {}, projects = [], consolidatedViews = [], settings } = dataState;
    const { activeProjectId } = uiState;

  return useMemo(() => {
        if (!settings) {
            return { budgetEntries: [], actualTransactions: [], cashAccounts: [], activeProject: null, isConsolidated: false, isCustomConsolidated: false };
        }
        const activeProjectIdString = String(activeProjectId || '');
        
        const isConsolidated = activeProjectIdString === 'consolidated';
        const isCustomConsolidated = activeProjectIdString.startsWith('consolidated_view_');

        let budgetEntries = [];
        let actualTransactions = [];
        let cashAccounts = [];
        let activeProject = null;

        if (isConsolidated) {
            budgetEntries = Object.values(allEntries).flat();
            actualTransactions = Object.values(allActuals).flat();
            cashAccounts = Object.values(allCashAccounts).flat();
            activeProject = { 
                id: 'consolidated', 
                name: 'Projet consolidé', 
                currency: settings.currency,
                display_unit: settings.displayUnit,
                decimal_places: settings.decimalPlaces
            };
        } else if (isCustomConsolidated) {
            const viewId = activeProjectIdString.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            if (view && view.project_ids) {
                budgetEntries = view.project_ids.flatMap(id => allEntries[id] || []);
                actualTransactions = view.project_ids.flatMap(id => allActuals[id] || []);
                cashAccounts = view.project_ids.flatMap(id => allCashAccounts[id] || []);
            }
            activeProject = { 
                id: activeProjectIdString, 
                name: view?.name || 'Vue Inconnue', 
                currency: settings.currency,
                display_unit: settings.displayUnit,
                decimal_places: settings.decimalPlaces
            };
        } else {
            // CORRECTION : Comparaison en convertissant les deux côtés en string
            activeProject = projects.find(p => String(p.id) === activeProjectIdString);
            if (activeProject) {
                budgetEntries = allEntries[activeProjectId] || [];
                actualTransactions = allActuals[activeProjectId] || [];
                cashAccounts = allCashAccounts[activeProjectId] || [];
            }
        }

        return { 
            budgetEntries, 
            actualTransactions, 
            cashAccounts, 
            activeProject, 
            isConsolidated, 
            isCustomConsolidated 
        };
    }, [activeProjectId, allEntries, allActuals, allCashAccounts, projects, consolidatedViews, settings]);
};