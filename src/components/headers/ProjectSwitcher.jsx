import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronsUpDown, Check, Plus, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUI } from "../context/UIContext";
import { useProjects } from "../../hooks/useProjects";
import { useAuth } from "../context/AuthContext";
import ConsolidatedViewModal from "../modal/ConsolidatedViewModal";

const CONSISTENT_VIEWS = [
  { id: "1", name: "Vue globale finances" },
  { id: "2", name: "Vue marketing + ventes" },
];

const AVATAR_COLORS = [
  'bg-blue-200 text-blue-700',
  'bg-green-200 text-green-700',
  'bg-purple-200 text-purple-700',
  'bg-orange-200 text-orange-700',
  'bg-pink-200 text-pink-700',
  'bg-indigo-200 text-indigo-700'
];

const ProjectSwitcher = () => {
  const { user } = useAuth();
  const { uiState, uiDispatch } = useUI();
  const navigate = useNavigate();

  const { projects: rawProjects, loading: projectsLoading, refetch: refetchProjects } = useProjects();

  const [isConsolidatedViewModalOpen, setIsConsolidatedViewModalOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  
  const listRef = useRef(null);
  const projectsLoaded = useRef(false);
  const initialLoadDone = useRef(false); // ✅ NOUVEAU: Pour éviter les sélections automatiques multiples
  
  const myProjects = useMemo(() => {
    if (!user?.id || !rawProjects || rawProjects.length === 0) {
      return [];
    }
    const filteredProjects = rawProjects.filter(project => {
      if (!project) return false;
      const isArchived = project.is_archived || project.isArchived;
      if (isArchived) {
        return false;
      }
      return true; 
    });
    return filteredProjects;
  }, [rawProjects, user?.id]);

  const activeProjectId = uiState.activeProject?.id || null;
  const activeProject = uiState.activeProject;

  // ✅ CORRECTION: Récupérer le projet sauvegardé depuis localStorage au chargement
  const getSavedProject = useCallback(() => {
    try {
      const saved = localStorage.getItem('activeProject');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du projet sauvegardé:', error);
    }
    return null;
  }, []);

  // ✅ CORRECTION: Sauvegarder le projet dans localStorage
  const saveProject = useCallback((project) => {
    try {
      localStorage.setItem('activeProject', JSON.stringify(project));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du projet:', error);
    }
  }, []);

  const isConsolidatedView = useCallback((projectId) => {
    if (!projectId) return false;
    const projectIdString = String(projectId);
    return projectIdString.startsWith("consolidated_view_");
  }, []);

  const areIdsEqual = useCallback((id1, id2) => {
    if (id1 == null || id2 == null) return false;
    return String(id1) === String(id2);
  }, []);

  const findProjectById = useCallback((id) => {
    if (!id || !myProjects.length) return null;
    return myProjects.find(project => areIdsEqual(project.id, id));
  }, [myProjects, areIdsEqual]);

  const displayName = useMemo(() => {
    if (activeProjectId === "consolidated") {
      return "Mes projets consolidés";
    } 
    
    if (isConsolidatedView(activeProjectId)) {
      const viewId = String(activeProjectId).replace("consolidated_view_", "");
      const view = CONSISTENT_VIEWS.find((v) => v.id === viewId);
      return view ? view.name : "Vue inconnue";
    }
    
    if (activeProject?.name) {
      return activeProject.name;
    }
    
    if (activeProjectId) {
      const project = findProjectById(activeProjectId);
      if (project?.name) {
        return project.name;
      }
    }
    
    return "Sélectionner un projet";
  }, [activeProjectId, activeProject, findProjectById, isConsolidatedView]);

  const refreshProjects = useCallback(async () => {
    if (!user?.id) return;
    try {
      await refetchProjects();
      projectsLoaded.current = true;
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des projets:", error);
    }
  }, [user?.id, refetchProjects]);

  // ✅ CORRECTION AMÉLIORÉE: Définir le projet au chargement initial
  useEffect(() => {
    if (initialLoadDone.current) return; // Éviter les exécutions multiples
    
    if (myProjects.length > 0 && !projectsLoading) {
      // Essayer de récupérer le projet sauvegardé
      const savedProject = getSavedProject();
      
      if (savedProject && savedProject.id) {
        // Vérifier si le projet sauvegardé existe toujours
        const projectStillExists = myProjects.some(project => 
          areIdsEqual(project.id, savedProject.id)
        );
        
        if (projectStillExists) {
          console.log('Restauration du projet sauvegardé:', savedProject.name);
          uiDispatch({
            type: 'SET_ACTIVE_PROJECT',
            payload: savedProject
          });
        } else {
          // Projet sauvegardé n'existe plus, prendre le premier projet disponible
          const defaultProject = myProjects[0];
          if (defaultProject?.id) {
            console.log('Projet sauvegardé non trouvé, sélection du projet par défaut:', defaultProject.name);
            uiDispatch({
              type: 'SET_ACTIVE_PROJECT',
              payload: defaultProject
            });
            saveProject(defaultProject);
          }
        }
      } else if (!activeProjectId) {
        // Aucun projet sauvegardé et aucun projet actif, prendre le premier
        const defaultProject = myProjects[0];
        if (defaultProject?.id) {
          console.log('Sélection du projet par défaut:', defaultProject.name);
          uiDispatch({
            type: 'SET_ACTIVE_PROJECT',
            payload: defaultProject
          });
          saveProject(defaultProject);
        }
      }
      
      initialLoadDone.current = true;
      projectsLoaded.current = true;
    }
  }, [myProjects, activeProjectId, projectsLoading, uiDispatch, getSavedProject, saveProject, areIdsEqual]);

  // Charger les projets au montage
  useEffect(() => {
    if (!projectsLoaded.current && !projectsLoading && user?.id) {
      refreshProjects();
    }
  }, [projectsLoading, user?.id, refreshProjects]);

  // Écouter les événements de création de projet
  useEffect(() => {
    const handleProjectCreated = async (event) => {
      await refreshProjects();
      
      if (event.detail?.project) {
        uiDispatch({
          type: 'SET_ACTIVE_PROJECT',
          payload: event.detail.project
        });
        saveProject(event.detail.project); // ✅ Sauvegarder le nouveau projet
      }
    };

    const handleProjectsUpdated = async (event) => {
      await refreshProjects();
      
      if (event.detail?.newProject && event.detail?.action === 'created') {
        uiDispatch({
          type: 'SET_ACTIVE_PROJECT',
          payload: event.detail.newProject
        });
        saveProject(event.detail.newProject); // ✅ Sauvegarder le nouveau projet
      }
    };

    window.addEventListener('projectCreated', handleProjectCreated);
    window.addEventListener('projectsUpdated', handleProjectsUpdated);
    
    return () => {
      window.removeEventListener('projectCreated', handleProjectCreated);
      window.removeEventListener('projectsUpdated', handleProjectsUpdated);
    };
  }, [refreshProjects, uiDispatch, saveProject]);

  // Gestion du clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) {
        setIsListOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

// Dans ProjectSwitcher.js - ajouter cette fonction
const handleSelect = useCallback(async (id) => {
  const idString = String(id);

  if (idString === "consolidated" || isConsolidatedView(id)) {
    const viewName = idString === "consolidated" 
      ? "Mes projets consolidés" 
      : CONSISTENT_VIEWS.find(v => `consolidated_view_${v.id}` === idString)?.name || "Vue consolidée";
    
    const consolidatedProject = { id: idString, name: viewName, type: 'consolidated' };
    
    uiDispatch({
      type: 'SET_ACTIVE_PROJECT',
      payload: consolidatedProject
    });
    saveProject(consolidatedProject);
    
    // ✅ Émettre un événement pour rafraîchir les données
    window.dispatchEvent(new CustomEvent('projectChanged', {
      detail: { projectId: idString, project: consolidatedProject }
    }));
  } else {
    const selectedProject = findProjectById(id);
    if (selectedProject) {
      uiDispatch({
        type: 'SET_ACTIVE_PROJECT',
        payload: selectedProject
      });
      saveProject(selectedProject);
      
      // ✅ Émettre un événement pour rafraîchir les données
      window.dispatchEvent(new CustomEvent('projectChanged', {
        detail: { projectId: idString, project: selectedProject }
      }));
    } else {
      await refreshProjects();
    }
  }

  setIsListOpen(false);
}, [findProjectById, uiDispatch, refreshProjects, isConsolidatedView, saveProject]);

  const handleAddProject = useCallback(() => {
    navigate("/client/onboarding");
    setIsListOpen(false);
  }, [navigate]);

  const handleCreateConsolidatedView = useCallback(() => {
    setIsConsolidatedViewModalOpen(true);
    setIsListOpen(false);
  }, []);

  const closeConsolidatedViewModal = useCallback(() => {
    setIsConsolidatedViewModalOpen(false);
  }, []);

  // Fonctions utilitaires
  const getProjectInitial = useCallback((projectName) => {
    return projectName ? projectName[0].toUpperCase() : '?';
  }, []);

  const getAvatarColor = useCallback((projectId) => {
    const idToHash = projectId ? projectId.toString() : 'default';
    const index = Math.abs(idToHash.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }, []);

  const getProjectType = useCallback((project) => {
    return project.project_type_name || "Projet";
  }, []);

  const isLoading = projectsLoading;
  const hasProjects = myProjects.length > 0;

  return (
    <div className="relative w-full" ref={listRef}>
      <button
        onClick={() => setIsListOpen(!isListOpen)}
        className="flex items-center gap-2 p-1.5 rounded-md text-left text-gray-800 font-semibold hover:bg-gray-200 transition-colors focus:outline-none w-full"
        disabled={isLoading}
      >
        <Layers className="w-5 h-5 text-gray-500 shrink-0" />
        <span className="flex-1 truncate">
          {isLoading ? "Chargement..." : displayName}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-gray-500 shrink-0" />
      </button>
      
      {isListOpen && (
        <div className="absolute z-30 mt-2 bg-white border rounded-lg shadow-lg w-72">
          <div className="p-1 overflow-y-auto max-h-80">
            <ul>
              <li>
                <button
                  onClick={() => handleSelect("consolidated")}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Layers className="w-4 h-4 text-gray-500 shrink-0" />
                    Mes projets consolidés
                  </span>
                  {activeProjectId === "consolidated" && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              </li>

              {CONSISTENT_VIEWS.map((view) => (
                <li key={view.id}>
                  <button
                    onClick={() => handleSelect(`consolidated_view_${view.id}`)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Layers className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="truncate">{view.name}</span>
                    </span>
                    {areIdsEqual(activeProjectId, `consolidated_view_${view.id}`) && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                </li>
              ))}

              {hasProjects && (
                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">
                  Mes Projets ({myProjects.length})
                </div>
              )}
              
              {myProjects.map((project) => {
                const isActive = areIdsEqual(project.id, activeProjectId);
                return (
                  <li key={project.id}>
                    <button
                      onClick={() => handleSelect(project.id)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
                    >
                      <span className="flex items-center min-w-0 gap-2 truncate">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(project.id)}`}>
                          {getProjectInitial(project.name)}
                        </div>
                        <span className="flex-1 truncate">{project.name}</span>
                        <span className="px-1.5 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full shrink-0">
                          {getProjectType(project)}
                        </span>
                      </span>
                      {isActive && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  </li>
                );
              })}

              {!hasProjects && !isLoading && (
                <div className="px-3 py-4 text-sm text-center text-gray-500">
                  Aucun projet trouvé
                  <br />
                  <button onClick={handleAddProject} className="mt-1 font-medium text-blue-600 hover:text-blue-800">
                    Créer votre premier projet
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="px-3 py-4 text-sm text-center text-gray-500">
                  Chargement des projets...
                </div>
              )}
            </ul>
          </div>

          <div className="p-1 border-t">
            <button
              onClick={handleCreateConsolidatedView}
              className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
            >
              <Layers className="w-4 h-4 mr-2 shrink-0" />
              Créer une vue consolidée
            </button>
            <button
              onClick={handleAddProject}
              className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 mr-2 shrink-0" />
              Nouveau projet
            </button>
          </div>
        </div>
      )}

      {isConsolidatedViewModalOpen && (
        <ConsolidatedViewModal
          isOpen={isConsolidatedViewModalOpen}
          onClose={closeConsolidatedViewModal}
        />
      )}
    </div>
  );
};

export default React.memo(ProjectSwitcher);