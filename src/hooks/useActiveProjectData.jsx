import { useMemo } from "react";

export const useActiveProjectData = (dataState, uiState, externalBudgetData = null) => {
    const { allEntries = {}, allActuals = {}, allCashAccounts = {}, projects = [], consolidatedViews = [], settings } = dataState;
    const { activeProjectId, activeProject: uiActiveProject } = uiState;

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
        let activeProject = uiActiveProject;

        if (!activeProject) {

            if (isConsolidated) {
                activeProject = {
                    id: 'consolidated',
                    name: 'Mes projets consolidés',
                    currency: settings.currency,
                    display_unit: settings.displayUnit,
                    decimal_places: settings.decimalPlaces
                };
            } else if (isCustomConsolidated) {
                const viewId = activeProjectIdString.replace('consolidated_view_', '');
                const view = consolidatedViews.find(v => v.id === viewId);
                activeProject = {
                    id: activeProjectIdString,
                    name: view?.name || 'Vue Inconnue',
                    currency: settings.currency,
                    display_unit: settings.displayUnit,
                    decimal_places: settings.decimalPlaces
                };
            } else {
                // Rechercher le projet dans la liste
                activeProject = projects.find(p =>
                    String(p.id) === activeProjectIdString ||
                    p.id === activeProjectId
                );
            }
        }

        if (isConsolidated) {
            budgetEntries = Object.values(allEntries).flat();
            actualTransactions = Object.values(allActuals).flat();
            cashAccounts = Object.values(allCashAccounts).flat();
        } else if (isCustomConsolidated) {
            const viewId = activeProjectIdString.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            if (view && view.project_ids) {
                budgetEntries = view.project_ids.flatMap(id => allEntries[id] || []);
                actualTransactions = view.project_ids.flatMap(id => allActuals[id] || []);
                cashAccounts = view.project_ids.flatMap(id => allCashAccounts[id] || []);
            }
        } else {
            if (externalBudgetData && externalBudgetData.entries) {
                budgetEntries = externalBudgetData.entries || [];
                actualTransactions = externalBudgetData.actualTransactions || [];
                cashAccounts = externalBudgetData.cashAccounts || [];
            } else {
                // Données locales
                const projectKey = activeProjectId;
                budgetEntries = allEntries[projectKey] || [];
                actualTransactions = allActuals[projectKey] || [];
                cashAccounts = allCashAccounts[projectKey] || [];
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
    }, [
        activeProjectId,
        uiActiveProject,
        allEntries,
        allActuals,
        allCashAccounts,
        projects,
        consolidatedViews,
        settings,
        externalBudgetData
    ]);
};