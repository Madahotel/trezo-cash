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
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex flex-col mb-4 sm:flex-row sm:justify-between sm:items-center">
            <h3 className="mb-2 text-lg font-bold text-gray-800 sm:mb-0">
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
        ) : null}
                  <div className="text-center">
            <button
              onClick={() => setIsAddingAccount(true)}
              className="inline-flex items-center w-full gap-2 px-4 py-2 font-bold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 sm:w-auto"
            >
              <Plus className="w-5 h-5" /> Ajouter un autre compte
            </button>
          </div>
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
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="animate-pulse">
        <div className="w-1/4 h-6 mb-4 bg-gray-200 rounded"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between py-4 border-b border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="w-32 h-4 mb-2 bg-gray-200 rounded"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="w-20 h-5 mb-1 bg-gray-200 rounded"></div>
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default CashAccountsView;
