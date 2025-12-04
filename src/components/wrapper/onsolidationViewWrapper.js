// components/ConsolidationViewWrapper.js
import React, { useEffect, useState } from 'react';
import ConsolidatedView from './ConsolidatedView';
import { useConsolidationData } from '../hooks/useConsolidationData';
import { useConsolidations } from '../hooks/useConsolidations';

const ConsolidationViewWrapper = ({ 
  consolidationId, 
  onBack, 
  onSave, 
  formatCurrency, 
  getProjectIcon, 
  getProjectColor 
}) => {
  const { data, loading, error, refetch } = useConsolidationData(consolidationId);
  const { consolidations } = useConsolidations();
  
  // Trouver la consolidation correspondante pour avoir son nom
  const consolidationInfo = consolidations?.find(c => c.id === parseInt(consolidationId)) || null;

  // Fonction pour sauvegarder la vue consolidée
  const handleSave = async () => {
    if (onSave) {
      try {
        await onSave({
          id: consolidationId,
          name: consolidationInfo?.name || 'Vue consolidée',
          data
        });
      } catch (err) {
        console.error('Erreur lors de la sauvegarde:', err);
      }
    }
  };

  // Fonction pour recharger les données
  const handleRefresh = () => {
    refetch();
  };

  return (
    <ConsolidatedView
      consolidatedViewData={consolidationInfo}
      data={data}
      loading={loading}
      error={error}
      onBack={onBack}
      onSave={handleSave}
      formatCurrency={formatCurrency}
      getProjectIcon={getProjectIcon}
      getProjectColor={getProjectColor}
      onRefresh={handleRefresh}
    />
  );
};

export default ConsolidationViewWrapper;