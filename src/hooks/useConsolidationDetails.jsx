import { useState, useEffect } from 'react';
import { useAuth } from '../components/context/AuthContext';
import axios from '../components/config/Axios';

export const useConsolidationDetails = (consolidationId) => {
  const { user } = useAuth();
  const [consolidationDetails, setConsolidationDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConsolidationDetails = async () => {
    if (!user?.token || !consolidationId) {
      setConsolidationDetails(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/consolidations/${consolidationId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      const data = response.data;
      console.log('Détails consolidation reçus:', data);
      
      // Extraire les données selon la structure de votre API
      if (data.data) {
        setConsolidationDetails(data.data);
      } else if (data.consolidation) {
        setConsolidationDetails(data.consolidation);
      } else {
        setConsolidationDetails(data);
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des détails de consolidation:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement');
      setConsolidationDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsolidationDetails();
  }, [user?.token, consolidationId]);

  const refetch = () => {
    fetchConsolidationDetails();
  };

  return { consolidationDetails, loading, error, refetch };
};