import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useData } from '../../../components/context/DataContext.jsx';
import { useUI } from '../../../components/context/UIContext.jsx';
import { useBudgetData } from '../../../hooks/useBudgetData.jsx';
import { useActiveProjectData } from '../../../hooks/useActiveProjectData.jsx';
import BudgetTableView from './BudgetTableView.jsx';
import BudgetMobileView from './BudgetMobileView.jsx';
import BudgetTableSkeleton from './BudgetTableSkeleton.jsx';
import BudgetLineDialog from '../../../pages/clients/budget/BudgetLineDialog.jsx';
import toast from 'react-hot-toast';

const BudgetTracker = ({
  quickFilter,
  showTemporalToolbar = true,
  visibleColumns: visibleColumnsProp,
  showViewModeSwitcher = true,
  showNewEntryButton = true
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [budget, setBudget] = useState({});
  const [editingLine, setEditingLine] = useState(null);
  const { dataState, dataDispatch } = useData();
  const { uiState, uiDispatch } = useUI();
  const { projects, categories, settings, vatRegimes, taxConfigs, loans, tiers } = dataState;
  const { activeProjectId, timeUnit, horizonLength, periodOffset, activeQuickSelect } = uiState;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMonthOffset, setMobileMonthOffset] = useState(0);
  const [tableauMode, setTableauMode] = useState('edition');
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodMenuRef = useRef(null);
  const { budgetData, loading, error } = useBudgetData(activeProjectId);
  const { refetch } = useBudgetData(activeProjectId);

  const {
    budgetEntries,
    actualTransactions,
    cashAccounts,
    activeProject,
    isConsolidated,
    isCustomConsolidated,
    loading: dataLoading,
    error: dataError
  } = useActiveProjectData(dataState, uiState, budgetData);

  const finalBudgetEntries = budgetEntries;
  const finalActualTransactions = actualTransactions;

  const finalCashAccounts = useMemo(() => {
    if (!activeProjectId || activeProjectId === 'null') {
      return [];
    }

    if (cashAccounts?.length > 0) {
      return cashAccounts;
    }

    if (budgetData?.cashAccounts?.length > 0) {
      return budgetData.cashAccounts;
    }

    if (dataState.allCashAccounts && dataState.allCashAccounts[activeProjectId]?.length > 0) {
      return dataState.allCashAccounts[activeProjectId];
    }
    return [];
  }, [dataState.allCashAccounts, activeProjectId, budgetData?.cashAccounts, cashAccounts]);

  const finalCategories = categories;

  const visibleColumns = useMemo(() => visibleColumnsProp || { budget: true, actual: true, reste: false, description: true }, [visibleColumnsProp]);

  // Gestion du responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gestion du clic en dehors du menu des périodes
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(event.target)) {
        setIsPeriodMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchBudgetData = async () => {
    try {
      if (budgetData?.refetch) {
        await budgetData.refetch();
      }
    } catch (error) {
      console.error('Error refreshing budget data:', error);
    }
  };

  const handleDialogClose = (open) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingLine(null);
    }
  };

  const handleBudgetAdded = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    if (refetch) {
      refetch();
    } else {
      console.log('refetch non disponible, utilisation de refreshKey uniquement');
    }
  }, [refetch]);

  const handleBudgetUpdated = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    if (refetch) {
      refetch();
    }
  }, [refetch]);

  const handleEditEntry = (entry) => {
    // Pour les vues consolidées, désactiver l'édition
    if (isConsolidated || isCustomConsolidated) {
      toast.error('L\'édition n\'est pas disponible en vue consolidée');
      return;
    }
    console.log('Editing entry:', entry);
    setEditingLine(entry);
    setIsDialogOpen(true);
  };

  const handleAddNewLine = () => {
    // Pour les vues consolidées, désactiver l'ajout
    if (isConsolidated || isCustomConsolidated) {
      toast.error('L\'ajout n\'est pas disponible en vue consolidée');
      return;
    }
    setEditingLine(null);
    setIsDialogOpen(true);
  };

  const startsWithConsolidatedView =
    typeof activeProjectId === 'string' &&
    activeProjectId.startsWith('consolidated_view_');

  const isValidProject =
    typeof activeProjectId === 'string' &&
    activeProjectId !== 'consolidated' &&
    !startsWithConsolidatedView;

  const shouldShowLoading =
    loading && !isConsolidated && !isCustomConsolidated && isValidProject;

  const shouldShowError =
    error && !isConsolidated && !isCustomConsolidated && isValidProject;

  const hasData = finalBudgetEntries?.length > 0 || finalActualTransactions?.length > 0 || isConsolidated || isCustomConsolidated;

  // Si c'est une vue consolidée sans données, afficher un message
  if ((isConsolidated || isCustomConsolidated) && !finalBudgetEntries?.length && !dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <div className="flex items-center justify-center w-16 h-16 mb-4 bg-purple-100 rounded-full">
          <ChevronDown className="w-8 h-8 text-purple-600" />
        </div>
        <div className="mb-2 text-lg font-medium">Tableau de trésorerie consolidé</div>
        <div className="text-sm text-center">
          {activeProject?.name ? (
            <>Aucune donnée trouvée pour la vue consolidée "<span className="font-semibold">{activeProject.name}</span>"</>
          ) : (
            'Aucune donnée disponible pour cette vue consolidée'
          )}
        </div>
      </div>
    );
  }

  if (shouldShowLoading) {
    return <BudgetTableSkeleton isMobile={isMobile} />;
  }

  if (shouldShowError) {
    return (
      <div className="p-4 text-red-600 bg-red-100 rounded-lg">
        Erreur lors du chargement du budget: {error}
      </div>
    );
  }

  if (!hasData && activeProjectId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <div className="mb-2 text-lg">Aucune donnée budgétaire disponible</div>
        <div className="text-sm">Créez votre première entrée budgétaire pour commencer</div>
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <BudgetMobileView
          finalBudgetEntries={finalBudgetEntries}
          finalActualTransactions={finalActualTransactions}
          finalCategories={finalCategories}
          vatRegimes={vatRegimes}
          taxConfigs={taxConfigs}
          activeProjectId={activeProjectId}
          isConsolidated={isConsolidated}
          isCustomConsolidated={isCustomConsolidated}
          mobileMonthOffset={mobileMonthOffset}
          setMobileMonthOffset={setMobileMonthOffset}
          settings={settings}
          activeProject={activeProject}
        />
      ) : (
        <BudgetTableView
          key={refreshKey}
          finalBudgetEntries={finalBudgetEntries}
          finalActualTransactions={finalActualTransactions}
          finalCashAccounts={finalCashAccounts}
          finalCategories={finalCategories}
          vatRegimes={vatRegimes}
          taxConfigs={taxConfigs}
          activeProjectId={activeProjectId}
          isConsolidated={isConsolidated}
          isCustomConsolidated={isCustomConsolidated}
          projects={projects}
          settings={settings}
          activeProject={activeProject}
          timeUnit={timeUnit}
          horizonLength={horizonLength}
          periodOffset={periodOffset}
          activeQuickSelect={activeQuickSelect}
          visibleColumns={visibleColumns}
          tableauMode={tableauMode}
          setTableauMode={setTableauMode}
          showTemporalToolbar={showTemporalToolbar}
          showViewModeSwitcher={!isConsolidated && !isCustomConsolidated && showViewModeSwitcher}
          showNewEntryButton={!isConsolidated && !isCustomConsolidated && showNewEntryButton}
          quickFilter={quickFilter}
          dataState={dataState}
          dataDispatch={dataDispatch}
          uiDispatch={uiDispatch}
          periodMenuRef={periodMenuRef}
          isPeriodMenuOpen={isPeriodMenuOpen}
          setIsPeriodMenuOpen={setIsPeriodMenuOpen}
          onEdit={handleEditEntry}
          onRefresh={fetchBudgetData}
        />
      )}

      {/* Dialogue d'ajout/modification (seulement pour les projets normaux) */}
      {!isConsolidated && !isCustomConsolidated && (
        <BudgetLineDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          onBudgetAdded={handleBudgetUpdated}
          onBudgetUpdated={handleBudgetUpdated}
          data={budget}
          editLine={editingLine}
          projectId={activeProjectId}
        />
      )}
    </>
  );
};

export default BudgetTracker;