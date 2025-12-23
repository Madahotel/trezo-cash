import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../components/config/Axios';

let globalConsolidationsCache = null;
let globalConsolidationsCacheTimestamp = 0;
const CONSOLIDATIONS_CACHE_TTL = 120000; 

export const useConsolidations = () => {
  const [consolidations, setConsolidations] = useState([]);
  const [consolidatedProjects, setConsolidatedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const hasFetchedInitial = useRef(false);
  const abortControllerRef = useRef(null);

  const transformConsolidatedData = useCallback((apiData) => {
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
  }, []);

  const fetchConsolidations = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Utiliser le cache si disponible et valide
    if (!forceRefresh && globalConsolidationsCache && 
        now - globalConsolidationsCacheTimestamp < CONSOLIDATIONS_CACHE_TTL) {
      // Ne mettre à jour que si nécessaire
      if (JSON.stringify(consolidations) !== JSON.stringify(globalConsolidationsCache)) {
        setConsolidations(globalConsolidationsCache);
        
        // Transformer les données si nécessaire
        if (globalConsolidationsCache.length > 0) {
          const transformed = transformConsolidatedData({ 
            project_consolidateds: { 
              project_consolidated_items: { data: globalConsolidationsCache } 
            } 
          });
          setConsolidatedProjects(transformed);
        }
      }
      return globalConsolidationsCache;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Annuler la requête précédente si elle existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      const response = await axios.get('/consolidations', {
        signal: abortControllerRef.current.signal
      });
      
      if (response.status === 200) {
        let consolidationsData = [];
        
        if (response.data.consolidations && response.data.consolidations.consolidation_items) {
          consolidationsData = response.data.consolidations.consolidation_items;
        } else if (response.data.consolidations) {
          consolidationsData = response.data.consolidations;
        } else if (Array.isArray(response.data)) {
          consolidationsData = response.data;
        }
        
        // Mettre à jour le cache global
        globalConsolidationsCache = consolidationsData;
        globalConsolidationsCacheTimestamp = now;
        
        // Mettre à jour l'état seulement si les données ont changé
        if (JSON.stringify(consolidations) !== JSON.stringify(consolidationsData)) {
          setConsolidations(consolidationsData);
          
          // Transformer les données
          const transformedProjects = transformConsolidatedData(response.data);
          setConsolidatedProjects(transformedProjects);
        }
        
        return consolidationsData;
      } else {
        const emptyArray = [];
        setConsolidations(emptyArray);
        setConsolidatedProjects([]);
        return emptyArray;
      }
    } catch (err) {
      // Ignorer les erreurs d'annulation
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return globalConsolidationsCache || [];
      }
      
      console.error('Erreur fetchConsolidations:', err);
      setError('Erreur lors du chargement des consolidations.');
      return globalConsolidationsCache || [];
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [consolidations, transformConsolidatedData]);

  // Effet pour le chargement initial
  useEffect(() => {
    if (hasFetchedInitial.current) return;
    
    const loadInitialConsolidations = async () => {
      await fetchConsolidations(false);
      hasFetchedInitial.current = true;
    };
    
    loadInitialConsolidations();
    
    return () => {
      // Nettoyer l'abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(() => {
    return fetchConsolidations(true);
  }, [fetchConsolidations]);

  return { 
    consolidations, 
    consolidatedProjects, 
    loading, 
    error, 
    refetch 
  };
};

// Fonction pour invalider le cache
export const invalidateConsolidationsCache = () => {
  globalConsolidationsCache = null;
  globalConsolidationsCacheTimestamp = 0;
};