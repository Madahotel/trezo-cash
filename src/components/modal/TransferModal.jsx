import React, { useState, useMemo, useEffect } from 'react';
import { X, ArrowRightLeft, Save } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { formatCurrency } from '../../utils/formatting';

// Données de test aléatoires pour simuler les comptes et projets (à remplacer par les données réelles du contexte)
const mockProjects = [
  { id: 'proj1', name: 'Projet A', isArchived: false, startDate: '2025-01-01' },
  { id: 'proj2', name: 'Projet B', isArchived: false, startDate: '2025-02-01' },
];

const mockAllCashAccounts = {
  proj1: [
    { id: 'acc1', name: 'Compte Bancaire A1', projectId: 'proj1', initialBalance: 5000, isClosed: false },
    { id: 'acc2', name: 'Compte Épargne A2', projectId: 'proj1', initialBalance: 10000, isClosed: false },
  ],
  proj2: [
    { id: 'acc3', name: 'Compte Courant B1', projectId: 'proj2', initialBalance: 3000, isClosed: false },
    { id: 'acc4', name: 'Caisse B2', projectId: 'proj2', initialBalance: 1500, isClosed: true },
  ],
};

const mockAllActuals = {}; // Simulé vide pour les tests, car utilisé pour les soldes

const mockSettings = { currency: 'EUR' };

// Pour les tests : Remplacez les valeurs du contexte par ces mocks
// En production, commentez ces overrides et utilisez les vraies données de useData()

const TransferModal = ({ isOpen, onClose, onSave }) => {
  // Simulation du dataState pour les tests (remplacez par const { dataState } = useData(); en production)
  const dataState = {
    allCashAccounts: mockAllCashAccounts,
    projects: mockProjects,
    allActuals: mockAllActuals,
    settings: mockSettings,
  };
  const { uiDispatch } = useUI();

  const { allCashAccounts, projects, allActuals, settings } = dataState;

  const [formData, setFormData] = useState({
    sourceAccountId: '',
    destinationAccountId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const accountsByProject = useMemo(() => {
    const grouped = [];
    projects.forEach(project => {
      if (!project.isArchived) {
        const projectAccounts = (allCashAccounts[project.id] || []).filter(acc => !acc.isClosed);
        if (projectAccounts.length > 0) {
          grouped.push({
            projectName: project.name,
            accounts: projectAccounts
          });
        }
      }
    });
    return grouped;
  }, [allCashAccounts, projects]);

  const allAccountsFlat = useMemo(() => accountsByProject.flatMap(p => p.accounts), [accountsByProject]);

  const accountBalances = useMemo(() => {
    const balances = new Map();
    const allAccounts = Object.values(allCashAccounts).flat();
    const allActualsFlat = Object.values(allActuals).flat();

    allAccounts.forEach(account => {
        let currentBalance = parseFloat(account.initialBalance) || 0;
        // Simulation de paiements aléatoires pour les soldes de test
        currentBalance += Math.random() * 10000 - 5000; // Ajout d'un delta aléatoire pour les tests
        const accountPayments = allActualsFlat
            .flatMap(actual => (actual.payments || []).filter(p => p.cashAccount === account.id).map(p => ({ ...p, type: actual.type })));
        
        for (const payment of accountPayments) {
            if (payment.type === 'receivable') {
                currentBalance += payment.paidAmount;
            } else if (payment.type === 'payable') {
                currentBalance -= payment.paidAmount;
            }
        }
        balances.set(account.id, currentBalance);
    });
    return balances;
  }, [allCashAccounts, allActuals]);

  useEffect(() => {
    if (isOpen) {
      const firstAccount = allAccountsFlat[0]?.id || '';
      const secondAccount = allAccountsFlat[1]?.id || firstAccount;
      setFormData({
        sourceAccountId: firstAccount,
        destinationAccountId: secondAccount,
        amount: (Math.random() * 1000 + 100).toFixed(2), // Montant aléatoire pour test
        date: new Date().toISOString().split('T')[0],
        description: 'Transfert de test aléatoire', // Description de test
      });
    }
  }, [isOpen, allAccountsFlat]);

  const minDate = useMemo(() => {
    if (!formData.sourceAccountId || !formData.destinationAccountId) return undefined;
    
    const sourceAccount = allAccountsFlat.find(acc => acc.id === formData.sourceAccountId);
    const destAccount = allAccountsFlat.find(acc => acc.id === formData.destinationAccountId);

    const sourceProject = projects.find(p => p.id === sourceAccount?.projectId);
    const destProject = projects.find(p => p.id === destAccount?.projectId);

    if (!sourceProject?.startDate || !destProject?.startDate) return undefined;

    return sourceProject.startDate > destProject.startDate ? sourceProject.startDate : destProject.startDate;

  }, [formData.sourceAccountId, formData.destinationAccountId, allAccountsFlat, projects]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.sourceAccountId || !formData.destinationAccountId || !formData.amount || !formData.date) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Veuillez remplir tous les champs.', type: 'error' } });
      return;
    }
    if (formData.sourceAccountId === formData.destinationAccountId) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Les comptes source et destination doivent être différents.', type: 'error' } });
      return;
    }
    onSave({ ...formData, amount: parseFloat(formData.amount) });
  };

  if (!isOpen) return null;

  const sourceAccountBalance = accountBalances.get(formData.sourceAccountId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-gray-200 border-opacity-50">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 border-opacity-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-purple-600" />
            Effectuer un Transfert Interne
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Compte Source</label>
            <select
              value={formData.sourceAccountId}
              onChange={(e) => setFormData(f => ({ ...f, sourceAccountId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 border-opacity-50 rounded-lg text-base bg-white text-gray-900"
            >
              {accountsByProject.map(projectGroup => (
                <optgroup key={projectGroup.projectName} label={projectGroup.projectName}>
                  {projectGroup.accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{projectGroup.projectName} - {acc.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {formData.sourceAccountId && sourceAccountBalance !== undefined && (
              <div className="text-xs text-gray-500 mt-1 text-right">
                Solde actuel: {formatCurrency(sourceAccountBalance, settings)}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Compte Destination</label>
            <select
              value={formData.destinationAccountId}
              onChange={(e) => setFormData(f => ({ ...f, destinationAccountId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 border-opacity-50 rounded-lg text-base bg-white text-gray-900"
            >
              {accountsByProject.map(projectGroup => (
                <optgroup key={projectGroup.projectName} label={projectGroup.projectName}>
                  {projectGroup.accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{projectGroup.projectName} - {acc.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Montant</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 border-opacity-50 rounded-lg text-base bg-white text-gray-900"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Date du transfert</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 border-opacity-50 rounded-lg text-base bg-white text-gray-900"
                required
                min={minDate}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description (optionnel)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 border-opacity-50 rounded-lg text-base bg-white text-gray-900"
              placeholder="Ex: Virement pour épargne"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 border-opacity-50">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium">
              Annuler
            </button>
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
              <Save className="w-4 h-4" /> Effectuer le Transfert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;