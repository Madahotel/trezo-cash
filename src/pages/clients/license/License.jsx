import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Star, Clock, Loader } from 'lucide-react';
import { apiGet } from '../../../components/context/actionsMethode';
import axios from '../../../components/config/Axios';

export function License() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  // Nombre de jours restants pour l'offre Lifetime
  const [daysRemaining, setDaysRemaining] = useState(7);

  // Descriptions pour chaque type de plan
  const planDescriptions = {
    Basic: 'Parfait pour les freelances et petites entreprises',
    Premium: 'Idéal pour les équipes qui ont besoin de collaboration',
    Vip: 'Accès à vie avec toutes les fonctionnalités premium',
  };

  // Fallback descriptions si le nom n'est pas dans le mapping
  const defaultDescriptions = [
    'Solution économique pour démarrer',
    'Plan complet avec toutes les fonctionnalités',
    'Offre exclusive avec support prioritaire',
  ];

  // Fonction pour obtenir une description
  const getDescription = (planName, index) => {
    return (
      planDescriptions[planName] ||
      defaultDescriptions[index] ||
      'Plan premium avec toutes les fonctionnalités'
    );
  };

  const featuresList = [
    'Suivi de trésorerie complet',
    'Prévisions et Simulations (Scénarios)',
    'Analyse des données avancée',
    'Gestion multi-projets',
    'Consolidation des projets',
    'Support client prioritaire',
    'Toutes les futures mises à jour',
  ];

  const handleButtonClick = async (planId) => {
    console.log(planId);
    try {
      const res = await axios.get(`/subscriptions/${planId}`);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet('/subscriptions');
        if (res.status === 200) {
          setSubscriptions(res.plans);
        } else {
          setSubscriptions([]);
        }
      } catch (error) {
        console.log(error);
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Composant de chargement
  const LoadingCard = () => (
    <div className="flex flex-col lg:flex-row justify-center items-center lg:items-end gap-8 lg:gap-12 mt-12">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-xl border flex flex-col relative mx-4 my-6 animate-pulse"
        >
          {/* En-tête de la carte avec chargement */}
          <div className="flex-grow">
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-8"></div>

            {/* Section prix avec chargement */}
            <div className="my-8 h-28 flex flex-col justify-center text-center">
              <div className="h-12 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>

          {/* Bouton avec chargement */}
          <div>
            <div className="h-12 bg-gray-200 rounded-lg mb-8"></div>
            <hr className="my-8" />

            {/* Liste de features avec chargement */}
            <ul className="space-y-3 text-sm">
              {[1, 2, 3, 4, 5].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );

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

          {/* Afficher le chargement si loading est true */}
          {loading ? (
            <LoadingCard />
          ) : (
            /* Contenu normal lorsque les données sont chargées */
            <div className="flex flex-col lg:flex-row justify-center items-center lg:items-end gap-8 lg:gap-12 mt-12">
              {subscriptions.map((subscription, index) => {
                const price = parseFloat(subscription.stripe_plan_price);
                const description = getDescription(subscription.name, index);
                const isLifetime = subscription.name === 'Vip' || index === 2;
                const isHighlight =
                  subscription.name === 'Premium' || index === 1;

                return isLifetime ? (
                  <div
                    key={subscription.id}
                    className="w-full max-w-sm p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl flex flex-col relative mx-4 my-6"
                  >
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-semibold text-amber-900 bg-amber-400 rounded-full flex items-center gap-1">
                      <Star className="w-4 h-4" /> Offre Visionnaire
                    </div>

                    {/* Badge des jours restants dans la carte */}
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg">
                        <Clock className="w-4 h-4" />
                        <div className="text-center">
                          <div className="text-sm font-bold">
                            {daysRemaining} jours
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-white text-center">
                        {subscription.name}
                      </h3>
                      <p className="text-sm text-gray-300 mt-2 text-center h-10">
                        {description}
                      </p>
                      <div className="my-8 h-28 flex flex-col justify-center text-center">
                        <span className="text-5xl font-extrabold text-white">
                          {price}€
                        </span>
                        <span className="text-xl font-medium text-gray-400">
                          {' '}
                          / à vie
                        </span>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() =>
                          handleButtonClick(subscription.stripe_plan_id)
                        }
                        className="w-full px-6 py-3 font-semibold text-gray-900 bg-amber-400 rounded-lg hover:bg-amber-500 transition-colors shadow-lg flex items-center justify-center"
                      >
                        Devenir un Visionnaire
                      </button>
                      <p className="text-center text-xs text-amber-400 font-semibold mt-4 h-10 flex items-center justify-center">
                        ⚠️ Offre limitée dans le temps
                      </p>
                      <hr className="my-4 border-gray-700" />
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-300 font-bold">
                            Collaboration illimitée
                          </span>
                        </li>
                        {featuresList.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-center gap-3"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div
                    key={subscription.id}
                    className={`w-full max-w-sm p-8 bg-white rounded-2xl shadow-xl border flex flex-col relative mx-4 my-6 ${
                      isHighlight
                        ? 'border-2 border-blue-600 lg:scale-105 lg:mt-4'
                        : ''
                    }`}
                  >
                    {isHighlight && (
                      <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-semibold text-white bg-blue-600 rounded-full">
                        Le plus populaire
                      </div>
                    )}
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-gray-800 text-center">
                        {subscription.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2 text-center h-10">
                        {description}
                      </p>
                      <div className="my-8 h-28 flex flex-col justify-center text-center">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`${subscription.id}-${billingCycle}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                          >
                            {billingCycle === 'monthly' ? (
                              <div>
                                <span className="text-5xl font-extrabold text-gray-900">
                                  {price}€
                                </span>
                                <span className="text-xl font-medium text-gray-500">
                                  {' '}
                                  / mois
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-5xl font-extrabold text-gray-900">
                                  {Math.round(price * 12)}€
                                </span>
                                <span className="text-xl font-medium text-gray-500">
                                  {' '}
                                  / an
                                </span>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() =>
                          handleButtonClick(subscription.stripe_plan_id)
                        }
                        className={`w-full px-6 py-3 font-semibold rounded-lg transition-colors shadow-lg flex items-center justify-center ${
                          isHighlight
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                      >
                        Démarrer l'essai de 14 jours
                      </button>
                      <hr className="my-8" />
                      <ul className="space-y-3 text-sm">
                        {isHighlight && (
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-gray-700 font-bold">
                              Collaboration illimitée
                            </span>
                          </li>
                        )}
                        {featuresList.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-center gap-3"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
  </div>
);
