
const calculationCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const getCachedResult = (key, calculationFn, dependencies) => {
  const cacheKey = `${key}-${JSON.stringify(dependencies)}`;
  const cached = calculationCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }
  
  const result = calculationFn();
  calculationCache.set(cacheKey, { result, timestamp: Date.now() });
  
  // Nettoyer le cache périodiquement
  if (calculationCache.size > 100) {
    const firstKey = calculationCache.keys().next().value;
    calculationCache.delete(firstKey);
  }
  
  return result;
};

export const getStartOfWeek = (date) => { 
    const d = new Date(date); 
    const day = d.getDay(); 
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    d.setHours(0, 0, 0, 0); 
    return new Date(d.setDate(diff)); 
};

export const getWeeksInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const firstWeekDay = firstDay.getDay() || 7; // 1=lundi, 7=dimanche
    const daysInMonth = lastDay.getDate();
    
    return Math.ceil((daysInMonth + firstWeekDay - 1) / 7);
};

export const getEntryAmountForMonth = (entry, monthIndex, year) => {
    const cacheKey = `monthly-${entry.id}-${year}-${monthIndex}`;
    
    return getCachedResult(cacheKey, () => {
        const targetMonthStart = new Date(year, monthIndex, 1);
        const targetMonthEnd = new Date(year, monthIndex + 1, 0);

        if (entry.isProvision || entry.frequency === 'irregulier') {
            if (!entry.payments?.length) return 0;
            
            let total = 0;
            for (let i = 0; i < entry.payments.length; i++) {
                const payment = entry.payments[i];
                if (!payment.date || !payment.amount) continue;
                
                const paymentDate = new Date(payment.date);
                if (paymentDate.getFullYear() === year && paymentDate.getMonth() === monthIndex) {
                    total += parseFloat(payment.amount);
                }
            }
            return total;
        }

        if (entry.frequency === 'ponctuel') {
            if (!entry.date) return 0;
            const entryDate = new Date(entry.date);
            return entryDate.getFullYear() === year && entryDate.getMonth() === monthIndex ? 
                   parseFloat(entry.amount) : 0;
        }

        if (!entry.startDate) return 0;
        const startDate = new Date(entry.startDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = entry.endDate ? new Date(entry.endDate) : null;
        if (endDate) endDate.setHours(23, 59, 59, 999);

        if (targetMonthEnd < startDate || (endDate && targetMonthStart > endDate)) return 0;

        const entryAmount = parseFloat(entry.amount);
        
        switch (entry.frequency) {
            case 'journalier': 
                return entryAmount * targetMonthEnd.getDate();
            case 'mensuel': 
                return entryAmount;
            case 'hebdomadaire': 
                return entryAmount * getWeeksInMonth(year, monthIndex);
            case 'bimestriel': 
                return (monthIndex - startDate.getMonth()) % 2 === 0 && monthIndex >= startDate.getMonth() ? entryAmount : 0;
            case 'trimestriel': 
                return (monthIndex - startDate.getMonth()) % 3 === 0 && monthIndex >= startDate.getMonth() ? entryAmount : 0;
            case 'annuel': 
                return monthIndex === startDate.getMonth() ? entryAmount : 0;
            default: 
                return 0;
        }
    }, [entry, monthIndex, year]);
};

const addMonths = (date, months) => {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== day) {
        d.setDate(0);
    }
    return d;
};

