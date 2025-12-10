import React from 'react';
import TemplateIcon from '../template/TemplateIcon';

const TemplateGrid = ({ templates, selectedTemplateId, onTemplateSelect, currentUser, isLoading }) => {
  if (isLoading) {
    return (
      <div className="col-span-3 py-8 text-center text-gray-500">
        Chargement des modèles...
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="col-span-3 py-8 text-center text-gray-500">
        Aucun modèle trouvé
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-[300px] overflow-y-auto p-2">
      {templates.map(template => {
        const isSelected = selectedTemplateId === template.id;
        let displayType = "";
        
        // Déterminer le type à afficher
        if (template.type === 'blank') {
          displayType = 'Vierge';
        } else if (template.type === 'official') {
          displayType = 'Officiel';
        } else if (template.type === 'personal') {
          displayType = 'Personnel';
        } else if (template.type === 'community') {
          displayType = 'Communauté';
        } else {
          // Fallback basé sur template_type_id
          if (template.template_type_id === 1) {
            displayType = 'Officiel';
          } else if (template.template_type_id === 2) {
            displayType = template.user_id === currentUser?.id ? 'Personnel' : 'Personnel (autre)';
          } else {
            displayType = 'Communauté';
          }
        }

        return (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template.id)}
            className={`p-4 border-2 rounded-lg text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-400'}`}
          >
            <div className="flex items-start gap-3">
              <TemplateIcon icon={template.icon} color={template.color} className="flex-shrink-0 w-7 h-7" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{template.name}</h4>
                <p className="mt-1 text-xs text-gray-500">{template.description}</p>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    displayType === 'Officiel' ? 'bg-purple-100 text-purple-700' :
                    displayType === 'Personnel' ? 'bg-blue-100 text-blue-700' :
                    displayType === 'Communauté' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {displayType}
                  </span>
                  {template.user_full_name && (
                    <span className="text-gray-400 truncate max-w-[100px]" title={template.user_full_name}>
                      {template.user_full_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TemplateGrid;