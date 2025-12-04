import { useState, useEffect, useCallback } from 'react';
import axios from '../components/config/Axios';

export const useConsolidations = () => {
  const [consolidations, setConsolidations] = useState([]);
  const [consolidatedProjects, setConsolidatedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const transformConsolidatedData = (apiData) => {
    if (!apiData || !apiData.project_consolidateds || !apiData.project_consolidateds.project_consolidated_items) {
      return [];
    }

    const consolidatedItems = apiData.project_consolidateds.project_consolidated_items.data;
    
    const projectsMap = new Map();
    
    consolidatedItems.forEach(item => {
      const projectId = item.project_id;
      
      if (!projectsMap.has(projectId)) {
        projectsMap.set(projectId, {
          id: projectId,
          name: item.project_name,
          startDate: item.project_start_date,
          endDate: item.project_end_date,
          isDurationUndetermined: item.is_duration_undetermined,
          description: item.project_description,
          budgets: []
        });
      }
      
      const project = projectsMap.get(projectId);
      
      if (item.budget_id) {
        project.budgets.push({
          id: item.budget_id,
          typeId: item.budget_type_id, 
          typeName: item.budget_type_name,
          amount: parseFloat(item.budget_forecast_amount) || 0,
          hasAmount: item.budget_forecast_amount !== null,
          frequency: item.frequency_name,
          frequencyId: item.frequency_id,
          startDate: item.budget_start_date,
          endDate: item.budget_end_date,
          isBudgetDurationIndefinite: item.is_budget_duration_indefinite,
          description: item.budget_description,
          currencyId: item.currency_id,
          currencyCode: item.currency_code,
          currencySymbol: item.currency_symbol,
          subCategoryId: item.sub_category_id,
          subCategoryName: item.sub_category_name,
          categoryId: item.category_id,
          categoryName: item.category_name,
          thirdPartyId: item.user_third_party_id,
          thirdPartyName: item.third_party_name,
          consolidationId: item.consolidation_id,
          consolidationName: item.consolidation_name
        });
      }
    });
    
    return Array.from(projectsMap.values());
  };

  const fetchConsolidations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/consolidations');
      if (response.status === 200) {
        if (response.data.consolidations && response.data.consolidations.consolidation_items) {
          setConsolidations(response.data.consolidations.consolidation_items);
        } else if (response.data.consolidations) {
          setConsolidations(response.data.consolidations);
        } else if (Array.isArray(response.data)) {
          setConsolidations(response.data);
        } else {
          setConsolidations([]);
        }
        
        const transformedProjects = transformConsolidatedData(response.data);
        setConsolidatedProjects(transformedProjects);
        
      } else {
        setConsolidations([]);
        setConsolidatedProjects([]);
      }
    } catch (err) {
      console.error('Erreur fetchConsolidations:', err);
      setError('Erreur lors du chargement des consolidations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsolidations();
  }, [fetchConsolidations]);

  return { 
    consolidations, 
    consolidatedProjects, 
    loading, 
    error, 
    refetch: fetchConsolidations 
  };
};