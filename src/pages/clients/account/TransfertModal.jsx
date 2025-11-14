import React, { useState } from 'react';
import { X } from 'lucide-react';

const TransfertModal = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  showMessageModal,
}) => {
  const [transferData, setTransferData] = useState({
    sourceAccountId: '',
    destinationAccountId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!transferData.sourceAccountId || !transferData.destinationAccountId) {
      showMessageModal(
        'Erreur',
        'Veuillez sélectionner les comptes source et destination.'
      );
      return;
    }
    if (transferData.sourceAccountId === transferData.destinationAccountId) {
      showMessageModal(
        'Erreur',
        'Les comptes source et destination doivent être différents.'
      );
      return;
    }
    if (!transferData.amount || parseFloat(transferData.amount) <= 0) {
      showMessageModal('Erreur', 'Veuillez saisir un montant valide.');
      return;
    }
    onSave({
      ...transferData,
      amount: parseFloat(transferData.amount),
    });
  };

  const activeAccounts = accounts.filter((acc) => !acc.is_closed);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-800">
            Transfert entre comptes
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compte source
            </label>
            <select
              value={transferData.sourceAccountId}
              onChange={(e) =>
                setTransferData({
                  ...transferData,
                  sourceAccountId: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un compte</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compte destination
            </label>
            <select
              value={transferData.destinationAccountId}
              onChange={(e) =>
                setTransferData({
                  ...transferData,
                  destinationAccountId: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un compte</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant
            </label>
            <input
              type="number"
              step="0.01"
              value={transferData.amount}
              onChange={(e) =>
                setTransferData({ ...transferData, amount: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={transferData.date}
              onChange={(e) =>
                setTransferData({ ...transferData, date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <input
              type="text"
              value={transferData.description}
              onChange={(e) =>
                setTransferData({
                  ...transferData,
                  description: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
            >
              Effectuer le transfert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransfertModal;
