import { useState, useEffect } from 'react';
import { getBudget } from '../components/context/budgetAction';
import { transformBudgetData } from '../utils/transformBudgetData';

export const useBudgetData = (activeProjectId) => {
    const [budgetData, setBudgetData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBudgetData = async () => {
            if (!activeProjectId) {
                setBudgetData(null);
                return;
            }

            const projectIdString = String(activeProjectId);
            if (projectIdString === 'consolidated' || projectIdString.startsWith('consolidated_view_')) {
                setBudgetData(null);
                return;
            }

            if (projectIdString === 'null' || projectIdString === 'undefined' || projectIdString === '') {
                setBudgetData(null);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const apiData = await getBudget(activeProjectId);

                const transformedData = transformBudgetData(apiData);

                setBudgetData(transformedData);
            } catch (err) {
                console.error('Erreur lors du chargement du budget:', err);
                setError(err.message);
                setBudgetData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchBudgetData();
    }, [activeProjectId]);

    return { budgetData, loading, error };
};