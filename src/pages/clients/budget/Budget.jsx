import React, { useEffect, useState } from 'react';
import { useUI } from '../../../components/context/UIContext';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

import BudgetLineDialog from './BudgetLineDialog';
import ConfirmationModal from './ui/alert-dialog';
import { useMobile } from '../../../hooks/useMobile';
import {
  getBudget,
  destroyBudget,
} from '../../../components/context/budgetAction';
import BudgetTable from './BudgetTable';
import { formatCurrency } from '../../../utils/formatters';

const BudgetPage = () => {
  const { uiState } = useUI(); // Récupération du state global
  const activeProjectId = uiState.activeProject?.id; // ID du projet actif

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'revenus' ou 'depenses'
  const isMobile = useMobile();
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState({});
  const [error, setError] = useState(null);

  // Fonction pour charger les données du budget
  const fetchBudgetData = async () => {
    if (!activeProjectId || typeof activeProjectId === 'string') {
      setError('Aucun projet valide sélectionné');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getBudget(activeProjectId);
      setBudget(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement du budget');
    } finally {
      setLoading(false);
    }
  };

  // Recharger les données quand le projet actif change
  useEffect(() => {
    if (activeProjectId && typeof activeProjectId === 'number') {
      fetchBudgetData();
    }
  }, [activeProjectId]);

  const handleBudgetUpdated = async () => {
    await fetchBudgetData();
  };

  const handleEdit = (item, type) => {
    console.log('Modifier:', item, type);
    setEditingLine(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (item, type) => {
    console.log('Supprimer:', item, type);
    setSelectedLine(item);
    setDeleteType(type);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedLine) {
      console.log('Suppression confirmée pour:', selectedLine);
      setDeleteModalOpen(false);
      setSelectedLine(null);
      fetchBudgetData();
      try {
        console.log('Suppression confirmée pour:', selectedLine);

        // Appel à l'API de suppression
        await destroyBudget(selectedLine.id);

        // Recharger les données après suppression
        await fetchBudgetData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      } finally {
        setDeleteModalOpen(false);
        setSelectedLine(null);
        setDeleteType(null);
      }
    }
  };

  const handleDialogClose = (open) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingLine(null);
    }
  };

  const handleAddNewLine = () => {
    setEditingLine(null);
    setIsDialogOpen(true);
  };

  // Gestion des erreurs pour projets consolidés
  if (typeof activeProjectId === 'string') {
    return (
      <div className="p-10 flex justify-center items-center">
        <div className="text-yellow-600 text-center">
          <h2 className="text-xl font-bold mb-2">Vue consolidée</h2>
          <p>
            La fonctionnalité Budget n'est pas disponible en vue consolidée.
          </p>
          <p className="text-sm mt-2">
            Veuillez sélectionner un projet spécifique.
          </p>
        </div>
      </div>
    );
  }

  if (!activeProjectId) {
    return (
      <div className="p-10 flex justify-center items-center">
        <div className="text-red-600">Aucun projet sélectionné</div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="p-10 flex justify-center items-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center">
        <div>Chargement du budget...</div>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-6">
      {/* Header avec le nom du projet */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budget</h1>
          <p className="text-gray-600">
            Gérez vos revenus et dépenses -{' '}
            {uiState.activeProject?.name || 'Projet'}
          </p>
        </div>
        {!isMobile && (
          <div className="flex gap-2">
            <Button onClick={handleAddNewLine}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle ligne
            </Button>
          </div>
        )}
      </div>

      {/* Budget Line Dialog */}
      <BudgetLineDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onBudgetAdded={handleBudgetUpdated}
        onBudgetUpdated={handleBudgetUpdated}
        data={budget}
        editLine={editingLine}
        projectId={activeProjectId}
      />

      {/* Modal de suppression */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedLine(null);
          setDeleteType(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        description={`Êtes-vous sûr de vouloir supprimer cette ligne de ${
          deleteType === 'revenus' ? 'revenu' : 'dépense'
        } ? Cette action est irréversible.`}
        confirmText="Supprimer"
        confirmColor="bg-red-600 hover:bg-red-700"
      />

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Revenus prévus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(budget.sumEntries)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Dépenses prévues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(budget.sumExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Solde prévisionnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(budget.sumForecast)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Table */}
      {!isMobile && (
        <div>
          <BudgetTable
            budgetData={budget}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
};

export default BudgetPage;
