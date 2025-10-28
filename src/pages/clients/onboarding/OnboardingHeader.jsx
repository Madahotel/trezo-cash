import React from 'react';
import { DollarSign } from 'lucide-react';

const OnboardingHeader = () => {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-700 text-white rounded-full flex items-center justify-center">
        <DollarSign className="w-6 h-6" />
      </div>
      <div className="flex items-center gap-2 mt-4">
        <h1 
          className="text-5xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}
        >
          Trezocash
        </h1>
      </div>
    </div>
  );
};

export default OnboardingHeader;