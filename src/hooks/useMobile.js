import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour détecter si l'écran est en mode mobile
 * @param {number} breakpoint - Le breakpoint pour considérer comme mobile (défaut: 768px)
 * @returns {boolean} - true si l'écran est en mode mobile
 */
export const useMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // Vérifier la taille initiale
    checkScreenSize();

    // Écouter les changements de taille
    window.addEventListener('resize', checkScreenSize);

    // Nettoyer l'event listener
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [breakpoint]); // Re-créer l'effet si le breakpoint change

  return isMobile;
};

/**
 * Hook pour obtenir la largeur actuelle de l'écran
 * @returns {number} - La largeur actuelle de la fenêtre
 */
export const useWindowWidth = () => {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
};

/**
 * Hook pour détecter des breakpoints spécifiques
 * @param {Object} breakpoints - Objet avec les noms et valeurs des breakpoints
 * @returns {Object} - Objet avec les breakpoints actifs
 */
export const useBreakpoints = (
  breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  }
) => {
  const width = useWindowWidth();

  return Object.keys(breakpoints).reduce((acc, key) => {
    acc[key] = width <= breakpoints[key];
    return acc;
  }, {});
};
