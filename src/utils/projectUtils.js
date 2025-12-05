// utils/projectUtils.js
import React from 'react';
import {
    Building2,
    Home,
    Briefcase,
    ShoppingBag,
    Car,
    GraduationCap,
    Heart,
    Globe,
    Palette,
    Music,
    Code,
    Coffee,
    Truck,
    Plane,
    Ship,
    Banknote,
    Leaf,
    Camera,
    BookOpen,
    Utensils,
    Sparkles
} from 'lucide-react';

// Mapping simplifié des types de projets
const PROJECT_TYPES = {
    // Types principaux
    'business': { icon: Building2, color: 'blue' },
    'entreprise': { icon: Building2, color: 'blue' },
    'immobilier': { icon: Home, color: 'green' },
    'professionnel': { icon: Briefcase, color: 'purple' },
    'commerce': { icon: ShoppingBag, color: 'orange' },
    'transport': { icon: Car, color: 'red' },
    'éducation': { icon: GraduationCap, color: 'yellow' },
    'santé': { icon: Heart, color: 'pink' },
    'technologie': { icon: Code, color: 'indigo' },
    'finance': { icon: Banknote, color: 'emerald' },
    
    // Par défaut
    'default': { icon: Briefcase, color: 'gray' }
};

/**
 * Récupère l'icône React correspondant au type de projet
 */
export const getProjectIcon = (typeName) => {
    if (!typeName) return PROJECT_TYPES.default.icon;
    
    const normalizedType = typeName.toLowerCase().trim();
    
    // Chercher une correspondance
    for (const [key, value] of Object.entries(PROJECT_TYPES)) {
        if (normalizedType.includes(key) || key.includes(normalizedType)) {
            return value.icon;
        }
    }
    
    return PROJECT_TYPES.default.icon;
};

/**
 * Récupère la couleur associée au type de projet
 */
export const getProjectColor = (typeName) => {
    if (!typeName) return PROJECT_TYPES.default.color;
    
    const normalizedType = typeName.toLowerCase().trim();
    
    // Chercher une correspondance
    for (const [key, value] of Object.entries(PROJECT_TYPES)) {
        if (normalizedType.includes(key) || key.includes(normalizedType)) {
            return value.color;
        }
    }
    
    return PROJECT_TYPES.default.color;
};