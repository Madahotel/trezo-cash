import { useCallback } from "react";
import { projectInitializationService } from "../services/ProjectInitializationService";
import { useToast } from "../context/ToastContext";
import { useLoading } from "../context/LoadingContext";

export const useProjectInitialization = () => {
  const { addToast } = useToast();
  const { setLoading } = useLoading();

  const initializeProject = useCallback(
    async (dataDispatch, uiDispatch, payload, user) => {
      try {
        setLoading(true);

        const result = await projectInitializationService.initializeProject(
          { dataDispatch, uiDispatch },
          payload,
          user,
          null, // existingTiersData
          null // allTemplates
        );

        return result;
      } catch (error) {
        console.error("❌ Erreur dans le hook:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading]
  );

  // Version simplifiée
  const createProject = useCallback(
    async (projectData, user, dataDispatch, uiDispatch) => {
      return initializeProject(dataDispatch, uiDispatch, projectData, user);
    },
    [initializeProject]
  );

  return {
    initializeProject,
    createProject,
  };
};
//Ity dia manokana amin’ny fanombohana na création d’un projet amin’ny rafitra manokana
