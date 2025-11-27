import React from 'react';
import {
  Wallet,
  Edit,
  Archive,
  ArchiveRestore,
  Eye,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatting';

const AccountsTable = ({
  accounts,
  editingAccount,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  setEditingAccount,
  onCloseAccount,
  onReopenAccount,
  onViewDetails,
}) => {
  return (
    <div className="bg-white">
      {accounts.length > 0 ? (
        <div className="space-y-3 sm:space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-white p-4 sm:p-4 transition-colors hover:bg-gray-50 ${
                account.is_closed ? 'opacity-60' : ''
              } border-b border-gray-100 sm:border-b-0`}
            >
              {editingAccount?.id === account.id ? (
                <EditAccountForm
                  editingAccount={editingAccount}
                  setEditingAccount={setEditingAccount}
                  onCancel={onCancelEdit}
                  onSave={onSaveEdit}
                />
              ) : (
                <AccountRow
                  account={account}
                  onStartEdit={onStartEdit}
                  onCloseAccount={onCloseAccount}
                  onReopenAccount={onReopenAccount}
                  onViewDetails={onViewDetails}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">
            Aucun compte de trésorerie
          </h3>
          <p className="text-gray-500 text-xs sm:text-sm px-4">
            Créez votre premier compte pour commencer à suivre vos soldes.
          </p>
        </div>
      )}
    </div>
  );
};

// Sous-composant pour le formulaire d'édition (responsive)
const EditAccountForm = ({
  editingAccount,
  setEditingAccount,
  onCancel,
  onSave,
}) => {
  return (
    <div className="space-y-4 p-3 sm:p-4 border-l-2 border-gray-300 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-800 text-sm sm:text-base">
        Modifier le compte
      </h4>

      <input type="hidden" value={editingAccount.currency_id} />
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <div>
          <label className="text-xs sm:text-sm text-gray-600 mb-1 block">
            Nom du compte
          </label>
          <input
            type="text"
            value={editingAccount.name || ''}
            onChange={(e) =>
              setEditingAccount((d) => ({
                ...d,
                name: e.target.value,
              }))
            }
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs sm:text-sm text-gray-600 mb-1 block">
            Solde initial
          </label>
          <input
            type="number"
            disabled={!editingAccount.isEditable}
            value={editingAccount.initial_amount || ''}
            onChange={(e) =>
              setEditingAccount((d) => ({
                ...d,
                initial_amount: e.target.value,
              }))
            }
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs sm:text-sm text-gray-600 mb-1 block">
            Date du solde
          </label>
          <input
            type="date"
            value={editingAccount.date_balance || ''}
            onChange={(e) =>
              setEditingAccount((d) => ({
                ...d,
                date_balance: e.target.value,
              }))
            }
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-xs sm:text-sm text-gray-600 mb-1 block">
            Devise
          </label>
          <div className="w-full px-3 py-2 bg-gray-50 rounded border border-gray-300">
            <span className="text-sm text-gray-700">
              {editingAccount.currency?.code || 'EUR'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-3 py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={onSave}
          className="px-3 py-2 text-xs sm:text-sm bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
};

// Sous-composant pour une ligne de compte (responsive)
const AccountRow = ({
  account,
  onStartEdit,
  onCloseAccount,
  onReopenAccount,
  onViewDetails,
}) => {
  return (
    <div className="group">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        {/* Informations du compte */}
        <div className="flex items-start gap-3 flex-grow mb-3 sm:mb-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-medium text-gray-800 truncate text-sm sm:text-base">
                {account.name}
              </h3>
              {account.is_closed && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">
                  Clôturé
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Solde au{' '}
              {new Date(account.date_balance).toLocaleDateString('fr-FR')}
            </p>

            {/* Montant visible sur mobile */}
            <div className="sm:hidden mt-2">
              <p className="font-semibold text-gray-800 text-sm">
                {formatCurrency(account.initial_amount, account.currency?.code)}
              </p>
              <p className="text-xs text-gray-500">Solde initial</p>
            </div>
          </div>
        </div>

        {/* Section droite - Montant et actions */}
        <div className="flex items-center justify-between sm:justify-end relative min-w-0 sm:min-w-[200px]">
          {/* Montant - caché sur mobile, visible sur desktop */}
          <div className="hidden sm:block absolute right-0 text-right transition-all duration-300 group-hover:translate-x-[-110px] pr-2">
            <p className="font-semibold text-gray-800 whitespace-nowrap text-sm sm:text-base">
              {formatCurrency(account.initial_amount, account.currency?.code)}
            </p>
            <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
              Solde initial
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-1 sm:absolute sm:right-0 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-all sm:duration-300 sm:translate-x-[20px] sm:group-hover:translate-x-0 pl-2">
            {account.is_closed ? (
              <button
                onClick={() => onReopenAccount(account)}
                className="p-1.5 sm:p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                title="Ré-ouvrir le compte"
              >
                <ArchiveRestore className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onViewDetails(account)}
                  className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title="Voir les détails"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onStartEdit(account)}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title="Modifier"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onCloseAccount(account)}
                  className="p-1.5 sm:p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                  title="Clôturer le compte"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsTable;
