import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../components/config/Axios';
import { useAuth } from '../components/context/AuthContext';

export const useConsolidationDetails = (consolidationId) => {
  const { token } = useAuth();
  const [consolidationData, setConsolidationData] = useState(null);
  const [projectConsolidateds, setProjectConsolidateds] = useState([]);
  const [realBudgets, setRealBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    per_page: 15
  });

  const fetchConsolidationDetails = useCallback(async (id, page = 1) => {
    if (!id || !token) {
      setConsolidationData(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/consolidations/${id}?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      
      if (response.status === 200) {
        if (data.consolidation) {
          setConsolidationData(data.consolidation);
        } else {
          setConsolidationData(null);
        }
        
        if (data.project_consolidateds?.project_consolidated_items?.data) {
          setProjectConsolidateds(data.project_consolidateds.project_consolidated_items.data);
          
          setPagination({
            current_page: data.project_consolidateds.project_consolidated_items.current_page || 1,
            total_pages: data.project_consolidateds.project_consolidated_items.last_page || 1,
            total_items: data.project_consolidateds.project_consolidated_items.total || 0,
            per_page: data.project_consolidateds.project_consolidated_items.per_page || 15
          });
        } else {
          setProjectConsolidateds([]);
        }
        
        if (data.real_budgets?.real_budget_items?.data) {
          setRealBudgets(data.real_budgets.real_budget_items.data);
        } else {
          setRealBudgets([]);
        }
      } else {
        setError('Aucune donnée disponible');
        setConsolidationData(null);
        setProjectConsolidateds([]);
        setRealBudgets([]);
      }
    } catch (err) {
      console.error('Erreur fetchConsolidationDetails:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des détails');
      setConsolidationData(null);
      setProjectConsolidateds([]);
      setRealBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (consolidationId) {
      fetchConsolidationDetails(consolidationId);
    }
  }, [consolidationId, fetchConsolidationDetails]);

  const transformToConsolidatedViewData = useCallback(() => {
    if (!consolidationData) {
      return {
        totalProjects: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalNet: 0,
        selectedProjects: [],
        projectIds: [],
        currency: 'EUR',
        consolidationInfo: null,
        budgetsByProject: [],
        realBudgets: [],
        pagination,
        hasData: false,
        isLoading: loading
      };
    }

    if (!projectConsolidateds || projectConsolidateds.length === 0) {
      return {
        totalProjects: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalNet: 0,
        selectedProjects: [],
        projectIds: [],
        currency: 'EUR',
        consolidationInfo: consolidationData,
        budgetsByProject: [],
        realBudgets: realBudgets,
        pagination,
        hasData: false,
        isLoading: loading
      };
    }

    const projectsMap = new Map();
    const uniqueProjectIds = new Set();
    
    projectConsolidateds.forEach(item => {
      const projectId = item.project_id;
      uniqueProjectIds.add(projectId);
      
      if (!projectsMap.has(projectId)) {
        projectsMap.set(projectId, {
          id: projectId,
          name: item.project_name || 'Projet sans nom',
          typeName: 'Projet Consolidé',
          revenue: 0,
          expenses: 0,
          startDate: item.project_start_date,
          endDate: item.project_end_date,
          isDurationUndetermined: item.is_duration_undetermined || false,
          budgets: [],
          budgetCount: 0
        });
      }
      
      const project = projectsMap.get(projectId);
      project.budgetCount++;
      
      if (item.budget_forecast_amount !== null && item.budget_forecast_amount !== undefined) {
        const amount = parseFloat(item.budget_forecast_amount) || 0;
      
        if (item.budget_type_id === 1) { 
          project.expenses += amount;
        } else if (item.budget_type_id === 2) { 
          project.revenue += amount;
        }
        
        project.budgets.push({
          id: item.budget_id,
          amount: amount,
          type: item.budget_type_name,
          typeId: item.budget_type_id, 
          category: item.category_name,
          subCategory: item.sub_category_name,
          currency: item.currency_code,
          frequency: item.frequency_name,
          startDate: item.budget_start_date,
          endDate: item.budget_end_date,
          isDurationIndefinite: item.is_budget_duration_indefinite || false,
          description: item.budget_description,
          thirdParty: item.third_party_name ? 
            `${item.third_party_name} ${item.third_party_firstname || ''}`.trim() : null,
          hasAmount: true
        });
      } else {
        project.budgets.push({
          id: item.budget_id,
          amount: 0,
          type: item.budget_type_name,
          typeId: item.budget_type_id,
          category: item.category_name,
          subCategory: item.sub_category_name,
          currency: item.currency_code,
          frequency: item.frequency_name,
          startDate: item.budget_start_date,
          endDate: item.budget_end_date,
          isDurationIndefinite: item.is_budget_duration_indefinite || false,
          description: item.budget_description,
          thirdParty: item.third_party_name ? 
            `${item.third_party_name} ${item.third_party_firstname || ''}`.trim() : null,
          hasAmount: false
        });
      }
    });

    const selectedProjects = Array.from(projectsMap.values()).map(project => {
      const net = project.revenue - project.expenses;
      const performance = project.revenue > 0 ? 
        ((project.revenue - project.expenses) / project.revenue) * 100 : 0;
      
      return {
        ...project,
        net: net,
        performance: isNaN(performance) ? 0 : performance,
        budgetsWithAmount: project.budgets.filter(b => b.hasAmount)
      };
    });

    const totalRevenue = selectedProjects.reduce((sum, p) => sum + p.revenue, 0);
    const totalExpenses = selectedProjects.reduce((sum, p) => sum + p.expenses, 0);
    const totalNet = totalRevenue - totalExpenses;
    const averagePerformance = selectedProjects.length > 0 ? 
      selectedProjects.reduce((sum, p) => sum + (p.performance || 0), 0) / selectedProjects.length : 0;

    const budgetsByProject = selectedProjects.map(p => ({
      projectId: p.id,
      projectName: p.name,
      budgets: p.budgets,
      budgetsWithAmount: p.budgets.filter(b => b.hasAmount),
      totalRevenue: p.revenue,
      totalExpenses: p.expenses,
      net: p.net,
      budgetCount: p.budgetCount,
      hasValidBudgets: p.budgets.some(b => b.hasAmount)
    }));

    return {
      totalProjects: selectedProjects.length,
      totalRevenue,
      totalExpenses,
      totalNet,
      averagePerformance: isNaN(averagePerformance) ? 0 : averagePerformance,
      selectedProjects,
      projectIds: Array.from(uniqueProjectIds),
      currency: 'EUR',
      consolidationInfo: consolidationData,
      budgetsByProject,
      realBudgets: realBudgets || [],
      pagination,
      hasData: selectedProjects.length > 0,
      isLoading: loading
    };
  }, [consolidationData, projectConsolidateds, realBudgets, pagination, loading]);

  const consolidatedViewData = useMemo(() => {
    return transformToConsolidatedViewData();
  }, [transformToConsolidatedViewData]);

  return {
    consolidationData,
    projectConsolidateds,
    realBudgets,
    loading,
    error,
    refetch: fetchConsolidationDetails,
    transformToConsolidatedViewData,
    consolidatedViewData,
    pagination,
    fetchPage: (page) => fetchConsolidationDetails(consolidationId, page)
  };
};

