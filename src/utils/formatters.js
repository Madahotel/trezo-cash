
export const formatCurrency = (amount, options = {}) => {
  console.log("formatCurrency amount:", amount);
  console.log("formatCurrency options:", options);

  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    console.warn("Amount is NaN:", amount);
    return "0";
  }

  const sessionCurrency = getSessionCurrency();
  console.log("Session currency:", sessionCurrency);

  const {
    currency,
    rate,
    locale = "fr-FR",
  } = {
    ...sessionCurrency,
    ...options,
  };

  console.log("Final currency:", currency);
  console.log("Final rate:", rate);

  const converted = numericAmount * rate;
  console.log("Converted amount:", converted);

  return converted.toLocaleString(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });
};

export const getSessionCurrency = () => {
  const raw = sessionStorage.getItem("session_currency");

  console.log("READ SESSION STORAGE:", raw);

  if (!raw) {
    console.warn("NO SESSION STORAGE FOUND, FALLBACK EUR");
    return { currency: "EUR", rate: 1 };
  }

  try {
    const parsed = JSON.parse(raw);
    console.log("PARSED SESSION CURRENCY:", parsed);

    return {
      currency: parsed.currency || "EUR",
      rate: Number(parsed.rate) || 1,
    };
  } catch (e) {
    console.error("SESSION STORAGE PARSE ERROR", e);
    return { currency: "EUR", rate: 1 };
  }
};

