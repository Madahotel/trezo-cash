import { useState } from 'react';
import Badge from '../../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
export const CategoryCard = ({
  category,
  onEdit,
  onDelete,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
}) => {
  const IconComponent = category.icon;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-lg bg-${category.color}-100 flex items-center justify-center`}
            >
              <IconComponent className={`w-5 h-5 text-${category.color}-600`} />
            </div>
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              {category.isBase && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Catégorie de base
                </Badge>
              )}
            </div>
          </div>
          {!category.isBase && (
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(category)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(category)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {category.description && (
            <p className="text-sm text-gray-600">{category.description}</p>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                Sous-catégories :
              </p>
              {!category.isBase && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAddSubcategory(category)}
                  className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {category.subcategories.map((sub, index) => (
                <SubcategoryBadge
                  key={index}
                  subcategory={sub}
                  index={index}
                  onEdit={(subIndex) => onEditSubcategory(category, subIndex)}
                  onDelete={(subIndex) =>
                    onDeleteSubcategory(category, subIndex)
                  }
                  isBase={category.isBase}
                />
              ))}
              {category.subcategories.length === 0 && (
                <p className="text-xs text-gray-500 italic">
                  Aucune sous-catégorie
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
// Composant SubcategoryBadge pour gérer l'affichage des sous-catégories avec actions
const SubcategoryBadge = ({ subcategory, index, onEdit, onDelete, isBase }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Badge
        variant="outline"
        className="text-xs pr-7 transition-all duration-200"
      >
        {subcategory.name}
      </Badge>

      {!isBase && (
        <div
          className={`absolute right-0 top-0 flex space-x-0.5 bg-white rounded-r-md border-l transition-all duration-200 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 hover:bg-blue-50"
            onClick={() => onEdit(index)}
          >
            <Edit className="w-3 h-3 text-blue-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 hover:bg-red-50"
            onClick={() => onDelete(index)}
          >
            <Trash2 className="w-3 h-3 text-red-600" />
          </Button>
        </div>
      )}
    </div>
  );
};
