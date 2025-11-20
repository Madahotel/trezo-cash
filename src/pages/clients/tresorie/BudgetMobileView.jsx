import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayInTimezone } from '../../../utils/getTodayInTimezone.js';
import { useProcessedEntries } from '../../../hooks/useProcessedEntries.jsx';
import { formatCurrency } from '../../../utils/formatting.js';

/**
 * Calcule le montant budgété d'une entrée pour une période donnée (version mobile)
 */
const calculateEntryAmountForPeriod = (entry, startDate, endDate) => {
    if (!entry || !entry.amount) return 0;
    
    // Logique simplifiée pour mobile
    if (entry.frequency === 'ponctuel') {
        const entryDate = new Date(entry.date);
        return (entryDate >= startDate && entryDate <= endDate) ? entry.amount : 0;
    }
    
    return entry.amount || 0;
};

/**
 * Composant de visualisation mobile du budget
 * Interface simplifiée pour les appareils mobiles
 */
const BudgetMobileView = ({
    finalBudgetEntries,
    finalActualTransactions,
    finalCategories,
    vatRegimes,
    taxConfigs,
    activeProjectId,
    isConsolidated,
    isCustomConsolidated,
    mobileMonthOffset,
    setMobileMonthOffset,
    settings,
    activeProject
}) => {
    const currencySettings = useMemo(() => ({
        currency: activeProject?.currency,
        displayUnit: activeProject?.display_unit,
        decimalPlaces: activeProject?.decimal_places,
    }), [activeProject]);

    /**
     * Calcule la période mobile actuelle
     */
    const mobilePeriod = useMemo(() => {
        const targetDate = new Date();
        targetDate.setDate(1);
        targetDate.setMonth(targetDate.getMonth() + mobileMonthOffset);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const periodStart = new Date(year, month, 1);
        const periodEnd = new Date(year, month + 1, 0);
        periodEnd.setHours(23, 59, 59, 999);
        return { 
            startDate: periodStart, 
            endDate: periodEnd,
            label: targetDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
        };
    }, [mobileMonthOffset, settings.timezoneOffset]);

    /**
     * Traite les entrées pour l'affichage mobile
     */
    const mobileProcessedEntries = useProcessedEntries(
        finalBudgetEntries || [],
        finalActualTransactions || [],
        finalCategories || {},
        vatRegimes || {},
        taxConfigs || [],
        activeProjectId,
        mobilePeriod ? [mobilePeriod] : [],
        isConsolidated,
        isCustomConsolidated
    );

    /**
     * Agrège les données par tiers pour l'affichage mobile
     */
    const mobileData = useMemo(() => {
        if (!mobilePeriod) return null;

        const { startDate, endDate } = mobilePeriod;
        const tiersData = new Map();

        // 1. Calculer les montants budgétisés par tiers
        mobileProcessedEntries.forEach(entry => {
            const tierName = entry.supplier;
            if (!tierName) return;

            const budgetAmount = calculateEntryAmountForPeriod(entry, startDate, endDate);

            if (budgetAmount !== 0) {
                if (!tiersData.has(tierName)) {
                    tiersData.set(tierName, { budget: 0, actual: 0, type: entry.type });
                }
                const data = tiersData.get(tierName);
                data.budget += entry.type === 'revenu' ? budgetAmount : -budgetAmount;
                data.type = entry.type;
            }
        });

        // 2. Calculer les montants réels par tiers
        finalActualTransactions.forEach(actual => {
            const tierName = actual.thirdParty;
            if (!tierName) return;

            const actualAmountInPeriod = (actual.payments || [])
                .filter(p => {
                    const paymentDate = new Date(p.paymentDate);
                    return paymentDate >= startDate && paymentDate <= endDate;
                })
                .reduce((sum, p) => sum + p.paidAmount, 0);

            if (actualAmountInPeriod > 0) {
                const type = actual.type === 'receivable' ? 'revenu' : 'depense';
                if (!tiersData.has(tierName)) {
                    tiersData.set(tierName, { budget: 0, actual: 0, type });
                }
                const data = tiersData.get(tierName);
                data.actual += type === 'revenu' ? actualAmountInPeriod : -actualAmountInPeriod;
                if (!tiersData.get(tierName).type) {
                    tiersData.get(tierName).type = type;
                }
            }
        });

        // 3. Convertir la Map en tableau et trier (Revenus avant Dépenses)
        const dataArray = Array.from(tiersData.entries())
            .map(([supplier, data]) => ({
                supplier,
                ...data,
                reste: data.budget - data.actual
            }))
            .filter(item => item.budget !== 0 || item.actual !== 0)
            .sort((a, b) => {
                if (a.type !== b.type) return a.type === 'revenu' ? -1 : 1;
                return a.supplier.localeCompare(b.supplier);
            });

        // 4. Calculer les totaux
        const totalBudget = dataArray.reduce((sum, item) => sum + item.budget, 0);
        const totalActual = dataArray.reduce((sum, item) => sum + item.actual, 0);
        const totalReste = totalBudget - totalActual;

        return {
            tiersData: dataArray,
            totals: { budget: totalBudget, actual: totalActual, reste: totalReste },
        };
    }, [mobilePeriod, mobileProcessedEntries, finalActualTransactions]);

    return (
        <div className="p-4">
            {/* En-tête de navigation mobile */}
            <div className="flex items-center justify-between mb-4">
                <button 
                    onClick={() => setMobileMonthOffset(mobileMonthOffset - 1)} 
                    className="p-2 rounded-full hover:bg-gray-100"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-gray-700">{mobilePeriod?.label}</h2>
                <button 
                    onClick={() => setMobileMonthOffset(mobileMonthOffset + 1)} 
                    className="p-2 rounded-full hover:bg-gray-100"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {mobileData && (
                <>
                    {/* Carte de résumé des flux */}
                    <div className="p-4 mb-4 border rounded-lg shadow-sm bg-gray-50">
                        <h3 className="mb-2 text-sm font-bold text-gray-600 uppercase">Flux de trésorerie net</h3>
                        <div className="grid grid-cols-3 gap-2 text-sm font-bold">
                            <div className="text-center">
                                <div className="text-gray-600">Prévu</div>
                                <div className={mobileData.totals.budget >= 0 ? 'text-gray-800' : 'text-red-600'}>
                                    {formatCurrency(mobileData.totals.budget, currencySettings)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-600">Réel</div>
                                <div className={mobileData.totals.actual >= 0 ? 'text-gray-800' : 'text-red-700'}>
                                    {formatCurrency(mobileData.totals.actual, currencySettings)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-600">Reste</div>
                                <div className={mobileData.totals.reste >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(mobileData.totals.reste, currencySettings)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Liste des tiers */}
                    {mobileData.tiersData.length > 0 ? (
                        <ul className="space-y-2">
                            {mobileData.tiersData.map(item => (
                                <li key={item.supplier} className="p-3 bg-white border rounded-lg shadow-sm">
                                    <div className="flex items-center justify-between font-semibold text-gray-800">
                                        <span className="truncate">{item.supplier}</span>
                                        <span className={`text-xs uppercase px-2 py-0.5 rounded flex-shrink-0 ml-2 ${
                                            item.type === 'revenu' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {item.type === 'revenu' ? 'Encaissement' : 'Décaissement'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                        <div className="text-center">
                                            <div className="text-gray-500">Prév.</div>
                                            <div className="font-medium text-gray-700">
                                                {formatCurrency(item.budget, currencySettings)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-gray-500">Réel</div>
                                            <div className="font-medium text-gray-700">
                                                {formatCurrency(item.actual, currencySettings)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-gray-500">Reste</div>
                                            <div className={`font-medium ${
                                                item.reste >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {formatCurrency(item.reste, currencySettings)}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            Aucune entrée ou transaction réelle pour cette période.
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BudgetMobileView;