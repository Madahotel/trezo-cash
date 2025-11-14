import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { ChevronsUpDown, Check, Plus, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../context/AuthContext';
import ConsolidatedViewModal from '../modal/ConsolidatedViewModal';

const CONSISTENT_VIEWS = [
  { id: '1', name: 'Vue globale finances' },
  { id: '2', name: 'Vue marketing + ventes' },
];

const AVATAR_COLORS = [
  'bg-blue-200 text-blue-700',
  'bg-green-200 text-green-700',
  'bg-purple-200 text-purple-700',
  'bg-orange-200 text-orange-700',
  'bg-pink-200 text-pink-700',
  'bg-indigo-200 text-indigo-700',
];

const ProjectSwitcher = () => {
  const { user } = useAuth();
  const { uiState, uiDispatch } = useUI();
  const navigate = useNavigate();

  const {
    projects: rawProjects,
    loading: projectsLoading,
    refetch: refetchProjects,
  } = useProjects();

  const [isConsolidatedViewModalOpen, setIsConsolidatedViewModalOpen] =
    useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

  const listRef = useRef(null);
  const projectsLoaded = useRef(false);

  // CORRECTION: Filtrage très permissif pour debug
  const myProjects = useMemo(() => {
    // if (!user?.id || !rawProjects || rawProjects.length === 0) {
    //   console.log("❌ myProjects: Conditions non remplies", {
    //     hasUser: !!user?.id,
    //     hasRawProjects: !!rawProjects,
    //     rawProjectsLength: rawProjects?.length
    //   });
    //   return [];
    // }

    // CORRECTION: Filtre temporairement désactivé pour voir tous les projets
    const filteredProjects = rawProjects.filter((project) => {
      if (!project) return false;

      // CORRECTION: Temporairement, on inclut tous les projets non archivés
      const isArchived = project.is_archived || project.isArchived;
      if (isArchived) {
        return false;
      }

      return true; // CORRECTION: Inclure tous les projets non archivés pour le debug
    });

    return filteredProjects;
  }, [rawProjects, user?.id]);
  const activeProjectId = uiState.activeProject?.id || null;

  const areIdsEqual = useCallback((id1, id2) => {
    if (id1 == null || id2 == null) return false;
    return String(id1) === String(id2);
  }, []);

  const findProjectById = useCallback(
    (id) => {
      if (!id || !myProjects.length) return null;
      return myProjects.find((project) => areIdsEqual(project.id, id));
    },
    [myProjects, areIdsEqual]
  );

  const displayName = useMemo(() => {
    if (activeProjectId === 'consolidated') {
      return 'Mes projets consolidés';
    }

    if (
      typeof activeProjectId === 'string' &&
      activeProjectId.startsWith('consolidated_view_')
    ) {
      const viewId = activeProjectId.replace('consolidated_view_', '');
      const view = CONSISTENT_VIEWS.find((v) => v.id === viewId);
      return view ? view.name : 'Vue inconnue';
    }

    if (uiState.activeProject?.name) {
      return uiState.activeProject.name;
    }

    if (activeProjectId) {
      const project = findProjectById(activeProjectId);
      if (project?.name) {
        return project.name;
      }
    }

    return 'Sélectionner un projet';
  }, [activeProjectId, uiState.activeProject, findProjectById]);

  const refreshProjects = useCallback(async () => {
    if (!user?.id) return;
    try {
      await refetchProjects();
      projectsLoaded.current = true;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des projets:', error);
    }
  }, [user?.id, refetchProjects]);

  // Définir le projet par défaut
  useEffect(() => {
    if (myProjects.length > 0 && !activeProjectId && !projectsLoading) {
      const defaultProject = myProjects[0];
      if (defaultProject?.id) {
        uiDispatch({
          type: 'SET_ACTIVE_PROJECT',
          payload: defaultProject,
        });
        projectsLoaded.current = true;
      }
    }
  }, [myProjects, activeProjectId, projectsLoading, uiDispatch]);

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

      // Sélectionner automatiquement le nouveau projet
      if (event.detail?.project) {
        uiDispatch({
          type: 'SET_ACTIVE_PROJECT',
          payload: event.detail.project,
        });
      }
    };

    const handleProjectsUpdated = async (event) => {
      await refreshProjects();

      // Si un nouveau projet a été créé, le sélectionner
      if (event.detail?.newProject && event.detail?.action === 'created') {
        uiDispatch({
          type: 'SET_ACTIVE_PROJECT',
          payload: event.detail.newProject,
        });
      }
    };

    window.addEventListener('projectCreated', handleProjectCreated);
    window.addEventListener('projectsUpdated', handleProjectsUpdated);

    return () => {
      window.removeEventListener('projectCreated', handleProjectCreated);
      window.removeEventListener('projectsUpdated', handleProjectsUpdated);
    };
  }, [refreshProjects, uiDispatch]);

  // Gestion du clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) {
        setIsListOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    async (id) => {
      const idString = String(id);

      if (
        idString === 'consolidated' ||
        idString.startsWith('consolidated_view_')
      ) {
        const viewName =
          idString === 'consolidated'
            ? 'Mes projets consolidés'
            : CONSISTENT_VIEWS.find(
                (v) => `consolidated_view_${v.id}` === idString
              )?.name || 'Vue consolidée';

        uiDispatch({
          type: 'SET_ACTIVE_PROJECT',
          payload: { id: idString, name: viewName, type: 'consolidated' },
        });
        navigate('/client/dashboard');
      } else {
        const selectedProject = findProjectById(id);
        if (selectedProject) {
          uiDispatch({
            type: 'SET_ACTIVE_PROJECT',
            payload: selectedProject,
          });
          navigate(`/client/dashboard`);
        } else {
          console.log('❌ Projet non trouvé');
          await refreshProjects();
        }
      }

      setIsListOpen(false);
    },
    [findProjectById, uiDispatch, navigate, refreshProjects]
  );

  const handleAddProject = useCallback(() => {
    navigate('/client/onboarding');
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
    const index =
      Math.abs(idToHash.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) %
      AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }, []);

  const getProjectType = useCallback((project) => {
    return project.project_type_name || 'Projet';
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
        <span className="truncate flex-1">
          {isLoading ? 'Chargement...' : displayName}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-gray-500 shrink-0" />
      </button>

      {isListOpen && (
        <div className="absolute z-30 mt-2 w-72 bg-white border rounded-lg shadow-lg">
          <div className="p-1 max-h-80 overflow-y-auto">
            <ul>
              <li>
                <button
                  onClick={() => handleSelect('consolidated')}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-500 shrink-0" />
                    Mes projets consolidés
                  </span>
                  {activeProjectId === 'consolidated' && (
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
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
                    {activeProjectId === `consolidated_view_${view.id}` && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
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
                      <span className="flex items-center gap-2 truncate min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(
                            project.id
                          )}`}
                        >
                          {getProjectInitial(project.name)}
                        </div>
                        <span className="truncate flex-1">{project.name}</span>
                        <span className="px-1.5 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full shrink-0">
                          {getProjectType(project)}
                        </span>
                      </span>
                      {isActive && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}

              {!hasProjects && !isLoading && (
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

              {isLoading && (
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
              <Layers className="w-4 h-4 mr-2 shrink-0" />
              Créer une vue consolidée
            </button>
            <button
              onClick={handleAddProject}
              className="flex items-center w-full px-3 py-2 text-left text-sm text-gray-700 rounded-md hover:bg-gray-100"
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
