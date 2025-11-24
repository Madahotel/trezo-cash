import React, { createContext, useContext, useState, useEffect } from 'react';
import themeService from '../../services/themeService';
import { apiGet } from './actionsMethode';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem('selectedCurrency') || 'EUR';
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'fr';
  });

  const [theme, setTheme] = useState(() => {
    return themeService.getCurrentTheme().id;
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('selectedCurrency', selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    themeService.setCurrentTheme(theme);
  }, [theme]);

  // Initialize theme on mount
  useEffect(() => {
    themeService.initializeTheme();
  }, []);

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await apiGet('/currencies');
        setCurrencies(res.currencies);
      } catch (error) {
        console.log(error);
      }
    };
    fetchdata();
  }, []);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
  ];

  const getCurrencyByCode = (code) => {
    return currencies.find((c) => c.code === code) || currencies[0];
  };

  const getCurrentLanguage = () => {
    return languages.find((l) => l.code === language) || languages[0];
  };

  const getCurrentCurrency = () => {
    return getCurrencyByCode(selectedCurrency);
  };

  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        currencies,
        setCurrencies,
        selectedCurrency,
        setSelectedCurrency,
        theme,
        setTheme,
        languages,
        getCurrentLanguage,
        getCurrencyByCode,
        getCurrentCurrency,
        // Theme functions
        getCurrentTheme: () => themeService.getCurrentTheme(),
        getAllThemes: () => themeService.getAllThemes(),
        getThemeIcon: (context) => themeService.getThemeIcon(context),
        previewTheme: (themeId) => themeService.previewTheme(themeId),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
