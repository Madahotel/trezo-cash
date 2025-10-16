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
import {
  SimpleTabs,
  SimpleTabsList,
  SimpleTabsTrigger,
  SimpleTabsContent,
} from './ui/tabs';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

import BudgetLineDialog from './BudgetLineDialog';
import ConfirmationModal from './ui/alert-dialog';
import { formatCurrency } from '../../../utils/formatting';
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
  const [budget, setBudget] = useState([]);

  const handleEdit = (item, type) => {
    console.log('Modifier:', item, type);
  };

  const handleArchive = (item, type) => {
    console.log('Archiver:', item, type);
  };

  const handleDelete = (item, type) => {
    console.log('Supprimer:', item, type);
  };
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.montant, 0);
  };

  const calculateReel = (items) => {
    return items.reduce((sum, item) => sum + item.reel, 0);
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

  const getFrequencyBadge = (frequency) => {
    const frequencyMap = {
      one_time: { label: 'Une fois', color: 'bg-gray-100 text-gray-700' },
      daily: { label: 'Quotidien', color: 'bg-blue-100 text-blue-700' },
      weekly: { label: 'Hebdomadaire', color: 'bg-green-100 text-green-700' },
      biweekly: { label: 'Bimensuel', color: 'bg-purple-100 text-purple-700' },
      monthly: { label: 'Mensuel', color: 'bg-indigo-100 text-indigo-700' },
      bimonthly: { label: 'Bimestriel', color: 'bg-pink-100 text-pink-700' },
      quarterly: {
        label: 'Trimestriel',
        color: 'bg-orange-100 text-orange-700',
      },
      semiannual: { label: 'Semestriel', color: 'bg-teal-100 text-teal-700' },
      annual: { label: 'Annuel', color: 'bg-cyan-100 text-cyan-700' },
    };
    const freq = frequencyMap[frequency] || frequencyMap.monthly;
    return <Badge className={freq.color}>{freq.label}</Badge>;
  };

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        setLoading(true);

        const data = await getBudget(idProjet); // Remplace idProjet par ta variable
        setBudget(data);
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBudget();
  }, [idProjet]);
  if (loading) return;
  console.log(budget);

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
        onOpenChange={setIsDialogOpen}
        // onSave={handleSaveBudgetLine}
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
              {/* {calculateTotal(budgetData.revenus).toLocaleString()} € */}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {/* Réalisé: {calculateReel(budgetData.revenus).toLocaleString()} € */}
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
              {/* {calculateTotal(budgetData.depenses).toLocaleString()} € */}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {/* Réalisé: {calculateReel(budgetData.depenses).toLocaleString()} € */}
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
            {/* <div className="text-2xl font-bold text-blue-600">
              {(
                calculateTotal(budgetData.revenus) -
                calculateTotal(budgetData.depenses)
              ).toLocaleString()}{' '}
              €
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Réalisé:{' '}
              {(
                calculateReel(budgetData.revenus) -
                calculateReel(budgetData.depenses)
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
