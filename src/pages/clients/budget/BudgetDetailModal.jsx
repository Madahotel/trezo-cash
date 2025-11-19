import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Edit } from 'lucide-react';

const BudgetDetailModal = ({ open, onClose, subCategory, type, onEdit }) => {
  if (!open || !subCategory) return null;

  // Fonctions utilitaires
  const formatCurrency = (amount) => {
    return `${amount?.toLocaleString() || '0'} €`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getFrequencyBadge = (frequency) => {
    const frequencies = {
      Mensuelle: 'Mensuel',
      Trimestrielle: 'Trim',
      Annuelle: 'Annuel',
      Ponctuelle: 'Ponctuel',
      Hebdomadaire: 'Hebdo',
    };
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
        {frequencies[frequency] || frequency || 'Mensuel'}
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

  const handleEditClick = (e) => {
    onClose();
    onEdit(subCategory, type, e);
  };
  console.log(subCategory);

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
              <div className="space-y-1">
                <h2 id="modal-title" className="text-lg font-semibold">
                  Détails de la sous-catégorie
                </h2>
                <p className="text-sm text-gray-500">
                  Informations complètes de{' '}
                  {type === 'revenus' ? 'ce revenu' : 'cette dépense'}
                </p>
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
              <div className="space-y-6">
                {/* Informations principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Nom
                      </h3>
                      <p className="text-lg font-semibold">
                        {subCategory.sub_category_name}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Description
                      </h3>
                      <p className="text-gray-900">
                        {subCategory.description || 'Aucune description'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Montant
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(subCategory.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Fréquence
                      </h3>
                      <div className="flex items-center gap-2">
                        {getFrequencyBadge(subCategory.frequency_name)}
                        <span className="text-gray-900">
                          {/* {subCategory.frequency_name} */}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Période
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            Du {formatDate(subCategory.start_date)}
                          </span>
                        </div>
                        {subCategory.is_duration_indefinite ? (
                          <span className="text-green-600 text-sm">
                            → Durée indéfinie
                          </span>
                        ) : subCategory.end_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">
                              Au {formatDate(subCategory.end_date)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            Aucune date de fin
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Type
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          type === 'revenus'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {type === 'revenus' ? 'Revenu' : 'Dépense'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Informations supplémentaires
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">
                        Catégorie:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {subCategory.category_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Projet:</span>
                      <span className="ml-2 text-gray-900">
                        {subCategory.project_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Tiers:</span>
                      <span className="ml-2 text-gray-900">
                        {subCategory.user_third_party_firstname}{' '}
                        {subCategory.user_third_party_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Devise:</span>
                      <span className="ml-2 text-gray-900">
                        {subCategory.currency_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        Type de budget:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {subCategory.budget_type_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        Criticité:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {subCategory.criticity_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer avec actions */}
            <div className="flex justify-between items-center p-6 border-t">
              <div className="text-sm text-gray-500">
                Créé le{' '}
                {subCategory.created_at
                  ? formatDate(subCategory.created_at)
                  : 'Date inconnue'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BudgetDetailModal;
