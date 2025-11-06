import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronsUpDown, Check, Plus, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUI } from "../context/UIContext";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import ConsolidatedViewModal from "../modal/ConsolidatedViewModal";

const ProjectSwitcher = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { uiState, uiDispatch } = useUI();
  const { dataState, fetchProjects } = useData();
  const [isConsolidatedViewModalOpen, setIsConsolidatedViewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const projects = dataState?.projects || [];

  // ✅ Référence pour suivre le dernier projet créé
  const lastCreatedProjectId = useRef(null);

  const myProjects = projects.filter(project => {
    if (!project || project.isArchived || project.is_temp) return false;

    const isOwner = project.user_id === user?.id;
    const isSubscriber = project.user_subscriber_id === user?.id;
    const isCollaborator = project.collaborators?.some(collab =>
      collab.user_id === user?.id
    );

    return isOwner || isSubscriber || isCollaborator;
  });

  const activeProjectId = uiState.activeProject?.id || null;

  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef(null);
  const projectsLoaded = useRef(false);
  const sharedProjects = [];
  const consolidatedViews = [
    { id: "1", name: "Vue globale finances" },
    { id: "2", name: "Vue marketing + ventes" },
  ];

  // ✅ CORRECTION : Fonction utilitaire améliorée
  const areIdsEqual = useCallback((id1, id2) => {
    if (id1 == null || id2 == null) return false;
    return String(id1) === String(id2);
  }, []);

  // ✅ CORRECTION : Ajouter la fonction findProjectById manquante
  const findProjectById = useCallback((id) => {
    return myProjects.find(project => areIdsEqual(project.id, id));
  }, [myProjects, areIdsEqual]);

  // ✅ Fonction de rafraîchissement forcé
  const refreshProjects = useCallback(async () => {
    if (!user?.id) return;

    console.log("🔄 Forcer le rafraîchissement des projets");
    setLoading(true);
    projectsLoaded.current = false;

    try {
      await fetchProjects(user.id);
      projectsLoaded.current = true;
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des projets:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchProjects]);

  // ✅ Écouter les événements de création de projet
  useEffect(() => {
    const handleProjectCreated = async (event) => {
      console.log("🎯 Événement de projet créé détecté:", event.detail);

      // Rafraîchir la liste des projets
      await refreshProjects();

      // Définir le nouveau projet comme actif si disponible
      if (event.detail?.project) {
        setTimeout(() => {
          uiDispatch({
            type: 'SET_ACTIVE_PROJECT',
            payload: event.detail.project
          });
        }, 500);
      }
    };

    window.addEventListener('projectCreated', handleProjectCreated);

    return () => {
      window.removeEventListener('projectCreated', handleProjectCreated);
    };
  }, [refreshProjects, uiDispatch]);

  // ✅ Effet pour détecter les nouveaux projets
  useEffect(() => {
    if (myProjects.length > 0 && lastCreatedProjectId.current) {
      const newProject = myProjects.find(p => p.id === lastCreatedProjectId.current);
      if (newProject && activeProjectId !== newProject.id) {
        console.log("🔄 Nouveau projet détecté, définition comme actif:", newProject.name);
        uiDispatch({
          type: 'SET_ACTIVE_PROJECT',
          payload: newProject
        });
        lastCreatedProjectId.current = null;
      }
    }
  }, [myProjects, activeProjectId, uiDispatch]);

  useEffect(() => {
    console.log("🔍 ProjectSwitcher - Active Project:", uiState.activeProject);
    console.log("🔍 ProjectSwitcher - Active Project ID:", activeProjectId);
    console.log("🔍 ProjectSwitcher - My Projects:", myProjects);
  }, [uiState.activeProject, activeProjectId, myProjects]);

  // Charger les projets
  useEffect(() => {
    const loadProjects = async () => {
      if (projectsLoaded.current || authLoading || !user?.id) {
        return;
      }

      console.log("🔄 Chargement des projets dans ProjectSwitcher");
      setLoading(true);

      try {
        await fetchProjects(user.id);
        projectsLoaded.current = true;
      } catch (error) {
        console.error("Erreur lors du chargement des projets:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadProjects, 500);
    return () => clearTimeout(timer);
  }, [authLoading, user?.id, fetchProjects]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) {
        setIsListOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ CORRECTION : Définir le projet par défaut
  useEffect(() => {
    if (myProjects.length > 0 && !activeProjectId && !loading && projectsLoaded.current) {
      const defaultProject = myProjects[0];

      if (defaultProject && defaultProject.id) {
        console.log("🔄 Définition du projet actif par défaut:", defaultProject.name);
        uiDispatch({
          type: 'SET_ACTIVE_PROJECT',
          payload: defaultProject
        });
      }
    }
  }, [myProjects, activeProjectId, loading, uiDispatch, projectsLoaded.current]);

  const isConsolidated = activeProjectId === "consolidated";
  const isCustomConsolidated = typeof activeProjectId === 'string' && activeProjectId.startsWith("consolidated_view_");

  let displayName = "Sélectionner un projet";

  if (isConsolidated) {
    displayName = "Mes projets consolidés";
  } else if (isCustomConsolidated) {
    const viewId = activeProjectId.replace("consolidated_view_", "");
    const view = consolidatedViews.find((v) => v.id === viewId);
    displayName = view ? view.name : "Vue inconnue";
  } else {
    const project = findProjectById(activeProjectId);
    if (project) displayName = project.name;
  }

  // ✅ CORRECTION : Fonction handleSelect corrigée
  const handleSelect = async (id) => {
    console.log("🔍 handleSelect appelé avec id:", id);

    const idString = String(id);

    if (idString !== "consolidated" && !idString.startsWith("consolidated_view_")) {
      let selectedProject = findProjectById(id);

      console.log("🔍 Projet sélectionné trouvé:", selectedProject);

      if (selectedProject) {
        console.log("✅ Définition du projet actif:", selectedProject.name);
        uiDispatch({
          type: 'SET_ACTIVE_PROJECT',
          payload: selectedProject
        });
        navigate(`/client/dashboard`);
      } else {
        console.log("❌ Aucun projet trouvé avec l'ID:", id);
        // ✅ Rafraîchir si le projet n'est pas trouvé
        await refreshProjects();
      }
    } else {
      console.log("🔍 Sélection d'une vue consolidée");
      uiDispatch({
        type: 'SET_ACTIVE_PROJECT',
        payload: { id: idString, name: displayName, type: 'consolidated' }
      });
      navigate('/client/dashboard');
    }

    setIsListOpen(false);
  };

  const handleAddProject = () => {
    navigate("/client/onboarding");
    setIsListOpen(false);
  };

  const closeConsolidatedViewModal = () => {
    setIsConsolidatedViewModalOpen(false);
  };

  const handleCreateConsolidatedView = () => {
    setIsConsolidatedViewModalOpen(true);
    setIsListOpen(false);
  };

  const getProjectInitial = (projectName) => {
    return projectName ? projectName[0].toUpperCase() : '?';
  };

  const getAvatarColor = (projectId) => {
    const colors = [
      'bg-blue-200 text-blue-700',
      'bg-green-200 text-green-700',
      'bg-purple-200 text-purple-700',
      'bg-orange-200 text-orange-700',
      'bg-pink-200 text-pink-700',
      'bg-indigo-200 text-indigo-700'
    ];
    const idToHash = projectId ? projectId.toString() : 'default';

    const index = Math.abs(idToHash.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
    return colors[index];
  };

  const getProjectType = (project) => {
    return project.project_type_name || "Projet";
  };

  return (
    <div className="relative w-full" ref={listRef}>
      <button
        onClick={() => setIsListOpen(!isListOpen)}
        className="flex items-center gap-2 p-1.5 rounded-md text-left text-gray-800 font-semibold hover:bg-gray-200 transition-colors focus:outline-none w-full"
        disabled={loading}
      >
        <Layers className="w-5 h-5 text-gray-500" />
        <span className="truncate flex-grow">
          {loading ? "Chargement..." : displayName}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-gray-500 shrink-0" />
      </button>
      {isListOpen && (
        <div className="absolute z-30 mt-2 w-72 bg-white border rounded-lg shadow-lg">
          <div className="p-1 max-h-80 overflow-y-auto">
            <ul>
              <li>
                <button
                  onClick={() => handleSelect("consolidated")}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-500" />
                    Mes projets consolidés
                  </span>
                  {isConsolidated && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              </li>
              {consolidatedViews.map((view) => (
                <li key={view.id}>
                  <button
                    onClick={() => handleSelect(`consolidated_view_${view.id}`)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Layers className="w-4 h-4 text-gray-500" />
                      <span className="truncate">{view.name}</span>
                    </span>
                    {activeProjectId === `consolidated_view_${view.id}` && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                </li>
              ))}
              {myProjects.length > 0 && (
                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">
                  Mes Projets ({myProjects.length})
                </div>
              )}
              {myProjects.map((project) => (
                <li key={project.id}>
                  <button
                    onClick={() => handleSelect(project.id)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${getAvatarColor(project.id)}`}>
                        {getProjectInitial(project.name)}
                      </div>
                      <span className="truncate">{project.name}</span>
                      <span className="px-1.5 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full shrink-0">
                        {getProjectType(project)}
                      </span>
                    </span>
                    {areIdsEqual(project.id, activeProjectId) && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                </li>
              ))}
              {myProjects.length === 0 && sharedProjects.length === 0 && !loading && (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  Aucun projet trouvé
                  <br />
                  <button
                    onClick={handleAddProject}
                    className="text-blue-600 hover:text-blue-800 font-medium mt-1"
                  >
                    Créer votre premier projet
                  </button>
                </div>
              )}

              {loading && (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  Chargement des projets...
                </div>
              )}
            </ul>
          </div>

          <div className="border-t p-1">
            <button
              onClick={handleCreateConsolidatedView}
              className="flex items-center w-full px-3 py-2 text-left text-sm text-gray-700 rounded-md hover:bg-gray-100"
            >
              <Layers className="w-4 h-4 mr-2" />
              Créer une vue consolidée
            </button>
            <button
              onClick={handleAddProject}
              className="flex items-center w-full px-3 py-2 text-left text-sm text-gray-700 rounded-md hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 mr-2" />
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

export default ProjectSwitcher;