
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConsolidationProjects } from '../../../hooks/useConsolidationProjects';
import ConsolidatedView from '../../../pages/clients/consolidate/ConsolidatedView';
import { formatCurrency } from '../../../utils/formatting';
import { getProjectIcon, getProjectColor } from '../../../utils/projectUtils';

const ConsolidatedViewPage = () => {
  const { id } = useParams(); // L'ID de la consolidation (ex: "2" pour consolidated_view_2)
  const navigate = useNavigate();
  
  const { 
    consolidationDetails, 
    stats,
    loading, 
    error, 
    refetch 
  } = useConsolidationProjects(id);

  const handleBack = () => {
    navigate('/client/dashboard');
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSave = () => {
    // Implémenter la logique de sauvegarde
    console.log('Sauvegarde de la vue consolidée', consolidationDetails);
    // Vous pouvez ajouter une API call ici
  };

  const handleEdit = () => {
    navigate(`/client/consolidations/${id}/edit`);
  };

  const handleArchive = async () => {
    // Implémenter l'archivage via API
    try {
      // await archiveConsolidation(id);
      alert('Vue consolidée archivée avec succès');
      navigate('/client/dashboard');
    } catch (err) {
      console.error('Erreur lors de l\'archivage:', err);
      alert('Erreur lors de l\'archivage');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vue consolidée ?')) {
      try {
        // await deleteConsolidation(id);
        alert('Vue consolidée supprimée avec succès');
        navigate('/client/dashboard');
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Fonction utilitaire pour formatter la devise
  const formatCurrencyLocal = (amount, currency = 'EUR') => {
    return formatCurrency ? formatCurrency(amount, currency) : `${amount.toFixed(2)} ${currency}`;
  };

  // Fonctions par défaut si non fournies
  const getProjectIconLocal = (typeName) => {
    return getProjectIcon ? getProjectIcon(typeName) : null;
  };

  const getProjectColorLocal = (typeName) => {
    return getProjectColor ? getProjectColor(typeName) : 'gray';
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 md:p-6">
      <ConsolidatedView
        consolidatedViewData={{
          id: id,
          name: consolidationDetails?.name || 'Vue Consolidée',
          description: consolidationDetails?.description,
          project_ids: consolidationDetails?.project_ids || [],
          created_at: consolidationDetails?.created_at,
        }}
        onBack={handleBack}
        onSave={handleSave}
        onRefresh={handleRefresh}
        formatCurrency={formatCurrencyLocal}
        getProjectIcon={getProjectIconLocal}
        getProjectColor={getProjectColorLocal}
        loading={loading}
        error={error?.message || error}
        data={stats}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ConsolidatedViewPage;