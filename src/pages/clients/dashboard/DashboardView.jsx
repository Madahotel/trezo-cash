import React, { useState } from 'react';
import { useData } from '../../../components/context/DataContext';
import { useUI } from '../../../components/context/UIContext';
import { formatCurrency } from '../../../utils/formatting.js';
import { Wallet, TrendingDown, HandCoins, ArrowUp, ArrowDown, BookOpen, Lock, PiggyBank, Banknote, Coins, ListChecks, Calendar, PieChart, Layers, Table, AlertTriangle, Settings } from 'lucide-react';
import { useActiveProjectData, useDashboardKpis, useTrezoScore, useDailyForecast, useLoanSummary } from '../../../utils/selectors.jsx';
import TrezoScoreWidget from './TrezoScoreWidget';
import CurrentMonthBudgetWidget from './CurrentMonthBudgetWidget';
import ThirtyDayForecastWidget from './ThirtyDayForecastWidget';
import LoansSummaryWidget from './LoansSummaryWidget';
import { useNavigate } from 'react-router-dom';
import ActionCard from './ActionCard';
import IntelligentAlertWidget from './IntelligentAlertWidget';
import WidgetIcon from './WidgetIcon';
import AmbassadorWidget from './AmbassadorWidget';
import DashboardSettingsDrawer from '../../../components/drawer/DashboardSettingsDrawer.jsx';

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

