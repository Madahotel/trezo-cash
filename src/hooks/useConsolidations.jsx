import { useState, useEffect, useCallback } from 'react';
import axios from '../components/config/Axios';

export const useConsolidations = () => {
  const [consolidations, setConsolidations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConsolidations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/consolidations');
      if (response.status === 200) {
        setConsolidations(response.data.consolidations.consolidation_items);
      } else {
        setConsolidations([]);
      }
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des consolidations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsolidations();
  }, [fetchConsolidations]);

  return { consolidations, loading, error, refetch: fetchConsolidations };
};
