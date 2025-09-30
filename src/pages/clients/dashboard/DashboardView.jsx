import React from "react";
import {
  Wallet,
  TrendingDown,
  HandCoins,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Lock,
  PiggyBank,
  Banknote,
  Coins,
} from "lucide-react";
import TrezoScoreWidget from "./TrezoScoreWidget";
import ThirtyDayForecastWidget from "./ThirtyDayForecastWidget";

const DashboardView = () => {
  // Message de bienvenue
  const greetingMessage = () => {
    const hour = new Date().getHours();
    const name = "Utilisateur";
    if (hour < 12) return `Bonjour ${name}`;
    if (hour < 18) return `Bon après-midi ${name}`;
    return `Bonsoir ${name}`;
  };

  // Données statiques
  const totalActionableBalance = "10 000 €";
  const totalOverduePayables = "2 500 €";
  const totalOverdueReceivables = "1 200 €";
  const totalSavings = "7 800 €";
  const totalProvisions = "3 000 €";

  const overdueItems = [
    {
      id: 1,
      type: "payable",
      thirdParty: "Fournisseur A",
      date: "2025-09-15",
      remainingAmount: "800 €",
    },
    {
      id: 2,
      type: "receivable",
      thirdParty: "Client B",
      date: "2025-09-10",
      remainingAmount: "1 200 €",
    },
  ];

  const tutorials = [
    { id: "L_jWHffIx5E", title: "Prise en main de Trezocash" },
    { id: "3qHkcs3kG44", title: "Créer votre premier projet" },
    { id: "g_t-s23-4U4", title: "Maîtriser le tableau de trésorerie" },
    { id: "m_u6m3-L0gA", title: "Utiliser les scénarios pour anticiper" },
  ];
  const testScoreData = {
    score: 72,
    evaluation: "Solide",
    color: "green",
    strengths: [
      { text: "Trésorerie positive et stable" },
      { text: "Peu de dettes en retard" },
      { text: "Bonne discipline budgétaire" },
    ],
    weaknesses: [
      { text: "Manque de diversification des revenus" },
      { text: "Dépendance à un client majeur" },
    ],
    recommendations: [
      "Renforcer votre épargne pour atteindre 6 mois de dépenses",
      "Diversifier vos sources de revenus",
      "Améliorer le suivi des factures clients",
    ],
  };

  const testData = {
    labels: Array.from({ length: 30 }, (_, i) => `Jour ${i + 1}`),
    data: [
      1200, 1300, 1250, 1100, 950, 1000, 1050, 1200, 1400, 1350, 1500, 1600,
      1550, 1700, 1650, 1800, 2000, 1900, 2100, 2200, 2150, 2300, 2400, 2500,
      2450, 2600, 2700, 2800, 2750, 2900,
    ],
  };
  return (
    <div className="p-6 max-w-full space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">
          {greetingMessage()} !
        </h2>
        <p className="text-gray-500">Voici un aperçu de votre situation.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-start gap-4">
          <div className="bg-green-100 p-3 rounded-full">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Trésorerie Actionnable</p>
            <p className="text-2xl font-bold text-gray-800">
              {totalActionableBalance}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-full">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Dettes en Retard</p>
            <p className="text-2xl font-bold text-red-600">
              {totalOverduePayables}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-start gap-4">
          <div className="bg-yellow-100 p-3 rounded-full">
            <HandCoins className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Créances en Retard</p>
            <p className="text-2xl font-bold text-yellow-600">
              {totalOverdueReceivables}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-start gap-4">
          <div className="bg-teal-100 p-3 rounded-full">
            <PiggyBank className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Épargne</p>
            <p className="text-2xl font-bold text-gray-800">{totalSavings}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-start gap-4">
          <div className="bg-indigo-100 p-3 rounded-full">
            <Lock className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Provisions</p>
            <p className="text-2xl font-bold text-gray-800">
              {totalProvisions}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TrezoScoreWidget scoreData={testScoreData} />
          <ThirtyDayForecastWidget forecastData={testData} />
        </div>
      </div>
      {/* Actions Prioritaires */}
      <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Actions Prioritaires
        </h2>
        {overdueItems.length > 0 ? (
          <div className="space-y-3">
            {overdueItems.map((item) => (
              <div
                key={item.id}
                className="w-full text-left p-2 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${
                        item.type === "payable" ? "bg-red-100" : "bg-green-100"
                      }`}
                    >
                      {item.type === "payable" ? (
                        <ArrowDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <ArrowUp className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p
                        className="font-semibold truncate text-gray-800"
                        title={item.thirdParty}
                      >
                        {item.thirdParty}
                      </p>
                      <div className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </div>
                  <p className="text-base font-normal whitespace-nowrap pl-2 text-gray-600">
                    {item.remainingAmount}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 py-10">
              <p>Aucune action prioritaire. Tout est à jour !</p>
            </div>
          </div>
        )}
      </div>

      {/* Tutoriels */}
      <section id="tutoriels" className="pt-8">
        <div className="text-left mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Tutoriels Vidéo
          </h2>
          <p className="mt-2 text-gray-600">
            Apprenez à maîtriser Trezocash avec nos guides pas à pas.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tutorials.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden group"
            >
              <div className="w-full h-40 bg-black flex items-center justify-center">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${video.id}`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                  {video.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardView;
