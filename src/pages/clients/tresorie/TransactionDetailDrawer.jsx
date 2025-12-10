import React, { useMemo } from 'react';
import { X, Calendar, Wallet, User, Building } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatting.js';

const TransactionDetailDrawer = ({
  isOpen = false,
  onClose = () => {},
  transactions = [],
  title = '',
  currency = 'EUR',
  period = null,
  dataState = {},
  projects = [],
  activeProject = null,
}) => {
  // Utilisation de dataState depuis les props
  const { allCashAccounts = {}, settings = {} } = dataState;

  const accountNameMap = useMemo(() => {
    const map = new Map();
    Object.values(allCashAccounts).forEach(accountGroup => {
      if (Array.isArray(accountGroup)) {
        accountGroup.forEach(account => {
          if (account && account.id && account.name) {
            map.set(account.id, account.name);
          }
        });
      }
    });
    return map;
  }, [allCashAccounts]);

  // Mapper les projets par ID pour un accès rapide
  const projectMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(projects)) {
      projects.forEach(project => {
        if (project && project.id) {
          map.set(project.id, project);
        }
      });
    }
    // Ajouter le projet actif s'il n'est pas déjà dans la liste
    if (activeProject && activeProject.id) {
      map.set(activeProject.id, activeProject);
    }
    return map;
  }, [projects, activeProject]);

  // Obtenir le nom du projet avec priorité
  const getProjectName = (transaction) => {
    // Essayer dans l'ordre: transaction.project_name, transaction.projectName, 
    // chercher dans projectMap par project_id
    if (transaction.project_name) return transaction.project_name;
    if (transaction.projectName) return transaction.projectName;
    if (transaction.project_id) {
      const project = projectMap.get(transaction.project_id);
      return project?.name || `Projet ${transaction.project_id}`;
    }
    // Fallback sur le projet actif
    return activeProject?.name || 'Projet non spécifié';
  };

  // Obtenir la description du projet
  const getProjectDescription = (transaction) => {
    if (transaction.project_id) {
      const project = projectMap.get(transaction.project_id);
      return project?.description || '';
    }
    return activeProject?.description || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Date invalide';
    }
  };

  const getCashAccountName = (accountId) => {
    return accountNameMap.get(accountId) || accountId || 'N/A';
  };

  const totalAmount = useMemo(() => {
    return transactions.reduce((sum, transaction) => {
      const amount = parseFloat(transaction.paidAmount) || 0;
      return sum + amount;
    }, 0);
  }, [transactions]);

  const currencySettings = useMemo(() => ({
    currency: currency,
    displayUnit: 'standard',
    decimalPlaces: 2,
    ...settings,
  }), [currency, settings]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 transition-opacity duration-300 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      <div 
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* En-tête amélioré avec projet */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800">{title}</h2>                
                {period && (
                  <p className="mt-1 text-sm text-gray-500">
                    Période: {period.label}
                  </p>
                )}
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-gray-500 transition-colors duration-200 rounded-full hover:bg-gray-100"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Calendar className="w-12 h-12 mb-4 text-gray-300" />
                <p className="mb-2 text-lg font-medium">Aucune transaction</p>
                <p className="text-sm text-center">
                  Aucune transaction trouvée pour cette sélection.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction, index) => {
                  const amount = parseFloat(transaction.paidAmount) || 0;
                  const isPositive = amount >= 0;
                  const isRevenue = transaction.type === 'receivable' || transaction.flowType === 'entree' || transaction.type === 'entree';
                  const projectName = getProjectName(transaction);
                  
                  return (
                    <div 
                      key={transaction.id || `transaction-${index}`}
                      className="p-4 transition-shadow duration-200 bg-white border border-gray-200 rounded-lg hover:shadow-sm"
                    >
                      {/* Ligne 1: Montant et type */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              isRevenue ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          ></div>
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <Building className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {projectName}
                              </h3>
                              {transaction.entryName && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {transaction.entryName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${
                          isRevenue ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(amount, currencySettings)}
                        </div>
                      </div>
                      
                      {/* Ligne 2: Tiers */}
                      {transaction.thirdParty && transaction.thirdParty !== 'Non spécifié' && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                          <User className="flex-shrink-0 w-4 h-4 text-gray-400" />
                          <span>Tiers: {transaction.thirdParty}</span>
                        </div>
                      )}

                      {/* Ligne 3: Détails */}
                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                        {/* Date */}
                        <div className="flex items-center gap-2">
                          <Calendar className="flex-shrink-0 w-4 h-4 text-gray-400" />
                          <span>Payé le: {formatDate(transaction.paymentDate || transaction.date)}</span>
                        </div>

                        {/* Compte */}
                        {transaction.cashAccount && transaction.cashAccount !== 'default' && (
                          <div className="flex items-center gap-2">
                            <Wallet className="flex-shrink-0 w-4 h-4 text-gray-400" />
                            <span>Compte: {getCashAccountName(transaction.cashAccount)}</span>
                          </div>
                        )}

                        {/* Catégorie */}
                        {transaction.category && transaction.category !== 'Non catégorisé' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 w-4 h-4"></div>
                            <span>Catégorie: {transaction.category}</span>
                          </div>
                        )}

                        {/* Catégorie principale */}
                        {transaction.mainCategory && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 w-4 h-4"></div>
                            <span>Catégorie principale: {transaction.mainCategory}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pied de page avec résumé par projet */}
          {transactions.length > 0 && (
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="mb-3">
                <h3 className="mb-2 font-semibold text-gray-800">Résumé par projet</h3>
                <div className="space-y-1 text-sm">
                  {/* Grouper les transactions par projet */}
                  {Object.entries(
                    transactions.reduce((acc, transaction) => {
                      const projectName = getProjectName(transaction);
                      if (!acc[projectName]) {
                        acc[projectName] = { total: 0, count: 0 };
                      }
                      acc[projectName].total += parseFloat(transaction.paidAmount) || 0;
                      acc[projectName].count += 1;
                      return acc;
                    }, {})
                  ).map(([projectName, data]) => (
                    <div key={projectName} className="flex items-center justify-between py-1">
                      <span className="text-gray-600">{projectName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">({data.count} trans.)</span>
                        <span className={`font-medium ${
                          data.total >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(data.total, currencySettings)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="font-semibold text-gray-800">
                    Total général ({transactions.length} transaction{transactions.length > 1 ? 's' : ''})
                  </span>
                  {period && (
                    <p className="mt-1 text-sm text-gray-500">
                      Période: {period.label}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className={`font-bold text-xl ${
                    totalAmount >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(totalAmount, currencySettings)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {totalAmount >= 0 ? 'Entrées nettes' : 'Sorties nettes'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TransactionDetailDrawer;