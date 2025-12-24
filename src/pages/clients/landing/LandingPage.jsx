import React, { useState } from 'react';
import {
  CheckCircle,
  BarChart2,
  Layers,
  Users,
  ShieldCheck,
  ArrowRight,
  Plus,
  Minus,
  Star,
} from 'lucide-react';
import TrezocashLogo from '../logo/TrezocashLogo';
import { LicenseLandingPage } from './LicenseLandingPage';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
    <div className="flex items-center gap-4 mb-4">
      <div className="bg-blue-100 p-3 rounded-full">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600 text-sm">{children}</p>
  </div>
);

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-5 text-left"
      >
        <span className="font-semibold text-gray-800">{question}</span>
        {isOpen ? (
          <Minus className="w-5 h-5 text-blue-600" />
        ) : (
          <Plus className="w-5 h-5 text-gray-500" />
        )}
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-gray-600">{answer}</p>
      </motion.div>
    </div>
  );
};

const LandingPage = ({ onSignUp }) => {
  return (
    <div className="w-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Pilotez votre trésorerie avec{' '}
              <span className="text-blue-600">sérénité</span>.
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
              Trezocash est l'outil tout-en-un qui transforme votre gestion
              financière. Anticipez, analysez et prenez les bonnes décisions,
              sans effort.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <button
                onClick={onSignUp}
                className="px-8 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition-transform hover:scale-105 flex items-center gap-2"
              >
                Démarrer l'essai gratuit <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Une vision à 360° sur vos finances
            </h2>
            <p className="mt-4 text-gray-600">
              Tout ce dont vous avez besoin pour une gestion proactive.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={BarChart2} title="Prévisions Fiables">
              Anticipez vos soldes futurs avec une précision redoutable grâce à
              notre moteur de calcul avancé.
            </FeatureCard>
            <FeatureCard icon={Layers} title="Scénarios Illimités">
              Simulez l'impact d'un investissement, d'une embauche ou d'une
              crise. Prenez des décisions éclairées.
            </FeatureCard>
            <FeatureCard icon={Users} title="Collaboration Simplifiée">
              Partagez vos projets avec votre équipe ou votre expert-comptable
              en quelques clics, en toute sécurité.
            </FeatureCard>
            <FeatureCard icon={ShieldCheck} title="Score Trézo Unique">
              Obtenez un diagnostic instantané de votre santé financière et des
              recommandations personnalisées.
            </FeatureCard>
            <FeatureCard icon={CheckCircle} title="Gestion de la TVA">
              Automatisez le calcul de votre TVA collectée et déductible pour
              des déclarations sans stress.
            </FeatureCard>
            <FeatureCard icon={TrezocashLogo} title="Analyse Intelligente">
              Identifiez vos postes de dépenses les plus importants et découvrez
              des opportunités d'optimisation.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <LicenseLandingPage onSignUp={onSignUp} />
      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Questions Fréquentes
            </h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <FaqItem
              question="À qui s'adresse Trezocash ?"
              answer="Trezocash est conçu pour les freelances, les TPE, les PME, les associations et même pour la gestion de budget personnel complexe. Si vous avez besoin d'anticiper vos flux de trésorerie, l'outil est fait pour vous."
            />
            <FaqItem
              question="Mes données sont-elles en sécurité ?"
              answer="Absolument. La sécurité est notre priorité. Toutes les connexions sont chiffrées et nous nous appuyons sur Supabase, une infrastructure sécurisée et reconnue, pour stocker vos données. Nous ne vendons ni ne partageons jamais vos informations."
            />
            <FaqItem
              question="Puis-je annuler mon abonnement à tout moment ?"
              answer="Oui, vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel, sans aucune justification. Vous conserverez l'accès à vos données jusqu'à la fin de la période de facturation en cours."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold">
            Prêt à transformer votre gestion financière ?
          </h2>
          <p className="mt-4 text-blue-100 max-w-xl mx-auto">
            Rejoignez les centaines d'entrepreneurs et de particuliers qui ont
            retrouvé la sérénité grâce à une vision claire de leur trésorerie.
          </p>
          <div className="mt-8">
            <button
              onClick={onSignUp}
              className="px-8 py-4 font-semibold text-blue-600 bg-white rounded-lg shadow-xl hover:bg-gray-100 transition-transform hover:scale-105"
            >
              Commencer mon essai gratuit de 14 jours
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
