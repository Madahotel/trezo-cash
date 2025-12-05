import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../components/config/Axios';
import { useAuth } from '../components/context/AuthContext';

let globalProjectsCache = null;
let globalCacheTimestamp = 0;
const CACHE_TTL = 120000; 

export const useProjects = () => {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isFetching = useRef(false);
  const abortControllerRef = useRef(null);

  const transformApiData = useCallback((apiData) => {
    const transformedProjects = [];

    if (!apiData || !apiData.projects || apiData.status === 204) {
      return transformedProjects;
    }

    if (apiData.projects.business?.project_business_items?.data) {
      apiData.projects.business.project_business_items.data.forEach(
        (project) => {
          if (project && project.id) {
            const isArchived = project.entity_status_id === 3;
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
                entity_status_id: project.entity_status_id || 1,
              });
            }
          }
        }
      );
    }

    if (apiData.projects.events?.project_event_items?.data) {
      apiData.projects.events.project_event_items.data.forEach((project) => {
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
              entity_status_id: project.entity_status_id || 1,
            });
          }
        }
      });
    }

    if (apiData.projects.menages?.project_menage_items?.data) {
      apiData.projects.menages.project_menage_items.data.forEach((project) => {
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
              entity_status_id: project.entity_status_id || 1,
            });
          }
        }
      });
    }

    return transformedProjects;
  }, []);

  const fetchProjects = useCallback(
    async (forceRefresh = false) => {
      if (isFetching.current && !forceRefresh) {
        return globalProjectsCache || [];
      }

      const now = Date.now();
      if (!forceRefresh && globalProjectsCache && 
          now - globalCacheTimestamp < CACHE_TTL) {
        setProjects(globalProjectsCache);
        setLoading(false);
        return globalProjectsCache;
      }

      if (!user?.id || !token) {
        setError('Utilisateur non connecté');
        setLoading(false);
        return [];
      }

      try {
        isFetching.current = true;
        setLoading(true);
        setError(null);

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        
        const response = await axios.get('/projects', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortControllerRef.current.signal,
        });

        const data = response.data;

        if (data.status === 204 || !data.projects) {
          setProjects([]);
          globalProjectsCache = [];
          globalCacheTimestamp = now;
          return [];
        }

        const transformedProjects = transformApiData(data);
        
        setProjects(transformedProjects);
        globalProjectsCache = transformedProjects;
        globalCacheTimestamp = now;
        
        return transformedProjects;
      } catch (err) {

        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
          return globalProjectsCache || [];
        }
        
        if (err.response?.status === 429) {
          setError('Trop de requêtes. Veuillez patienter quelques instants...');
          return globalProjectsCache || [];
        }

        const errorMsg = err.response?.data?.message || 
                        err.message || 
                        'Erreur lors du chargement des projets';
        setError(errorMsg);
        
        return globalProjectsCache || [];
      } finally {
        isFetching.current = false;
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [user?.id, token, transformApiData]
  );

  useEffect(() => {
    let timer;
    let mounted = true;

    const loadProjects = async () => {
      if (!user?.id || !token) {
        if (mounted) {
          setLoading(false);
          setProjects([]);
        }
        return;
      }

      const delay = Math.random() * 1500;
      
      timer = setTimeout(async () => {
        if (mounted) {
          await fetchProjects();
        }
      }, delay);
    };

    loadProjects();

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user?.id, token]); 

  const refetch = useCallback(() => {
    return fetchProjects(true);
  }, [fetchProjects]);

  const clearCache = useCallback(() => {
    globalProjectsCache = null;
    globalCacheTimestamp = 0;
  }, []);

  const updateProjects = useCallback((updatedProjects) => {
    setProjects(updatedProjects);
    globalProjectsCache = updatedProjects;
    globalCacheTimestamp = Date.now();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch,
    setProjects: updateProjects,
    clearCache,
  };
};

export const invalidateProjectsCache = () => {
  globalProjectsCache = null;
  globalCacheTimestamp = 0;
};

// Ity hook ity no maka sy mitantana ny lisitry ny projets avy amin'ny API
// avec optimisation de performance et gestion du rate limiting