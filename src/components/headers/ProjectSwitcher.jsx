import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronsUpDown, Check, Plus, Layers } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const { projects: rawProjects, loading: projectsLoading, refetch: refetchProjects } = useProjects();
  const { consolidations, loading: consolidationsLoading, error: consolidationsError, refetch: refetchConsolidations } = useConsolidations();

  const [isListOpen, setIsListOpen] = useState(false);
  const [isConsolidatedViewModalOpen, setIsConsolidatedViewModalOpen] = useState(false);
  const listRef = useRef(null);

  // S'assurer que myProjects est toujours un tableau
  const myProjects = useMemo(() => {
    if (!rawProjects || !Array.isArray(rawProjects)) return [];
    return rawProjects.filter(p => !["1", 1, true, "true"].includes(p?.is_archived ?? p?.isArchived ?? 0));
  }, [rawProjects]);

  // S'assurer que consolidations est toujours un tableau avec sécurité
  const safeConsolidations = useMemo(() => {
    if (!consolidations) return [];
    if (Array.isArray(consolidations)) return consolidations;

    // Si consolidations est un objet, essayer d'en extraire un tableau
    if (typeof consolidations === 'object' && consolidations !== null) {
      // Essayer différentes clés potentielles
      if (Array.isArray(consolidations.consolidations)) return consolidations.consolidations;
      if (Array.isArray(consolidations.data)) return consolidations.data;
      if (Array.isArray(consolidations.views)) return consolidations.views;
      if (Array.isArray(consolidations.items)) return consolidations.items;
    }

    console.warn('Structure de consolidations inattendue:', consolidations);
    return [];
  }, [consolidations]);

  const activeProjectId = uiState.activeProject?.id || null;

  const getSavedProject = useCallback(() => {
    try { return JSON.parse(localStorage.getItem('activeProject') || 'null'); }
    catch { return null; }
  }, []);

  const saveProject = useCallback((project) => {
    try { localStorage.setItem('activeProject', JSON.stringify(project)); } catch { }
  }, []);

  const handleSaveConsolidatedView = useCallback((viewData) => {
    try {
      const savedViews = JSON.parse(localStorage.getItem("consolidatedViews") || "[]");
      const newView = {
        id: "consolidated_view_" + (savedViews.length + 1),
        name: viewData.name || 'Nouvelle vue',
        project_ids: Array.isArray(viewData.project_ids) ? viewData.project_ids : []
      };
      localStorage.setItem("consolidatedViews", JSON.stringify([...savedViews, newView]));
      setIsConsolidatedViewModalOpen(false);
      uiDispatch({
        type: "SET_ACTIVE_PROJECT",
        payload: { id: newView.id, name: newView.name, type: "consolidated" }
      });
      saveProject({ id: newView.id, name: newView.name, type: "consolidated" });
      refetchConsolidations(); // Recharger les consolidations après création
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la vue consolidée:', error);
    }
  }, [uiDispatch, saveProject, refetchConsolidations]);

  const displayName = useMemo(() => {
    if (activeProjectId === 'consolidated') return 'Mes projets consolidés';

    const foundConsolidation = safeConsolidations.find(c =>
      c && `consolidated_view_${c.id}` === activeProjectId
    );
    if (foundConsolidation) return foundConsolidation.name;

    return uiState.activeProject?.name || 'Sélectionner un projet';
  }, [activeProjectId, uiState.activeProject?.name, safeConsolidations]);

  const handleSelect = useCallback((id) => {
    try {
      const idStr = String(id);
      if (idStr === 'consolidated' || idStr.startsWith('consolidated_view_')) {
        const consolidatedProject = idStr === 'consolidated'
          ? { id: idStr, name: 'Mes projets consolidés', type: 'consolidated' }
          : {
            id: idStr,
            name: safeConsolidations.find(c => c && `consolidated_view_${c.id}` === idStr)?.name || 'Vue consolidée',
            type: 'consolidated'
          };

        uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: consolidatedProject });
        saveProject(consolidatedProject);

        // Navigation vers la page de la vue consolidée
        if (idStr.startsWith('consolidated_view_')) {
          const numericId = idStr.replace('consolidated_view_', '');
          navigate(`/client/consolidations/${numericId}`);
        } else {
          // Pour "Mes projets consolidés", vous pouvez créer une page spéciale
          navigate('/client/consolidations/all');
        }
      } else {
        const selectedProject = myProjects.find(p => areIdsEqual(p.id, id));
        if (selectedProject) {
          uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: selectedProject });
          saveProject(selectedProject);
          navigate('/client/projets');
        }
      }
      setIsListOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sélection du projet:', error);
    }
  }, [myProjects, uiDispatch, saveProject, safeConsolidations, navigate]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) setIsListOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Afficher l'erreur si nécessaire (optionnel, pour le débogage)
  useEffect(() => {
    if (consolidationsError) {
      console.error('Erreur des consolidations:', consolidationsError);
    }
  }, [consolidationsError]);

  // Gérer le chargement
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
        className="flex items-center gap-2 p-1.5 rounded-md text-left w-full text-gray-800 font-semibold hover:bg-gray-200"
        disabled={projectsLoading || consolidationsLoading}
      >
        <Layers className="w-5 h-5 text-gray-500" />
        <span className="flex-1 truncate">{displayName}</span>
        <ChevronsUpDown className="w-4 h-4 text-gray-500" />
      </button>

      {isListOpen && (
        <div className="absolute z-30 mt-2 bg-white border rounded-lg shadow-lg w-72">
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

              {/* Vues consolidées existantes */}
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
                      {activeProjectId === `consolidated_view_${c?.id}` && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  </li>
                ))
              ) : (
                // Message si aucune consolidation
                <li className="px-3 py-2 text-sm italic text-gray-500">
                  Aucune vue consolidée créée
                </li>
              )}

              {/* Séparateur seulement s'il y a des projets */}
              {myProjects.length > 0 && (
                <>
                  <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">
                    Mes Projets
                  </div>

                  <ul>
                    {myProjects.map(p => (
                      <li key={p.id}>
                        <button
                          onClick={() => handleSelect(p.id)}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
                        >
                          <span className="flex items-center gap-2 truncate">
                            {/* Avatar */}
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${getAvatarColor(p.id)}`}>
                              {getProjectInitial(p.name)}
                            </div>
                            {/* Project Name */}
                            <span className="flex-1 truncate">{p.name || 'Sans nom'}</span>
                            {/* Project Type Badge */}
                            <span className="px-1.5 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                              {getProjectType(p)}
                            </span>
                          </span>

                          {/* Check if active */}
                          {activeProjectId === p.id && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </ul>
          </div>

          <div className="p-1 border-t">
            <button
              onClick={() => setIsConsolidatedViewModalOpen(true)}
              className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100"
            >
              <Layers className="w-4 h-4 mr-2" />
              Créer une vue consolidée
            </button>
            <button
              onClick={() => location.href = '/client/onboarding'}
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
          onSave={handleSaveConsolidatedView}
          projects={myProjects}
          session={{ user }}
        />
      )}
    </div>
  );
};

export default React.memo(ProjectSwitcher);