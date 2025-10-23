import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/formatting.js';
import {
  Wallet,
  TrendingDown,
  HandCoins,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Lock,
  PiggyBank,
  Banknote,
  Coins,
  ListChecks,
  Calendar,
  PieChart,
  Layers,
  Table,
  AlertTriangle,
  Settings,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import TrezoScoreWidget from './TrezoScoreWidget';
import CurrentMonthBudgetWidget from './CurrentMonthBudgetWidget';
import ThirtyDayForecastWidget from './ThirtyDayForecastWidget';
import LoansSummaryWidget from './LoansSummaryWidget';
import { useNavigate } from 'react-router-dom';
import ActionCard from './ActionCard';
import IntelligentAlertWidget from './IntelligentAlertWidget';
import AmbassadorWidget from './AmbassadorWidget';
import DashboardSettingsDrawer from '../../../components/drawer/DashboardSettingsDrawer';
import { useMobile } from '../../../hooks/useMobile.js';
import { useData } from '../../../components/context/DataContext';
import { useUI } from '../../../components/context/UIContext';
import axios from '../../../components/config/Axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../components/context/AuthContext';
import { link } from 'framer-motion/client';

const DashboardProject = () => {
  const navigate = useNavigate();
  const { dataState } = useData();
  const { uiState } = useUI();
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [widgetVisibility, setWidgetVisibility] = useState(defaultWidgetSettings);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useMobile();

  const activeProject = uiState.activeProject;
  const projectId = activeProject?.id;

  const { user, token } = useAuth();
  const { profile, projects, consolidatedViews } = dataState;

  // Charger les données du dashboard
  useEffect(() => {
    if (projectId) {
      fetchDashboardData();
    }
  }, [projectId]);

  const fetchDashboardData = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await axios.get(`/projects/${projectId}/dashboard`);
      setDashboardData(response.data.dashboard_data);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleOpenSettings = () => {
    setIsSettingsDrawerOpen(true);
  };

  const handleSaveSettings = (newSettings) => {
    setWidgetVisibility(newSettings);
    toast.success('Préférences sauvegardées');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
  };

  // États de chargement améliorés
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-400 rounded-full animate-spin absolute top-4 left-1/2 -translate-x-1/2"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chargement du tableau de bord</h3>
          <p className="text-gray-600">Préparation de vos données financières...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Données indisponibles</h3>
          <p className="text-gray-600 mb-6">Aucune donnée disponible pour ce projet pour le moment.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Réessayer
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Retour aux projets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    kpis,
    overdue_items,
    loans,
    current_month_budget,
    thirty_day_forecast,
    trezo_score
  } = dashboardData;

  const settings = {
    currency: 'EUR',
    displayUnit: 'k',
    decimalPlaces: 0,
  };

  const greetingMessage = () => {
    const hour = new Date().getHours();
    const name = profile?.fullName?.split(' ')[0] || user?.name || 'Utilisateur';
    if (hour < 12) return `Bonjour ${name}`;
    if (hour < 18) return `Bon après-midi ${name}`;
    return `Bonsoir ${name}`;
  };

const kpiCards = [
  {
    id: 'kpi_actionable_balance',
    icon: Wallet,
    color: 'emerald',
    label: 'Trésorerie Actionnable',
    value: kpis.actionable_balance,
    trend: 'positive',
    description: 'Fonds immédiatement disponibles',
    gradient: 'from-emerald-50 to-green-50',
    borderColor: 'border-emerald-200',
    link: '/cash-flow', // Lien vers la page de trésorerie
    external: false,
  },
  {
    id: 'kpi_overdue_payables',
    icon: TrendingDown,
    color: 'red',
    label: 'Dettes en Retard',
    value: kpis.overdue_payables,
    trend: 'negative',
    description: 'Paiements fournisseurs en attente',
    gradient: 'from-red-50 to-rose-50',
    borderColor: 'border-red-200',
    link: '/payables?filter=overdue', // Lien avec filtre
    external: false,
  },
  {
    id: 'kpi_overdue_receivables',
    icon: HandCoins,
    color: 'amber',
    label: 'Créances en Retard',
    value: kpis.overdue_receivables,
    trend: 'warning',
    description: 'Paiements clients en attente',
    gradient: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
    link: '/receivables?status=overdue',
    external: false,
  },
  {
    id: 'kpi_savings',
    icon: PiggyBank,
    color: 'teal',
    label: 'Épargne',
    value: kpis.savings,
    trend: 'positive',
    description: 'Réserves financières',
    gradient: 'from-teal-50 to-cyan-50',
    borderColor: 'border-teal-200',
    link: '/savings',
    external: false,
  },
  {
    id: 'kpi_provisions',
    icon: Lock,
    color: 'indigo',
    label: 'Provisions',
    value: kpis.provisions,
    trend: 'neutral',
    description: 'Fonds réservés',
    gradient: 'from-indigo-50 to-violet-50',
    borderColor: 'border-indigo-200',
    link: '/provisions',
    external: false,
  },
  {
    id: 'kpi_borrowings',
    icon: Banknote,
    color: 'red',
    label: 'Emprunts à rembourser',
    value: kpis.borrowings,
    trend: 'negative',
    description: 'Dettes à court terme',
    gradient: 'from-red-50 to-pink-50',
    borderColor: 'border-red-200',
    link: '/loans?type=borrowing',
    external: false,
  },
  {
    id: 'kpi_lendings',
    icon: Coins,
    color: 'emerald',
    label: 'Prêts à recevoir',
    value: kpis.lendings,
    trend: 'positive',
    description: 'Créances à court terme',
    gradient: 'from-emerald-50 to-green-50',
    borderColor: 'border-emerald-200',
    link: '/loans?type=lending',
    external: false,
  },
];
  const getTrendIcon = (trend) => {
    const baseClasses = "w-4 h-4";
    switch (trend) {
      case 'positive':
        return <ArrowUp className={`${baseClasses} text-emerald-600`} />;
      case 'negative':
        return <ArrowDown className={`${baseClasses} text-red-600`} />;
      default:
        return <div className={`${baseClasses} text-gray-400`}>—</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Header Principal */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {greetingMessage()} !
                </h1>
                <p className="text-gray-600 text-sm">
                  {activeProject?.name} • Tableau de bord financier
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg ${
                  isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                }`}
                title="Actualiser les données"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleOpenSettings}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded-lg"
                title="Personnaliser le tableau de bord"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <div className="w-px h-6 bg-gray-300"></div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Solde disponible</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {formatCurrency(kpis.actionable_balance, settings)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Section KPIs - Grille responsive améliorée */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Indicateurs Clés</h2>
            <span className="text-sm text-gray-500">
              {kpiCards.filter(kpi => widgetVisibility[kpi.id]).length} indicateurs visibles
            </span>
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kpiCards.map((kpi) =>
            widgetVisibility[kpi.id] && (
              // Remplacer la div par un lien si un lien est défini
              kpi.link ? (
                <a
                  key={kpi.id}
                  href={kpi.link}
                  className={`bg-white rounded-xl border ${kpi.borderColor} p-4 hover:shadow-md transition-all duration-200 group cursor-pointer block no-underline hover:no-underline`}
                  onClick={(e) => {
                    // Pour les liens internes, utilisez navigate pour une SPA
                    if (kpi.link.startsWith('/')) {
                      e.preventDefault();
                      navigate(kpi.link);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.gradient}`}>
                      <kpi.icon className={`w-5 h-5 text-${kpi.color}-600`} />
                    </div>
                    {getTrendIcon(kpi.trend)}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 line-clamp-1">
                      {kpi.label}
                    </p>
                    <p className={`text-2xl font-bold text-${kpi.color}-600 truncate`}>
                      {formatCurrency(kpi.value, settings)}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {kpi.description}
                    </p>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Dernière mise à jour</span>
                      <span className="text-blue-600 group-hover:text-blue-800 transition-colors">
                        Voir détails →
                      </span>
                    </div>
                  </div>
                </a>
              ) : (
                // Garder la div originale si pas de lien
                <div
                  key={kpi.id}
                  className={`bg-white rounded-xl border ${kpi.borderColor} p-4 hover:shadow-md transition-all duration-200 group cursor-pointer`}
                >
                  {/* Contenu identique */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.gradient}`}>
                      <kpi.icon className={`w-5 h-5 text-${kpi.color}-600`} />
                    </div>
                    {getTrendIcon(kpi.trend)}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 line-clamp-1">
                      {kpi.label}
                    </p>
                    <p className={`text-2xl font-bold text-${kpi.color}-600 truncate`}>
                      {formatCurrency(kpi.value, settings)}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {kpi.description}
                    </p>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Dernière mise à jour</span>
                      <span>Maintenant</span>
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
        </section>

        {/* Section Widgets Principaux */}
        <section className="space-y-6">
          {/* Layout principal responsive */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Colonne de gauche - Widgets larges */}
            <div className="xl:col-span-2 space-y-6">
              {/* Score Trezo */}
              {widgetVisibility.trezo_score && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <TrezoScoreWidget scoreData={trezo_score} />
                </div>
              )}

              {/* Prévisions 30 jours */}
              {widgetVisibility['30_day_forecast'] && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <ThirtyDayForecastWidget forecastData={thirty_day_forecast} />
                </div>
              )}

              {/* Prêts et Emprunts */}
              {widgetVisibility.loans && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <LoansSummaryWidget
                      title="Mes Emprunts"
                      icon={Banknote}
                      loans={loans.borrowings}
                      currencySettings={settings}
                      type="borrowing"
                    />
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <LoansSummaryWidget
                      title="Mes Prêts Accordés"
                      icon={Coins}
                      loans={loans.lendings}
                      currencySettings={settings}
                      type="lending"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Colonne de droite - Widgets étroits */}
            <div className="space-y-6">
              {/* Budget du mois */}
              {widgetVisibility.monthly_budget && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <CurrentMonthBudgetWidget budgetData={current_month_budget} />
                </div>
              )}

              {/* Actions prioritaires */}
              {widgetVisibility.priorities && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </div>
                      Actions Prioritaires
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      overdue_items.length > 0 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {overdue_items.length} en attente
                    </span>
                  </div>

                  {overdue_items.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                      {overdue_items.map((item, index) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                item.type === 'payable' ? 'bg-red-50' : 'bg-emerald-50'
                              }`}>
                                {item.type === 'payable' ? (
                                  <ArrowDown className="w-4 h-4 text-red-600" />
                                ) : (
                                  <ArrowUp className="w-4 h-4 text-emerald-600" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                  {item.third_party}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-500">
                                    {new Date(item.due_date).toLocaleDateString('fr-FR')}
                                  </span>
                                  <span className="text-xs text-red-600 font-medium">
                                    {Math.floor(
                                      (new Date() - new Date(item.due_date)) / (1000 * 60 * 60 * 24)
                                    )}j de retard
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right flex-shrink-0 ml-3">
                              <p className={`text-sm font-semibold ${
                                item.type === 'payable' ? 'text-red-600' : 'text-emerald-600'
                              }`}>
                                {formatCurrency(item.remaining_amount, settings)}
                              </p>
                              <button className="text-xs text-blue-600 hover:text-blue-800 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Traiter
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle className="w-8 h-8 text-emerald-600" />
                      </div>
                      <p className="text-gray-900 font-medium mb-1">Aucune action prioritaire</p>
                      <p className="text-gray-600 text-sm">Toutes les échéances sont à jour</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Drawer des paramètres */}
      <DashboardSettingsDrawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        initialWidgetSettings={widgetVisibility}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

const defaultWidgetSettings = {
  kpi_actionable_balance: true,
  kpi_overdue_payables: true,
  kpi_overdue_receivables: true,
  kpi_savings: true,
  kpi_provisions: true,
  kpi_borrowings: true,
  kpi_lendings: true,
  alerts: true,
  priorities: true,
  trezo_score: true,
  '30_day_forecast': true,
  monthly_budget: true,
  loans: true,
  ambassador_promo: true,
  actions: true,
  tutorials: true,
};

export default DashboardProject;