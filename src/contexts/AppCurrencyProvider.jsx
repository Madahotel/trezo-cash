import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiGet } from "../components/context/actionsMethode";

const AppCurrencyContext = createContext(null);

export const DEFAULT_APP_CURRENCY = "EUR";

export const AppCurrencyProvider = ({ children }) => {
  const [appCurrency, setAppCurrency] = useState(DEFAULT_APP_CURRENCY);
  const [exchangeRates, setExchangeRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesLastUpdated, setRatesLastUpdated] = useState(null);

  // Charger la devise utilisée dans l'application
  useEffect(() => {
    const storedCurrency = localStorage.getItem("app_currency");
    if (storedCurrency) {
      setAppCurrency(storedCurrency);
    }
  }, []);

  // Sauvegarder la devise utilisée
  useEffect(() => {
    localStorage.setItem("app_currency", appCurrency);
  }, [appCurrency]);

  // Charger les taux de change depuis le backend
  // Dans AppCurrencyProvider.jsx, modifiez fetchExchangeRates :
  const fetchExchangeRates = useCallback(async () => {
    try {
      setRatesLoading(true);
      const rates = await apiGet('/exchange-rates');

      // Transformer le format
      const ratesMap = {};
      rates.forEach(rate => {
        ratesMap[`${rate.base_currency}_${rate.target_currency}`] = rate.rate;
      });

      setExchangeRates(ratesMap);
      setRatesLastUpdated(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement des taux de change:', error);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  // Convertir un montant d'une devise à une autre
  const convertCurrency = useCallback((amount, fromCurrency, toCurrency) => {
    if (!amount || fromCurrency === toCurrency) return amount;
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) return amount;

    try {
      // Si EUR est la devise de base (comme dans votre API)
      const fromRate = exchangeRates[`EUR_${fromCurrency}`];
      const toRate = exchangeRates[`EUR_${toCurrency}`];

      if (fromRate && toRate) {
        // Convertir via EUR
        const amountInEUR = amount / fromRate;
        return amountInEUR * toRate;
      }

      // Fallback: chercher un taux direct
      const directRate = exchangeRates[`${fromCurrency}_${toCurrency}`];
      if (directRate) {
        return amount * directRate;
      }

      return amount; // Retourner le montant original si pas de taux trouvé
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      return amount;
    }
  }, [exchangeRates]);

  // Convertir vers la devise de l'application
  const convertToAppCurrency = useCallback((amount, fromCurrency) => {
    return convertCurrency(amount, fromCurrency, appCurrency);
  }, [convertCurrency, appCurrency]);

  // Mettre à jour les taux (pour admin ou rafraîchissement manuel)
  const refreshExchangeRates = useCallback(async () => {
    try {
      await apiGet('/exchange-rates/update');
      await fetchExchangeRates(); // Recharger après mise à jour
    } catch (error) {
      console.error('Erreur lors de la mise à jour des taux:', error);
    }
  }, [fetchExchangeRates]);

  // Charger les taux au montage du composant
  useEffect(() => {
    fetchExchangeRates();

    // Rafraîchir les taux toutes les 24h
    const interval = setInterval(fetchExchangeRates, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchExchangeRates]);

  // Fonction de formatage avec conversion automatique
  const formatCurrency = useCallback((amount, originalCurrency, locale = "fr-FR") => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      return `0 ${appCurrency}`;
    }

    // Convertir si nécessaire
    let finalAmount = numericAmount;
    if (originalCurrency && originalCurrency !== appCurrency) {
      finalAmount = convertToAppCurrency(numericAmount, originalCurrency);
    }

    return finalAmount.toLocaleString(locale, {
      style: "currency",
      currency: appCurrency,
      minimumFractionDigits: 2,
    });
  }, [appCurrency, convertToAppCurrency]);

  return (
    <AppCurrencyContext.Provider
      value={{
        // Devise de l'application
        appCurrency,
        setAppCurrency,

        // Taux de change
        exchangeRates,
        ratesLoading,
        ratesLastUpdated,
        refreshExchangeRates,

        // Fonctions de conversion
        convertCurrency,
        convertToAppCurrency,
        formatCurrency,

        // Pour compatibilité (si d'autres composants utilisent encore useSettings pour la devise)
        selectedCurrency: appCurrency,
        setSelectedCurrency: setAppCurrency,
      }}
    >
      {children}
    </AppCurrencyContext.Provider>
  );
};

export const useAppCurrency = () => {
  const context = useContext(AppCurrencyContext);
  if (!context) {
    throw new Error("useAppCurrency must be used inside AppCurrencyProvider");
  }
  return context;
};