export const getEntryAmountForPeriod = (entry, periodStart, periodEnd) => {
    if (!entry || !entry.amount || isNaN(entry.amount)) return 0;

    const cacheKey = `period-${entry.id}-${periodStart.getTime()}-${periodEnd.getTime()}`;
    
    return getCachedResult(cacheKey, () => {
        const entryAmount = parseFloat(entry.amount);

        if (entry.isProvision || entry.frequency === 'irregulier') {
            if (!entry.payments?.length) return 0;
            
            let total = 0;
            for (let i = 0; i < entry.payments.length; i++) {
                const payment = entry.payments[i];
                if (!payment.date || !payment.amount) continue;
                
                const paymentDate = new Date(payment.date);
                paymentDate.setHours(0, 0, 0, 0);
                if (paymentDate >= periodStart && paymentDate < periodEnd) {
                    total += parseFloat(payment.amount);
                }
            }
            return total;
        }

        if (entry.frequency === 'ponctuel') {
            if (!entry.date) return 0;
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            return (entryDate >= periodStart && entryDate < periodEnd) ? entryAmount : 0;
        }

        if (!entry.startDate) return 0;
        const startDate = new Date(entry.startDate);
        startDate.setHours(0, 0, 0, 0);

        const entryEndDate = entry.endDate ? new Date(entry.endDate) : null;
        if (entryEndDate) entryEndDate.setHours(23, 59, 59, 999);

        if (periodEnd <= startDate || (entryEndDate && periodStart > entryEndDate)) {
            return 0;
        }

        const frequency = entry.frequency;
        
        if (frequency === 'mensuel') {
            const monthDiff = (periodEnd.getFullYear() - startDate.getFullYear()) * 12 + 
                            (periodEnd.getMonth() - startDate.getMonth());
            
            if (monthDiff >= 0) {
                let count = 0;
                for (let i = 0; i <= monthDiff; i++) {
                    const currentDate = addMonths(new Date(startDate), i);
                    if (currentDate >= periodStart && currentDate < periodEnd && 
                        (!entryEndDate || currentDate <= entryEndDate)) {
                        count++;
                    }
                }
                return count * entryAmount;
            }
            return 0;
        }

        let totalAmount = 0;
        let currentDate = new Date(startDate);
        
        const incrementFns = {
            journalier: (d) => new Date(d.setDate(d.getDate() + 1)),
            hebdomadaire: (d) => new Date(d.setDate(d.getDate() + 7)),
            mensuel: (d) => addMonths(d, 1),
            bimestriel: (d) => addMonths(d, 2),
            trimestriel: (d) => addMonths(d, 3),
            annuel: (d) => addMonths(d, 12),
        };

        const incrementFn = incrementFns[frequency];
        if (!incrementFn || isNaN(currentDate.getTime())) return 0;

        while (currentDate < periodStart && (!entryEndDate || currentDate <= entryEndDate)) {
            const nextDate = incrementFn(new Date(currentDate));
            if (isNaN(nextDate.getTime()) || nextDate <= currentDate) break;
            if (nextDate > periodStart) break;
            currentDate = nextDate;
        }

        while (!entryEndDate || currentDate <= entryEndDate) {
            if (currentDate >= periodEnd) break;
            if (currentDate >= periodStart) {
                totalAmount += entryAmount;
            }
            const nextDate = incrementFn(new Date(currentDate));
            if (isNaN(nextDate.getTime()) || nextDate <= currentDate) break;
            currentDate = nextDate;
        }

        return totalAmount;
    }, [entry, periodStart, periodEnd]);
};

export const getActualAmountForPeriod = (entry, actualTransactions, periodStart, periodEnd) => {
    if (!entry) return 0;

    const cacheKey = `actual-${entry.id}-${periodStart.getTime()}-${periodEnd.getTime()}`;
    
    return getCachedResult(cacheKey, () => {
        let total = 0;
        
        for (let i = 0; i < actualTransactions.length; i++) {
            const actual = actualTransactions[i];
            if (actual.budgetId !== entry.id) continue;
            
            const payments = actual.payments || [];
            for (let j = 0; j < payments.length; j++) {
                const payment = payments[j];
                const paymentDate = new Date(payment.paymentDate);
                if (paymentDate >= periodStart && paymentDate < periodEnd) {
                    total += payment.paidAmount;
                }
            }
        }
        
        return total;
    }, [entry, actualTransactions, periodStart, periodEnd]);
};

