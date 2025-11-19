import { useState } from 'react';

export const AddAccountForm = ({
  onSave,
  onCancel,
  showMessageModal,
  accountCategories,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    mainCategoryId: 'bank',
    initial_amount: '',
    date_balance: '',
    currency_id: 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showMessageModal('Erreur', 'Le nom du compte ne peut pas être vide.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="font-bold text-lg text-gray-800 mb-4">
        Ajouter un compte
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du compte
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de compte
          </label>
          <select
            value={formData.mainCategoryId}
            onChange={(e) =>
              setFormData({ ...formData, mainCategoryId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {accountCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solde initial
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.initial_amount}
              onChange={(e) =>
                setFormData({ ...formData, initial_amount: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date du solde
            </label>
            <input
              type="date"
              value={formData.date_balance}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  date_balance: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Créer le compte
          </button>
        </div>
      </form>
    </div>
  );
};
