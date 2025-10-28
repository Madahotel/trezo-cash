import React from 'react';

const StartOptionStep = ({ data, setData, handleNext }) => {
  const handleOptionSelect = (option) => {
    setData(prev => ({ ...prev, startOption: option }));
    handleNext();
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Comment voulez-vous commencer ?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <button 
          onClick={() => handleOptionSelect('populated')} 
          className={`p-6 border rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all text-left ${
            data.startOption === 'populated' ? 'border-blue-500 bg-blue-50' : ''
          }`}
        >
          <h3 className="font-semibold text-lg">Avec des données d'exemple</h3>
          <p className="text-sm text-gray-600">
            Idéal pour démarrer vite avec des exemples concrets que vous pourrez modifier.
          </p>
        </button>
        
        <button 
          onClick={() => handleOptionSelect('blank')} 
          className={`p-6 border rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all text-left ${
            data.startOption === 'blank' ? 'border-gray-400 bg-gray-100' : ''
          }`}
        >
          <h3 className="font-semibold text-lg">Avec une structure vierge</h3>
          <p className="text-sm text-gray-600">
            Parfait si vous préférez tout configurer vous-même de A à Z.
          </p>
        </button>
      </div>
    </div>
  );
};

export default StartOptionStep;