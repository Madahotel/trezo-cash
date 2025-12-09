import { useMemo } from "react";
import { expandVatEntries } from '../pages/clients/analyse/ExpenseAnalysisView';

// Fonctions utilitaires pour la génération des paiements TVA et taxes
const generateVatPaymentEntries = (entries, period, vatRegime, activeProjectId) => {
    if (!entries || !Array.isArray(entries) || !vatRegime || !activeProjectId) return [];
    
    try {
        const periodStart = new Date(period.startDate);
        const periodEnd = new Date(period.endDate);
        
        // Filtrer les entrées qui ont de la TVA et qui sont dans la période
        const vatEntries = entries.filter(entry => {
            if (!entry.amount || entry.is_vat_child || entry.is_vat_payment) return false;
            
            // Vérifier si l'entrée a de la TVA
            const hasVat = entry.vat_rate > 0 || entry.vat_amount > 0;
            if (!hasVat) return false;
            
            // Vérifier si l'entrée est dans la période
            if (entry.startDate && entry.endDate) {
                return entry.startDate <= periodEnd && entry.endDate >= periodStart;
            }
            
            return false;
        });
        
        if (vatEntries.length === 0) return [];
        
        // Calculer le total TVA pour la période
        const totalVat = vatEntries.reduce((sum, entry) => {
            // Calculer la partie de la TVA qui tombe dans cette période
            if (entry.vat_amount && entry.startDate && entry.endDate) {
                const entryDuration = entry.endDate - entry.startDate;
                const periodOverlapStart = Math.max(entry.startDate, periodStart);
                const periodOverlapEnd = Math.min(entry.endDate, periodEnd);
                
                if (periodOverlapStart < periodOverlapEnd) {
                    const overlapDuration = periodOverlapEnd - periodOverlapStart;
                    const proportion = overlapDuration / entryDuration;
                    return sum + (entry.vat_amount * proportion);
                }
            }
            return sum;
        }, 0);
        
        if (totalVat <= 0) return [];
        
        // Créer l'entrée de paiement TVA
        return [{
            id: `vat_payment_${period.startDate.toISOString()}_${activeProjectId}`,
            category: "TVA à payer",
            supplier: "État",
            description: `Paiement TVA - ${period.label}`,
            type: 'sortie',
            amount: totalVat,
            vat_amount: 0, // Pas de TVA sur la TVA
            is_vat_payment: true,
            isProvision: false,
            startDate: periodStart,
            endDate: periodEnd,
            vat_regime: vatRegime.name,
            period_label: period.label,
            associatedEntries: vatEntries.map(e => e.id)
        }];
    } catch (error) {
        console.error('Error generating VAT payment entries:', error);
        return [];
    }
};

const generateTaxPaymentEntries = (actualTransactions, taxPeriod, taxConfig) => {
    if (!actualTransactions || !Array.isArray(actualTransactions) || !taxConfig) return [];
    
    try {
        const periodStart = new Date(taxPeriod.startDate);
        const periodEnd = new Date(taxPeriod.endDate);
        
        // Filtrer les transactions qui sont soumises à cette taxe et dans la période
        const taxableTransactions = actualTransactions.filter(transaction => {
            if (!transaction.date || !transaction.amount) return false;
            
            const transactionDate = new Date(transaction.date);
            const inPeriod = transactionDate >= periodStart && transactionDate < periodEnd;
            
            // Vérifier si la transaction est soumise à cette taxe
            // (Cette logique dépend de votre structure de données)
            const isSubjectToTax = transaction.tax_type === taxConfig.tax_type || 
                                  transaction.category_id === taxConfig.category_id;
            
            return inPeriod && isSubjectToTax;
        });
        
        if (taxableTransactions.length === 0) return [];
        
        // Calculer le montant de la taxe
        const taxAmount = taxableTransactions.reduce((sum, transaction) => {
            const transactionTax = (transaction.amount * (taxConfig.rate || 0)) / 100;
            return sum + transactionTax;
        }, 0);
        
        if (taxAmount <= 0) return [];
        
        // Créer l'entrée de paiement de taxe
        return [{
            id: `tax_payment_${taxConfig.tax_type}_${periodStart.toISOString()}`,
            category: `${taxConfig.tax_name} à payer`,
            supplier: "État",
            description: `Paiement ${taxConfig.tax_name} - ${taxPeriod.label}`,
            type: 'sortie',
            amount: taxAmount,
            is_tax_payment: true,
            isProvision: false,
            startDate: periodStart,
            endDate: periodEnd,
            tax_type: taxConfig.tax_type,
            tax_rate: taxConfig.rate,
            period_label: taxPeriod.label,
            associatedTransactions: taxableTransactions.map(t => t.id)
        }];
    } catch (error) {
        console.error('Error generating tax payment entries:', error);
        return [];
    }
};