export const expandVatEntries = (entries, categories) => {
    if (!entries || !categories) return [];

    const cacheKey = `vat-expand-${entries.length}-${categories.version || '1.0'}`;
    
    return getCachedResult(cacheKey, () => {
        const tvaCollectedCategoryName = 'TVA collectée';
        const tvaDeductibleCategoryName = 'TVA déductible';
        const expanded = [];
        
        // 🔥 OPTIMISATION: Boucle for classique plus rapide
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            
            if (entry.amount_type === 'ht' && entry.vat_rate_id && 
                entry.ht_amount != null && entry.ttc_amount != null) {
                
                const isRevenue = entry.type === 'revenu';
                const vatAmount = entry.ttc_amount - entry.ht_amount;

                if (Math.abs(vatAmount) > 0.01) { // 🔥 Tolérance pour éviter les erreurs d'arrondi
                    // Main entry (HT part)
                    expanded.push({
                        ...entry,
                        amount: entry.ht_amount,
                        is_vat_parent: true,
                    });
                    
                    // Virtual VAT entry
                    expanded.push({
                        ...entry,
                        id: entry.id + '_vat',
                        category: isRevenue ? tvaCollectedCategoryName : tvaDeductibleCategoryName,
                        amount: vatAmount,
                        description: `TVA sur ${entry.supplier}`,
                        is_vat_child: true,
                        amount_type: 'ttc',
                        vat_rate_id: null,
                        ht_amount: vatAmount,
                        ttc_amount: vatAmount,
                    });
                } else {
                    expanded.push(entry);
                }
            } else {
                expanded.push(entry);
            }
        }
        
        return expanded;
    }, [entries, categories]);
};

export const generateVatPaymentEntries = (entries, period, vatRegime) => {
    if (!vatRegime || vatRegime.regime_type === 'franchise_en_base') {
        return [];
    }

    const cacheKey = `vat-payment-${period.startDate.getTime()}-${vatRegime.id}`;
    
    return getCachedResult(cacheKey, () => {
        let tvaCollected = 0;
        let tvaDeductible = 0;

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.category === 'TVA collectée') {
                tvaCollected += getEntryAmountForPeriod(entry, period.startDate, period.endDate);
            } else if (entry.category === 'TVA déductible') {
                tvaDeductible += getEntryAmountForPeriod(entry, period.startDate, period.endDate);
            }
        }

        const netVat = tvaCollected - tvaDeductible;

        if (Math.abs(netVat) < 0.01) {
            return [];
        }
        
        const paymentDueDate = new Date(period.endDate);
        paymentDueDate.setMonth(paymentDueDate.getMonth() + (vatRegime.payment_delay_months || 1));

        if (netVat > 0) {
            return [{
                id: `vat_payment_${period.startDate.getTime()}`,
                type: 'depense',
                category: 'TVA à payer',
                supplier: 'État - TVA',
                amount: netVat,
                frequency: 'ponctuel',
                date: paymentDueDate.toISOString().split('T')[0],
                startDate: paymentDueDate.toISOString().split('T')[0],
                is_vat_payment: true,
                description: `TVA à payer pour ${period.label}`
            }];
        } else {
            return [{
                id: `vat_credit_${period.startDate.getTime()}`,
                type: 'revenu',
                category: 'Crédit de TVA',
                supplier: 'État - TVA',
                amount: -netVat,
                frequency: 'ponctuel',
                date: paymentDueDate.toISOString().split('T')[0],
                startDate: paymentDueDate.toISOString().split('T')[0],
                is_vat_payment: true,
                description: `Crédit de TVA pour ${period.label}`
            }];
        }
    }, [entries, period, vatRegime]);
};

