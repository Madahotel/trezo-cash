import React, { useMemo } from 'react';
import { X, Calendar, Wallet, User } from 'lucide-react';

// Fonction utilitaire simulée pour le formatage de la devise
// En réalité, vous devriez importer la vôtre: import { formatCurrency } from '../../../utils/formatting';
const formatCurrency = (amount, settings) => {
  const currencySymbol = settings?.currency || '$';
  return `${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${currencySymbol}`;
};

// Données statiques pour la simulation
const STATIC_DATA_SIMULATION = {
  dataState: {
    allCashAccounts: {
      accountGroup1: [
        { id: 'acc1', name: 'Compte Bancaire Principal' },
        { id: 'acc2', name: 'Caisse' },
      ],
      accountGroup2: [
        { id: 'acc3', name: 'Épargne' },
      ],
    },
    settings: {
      // Paramètres de devise simulés
      locale: 'fr-FR',
      decimalSeparator: ',',
      thousandSeparator: ' ',
    },
  },
  transactions: [
    {
      id: 'tx1',
      thirdParty: 'Client A',
      paidAmount: 1500.50,
      paymentDate: '2025-09-28T10:00:00Z',
      cashAccount: 'acc1',
      type: 'receivable', // Ex: Entrée
    },
    {
      id: 'tx2',
      thirdParty: 'Fournisseur B',
      paidAmount: -450.75,
      paymentDate: '2025-09-29T14:30:00Z',
      cashAccount: 'acc2',
      type: 'payable', // Ex: Sortie
    },
    {
      id: 'tx3',
      thirdParty: 'Client C',
      paidAmount: 89.99,
      paymentDate: '2025-09-30T09:00:00Z',
      cashAccount: 'acc3',
      type: 'receivable',
    },
  ],
  title: "Transactions du Jour (Statique)",
  currency: 'EUR',
};

const TransactionDetailDrawer = ({
  isOpen = true, // Force à true pour voir le contenu statique
  onClose = () => console.log('Close action (static)'), // Fonction factice
  transactions = STATIC_DATA_SIMULATION.transactions, // Données statiques
  title = STATIC_DATA_SIMULATION.title, // Titre statique
  currency = STATIC_DATA_SIMULATION.currency, // Devise statique
  // Ajout des données de dataState ici pour la simulation statique
  dataState = STATIC_DATA_SIMULATION.dataState,
}) => {

  // Vos logiques restent inchangées, mais utilisent les données statiques/par défaut

  // Déstructuration de dataState avec des valeurs par défaut pour être robuste
  const { allCashAccounts = {}, settings = {} } = dataState;

  const accountNameMap = useMemo(() => {
    const map = new Map();
    // Utilisation des valeurs par défaut pour éviter les erreurs si allCashAccounts est vide
    Object.values(allCashAccounts).flat().forEach(account => {
      map.set(account.id, account.name);
    });
    return map;
  }, [allCashAccounts]);

  // Rendu conditionnel basé sur la prop (statique ici)
  if (!isOpen) return null;

  // Fonctions de formatage et de récupération
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR');
  const getCashAccountName = (accountId) => accountNameMap.get(accountId) || accountId || 'N/A';
  const totalAmount = transactions.reduce((sum, t) => sum + t.paidAmount, 0);
  const currencySettings = { ...settings, currency };

  return (
    <>
      {/* Overlay: Utilise une classe 'bg-opacity-60' statique pour que le fond s'affiche si isOpen=true */}
      <div className={`fixed inset-0 bg-black z-40 bg-opacity-60`} onClick={onClose}></div>

      {/* Drawer: Utilise 'translate-x-0' statique pour qu'il soit visible si isOpen=true */}
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 transform translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* En-tête du tiroir */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenu des transactions */}
          <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
            {transactions.length === 0 ? (
              <p className="text-gray-500">Aucune transaction pour cette sélection.</p>
            ) : (
              <ul className="space-y-3">
                {transactions.map(tx => (
                  <li key={tx.id} className="p-3 bg-white rounded-lg border flex">
                    {/* Indicateur de type (receivable/payable) */}
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-3 flex-shrink-0 ${tx.type === 'receivable' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="flex-grow">
                      {/* Ligne 1: Tiers et Montant */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          {tx.thirdParty}
                        </div>
                        <div className="font-bold text-lg text-blue-600">
                          {formatCurrency(tx.paidAmount, currencySettings)}
                        </div>
                      </div>
                      {/* Ligne 2: Date et Compte */}
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Payé le: {formatDate(tx.paymentDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-gray-400" />
                          <span>Compte: {getCashAccountName(tx.cashAccount)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pied de page avec le total */}
          <div className="p-4 border-t bg-gray-100">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">Total Réel</span>
              <span className="font-bold text-xl text-blue-700">
                {formatCurrency(totalAmount, currencySettings)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransactionDetailDrawer;