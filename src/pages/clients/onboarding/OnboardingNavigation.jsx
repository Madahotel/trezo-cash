import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const OnboardingNavigation = ({
  step,
  steps,
  isLoading,
  data,
  hasExistingProjects,
  handleBack,
  handleCancel,
  handleNext
}) => {
  return (
    <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
      <button 
        onClick={handleBack} 
        disabled={step === 0 || isLoading} 
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowLeft className="w-4 h-4" /> Précédent
      </button>
      
      {hasExistingProjects && (
        <button 
          onClick={handleCancel} 
          disabled={isLoading} 
          className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Annuler
        </button>
      )}
      
      {step < steps.length - 1 && (
        <button 
          onClick={handleNext} 
          disabled={isLoading || (step === 1 && !data.projectName.trim()) || (step === 2 && !data.templateId)} 
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:bg-gray-400"
        >
          Suivant <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default OnboardingNavigation;