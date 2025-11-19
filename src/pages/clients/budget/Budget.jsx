import React, { useEffect, useState, useRef } from 'react';
import { useUI } from '../../../components/context/UIContext';
import { Plus, TrendingUp, TrendingDown, Target } from 'lucide-react';
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
    initial: true,
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
      setLoadingState({
        summary: true,
        table: true,
        initial: retryCount === 0 && loadingState.initial,
      });

      setError(null);
      console.log(
        `🔄 Chargement budget projet ${activeProjectId}, tentative ${
          retryCount + 1
        }`
      );

      const data = await getBudget(activeProjectId);

      if (requestId === currentRequestId.current) {
        setBudget(data);
        setLoadingState({
          summary: false,
          table: false,
          initial: false,
        });
      }
    } catch (err) {
      if (err.response?.status === 429) {
        const delay = Math.pow(2, retryCount) * 1000;

        if (retryCount < 3) {
          console.warn(
            `⏳ Trop de requêtes, nouvelle tentative dans ${delay}ms...`
          );

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

      if (requestId === currentRequestId.current) {
        setLoadingState({
          summary: false,
          table: false,
          initial: false,
        });
      }
    }
  };

  // Recharger les données quand le projet actif change
  useEffect(() => {
    if (activeProjectId && typeof activeProjectId === 'number') {
      currentRequestId.current++;
      setLoadingState({
        summary: true,
        table: true,
        initial: true,
      });

      const timer = setTimeout(() => {
        fetchBudgetData();
      }, 300);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setLoadingState({
        summary: false,
        table: false,
        initial: false,
      });
    }
  }, [activeProjectId]);

  const handleBudgetUpdated = async () => {
    await fetchBudgetData();
  };

  const handleEdit = (item, type) => {
    setEditingLine(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (item, type) => {
    setSelectedLine(item);
    setDeleteType(type);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedLine) {
      try {
        await destroyBudget(selectedLine.id);

        setTimeout(() => {
          fetchBudgetData();
        }, 500);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);

        if (error.response?.status === 429) {
          setError(
            'Trop de requêtes. Veuillez patienter avant de supprimer à nouveau.'
          );
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

  // Composant de chargement moderne pour les cartes
  const LoadingCard = () => (
    <Card className="border-0 animate-pulse bg-gradient-to-br from-gray-50 to-gray-100/50">
      <CardHeader className="pb-3">
        <div className="w-24 h-4 mb-2 bg-gray-200 rounded-full"></div>
        <div className="w-32 h-6 bg-gray-200 rounded-full"></div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="h-10 bg-gray-200 rounded-xl w-28"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        </div>
      </CardContent>
    </Card>
  );

  // Gestion des erreurs pour projets consolidés
  if (typeof activeProjectId === 'string') {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-yellow-100 rounded-full">
            <Target className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900">
            Vue consolidée
          </h2>
          <p className="mb-4 leading-relaxed text-gray-600">
            La fonctionnalité Budget n'est pas disponible en vue consolidée.
            Veuillez sélectionner un projet spécifique pour accéder à la gestion
            détaillée du budget.
          </p>
        </div>
      </div>
    );
  }

  if (!activeProjectId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-500">
            Sélectionnez un projet pour commencer
          </p>
        </div>
      </div>
    );
  }

  if (error && !loadingState.initial) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Erreur de chargement
          </h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="">
        {/* Header avec le nom du projet */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text">
              Budget
            </h1>
            <p className="text-lg text-gray-600">
              Gérez vos revenus et dépenses pour{' '}
              <span className="font-semibold text-gray-900">
                {uiState.activeProject?.name || 'le projet'}
              </span>
            </p>
          </div>

          {!isMobile && !loadingState.initial && (
            <Button
              onClick={handleAddNewLine}
              className="px-6 py-3 font-semibold text-white transition-all duration-200 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl rounded-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle ligne
            </Button>
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

        {/* Summary Cards avec design moderne */}
        <div className="grid gap-6 md:grid-cols-3">
          {loadingState.summary ? (
            <>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </>
          ) : (
            <>
              {/* Carte Revenus */}
              <Card className="transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50/50 hover:shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-600 uppercase">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Revenus prévus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-green-700">
                      {formatCurrency(budget.sumEntries)}
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carte Dépenses */}
              <Card className="transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-red-50 to-orange-50/50 hover:shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-600 uppercase">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Dépenses prévues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-red-700">
                      {formatCurrency(budget.sumExpenses)}
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carte Solde */}
              <Card className="transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50/50 hover:shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-600 uppercase">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Solde prévisionnel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-blue-700">
                      {formatCurrency(budget.sumForecast)}
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Budget Table avec chargement indépendant */}
        {!isMobile && (
          <div className="mt-8">
            {loadingState.table ? (
              <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-2">
                    <div className="w-48 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-64 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded-xl w-28 animate-pulse"></div>
                </div>

                <div className="flex p-2 mb-8 space-x-2 bg-gray-100 rounded-xl">
                  <div className="flex-1 px-4 py-3 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1 px-4 py-3 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>

                <div className="space-y-4">
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="h-20 bg-gray-200 rounded-2xl animate-pulse"
                    ></div>
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

        {/* Bouton mobile flottant */}
        {isMobile && !loadingState.initial && (
          <div className="fixed z-50 bottom-6 right-6">
            <Button
              onClick={handleAddNewLine}
              className="transition-all duration-200 rounded-full shadow-lg w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-xl"
              size="icon"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetPage;
