import React from 'react';
import { Sparkles, Loader } from 'lucide-react';

const FinishStep = ({ isLoading, handleFinish }) => {
  return (
    <div className="text-center">
      <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Tout est prêt !</h2>
      <p className="text-gray-600 mb-8">
        Votre projet est sur le point d'être créé. Prêt à prendre le contrôle ?
      </p>
      
      <button 
        onClick={handleFinish} 
        disabled={isLoading} 
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-wait"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader className="animate-spin" /> Création en cours...
          </span>
        ) : (
          "Lancer l'application"
        )}
      </button>
    </div>
  );
};

export default FinishStep;