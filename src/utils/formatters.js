// src/utils/formatters.js

export const formatCurrency = (amount, currency = 'EUR', locale = 'fr-FR') => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) return `0 ${currency}`;

  return numericAmount.toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
};
