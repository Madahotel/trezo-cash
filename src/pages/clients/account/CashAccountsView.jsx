import React, { useState, useMemo } from 'react';
import { Wallet, Edit, Plus, Trash2, AlertTriangle, Archive, ArchiveRestore, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatting';
import { useData, mainCashAccountCategories } from '../../../components/context/DataContext';
import { useUI } from '../../../components/context/UIContext';
import AddAccountForm from './AddAccountForm';
import EmptyState from '../../../components/emptystate/EmptyState.jsx';
import TransferModal from '../../../components/modal/TransferModal.jsx';
import { updateUserCashAccount, addUserCashAccount } from '../../../components/context/actions';

// Données statiques pour simuler les comptes (à remplacer par vos données réelles)
const mockAccounts = [
  {
    id: 'acc1',
    name: 'Compte Bancaire Principal',
    mainCategoryId: 'bank',
    initialBalance: 5000,
    initialBalanceDate: '2025-01-01',
    balance: 7500.25,
    isClosed: false,
  },
  {
    id: 'acc2',
    name: 'Caisse Espèces',
    mainCategoryId: 'cash',
    initialBalance: 1000,
    initialBalanceDate: '2025-02-01',
    balance: 850.75,
    isClosed: true,
    closureDate: '2025-09-15',
  },
  {
    id: 'acc3',
    name: 'Compte Épargne',
    mainCategoryId: 'savings',
    initialBalance: 10000,
    initialBalanceDate: '2025-03-01',
    balance: 10250.50,
    isClosed: false,
  },
];

// Pour utiliser vos données réelles, remplacez mockAccounts par useAccountBalances comme suit :
// const accountBalances = useAccountBalances(allCashAccounts, allActuals, activeProjectId, isConsolidated, isCustomConsolidated, consolidatedViews);

const CashAccountsView = () => {
  const { dataState, dataDispatch } = useData();
  const { uiState, uiDispatch } = useUI();
  const { settings, allActuals, projects, session, consolidatedViews } = dataState;
  const { activeProjectId } = uiState;
  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
  
  const isConsolidated = activeProjectId === 'consolidated';
 const prefix = 'consolidated_view_';
const projectIdStr = String(activeProjectId);
const isCustomConsolidated = projectIdStr.substring(0, prefix.length) === prefix;


  // Utilisation des données statiques pour les tests (remplacez par useAccountBalances pour les données réelles)
  const accountBalances = mockAccounts;

  const accountTypeMap = useMemo(() => 
    new Map(mainCashAccountCategories.map(cat => [cat.id, cat.name])), 
  []);

  const [editingAccount, setEditingAccount] = useState(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const isAccountUsed = (accountId) => {
    const projectActuals = allActuals[activeProjectId] || [];
    return projectActuals.flatMap(a => a.payments || []).some(p => p.cashAccount === accountId);
  };

  const handleStartEdit = (account) => {
    setEditingAccount({
      id: account.id,
      name: account.name || '',
      initialBalance: account.initialBalance || '',
      initialBalanceDate: account.initialBalanceDate || new Date().toISOString().split('T')[0]
    });
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
  };

  const handleSaveEdit = () => {
    if (!editingAccount.name.trim()) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Le nom du compte ne peut pas être vide.", type: 'error' } });
      return;
    }
    updateUserCashAccount({ dataDispatch, uiDispatch }, {
      projectId: activeProjectId,
      accountId: editingAccount.id,
      accountData: {
        name: editingAccount.name.trim(),
        initialBalance: parseFloat(editingAccount.initialBalance) || 0,
        initialBalanceDate: editingAccount.initialBalanceDate
      }
    });
    handleCancelEdit();
  };

  const handleAddAccount = (formData) => {
    addUserCashAccount({ dataDispatch, uiDispatch }, {
      projectId: activeProjectId,
      mainCategoryId: formData.mainCategoryId,
      name: formData.name.trim(),
      initialBalance: parseFloat(formData.initialBalance) || 0,
      initialBalanceDate: formData.initialBalanceDate || new Date().toISOString().split('T')[0],
      user: session.user,
      currency: formData.currency
    });
    setIsAddingAccount(false);
  };

  const handleDeleteAccount = (accountId) => {
    if (isAccountUsed(accountId)) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Suppression impossible: ce compte est utilisé dans des transactions.", type: 'error' } });
      return;
    }
    uiDispatch({
      type: 'OPEN_CONFIRMATION_MODAL',
      payload: {
        title: 'Supprimer ce compte ?',
        message: 'Cette action est irréversible.',
        onConfirm: () => dataDispatch({ type: 'DELETE_USER_CASH_ACCOUNT', payload: { projectId: activeProjectId, accountId } }),
      }
    });
  };

  const handleStartClose = (account) => {
    uiDispatch({ type: 'OPEN_CLOSE_ACCOUNT_MODAL', payload: account });
  };

  const handleReopen = (accountId) => {
    dataDispatch({ type: 'REOPEN_CASH_ACCOUNT', payload: { projectId: activeProjectId, accountId } });
  };

  const handleTransferSave = (transferData) => {
    dataDispatch({
      type: 'CREATE_TRANSFER',
      payload: {
        projectId: activeProjectId,
        sourceAccountId: transferData.sourceAccountId,
        destinationAccountId: transferData.destinationAccountId,
        amount: transferData.amount,
        date: transferData.date,
        description: transferData.description
      }
    });
    setIsTransferModalOpen(false);
  };
  
  if (isConsolidated || isCustomConsolidated) {
    return (
      <div className="flex items-start gap-3 p-4 text-yellow-800 border border-yellow-200 border-opacity-50 rounded-lg bg-yellow-50">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold">Vue Consolidée</h4>
          <p className="text-sm">La gestion des comptes de trésorerie se fait par projet. Veuillez sélectionner un projet spécifique pour ajouter ou modifier des comptes.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="p-6 bg-white border border-gray-200 border-opacity-50 rounded-lg shadow-sm">
          <div className="flex flex-col mb-4 sm:flex-row sm:justify-between sm:items-center">
            <h3 className="mb-2 text-lg font-bold text-gray-800 sm:mb-0">Vos Comptes</h3>
            <button 
              onClick={() => setIsTransferModalOpen(true)}
              className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-md font-medium flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfert entre comptes
            </button>
          </div>
          {accountBalances.length > 0 ? (
            <ul className="divide-y divide-gray-200 divide-opacity-50">
              {accountBalances.map(account => (
                <li key={account.id} className={`py-4 ${account.isClosed ? 'opacity-60' : ''}`}>
                  {editingAccount?.id === account.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Nom du compte</label>
                          <input type="text" value={editingAccount.name || ''} onChange={(e) => setEditingAccount(d => ({ ...d, name: e.target.value }))} className="w-full px-3 py-1 text-base font-medium text-gray-900 border border-gray-200 border-opacity-50 rounded-md" autoFocus />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Solde initial</label>
                          <input type="number" value={editingAccount.initialBalance || ''} onChange={(e) => setEditingAccount(d => ({ ...d, initialBalance: e.target.value }))} className="w-full px-3 py-1 text-base text-gray-900 border border-gray-200 border-opacity-50 rounded-md" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Date du solde</label>
                          <input type="date" value={editingAccount.initialBalanceDate || ''} onChange={(e) => setEditingAccount(d => ({ ...d, initialBalanceDate: e.target.value }))} className="w-full px-3 py-1 text-base text-gray-900 border border-gray-200 border-opacity-50 rounded-md" min={activeProject?.startDate} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={handleCancelEdit} className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
                        <button onClick={handleSaveEdit} className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700">Enregistrer</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col group sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-grow mb-2 sm:mb-0">
                        <div className="flex items-center gap-3">
                          <Wallet className="w-5 h-5 text-teal-600" />
                          <div>
                            <span className="font-medium text-gray-800">{account.name}</span>
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{accountTypeMap.get(account.mainCategoryId) || 'N/A'}</span>
                            {account.isClosed && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Clôturé le {new Date(account.closureDate).toLocaleDateString('fr-FR')}</span>}
                          </div>
                        </div>
                        <div className="mt-1 ml-8 text-sm text-gray-500">
                          Solde initial: <span className="font-semibold">{formatCurrency(account.initialBalance || 0, settings)}</span> le {new Date(account.initialBalanceDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full gap-4 mt-2 sm:justify-end sm:mt-0 sm:w-auto">
                        <div className="text-left sm:text-right">
                          <p className="text-lg font-bold text-gray-800">{formatCurrency(account.balance, settings)}</p>
                          <p className="text-xs text-gray-500">Solde au {new Date().toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="flex items-center gap-2 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                          {account.isClosed ? (
                            <button onClick={() => handleReopen(account.id)} className="p-1 text-green-600 hover:text-green-800" title="Ré-ouvrir le compte"><ArchiveRestore className="w-4 h-4" /></button>
                          ) : (
                            <>
                              <button onClick={() => handleStartEdit(account)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleStartClose(account)} className="p-1 text-yellow-600 hover:text-yellow-800" title="Clôturer le compte"><Archive className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteAccount(account.id)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed" title={isAccountUsed(account.id) ? "Suppression impossible: compte utilisé" : "Supprimer"}><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            !isAddingAccount && (
              <EmptyState icon={Wallet} title="Aucun compte de trésorerie" message="Créez votre premier compte (bancaire, caisse, etc.) pour commencer à suivre vos soldes." actionText="Ajouter un compte" onActionClick={() => setIsAddingAccount(true)} />
            )
          )}
        </div>

        {isAddingAccount ? (
          <AddAccountForm onSave={handleAddAccount} onCancel={() => setIsAddingAccount(false)} />
        ) : accountBalances.length > 0 ? (
          <div className="text-center">
            <button onClick={() => setIsAddingAccount(true)} className="inline-flex items-center w-full gap-2 px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 sm:w-auto">
              <Plus className="w-5 h-5" /> Ajouter un autre compte
            </button>
          </div>
        ) : null}
      </div>

      <TransferModal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        onSave={handleTransferSave} 
      />
    </>
  );
};

export default CashAccountsView;