const DashboardView = () => {
  const { dataState } = useData();
  const { uiState, uiDispatch } = useUI();
  const { settings, projects, profile } = dataState;
  const navigate = useNavigate();
  
  const { activeProject, isConsolidated } = useActiveProjectData(dataState, uiState);
  const { totalActionableBalance, totalOverduePayables, totalOverdueReceivables, overdueItems, totalSavings, totalProvisions, totalBorrowings, totalLendings } = useDashboardKpis(dataState, uiState);
  const trezoScoreData = useTrezoScore(dataState, uiState);
  const dailyForecastData = useDailyForecast(dataState, uiState, 30);
  const { borrowings, lendings } = useLoanSummary(dataState, uiState);

  const widgetVisibility = { ...defaultWidgetSettings, ...(activeProject?.dashboard_widgets || {}) };

  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);

  const handleOpenSettings = () => {
    setIsSettingsDrawerOpen(true);
  };

  const handleSaveSettings = (newSettings) => {
    console.log('Sauvegarde des paramètres:', newSettings);
    
    if (activeProject && !isConsolidated) {
      // Votre logique de sauvegarde ici
    }
    
    setIsSettingsDrawerOpen(false);
    uiDispatch({ 
      type: 'ADD_TOAST', 
      payload: { 
        message: 'Paramètres sauvegardés avec succès', 
        type: 'success' 
      } 
    });
  };

  const currencySettings = {
    currency: activeProject?.currency || settings.currency,
    displayUnit: activeProject?.display_unit || settings.displayUnit,
    decimalPlaces: activeProject?.decimal_places ?? settings.decimalPlaces
  };

  const handleActionClick = (e, item) => {
    uiDispatch({ type: 'OPEN_TRANSACTION_ACTION_MENU', payload: { x: e.clientX, y: e.clientY, transaction: item } });
  };
  
  const greetingMessage = () => {
    const hour = new Date().getHours();
    const name = profile?.fullName?.split(' ')[0] || 'Utilisateur';
    if (hour < 12) return `Bonjour ${name}`;
    if (hour < 18) return `Bon après-midi ${name}`;
    return `Bonsoir ${name}`;
  }

  const actions = [
    { icon: ListChecks, title: "Saisir votre budget", description: "Définissez vos entrées et sorties prévisionnelles.", path: "/app/budget", colorClass: "bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200", iconColorClass: "text-blue-600" },
    { icon: Table, title: "Voir votre trézo", description: "Voyez la projection de vos entrées et sorties ventilées par mois de cette année.", path: "/app/trezo", colorClass: "bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200", iconColorClass: "text-pink-600" },
    { icon: Calendar, title: "Gérer l'échéancier", description: "Suivez et enregistrez vos paiements et encaissements réels.", path: "/app/echeancier", colorClass: "bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200", iconColorClass: "text-green-600" },
    { icon: PieChart, title: "Analyser vos flux", description: "Comprenez la répartition de vos dépenses et revenus.", path: "/app/analyse", colorClass: "bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200", iconColorClass: "text-yellow-600" },
    { icon: Layers, title: "Ajouter des simulations", description: "Anticipez l'impact de vos décisions avec les scénarios.", path: "/app/scenarios", colorClass: "bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200", iconColorClass: "text-purple-600" },
    { icon: Wallet, title: "Ajuster vos comptes", description: "Consultez et mettez à jour vos soldes de trésorerie.", path: "/app/comptes", colorClass: "bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200", iconColorClass: "text-teal-600" }
  ];

  const tutorials = [
    { id: 'L_jWHffIx5E', title: 'Prise en main de Trezocash' }, { id: '3qHkcs3kG44', title: 'Créer votre premier projet' },
    { id: 'g_t-s23-4U4', title: 'Maîtriser le tableau de trésorerie' }, { id: 'm_u6m3-L0gA', title: 'Utiliser les scénarios pour anticiper' },
    { id: 'a_p5-VvF-sI', title: 'Analyser vos dépenses efficacement' }, { id: 'k-rN9t_g-iA', title: 'Gérer vos comptes de trésorerie' },
    { id: 'r6-p_c-3_sI', title: 'Collaborer en équipe sur un projet' }, { id: 's_k9-t_g-iA', title: 'Comprendre l\'échéancier' },
    { id: 't_g-iA_r6-p', title: 'Créer et utiliser des modèles' }, { id: 'u_sI-k-rN9t', title: 'Gérer les fonds à provisionner' },
    { id: 'v_m3-L0gA_a', title: 'Consolider plusieurs projets' }, { id: 'w_4U4-s23-g', title: 'Personnaliser vos catégories' },
    { id: 'x_g-iA_k-rN', title: 'Suivre vos dettes et prêts' }, { id: 'y_p5-VvF-sI', title: 'Astuces pour le mode "État des lieux"' },
    { id: 'z_L0gA_m_u6', title: 'Paramètres avancés et personnalisation' }, { id: 'A_k-rN9t_g-iA', title: 'Comprendre l\'analyse des soldes' }
  ];

  const kpiCards = [
    { id: 'kpi_actionable_balance', icon: Wallet, color: 'green', label: 'Trésorerie Actionnable', value: totalActionableBalance, textColor: 'text-gray-800', gradient: 'from-green-50 to-emerald-50' },
    { id: 'kpi_overdue_payables', icon: TrendingDown, color: 'red', label: 'Dettes en Retard', value: totalOverduePayables, textColor: 'text-red-600', gradient: 'from-red-50 to-rose-50' },
    { id: 'kpi_overdue_receivables', icon: HandCoins, color: 'yellow', label: 'Créances en Retard', value: totalOverdueReceivables, textColor: 'text-yellow-600', gradient: 'from-yellow-50 to-amber-50' },
    { id: 'kpi_savings', icon: PiggyBank, color: 'teal', label: 'Épargne', value: totalSavings, textColor: 'text-gray-800', gradient: 'from-teal-50 to-cyan-50' },
    { id: 'kpi_provisions', icon: Lock, color: 'indigo', label: 'Provisions', value: totalProvisions, textColor: 'text-gray-800', gradient: 'from-indigo-50 to-violet-50' },
    { id: 'kpi_borrowings', icon: Banknote, color: 'red', label: 'Emprunts à rembourser', value: totalBorrowings, textColor: 'text-gray-800', gradient: 'from-orange-50 to-red-50' },
    { id: 'kpi_lendings', icon: Coins, color: 'green', label: 'Prêts à recevoir', value: totalLendings, textColor: 'text-gray-800', gradient: 'from-lime-50 to-green-50' },
  ];

  return (
    <div className="p-6 max-w-full space-y-8 bg-gray-50/50 min-h-screen">
      <div className="w-full px-4 py-6 space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {greetingMessage()} !
            </h2>
            <p className="text-gray-600 text-lg">Voici un aperçu de votre situation financière</p>
          </div>
          {!isConsolidated && (
            <button
              onClick={handleOpenSettings}
              className="p-3 text-gray-600 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:text-gray-900 group"
              title="Personnaliser le tableau de bord"
            >
              <Settings className="w-5 h-5 transition-transform group-hover:rotate-90" />
            </button>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {kpiCards.map(kpi => widgetVisibility[kpi.id] && (
            <div 
              key={kpi.id} 
              className={`bg-gradient-to-br ${kpi.gradient} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer`}
            >
              <div className="flex items-center gap-4">
                <div className={`bg-white p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <kpi.icon className={`w-6 h-6 text-${kpi.color}-600`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.textColor}`}>
                    {formatCurrency(kpi.value, settings)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alert Widget */}
        {widgetVisibility.alerts && <IntelligentAlertWidget forecastData={dailyForecastData} />}

        {/* Quick Actions */}
        {widgetVisibility.actions && (
          <div className="pt-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Que voulez-vous faire maintenant ?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {actions.map(action => (
                <ActionCard key={action.title} {...action} onClick={() => navigate(action.path)} />
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {widgetVisibility.trezo_score && <TrezoScoreWidget scoreData={trezoScoreData} />}
            {widgetVisibility['30_day_forecast'] && <ThirtyDayForecastWidget forecastData={dailyForecastData} />}
            {widgetVisibility.loans && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <LoansSummaryWidget title="Mes Emprunts" icon={Banknote} loans={borrowings} currencySettings={currencySettings} type="borrowing" />
                <LoansSummaryWidget title="Mes Prêts Accordés" icon={Coins} loans={lendings} currencySettings={currencySettings} type="lending" />
              </div>
            )}
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            {widgetVisibility.monthly_budget && <CurrentMonthBudgetWidget />}
            {widgetVisibility.ambassador_promo && <AmbassadorWidget />}
            {widgetVisibility.priorities && (
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  Actions Prioritaires
                </h2>
                {overdueItems.length > 0 ? (
                  <div className="space-y-4 overflow-y-auto custom-scrollbar max-h-96">
                    {overdueItems.map(item => {
                      const project = isConsolidated ? projects.find(p => p.id === item.projectId) : null;
                      return (
                        <button 
                          key={item.id} 
                          onClick={(e) => handleActionClick(e, item)} 
                          className="w-full text-left p-4 rounded-xl bg-gray-50 hover:bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-gray-200"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg shadow-sm ${
                                item.type === 'payable' ? 'bg-red-100' : 'bg-green-100'
                              }`}>
                                {item.type === 'payable' ? 
                                  <ArrowDown className="w-4 h-4 text-red-600" /> : 
                                  <ArrowUp className="w-4 h-4 text-green-600" />
                                }
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-semibold truncate text-gray-900" title={item.thirdParty}>
                                  {item.thirdParty}
                                  {isConsolidated && project && (
                                    <span className="text-xs font-normal text-gray-500 ml-1">
                                      ({project.name})
                                    </span>
                                  )}
                                </p>
                                <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                  <span>{new Date(item.date).toLocaleDateString('fr-FR')}</span>
                                  <span className="text-red-500 font-medium">
                                    ({Math.floor((new Date() - new Date(item.date)) / (1000 * 60 * 60 * 24))}j en retard)
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className={`text-base font-semibold whitespace-nowrap pl-2 ${
                              item.type === 'payable' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {formatCurrency(item.remainingAmount, settings)}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center py-12">
                    <div className="text-center text-gray-500">
                      <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-600">Aucune action prioritaire</p>
                      <p className="text-sm text-gray-500 mt-1">Tout est à jour !</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tutorials Section */}
        {widgetVisibility.tutorials && (
          <section id="tutoriels" className="pt-8">
            <div className="text-left mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                Tutoriels Vidéo
              </h2>
              <p className="text-gray-600 text-lg">
                Apprenez à maîtriser Trezocash avec nos guides pas à pas
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tutorials.map((video) => (
                <div key={video.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105">
                  <div className="w-full h-40 bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center relative overflow-hidden">
                    <iframe 
                      className="w-full h-full absolute inset-0" 
                      src={`https://www.youtube.com/embed/${video.id}`} 
                      title={video.title}
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-relaxed">
                      {video.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <DashboardSettingsDrawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        initialWidgetSettings={widgetVisibility}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default DashboardView;