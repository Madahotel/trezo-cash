import React, { useEffect, useState } from 'react';
import {
  X,
  Search,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar,
  RotateCcw,
  Filter,
  CalendarDays,
} from 'lucide-react';
import { apiGet } from '../../../components/context/actionsMethode';

const TransactionHistoryDrawer = ({ isOpen, onClose, account }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  // Charger les transactions quand le drawer s'ouvre ou que le compte change
  useEffect(() => {
    if (isOpen && account) {
      fetchTransactions();
    }
  }, [isOpen, account]);

  const fetchTransactions = async () => {
    if (!account) return;

    setLoading(true);
    try {
      const res = await apiGet(`/bank-accounts/${account.id}/history-account`);
      setTransactions(res.historyAccount || res || []);
    } catch (error) {
      console.error('TRANSACTION HISTORY ERROR ===> ', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les transactions
  const filteredTransactions = transactions.filter((transaction) => {
    // Utiliser operation_name pour la recherche
    const matchesSearch =
      !searchTerm ||
      transaction.operation_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.sub_category_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Utiliser movement_type_name pour le filtre de type
    const isDebit = transaction.movement_type_name?.toLowerCase() === 'débit';
    const isCredit = transaction.movement_type_name?.toLowerCase() === 'crédit';

    const matchesType =
      filterType === 'all' ||
      (filterType === 'income' && isCredit) ||
      (filterType === 'expense' && isDebit);

    // Formater la date correctement
    const transactionDate = new Date(transaction.operation_date);
    const matchesDate =
      (!dateRange.start || transactionDate >= new Date(dateRange.start)) &&
      (!dateRange.end || transactionDate <= new Date(dateRange.end));

    return matchesSearch && matchesType && matchesDate;
  });

  // Formater la date (seulement la date, sans l'heure)
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';

    try {
      // Gérer les dates avec ou sans timestamp
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        // Supprimer l'heure ici pour n'avoir que la date
      });
    } catch (error) {
      return dateString;
    }
  };

  // Formater le montant
  const formatAmount = (amount, movementType) => {
    const amountNum = parseFloat(amount) || 0;
    const formatted = Math.abs(amountNum).toFixed(2);
    const symbol =
      account?.currency_symbol || transaction?.currency_symbol || '€';

    // Déterminer le signe en fonction du type de mouvement
    const isDebit = movementType?.toLowerCase() === 'débit';
    const sign = isDebit ? '-' : '+';

    return `${sign}${formatted} ${symbol}`;
  };

  // Obtenir la couleur en fonction du type de mouvement
  const getAmountColor = (movementType) => {
    const isDebit = movementType?.toLowerCase() === 'débit';
    return isDebit ? 'text-red-600' : 'text-green-600';
  };

  // Obtenir la classe de fond en fonction du type de mouvement
  const getBackgroundColor = (movementType) => {
    const isDebit = movementType?.toLowerCase() === 'débit';
    return isDebit ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600';
  };

  // Obtenir l'icône en fonction du type de mouvement
  const getIcon = (movementType) => {
    const isDebit = movementType?.toLowerCase() === 'débit';
    return isDebit ? (
      <ArrowDownRight className="w-4 h-4" />
    ) : (
      <ArrowUpRight className="w-4 h-4" />
    );
  };

  // Obtenir le type d'opération affiché
  const getOperationType = (movementType) => {
    const isDebit = movementType?.toLowerCase() === 'débit';
    return isDebit ? 'Dépense' : 'Revenue';
  };

  // Calculer le total
  const calculateTotal = () => {
    return filteredTransactions.reduce((sum, transaction) => {
      const amount = parseFloat(transaction.operation_amount) || 0;
      const isDebit = transaction.movement_type_name?.toLowerCase() === 'débit';
      return isDebit ? sum - amount : sum + amount;
    }, 0);
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setDateRange({ start: '', end: '' });
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = () => {
    return (
      searchTerm || filterType !== 'all' || dateRange.start || dateRange.end
    );
  };

  // Formater la période de date pour l'affichage
  const getDateFilterText = () => {
    if (!dateRange.start && !dateRange.end) return 'Période: Toutes dates';

    const startText = dateRange.start
      ? new Date(dateRange.start).toLocaleDateString('fr-FR')
      : 'Toutes dates';
    const endText = dateRange.end
      ? new Date(dateRange.end).toLocaleDateString('fr-FR')
      : "Aujourd'hui";

    return `Période: ${startText} - ${endText}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-2/3 lg:w-1/2 xl:w-2/5 flex">
        <div className="relative flex-1 flex flex-col bg-white shadow-xl">
          {/* Header */}
          <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Historique des transactions
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">{account?.name}</p>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-800">
                    Solde: {account?.reportedAmount || account?.initial_amount}{' '}
                    {account?.currency_symbol}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Filtres */}
            <div className="mt-4 space-y-3">
              {/* Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une opération..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Section Filtres */}
              <div className="space-y-3">
                {/* En-tête des filtres avec icône */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Filtres
                  </span>
                  {hasActiveFilters() && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                      Actifs
                    </span>
                  )}
                </div>

                {/* Filtres rapides */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes les transactions</option>
                    <option value="income">Revenues uniquement</option>
                    <option value="expense">Dépenses uniquement</option>
                  </select>

                  {/* Filtre par période */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) =>
                            setDateRange((prev) => ({
                              ...prev,
                              start: e.target.value,
                            }))
                          }
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Début"
                        />
                      </div>
                      <span className="flex items-center text-gray-400">à</span>
                      <div className="relative flex-1">
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) =>
                            setDateRange((prev) => ({
                              ...prev,
                              end: e.target.value,
                            }))
                          }
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Fin"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bouton Réinitialiser avec icône */}
                  <button
                    onClick={handleResetFilters}
                    disabled={!hasActiveFilters()}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      hasActiveFilters()
                        ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Réinitialiser
                  </button>
                </div>

                {/* Information sur le filtre de date */}
                {(dateRange.start || dateRange.end) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>{getDateFilterText()}</span>
                    <span className="ml-auto text-xs text-blue-600">
                      {filteredTransactions.length} transaction
                      {filteredTransactions.length !== 1 ? 's' : ''} trouvée
                      {filteredTransactions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="px-4 py-3 sm:px-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total transactions</p>
                <p className="font-semibold">{filteredTransactions.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Solde net</p>
                <p
                  className={`font-semibold ${
                    calculateTotal() >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {calculateTotal().toFixed(2)} {account?.currency_symbol}
                </p>
              </div>
            </div>
          </div>

          {/* Liste des transactions */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="px-4 py-3 sm:px-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${getBackgroundColor(
                            transaction.movement_type_name
                          )}`}
                        >
                          {getIcon(transaction.movement_type_name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">
                              {transaction.operation_name}
                            </p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                              {getOperationType(transaction.movement_type_name)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDate(transaction.operation_date)}
                            </span>
                            {transaction.sub_category_name && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-gray-500">
                                  {transaction.sub_category_name}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            {transaction.project_id && (
                              <span>• Projet # {transaction.project_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${getAmountColor(
                            transaction.movement_type_name
                          )}`}
                        >
                          {formatAmount(
                            transaction.operation_amount,
                            transaction.movement_type_name
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">
                  Aucune transaction trouvée
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {hasActiveFilters()
                    ? 'Essayez de modifier vos critères de recherche'
                    : `Aucune transaction enregistrée pour le compte "${account?.name}"`}
                </p>
                {hasActiveFilters() && (
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Réinitialiser tous les filtres
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 sm:px-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {filteredTransactions.length} transaction
                {filteredTransactions.length !== 1 ? 's' : ''}
              </span>
              <span>
                Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransactionHistoryDrawer;
