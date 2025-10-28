import React from 'react';

const ProjectDetailsStep = ({ data, setData }) => {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Détails de votre projet</h2>
      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 text-left mb-1">Nom du projet *</label>
          <input 
            type="text" 
            value={data.projectName} 
            onChange={(e) => setData(prev => ({ ...prev, projectName: e.target.value }))} 
            placeholder="Ex: Mon Budget 2025" 
            className="w-full text-lg p-2 border-b-2 focus:border-blue-500 outline-none transition bg-transparent text-gray-700" 
            autoFocus 
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 text-left mb-1">Description (optionnel)</label>
          <textarea 
            value={data.projectDescription} 
            onChange={(e) => setData(prev => ({ ...prev, projectDescription: e.target.value }))} 
            placeholder="Quel est l'objectif de ce projet ?" 
            className="w-full text-base p-2 border-b-2 focus:border-blue-500 outline-none transition bg-transparent text-gray-700" 
            rows="2"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 text-left mb-1">Date de début</label>
            <input 
              type="date" 
              value={data.projectStartDate} 
              onChange={(e) => setData(prev => ({ ...prev, projectStartDate: e.target.value }))} 
              className="w-full text-lg p-2 border-b-2 focus:border-blue-500 outline-none transition bg-transparent text-gray-700" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 text-left mb-1">Date de fin</label>
            <input 
              type="date" 
              value={data.projectEndDate} 
              onChange={(e) => setData(prev => ({ ...prev, projectEndDate: e.target.value }))} 
              className="w-full text-lg p-2 border-b-2 focus:border-blue-500 outline-none transition bg-transparent disabled:bg-gray-100 text-gray-700" 
              disabled={data.isEndDateIndefinite} 
              min={data.projectStartDate} 
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end">
          <input 
            type="checkbox" 
            id="indefinite-date" 
            checked={data.isEndDateIndefinite} 
            onChange={(e) => setData(prev => ({ 
              ...prev, 
              isEndDateIndefinite: e.target.checked, 
              projectEndDate: e.target.checked ? '' : prev.projectEndDate 
            }))} 
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
          />
          <label htmlFor="indefinite-date" className="ml-2 block text-sm text-gray-900">
            Durée indéterminée
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsStep;