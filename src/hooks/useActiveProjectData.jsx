import { useMemo, useState, useEffect, useCallback } from "react";
import axios from '../components/config/Axios';

export const useActiveProjectData = (dataState, uiState, externalBudgetData = null) => {
    const { allEntries = {}, allActuals = {}, allCashAccounts = {}, projects = [], consolidatedViews = [], settings } = dataState;
    const { activeProjectId, activeProject: uiActiveProject } = uiState;

    const [consolidatedBudgetData, setConsolidatedBudgetData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchConsolidatedBudgetData = useCallback(async (consolidationId = null) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/consolidations');
            const items = response.data.project_consolidateds?.project_consolidated_items?.data || [];
        
            let filteredItems = items;
            if (consolidationId) {
                filteredItems = items.filter(item => 
                    item.consolidation_id === consolidationId
                );
            }
            
            const budgetData = {
                entries: [], 
                expenses: [], 
                sumEntries: 0,
                sumExpenses: 0,
                sumForecast: 0,
                budgetEntries: [] 
            };
            
            filteredItems.forEach(item => {
                if (item.budget_forecast_amount) {
                    const amount = parseFloat(item.budget_forecast_amount);
                    const entry = {
                        id: item.budget_id,
                        budget_detail_id: item.budget_id,
                        sub_category_id: item.sub_category_id,
                        sub_category_name: item.sub_category_name,
                        category_id: item.category_id,
                        category_name: item.category_name,
                        third_party_id: item.user_third_party_id,
                        third_party_name: `${item.third_party_firstname} ${item.third_party_name}`,
                        budget_forecast_amount: amount,
                        budget_type_id: item.budget_type_id,
                        budget_type_name: item.budget_type_name,
                        frequency_id: item.frequency_id,
                        frequency_name: item.frequency_name,
                        is_budget_duration_indefinite: item.is_budget_duration_indefinite,
                        project_id: item.project_id,
                        project_name: item.project_name,
                        currency_id: item.currency_id,
                        currency_code: item.currency_code,
                        start_date: item.budget_start_date,
                        end_date: item.budget_end_date
                    };
                    
                    budgetData.budgetEntries.push(entry);
                    
                    if (item.budget_type_id === 2) { 
                        budgetData.entries.push(entry);
                        budgetData.sumEntries += amount;
                    } else if (item.budget_type_id === 1) { 
                        budgetData.expenses.push(entry);
                        budgetData.sumExpenses += amount;
                    }
                }
            });
            
            budgetData.sumForecast = budgetData.sumEntries - budgetData.sumExpenses;
            setConsolidatedBudgetData(budgetData);
        } catch (err) {
            console.error('Erreur fetchConsolidatedBudgetData:', err);
            setError('Erreur lors du chargement des données consolidées');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const activeProjectIdString = String(activeProjectId || '');
        const isConsolidated = activeProjectIdString === 'consolidated';
        const isCustomConsolidated = activeProjectIdString.startsWith('consolidated_view_');
        
        if (isConsolidated || isCustomConsolidated) {
            const consolidationId = isCustomConsolidated 
                ? parseInt(activeProjectIdString.replace('consolidated_view_', ''), 10)
                : null;
            fetchConsolidatedBudgetData(consolidationId);
        } else {
            setConsolidatedBudgetData(null);
        }
    }, [activeProjectId, fetchConsolidatedBudgetData]);

    return useMemo(() => {
        if (!settings) {
            return { 
                budgetEntries: [], 
                actualTransactions: [], 
                cashAccounts: [], 
                activeProject: null, 
                isConsolidated: false, 
                isCustomConsolidated: false,
                loading: false,
                error: null,
                consolidatedBudgetData: null
            };
        }
        
        const activeProjectIdString = String(activeProjectId || '');
        const isConsolidated = activeProjectIdString === 'consolidated';
        const isCustomConsolidated = activeProjectIdString.startsWith('consolidated_view_');

        let budgetEntries = [];
        let actualTransactions = [];
        let cashAccounts = [];
        let activeProject = uiActiveProject;
        let externalData = null;

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
                activeProject = projects.find(p =>
                    String(p.id) === activeProjectIdString ||
                    p.id === activeProjectId
                );
            }
        }

        if (isConsolidated || isCustomConsolidated) {
            externalData = consolidatedBudgetData;
            budgetEntries = consolidatedBudgetData?.budgetEntries || [];
            actualTransactions = [];
            cashAccounts = [];
        } else {
            if (externalBudgetData && externalBudgetData.entries) {
                externalData = externalBudgetData;
                budgetEntries = externalBudgetData.entries || [];
                actualTransactions = externalBudgetData.actualTransactions || [];
                cashAccounts = externalBudgetData.cashAccounts || [];
            } else {
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
            isCustomConsolidated,
            loading,
            error,
            consolidatedBudgetData: externalData,
            refetch: () => {
                const activeProjectIdString = String(activeProjectId || '');
                const isConsolidated = activeProjectIdString === 'consolidated';
                const isCustomConsolidated = activeProjectIdString.startsWith('consolidated_view_');
                
                if (isConsolidated || isCustomConsolidated) {
                    const consolidationId = isCustomConsolidated 
                        ? parseInt(activeProjectIdString.replace('consolidated_view_', ''), 10)
                        : null;
                    fetchConsolidatedBudgetData(consolidationId);
                }
            }
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
        externalBudgetData,
        consolidatedBudgetData,
        loading,
        error
    ]);
};