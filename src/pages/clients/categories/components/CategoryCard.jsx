import {
  Layers,
  Sparkles,
  Tag,
  Plus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export const CategoryCard = ({
  category,
  colorOptions,
  handleAddSubcategory,
  handleViewSubcategoryDetails,
}) => {
  const colorClass =
    colorOptions.find((color) => color.value === category.color) ||
    colorOptions[0];

  // Fonction pour obtenir l'icône appropriée
  const getCategoryIcon = () => {
    switch (category.icon) {
      case 'TrendingDown':
        return <TrendingDown className="w-3 h-3 text-white" />;
      case 'TrendingUp':
        return <TrendingUp className="w-3 h-3 text-white" />;
      default:
        return <Tag className="w-3 h-3 text-white" />;
    }
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-lg ${colorClass.light} flex items-center justify-center`}
          >
            <div
              className={`w-6 h-6 ${colorClass.bg} rounded-md flex items-center justify-center`}
            >
              {getCategoryIcon()}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{category.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3 mr-1" />
                Base
              </span>
            </div>
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            <button
              onClick={() => handleAddSubcategory(category)}
              className="p-2 hover:bg-gray-50 rounded transition-colors"
              title="Ajouter une sous-catégorie"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {category.description && (
        <p className="text-gray-600 text-sm mb-4">{category.description}</p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wide">
            <Layers className="w-3 h-3 mr-1" />
            Sous-catégories
          </div>
          {category.subcategories.length === 0 && (
            <span className="text-xs text-gray-400 italic">
              Aucune sous-catégorie
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {category.subcategories.map((sub, index) => (
            <button
              key={index}
              onClick={() => handleViewSubcategoryDetails(category, sub)}
              className="px-2 py-1 bg-gray-50 text-gray-700 rounded text-sm border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              title={`Voir les détails de ${sub.name}`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
