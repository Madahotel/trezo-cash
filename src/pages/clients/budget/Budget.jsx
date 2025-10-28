import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

import BudgetLineDialog from './BudgetLineDialog';
import ConfirmationModal from './ui/alert-dialog';
import { useMobile } from '../../../hooks/useMobile';
import { getBudget } from '../../../components/context/budgetAction';
import BudgetTable from './BudgetTable';

const BudgetPage = () => {
  const idProjet = 1;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const isMobile = useMobile();
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState({});

  // Fonction pour charger les données du budget
  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const data = await getBudget(idProjet);
      setBudget(data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction appelée quand une nouvelle ligne est ajoutée ou modifiée
  const handleBudgetUpdated = async () => {
    await fetchBudgetData();
  };

  const handleEdit = (item) => {
    console.log('Modifier:', item);
    setEditingLine(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (item) => {
    console.log('Supprimer:', item);
    setSelectedLine(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedLine) {
      console.log('Suppression confirmée pour:', selectedLine);
      // Ici vous appelleriez votre API de suppression
      // await deleteBudget(selectedLine.id);
      setDeleteModalOpen(false);
      setSelectedLine(null);
      // Recharger les données après suppression
      fetchBudgetData();
    }
  };

  // Reset editingLine quand le dialog se ferme
  const handleDialogClose = (open) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingLine(null);
    }
  };

  // Ouvrir le dialogue en mode création
  const handleAddNewLine = () => {
    setEditingLine(null);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchBudgetData();
  }, [idProjet]);

  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center">
        <div>Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budget</h1>
          <p className="text-gray-600">Gérez vos revenus et dépenses</p>
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
      />

      {/* Modal de suppression */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer cette ligne budgétaire ? Cette action est irréversible."
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
              {budget.sumEntries || '0'} €
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
              {budget.sumExpenses || '0'} €
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
              {budget.sumForecast || '0'} €
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
