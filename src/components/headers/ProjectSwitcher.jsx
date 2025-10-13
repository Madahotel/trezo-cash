import React, { useState, useRef, useEffect } from "react";
import { ChevronsUpDown, Check, Plus, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUI } from "../context/UIContext";
import { useData } from "../context/DataContext"; // Import du contexte Data
import ConsolidatedViewModal from "../modal/ConsolidatedViewModal";

const ProjectSwitcher = () => {
  const [activeProjectId, setActiveProjectId] = useState(null);
  const { uiDispatch } = useUI();
  const { dataState } = useData(); // Accès au contexte Data
  const [isConsolidatedViewModalOpen, setIsConsolidatedViewModalOpen] = useState(false);
  const navigate = useNavigate();

  // Récupération des projets depuis le contexte Data
  const projects = dataState?.projects || [];
  
  // Filtrage des projets (exclure les projets archivés et les projets temporaires)
  const activeProjects = projects.filter(project => 
    !project.isArchived && !project.is_temp
  );

  // Séparation des projets personnels et partagés
  const myProjects = activeProjects.filter(project => 
    project.user_id === dataState?.session?.user?.id || 
    project.user_subscriber_id === dataState?.session?.user?.id
  );

  const sharedProjects = activeProjects.filter(project => 
    project.user_id !== dataState?.session?.user?.id && 
    project.user_subscriber_id !== dataState?.session?.user?.id
  );

  const consolidatedViews = [
    { id: "1", name: "Vue globale finances" },
    { id: "2", name: "Vue marketing + ventes" },
  ];

  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef(null);

  // Clic en dehors pour fermer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) {
        setIsListOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Définir le projet actif au chargement si aucun n'est sélectionné
  useEffect(() => {
    if (!activeProjectId && myProjects.length > 0) {
      setActiveProjectId(myProjects[0].id);
    }
  }, [activeProjectId, myProjects]);

  const isConsolidated = activeProjectId === "consolidated";
  const isCustomConsolidated = activeProjectId?.startsWith("consolidated_view_");

  // Fonction pour obtenir le nom d'affichage
  let displayName = "Sélectionner un projet";
  
  if (isConsolidated) {
    displayName = "Mes projets consolidés";
  } else if (isCustomConsolidated) {
    const viewId = activeProjectId.replace("consolidated_view_", "");
    const view = consolidatedViews.find((v) => v.id === viewId);
    displayName = view ? view.name : "Vue inconnue";
  } else {
    const project = [...myProjects, ...sharedProjects].find(
      (p) => p.id === activeProjectId
    );
    if (project) displayName = project.name;
  }

  const handleSelect = (id) => {
    setActiveProjectId(id);
    setIsListOpen(false);
    
    // Optionnel : Dispatch une action pour mettre à jour le projet actif dans le contexte
    if (id !== "consolidated" && !id.startsWith("consolidated_view_")) {
      const selectedProject = [...myProjects, ...sharedProjects].find(p => p.id === id);
      if (selectedProject) {
        // Dispatch pour mettre à jour le projet actif dans le contexte global
        // uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: selectedProject });
      }
    }
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

  // Fonction pour obtenir l'initiale du projet
  const getProjectInitial = (projectName) => {
    return projectName ? projectName[0].toUpperCase() : '?';
  };

  // Fonction pour obtenir la couleur de l'avatar basée sur l'ID du projet
  const getAvatarColor = (projectId) => {
    const colors = [
      'bg-blue-200 text-blue-700',
      'bg-green-200 text-green-700', 
      'bg-purple-200 text-purple-700',
      'bg-orange-200 text-orange-700',
      'bg-pink-200 text-pink-700',
      'bg-indigo-200 text-indigo-700'
    ];
    const index = Math.abs(projectId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative w-full" ref={listRef}>
      {/* Bouton principal */}
      <button
        onClick={() => setIsListOpen(!isListOpen)}
        className="flex items-center gap-2 p-1.5 rounded-md text-left text-gray-800 font-semibold hover:bg-gray-200 transition-colors focus:outline-none w-full"
      >
        <Layers className="w-5 h-5 text-gray-500" />
        <span className="truncate flex-grow">{displayName}</span>
        <ChevronsUpDown className="w-4 h-4 text-gray-500 shrink-0" />
      </button>

      {/* Liste déroulante */}
      {isListOpen && (
        <div className="absolute z-30 mt-2 w-72 bg-white border rounded-lg shadow-lg">
          <div className="p-1 max-h-80 overflow-y-auto">
            <ul>
              {/* Vues consolidées */}
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

              {/* Mes projets */}
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
                    </span>
                    {project.id === activeProjectId && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                </li>
              ))}

              {/* Message si aucun projet */}
              {myProjects.length === 0 && sharedProjects.length === 0 && (
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

              {/* Projets partagés */}
              {sharedProjects.length > 0 && (
                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">
                  Projets partagés avec moi ({sharedProjects.length})
                </div>
              )}
              {sharedProjects.map((project) => (
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
                      <span className="px-1.5 py-0.5 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full shrink-0">
                        Partagé
                      </span>
                    </span>
                    {project.id === activeProjectId && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
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
      
      {/* Modal pour les vues consolidées */}
      {isConsolidatedViewModalOpen && (
        <ConsolidatedViewModal
          isOpen={isConsolidatedViewModalOpen}
          onClose={closeConsolidatedViewModal}
          // onSave={handleSaveConsolidatedView} 
          // editingView={editingConsolidatedView} 
        />
      )}
    </div>
  );
};

export default ProjectSwitcher;