export const getDeclarationPeriods = (year, periodicity) => {
    const cacheKey = `declaration-periods-${year}-${periodicity}`;
    
    return getCachedResult(cacheKey, () => {
        const periods = [];
        switch (periodicity) {
            case 'monthly':
                for (let i = 0; i < 12; i++) {
                    periods.push({
                        startDate: new Date(year, i, 1),
                        endDate: new Date(year, i + 1, 0)
                    });
                }
                break;
            case 'quarterly':
                for (let i = 0; i < 4; i++) {
                    periods.push({
                        startDate: new Date(year, i * 3, 1),
                        endDate: new Date(year, i * 3 + 3, 0)
                    });
                }
                break;
            case 'annually':
                periods.push({
                    startDate: new Date(year, 0, 1),
                    endDate: new Date(year, 11, 31)
                });
                break;
        }
        return periods;
    }, [year, periodicity]);
};

export const generateTaxPaymentEntries = (actuals, period, taxConfig) => {
    if (!taxConfig || taxConfig.rate <= 0) {
        return [];
    }

    const cacheKey = `tax-payment-${period.startDate.getTime()}-${taxConfig.id}`;
    
    return getCachedResult(cacheKey, () => {
        const { startDate, endDate } = period;
        let baseAmount = 0;

        switch (taxConfig.base_type) {
            case 'revenue':
                for (let i = 0; i < actuals.length; i++) {
                    const actual = actuals[i];
                    if (actual.type === 'receivable') {
                        const payments = actual.payments || [];
                        for (let j = 0; j < payments.length; j++) {
                            const payment = payments[j];
                            const pDate = new Date(payment.paymentDate);
                            if (pDate >= startDate && pDate < endDate) {
                                baseAmount += payment.paidAmount;
                            }
                        }
                    }
                }
                break;
                
            case 'profit':
                let revenue = 0;
                let expense = 0;
                
                for (let i = 0; i < actuals.length; i++) {
                    const actual = actuals[i];
                    const payments = actual.payments || [];
                    
                    for (let j = 0; j < payments.length; j++) {
                        const payment = payments[j];
                        const pDate = new Date(payment.paymentDate);
                        if (pDate >= startDate && pDate < endDate) {
                            if (actual.type === 'receivable') {
                                revenue += payment.paidAmount;
                            } else if (actual.type === 'payable') {
                                expense += payment.paidAmount;
                            }
                        }
                    }
                }
                
                baseAmount = revenue - expense;
                break;
                
            case 'salary':
                const salarySubCategory = 'Salaires, traitements et charges';
                for (let i = 0; i < actuals.length; i++) {
                    const actual = actuals[i];
                    if (actual.type === 'payable' && actual.category === salarySubCategory) {
                        const payments = actual.payments || [];
                        for (let j = 0; j < payments.length; j++) {
                            const payment = payments[j];
                            const pDate = new Date(payment.paymentDate);
                            if (pDate >= startDate && pDate < endDate) {
                                baseAmount += payment.paidAmount;
                            }
                        }
                    }
                }
                break;
            default:
                baseAmount = 0;
        }

        if (baseAmount <= 0) {
            return [];
        }

        const taxAmount = baseAmount * (taxConfig.rate / 100);

        if (taxAmount <= 0) {
            return [];
        }
        
        const paymentDueDate = new Date(endDate);
        paymentDueDate.setMonth(paymentDueDate.getMonth() + (taxConfig.payment_delay_months || 1));

        return [{
            id: `tax_payment_${taxConfig.id}_${period.startDate.getTime()}`,
            type: 'depense',
            category: taxConfig.name,
            supplier: `État - ${taxConfig.name}`,
            amount: taxAmount,
            frequency: 'ponctuel',
            date: paymentDueDate.toISOString().split('T')[0],
            startDate: paymentDueDate.toISOString().split('T')[0],
            is_tax_payment: true,
            description: `${taxConfig.name} pour ${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`
        }];
    }, [actuals, period, taxConfig]);
};

//  Fonction pour vider le cache si nécessaire
export const clearBudgetCalculationsCache = () => {
    calculationCache.clear();
};