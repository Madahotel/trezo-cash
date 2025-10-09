import React from 'react';
import { ArrowRight } from 'lucide-react';

const ActionCard = ({ icon: Icon, title, description, onClick, colorClass, iconColorClass }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full h-full text-left bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group ${colorClass}`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl shadow-sm ${iconColorClass.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${iconColorClass}`} />
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
      </div>
      <h3 className="mt-4 font-bold text-gray-800 text-lg group-hover:text-gray-900 transition-colors">{title}</h3>
      <p className="mt-1 text-sm text-gray-600 group-hover:text-gray-700 transition-colors">{description}</p>
    </button>
  );
};

export default ActionCard;