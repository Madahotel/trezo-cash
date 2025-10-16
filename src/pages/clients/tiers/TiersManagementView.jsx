
import React, { useState, useMemo, useEffect } from 'react';
import { Users, UserPlus, Edit, Trash2, Save, X, Plus, Search, Banknote, CreditCard } from 'lucide-react';
import { useData } from '../../../components/context/DataContext';
import { useUI } from '../../../components/context/UIContext';
import { formatCurrency, formatPaymentTerms } from '../../../utils/formatting';
import EmptyState from '../../../components/emptystate/EmptyState';

const TiersManagementView = ({ onOpenPaymentTerms }) => {
  const { dataState, dataDispatch } = useData();
  const { uiDispatch } = useUI();
  const { tiers, allEntries, allActuals, settings, loans } = dataState;

  const [newTierName, setNewTierName] = useState('');
  const [newTierType, setNewTierType] = useState('fournisseur');
  const [editingTier, setEditingTier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (tiers.length === 0) {
      const staticTiers = [
        { name: 'Abonnement Internet', type: 'fournisseur', payment_terms: 60 },
        { name: 'Assurance Habitation', type: 'fournisseur', payment_terms: 90 },
        { name: 'Salaire Principal', type: 'fournisseur', payment_terms: 45 },
        { name: 'Formation', type: 'client', payment_terms: 30 },
        { name: 'Ventes', type: 'client', payment_terms: 45 },
      ];
      staticTiers.forEach(tierData => {
        dataDispatch({ type: 'ADD_TIER', payload: tierData });
      });
    }
  }, [tiers.length, dataDispatch]);

  const mockUnpaid = useMemo(() => ({
    'Abonnement Internet': 12500,
    'Assurance Habitation': 23450,
    'Salaire Principal': 178900,
    'Formation': 45600,
    'Ventes': 123450,
  }), []);

  const handleTierClick = (tier) => {
    const targetView = tier.type === 'fournisseur' ? 'payables' : 'receivables';
    uiDispatch({ type: 'SET_ACTUALS_SEARCH_TERM', payload: tier.name });
    uiDispatch({ type: 'SET_CURRENT_VIEW', payload: targetView });
    uiDispatch({ type: 'SET_ACTIVE_SETTINGS_DRAWER', payload: null });
  };

  const handleAddTier = (e) => {
    e.preventDefault();
    if (newTierName.trim()) {
      dataDispatch({ type: 'ADD_TIER', payload: { name: newTierName.trim(), type: newTierType } });
      setNewTierName('');
    }
  };
  const handleStartEdit = (tier) => setEditingTier({ ...tier });
  const handleCancelEdit = () => setEditingTier(null);
  const handleSaveEdit = () => {
    if (editingTier.name.trim()) {
      dataDispatch({ type: 'UPDATE_TIER', payload: { tierId: editingTier.id, newName: editingTier.name.trim() } });
      handleCancelEdit();
    }
  };
  
  const isTierUsed = (tierName) => {
    const entries = Object.values(allEntries).flat() || [];
    const actuals = Object.values(allActuals).flat() || [];
    return entries.some(e => e.supplier === tierName) || actuals.some(a => a.thirdParty === tierName);
  };

  const handleDeleteTier = (tierId) => {
    const tierToDelete = tiers.find(t => t.id === tierId);
    if (!tierToDelete) return;

    if (isTierUsed(tierToDelete.name)) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: `Suppression impossible: le tiers "${tierToDelete.name}" est utilisé.`, type: 'error' } });
      return;
    }

    uiDispatch({
      type: 'OPEN_CONFIRMATION_MODAL',
      payload: {
        title: `Supprimer "${tierToDelete.name}" ?`,
        message: 'Cette action est irréversible.',
        onConfirm: () => dataDispatch({ type: 'DELETE_TIER', payload: tierId }),
      }
    });
  };

  const calculateUnpaidAmount = (tierName) => {
    if (mockUnpaid[tierName]) {
      return mockUnpaid[tierName];
    }
    const unpaidStatuses = ['pending', 'partially_paid', 'partially_received'];
    
    const totalUnpaid = Object.values(allActuals)
        .flat()
        .filter(actual => 
            actual.thirdParty === tierName && 
            unpaidStatuses.includes(actual.status)
        )
        .reduce((sum, actual) => {
            const totalPaid = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
            const remaining = actual.amount - totalPaid;
            return sum + (remaining > 0 ? remaining : 0);
        }, 0);

    return totalUnpaid;
  };

  const financialTiers = useMemo(() => {
    const staticFinancialTiers = [
      { name: 'BNI Madagascar', type: 'financial', unpaid: 523000 },
      { name: 'BRED', type: 'financial', unpaid: 245600 },
      { name: 'BOA', type: 'financial', unpaid: 378900 },
    ].filter(tier => tier.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return staticFinancialTiers;
  }, [searchTerm]);

  const renderTiersList = (type, title) => {
    const filteredTiers = tiers
      .filter(t => t.type === type && t.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
      
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        {filteredTiers.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-200">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th scope="col" className="py-2 text-left font-medium text-gray-500 whitespace-nowrap">Nom</th>
                            <th scope="col" className="py-2 text-right font-medium text-gray-500 whitespace-nowrap">Impayés</th>
                            <th scope="col" className="py-2 text-left font-medium text-gray-500 pl-4 whitespace-nowrap">Délai de paiement</th>
                            <th scope="col" className="py-2 text-right font-medium text-gray-500 w-32 whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {filteredTiers.map(tier => {
                        const unpaidAmount = calculateUnpaidAmount(tier.name);
                        return (
                            <tr key={tier.id} className="group border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                                <td className="py-3 whitespace-nowrap">
                                    {editingTier?.id === tier.id ? (
                                        <input 
                                            type="text" 
                                            value={editingTier.name} 
                                            onChange={(e) => setEditingTier(prev => ({...prev, name: e.target.value}))} 
                                            className="w-full px-2 py-1 border border-gray-200 rounded-md text-sm text-gray-900" 
                                            autoFocus
                                        />
                                    ) : (
                                        <button onClick={() => handleTierClick(tier)} className="text-gray-800 text-left hover:underline hover:text-blue-600 transition-colors">
                                            {tier.name}
                                        </button>
                                    )}
                                </td>
                                <td className={`py-3 text-right font-semibold ${unpaidAmount > 0 ? (type === 'fournisseur' ? 'text-red-600' : 'text-yellow-600') : 'text-gray-500'} whitespace-nowrap`}>
                                    {unpaidAmount > 0 ? formatCurrency(unpaidAmount, settings) : '-'}
                                </td>
                                <td className="py-3 pl-4 text-gray-500 text-xs whitespace-nowrap">
                                    {formatPaymentTerms(tier.payment_terms)}
                                </td>
                                <td className="py-3 text-right whitespace-nowrap">
                                    {editingTier?.id === tier.id ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button>
                                            <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onOpenPaymentTerms(tier)} className="p-1 text-gray-500 hover:text-purple-600" title="Définir les conditions de paiement"><CreditCard className="w-4 h-4" /></button>
                                            <button onClick={() => handleStartEdit(tier)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteTier(tier.id)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed" title={isTierUsed(tier.name) ? "Suppression impossible: tiers utilisé" : "Supprimer"}><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        ) : (
          <EmptyState
            icon={Users}
            title={searchTerm ? 'Aucun tiers trouvé' : 'Aucun tiers de ce type'}
            message={searchTerm ? "Essayez d'affiner votre recherche." : "Ajoutez un nouveau client ou fournisseur pour commencer."}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
        <h2 className="text-black font-semibold mb-3 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" /> Ajouter un nouveau tiers commercial</h2>
        <form onSubmit={handleAddTier} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-grow">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom du Tiers</label>
                <input type="text" value={newTierName} onChange={(e) => setNewTierName(e.target.value)} placeholder="Ex: Client A, Fournisseur B..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white" required />
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto">
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select value={newTierType} onChange={(e) => setNewTierType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white">
                    <option value="fournisseur">Fournisseur</option>
                    <option value="client">Client</option>
                </select>
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
                <Plus className="w-4 h-4" /> Ajouter
            </button>
        </form>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300 space-y-4">
        <div className="relative">
          <label htmlFor="search-tier" className="sr-only">Rechercher un tiers</label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id="search-tier"
            name="search-tier"
            className="block w-full rounded-md border-gray-300 py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Rechercher un tiers..."
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <hr className="border-gray-200" />
        {renderTiersList('fournisseur', 'Fournisseurs')}
        <hr className="border-gray-200" />
        {renderTiersList('client', 'Clients')}
        <hr className="border-gray-200" />
        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Prêteurs / Emprunteurs</h3>
            <div className="overflow-x-auto">
                {financialTiers.length > 0 ? (
                    <table className="min-w-full text-sm divide-y divide-gray-200">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th scope="col" className="py-2 text-left font-medium text-gray-500 whitespace-nowrap">Nom</th>
                                <th scope="col" className="py-2 text-right font-medium text-gray-500 whitespace-nowrap">Impayés</th>
                            </tr>
                        </thead>
                        <tbody>
                            {financialTiers.map(tier => (
                                <tr key={tier.name} className="group border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                                    <td className="py-3 text-gray-800 whitespace-nowrap">{tier.name}</td>
                                    <td className={`py-3 text-right font-semibold ${tier.unpaid > 0 ? 'text-gray-600' : 'text-gray-500'} whitespace-nowrap`}>
                                        {tier.unpaid > 0 ? formatCurrency(tier.unpaid, settings) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                     <EmptyState
                        icon={Banknote}
                        title="Aucun prêteur ou emprunteur"
                        message="Les tiers liés à vos prêts et emprunts apparaîtront ici."
                    />
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TiersManagementView;
