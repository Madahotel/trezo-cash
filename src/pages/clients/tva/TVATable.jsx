import React, { useState, useEffect } from 'react';

const TVATable = () => {
  // Données statiques pour le tableau de TVA trésorerie
  const initialData = [
    {
      id: 1,
      date: '15/03/2024',
      datePaiement: '20/03/2024',
      description: 'Achat fournitures de bureau',
      ht: 150.0,
      tva: 30.0,
      ttc: 180.0,
      type: 'déductible',
      statutPaiement: 'payé',
      flux: 'décaissement',
    },
    {
      id: 2,
      date: '18/03/2024',
      datePaiement: '25/03/2024',
      description: 'Services de consultant',
      ht: 1200.0,
      tva: 240.0,
      ttc: 1440.0,
      type: 'déductible',
      statutPaiement: 'payé',
      flux: 'décaissement',
    },
    {
      id: 3,
      date: '22/03/2024',
      datePaiement: '05/04/2024',
      description: 'Vente produit A',
      ht: 850.0,
      tva: 170.0,
      ttc: 1020.0,
      type: 'collectée',
      statutPaiement: 'à recevoir',
      flux: 'encaissement',
    },
    {
      id: 4,
      date: '25/03/2024',
      datePaiement: '30/03/2024',
      description: 'Achat matériel informatique',
      ht: 2200.0,
      tva: 440.0,
      ttc: 2640.0,
      type: 'déductible',
      statutPaiement: 'payé',
      flux: 'décaissement',
    },
    {
      id: 5,
      date: '28/03/2024',
      datePaiement: '10/04/2024',
      description: 'Vente service B',
      ht: 3200.0,
      tva: 640.0,
      ttc: 3840.0,
      type: 'collectée',
      statutPaiement: 'reçu',
      flux: 'encaissement',
    },
    {
      id: 6,
      date: '30/03/2024',
      datePaiement: '05/04/2024',
      description: 'Frais de déplacement',
      ht: 180.0,
      tva: 36.0,
      ttc: 216.0,
      type: 'déductible',
      statutPaiement: 'à payer',
      flux: 'décaissement',
    },
    {
      id: 7,
      date: '05/04/2024',
      datePaiement: '15/04/2024',
      description: 'Vente produit C',
      ht: 1500.0,
      tva: 300.0,
      ttc: 1800.0,
      type: 'collectée',
      statutPaiement: 'à recevoir',
      flux: 'encaissement',
    },
    {
      id: 8,
      date: '10/04/2024',
      datePaiement: '20/04/2024',
      description: 'Achat matières premières',
      ht: 2800.0,
      tva: 560.0,
      ttc: 3360.0,
      type: 'déductible',
      statutPaiement: 'à payer',
      flux: 'décaissement',
    },
  ];

  // États pour gérer les données et les filtres
  const [data, setData] = useState(initialData);
  const [filterStatut, setFilterStatut] = useState('tous');
  const [filterFlux, setFilterFlux] = useState('tous');
  const [periode, setPeriode] = useState('mars-2024');
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'asc',
  });

  // Calculs de trésorerie
  const calculsTresorerie = data.reduce(
    (acc, item) => {
      // TVA collectée
      if (item.type === 'collectée') {
        acc.tvaCollecteeTotale += item.tva;

        if (item.statutPaiement === 'reçu') {
          acc.tvaCollecteeEncaissée += item.tva;
          acc.encaissementsTTC += item.ttc;
        } else if (item.statutPaiement === 'à recevoir') {
          acc.tvaCollecteeARecevoir += item.tva;
          acc.creancesClients += item.ttc;
        }
      }

      // TVA déductible
      if (item.type === 'déductible') {
        acc.tvaDeductibleTotale += item.tva;

        if (item.statutPaiement === 'payé') {
          acc.tvaDeductiblePayée += item.tva;
          acc.decaissementsTTC += item.ttc;
        } else if (item.statutPaiement === 'à payer') {
          acc.tvaDeductibleAPayer += item.tva;
          acc.dettesFournisseurs += item.ttc;
        }
      }

      // Totaux généraux
      acc.totalTVA += item.tva;
      acc.totalHT += item.ht;
      acc.totalTTC += item.ttc;

      return acc;
    },
    {
      tvaCollecteeTotale: 0,
      tvaCollecteeEncaissée: 0,
      tvaCollecteeARecevoir: 0,
      tvaDeductibleTotale: 0,
      tvaDeductiblePayée: 0,
      tvaDeductibleAPayer: 0,
      encaissementsTTC: 0,
      decaissementsTTC: 0,
      creancesClients: 0,
      dettesFournisseurs: 0,
      totalTVA: 0,
      totalHT: 0,
      totalTTC: 0,
    }
  );

  // Calculs de flux de trésorerie
  const fluxTresorerie = {
    netEncaissements:
      calculsTresorerie.encaissementsTTC - calculsTresorerie.decaissementsTTC,
    tvaNetAPayer:
      calculsTresorerie.tvaCollecteeTotale -
      calculsTresorerie.tvaDeductibleTotale,
    tvaNetEnCaisse:
      calculsTresorerie.tvaCollecteeEncaissée -
      calculsTresorerie.tvaDeductiblePayée,
    creancesNet: calculsTresorerie.creancesClients,
    dettesNet: calculsTresorerie.dettesFournisseurs,
  };

  // Filtrer les données
  const filteredData = data.filter((item) => {
    const matchStatut =
      filterStatut === 'tous' || item.statutPaiement === filterStatut;
    const matchFlux = filterFlux === 'tous' || item.flux === filterFlux;
    return matchStatut && matchFlux;
  });

  // Trier les données
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Gérer le tri
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Formater les montants en euros
  const formatEuro = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Obtenir la classe CSS pour le statut
  const getStatutClass = (statut) => {
    switch (statut) {
      case 'payé':
      case 'reçu':
        return 'bg-green-100 text-green-800';
      case 'à payer':
      case 'à recevoir':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir la classe CSS pour le flux
  const getFluxClass = (flux) => {
    return flux === 'encaissement'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Tableau de TVA Trésorerie
          </h1>
          <p className="text-gray-600">
            Gestion de la TVA avec suivi des flux de trésorerie
          </p>

          <div className="mt-4 flex flex-wrap gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Période
              </label>
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mars-2024">Mars 2024</option>
                <option value="avril-2024">Avril 2024</option>
                <option value="trim1-2024">1er Trimestre 2024</option>
              </select>
            </div>
          </div>
        </header>

        {/* Cartes de trésorerie */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* TVA En Caisse */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700">
                TVA En Caisse
              </h3>
              <span className="text-green-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {formatEuro(fluxTresorerie.tvaNetEnCaisse)}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Collectée: {formatEuro(calculsTresorerie.tvaCollecteeEncaissée)}
              <br />
              Déductible: {formatEuro(calculsTresorerie.tvaDeductiblePayée)}
            </p>
          </div>

          {/* TVA à Payer/Recevoir */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700">
                TVA à Régulariser
              </h3>
              <span className="text-yellow-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {formatEuro(fluxTresorerie.tvaNetAPayer)}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              À recevoir: {formatEuro(calculsTresorerie.tvaCollecteeARecevoir)}
              <br />À payer: {formatEuro(calculsTresorerie.tvaDeductibleAPayer)}
            </p>
          </div>

          {/* Flux Net */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700">
                Flux Net TTC
              </h3>
              <span className="text-blue-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </span>
            </div>
            <p
              className={`text-2xl font-bold ${
                fluxTresorerie.netEncaissements >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatEuro(fluxTresorerie.netEncaissements)}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Encaissements: {formatEuro(calculsTresorerie.encaissementsTTC)}
              <br />
              Décaissements: {formatEuro(calculsTresorerie.decaissementsTTC)}
            </p>
          </div>

          {/* Créances/Dettes */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700">
                Créances / Dettes
              </h3>
              <span className="text-purple-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </span>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Créances</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatEuro(fluxTresorerie.creancesNet)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dettes</p>
                <p className="text-lg font-bold text-red-600">
                  {formatEuro(fluxTresorerie.dettesNet)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">
              Flux de Trésorerie TVA
            </h2>

            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut Paiement
                </label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setFilterStatut('tous')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      filterStatut === 'tous'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setFilterStatut('payé')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      filterStatut === 'payé'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    Payés/Reçus
                  </button>
                  <button
                    onClick={() => setFilterStatut('à payer')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      filterStatut === 'à payer'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    À Payer/Recevoir
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de Flux
                </label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setFilterFlux('tous')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      filterFlux === 'tous'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setFilterFlux('encaissement')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      filterFlux === 'encaissement'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    Encaissements
                  </button>
                  <button
                    onClick={() => setFilterFlux('décaissement')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      filterFlux === 'décaissement'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    Décaissements
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des flux */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('date')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Date Facture
                      {sortConfig.key === 'date' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('datePaiement')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Date Paiement
                      {sortConfig.key === 'datePaiement' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th
                    onClick={() => handleSort('flux')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Flux
                      {sortConfig.key === 'flux' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TVA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TTC
                  </th>
                  <th
                    onClick={() => handleSort('statutPaiement')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Statut
                      {sortConfig.key === 'statutPaiement' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.datePaiement}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.description}
                      <div className="text-xs text-gray-500 mt-1">
                        {item.type === 'collectée'
                          ? 'TVA Collectée'
                          : 'TVA Déductible'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getFluxClass(
                          item.flux
                        )}`}
                      >
                        {item.flux === 'encaissement'
                          ? 'Encaissement'
                          : 'Décaissement'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatEuro(item.tva)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatEuro(item.ttc)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatutClass(
                          item.statutPaiement
                        )}`}
                      >
                        {item.statutPaiement}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tableau de synthèse trésorerie */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Synthèse Trésorerie TVA
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Encaissements */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-blue-700">Encaissements</h3>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-gray-700">TVA collectée encaissée</span>
                  <span className="font-semibold text-green-600">
                    {formatEuro(calculsTresorerie.tvaCollecteeEncaissée)}
                  </span>
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-gray-700">
                    TVA collectée à recevoir
                  </span>
                  <span className="font-semibold text-yellow-600">
                    {formatEuro(calculsTresorerie.tvaCollecteeARecevoir)}
                  </span>
                </div>
                <div className="px-6 py-4 flex justify-between items-center bg-blue-50">
                  <span className="font-semibold text-gray-800">
                    Total TVA collectée
                  </span>
                  <span className="font-bold text-blue-700">
                    {formatEuro(calculsTresorerie.tvaCollecteeTotale)}
                  </span>
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-gray-700">Encaissements TTC</span>
                  <span className="font-semibold text-green-600">
                    {formatEuro(calculsTresorerie.encaissementsTTC)}
                  </span>
                </div>
              </div>
            </div>

            {/* Décaissements */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-red-700">Décaissements</h3>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-gray-700">TVA déductible payée</span>
                  <span className="font-semibold text-green-600">
                    {formatEuro(calculsTresorerie.tvaDeductiblePayée)}
                  </span>
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-gray-700">TVA déductible à payer</span>
                  <span className="font-semibold text-yellow-600">
                    {formatEuro(calculsTresorerie.tvaDeductibleAPayer)}
                  </span>
                </div>
                <div className="px-6 py-4 flex justify-between items-center bg-red-50">
                  <span className="font-semibold text-gray-800">
                    Total TVA déductible
                  </span>
                  <span className="font-bold text-red-700">
                    {formatEuro(calculsTresorerie.tvaDeductibleTotale)}
                  </span>
                </div>
                <div className="px-6 py-4 flex justify-between items-center">
                  <span className="text-gray-700">Décaissements TTC</span>
                  <span className="font-semibold text-red-600">
                    {formatEuro(calculsTresorerie.decaissementsTTC)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé final */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">
                Solde TVA Trésorerie
              </h4>
              <p
                className={`text-2xl font-bold ${
                  fluxTresorerie.tvaNetEnCaisse >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatEuro(fluxTresorerie.tvaNetEnCaisse)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">
                TVA Nette à Payer
              </h4>
              <p
                className={`text-2xl font-bold ${
                  fluxTresorerie.tvaNetAPayer >= 0
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {formatEuro(fluxTresorerie.tvaNetAPayer)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Flux Net TTC</h4>
              <p
                className={`text-2xl font-bold ${
                  fluxTresorerie.netEncaissements >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatEuro(fluxTresorerie.netEncaissements)}
              </p>
            </div>
          </div>
        </div>

        {/* Légende et informations */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Légende et Informations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Statuts
              </h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  <span className="text-sm text-gray-600">
                    Payé/Reçu - Opération réglée
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                  <span className="text-sm text-gray-600">
                    À payer/À recevoir - En attente
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Flux</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  <span className="text-sm text-gray-600">
                    Encaissement - Entrée de trésorerie
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  <span className="text-sm text-gray-600">
                    Décaissement - Sortie de trésorerie
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Tableau de TVA Trésorerie • Suivi des flux financiers • Généré le{' '}
            {new Date().toLocaleDateString('fr-FR')}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default TVATable;
