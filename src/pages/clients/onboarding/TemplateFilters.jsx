import React from 'react';
import { Search, Star, Users, LayoutTemplate } from 'lucide-react';

const TemplateFilters = ({ activeTab, setActiveTab, searchTerm, setSearchTerm }) => {
  return (
    <>
      <div className="flex justify-center border-b mb-6">
        <button 
          onClick={() => setActiveTab('official')} 
          className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'official' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          <Star className="w-4 h-4"/>Modèles Officiels
        </button>
        <button 
          onClick={() => setActiveTab('community')} 
          className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'community' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          <Users className="w-4 h-4"/>Communauté
        </button>
        <button 
          onClick={() => setActiveTab('my-templates')} 
          className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'my-templates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          <LayoutTemplate className="w-4 h-4"/>Mes Modèles
        </button>
      </div>

      <div className="relative max-w-md mx-auto mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Rechercher un modèle..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-10 pr-4 py-2 border rounded-full text-gray-700" 
        />
      </div>
    </>
  );
};

export default TemplateFilters;