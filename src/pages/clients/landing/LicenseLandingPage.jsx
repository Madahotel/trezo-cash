import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LicenseLandingPage({ onSignUp }) {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      id: 'solo',
      name: 'Pack Solo',
      description: 'Pour les indépendants et les budgets personnels.',
      monthly: { price: 12 },
      annual: { price: 96 },
      buttonText: "Démarrer l'essai de 14 jours",
    },
    {
      id: 'team',
      name: 'Pack Team',
      description: 'Pour les équipes et les entreprises qui collaborent.',
      monthly: { price: 20 },
      annual: { price: 160 },
      highlight: true,
      buttonText: "Démarrer l'essai de 14 jours",
    },
    {
      id: 'lifetime',
      name: 'Pack Lifetime',
      description: 'Un paiement unique, un accès à vie.',
      price: 499,
      special: true,
      buttonText: 'Devenir un Visionnaire',
    },
  ];

  const featuresList = [
    'Suivi de trésorerie complet',
    'Prévisions et Simulations (Scénarios)',
    'Analyse des données avancée',
    'Gestion multi-projets',
    'Consolidation des projets',
    'Support client prioritaire',
    'Toutes les futures mises à jour',
  ];

  // Fonction de gestion du clic sur les boutons
  const handleButtonClick = () => {
    if (onSignUp) {
      onSignUp();
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      <section id="tarifs" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Des tarifs simples et transparents
            </h2>
            <p className="mt-4 text-gray-600">
              Choisissez le plan qui correspond à vos besoins. Sans engagement.
            </p>
          </div>

          <BillingToggle
            billingCycle={billingCycle}
            setBillingCycle={setBillingCycle}
          />

          {/* Ajout de margin et gap supplémentaires pour espacer les cartes */}
          <div className="flex flex-col lg:flex-row justify-center items-center lg:items-end gap-8 lg:gap-12 mt-12">
            {plans.map((plan, index) =>
              plan.id === 'lifetime' ? (
                <div
                  key={plan.id}
                  className="w-full max-w-sm p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl flex flex-col relative mx-4 my-6"
                >
                  <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-semibold text-amber-900 bg-amber-400 rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4" /> Offre Visionnaire
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-white text-center">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-300 mt-2 text-center h-10">
                      {plan.description}
                    </p>
                    <div className="my-8 h-28 flex flex-col justify-center text-center">
                      <span className="text-5xl font-extrabold text-white">
                        {plan.price}€
                      </span>
                      <span className="text-xl font-medium text-gray-400">
                        {' '}
                        / à vie
                      </span>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={handleButtonClick}
                      className="w-full px-6 py-3 font-semibold text-gray-900 bg-amber-400 rounded-lg hover:bg-amber-500 transition-colors shadow-lg flex items-center justify-center"
                    >
                      {plan.buttonText}
                    </button>
                    <p className="text-center text-xs text-amber-400 font-semibold mt-4 h-10 flex items-center justify-center">
                      ⚠️ Réservé aux 100 premiers visionnaires.
                    </p>
                    <hr className="my-4 border-gray-700" />
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-300 font-bold">
                          Collaboration illimitée
                        </span>
                      </li>
                      {featuresList.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div
                  key={plan.id}
                  className={`w-full max-w-sm p-8 bg-white rounded-2xl shadow-xl border flex flex-col relative mx-4 my-6 ${
                    plan.highlight
                      ? 'border-2 border-blue-600 lg:scale-105 lg:mt-4'
                      : ''
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-semibold text-white bg-blue-600 rounded-full">
                      Le plus populaire
                    </div>
                  )}
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-gray-800 text-center">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 text-center h-10">
                      {plan.description}
                    </p>
                    <div className="my-8 h-28 flex flex-col justify-center text-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={billingCycle}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {billingCycle === 'monthly' ? (
                            <div>
                              <span className="text-5xl font-extrabold text-gray-900">
                                {plan.monthly.price}€
                              </span>
                              <span className="text-xl font-medium text-gray-500">
                                {' '}
                                / mois
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-5xl font-extrabold text-gray-900">
                                {plan.annual.price}€
                              </span>
                              <span className="text-xl font-medium text-gray-500">
                                {' '}
                                / an
                              </span>
                              {plan.id === 'solo' && (
                                <p className="text-sm font-semibold text-blue-600 mt-1">
                                  Soit 8€ par mois
                                </p>
                              )}
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={handleButtonClick}
                      className={`w-full px-6 py-3 font-semibold rounded-lg transition-colors shadow-lg flex items-center justify-center ${
                        plan.highlight
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                    >
                      {plan.buttonText}
                    </button>
                    <hr className="my-8" />
                    <ul className="space-y-3 text-sm">
                      {plan.id === 'team' && (
                        <li className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700 font-bold">
                            Collaboration illimitée
                          </span>
                        </li>
                      )}
                      {featuresList.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </>
  );
}

const BillingToggle = ({ billingCycle, setBillingCycle }) => (
  <div className="flex justify-center items-center gap-4 mb-10">
    <span
      className={`font-semibold transition-colors ${
        billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-500'
      }`}
    >
      Mensuel
    </span>
    <button
      onClick={() =>
        setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')
      }
      className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors bg-blue-600`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        className="w-4 h-4 bg-white rounded-full"
        style={{
          marginLeft: billingCycle === 'monthly' ? '0%' : 'calc(100% - 1rem)',
        }}
      />
    </button>
    <span
      className={`font-semibold transition-colors ${
        billingCycle === 'annual' ? 'text-blue-600' : 'text-gray-500'
      }`}
    >
      Annuel
    </span>
    <span className="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
      -33% Économie
    </span>
  </div>
);