const getDeclarationPeriods = (year, periodicity) => {
    if (!year || !periodicity) return [];
    
    const periods = [];
    
    switch (periodicity) {
        case 'monthly':
            for (let month = 0; month < 12; month++) {
                const startDate = new Date(year, month, 1);
                const endDate = new Date(year, month + 1, 0);
                periods.push({
                    startDate,
                    endDate,
                    label: `Mois ${month + 1} ${year}`
                });
            }
            break;
            
        case 'quarterly':
            for (let quarter = 0; quarter < 4; quarter++) {
                const startMonth = quarter * 3;
                const startDate = new Date(year, startMonth, 1);
                const endDate = new Date(year, startMonth + 3, 0);
                periods.push({
                    startDate,
                    endDate,
                    label: `T${quarter + 1} ${year}`
                });
            }
            break;
            
        case 'annually':
            periods.push({
                startDate: new Date(year, 0, 1),
                endDate: new Date(year, 11, 31),
                label: `Année ${year}`
            });
            break;
            
        default:
            console.warn('Unknown periodicity:', periodicity);
    }
    
    return periods;
};

export const useProcessedEntries = (budgetEntries, actualTransactions, categories, vatRegimes, taxConfigs, activeProjectId, periods, isConsolidated, isCustomConsolidated) => {
    return useMemo(() => {
        console.log('🔧 useProcessedEntries called with:', {
            budgetEntriesCount: budgetEntries?.length || 0,
            actualTransactionsCount: actualTransactions?.length || 0,
            categoriesCount: Object.keys(categories || {}).length,
            periodsCount: periods?.length || 0,
            isConsolidated,
            isCustomConsolidated,
            activeProjectId
        });
        
        if (!categories) {
            console.warn('No categories provided to useProcessedEntries');
            return [];
        }
        
        // Gestion sécurisée de expandVatEntries
        let expanded;
        try {
            expanded = expandVatEntries(budgetEntries, categories);
            console.log('📈 Expanded entries:', expanded?.length || 0);
        } catch (error) {
            console.error('Error expanding VAT entries:', error);
            expanded = [];
        }
        
        // S'assurer que expanded est itérable
        const safeExpanded = Array.isArray(expanded) ? expanded : [];
        let dynamicEntries = [...safeExpanded];
        
        console.log('📊 Initial dynamic entries:', dynamicEntries.length);

        // Si c'est une vue consolidée ou sans périodes, retourner simplement les entrées étendues
        if (isConsolidated || isCustomConsolidated || !periods || periods.length === 0) {
            console.log('⚠️ Returning early (consolidated/no periods)');
            return dynamicEntries;
        }

        // Génération des entrées TVA
        const vatRegime = vatRegimes?.[activeProjectId];
        if (vatRegime) {
            console.log('💰 Processing VAT for regime:', vatRegime.name);
            const dynamicVatEntries = periods.flatMap(period => {
                const vatEntries = generateVatPaymentEntries(safeExpanded, period, vatRegime, activeProjectId) || [];
                if (vatEntries.length > 0) {
                    console.log(`✅ Generated ${vatEntries.length} VAT entries for ${period.label}`);
                }
                return vatEntries;
            });
            dynamicEntries.push(...dynamicVatEntries);
            console.log('📋 Total VAT entries added:', dynamicVatEntries.length);
        } else {
            console.log('ℹ️ No VAT regime found for project:', activeProjectId);
        }

        // Génération des entrées de taxes
        const safeTaxConfigs = Array.isArray(taxConfigs) ? taxConfigs : [];
        if (safeTaxConfigs.length > 0) {
            console.log('💰 Processing', safeTaxConfigs.length, 'tax configs');
            const currentYear = periods[0]?.startDate?.getFullYear();
            if (currentYear) {
                const dynamicTaxEntries = safeTaxConfigs.flatMap(taxConfig => {
                    const taxPeriods = getDeclarationPeriods(currentYear, taxConfig.declaration_periodicity) || [];
                    console.log(`📅 Tax periods for ${taxConfig.tax_name}:`, taxPeriods.length);
                    
                    return taxPeriods.flatMap(taxPeriod => {
                        const overlaps = periods.some(p => {
                            if (!p?.startDate || !taxPeriod?.endDate) return false;
                            return p.startDate < taxPeriod.endDate && p.endDate > taxPeriod.startDate;
                        });
                        
                        if (overlaps) {
                            const taxEntries = generateTaxPaymentEntries(actualTransactions, taxPeriod, taxConfig) || [];
                            if (taxEntries.length > 0) {
                                console.log(`✅ Generated ${taxEntries.length} tax entries for ${taxConfig.tax_name} - ${taxPeriod.label}`);
                            }
                            return taxEntries;
                        }
                        return [];
                    });
                });
                dynamicEntries.push(...dynamicTaxEntries);
                console.log('📋 Total tax entries added:', dynamicTaxEntries.length);
            }
        } else {
            console.log('ℹ️ No tax configs provided');
        }

        console.log('🎯 Final processed entries count:', dynamicEntries.length);
        
        // Log quelques exemples pour le débogage
        if (dynamicEntries.length > 0) {
            console.log('📝 Sample processed entries:', dynamicEntries.slice(0, 3).map(e => ({
                id: e.id,
                category: e.category,
                type: e.type,
                amount: e.amount,
                is_vat_payment: e.is_vat_payment,
                is_tax_payment: e.is_tax_payment
            })));
        }
        
        return dynamicEntries;
    }, [budgetEntries, actualTransactions, categories, vatRegimes, taxConfigs, activeProjectId, periods, isConsolidated, isCustomConsolidated]);
};