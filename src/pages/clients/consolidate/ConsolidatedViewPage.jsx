import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllConsolidations } from '../../../hooks/useAllConsolidations';
import ConsolidatedView from '../../../pages/clients/consolidate/ConsolidatedView';
import { formatCurrency } from '../../../utils/formatting';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const ConsolidatedAllViewPage = () => {
  const navigate = useNavigate();
  const [selectedFrequency, setSelectedFrequency] = useState('tous');
  const [showDebug, setShowDebug] = useState(false);
  
  const { 
    consolidationDetails, 
    stats,
    loading, 
    error, 
    refetch 
  } = useAllConsolidations();

  useEffect(() => {
    if (stats && stats.selectedProjects) {
      console.log('📊 Stats disponibles:', {
        totalProjects: stats.totalProjects,
        totalRevenue: stats.totalRevenue,
        totalExpenses: stats.totalExpenses,
        totalNet: stats.totalNet,
        selectedProjectsCount: stats.selectedProjects.length
      });
      
      stats.selectedProjects.forEach((project, index) => {
        console.log(`📋 Projet ${index + 1}: "${project.name}"`, {
          id: project.id,
          revenue: project.revenue,
          expenses: project.expenses,
          net: project.net,
          budgetCount: project.budgets?.length || 0,
          budgetsWithAmount: project.budgets?.filter(b => b.hasAmount).length || 0
        });
      });
    }
  }, [stats]);

  const handleBack = () => {
    navigate('/client/dashboard');
  };

  const handleRefresh = async () => {
    console.log('🔄 Rafraîchissement des données...');
    await refetch();
  };

  const handleFilterChange = (frequency) => {
    console.log(`🎯 Changement de filtre: ${frequency}`);
    setSelectedFrequency(frequency);
  };

  const formatCurrencyLocal = (amount, currency = 'EUR') => {
    try {
      if (formatCurrency) {
        return formatCurrency(amount, currency);
      }
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
      }).format(amount || 0);
    } catch (error) {
      return `${(amount || 0).toFixed(2)} ${currency}`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-600">Chargement des consolidations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <AlertCircle className="w-12 h-12 mb-4 text-red-600" />
        <h2 className="text-lg font-semibold text-gray-900">Erreur de chargement</h2>
        <p className="mt-2 text-center text-gray-600">{error}</p>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 mt-4 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  const totalBudgetsWithAmount = stats.selectedProjects?.reduce((total, project) => {
    return total + (project.budgets?.filter(b => b.hasAmount).length || 0);
  }, 0) || 0;

  return (
    <div className="min-h-screen p-4 bg-gray-50 md:p-6">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {consolidationDetails?.name || 'Vue Consolidée'}
            </h1>
            <p className="text-gray-600">
              Vue globale de {stats.totalProjects || 0} projets
            </p>
            <div className="mt-1 text-sm text-gray-500">
              <span>{consolidationDetails?.totalConsolidations || 0} consolidations</span>
              {totalBudgetsWithAmount > 0 && (
                <span className="ml-2">• {totalBudgetsWithAmount} budgets avec montant</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Retour
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Actualiser
            </button>
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-3 py-2 text-xs text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200"
              >
                {showDebug ? 'Cacher Debug' : 'Debug'}
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="self-center text-sm text-gray-600">Filtrer par fréquence:</span>
          {['tous', 'ponctuel', 'mensuel', 'journalier', 'hebdomadaire', 'annuel'].map((freq) => (
            <button
              key={freq}
              onClick={() => handleFilterChange(freq)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedFrequency === freq
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
            >
              {freq === 'tous' ? 'Toutes' : freq}
            </button>
          ))}
        </div>

        {stats.totalRevenue > 0 || stats.totalExpenses > 0 ? (
          <div className="p-3 mb-4 bg-white border rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500">Revenus totaux</div>
                <div className="text-sm font-bold text-green-600">
                  {formatCurrencyLocal(stats.totalRevenue, 'EUR')}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Dépenses totales</div>
                <div className="text-sm font-bold text-red-600">
                  {formatCurrencyLocal(stats.totalExpenses, 'EUR')}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Solde net</div>
                <div className={`text-sm font-bold ${stats.totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrencyLocal(stats.totalNet, 'EUR')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 mb-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <p className="text-sm text-yellow-700">
              ℹ️ Aucun budget avec montant trouvé. Les budgets sans montant ne sont pas inclus dans les calculs.
            </p>
          </div>
        )}

        {showDebug && stats && (
          <div className="p-4 mb-4 border border-blue-200 rounded-lg bg-blue-50">
            <h3 className="mb-2 font-bold text-blue-800">Debug Info</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Projets: </span>
                <span className="font-medium">{stats.totalProjects}</span>
              </div>
              <div>
                <span className="text-gray-600">Budgets avec montant: </span>
                <span className="font-medium">{totalBudgetsWithAmount}</span>
              </div>
              <div>
                <span className="text-gray-600">Revenus totaux: </span>
                <span className="font-medium text-green-600">{stats.totalRevenue} €</span>
              </div>
              <div>
                <span className="text-gray-600">Dépenses totales: </span>
                <span className="font-medium text-red-600">{stats.totalExpenses} €</span>
              </div>
              <details className="mt-2">
                <summary className="font-medium text-blue-700 cursor-pointer">
                  Détails des projets
                </summary>
                <div className="mt-2 space-y-2 overflow-y-auto max-h-60">
                  {stats.selectedProjects?.map((project, index) => (
                    <div key={project.id} className="p-2 bg-white border rounded">
                      <div className="font-medium">{index + 1}. {project.name}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Rev: </span>
                          <span className="text-green-600">{project.revenue}€</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Dép: </span>
                          <span className="text-red-600">{project.expenses}€</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Net: </span>
                          <span className={project.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {project.net}€
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {project.budgets?.filter(b => b.hasAmount).length || 0} budgets avec montant
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        )}
      </div>

      <ConsolidatedView
        consolidatedViewData={consolidationDetails}
        data={stats}
        formatCurrency={formatCurrencyLocal}
        selectedFrequency={selectedFrequency}
        onFilterChange={handleFilterChange}
      />

      {stats.totalProjects > 0 && totalBudgetsWithAmount === 0 && (
        <div className="p-4 mt-6 border border-orange-200 rounded-lg bg-orange-50">
          <p className="text-sm text-orange-700">
            ⚠️ Les projets sont listés mais aucun budget avec montant n'a été trouvé. 
            Vérifiez que vos budgets ont bien des montants saisis.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConsolidatedAllViewPage;