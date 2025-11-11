import {
  Banknote,
  CheckCircle2,
  CreditCard,
  X,
  Wallet,
  Calendar,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  getCollection,
  saveCollection,
} from '../../../components/context/collectionActions';

const Cash = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
    <circle cx="12" cy="12" r="2"></circle>
    <path d="M6 12h.01M18 12h.01"></path>
  </svg>
);

export const CollectionModal = ({ isOpen, onClose, transaction, cellDate }) => {
  const formatDateForDB = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formattedDate = formatDateForDB(cellDate);
  const displayDate = formatDisplayDate(cellDate);

  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currency, setCurrency] = useState('EUR'); // Devise par défaut
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = parseFloat(transaction?.amount || 0);
  const totalCollected = Array.isArray(data.collection)
    ? data.collection.reduce(
        (sum, item) => sum + parseFloat(item.collection_amount || 0),
        0
      )
    : 0;

  const remainingAmount = totalAmount - totalCollected;
  const progressPercentage = Math.min(
    (totalCollected / totalAmount) * 100,
    100
  );

  useEffect(() => {
    if (isOpen && transaction?.budget_id && formattedDate) {
      fetchData(transaction.budget_id, formattedDate);
    }
  }, [isOpen, transaction?.budget_id, formattedDate]);

  const fetchData = async (budgetId, date) => {
    try {
      setLoading(true);
      const res = await getCollection(budgetId, date);
      setData(res || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amountPaid || !paymentMethod || parseFloat(amountPaid) <= 0) {
      toast.error(
        'Veuillez entrer un montant et un moyen de paiement valides.'
      );
      return;
    }

    if (parseFloat(amountPaid) > remainingAmount) {
      toast.error(
        `Le montant ne peut pas dépasser ${remainingAmount.toFixed(
          2
        )} ${currency}`
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await saveCollection({
        budget_id: transaction.budget_id,
        collection_amount: parseFloat(amountPaid),
        bank_account_id: paymentMethod,
        collection_date: formattedDate,
      });

      toast.success(res.message || 'Encaissement effectué avec succès !');

      await new Promise((resolve) => setTimeout(resolve, 800));
      onClose();

      // Réinitialiser le formulaire
      setAmountPaid('');
      setPaymentMethod('');
    } catch (error) {
      console.error("Erreur lors de l'encaissement:", error);
      toast.error("Erreur lors de l'encaissement. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmountPaid('');
    setPaymentMethod('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
          >
            {/* En-tête */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Encaissement</h3>
                  <p className="text-gray-300 text-sm mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {displayDate}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="p-2 hover:bg-white hover:bg-opacity-10 rounded-xl transition-all duration-200 disabled:opacity-30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des données...</p>
                </div>
              ) : (
                <>
                  {/* Infos transaction */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="text-center mb-4">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {transaction?.thirdParty || 'Transaction'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm border">
                        <div className="text-sm text-gray-600 mb-1">Total</div>
                        <div className="font-bold text-gray-900 text-lg">
                          {totalAmount.toFixed(2)} €
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border">
                        <div className="text-sm text-gray-600 mb-1">Payé</div>
                        <div className="font-bold text-green-600 text-lg">
                          {totalCollected.toFixed(2)} €
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border">
                        <div className="text-sm text-gray-600 mb-1">Reste</div>
                        <div
                          className={`font-bold text-lg ${
                            remainingAmount > 0
                              ? 'text-orange-600'
                              : 'text-green-600'
                          }`}
                        >
                          {remainingAmount.toFixed(2)} €
                        </div>
                      </div>
                    </div>

                    {/* Barre de progression en bas des montants */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">
                          Progression de l'encaissement
                        </span>
                        <span className="font-semibold text-gray-800">
                          {progressPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full shadow-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Formulaire */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Montant avec devise inline */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Montant à encaisser
                      </label>
                      <div className="flex gap-3">
                        {/* Champ montant - 2/3 de la largeur */}
                        <div className="relative flex-[2]">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={remainingAmount}
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 bg-white text-lg font-semibold h-full"
                            placeholder="0.00"
                            required
                            disabled={submitting || remainingAmount === 0}
                          />
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                            <Cash />
                          </div>
                        </div>

                        {/* Div devise - 1/3 de la largeur */}
                        <div className="flex-1">
                          <div className="w-full h-full px-3 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center font-semibold text-gray-700 text-lg">
                            {currency}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-1">
                        Maximum: {remainingAmount.toFixed(2)} {currency}
                      </p>
                    </div>

                    {/* Méthode de paiement - Select */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Moyen de paiement
                      </label>
                      <div className="relative">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 bg-white appearance-none"
                          required
                          disabled={submitting}
                        >
                          <option value="">
                            Sélectionner un moyen de paiement
                          </option>
                          {data.bankAccounts?.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Pied de page */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold hover:shadow-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={
                    !amountPaid ||
                    !paymentMethod ||
                    submitting ||
                    remainingAmount === 0
                  }
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Encaisser
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
