import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { ChevronsUpDown, Check, Plus, Layers } from 'lucide-react';
import { useLocation } from 'react-router-dom';
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

const getProjectInitial = (projectName) => {
  return projectName ? projectName[0].toUpperCase() : '?';
};

const getAvatarColor = (projectId) => {
  const idToHash = projectId ? projectId.toString() : 'default';
  const index =
    Math.abs(idToHash.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const getProjectType = (project) => {
  return project.project_type_name || 'Projet';
};

const areIdsEqual = (id1, id2) => {
  if (id1 == null || id2 == null) return false;
  return String(id1) === String(id2);
};

const ProjectSwitcher = () => {
  const { user } = useAuth();
  const { uiState, uiDispatch } = useUI();
  const location = useLocation();

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
  const initialLoadDone = useRef(false);

  const myProjects = useMemo(() => {
    if (!rawProjects || rawProjects.length === 0) return [];

    return rawProjects.filter((project) => {
      if (!project) return false;
      const isArchived = project.is_archived || project.isArchived;
      return !isArchived;
    });
  }, [rawProjects]);

  const activeProjectId = uiState.activeProject?.id || null;
  const activeProject = uiState.activeProject;

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

  const saveProject = useCallback((project) => {
    try {
      localStorage.setItem('activeProject', JSON.stringify(project));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du projet:', error);
    }
  }, []);

  const displayName = useMemo(() => {
    if (activeProjectId === 'consolidated') {
      return 'Mes projets consolidés';
    }

    if (typeof activeProjectId === 'string' && activeProjectId.startsWith('consolidated_view_')) {
      const viewId = activeProjectId.replace('consolidated_view_', '');
      const view = CONSISTENT_VIEWS.find((v) => v.id === viewId);
      return view ? view.name : 'Vue inconnue';
    }

    if (uiState.activeProject?.name) {
      return uiState.activeProject.name;
    }

    if (activeProjectId && myProjects.length > 0) {
      const project = myProjects.find((project) => areIdsEqual(project.id, activeProjectId));
      return project?.name || 'Sélectionner un projet';
    }

    return 'Sélectionner un projet';
  }, [activeProjectId, uiState.activeProject?.name, myProjects]);

  const refreshProjects = useCallback(async () => {
    if (!user?.id) return;
    try {
      await refetchProjects();
      projectsLoaded.current = true;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des projets:', error);
    }
  }, [user?.id, refetchProjects]);

  useEffect(() => {
    // Éviter les exécutions multiples
    if (initialLoadDone.current || projectsLoading) return;

    const initializeProject = async () => {
      const savedProject = getSavedProject();

      if (savedProject && !activeProjectId) {
        console.log('🔄 Restauration du projet sauvegardé:', savedProject.name);
        uiDispatch({
          type: 'SET_ACTIVE_PROJECT',
          payload: savedProject,
        });
        initialLoadDone.current = true;
        return;
      }

      if (myProjects.length > 0 && !activeProjectId && !savedProject) {
        const defaultProject = myProjects[0];
        if (defaultProject?.id) {
          console.log('🚀 Définition du projet par défaut:', defaultProject.name);
          uiDispatch({
            type: 'SET_ACTIVE_PROJECT',
            payload: defaultProject,
          });
          saveProject(defaultProject);
        }
        initialLoadDone.current = true;
      }

      projectsLoaded.current = true;
    };

    initializeProject();
  }, [myProjects, activeProjectId, projectsLoading, uiDispatch, getSavedProject, saveProject]);

  useEffect(() => {
    if (!projectsLoaded.current && !projectsLoading && user?.id) {
      refreshProjects();
    }
  }, [projectsLoading, user?.id, refreshProjects]);

  useEffect(() => {
    const handleProjectEvent = async (event) => {
      await refreshProjects();

      const project = event.detail?.project || event.detail?.newProject;
      if (project && (!event.detail?.action || event.detail.action === 'created')) {
        uiDispatch({
          type: 'SET_ACTIVE_PROJECT',
          payload: project,
        });
        saveProject(project);
      }
    };

    window.addEventListener('projectCreated', handleProjectEvent);
    window.addEventListener('projectsUpdated', handleProjectEvent);

    return () => {
      window.removeEventListener('projectCreated', handleProjectEvent);
      window.removeEventListener('projectsUpdated', handleProjectEvent);
    };
  }, [refreshProjects, uiDispatch, saveProject]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) {
        setIsListOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((id) => {
    const idString = String(id);

    if (idString === 'consolidated' || idString.startsWith('consolidated_view_')) {
      const viewName = idString === 'consolidated'
        ? 'Mes projets consolidés'
        : CONSISTENT_VIEWS.find((v) => `consolidated_view_${v.id}` === idString)?.name || 'Vue consolidée';

      const consolidatedProject = {
        id: idString,
        name: viewName,
        type: 'consolidated'
      };

      uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: consolidatedProject });
      saveProject(consolidatedProject);
    } else {
      const selectedProject = myProjects.find((project) => areIdsEqual(project.id, id));
      if (selectedProject) {
        uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: selectedProject });
        saveProject(selectedProject);
      } else {
        console.log('❌ Projet non trouvé');
        refreshProjects();
      }
    }

    setIsListOpen(false);
  }, [myProjects, uiDispatch, saveProject, refreshProjects]);


  useEffect(() => {
    const handleProjectDeleted = async (event) => {
      const deletedProjectId = event.detail?.projectId;

      if (!deletedProjectId) return;

      await refreshProjects();
      if (areIdsEqual(activeProjectId, deletedProjectId)) {
        if (myProjects.length > 0) {
          const newActiveProject = myProjects.find(p => !areIdsEqual(p.id, deletedProjectId)) || myProjects[0];
          if (newActiveProject) {
            uiDispatch({
              type: 'SET_ACTIVE_PROJECT',
              payload: newActiveProject,
            });
            saveProject(newActiveProject);
          }
        } else {
          const consolidatedProject = {
            id: 'consolidated',
            name: 'Mes projets consolidés',
            type: 'consolidated'
          };
          uiDispatch({
            type: 'SET_ACTIVE_PROJECT',
            payload: consolidatedProject
          });
          saveProject(consolidatedProject);
        }
      }
    };

    window.addEventListener('projectDeleted', handleProjectDeleted);
    window.addEventListener('projectsUpdated', handleProjectDeleted);

    return () => {
      window.removeEventListener('projectDeleted', handleProjectDeleted);
      window.removeEventListener('projectsUpdated', handleProjectDeleted);
    };
  }, [activeProjectId, myProjects, uiDispatch, saveProject, refreshProjects]);


  useEffect(() => {
    const handleProjectRestored = async (event) => {
      const restoredProjectId = event.detail?.projectId;
      const restoredProject = event.detail?.project;

      if (!restoredProjectId) return;

      console.log('🔄 Projet restauré détecté:', restoredProjectId);
      await refreshProjects();
      if (restoredProject && !activeProjectId) {
        setTimeout(() => {
          uiDispatch({
            type: 'SET_ACTIVE_PROJECT',
            payload: restoredProject,
          });
          saveProject(restoredProject);
        }, 500);
      }
    };

    window.addEventListener('projectRestored', handleProjectRestored);
    window.addEventListener('projectsUpdated', handleProjectRestored);

    return () => {
      window.removeEventListener('projectRestored', handleProjectRestored);
      window.removeEventListener('projectsUpdated', handleProjectRestored);
    };
  }, [activeProjectId, uiDispatch, saveProject, refreshProjects]);

  const handleAddProject = useCallback(() => {
    if (location.pathname === '/client/onboarding') {
      setIsListOpen(false);
      return;
    }
    window.location.href = '/client/onboarding';
    setIsListOpen(false);
  }, [location.pathname]);

  const handleCreateConsolidatedView = useCallback(() => {
    setIsConsolidatedViewModalOpen(true);
    setIsListOpen(false);
  }, []);

  const closeConsolidatedViewModal = useCallback(() => {
    setIsConsolidatedViewModalOpen(false);
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
          {isLoading ? 'Chargement...' : displayName}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-gray-500 shrink-0" />
      </button>

      {isListOpen && (
        <div className="absolute z-30 mt-2 bg-white border rounded-lg shadow-lg w-72">
          <div className="p-1 overflow-y-auto max-h-80">
            <ProjectList
              activeProjectId={activeProjectId}
              myProjects={myProjects}
              hasProjects={hasProjects}
              isLoading={isLoading}
              onSelect={handleSelect}
              onAddProject={handleAddProject}
            />
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

const ProjectList = React.memo(({
  activeProjectId,
  myProjects,
  hasProjects,
  isLoading,
  onSelect,
  onAddProject
}) => {
  return (
    <ul>
      <li>
        <button
          onClick={() => onSelect('consolidated')}
          className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
        >
          <span className="flex items-center gap-2 font-semibold">
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
            onClick={() => onSelect(`consolidated_view_${view.id}`)}
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
              onClick={() => onSelect(project.id)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
            >
              <span className="flex items-center min-w-0 gap-2 truncate">
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(
                    project.id
                  )}`}
                >
                  {getProjectInitial(project.name)}
                </div>
                <span className="flex-1 truncate">{project.name}</span>
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
        <div className="px-3 py-4 text-sm text-center text-gray-500">
          Aucun projet trouvé
          <br />
          <button
            onClick={onAddProject}
            className="mt-1 font-medium text-blue-600 hover:text-blue-800"
          >
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
  );
});

ProjectList.displayName = 'ProjectList';

export default React.memo(ProjectSwitcher);