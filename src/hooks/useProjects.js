import { useState, useEffect, useCallback } from 'react';
import axios from '../components/config/Axios';
import { useAuth } from '../components/context/AuthContext';

export const useProjects = () => {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const transformApiData = useCallback((apiData) => {
    const transformedProjects = [];
    
    console.log('📥 Données brutes de l\'API useProjects:', apiData);

    // Vérification plus robuste de la structure des données
    if (!apiData || !apiData.projects || apiData.status === 204) {
      console.warn('Aucun projet trouvé dans la réponse API');
      return transformedProjects;
    }

    // CORRECTION: Transformation des projets business avec vérifications
    if (apiData.projects.business?.project_business_items?.data) {
      apiData.projects.business.project_business_items.data.forEach(project => {
        if (project && project.id) { // Vérification que le projet existe
          const isArchived = project.entity_status_id === 3;
          
          // FILTRER : ne garder que les projets NON archivés
          if (!isArchived) {
            transformedProjects.push({
              id: project.id,
              name: project.name || 'Projet sans nom',
              description: project.description || 'Aucune description',
              type: 'business',
              typeName: project.type_name || 'Business',
              user_id: project.user_id,
              user_subscriber_id: project.user_subscriber_id,
              mainCurrency: 'EUR',
              incomeBudget: project.income_budget || 0,
              expenseBudget: project.expense_budget || 0,
              incomeRealized: project.income_realized || 0,
              expenseRealized: project.expense_realized || 0,
              startDate: project.start_date,
              endDate: project.end_date || project.start_date,
              status: project.status || 'active',
              isDurationUndetermined: project.is_duration_undetermined === 1,
              templateId: project.template_id,
              projectTypeId: project.project_type_id,
              createdAt: project.created_at,
              updatedAt: project.updated_at,
              userSubscriberId: project.user_subscriber_id,
              collaborators: project.collaborators || [],
              is_archived: isArchived,
              isArchived: isArchived,
              is_temp: false,
              project_type_name: project.type_name || 'Business',
              entity_status_id: project.entity_status_id || 1
            });
          }
        }
      });
    }

    // CORRECTION: Transformation des projets événements avec vérifications
    if (apiData.projects.events?.project_event_items?.data) {
      apiData.projects.events.project_event_items.data.forEach(project => {
        if (project && project.id) {
          const isArchived = project.entity_status_id === 3;
          
          if (!isArchived) {
            transformedProjects.push({
              id: project.id,
              name: project.name || 'Projet sans nom',
              description: project.description || 'Aucune description',
              type: 'evenement',
              typeName: project.type_name || 'Événement',
              user_id: project.user_id,
              user_subscriber_id: project.user_subscriber_id,
              mainCurrency: 'EUR',
              incomeBudget: project.income_budget || 0,
              expenseBudget: project.expense_budget || 0,
              incomeRealized: project.income_realized || 0,
              expenseRealized: project.expense_realized || 0,
              startDate: project.start_date,
              endDate: project.end_date || project.start_date,
              status: project.status || 'active',
              isDurationUndetermined: project.is_duration_undetermined === 1,
              templateId: project.template_id,
              projectTypeId: project.project_type_id,
              createdAt: project.created_at,
              updatedAt: project.updated_at,
              userSubscriberId: project.user_subscriber_id,
              collaborators: project.collaborators || [],
              is_archived: isArchived,
              isArchived: isArchived,
              is_temp: false,
              project_type_name: project.type_name || 'Événement',
              entity_status_id: project.entity_status_id || 1
            });
          }
        }
      });
    }

    // CORRECTION: Transformation des projets ménages avec vérifications
    if (apiData.projects.menages?.project_menage_items?.data) {
      apiData.projects.menages.project_menage_items.data.forEach(project => {
        if (project && project.id) {
          const isArchived = project.entity_status_id === 3;
          
          if (!isArchived) {
            transformedProjects.push({
              id: project.id,
              name: project.name || 'Projet sans nom',
              description: project.description || 'Aucune description',
              type: 'menage',
              typeName: project.type_name || 'Ménage',
              user_id: project.user_id,
              user_subscriber_id: project.user_subscriber_id,
              mainCurrency: 'EUR',
              incomeBudget: project.income_budget || 0,
              expenseBudget: project.expense_budget || 0,
              incomeRealized: project.income_realized || 0,
              expenseRealized: project.expense_realized || 0,
              startDate: project.start_date,
              endDate: project.end_date || project.start_date,
              status: project.status || 'active',
              isDurationUndetermined: project.is_duration_undetermined === 1,
              templateId: project.template_id,
              projectTypeId: project.project_type_id,
              createdAt: project.created_at,
              updatedAt: project.updated_at,
              userSubscriberId: project.user_subscriber_id,
              collaborators: project.collaborators || [],
              is_archived: isArchived,
              isArchived: isArchived,
              is_temp: false,
              project_type_name: project.type_name || 'Ménage',
              entity_status_id: project.entity_status_id || 1
            });
          }
        }
      });
    }

    return transformedProjects;
  }, []);

  const fetchProjects = useCallback(async (retryCount = 0) => {
    if (!user?.id || !token) {
      console.log('❌ useProjects: Utilisateur non connecté');
      setError('Utilisateur non connecté');
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 useProjects: Fetching projects from API...', { userId: user.id });
      
      const response = await axios.get('/projects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('useProjects - Réponse API reçue:', response.data);
      const data = response.data;

      // Vérification plus robuste du statut 204
      if (data.status === 204 || !data.projects) {
        console.log('useProjects: Aucun projet trouvé');
        setProjects([]);
        return [];
      }

      const transformedProjects = transformApiData(data);
      
      console.log('✅ useProjects - Projets transformés:', transformedProjects.length);
      setProjects(transformedProjects);
      return transformedProjects;

    } catch (err) {
      console.error('useProjects - Erreur détaillée:', {
        status: err.response?.status,
        message: err.message,
        data: err.response?.data
      });

      // Gestion du rate limiting
      if (err.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`useProjects - Too many requests, retrying in ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchProjects(retryCount + 1);
      }

      const errorMsg = err.response?.data?.message || err.message || 'Erreur lors du chargement des projets';
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id, token, transformApiData]);

  useEffect(() => {
    console.log('useProjects - useEffect triggered', { 
      user: user?.id, 
      token: !!token,
      loading 
    });
    
    if (user?.id && token) {
      fetchProjects();
    } else {
      console.log('useProjects - Pas de user ou token, arrêt du chargement');
      setLoading(false);
      setProjects([]);
    }
  }, [user?.id, token, fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    setProjects
  };
};

//Ity hook ity no maka sy mitantana ny lisitry ny projets avy amin’ny API