import React, { useState } from 'react';
import {
  Save,
  X,
  Edit,
  Tag,
  TrendingUp,
  TrendingDown,
  Trash2,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  apiUpdate,
  apiDelete,
} from '../../../../components/context/actionsMethode';

export const SubcategoryDetailModal = ({
  isOpen,
  onClose,
  selectedCategory,
  selectedSubCategory,
  criticities,
  onSubcategoryUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    criticity_id: '',
  });

  // Initialiser les données d'édition quand la sous-catégorie change
  React.useEffect(() => {
    if (selectedSubCategory) {
      setEditFormData({
        name: selectedSubCategory.name,
        criticity_id: selectedSubCategory.criticity?.id?.toString() || '',
      });
    }
  }, [selectedSubCategory]);

  // Fonction pour fermer le modal et réinitialiser tout
  const handleClose = () => {
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setSubmitting(false);
    setDeleting(false);
    onClose();
  };

  // Fonction pour démarrer l'édition
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveEdit = async () => {
    try {
      setSubmitting(true);

      const updateData = {
        name: editFormData.name.trim(),
        criticity_id: parseInt(editFormData.criticity_id),
      };

      const res = await apiUpdate(
        `/sub-categories/${selectedSubCategory.id}`,
        updateData
      );

      setIsEditing(false);
      toast.success(res.message);
      onSubcategoryUpdated();
      handleClose();
    } catch (error) {
      console.error('Error updating subcategory:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour confirmer la suppression
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);

      const res = await apiDelete(`/sub-categories/${selectedSubCategory.id}`);

      toast.success(res.message);
      onSubcategoryUpdated();
      handleClose();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Fonction pour annuler la suppression
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Fonction pour annuler l'édition
  const handleCancelEdit = () => {
    setEditFormData({
      name: selectedSubCategory.name,
      criticity_id: selectedSubCategory.criticity?.id?.toString() || '',
    });
    setIsEditing(false);
  };

  // Gestion du changement dans le formulaire d'édition
  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen || !selectedSubCategory || !selectedCategory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Détails de la sous-catégorie
            </h2>
            <div className="flex items-center space-x-2">
              {/* Bouton de suppression avec confirmation */}
              <div className="flex items-center space-x-1">
                {showDeleteConfirm ? (
                  <>
                    {/* Bouton d'annulation (X) - À GAUCHE */}
                    <div className="group relative">
                      <button
                        onClick={handleCancelDelete}
                        disabled={deleting}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Annuler la suppression"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Annuler
                      </div>
                    </div>

                    {/* Bouton de confirmation (coche) - À DROITE */}
                    <div className="group relative">
                      <button
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                        className="p-2 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                        title="Confirmer la suppression"
                      >
                        {deleting ? (
                          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Confirmer
                      </div>
                    </div>
                  </>
                ) : (
                  /* Bouton de suppression initial */
                  <div className="group relative">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Supprimer la sous-catégorie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Supprimer
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton de fermeture du modal */}
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Informations principales */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedSubCategory.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Sous-catégorie de {selectedCategory.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    {selectedCategory.type === 'expense' ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-red-600 font-medium">Sortie</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 font-medium">
                          Entrée
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500">Criticité:</span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedSubCategory.criticity?.name === 'Haute'
                          ? 'bg-red-100 text-red-800'
                          : selectedSubCategory.criticity?.name === 'Moyenne'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {selectedSubCategory.criticity?.name || 'Non définie'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire de modification (visible seulement en mode édition) */}
            {isEditing && (
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">
                  Modifier la sous-catégorie
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de la sous-catégorie
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) =>
                        handleEditFormChange('name', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom de la sous-catégorie"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Criticité
                    </label>
                    <select
                      value={editFormData.criticity_id}
                      onChange={(e) =>
                        handleEditFormChange('criticity_id', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner une criticité</option>
                      {criticities.map((criticity) => (
                        <option key={criticity.id} value={criticity.id}>
                          {criticity.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={
                      !editFormData.name.trim() ||
                      !editFormData.criticity_id ||
                      submitting
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sauvegarde...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Sauvegarder</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
