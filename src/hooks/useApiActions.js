import { useProjectActions } from './useProjectActions';
import { useBudgetEntryActions } from './useBudgetEntryActions';
// Import d'autres hooks spécialisés...

export const useApiActions = () => {
  const projectActions = useProjectActions();
  const budgetEntryActions = useBudgetEntryActions();
  // ... autres actions

  return {
    // Project actions
    initializeProject: projectActions.initializeProject,
    updateProjectSettings: projectActions.updateProjectSettings,
    deleteProject: projectActions.deleteProject,
    updateOnboardingStep: projectActions.updateOnboardingStep,

    // Budget entry actions
    saveEntry: budgetEntryActions.saveEntry,
    deleteEntry: budgetEntryActions.deleteEntry,

    // ... autres actions fusionnées
  };
};