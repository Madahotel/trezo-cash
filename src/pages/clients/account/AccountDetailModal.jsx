import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Edit,
  Wallet,
  Calendar,
  Archive,
  ArchiveRestore,
  Loader,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatting';
import { apiGet } from '../../../components/context/actionsMethode';

const AccountDetailModal = ({
  open,
  onClose,
  account, // On reçoit seulement l'ID du compte
  onEdit,
  onCloseAccount,
  onReopenAccount,
}) => {
  const [accountData, setAccountData] = useState(null);
  const [reportedAmount, setReportedAmount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fonctions utilitaires
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getAccountTypeBadge = (mainCategoryId) => {
    const accountTypes = {
      bank: { label: 'Banque', color: 'bg-blue-100 text-blue-800' },
      cash: { label: 'Espèces', color: 'bg-green-100 text-green-800' },
      savings: { label: 'Épargne', color: 'bg-purple-100 text-purple-800' },
    };

    const type = accountTypes[mainCategoryId] || {
      label: 'Autre',
      color: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 ${type.color} text-xs rounded-full`}>
        {type.label}
      </span>
    );
  };

  const getStatusBadge = (isClosed, closureDate) => {
    if (isClosed) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center gap-1">
          <Archive className="w-3 h-3" />
          Clôturé le {formatDate(closureDate)}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
        Actif
      </span>
    );
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleEditClick = () => {
    onClose();
    onEdit(accountData);
  };

  const handleCloseAccountClick = () => {
    onClose();
    onCloseAccount(accountData);
  };

  const handleReopenAccountClick = () => {
    onClose();
    onReopenAccount(accountData);
  };

  const fetchAccountData = async (id) => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiGet(`/bank-accounts/${id}`);
      setAccountData(res.bank_account);
      setReportedAmount(res.reportedAmount);
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      setError('Erreur lors du chargement des détails du compte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && account?.id) {
      fetchAccountData(account.id);
    }
  }, [open, account?.id]);

  // Reset les données quand le modal se ferme
  useEffect(() => {
    if (!open) {
      setAccountData(null);
      setError(null);
    }
  }, [open]);

  if (!open || !account) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-teal-600" />
                </div>
                <div className="space-y-1">
                  <h2 id="modal-title" className="text-lg font-semibold">
                    Détails du compte
                  </h2>
                  <p className="text-sm text-gray-500">
                    Informations complètes de votre compte
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 p-0 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fermer</span>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Chargement...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-600 mb-2">{error}</div>
                  <button
                    onClick={() => fetchAccountData(account.id)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Réessayer
                  </button>
                </div>
              ) : accountData ? (
                <div className="space-y-6">
                  {/* Informations principales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Nom du compte
                        </h3>
                        <p className="text-lg font-semibold">
                          {accountData.name}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Type de compte
                        </h3>
                        <div className="flex items-center gap-2">
                          {getAccountTypeBadge(accountData.mainCategoryId)}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Statut
                        </h3>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(
                            accountData.is_closed,
                            accountData.closure_date
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Date du création
                        </h3>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {formatDate(accountData.date_balance)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Solde initial
                        </h3>
                        <p className="text-2xl font-bold text-gray-900">
                          {accountData.initial_amount}
                          {accountData.currency_symbol}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Solde actuel
                        </h3>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportedAmount}
                          {accountData.currency_symbol}
                        </p>
                      </div>

                      {accountData.currency && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">
                            Devise
                          </h3>
                          <p className="text-gray-900">
                            {accountData.currency.name} (
                            {accountData.currency.code})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Informations supplémentaires
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* <div>
                        <span className="font-medium text-gray-500">
                          ID du compte:
                        </span>
                        <span className="ml-2 text-gray-900 font-mono">
                          {accountData.id}
                        </span>
                      </div> */}
                      <div>
                        <span className="font-medium text-gray-500">
                          Devise :
                        </span>
                        <span className="ml-2 text-gray-900">
                          {accountData.currency_name}
                        </span>
                      </div>
                      {/* <div>
                        <span className="font-medium text-gray-500">
                          Date de création:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {accountData.created_at
                            ? formatDate(accountData.created_at)
                            : 'Non disponible'}
                        </span>
                      </div> */}
                      <div>
                        <span className="font-medium text-gray-500">
                          Dernière modification:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {accountData.updated_at
                            ? formatDate(accountData.updated_at)
                            : 'Non disponible'}
                        </span>
                      </div>
                      {accountData.is_closed && accountData.closure_date && (
                        <div>
                          <span className="font-medium text-gray-500">
                            Date de clôture:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {formatDate(accountData.closure_date)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            {/* Footer avec actions */}
            <div className="flex justify-between items-center p-6 border-t">
              <div className="text-sm text-gray-500">
                {accountData?.created_at &&
                  `Créé le ${formatDate(accountData.created_at)}`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>

                {accountData && (
                  <>
                    {accountData.is_closed ? (
                      <button
                        onClick={handleReopenAccountClick}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                        Ré-ouvrir
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleCloseAccountClick}
                          className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition-colors flex items-center gap-2"
                        >
                          <Archive className="w-4 h-4" />
                          Clôturer
                        </button>
                        <button
                          onClick={handleEditClick}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AccountDetailModal;
