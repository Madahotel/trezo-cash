import { useMemo, useState, useEffect, useCallback } from "react";
import axios from '../components/config/Axios';

export const useActiveProjectData = (dataState, uiState, externalBudgetData = null) => {
    const { allEntries = {}, allActuals = {}, allCashAccounts = {}, projects = [], consolidatedViews = [], settings = {} } = dataState;
    const { activeProjectId, activeProject: uiActiveProject } = uiState;

    const [consolidatedBudgetData, setConsolidatedBudgetData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [consolidatedEntries, setConsolidatedEntries] = useState([]);

    const fetchConsolidatedData = useCallback(async (consolidationId = null) => {
        setLoading(true);
        setError(null);
        try {
            console.log('fetchConsolidatedData appelé avec consolidationId:', consolidationId);
            
            let endpoint = '/consolidations';
            if (consolidationId) {
                endpoint = `/consolidations/${consolidationId}`;
            }
            
            console.log('Appel API:', endpoint);
            const response = await axios.get(endpoint);
            console.log('Réponse API consolidations:', response.data);
            
            let items = [];
            
            // Gestion des différents formats de réponse
            if (response.data.project_consolidateds?.project_consolidated_items?.data) {
                items = response.data.project_consolidateds.project_consolidated_items.data;
            } else if (response.data.consolidation?.project_consolidateds?.project_consolidated_items?.data) {
                items = response.data.consolidation.project_consolidateds.project_consolidated_items.data;
            } else if (Array.isArray(response.data)) {
                items = response.data;
            }
            
            console.log('Items consolidés trouvés:', items.length);
            
            // Transformer les données au format attendu par BudgetTableView
            const transformedEntries = items.map(item => {
                const entryType = item.budget_type_name === 'Entré' || item.budget_type_id === 2 ? 'entree' : 'sortie';
                
                return {
                    id: `consolidated_${item.budget_id}_${item.project_id}`,
                    budget_id: item.budget_id,
                    budget_detail_id: item.budget_id,
                    project_id: item.project_id,
                    project_name: item.project_name,
                    supplier: `${item.third_party_firstname || ''} ${item.third_party_name || ''}`.trim() || 'Non spécifié',
                    category: item.sub_category_name,
                    category_name: item.category_name,
                    budget_type_name: item.budget_type_name,
                    type: entryType,
                    amount: parseFloat(item.budget_forecast_amount) || 0,
                    budget_amount: parseFloat(item.budget_forecast_amount) || 0,
                    frequency_name: item.frequency_name,
                    frequency: item.frequency_name,
                    start_date: item.budget_start_date,
                    end_date: item.budget_end_date,
                    currency_code: item.currency_code,
                    currency_name: item.currency_name,
                    currency_symbol: item.currency_symbol,
                    third_party_name: item.third_party_name,
                    third_party_firstname: item.third_party_firstname,
                    user_third_party_id: item.user_third_party_id,
                    sub_category_id: item.sub_category_id,
                    sub_category_name: item.sub_category_name,
                    category_id: item.category_id,
                    isProvision: false,
                    isConsolidated: true,
                    startDate: item.budget_start_date ? new Date(item.budget_start_date) : null,
                    endDate: item.budget_end_date ? new Date(item.budget_end_date) : null,
                    date: item.budget_start_date,
                    budget_description: item.budget_description,
                    description: item.budget_description
                };
            });
            
            console.log('Entries transformées:', transformedEntries.length);
            
            setConsolidatedEntries(transformedEntries);
            
            // Créer un objet de données consolidées structuré
            const consolidatedData = {
                budgetEntries: transformedEntries,
                entries: transformedEntries.filter(e => e.type === 'entree'),
                expenses: transformedEntries.filter(e => e.type === 'sortie'),
                sumEntries: transformedEntries.filter(e => e.type === 'entree')
                    .reduce((sum, e) => sum + (e.amount || 0), 0),
                sumExpenses: transformedEntries.filter(e => e.type === 'sortie')
                    .reduce((sum, e) => sum + (e.amount || 0), 0),
                sumForecast: 0
            };
            
            consolidatedData.sumForecast = consolidatedData.sumEntries - consolidatedData.sumExpenses;
            
            console.log('Données consolidées préparées:', consolidatedData);
            setConsolidatedBudgetData(consolidatedData);
            
        } catch (err) {
            console.error('Erreur fetchConsolidatedData:', err);
            console.error('Détails erreur:', err.response?.data || err.message);
            setError(`Erreur lors du chargement des données consolidées: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const activeProjectIdString = String(activeProjectId || '');
        const isConsolidated = activeProjectIdString === 'consolidated';
        const isCustomConsolidated = activeProjectIdString.startsWith('consolidated_view_');
        
        console.log('useActiveProjectData useEffect:', {
            activeProjectIdString,
            isConsolidated,
            isCustomConsolidated
        });
        
        if (isConsolidated || isCustomConsolidated) {
            const consolidationId = isCustomConsolidated 
                ? parseInt(activeProjectIdString.replace('consolidated_view_', ''), 10)
                : null;
            
            console.log('Chargement des données consolidées, ID:', consolidationId);
            fetchConsolidatedData(consolidationId);
        } else {
            setConsolidatedBudgetData(null);
            setConsolidatedEntries([]);
        }
    }, [activeProjectId, fetchConsolidatedData]);

    return useMemo(() => {
        console.log('useActiveProjectData useMemo appelé avec:', {
            activeProjectId,
            isConsolidated: String(activeProjectId || '') === 'consolidated',
            isCustomConsolidated: String(activeProjectId || '').startsWith('consolidated_view_')
        });
        
        const activeProjectIdString = String(activeProjectId || '');
        const isConsolidated = activeProjectIdString === 'consolidated';
        const isCustomConsolidated = activeProjectIdString.startsWith('consolidated_view_');

        let budgetEntries = [];
        let actualTransactions = [];
        let cashAccounts = [];
        let activeProject = uiActiveProject;

        // Déterminer le projet actif
        if (!activeProject) {
            if (isConsolidated) {
                activeProject = {
                    id: 'consolidated',
                    name: 'Mes projets consolidés',
                    currency: settings.currency || 'EUR',
                    display_unit: settings.displayUnit || 'euro',
                    decimal_places: settings.decimalPlaces || 2,
                    isConsolidated: true
                };
            } else if (isCustomConsolidated) {
                const viewId = activeProjectIdString.replace('consolidated_view_', '');
                const view = consolidatedViews.find(v => String(v.id) === viewId);
                activeProject = {
                    id: activeProjectIdString,
                    name: view?.name || 'Vue Inconnue',
                    currency: settings.currency || 'EUR',
                    display_unit: settings.displayUnit || 'euro',
                    decimal_places: settings.decimalPlaces || 2,
                    isConsolidated: true
                };
            } else {
                activeProject = projects.find(p =>
                    String(p.id) === activeProjectIdString ||
                    p.id === activeProjectId
                );
            }
        }

        // Gérer les données selon le type de vue
        if (isConsolidated || isCustomConsolidated) {
            console.log('Mode consolidé - Utilisation des données consolidées');
            budgetEntries = consolidatedEntries;
            actualTransactions = [];
            cashAccounts = [];
            
            if (activeProjectId) {
                cashAccounts = [{
                    id: `consolidated_account_${activeProjectId}`,
                    name: 'Trésorerie Consolidée',
                    initialBalance: 0,
                    currentBalance: 0,
                    initialBalanceDate: new Date().toISOString().split('T')[0],
                    projectId: activeProjectId,
                    isConsolidated: true
                }];
            }
        } else {
            // Mode projet normal
            if (externalBudgetData && externalBudgetData.entries) {
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

        console.log('useActiveProjectData retourne:', {
            budgetEntriesCount: budgetEntries.length,
            isConsolidated,
            isCustomConsolidated,
            activeProjectName: activeProject?.name
        });

        return {
            budgetEntries,
            actualTransactions,
            cashAccounts,
            activeProject,
            isConsolidated,
            isCustomConsolidated,
            loading,
            error,
            consolidatedBudgetData,
            refetch: () => {
                const activeProjectIdString = String(activeProjectId || '');
                const isConsolidated = activeProjectIdString === 'consolidated';
                const isCustomConsolidated = activeProjectIdString.startsWith('consolidated_view_');
                
                if (isConsolidated || isCustomConsolidated) {
                    const consolidationId = isCustomConsolidated 
                        ? parseInt(activeProjectIdString.replace('consolidated_view_', ''), 10)
                        : null;
                    fetchConsolidatedData(consolidationId);
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
        consolidatedEntries,
        loading,
        error
    ]);
};