import { useState, useEffect } from 'react';
import { getBudget } from '../components/context/budgetAction';
import { transformBudgetData } from '../utils/transformBudgetData';

export const useBudgetData = (activeProjectId) => {
    const [budgetData, setBudgetData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBudgetData = async () => {
            // ✅ Vérifications au début de la fonction async
            if (!activeProjectId) {
                console.log('useBudgetData - Aucun projectId fourni');
                setBudgetData(null);
                return;
            }

            const projectIdString = String(activeProjectId);
            if (projectIdString === 'consolidated' || projectIdString.startsWith('consolidated_view_')) {
                console.log('useBudgetData - Projet consolidé, pas d\'appel API');
                setBudgetData(null);
                return;
            }

            // ✅ CORRECTION: Vérifier que c'est un ID de projet valide (nombre ou UUID)
            if (projectIdString === 'null' || projectIdString === 'undefined' || projectIdString === '') {
                console.log('useBudgetData - ID de projet invalide:', activeProjectId);
                setBudgetData(null);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                console.log('useBudgetData - Appel API pour projectId:', activeProjectId);
                const apiData = await getBudget(activeProjectId);
                console.log('useBudgetData - Données API reçues:', apiData);
                
                const transformedData = transformBudgetData(apiData);
                console.log('useBudgetData - Données transformées:', transformedData);
                
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