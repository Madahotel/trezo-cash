import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

import toast from 'react-hot-toast';
import { apiPost } from '../../../../components/context/actionsMethode';

export const AddSubcategoryModal = ({
  isOpen,
  onClose,
  selectedCategory,
  criticities,
  onSubcategoriesCreated,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subcategories: [{ name: '', criticity_id: '' }],
  });

  const handleSubcategoryChange = (index, field, value) => {
    const newSubcategories = [...formData.subcategories];
    newSubcategories[index][field] = value;
    setFormData({
      ...formData,
      subcategories: newSubcategories,
    });
  };

  const addSubcategoryField = () => {
    setFormData({
      ...formData,
      subcategories: [
        ...formData.subcategories,
        { name: '', criticity_id: '' },
      ],
    });
  };

  const removeSubcategoryField = (index) => {
    const newSubcategories = formData.subcategories.filter(
      (_, i) => i !== index
    );
    setFormData({
      ...formData,
      subcategories: newSubcategories,
    });
  };

  const handleCreateSubcategory = async () => {
    setSubmitting(true);

    try {
      const subcategoriesToCreate = formData.subcategories
        .filter((sub) => sub.name.trim() && sub.criticity_id)
        .map((sub) => ({
          name: sub.name.trim(),
          category_id: parseInt(selectedCategory.id),
          criticity_id: parseInt(sub.criticity_id),
        }));

      if (subcategoriesToCreate.length === 0) {
        alert('Veuillez saisir au moins une sous-catégorie avec une criticité');
        return;
      }

      const res = await apiPost('/sub-categories', {
        subcategories: subcategoriesToCreate,
      });

      resetForm();
      toast.success(res.message);
      onSubcategoriesCreated();
    } catch (error) {
      console.error('Error creating subcategory:', error);
      toast.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subcategories: [{ name: '', criticity_id: '' }],
    });
    onClose();
  };

  if (!isOpen || !selectedCategory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Ajouter des sous-catégories
            </h2>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Nom de la catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                <span className="text-gray-900 font-medium">
                  {selectedCategory.name}
                </span>
              </div>
            </div>

            {/* Sous-catégories */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Sous-catégories *
                </label>
                <button
                  type="button"
                  onClick={addSubcategoryField}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un champ</span>
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {formData.subcategories.map((subcategory, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <input
                        value={subcategory.name}
                        onChange={(e) =>
                          handleSubcategoryChange(index, 'name', e.target.value)
                        }
                        placeholder="Nom de la sous-catégorie"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      />
                    </div>

                    <div className="w-1/3">
                      <select
                        value={subcategory.criticity_id}
                        onChange={(e) =>
                          handleSubcategoryChange(
                            index,
                            'criticity_id',
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                      >
                        {criticities.map((criticity) => (
                          <option key={criticity.id} value={criticity.id}>
                            {criticity.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.subcategories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubcategoryField(index)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateSubcategory}
                disabled={
                  !formData.subcategories.some(
                    (sub) => sub.name.trim() && sub.criticity_id
                  ) || submitting
                }
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Ajout...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Ajouter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
