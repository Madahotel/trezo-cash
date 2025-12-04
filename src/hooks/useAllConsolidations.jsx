import { useState, useEffect, useCallback } from 'react';
import axios from '../components/config/Axios';

export const useAllConsolidations = () => {
  const [consolidationDetails, setConsolidationDetails] = useState(null);
  const [stats, setStats] = useState({
    selectedProjects: [],
    totalRevenue: 0,
    totalExpenses: 0,
    totalNet: 0,
    totalProjects: 0,
    averagePerformance: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const transformAllConsolidationsData = (apiData) => {
    if (!apiData || !apiData.project_consolidateds) {
      return {
        selectedProjects: [],
        totalRevenue: 0,
        totalExpenses: 0,
        totalNet: 0,
        totalProjects: 0,
        averagePerformance: 0
      };
    }

    const items = apiData.project_consolidateds.project_consolidated_items?.data || [];
    const projectsMap = new Map();

    items.forEach((item, index) => {
      const projectId = item.project_id;

      if (!projectsMap.has(projectId)) {
        projectsMap.set(projectId, {
          id: projectId,
          name: item.project_name || `Projet ${projectId}`,
          startDate: item.project_start_date,
          endDate: item.project_end_date,
          description: item.project_description,
          isDurationUndetermined: item.is_duration_undetermined || false,
          consolidations: new Set(),
          budgets: []
        });
      }

      const project = projectsMap.get(projectId);

      project.consolidations.add(item.consolidation_id);

      const hasAmount = item.budget_forecast_amount !== null &&
        item.budget_forecast_amount !== undefined &&
        item.budget_forecast_amount !== '' &&
        !isNaN(parseFloat(item.budget_forecast_amount));

      const amount = hasAmount ? parseFloat(item.budget_forecast_amount) : 0;

      project.budgets.push({
        id: item.budget_id,
        typeId: item.budget_type_id,
        typeName: item.budget_type_name,
        amount: amount,
        hasAmount: hasAmount,
        frequency: item.frequency_name?.toLowerCase() || 'non spécifiée',
        frequencyName: item.frequency_name || 'Non spécifiée',
        startDate: item.budget_start_date,
        endDate: item.budget_end_date,
        isDurationIndefinite: item.is_budget_duration_indefinite || false,
        description: item.budget_description,
        subCategoryName: item.sub_category_name,
        categoryName: item.category_name,
        currency: item.currency_code || 'EUR',
        consolidationId: item.consolidation_id,
        consolidationName: item.consolidation_name
      });
    });

    const selectedProjects = Array.from(projectsMap.values());

    const projectsWithStats = selectedProjects.map((project) => {
      const revenues = project.budgets
        .filter(b => b.typeId === 2 && b.hasAmount) // typeId 2 = Entrée = Revenue
        .reduce((sum, b) => sum + b.amount, 0);

      const expenses = project.budgets
        .filter(b => b.typeId === 1 && b.hasAmount) // typeId 1 = Sortie = Dépense
        .reduce((sum, b) => sum + b.amount, 0);

      const net = revenues - expenses;
      const performance = revenues > 0 ? ((revenues - expenses) / revenues) * 100 : 0;

      const budgetsWithAmount = project.budgets.filter(b => b.hasAmount);

      // budgetsWithAmount.forEach(budget => {
      //   console.log(`   - Budget ${budget.id}: ${budget.typeName} (typeId=${budget.typeId}): ${budget.amount}€ [${budget.frequency}]`);
      // });

      return {
        ...project,
        revenue: revenues,
        expenses: expenses,
        net: net,
        performance: performance,
        budgetCount: project.budgets.length,
        budgetsWithAmount: budgetsWithAmount,
        consolidationCount: Array.from(project.consolidations).length
      };
    });

    // Calculer les totaux globaux
    const totalRevenue = projectsWithStats.reduce((sum, p) => sum + p.revenue, 0);
    const totalExpenses = projectsWithStats.reduce((sum, p) => sum + p.expenses, 0);
    const totalNet = totalRevenue - totalExpenses;
    const totalProjects = projectsWithStats.length;
    const averagePerformance = totalProjects > 0
      ? projectsWithStats.reduce((sum, p) => sum + p.performance, 0) / totalProjects
      : 0;

    return {
      selectedProjects: projectsWithStats,
      totalRevenue,
      totalExpenses,
      totalNet,
      totalProjects,
      averagePerformance
    };
  };

  const fetchAllConsolidations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/consolidations');

      if (response.status === 200) {
        const data = response.data;

        setConsolidationDetails({
          name: 'Vue Consolidée',
          description: 'Vue globale de tous les projets',
          totalConsolidations: data.consolidations?.consolidation_counts || 0,
          consolidation_items: data.consolidations?.consolidation_items || []
        });

        const transformedStats = transformAllConsolidationsData(data);
        setStats(transformedStats);

      } else {
        setError('Erreur lors du chargement des données');
      }
    } catch (err) {
      console.error('Erreur fetchAllConsolidations:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des consolidations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllConsolidations();
  }, [fetchAllConsolidations]);

  return {
    consolidationDetails,
    stats,
    loading,
    error,
    refetch: fetchAllConsolidations
  };
};