import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../components/context/AuthContext';
import { useProjects } from './useProjects';
import axios from '../components/config/Axios';

export const useConsolidationProjects = (consolidationId) => {
  const { user } = useAuth();
  const { projects: allProjects, loading: projectsLoading } = useProjects();
  const [consolidationProjects, setConsolidationProjects] = useState([]);
  const [consolidationDetails, setConsolidationDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConsolidationData = async () => {
    if (!user?.token || !consolidationId) {
      setConsolidationProjects([]);
      setConsolidationDetails(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les détails de la consolidation
      const response = await axios.get(`/consolidations/${consolidationId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      const data = response.data;
      
      // Extraire les détails
      let details = null;
      if (data.data) {
        details = data.data;
      } else if (data.consolidation) {
        details = data.consolidation;
      } else {
        details = data;
      }
      
      setConsolidationDetails(details);
      
      // Extraire les IDs des projets
      const projectIds = details?.project_ids || [];
      
      // Filtrer les projets correspondants
      if (allProjects && Array.isArray(allProjects) && projectIds.length > 0) {
        const filteredProjects = allProjects.filter(project => 
          projectIds.includes(project.id)
        );
        setConsolidationProjects(filteredProjects);
      } else {
        setConsolidationProjects([]);
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des projets de consolidation:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement');
      setConsolidationProjects([]);
      setConsolidationDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allProjects) {
      fetchConsolidationData();
    }
  }, [user?.token, consolidationId, allProjects]);

  const refetch = () => {
    fetchConsolidationData();
  };

  // Calculer les statistiques
  const stats = useMemo(() => {
    if (!consolidationProjects.length) {
      return {
        totalBudget: 0,
        totalExpenses: 0,
        totalNet: 0,
        totalProjects: 0,
        projectsByType: {},
        selectedProjects: []
      };
    }

    let totalBudget = 0;
    let totalExpenses = 0;
    let totalProjects = 0;
    const projectsByType = {};
    const selectedProjects = [];

    consolidationProjects.forEach(project => {
      const income = Number(project.incomeRealized) || 0;
      const expense = Number(project.expenseRealized) || 0;
      const net = income - expense;
      const type = project.typeName || 'Non défini';
      
      // Calcul des totaux
      totalBudget += income;
      totalExpenses += expense;
      totalProjects++;
      
      // Regroupement par type
      if (!projectsByType[type]) {
        projectsByType[type] = {
          count: 0,
          budget: 0,
          expenses: 0
        };
      }
      projectsByType[type].count++;
      projectsByType[type].budget += income;
      projectsByType[type].expenses += expense;
      
      // Calcul de la performance
      const performance = income > 0 ? ((income - expense) / income) * 100 : 0;
      
      selectedProjects.push({
        ...project,
        net,
        performance
      });
    });

    return {
      totalBudget,
      totalExpenses,
      totalNet: totalBudget - totalExpenses,
      totalProjects,
      projectsByType,
      selectedProjects,
      currency: 'EUR' // À adapter selon vos besoins
    };
  }, [consolidationProjects]);

  return { 
    consolidationDetails, 
    consolidationProjects, 
    stats,
    loading: loading || projectsLoading, 
    error, 
    refetch 
  };
};