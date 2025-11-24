import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useData } from '../../../components/context/DataContext.jsx';
import { useUI } from '../../../components/context/UIContext.jsx';
import { useBudgetData } from '../../../hooks/useBudgetData.jsx';
import { useActiveProjectData } from '../../../hooks/useActiveProjectData.jsx';
import BudgetTableView from './BudgetTableView.jsx';
import BudgetMobileView from './BudgetMobileView.jsx';

const BudgetTracker = ({
  quickFilter,
  showTemporalToolbar = true,
  visibleColumns: visibleColumnsProp,
  showViewModeSwitcher = true,
  showNewEntryButton = true
}) => {
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

  const { 
    budgetEntries, 
    actualTransactions, 
    cashAccounts, 
    activeProject, 
    isConsolidated, 
    isCustomConsolidated 
  } = useActiveProjectData(dataState, uiState, budgetData);

  const finalBudgetEntries = budgetEntries;
  const finalActualTransactions = actualTransactions;
  
  const finalCashAccounts = useMemo(() => {
    // Vérifier d'abord si activeProjectId est valide
    if (!activeProjectId || activeProjectId === 'null') {
      return [];
    }

    // Priorité 1: Données du hook useActiveProjectData
    if (cashAccounts?.length > 0) {
      return cashAccounts;
    }
    
    // Priorité 2: Données de l'API
    if (budgetData?.cashAccounts?.length > 0) {
      return budgetData.cashAccounts;
    }
    
    // Priorité 3: Données du contexte global
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

  // ✅ CORRECTION: Logique de chargement améliorée
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

  // ✅ CORRECTION: Vérifier si on a des données à afficher
  const hasData = finalBudgetEntries?.length > 0 || finalActualTransactions?.length > 0 || isConsolidated || isCustomConsolidated;

  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Chargement des données budgétaires...</div>
      </div>
    );
  }

  if (shouldShowError) {
    return (
      <div className="p-4 text-red-600 bg-red-100 rounded-lg">
        Erreur lors du chargement du budget: {error}
      </div>
    );
  }

  // ✅ CORRECTION: Afficher un état vide si pas de données
  if (!hasData && activeProjectId) {
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
          // showTemporalToolbar={showTemporalToolbar}
          showTemporalToolbar={true}
          showViewModeSwitcher={showViewModeSwitcher}
          showNewEntryButton={showNewEntryButton}
          quickFilter={quickFilter}
          dataState={dataState}
          dataDispatch={dataDispatch}
          uiDispatch={uiDispatch}
          periodMenuRef={periodMenuRef}
          isPeriodMenuOpen={isPeriodMenuOpen}
          setIsPeriodMenuOpen={setIsPeriodMenuOpen}
        />
      )}
    </>
  );
};

export default BudgetTracker;