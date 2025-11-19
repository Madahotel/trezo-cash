// useActiveProjectData.js
import { useMemo } from "react";

export const useActiveProjectData = (dataState, uiState, externalBudgetData = null) => {
    const { allEntries = {}, allActuals = {}, allCashAccounts = {}, projects = [], consolidatedViews = [], settings } = dataState;
    const { activeProjectId } = uiState;

    return useMemo(() => {
        if (!settings) {
            return { budgetEntries: [], actualTransactions: [], cashAccounts: [], activeProject: null, isConsolidated: false, isCustomConsolidated: false };
        }

        // ✅ CORRECTION: Toujours convertir en string pour la cohérence
        const activeProjectIdString = String(activeProjectId || '');
        const isConsolidated = activeProjectIdString === 'consolidated';
        const isCustomConsolidated = activeProjectIdString.startsWith('consolidated_view_');

        let budgetEntries = [];
        let actualTransactions = [];
        let cashAccounts = [];
        let activeProject = null;

        console.log('=== useActiveProjectData DEBUG ===');
        console.log('activeProjectId (original):', activeProjectId, typeof activeProjectId);
        console.log('activeProjectIdString:', activeProjectIdString, typeof activeProjectIdString);
        console.log('externalBudgetData disponible:', !!externalBudgetData);
        console.log('isConsolidated:', isConsolidated);
        console.log('isCustomConsolidated:', isCustomConsolidated);

        // ✅ CORRECTION AMÉLIORÉE: Logique de priorité des données
        if (externalBudgetData && externalBudgetData.entries && !isConsolidated && !isCustomConsolidated) {
            console.log('✅ Utilisation des données API externes');
            budgetEntries = externalBudgetData.entries || [];
            actualTransactions = externalBudgetData.actualTransactions || [];
            cashAccounts = externalBudgetData.cashAccounts || [];

            // ✅ CORRECTION: Recherche robuste du projet
            activeProject = projects.find(p => 
                String(p.id) === activeProjectIdString || 
                p.id === activeProjectId
            );

            console.log('Projet trouvé pour API:', activeProject);
        } else {
            console.log('ℹ️ Utilisation des données locales');

            // Logique pour les vues consolidées
            if (isConsolidated) {
                budgetEntries = Object.values(allEntries).flat();
                actualTransactions = Object.values(allActuals).flat();
                cashAccounts = Object.values(allCashAccounts).flat();
                console.log('Mode consolidé - entrées:', budgetEntries.length);
            } else if (isCustomConsolidated) {
                const viewId = activeProjectIdString.replace('consolidated_view_', '');
                const view = consolidatedViews.find(v => v.id === viewId);
                if (view && view.project_ids) {
                    budgetEntries = view.project_ids.flatMap(id => allEntries[id] || []);
                    actualTransactions = view.project_ids.flatMap(id => allActuals[id] || []);
                    cashAccounts = view.project_ids.flatMap(id => allCashAccounts[id] || []);
                    console.log('Mode consolidé custom - entrées:', budgetEntries.length);
                }
            } else {
                // ✅ CORRECTION AMÉLIORÉE: Recherche robuste pour les projets normaux
                activeProject = projects.find(p => 
                    String(p.id) === activeProjectIdString || 
                    p.id === activeProjectId
                );
                console.log('Projet trouvé pour données locales:', activeProject);

                if (activeProject) {
                    // ✅ CORRECTION: Utiliser activeProjectId (original) pour l'accès aux données
                    const projectKey = activeProjectId; // Utiliser l'ID original comme clé
                    budgetEntries = allEntries[projectKey] || [];
                    actualTransactions = allActuals[projectKey] || [];
                    cashAccounts = allCashAccounts[projectKey] || [];
                    console.log('Données locales chargées:', {
                        entries: budgetEntries.length,
                        actuals: actualTransactions.length,
                        cashAccounts: cashAccounts.length,
                        projectKey
                    });
                } else {
                    console.log('❌ Projet non trouvé dans projects:', activeProjectIdString);
                    console.log('Projets disponibles:', projects.map(p => ({ id: p.id, name: p.name })));
                }
            }
        }

        // Déterminer le projet actif pour les modes consolidés
        if (!activeProject) {
            if (isConsolidated) {
                activeProject = {
                    id: 'consolidated',
                    name: 'Projet consolidé',
                    currency: settings.currency,
                    display_unit: settings.displayUnit,
                    decimal_places: settings.decimalPlaces
                };
                console.log('✅ Projet consolidé créé');
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
                console.log('✅ Vue consolidée custom créée:', activeProject.name);
            } else {
                console.log('❌ Aucun projet actif trouvé');
            }
        }

        console.log('📊 Résultat useActiveProjectData:', {
            entries: budgetEntries.length,
            actuals: actualTransactions.length,
            cashAccounts: cashAccounts.length,
            project: activeProject?.name,
            source: externalBudgetData ? 'API' : 'local',
            isConsolidated,
            isCustomConsolidated
        });

        return {
            budgetEntries,
            actualTransactions,
            cashAccounts,
            activeProject,
            isConsolidated,
            isCustomConsolidated
        };
    }, [activeProjectId, allEntries, allActuals, allCashAccounts, projects, consolidatedViews, settings, externalBudgetData]);
};