import React from 'react';
import TemplateIcon from '../template/TemplateIcon';

const TemplateGrid = ({ templates, selectedTemplateId, onTemplateSelect, currentUser, isLoading }) => {
  if (isLoading) {
    return (
      <div className="col-span-3 text-center py-8 text-gray-500">
        Chargement des modèles...
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="col-span-3 text-center py-8 text-gray-500">
        Aucun modèle trouvé
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-[300px] overflow-y-auto p-2">
      {templates.map(template => {
        const isSelected = selectedTemplateId === template.id;
        let displayType = "";
        
        if (template.type === 'official' || template.user_id === null) {
          displayType = 'Officiel';
        } else if (template.user_id === currentUser.id) {
          displayType = 'Personnel';
        } else {
          displayType = 'Communauté';
        }

        return (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template.id)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-400'}`}
          >
            <TemplateIcon icon={template.icon} color={template.color} className="w-7 h-7 mb-2" />
            <h4 className="font-semibold text-gray-800">{template.name}</h4>
            <p className="text-xs text-gray-500">{template.description}</p>
            <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
              <span>{template.type}</span>
              <span>{displayType}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TemplateGrid;