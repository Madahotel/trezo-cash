import React, { useEffect, useState } from 'react';
import { Plus, ArrowRightLeft } from 'lucide-react';
import {
  apiGet,
  apiPost,
  apiUpdate,
} from '../../../components/context/actionsMethode';
import { AddAccountForm } from './form/AddAccountForm';
import toast from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';
import TransfertModal from './TransfertModal';
import AccountsTable from './AccountTable';
import AccountDetailModal from './AccountDetailModal';
import TransactionHistoryDrawer from './transactionHistoryDrawer';

const accountCategories = [
  { id: 'bank', name: 'Banque' },
  { id: 'cash', name: 'Espèces' },
  { id: 'savings', name: 'Épargne' },
];

const CashAccountsView = () => {
  const [accounts, setAccounts] = useState([]);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [loadingCard, setLoadingCard] = useState(true);
  const [selectedAccountForDetails, setSelectedAccountForDetails] =
    useState(null);
  const [selectedAccountForHistory, setSelectedAccountForHistory] =
    useState(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: '',
    account: null,
    title: '',
    message: '',
    confirmText: '',
    confirmAction: null,
  });

  const fetchData = async () => {
    try {
      setLoadingCard(true);
      const res = await apiGet('/bank-accounts');
      if (res && res.bank_accounts) {
        setAccounts(res.bank_accounts.bank_account_items);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des comptes:', error);
    } finally {
      setLoadingCard(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartEdit = (account) => {
    setEditingAccount({
      id: account.id,
      name: account.name || '',
      initial_amount: account.initial_amount || '',
      date_balance:
        account.date_balance || new Date().toISOString().split('T')[0],
      currency_id: account.currency_id,
      isEditable: account.isEditable,
    });
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
  };

  const handleSaveEdit = async () => {
    if (!editingAccount.name.trim()) {
      showMessageModal('Erreur', 'Le nom du compte ne peut pas être vide.');
      return;
    }
    try {
      const res = await apiUpdate(
        `/bank-accounts/${editingAccount.id}`,
        editingAccount
      );
      if (res && (res.success || res.message)) {
        toast.success(res.message || 'Compte créé avec succès');
        fetchData();
        handleCancelEdit();
      } else {
        throw new Error('Réponse API invalide');
      }
    } catch (error) {
      toast.error(error);
      console.log(error);
    }
  };

  const handleAddAccount = async (formData) => {
    try {
      const res = await apiPost('/bank-accounts', formData);
      if (res && (res.success || res.message)) {
        toast.success(res.message || 'Compte créé avec succès');
        fetchData();
        setIsAddingAccount(false);
      } else {
        throw new Error('Réponse API invalide');
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      toast.error(error.message || 'Erreur lors de la création du compte');
    }
  };

  // Fonction pour l'historique
  const handleViewHistory = (account) => {
    setSelectedAccountForHistory(account);
    setIsHistoryDrawerOpen(true);
  };

  const handleCloseHistory = () => {
    setIsHistoryDrawerOpen(false);
    setSelectedAccountForHistory(null);
  };

  const showCloseConfirmation = (account) => {
    setConfirmationModal({
      isOpen: true,
      type: 'close',
      account: account,
      title: 'Clôturer le compte',
      message: `Êtes-vous sûr de vouloir clôturer le compte "${account.name}" ? Vous ne pourrez plus effectuer d'opérations sur ce compte.`,
      confirmText: 'Clôturer',
      confirmAction: () => {
        setAccounts(
          accounts.map((acc) =>
            acc.id === account.id
              ? {
                  ...acc,
                  is_closed: true,
                  closure_date: new Date().toISOString().split('T')[0],
                }
              : acc
          )
        );
        closeConfirmationModal();
      },
    });
  };

  const showReopenConfirmation = (account) => {
    setConfirmationModal({
      isOpen: true,
      type: 'reopen',
      account: account,
      title: 'Ré-ouvrir le compte',
      message: `Êtes-vous sûr de vouloir ré-ouvrir le compte "${account.name}" ?`,
      confirmText: 'Ré-ouvrir',
      confirmAction: () => {
        setAccounts(
          accounts.map((acc) =>
            acc.id === account.id
              ? { ...acc, is_closed: false, closure_date: null }
              : acc
          )
        );
        closeConfirmationModal();
      },
    });
  };

  const showMessageModal = (title, message) => {
    setConfirmationModal({
      isOpen: true,
      type: 'message',
      title: title,
      message: message,
      confirmText: 'OK',
      confirmAction: closeConfirmationModal,
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      type: '',
      account: null,
      title: '',
      message: '',
      confirmText: '',
      confirmAction: null,
    });
  };

  const handleTransferSave = (transferData) => {
    console.log('Transfert effectué:', transferData);
    setIsTransferModalOpen(false);
    showMessageModal(
      'Transfert effectué',
      'Le transfert a été effectué avec succès.'
    );
  };

  // Fonction pour les détails (séparez des historiques)
  const handleViewDetails = (account) => {
    setSelectedAccountForDetails(account);
  };

  const handleCloseDetails = () => {
    setSelectedAccountForDetails(null);
  };

  if (loadingCard) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Section Comptes */}
        <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex flex-col mb-4 sm:flex-row sm:justify-between sm:items-center">
            <h3 className="mb-3 sm:mb-0 text-lg font-bold text-gray-800">
              Vos Comptes
            </h3>
            {accounts.length > 0 && (
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-2 sm:py-1.5 rounded-md font-medium flex items-center justify-center gap-2 text-sm w-full sm:w-auto transition-colors order-first sm:order-last mb-3 sm:mb-0"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Transfert entre comptes
              </button>
            )}
          </div>

          <AccountsTable
            accounts={accounts}
            editingAccount={editingAccount}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            setEditingAccount={setEditingAccount}
            onCloseAccount={showCloseConfirmation}
            onReopenAccount={showReopenConfirmation}
            onViewDetails={handleViewDetails}
            onViewHistory={handleViewHistory} // Ajoutez cette prop
          />
        </div>

        {/* Formulaire d'ajout */}
        {isAddingAccount && (
          <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <AddAccountForm
              onSave={handleAddAccount}
              onCancel={() => setIsAddingAccount(false)}
              showMessageModal={showMessageModal}
              accountCategories={accountCategories}
            />
          </div>
        )}

        {/* Bouton d'ajout */}
        {!isAddingAccount && (
          <div className="text-center px-2 sm:px-0">
            <button
              onClick={() => setIsAddingAccount(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 font-bold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 w-full sm:w-auto text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" />
              Ajouter un autre compte
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <TransfertModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSave={handleTransferSave}
        accounts={accounts}
        showMessageModal={showMessageModal}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        type={confirmationModal.type}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        confirmAction={confirmationModal.confirmAction}
        onClose={closeConfirmationModal}
      />

      <AccountDetailModal
        open={!!selectedAccountForDetails}
        onClose={handleCloseDetails}
        account={selectedAccountForDetails}
        onEdit={handleStartEdit}
        onCloseAccount={showCloseConfirmation}
        onReopenAccount={showReopenConfirmation}
      />

      <TransactionHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={handleCloseHistory}
        account={selectedAccountForHistory}
      />
    </>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
    <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="animate-pulse">
        <div className="w-1/2 sm:w-1/4 h-6 mb-4 bg-gray-200 rounded"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-200"
            >
              <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="w-32 h-4 mb-2 bg-gray-200 rounded"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="w-20 h-5 mb-1 bg-gray-200 rounded sm:mx-auto"></div>
                <div className="w-16 h-3 bg-gray-200 rounded sm:mx-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default CashAccountsView;
