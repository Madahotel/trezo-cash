import React, { createContext, useContext, useState, useEffect } from 'react';
import themeService from '../../services/themeService';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'fr';
  });

  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('currency') || 'EUR';
  });

  const [theme, setTheme] = useState(() => {
    return themeService.getCurrentTheme().id;
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  useEffect(() => {
    themeService.setCurrentTheme(theme);
  }, [theme]);

  // Initialize theme on mount
  useEffect(() => {
    themeService.initializeTheme();
  }, []);

  const currencies = [
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'USD', symbol: '$', name: 'Dollar américain' },
    { code: 'GBP', symbol: '£', name: 'Livre sterling' },
    { code: 'CHF', symbol: 'CHF', name: 'Franc suisse' },
    { code: 'CAD', symbol: 'CA$', name: 'Dollar canadien' },
    { code: 'JPY', symbol: '¥', name: 'Yen japonais' },
    { code: 'CNY', symbol: '¥', name: 'Yuan chinois' },
    { code: 'AUD', symbol: 'A$', name: 'Dollar australien' },
    { code: 'MGA', symbol: 'Ar', name: 'Ariary malgache' },
    { code: 'MAD', symbol: 'DH', name: 'Dirham marocain' },
    { code: 'XOF', symbol: 'CFA', name: 'Franc CFA' },
    { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA (BEAC)' },
    { code: 'BRL', symbol: 'R$', name: 'Real brésilien' },
    { code: 'MXN', symbol: 'MX$', name: 'Peso mexicain' },
    { code: 'INR', symbol: '₹', name: 'Roupie indienne' },
    { code: 'RUB', symbol: '₽', name: 'Rouble russe' },
    { code: 'TRY', symbol: '₺', name: 'Livre turque' },
    { code: 'ZAR', symbol: 'R', name: 'Rand sud-africain' },
    { code: 'KRW', symbol: '₩', name: 'Won sud-coréen' },
    { code: 'SEK', symbol: 'kr', name: 'Couronne suédoise' },
    { code: 'NOK', symbol: 'kr', name: 'Couronne norvégienne' },
    { code: 'DKK', symbol: 'kr', name: 'Couronne danoise' },
    { code: 'PLN', symbol: 'zł', name: 'Zloty polonais' },
    { code: 'THB', symbol: '฿', name: 'Baht thaïlandais' },
    { code: 'SGD', symbol: 'S$', name: 'Dollar de Singapour' },
    { code: 'HKD', symbol: 'HK$', name: 'Dollar de Hong Kong' },
    { code: 'NZD', symbol: 'NZ$', name: 'Dollar néo-zélandais' },
  ];

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
  ];

  const formatCurrency = (amount, currencyCode = null) => {
    const currCode = currencyCode || currency;
    const curr = currencies.find(c => c.code === currCode);
    if (!curr) return `${amount.toLocaleString()} €`;
    
    return `${amount.toLocaleString()} ${curr.symbol}`;
  };

  const getCurrencyByCode = (code) => {
    return currencies.find(c => c.code === code) || currencies[0];
  };

  const getCurrentLanguage = () => {
    return languages.find(l => l.code === language) || languages[0];
  };

  const getCurrentCurrency = () => {
    return currencies.find(c => c.code === currency) || currencies[0];
  };

  return (
    <SettingsContext.Provider value={{
      language,
      setLanguage,
      currency,
      setCurrency,
      theme,
      setTheme,
      currencies,
      languages,
      formatCurrency,
      getCurrentLanguage,
      getCurrentCurrency,
      getCurrencyByCode,
      // Theme functions
      getCurrentTheme: () => themeService.getCurrentTheme(),
      getAllThemes: () => themeService.getAllThemes(),
      getThemeIcon: (context) => themeService.getThemeIcon(context),
      previewTheme: (themeId) => themeService.previewTheme(themeId)
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
