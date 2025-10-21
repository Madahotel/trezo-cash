import React, { useEffect, useState } from 'react';
import {
  Plus,
  Download,
  Upload,
  Filter,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  Tag,
} from 'lucide-react';
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
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const isMobile = useMobile();
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState({}); // Initialiser comme objet vide

  // Fonction pour charger les données du budget
  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const data = await getBudget(idProjet);
      setBudget(data);
      console.log('Données chargées:', data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction appelée quand une nouvelle ligne est ajoutée
  const handleBudgetAdded = async () => {
    await fetchBudgetData();
  };

  const handleEdit = (item, type) => {
    console.log('Modifier:', item, type);
    setEditingLine(item);
    setIsDialogOpen(true);
  };

  const handleArchive = (item, type) => {
    console.log('Archiver:', item, type);
    setSelectedLine(item);
    setArchiveModalOpen(true);
  };

  const handleDelete = (item, type) => {
    console.log('Supprimer:', item, type);
    setSelectedLine(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedLine) {
      const type = selectedLine.type === 'revenue' ? 'revenus' : 'depenses';
      setDeleteModalOpen(false);
      setSelectedLine(null);
    }
  };

  const confirmArchive = () => {
    if (selectedLine) {
      const type = selectedLine.type === 'revenue' ? 'revenus' : 'depenses';
      setArchiveModalOpen(false);
      setSelectedLine(null);
    }
  };

  // Reset editingLine quand le dialog se ferme
  const handleDialogClose = (open) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingLine(null);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [idProjet]);

  if (loading) return <div>Chargement...</div>;

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
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Importer
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button
              onClick={() => {
                console.log('Opening dialog...');
                setEditingLine(null); // S'assurer qu'on est en mode création
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle ligne
            </Button>
          </div>
        )}
      </div>

      {/* Budget Line Dialog */}
      <BudgetLineDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose} // Utiliser la nouvelle fonction
        onBudgetAdded={handleBudgetAdded} // Callback pour recharger les données
        data={budget}
        editLine={editingLine}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer cette ligne budgétaire ? Cette action est irréversible."
        confirmText="Supprimer"
        confirmColor="bg-red-600 hover:bg-red-700"
      />

      {/* Modal d'archivage */}
      <ConfirmationModal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={confirmArchive}
        title="Confirmer l'archivage"
        description="Êtes-vous sûr de vouloir archiver cette ligne budgétaire ?"
        confirmText="Archiver"
        confirmColor="bg-blue-600 hover:bg-blue-700"
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
              {budget.sumEntries} €
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {/* Réalisé: {calculateReel(budget.revenus).toLocaleString()} € */}
            </p>
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
              {budget.sumExpenses} €
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {/* Réalisé: {calculateReel(budget.depenses).toLocaleString()} € */}
            </p>
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
              {budget.sumForecast}€
            </div>
            {/* <p className="text-xs text-gray-600 mt-1">
              Réalisé:{' '}
              {(
                calculateReel(budget.revenus) -
                calculateReel(budget.depenses)
              ).toLocaleString()}{' '}
              €
            </p> */}
          </CardContent>
        </Card>
      </div>

      {/* Budget Table */}
      {!isMobile && (
        <div>
          <BudgetTable
            budgetData={budget}
            isMobile={false}
            onEdit={handleEdit}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
};

export default BudgetPage;
