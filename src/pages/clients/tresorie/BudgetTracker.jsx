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
  showNewEntryButton = true,
  consolidatedData = null, // Nouveau prop pour les données consolidées
  isConsolidated = false, // Nouveau prop explicite
  isCustomConsolidated = false // Nouveau prop explicite
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
    isConsolidated: hookIsConsolidated,
    isCustomConsolidated: hookIsCustomConsolidated,
    loading: dataLoading,
    error: dataError,
    consolidatedBudgetData: hookConsolidatedData
  } = useActiveProjectData(dataState, uiState, budgetData);

  // Utiliser les props explicites ou les données du hook
  const finalIsConsolidated = isConsolidated || hookIsConsolidated;
  const finalIsCustomConsolidated = isCustomConsolidated || hookIsCustomConsolidated;
  const finalConsolidatedData = consolidatedData || hookConsolidatedData;

  // Gestion spéciale pour les données consolidées
  const finalBudgetEntries = useMemo(() => {
    if (finalIsConsolidated || finalIsCustomConsolidated) {
      console.log('BudgetTracker - Mode consolidé détecté');
      console.log('- finalConsolidatedData:', finalConsolidatedData);
      
      // Si nous avons des données consolidées explicites, les utiliser
      if (finalConsolidatedData) {
        // Les données consolidées peuvent être dans différents formats
        if (finalConsolidatedData.budgetEntries && Array.isArray(finalConsolidatedData.budgetEntries)) {
          console.log('- Utilisation de budgetEntries consolidées:', finalConsolidatedData.budgetEntries.length);
          return finalConsolidatedData.budgetEntries;
        } else if (finalConsolidatedData.entries && Array.isArray(finalConsolidatedData.entries)) {
          console.log('- Utilisation de entries consolidées:', finalConsolidatedData.entries.length);
          return finalConsolidatedData.entries;
        }
      }
      
      // Sinon, utiliser les données du hook
      console.log('- Utilisation de budgetEntries du hook:', budgetEntries?.length);
      return budgetEntries;
    }
    
    // Mode normal - projet individuel
    return budgetEntries;
  }, [finalIsConsolidated, finalIsCustomConsolidated, finalConsolidatedData, budgetEntries]);

  const finalActualTransactions = actualTransactions;

  const finalCashAccounts = useMemo(() => {
    if (!activeProjectId || activeProjectId === 'null') {
      return [];
    }

    // Pour les vues consolidées, on peut agréger les comptes ou en utiliser un fictif
    if (finalIsConsolidated || finalIsCustomConsolidated) {
      console.log('BudgetTracker - Création des comptes consolidés');
      
      // Créer un compte consolidé fictif ou agréger les comptes des projets
      return [{
        id: `consolidated_account_${activeProjectId}`,
        name: 'Trésorerie Consolidée',
        initialBalance: 0, // Vous pourriez vouloir agréger les soldes initiaux
        currentBalance: 0,
        initialBalanceDate: new Date().toISOString().split('T')[0],
        projectId: activeProjectId,
        isConsolidated: true
      }];
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
  }, [dataState.allCashAccounts, activeProjectId, budgetData?.cashAccounts, cashAccounts, finalIsConsolidated, finalIsCustomConsolidated]);

  const finalCategories = categories;

const visibleColumns = useMemo(() => {
  if (visibleColumnsProp) {
    return {
      budget: true,
      actual: true,
      reste: false,
      description: true,
      project: true, 
      ...visibleColumnsProp
    };
  }
  
  return { 
    budget: true, 
    actual: true, 
    reste: false, 
    description: true,
    project: true 
  };
}, [visibleColumnsProp]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    if (finalIsConsolidated || finalIsCustomConsolidated) {
      toast.error('L\'édition n\'est pas disponible en vue consolidée');
      return;
    }
    setEditingLine(entry);
    setIsDialogOpen(true);
  };

  const handleAddNewLine = () => {
    if (finalIsConsolidated || finalIsCustomConsolidated) {
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
    loading && !finalIsConsolidated && !finalIsCustomConsolidated && isValidProject;

  const shouldShowError =
    error && !finalIsConsolidated && !finalIsCustomConsolidated && isValidProject;

  const hasData = finalBudgetEntries?.length > 0 || 
                  finalActualTransactions?.length > 0 || 
                  finalIsConsolidated || 
                  finalIsCustomConsolidated ||
                  (finalConsolidatedData && Object.keys(finalConsolidatedData).length > 0);

  if ((finalIsConsolidated || finalIsCustomConsolidated) && !finalBudgetEntries?.length && !dataLoading) {
    console.log('BudgetTracker - Affichage message aucune donnée consolidée');
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
        <div className="mt-4 text-xs text-gray-400">
          Debug: activeProjectId = {activeProjectId}, Entrées = {finalBudgetEntries?.length}
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

  console.log('BudgetTracker - Rendu final:', {
    isConsolidated: finalIsConsolidated,
    isCustomConsolidated: finalIsCustomConsolidated,
    budgetEntriesCount: finalBudgetEntries?.length,
    activeProject: activeProject?.name
  });

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
          isConsolidated={finalIsConsolidated}
          isCustomConsolidated={finalIsCustomConsolidated}
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
          isConsolidated={finalIsConsolidated}
          isCustomConsolidated={finalIsCustomConsolidated}
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
          showViewModeSwitcher={!finalIsConsolidated && !finalIsCustomConsolidated && showViewModeSwitcher}
          showNewEntryButton={!finalIsConsolidated && !finalIsCustomConsolidated && showNewEntryButton}
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

      {!finalIsConsolidated && !finalIsCustomConsolidated && (
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