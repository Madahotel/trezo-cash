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
  const [selectedAccount, setSelectedAccount] = useState(null);
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
  // Fonction pour ouvrir le modal
  const handleViewDetails = (account) => {
    setSelectedAccount(account);
  };

  // Fonction pour fermer le modal
  const handleCloseDetails = () => {
    setSelectedAccount(null);
  };

  if (loadingCard) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800 mb-2 sm:mb-0">
              Vos Comptes
            </h3>
            {accounts.length > 0 && (
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-md font-medium flex items-center justify-center gap-2 text-sm w-full sm:w-auto transition-colors"
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
          />
        </div>

        {isAddingAccount ? (
          <AddAccountForm
            onSave={handleAddAccount}
            onCancel={() => setIsAddingAccount(false)}
            showMessageModal={showMessageModal}
            accountCategories={accountCategories}
          />
        ) : accounts.length > 0 ? (
          <div className="text-center">
            <button
              onClick={() => setIsAddingAccount(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center gap-2 w-full sm:w-auto transition-colors"
            >
              <Plus className="w-5 h-5" /> Ajouter un autre compte
            </button>
          </div>
        ) : null}
      </div>

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
        open={!!selectedAccount}
        onClose={handleCloseDetails}
        account={selectedAccount}
        onEdit={handleStartEdit}
        onCloseAccount={showCloseConfirmation}
        onReopenAccount={showReopenConfirmation}
      />
    </>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between py-4 border-b border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-5 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default CashAccountsView;
