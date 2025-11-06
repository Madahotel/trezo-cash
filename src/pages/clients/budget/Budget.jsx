import React, { useEffect, useState, useRef } from 'react';
import { useUI } from '../../../components/context/UIContext';
import { Plus, Loader } from 'lucide-react';
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
  const { uiState } = useUI(); 
  const activeProjectId = uiState.activeProject?.id;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const isMobile = useMobile();
  
  // État de chargement amélioré
  const [loadingState, setLoadingState] = useState({
    summary: false,
    table: false,
    initial: true
  });
  const [budget, setBudget] = useState({});
  const [error, setError] = useState(null);
  const currentRequestId = useRef(0);

  const fetchBudgetData = async (retryCount = 0) => {
    if (!activeProjectId || typeof activeProjectId === 'string') {
      setError('Aucun projet valide sélectionné');
      setLoadingState({ summary: false, table: false, initial: false });
      return;
    }

    const requestId = ++currentRequestId.current;

    try {
      // 🔥 CORRECTION : Toujours charger les deux sections ensemble
      setLoadingState({
        summary: true,
        table: true,
        initial: retryCount === 0 && loadingState.initial
      });

      setError(null);
      console.log(`🔄 Chargement budget projet ${activeProjectId}, tentative ${retryCount + 1}`);

      const data = await getBudget(activeProjectId);

      if (requestId === currentRequestId.current) {
        setBudget(data);
        
        // 🔥 CORRECTION : Mettre à jour les deux états de chargement
        setLoadingState({
          summary: false,
          table: false,
          initial: false
        });
      }

    } catch (err) {
      if (err.response?.status === 429) {
        const delay = Math.pow(2, retryCount) * 1000;

        if (retryCount < 3) {
          console.warn(`⏳ Trop de requêtes, nouvelle tentative dans ${delay}ms...`);

          setTimeout(() => {
            if (requestId === currentRequestId.current) {
              fetchBudgetData(retryCount + 1);
            }
          }, delay);
          return;
        } else {
          setError('Trop de tentatives. Veuillez patienter quelques minutes.');
        }
      } else {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement du budget');
      }
      
      // 🔥 CORRECTION : Toujours arrêter le chargement en cas d'erreur
      if (requestId === currentRequestId.current) {
        setLoadingState({ 
          summary: false, 
          table: false, 
          initial: false 
        });
      }
    }
  };

  // Recharger les données quand le projet actif change
  useEffect(() => {
    if (activeProjectId && typeof activeProjectId === 'number') {
      currentRequestId.current++;
      
      // Réinitialiser l'état de chargement pour un nouveau projet
      setLoadingState({
        summary: true,
        table: true,
        initial: true
      });

      const timer = setTimeout(() => {
        fetchBudgetData();
      }, 300);

      return () => {
        clearTimeout(timer);
      };
    } else {
      // Si pas de projet valide, arrêter le chargement
      setLoadingState({
        summary: false,
        table: false,
        initial: false
      });
    }
  }, [activeProjectId]);

  // 🔥 CORRECTION : Ajouter un useEffect pour debugger
  useEffect(() => {
    console.log('📊 État de chargement:', loadingState);
    console.log('📊 Données budget:', budget);
    console.log('📊 GroupedData potentiel:', budget?.entries?.entry_items?.category_names);
  }, [loadingState, budget]);

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
      try {
        console.log('Suppression confirmée pour:', selectedLine);
        await destroyBudget(selectedLine.id);

        setTimeout(() => {
          fetchBudgetData();
        }, 500);

      } catch (error) {
        console.error('Erreur lors de la suppression:', error);

        if (error.response?.status === 429) {
          setError('Trop de requêtes. Veuillez patienter avant de supprimer à nouveau.');
        }
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

  // Composant de chargement pour les cartes
  const LoadingCard = () => (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </CardContent>
    </Card>
  );

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

  if (error && !loadingState.initial) {
    return (
      <div className="p-10 flex justify-center items-center">
        <div className="text-red-600">{error}</div>
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
        {!isMobile && !loadingState.initial && (
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
        description={`Êtes-vous sûr de vouloir supprimer cette ligne de ${deleteType === 'revenus' ? 'revenu' : 'dépense'
          } ? Cette action est irréversible.`}
        confirmText="Supprimer"
        confirmColor="bg-red-600 hover:bg-red-700"
      />

      {/* Summary Cards avec chargement progressif */}
      <div className="grid md:grid-cols-3 gap-4">
        {loadingState.summary ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Budget Table avec chargement indépendant */}
      {!isMobile && (
        <div>
          {loadingState.table ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
                <div className="flex-1 rounded-md px-3 py-2 bg-gray-200 animate-pulse"></div>
                <div className="flex-1 rounded-md px-3 py-2 bg-gray-200 animate-pulse"></div>
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : (
            <BudgetTable
              budgetData={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loadingState.table}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetPage;