import React from 'react';
import * as LucideIcons from 'lucide-react';

// Configuration centralisée des icônes disponibles
const AVAILABLE_ICONS = [
  'Home', 'Briefcase', 'Plane', 'Heart', 'Coffee', 'HeartHandshake', 
  'Book', 'PiggyBank', 'Car', 'Building2', 'ShoppingBasket', 'Gift',
  'Utensils', 'Film', 'Music', 'Dumbbell', 'GraduationCap', 'Stethoscope',
  'ShoppingCart', 'Wifi', 'Smartphone', 'Laptop', 'Camera', 'Gamepad2'
];

const DynamicIcon = ({ iconName, color = 'currentColor', size = 16, className = '' }) => {
  // Récupérer le composant d'icône dynamiquement
  const getIconComponent = (name) => {
    const IconComponent = LucideIcons[name];
    return IconComponent || LucideIcons.Briefcase; // Fallback
  };

  const IconComponent = getIconComponent(iconName);

  return (
    <IconComponent 
      className={`w-${size} h-${size} ${className}`} 
      style={{ color }} 
    />
  );
};

export default DynamicIcon;