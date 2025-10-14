import React, { useState } from 'react';
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
const BudgetPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const isMobile = useMobile();
  // Fonction pour obtenir les classes de couleur
  const getColorClasses = (color) => {
    const colorClasses = {
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
      stone: { bg: 'bg-stone-100', text: 'text-stone-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
    };
    return colorClasses[color] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  const [budgetData, setBudgetData] = useState({
    revenus: [
      {
        id: 1,
        type: 'revenue',
        mainCategory: 'ventes_produits_services',
        subcategory: 'ca_principal',
        categoryName: 'Ventes de produits/services',
        subcategoryName: 'Chiffre affaires principal',
        categoryColor: 'green',
        montant: 45000,
        currency: 'EUR',
        reel: 42300,
        ecart: -2700,
        frequency: 'monthly',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        isIndefinite: false,
        description: 'Ventes mensuelles principales',
      },
      {
        id: 2,
        type: 'revenue',
        mainCategory: 'ventes_produits_services',
        subcategory: 'prestations',
        categoryName: 'Ventes de produits/services',
        subcategoryName: 'Prestations de service',
        categoryColor: 'green',
        montant: 15000,
        currency: 'USD',
        reel: 16200,
        ecart: 1200,
        frequency: 'monthly',
        startDate: '2025-01-01',
        endDate: '',
        isIndefinite: true,
        description: 'Services de consulting',
      },
      {
        id: 3,
        type: 'revenue',
        mainCategory: 'subventions_aides',
        subcategory: 'aides_publiques',
        categoryName: 'Subventions et aides',
        subcategoryName: 'Aides publiques',
        categoryColor: 'orange',
        montant: 5000,
        currency: 'EUR',
        reel: 5000,
        ecart: 0,
        frequency: 'quarterly',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        isIndefinite: false,
        description: 'Subvention innovation',
      },
    ],
    depenses: [
      {
        id: 1,
        type: 'expense',
        mainCategory: 'remuneration_personnel',
        subcategory: 'salaires',
        categoryName: 'Rémunération du personnel',
        subcategoryName: 'Salaires',
        categoryColor: 'indigo',
        montant: 25000,
        currency: 'EUR',
        reel: 25000,
        ecart: 0,
        frequency: 'monthly',
        startDate: '2025-01-01',
        endDate: '',
        isIndefinite: true,
        description: 'Salaires équipe',
      },
      {
        id: 2,
        type: 'expense',
        mainCategory: 'logement',
        subcategory: 'loyer',
        categoryName: 'Logement',
        subcategoryName: 'Loyer',
        categoryColor: 'emerald',
        montant: 3000,
        currency: 'EUR',
        reel: 3000,
        ecart: 0,
        frequency: 'monthly',
        startDate: '2025-01-01',
        endDate: '',
        isIndefinite: true,
        description: 'Loyer bureau',
      },
      {
        id: 3,
        type: 'expense',
        mainCategory: 'achats_materiel',
        subcategory: 'materiel_bureau',
        categoryName: 'Achats de matériel',
        subcategoryName: 'Matériel de bureau',
        categoryColor: 'stone',
        montant: 5000,
        currency: 'USD',
        reel: 4200,
        ecart: -800,
        frequency: 'monthly',
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        isIndefinite: false,
        description: 'Équipement informatique',
      },
      {
        id: 4,
        type: 'expense',
        mainCategory: 'nourriture_restauration',
        subcategory: 'restaurant',
        categoryName: 'Nourriture & Restauration',
        subcategoryName: 'Restaurant',
        categoryColor: 'red',
        montant: 2000,
        currency: 'CAD',
        reel: 2300,
        ecart: 300,
        frequency: 'monthly',
        startDate: '2025-01-01',
        endDate: '',
        isIndefinite: true,
        description: "Repas d'affaires",
      },
    ],
  });

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.montant, 0);
  };

  const calculateReel = (items) => {
    return items.reduce((sum, item) => sum + item.reel, 0);
  };

  const handleSaveBudgetLine = (lineData) => {
    console.log('Saving budget line:', lineData);

    if (editingLine) {
      // Edit existing line
      const type = lineData.type === 'revenue' ? 'revenus' : 'depenses';
      setBudgetData((prev) => ({
        ...prev,
        [type]: prev[type].map((item) =>
          item.id === editingLine.id
            ? {
                ...item,
                type: lineData.type,
                mainCategory: lineData.mainCategory,
                subcategory: lineData.subcategory,
                categoryName: lineData.categoryName,
                subcategoryName: lineData.subcategoryName,
                categoryColor: lineData.categoryColor,
                montant: parseFloat(lineData.amount) || 0,
                currency: lineData.currency,
                frequency: lineData.frequency,
                startDate: lineData.startDate,
                endDate: lineData.endDate,
                isIndefinite: lineData.isIndefinite,
                description: lineData.description,
              }
            : item
        ),
      }));
      setEditingLine(null);
    } else {
      // Add new line
      const type = lineData.type === 'revenue' ? 'revenus' : 'depenses';
      const newLine = {
        id: Date.now(),
        type: lineData.type,
        mainCategory: lineData.mainCategory,
        subcategory: lineData.subcategory,
        categoryName: lineData.categoryName,
        subcategoryName: lineData.subcategoryName,
        categoryColor: lineData.categoryColor,
        montant: parseFloat(lineData.amount) || 0,
        currency: lineData.currency,
        reel: 0,
        ecart: 0,
        frequency: lineData.frequency,
        startDate: lineData.startDate,
        endDate: lineData.endDate,
        isIndefinite: lineData.isIndefinite,
        description: lineData.description,
        archived: false,
      };

      setBudgetData((prev) => ({
        ...prev,
        [type]: [...prev[type], newLine],
      }));
    }

    setIsDialogOpen(false);
  };

  const handleEditLine = (line, type) => {
    console.log('Editing line:', line);
    setEditingLine({
      ...line,
      type: type === 'revenus' ? 'revenue' : 'expense',
      amount: line.montant.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDeleteLine = (line, type) => {
    setSelectedLine({ ...line, type });
    setDeleteModalOpen(true);
  };

  const handleArchiveLine = (line, type) => {
    setSelectedLine({ ...line, type });
    setArchiveModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedLine) {
      const type = selectedLine.type === 'revenue' ? 'revenus' : 'depenses';
      setBudgetData((prev) => ({
        ...prev,
        [type]: prev[type].filter((item) => item.id !== selectedLine.id),
      }));
      setDeleteModalOpen(false);
      setSelectedLine(null);
    }
  };

  const confirmArchive = () => {
    if (selectedLine) {
      const type = selectedLine.type === 'revenue' ? 'revenus' : 'depenses';
      setBudgetData((prev) => ({
        ...prev,
        [type]: prev[type].map((item) =>
          item.id === selectedLine.id ? { ...item, archived: true } : item
        ),
      }));
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
  console.log('Is mobile:', isMobile);
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
        onSave={handleSaveBudgetLine}
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
              {calculateTotal(budgetData.revenus).toLocaleString()} €
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Réalisé: {calculateReel(budgetData.revenus).toLocaleString()} €
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
              {calculateTotal(budgetData.depenses).toLocaleString()} €
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Réalisé: {calculateReel(budgetData.depenses).toLocaleString()} €
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
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Détail du budget</CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SimpleTabs defaultTab="revenus">
            <SimpleTabsList className="grid grid-cols-2">
              <SimpleTabsTrigger value="revenus">Revenus</SimpleTabsTrigger>
              <SimpleTabsTrigger value="depenses">Dépenses</SimpleTabsTrigger>
            </SimpleTabsList>

            <SimpleTabsContent value="revenus">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Catégorie
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        Fréquence
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        Période
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Budget
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Réel
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Écart
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetData.revenus
                      .filter((item) => !item.archived)
                      .map((item) => {
                        const colorClass = getColorClasses(item.categoryColor);
                        const IconComponent = Tag;

                        return (
                          <tr
                            key={item.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-1.5 rounded-lg ${colorClass.bg} flex-shrink-0`}
                                >
                                  <IconComponent
                                    className={`w-4 h-4 ${colorClass.text}`}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <div className="font-medium text-gray-900">
                                    {item.categoryName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.subcategoryName}
                                  </div>
                                  {item.description && (
                                    <div className="text-xs text-gray-400 mt-0.5">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getFrequencyBadge(item.frequency)}
                            </td>
                            <td className="py-3 px-4 text-center text-sm text-gray-600">
                              <div className="flex items-center justify-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.startDate).toLocaleDateString(
                                  'fr-FR',
                                  { month: 'short', year: 'numeric' }
                                )}
                                {item.isIndefinite ? (
                                  <span className="ml-1">→ ∞</span>
                                ) : item.endDate ? (
                                  <span>
                                    →{' '}
                                    {new Date(item.endDate).toLocaleDateString(
                                      'fr-FR',
                                      { month: 'short', year: 'numeric' }
                                    )}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="text-right py-3 px-4">
                              <div className="flex items-center justify-end gap-1">
                                <span>
                                  {formatCurrency(item.montant, item.currency)}
                                </span>
                                {item.currency !== 'EUR' && (
                                  <span className="text-xs text-gray-500">
                                    ({item.currency})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-3 px-4">
                              {formatCurrency(item.reel, item.currency)}
                            </td>
                            <td
                              className={`text-right py-3 px-4 font-medium ${
                                item.ecart > 0
                                  ? 'text-green-600'
                                  : item.ecart < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {item.ecart > 0 ? '+' : ''}
                              {formatCurrency(item.ecart, item.currency)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditLine(item, 'revenus')
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleArchiveLine(item, 'revenus')
                                    }
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archiver
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteLine(item, 'revenus')
                                    }
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </SimpleTabsContent>

            <SimpleTabsContent value="depenses">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Catégorie
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        Fréquence
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        Période
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Budget
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Réel
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Écart
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetData.depenses
                      .filter((item) => !item.archived)
                      .map((item) => {
                        const colorClass = getColorClasses(item.categoryColor);
                        const IconComponent = Tag;

                        return (
                          <tr
                            key={item.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-1.5 rounded-lg ${colorClass.bg} flex-shrink-0`}
                                >
                                  <IconComponent
                                    className={`w-4 h-4 ${colorClass.text}`}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <div className="font-medium text-gray-900">
                                    {item.categoryName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.subcategoryName}
                                  </div>
                                  {item.description && (
                                    <div className="text-xs text-gray-400 mt-0.5">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getFrequencyBadge(item.frequency)}
                            </td>
                            <td className="py-3 px-4 text-center text-sm text-gray-600">
                              <div className="flex items-center justify-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.startDate).toLocaleDateString(
                                  'fr-FR',
                                  { month: 'short', year: 'numeric' }
                                )}
                                {item.isIndefinite ? (
                                  <span className="ml-1">→ ∞</span>
                                ) : item.endDate ? (
                                  <span>
                                    →{' '}
                                    {new Date(item.endDate).toLocaleDateString(
                                      'fr-FR',
                                      { month: 'short', year: 'numeric' }
                                    )}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="text-right py-3 px-4">
                              <div className="flex items-center justify-end gap-1">
                                <span>
                                  {formatCurrency(item.montant, item.currency)}
                                </span>
                                {item.currency !== 'EUR' && (
                                  <span className="text-xs text-gray-500">
                                    ({item.currency})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-3 px-4">
                              {formatCurrency(item.reel, item.currency)}
                            </td>
                            <td
                              className={`text-right py-3 px-4 font-medium ${
                                item.ecart > 0
                                  ? 'text-red-600'
                                  : item.ecart < 0
                                  ? 'text-green-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {item.ecart > 0 ? '+' : ''}
                              {formatCurrency(item.ecart, item.currency)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditLine(item, 'depenses')
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleArchiveLine(item, 'depenses')
                                    }
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archiver
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteLine(item, 'depenses')
                                    }
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </SimpleTabsContent>
          </SimpleTabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetPage;
