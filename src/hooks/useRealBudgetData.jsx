import React, { useState, useEffect } from 'react';
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
            } else {
                setRealBudgetData(null);
            }
        } catch (err) {
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