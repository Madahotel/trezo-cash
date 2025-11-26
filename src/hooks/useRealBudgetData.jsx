import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import axios from '../components/config/Axios';

const useRealBudgetData = (activeProjectId) => {
    const [realBudgetData, setRealBudgetData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRealBudgetData = async (projectId) => {
        if (!projectId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/trezo-tables/projects/${projectId}`);
            const data = response.data;

            if (data && data.real_budgets) {
                setRealBudgetData(data.real_budgets);
                console.log('📊 Données real_budgets récupérées:', {
                    count: data.real_budgets.real_budget_count,
                    items: data.real_budgets.real_budget_items.data.map(item => ({
                        budget_id: item.budget_id,
                        project_id: item.project_id,
                        collection_amount: item.collection_amount,
                        collection_date: item.collection_date
                    }))
                });
            } else {
                console.log('ℹ️ Aucune donnée real_budgets trouvée');
                setRealBudgetData(null);
            }
        } catch (err) {
            console.error('Erreur récupération real_budgets:', err);
            setError(err.message);
            setRealBudgetData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRealBudgetData(activeProjectId);
    }, [activeProjectId]);

    return { realBudgetData, loading, error, refetch: () => fetchRealBudgetData(activeProjectId) };
};

export default useRealBudgetData;