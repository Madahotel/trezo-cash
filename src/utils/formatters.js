// src/utils/formatters.js

// export const formatCurrency = (amount, currency = 'EUR', locale = 'fr-FR') => {
//   const numericAmount = Number(amount);
//   if (isNaN(numericAmount)) return `0 ${currency}`;

//   return numericAmount.toLocaleString(locale, {
//     style: 'currency',
//     currency,
//     minimumFractionDigits: 2,
//   });
// };

// src/utils/formatters.js
import { useAppCurrency } from '../contexts/AppCurrencyProvider'; // ou le chemin correct

// Hook personnalisé pour le formatage
export const useCurrencyFormatter = () => {
  const { formatCurrency } = useAppCurrency();
  return { formatCurrency };
};

// Version standard (pour les composants sans accès au contexte)
export const formatCurrency = (amount, currencyCode, locale = "fr-FR") => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    return `0 ${currencyCode}`;
  }

  return numericAmount.toLocaleString(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  });
};
