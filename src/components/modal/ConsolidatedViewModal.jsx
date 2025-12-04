import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Layers } from 'lucide-react';
import axios from '../../components/config/Axios';

const ConsolidatedViewModal = ({
  isOpen,
  onClose,
  editingView,
  projects = [],
}) => {
  const activeProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => p && p.entity_status_id !== 3);
  }, [projects]);

  const [name, setName] = useState('');
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingView) {
        setName(editingView.name || '');
        setSelectedProjects(new Set(editingView.project_ids || []));
      } else {
        setName('');
        setSelectedProjects(new Set());
      }
    }
  }, [isOpen, editingView]);

  const handleProjectToggle = (projectId) => {
    setSelectedProjects(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(projectId)) {
        newSelection.delete(projectId);
      } else {
        newSelection.add(projectId);
      }
      return newSelection;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Veuillez donner un nom à la vue consolidée.");
      return;
    }
    if (selectedProjects.size < 2) {
      alert("Veuillez sélectionner au moins deux projets à consolider.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/consolidations', {
        name,
        project_id: Array.from(selectedProjects),
      });

      if (response.data.status === 200) {
        // Émettre un événement pour indiquer la création réussie
        window.dispatchEvent(new CustomEvent('consolidationCreatedSuccess', {
          detail: {
            consolidation: response.data.consolidation,
            message: 'Vue consolidée créée avec succès !'
          }
        }));

        // Émettre un événement pour rafraîchir les consolidations
        window.dispatchEvent(new CustomEvent('consolidationsRefreshed'));

        // Fermer le modal avec un petit délai pour l'UI
        setTimeout(() => {
          onClose();
          alert("Vue consolidée créée avec succès !");
        }, 100);
      } else {
        alert(response.data.message || "Erreur lors de la création de la consolidation");
      }
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message || "Erreur serveur lors de la création de la consolidation";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Layers className="w-5 h-5 text-purple-600" />
            {editingView ? 'Modifier la vue consolidée' : 'Nouvelle Vue Consolidée'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Nom de la vue *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ex: Tous mes projets pros, Patrimoine Global..."
              required
              autoFocus
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Projets à inclure *
              </label>
              <span className="text-sm text-gray-500">
                {selectedProjects.size} sélectionné(s)
              </span>
            </div>
            <div className="p-2 space-y-2 overflow-y-auto border rounded-lg max-h-60 bg-gray-50">
              {activeProjects.length > 0 ? (
                activeProjects.map(project => (
                  <div key={project.id} className="flex items-center p-2 transition-colors rounded-md hover:bg-gray-100">
                    <input
                      type="checkbox"
                      id={`project-${project.id}`}
                      checked={selectedProjects.has(project.id)}
                      onChange={() => handleProjectToggle(project.id)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor={`project-${project.id}`} className="flex-1 ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                      {project.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="p-2 text-sm text-gray-500">Aucun projet actif disponible.</p>
              )}
            </div>
            {selectedProjects.size > 0 && (
              <div className="mt-2 text-xs text-purple-600">
                ✅ Prêt à créer avec {selectedProjects.size} projet(s)
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || selectedProjects.size < 2 || !name.trim()}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> 
                  Créer la vue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsolidatedViewModal;