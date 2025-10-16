import React, { useState } from 'react';
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

// Données statiques complètes
const staticSettings = {
  currency: 'EUR',
  displayUnit: 'k',
  decimalPlaces: 0,
};

const staticProfile = {
  fullName: 'Jean Dupont',
};

const staticProjects = [
  {
    id: 1,
    name: 'Projet Principal',
    currency: 'EUR',
    dashboard_widgets: {},
  },
];

const staticOverdueItems = [
  {
    id: 1,
    projectId: 1,
    type: 'payable',
    thirdParty: 'Fournisseur ABC',
    date: '2024-01-15',
    remainingAmount: 2500,
  },
  {
    id: 2,
    projectId: 1,
    type: 'receivable',
    thirdParty: 'Client XYZ',
    date: '2024-01-10',
    remainingAmount: 3800,
  },
  {
    id: 3,
    projectId: 1,
    type: 'payable',
    thirdParty: 'Service Énergie',
    date: '2024-01-05',
    remainingAmount: 1200,
  },
];

const staticLoans = {
  borrowings: [
    {
      id: 1,
      name: 'Prêt bancaire',
      remainingAmount: 15000,
      nextDueDate: '2024-02-01',
      interestRate: 3.5,
      totalAmount: 20000,
      startDate: '2023-01-01',
      endDate: '2025-12-31',
    },
    {
      id: 2,
      name: 'Crédit voiture',
      remainingAmount: 8000,
      nextDueDate: '2024-02-15',
      interestRate: 4.2,
      totalAmount: 12000,
      startDate: '2023-06-01',
      endDate: '2024-12-31',
    },
  ],
  lendings: [
    {
      id: 1,
      name: 'Prêt à Paul',
      remainingAmount: 5000,
      nextDueDate: '2024-03-15',
      interestRate: 2.0,
      totalAmount: 8000,
      startDate: '2023-03-01',
      endDate: '2024-09-30',
    },
    {
      id: 2,
      name: 'Avance à Sophie',
      remainingAmount: 2000,
      nextDueDate: '2024-04-01',
      interestRate: 0,
      totalAmount: 2000,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
    },
  ],
};

const staticTrezoScoreData = {
  score: 75,
  trend: 'up',
  changes: [
    { category: 'Trésorerie', change: 5 },
    { category: 'Dettes', change: -2 },
    { category: 'Épargne', change: 3 },
    { category: 'Investissements', change: 1 },
  ],
  history: [
    { date: '2024-01', score: 70 },
    { date: '2023-12', score: 68 },
    { date: '2023-11', score: 65 },
    { date: '2023-10', score: 72 },
    { date: '2023-09', score: 69 },
  ],
};

// Données de forecast pour les autres widgets (format objet)
const staticForecastDataArray = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);

  // Simulation de variations de trésorerie
  const baseBalance = 5000;
  const variation = Math.sin(i * 0.3) * 2000 + Math.random() * 1000 - 500;
  const balance = Math.max(500, baseBalance + variation);

  return {
    date: date.toISOString().split('T')[0],
    balance: Math.round(balance),
    inflows: Math.round(Math.random() * 3000 + 1000),
    outflows: Math.round(Math.random() * 2500 + 800),
  };
});

// Données pour les alertes intelligentes
const staticAlertData = {
  criticalDays: staticForecastDataArray.filter((day) => day.balance < 1000)
    .length,
  lowestBalance: Math.min(...staticForecastDataArray.map((d) => d.balance)),
  negativeDays: staticForecastDataArray.filter((day) => day.balance < 0).length,
  trend:
    staticForecastDataArray[29].balance > staticForecastDataArray[0].balance
      ? 'up'
      : 'down',
};

// Données pour le budget du mois courant
const staticBudgetData = {
  month: 'Janvier 2024',
  totalBudget: 15000,
  currentSpending: 8200,
  categories: [
    { name: 'Salaires', budget: 6000, spent: 6000 },
    { name: 'Loyer', budget: 2000, spent: 2000 },
    { name: 'Fournitures', budget: 1500, spent: 800 },
    { name: 'Marketing', budget: 2000, spent: 1200 },
    { name: 'Divers', budget: 3500, spent: 1200 },
  ],
  remaining: 6800,
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

const DashboardView = () => {
  const navigate = useNavigate();
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [widgetVisibility, setWidgetVisibility] = useState(
    defaultWidgetSettings
  );
  const isMobile = useMobile();

  // Utilisation des données statiques
  const settings = staticSettings;
  const profile = staticProfile;
  const projects = staticProjects;
  const overdueItems = staticOverdueItems;
  const { borrowings, lendings } = staticLoans;
  const trezoScoreData = staticTrezoScoreData;
  const dailyForecastData = staticForecastDataArray;
  const budgetData = staticBudgetData;
  const alertData = staticAlertData;

  const isConsolidated = false;
  const activeProject = projects[0];

  const handleOpenSettings = () => {
    setIsSettingsDrawerOpen(true);
  };

  // Sauvegarde automatique quand les paramètres changent
  const handleSaveSettings = (newSettings) => {
    console.log('Sauvegarde automatique des paramètres:', newSettings);
    setWidgetVisibility(newSettings);
    // Ici vous pouvez ajouter un appel API pour sauvegarder en base de données
    // await api.saveDashboardSettings(newSettings);
  };

  const currencySettings = {
    currency: activeProject?.currency || settings.currency,
    displayUnit: activeProject?.display_unit || settings.displayUnit,
    decimalPlaces: activeProject?.decimal_places ?? settings.decimalPlaces,
  };

  const handleActionClick = (e, item) => {
    console.log('Action click:', item);
    // Simuler l'ouverture du menu d'action
  };

  const greetingMessage = () => {
    const hour = new Date().getHours();
    const name = profile?.fullName?.split(' ')[0] || 'Utilisateur';
    if (hour < 12) return `Bonjour ${name}`;
    if (hour < 18) return `Bon après-midi ${name}`;
    return `Bonsoir ${name}`;
  };

  const actions = [
    {
      icon: ListChecks,
      title: 'Saisir votre budget',
      description: 'Définissez vos entrées et sorties prévisionnelles.',
      path: '/app/budget',
      colorClass:
        'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200',
      iconColorClass: 'text-blue-600',
    },
    {
      icon: Table,
      title: 'Voir votre trézo',
      description:
        'Voyez la projection de vos entrées et sorties ventilées par mois de cette année.',
      path: '/app/trezo',
      colorClass:
        'bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200',
      iconColorClass: 'text-pink-600',
    },
    {
      icon: Calendar,
      title: "Gérer l'échéancier",
      description:
        'Suivez et enregistrez vos paiements et encaissements réels.',
      path: '/app/echeancier',
      colorClass:
        'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200',
      iconColorClass: 'text-green-600',
    },
    {
      icon: PieChart,
      title: 'Analyser vos flux',
      description: 'Comprenez la répartition de vos dépenses et revenus.',
      path: '/app/analyse',
      colorClass:
        'bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200',
      iconColorClass: 'text-yellow-600',
    },
    {
      icon: Layers,
      title: 'Ajouter des simulations',
      description: "Anticipez l'impact de vos décisions avec les scénarios.",
      path: '/app/scenarios',
      colorClass:
        'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200',
      iconColorClass: 'text-purple-600',
    },
    {
      icon: Wallet,
      title: 'Ajuster vos comptes',
      description: 'Consultez et mettez à jour vos soldes de trésorerie.',
      path: '/app/comptes',
      colorClass:
        'bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200',
      iconColorClass: 'text-teal-600',
    },
  ];

  const tutorials = [
    { id: 'L_jWHffIx5E', title: 'Prise en main de Trezocash' },
    { id: '3qHkcs3kG44', title: 'Créer votre premier projet' },
    { id: 'g_t-s23-4U4', title: 'Maîtriser le tableau de trésorerie' },
    { id: 'm_u6m3-L0gA', title: 'Utiliser les scénarios pour anticiper' },
    { id: 'a_p5-VvF-sI', title: 'Analyser vos dépenses efficacement' },
    { id: 'k-rN9t_g-iA', title: 'Gérer vos comptes de trésorerie' },
    { id: 'r6-p_c-3_sI', title: 'Collaborer en équipe sur un projet' },
    { id: 's_k9-t_g-iA', title: "Comprendre l'échéancier" },
    { id: 't_g-iA_r6-p', title: 'Créer et utiliser des modèles' },
    { id: 'u_sI-k-rN9t', title: 'Gérer les fonds à provisionner' },
    { id: 'v_m3-L0gA_a', title: 'Consolider plusieurs projets' },
    { id: 'w_4U4-s23-g', title: 'Personnaliser vos catégories' },
    { id: 'x_g-iA_k-rN', title: 'Suivre vos dettes et prêts' },
    { id: 'y_p5-VvF-sI', title: 'Astuces pour le mode "État des lieux"' },
    { id: 'z_L0gA_m_u6', title: 'Paramètres avancés et personnalisation' },
    { id: 'A_k-rN9t_g-iA', title: "Comprendre l'analyse des soldes" },
  ];

  const kpiCards = [
    {
      id: 'kpi_actionable_balance',
      icon: Wallet,
      color: 'green',
      label: 'Trésorerie Actionnable',
      value: '12500',
      textColor: 'text-gray-800',
      gradient: 'from-green-50 to-emerald-50',
    },
    {
      id: 'kpi_overdue_payables',
      icon: TrendingDown,
      color: 'red',
      label: 'Dettes en Retard',
      value: '3700',
      textColor: 'text-red-600',
      gradient: 'from-red-50 to-rose-50',
    },
    {
      id: 'kpi_overdue_receivables',
      icon: HandCoins,
      color: 'yellow',
      label: 'Créances en Retard',
      value: '3800',
      textColor: 'text-yellow-600',
      gradient: 'from-yellow-50 to-amber-50',
    },
    {
      id: 'kpi_savings',
      icon: PiggyBank,
      color: 'teal',
      label: 'Épargne',
      value: '12500',
      textColor: 'text-gray-800',
      gradient: 'from-teal-50 to-cyan-50',
    },
    {
      id: 'kpi_provisions',
      icon: Lock,
      color: 'indigo',
      label: 'Provisions',
      value: '8000',
      textColor: 'text-gray-800',
      gradient: 'from-indigo-50 to-violet-50',
    },
    {
      id: 'kpi_borrowings',
      icon: Banknote,
      color: 'red',
      label: 'Emprunts à rembourser',
      value: 23000,
      textColor: 'text-gray-800',
      gradient: 'from-orange-50 to-red-50',
    },
    {
      id: 'kpi_lendings',
      icon: Coins,
      color: 'green',
      label: 'Prêts à recevoir',
      value: 7000,
      textColor: 'text-gray-800',
      gradient: 'from-lime-50 to-green-50',
    },
  ];

  // Alternative avec des données plus réalistes et une tendance claire
  const staticForecastDataAlternative = {
    labels: [
      '01/01',
      '02/01',
      '03/01',
      '04/01',
      '05/01',
      '06/01',
      '07/01',
      '08/01',
      '09/01',
      '10/01',
      '11/01',
      '12/01',
      '13/01',
      '14/01',
      '15/01',
      '16/01',
      '17/01',
      '18/01',
      '19/01',
      '20/01',
      '21/01',
      '22/01',
      '23/01',
      '24/01',
      '25/01',
      '26/01',
      '27/01',
      '28/01',
      '29/01',
      '30/01',
    ],
    data: [
      12500, 11800, 13200, 14500, 13800, 15200, 14800, 16200, 17500, 16800,
      18200, 19500, 18800, 20200, 21500, 20800, 22200, 23500, 22800, 24200,
      25500, 24800, 26200, 27500, 26800, 28200, 29500, 28800, 30200, 31500,
    ],
  };

  return (
    <div className="p-4 sm:p-6 max-w-full space-y-6 sm:space-y-8 bg-gray-50/50 min-h-screen">
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
              {greetingMessage()} !
            </h2>
            <p className="text-gray-600 text-sm sm:text-lg truncate">
              Voici un aperçu de votre situation financière
            </p>
          </div>
          {!isConsolidated && (
            <button
              onClick={handleOpenSettings}
              className="flex-shrink-0 p-2 sm:p-3 text-gray-600 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:text-gray-900 group"
              title="Personnaliser le tableau de bord"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-90" />
            </button>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {kpiCards.map(
            (kpi) =>
              widgetVisibility[kpi.id] && (
                <div
                  key={kpi.id}
                  className={`bg-gradient-to-br ${kpi.gradient} p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                    >
                      <kpi.icon
                        className={`w-4 h-4 sm:w-6 sm:h-6 text-${kpi.color}-600`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
                        {kpi.label}
                      </p>
                      <p
                        className={`text-lg sm:text-xl lg:text-2xl font-bold ${kpi.textColor} truncate`}
                      >
                        {formatCurrency(kpi.value, settings)}
                      </p>
                    </div>
                  </div>
                </div>
              )
          )}
        </div>

        {/* Alert Widget */}
        {widgetVisibility.alerts && (
          <IntelligentAlertWidget forecastData={alertData} />
        )}

        {/* Quick Actions */}
        {widgetVisibility.actions && (
          <div className="pt-2 sm:pt-4">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Que voulez-vous faire maintenant ?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
              {actions.map((action) => (
                <ActionCard
                  key={action.title}
                  {...action}
                  onClick={() => navigate(action.path)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="space-y-6 sm:space-y-8">
          {/* Mobile Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-5">
              {widgetVisibility.trezo_score && (
                <TrezoScoreWidget scoreData={trezoScoreData} />
              )}
              {widgetVisibility['30_day_forecast'] && (
                <ThirtyDayForecastWidget
                  forecastData={staticForecastDataAlternative}
                />
              )}
              {widgetVisibility.loans && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <LoansSummaryWidget
                    title="Mes Emprunts"
                    icon={Banknote}
                    loans={borrowings}
                    currencySettings={currencySettings}
                    type="borrowing"
                  />
                  <LoansSummaryWidget
                    title="Mes Prêts Accordés"
                    icon={Coins}
                    loans={lendings}
                    currencySettings={currencySettings}
                    type="lending"
                  />
                </div>
              )}
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-6 sm:space-y-8">
              {widgetVisibility.monthly_budget && (
                <CurrentMonthBudgetWidget budgetData={budgetData} />
              )}
              {widgetVisibility.ambassador_promo && <AmbassadorWidget />}
              {widgetVisibility.priorities && (
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <div className="bg-yellow-100 p-1.5 sm:p-2 rounded-lg">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                    </div>
                    Actions Prioritaires
                  </h2>
                  {overdueItems.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar max-h-64 sm:max-h-96">
                      {overdueItems.map((item) => {
                        const project = isConsolidated
                          ? projects.find((p) => p.id === item.projectId)
                          : null;
                        return (
                          <button
                            key={item.id}
                            onClick={(e) => handleActionClick(e, item)}
                            className="w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-gray-200"
                          >
                            <div className="flex justify-between items-center gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div
                                  className={`flex-shrink-0 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg shadow-sm ${
                                    item.type === 'payable'
                                      ? 'bg-red-100'
                                      : 'bg-green-100'
                                  }`}
                                >
                                  {item.type === 'payable' ? (
                                    <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                  ) : (
                                    <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                  )}
                                </div>
                                <div className="overflow-hidden flex-1 min-w-0">
                                  <p
                                    className="font-semibold truncate text-gray-900 text-sm sm:text-base"
                                    title={item.thirdParty}
                                  >
                                    {item.thirdParty}
                                    {isConsolidated && project && (
                                      <span className="text-xs font-normal text-gray-500 ml-1">
                                        ({project.name})
                                      </span>
                                    )}
                                  </p>
                                  <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                    <span>
                                      {new Date(item.date).toLocaleDateString(
                                        'fr-FR'
                                      )}
                                    </span>
                                    <span className="text-red-500 font-medium">
                                      (
                                      {Math.floor(
                                        (new Date() - new Date(item.date)) /
                                          (1000 * 60 * 60 * 24)
                                      )}
                                      j en retard)
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p
                                className={`text-sm sm:text-base font-semibold whitespace-nowrap pl-2 flex-shrink-0 ${
                                  item.type === 'payable'
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }`}
                              >
                                {formatCurrency(item.remainingAmount, settings)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center py-8 sm:py-12">
                      <div className="text-center text-gray-500">
                        <div className="bg-green-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                        </div>
                        <p className="text-base sm:text-lg font-medium text-gray-600">
                          Aucune action prioritaire
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Tout est à jour !
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tutorials Section */}
        {widgetVisibility.tutorials && (
          <section id="tutoriels" className="pt-4 sm:pt-8">
            <div className="text-left mb-4 sm:mb-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                Tutoriels Vidéo
              </h2>
              <p className="text-gray-600 text-sm sm:text-lg">
                Apprenez à maîtriser Trezocash avec nos guides pas à pas
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {tutorials.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105"
                >
                  <div className="w-full h-32 sm:h-40 bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center relative overflow-hidden">
                    <iframe
                      className="w-full h-full absolute inset-0"
                      src={`https://www.youtube.com/embed/${video.id}`}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h4 className="font-semibold text-xs sm:text-sm text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-relaxed">
                      {video.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Settings Drawer avec sauvegarde automatique */}
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
