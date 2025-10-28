import React from 'react';
import * as LucideIcons from 'lucide-react';

// Configuration centralisée des icônes disponibles
const AVAILABLE_ICONS = [
  'Home', 'Briefcase', 'Plane', 'Heart', 'Coffee', 'HeartHandshake', 
  'Book', 'PiggyBank', 'Car', 'Building2', 'ShoppingBasket', 'Gift',
  'Utensils', 'Film', 'Music', 'Dumbbell', 'GraduationCap', 'Stethoscope',
  'ShoppingCart', 'Wifi', 'Smartphone', 'Laptop', 'Camera', 'Gamepad2'
];

// Configuration centralisée des couleurs
const COLOR_PALETTE = [
  { name: 'red', value: '#EF4444' },
  { name: 'orange', value: '#F97316' },
  { name: 'amber', value: '#F59E0B' },
  { name: 'yellow', value: '#EAB308' },
  { name: 'lime', value: '#84CC16' },
  { name: 'green', value: '#22C55E' },
  { name: 'emerald', value: '#10B981' },
  { name: 'teal', value: '#14B8A6' },
  { name: 'cyan', value: '#06B6D4' },
  { name: 'sky', value: '#0EA5E9' },
  { name: 'blue', value: '#3B82F6' },
  { name: 'indigo', value: '#6366F1' },
  { name: 'violet', value: '#8B5CF6' },
  { name: 'purple', value: '#A855F7' },
  { name: 'fuchsia', value: '#D946EF' },
  { name: 'pink', value: '#EC4899' },
  { name: 'rose', value: '#F43F5E' }
];

// Classes CSS pour les couleurs (Tailwind)
const COLOR_CLASSES = {
  bg: COLOR_PALETTE.reduce((acc, color) => {
    acc[color.name] = `bg-${color.name}-500`;
    return acc;
  }, {}),
  ring: COLOR_PALETTE.reduce((acc, color) => {
    acc[color.name] = `ring-${color.name}-500`;
    return acc;
  }, {})
};

const IconPicker = ({ 
  value = { icon: 'Briefcase', color: 'blue' }, 
  onChange, 
  disabled = false 
}) => {
  const { icon: selectedIconName, color: selectedColorName } = value;

  const handleIconSelect = (iconName) => {
    if (disabled) return;
    onChange({ ...value, icon: iconName });
  };

  const handleColorSelect = (colorName) => {
    if (disabled) return;
    onChange({ ...value, color: colorName });
  };

  // Récupérer les composants d'icônes dynamiquement
  const getIconComponent = (iconName) => {
    const IconComponent = LucideIcons[iconName];
    return IconComponent || LucideIcons.Briefcase; // Fallback
  };

  return (
    <div className="space-y-4">
      {/* Sélection d'icône */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Icône
          {selectedIconName && (
            <span className="text-xs text-gray-500 ml-2">
              Sélectionnée: {selectedIconName}
            </span>
          )}
        </label>
        <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
          {AVAILABLE_ICONS.map((iconName) => {
            const IconComponent = getIconComponent(iconName);
            const isSelected = selectedIconName === iconName;
            
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => handleIconSelect(iconName)}
                disabled={disabled}
                className={`
                  p-3 border rounded-lg flex items-center justify-center 
                  transition-all duration-200 ease-in-out
                  ${isSelected 
                    ? `ring-2 ring-blue-500 bg-blue-50 border-blue-200 transform scale-105` 
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title={iconName}
              >
                <IconComponent 
                  className={`w-5 h-5 ${
                    isSelected ? 'text-blue-600' : 'text-gray-600'
                  }`} 
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Sélection de couleur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Couleur
          {selectedColorName && (
            <span className="text-xs text-gray-500 ml-2">
              Sélectionnée: {selectedColorName}
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map(({ name, value }) => {
            const isSelected = selectedColorName === name;
            
            return (
              <button
                key={name}
                type="button"
                onClick={() => handleColorSelect(name)}
                disabled={disabled}
                className={`
                  w-8 h-8 rounded-full transition-all duration-200 ease-in-out
                  transform hover:scale-110 active:scale-95
                  ${COLOR_CLASSES.bg[name]}
                  ${isSelected 
                    ? `ring-2 ring-offset-2 ${COLOR_CLASSES.ring[name]} shadow-md` 
                    : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-gray-300'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ backgroundColor: value }}
                title={name}
              />
            );
          })}
        </div>
      </div>

      {/* Aperçu de la sélection */}
      <div className="pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Aperçu
        </label>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {selectedIconName && (
            <>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: COLOR_PALETTE.find(c => c.name === selectedColorName)?.value + '20',
                  border: `2px solid ${COLOR_PALETTE.find(c => c.name === selectedColorName)?.value}20`
                }}
              >
                {React.createElement(getIconComponent(selectedIconName), {
                  className: "w-5 h-5",
                  style: { 
                    color: COLOR_PALETTE.find(c => c.name === selectedColorName)?.value 
                  }
                })}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Icône: {selectedIconName}
                </p>
                <p className="text-xs text-gray-500">
                  Couleur: {selectedColorName}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IconPicker;