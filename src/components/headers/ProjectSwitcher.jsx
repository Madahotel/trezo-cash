import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronsUpDown, Check, Plus, Layers, Archive, RefreshCw, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../context/AuthContext';
import ConsolidatedViewModal from '../modal/ConsolidatedViewModal';
import { useConsolidations } from '../../hooks/useConsolidations';

const AVATAR_COLORS = [
  'bg-blue-200 text-blue-700',
  'bg-green-200 text-green-700',
  'bg-purple-200 text-purple-700',
  'bg-orange-200 text-orange-700',
  'bg-pink-200 text-pink-700',
  'bg-indigo-200 text-indigo-700',
];

const getProjectInitial = (name) => name ? name[0].toUpperCase() : '?';
const getAvatarColor = (id) => {
  const hash = id ? id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const getProjectType = (project) => project?.project_type_name || 'Projet';
const areIdsEqual = (id1, id2) => id1 != null && id2 != null && String(id1) === String(id2);

const ProjectSwitcher = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { uiState, uiDispatch } = useUI();
  
  const { 
    projects: rawProjects, 
    loading: projectsLoading, 
    refetch: refetchProjects,
    setProjects: setProjectsState 
  } = useProjects();
  
  const { 
    consolidations, 
    loading: consolidationsLoading, 
    error: consolidationsError, 
    refetch: refetchConsolidations 
  } = useConsolidations();

  const [isListOpen, setIsListOpen] = useState(false);
  const [isConsolidatedViewModalOpen, setIsConsolidatedViewModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const listRef = useRef(null);

  const hasInitialized = useRef(false);
  const refreshTimeoutRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  const allProjects = useMemo(() => {
    if (!rawProjects || !Array.isArray(rawProjects)) return [];
    return rawProjects;
  }, [rawProjects]);

  const myProjects = useMemo(() => {
    return allProjects.filter(p => !["1", 1, true, "true"].includes(p?.is_archived ?? p?.isArchived ?? 0));
  }, [allProjects]);

  const archivedProjects = useMemo(() => {
    return allProjects.filter(p => ["1", 1, true, "true"].includes(p?.is_archived ?? p?.isArchived ?? 0));
  }, [allProjects]);

  const safeConsolidations = useMemo(() => {
    if (!consolidations) return [];
    if (Array.isArray(consolidations)) return consolidations;

    if (typeof consolidations === 'object' && consolidations !== null) {
      if (Array.isArray(consolidations.consolidations)) return consolidations.consolidations;
      if (Array.isArray(consolidations.data)) return consolidations.data;
      if (Array.isArray(consolidations.views)) return consolidations.views;
      if (Array.isArray(consolidations.items)) return consolidations.items;
      
      if (consolidations.consolidation_items && Array.isArray(consolidations.consolidation_items)) {
        return consolidations.consolidation_items;
      }
    }
    return [];
  }, [consolidations]);

  const activeProjectId = uiState.activeProject?.id || null;
  const activeProjectType = uiState.activeProject?.type || null;

  const getSavedProject = useCallback(() => {
    try { 
      return JSON.parse(localStorage.getItem('activeProject') || 'null'); 
    } catch { 
      return null; 
    }
  }, []);

  const saveProject = useCallback((project) => {
    try { 
      localStorage.setItem('activeProject', JSON.stringify(project)); 
    } catch { 
      console.error('Erreur lors de la sauvegarde du projet');
    }
  }, []);

  const validateActiveProject = useCallback(() => {
    const savedProject = getSavedProject();
    if (!savedProject) return null;

    const { id, type } = savedProject;
    const idStr = id ? String(id) : '';

    if (type === 'consolidated' || idStr === 'consolidated' || idStr.startsWith('consolidated_view_')) {
      if (idStr === 'consolidated') {
        return savedProject;
      }

      const consolidatedId = idStr.replace('consolidated_view_', '');
      const exists = safeConsolidations.some(c =>
        c && String(c.id) === consolidatedId
      );

      if (exists) {
        return savedProject;
      }
    } else {
      const projectExists = allProjects.some(p => areIdsEqual(p.id, id));
      const project = allProjects.find(p => areIdsEqual(p.id, id));

      if (projectExists && project) {
        const isArchived = ["1", 1, true, "true"].includes(project?.is_archived ?? project?.isArchived ?? 0);
        if (!isArchived) {
          return savedProject;
        }
      }
    }

    return null;
  }, [allProjects, safeConsolidations, getSavedProject]);

  const handleDataRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    try {
      await Promise.allSettled([
        refetchProjects(),
        refetchConsolidations()
      ]);
    } finally {
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 1000);
    }
  }, [refetchProjects, refetchConsolidations]);

  useEffect(() => {
    if (projectsLoading || consolidationsLoading) return;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
    }

    const validProject = validateActiveProject();

    if (!validProject) {
      if (myProjects.length > 0) {
        const firstProject = myProjects[0];
        uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: firstProject });
        saveProject(firstProject);
      } else if (safeConsolidations.length > 0) {
        const firstConsolidation = safeConsolidations[0];
        const consolidatedProject = {
          id: `consolidated_view_${firstConsolidation.id}`,
          name: firstConsolidation.name,
          type: 'consolidated'
        };
        uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: consolidatedProject });
        saveProject(consolidatedProject);
      } else {
        const consolidatedProject = {
          id: 'consolidated',
          name: 'Mes projets consolidés',
          type: 'consolidated'
        };
        uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: consolidatedProject });
        saveProject(consolidatedProject);
      }
    } else if (!uiState.activeProject || !areIdsEqual(uiState.activeProject.id, validProject.id)) {
      uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: validProject });
    }
  }, [allProjects, myProjects, safeConsolidations, projectsLoading, consolidationsLoading, uiDispatch, saveProject, validateActiveProject, uiState.activeProject]);

  useEffect(() => {
    const handleDataRefreshWithDebounce = (event) => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        handleDataRefresh();
      }, 500);
    };

    const events = [
      'projectCreated',
      'projectUpdated', 
      'projectDeleted',
      'projectArchived',
      'projectRestored',
      'projectsUpdated',
      'consolidationCreated',
      'consolidationCreatedSuccess',
      'consolidationUpdated',
      'consolidationDeleted',
      'consolidationsRefreshed' 
    ];
    
    events.forEach(event => {
      window.addEventListener(event, handleDataRefreshWithDebounce);
    });

    autoRefreshIntervalRef.current = setInterval(() => {
      handleDataRefresh();
    }, 60000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => {
          handleDataRefresh();
        }, 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleDataRefreshWithDebounce);
      });
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleDataRefresh]);

  const displayName = useMemo(() => {
    const activeId = activeProjectId ? String(activeProjectId) : '';

    if (activeId === 'consolidated') return 'Mes projets consolidés';

    if (activeId.startsWith('consolidated_view_')) {
      const foundConsolidation = safeConsolidations.find(c =>
        c && `consolidated_view_${c.id}` === activeId
      );
      if (foundConsolidation) return foundConsolidation.name;
    }

    if (activeProjectType !== 'consolidated' && activeProjectId) {
      const activeProject = allProjects.find(p => areIdsEqual(p.id, activeProjectId));
      if (activeProject) {
        const isArchived = ["1", 1, true, "true"].includes(activeProject?.is_archived ?? activeProject?.isArchived ?? 0);
        if (isArchived) {
          return `${uiState.activeProject?.name || 'Projet'} (Archivé)`;
        }
      }
    }

    return uiState.activeProject?.name || 'Sélectionner un projet';
  }, [activeProjectId, activeProjectType, uiState.activeProject?.name, safeConsolidations, allProjects]);

  const handleSelect = useCallback((id) => {
    try {
      const idStr = String(id);
      
      if (idStr === 'consolidated' || idStr.startsWith('consolidated_view_')) {
        let consolidatedProject;
        
        if (idStr === 'consolidated') {
          consolidatedProject = { 
            id: idStr, 
            name: 'Mes projets consolidés', 
            type: 'consolidated' 
          };
        } else {
          const foundConsolidation = safeConsolidations.find(c => 
            c && `consolidated_view_${c.id}` === idStr
          );
          consolidatedProject = {
            id: idStr,
            name: foundConsolidation?.name || 'Vue consolidée',
            type: 'consolidated'
          };
        }

        uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: consolidatedProject });
        saveProject(consolidatedProject);
        
      } else {
        const selectedProject = allProjects.find(p => areIdsEqual(p.id, id));
        if (selectedProject) {
          const isArchived = ["1", 1, true, "true"].includes(
            selectedProject?.is_archived ?? selectedProject?.isArchived ?? 0
          );

          uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: selectedProject });
          saveProject(selectedProject);
        }
      }
      
      setIsListOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sélection:', error);
    }
  }, [allProjects, uiDispatch, saveProject, safeConsolidations]);

  const handleManualRefresh = useCallback(() => {
    handleDataRefresh();
  }, [handleDataRefresh]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) {
        setIsListOpen(false);
        setShowArchived(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (consolidationsError) {
      console.error('Erreur de consolidation:', consolidationsError);
    }
  }, [consolidationsError]);

  if (projectsLoading || consolidationsLoading) {
    return (
      <div className="flex items-center gap-2 p-1.5 rounded-md w-full">
        <Layers className="w-5 h-5 text-gray-500" />
        <span className="flex-1 font-semibold text-gray-800 truncate">
          Chargement...
        </span>
        <div className="w-4 h-4 border-2 border-gray-400 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={listRef}>
      <button
        onClick={() => setIsListOpen(!isListOpen)}
        className="flex items-center gap-2 p-1.5 rounded-md text-left w-full text-gray-800 font-semibold hover:bg-gray-100 transition-colors"
        disabled={projectsLoading || consolidationsLoading}
      >
        <Layers className="w-5 h-5 text-gray-500" />
        <span className="flex-1 truncate">{displayName}</span>
        <ChevronsUpDown className="w-4 h-4 text-gray-500" />
      </button>

      {isListOpen && (
        <div className="absolute z-[9999] mt-2 bg-white border rounded-lg shadow-lg w-72">
          
          <div className="p-1 overflow-y-auto max-h-80">
            <ul>
              <li>
                <button
                  onClick={() => handleSelect('consolidated')}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Layers className="w-4 h-4" />
                    Mes projets consolidés
                  </span>
                  {activeProjectId === 'consolidated' && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              </li>
              {safeConsolidations.length > 0 && (
                <li className="px-3 py-1 mt-1">
                  <div className="text-xs font-semibold text-gray-400 uppercase">
                    Vues consolidées ({safeConsolidations.length})
                  </div>
                </li>
              )}

              {safeConsolidations.length > 0 ? (
                safeConsolidations.map(c => (
                  <li key={c?.id || Math.random()}>
                    <button
                      onClick={() => handleSelect(`consolidated_view_${c?.id}`)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
                      disabled={!c?.id}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Layers className="w-4 h-4" />
                        {c?.name || 'Vue sans nom'}
                      </span>
                      <div className="flex items-center gap-1">
                        {activeProjectId === `consolidated_view_${c?.id}` && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </div>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm italic text-gray-500">
                  Aucune vue consolidée créée
                </li>
              )}

              {myProjects.length > 0 && (
                <>
                  <li className="px-3 py-1 mt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-gray-400 uppercase">
                        Mes Projets ({myProjects.length})
                      </div>
                      <button
                        onClick={handleManualRefresh}
                        className="p-1 rounded hover:bg-gray-200"
                        title="Rafraîchir"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </li>

                  {myProjects.map(p => (
                    <li key={p.id}>
                      <button
                        onClick={() => handleSelect(p.id)}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${getAvatarColor(p.id)}`}>
                            {getProjectInitial(p.name)}
                          </div>
                          <span className="flex-1 truncate">{p.name || 'Sans nom'}</span>
                          <span className="px-1.5 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                            {getProjectType(p)}
                          </span>
                        </span>
                        {activeProjectId === p.id && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    </li>
                  ))}
                </>
              )}
              {archivedProjects.length > 0 && (
                <>
                  <li className="px-3 py-1 mt-2 border-t">
                    <button
                      onClick={() => setShowArchived(!showArchived)}
                      className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 uppercase hover:text-gray-600"
                    >
                      <span className="flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        Projets Archivés ({archivedProjects.length})
                      </span>
                      <ChevronsUpDown className={`w-3 h-3 transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                    </button>
                  </li>

                  {showArchived && (
                    <>
                      {archivedProjects.map(p => (
                        <li key={p.id}>
                          <button
                            onClick={() => handleSelect(p.id)}
                            className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-500 rounded-md hover:bg-gray-100"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${getAvatarColor(p.id)} opacity-70`}>
                                {getProjectInitial(p.name)}
                              </div>
                              <span className="flex-1 truncate">{p.name || 'Sans nom'}</span>
                              <span className="px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
                                Archivé
                              </span>
                            </span>
                            {activeProjectId === p.id && <Check className="w-4 h-4 text-gray-400" />}
                          </button>
                        </li>
                      ))}
                    </>
                  )}
                </>
              )}
            </ul>
          </div>

          <div className="p-1 border-t">
            <button
              onClick={() => setIsConsolidatedViewModalOpen(true)}
              className="flex items-center w-full px-3 py-2 text-sm text-left text-purple-700 rounded-md hover:bg-purple-50"
            >
              <Layers className="w-4 h-4 mr-2" />
              Créer une vue consolidée
            </button>
            <button
              onClick={() => navigate('/client/onboarding')}
              className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
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
          onClose={() => setIsConsolidatedViewModalOpen(false)}
          projects={myProjects}
        />
      )}
    </div>
  );
};

export default React.memo(ProjectSwitcher);