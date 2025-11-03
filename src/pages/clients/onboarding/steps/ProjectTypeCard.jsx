import React from 'react';
import { Briefcase, Home, PartyPopper } from 'lucide-react';

const iconComponents = {
  'Briefcase': Briefcase,
  'Home': Home,
  'PartyPopper': PartyPopper
};

const colorClasses = {
  blue: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
  green: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-600' },
  pink: { border: 'border-pink-500', bg: 'bg-pink-50', text: 'text-pink-600' },
  gray: { border: 'border-gray-500', bg: 'bg-gray-50', text: 'text-gray-600' }
};

const ProjectTypeCard = ({ projectType, icon, color, onSelect, isSelected = false }) => {
  const IconComponent = iconComponents[icon] || Briefcase;
  const colors = colorClasses[color] || colorClasses.gray;

  return (
    <button
      onClick={() => onSelect(projectType)}
      className={`p-8 border-2 rounded-lg text-left transition-all ${colors.border} ${colors.bg} ${isSelected ? 'ring-2 ring-opacity-50' : ''}`}
    >
      <IconComponent className={`w-8 h-8 ${colors.text} mb-4`} />
      <h3 className="font-semibold text-lg text-gray-800">{projectType.name}</h3>
      <p className="text-sm text-gray-600 mt-1">{projectType.description}</p>
    </button>
  );
};

export default ProjectTypeCard;