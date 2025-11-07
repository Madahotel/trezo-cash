import { useProjectActions } from './useProjectActions';
import { useBudgetEntryActions } from './useBudgetEntryActions';
// Import d'autres hooks spécialisés...

export const useApiActions = () => {
  const projectActions = useProjectActions();
  const budgetEntryActions = useBudgetEntryActions();


  return {
    initializeProject: projectActions.initializeProject,
    updateProjectSettings: projectActions.updateProjectSettings,
    deleteProject: projectActions.deleteProject,
    updateOnboardingStep: projectActions.updateOnboardingStep,


    saveEntry: budgetEntryActions.saveEntry,
    deleteEntry: budgetEntryActions.deleteEntry,
  };
};
//Ity hook ity no mitantana ny asa (actions) rehetra mifandray amin’ny projet (créer, modifier, supprimer, mettre à jour une étape…).