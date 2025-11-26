import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayInTimezone } from '../../../utils/getTodayInTimezone.js';
import { useProcessedEntries } from '../../../hooks/useProcessedEntries.jsx';
import { formatCurrency } from '../../../utils/formatting.js';
import useRealBudgetData from '../../../hooks/useRealBudgetData.jsx';
import axios from '../../../components/config/Axios.jsx';

/**
 * Calcule le montant budgété d'une entrée pour une période donnée (version mobile)
 */
const calculateEntryAmountForPeriod = (entry, startDate, endDate) => {
    if (!entry || !entry.amount) return 0;
    
    // Logique simplifiée pour mobile
    const frequency = entry.frequency_name || entry.frequency;
    const freqLower = frequency?.toLowerCase();
    
    if (freqLower === 'ponctuel' || freqLower === 'ponctuelle') {
        const entryDate = new Date(entry.date || entry.start_date);
        return (entryDate >= startDate && entryDate <= endDate) ? entry.amount : 0;
    }
    
    return entry.amount || 0;
};

/**
 * Calcule le montant réel pour une période donnée (version mobile avec real_budget)
 */
const calculateActualAmountForPeriod = (entry, actualTransactions, startDate, endDate, realBudgetData = null) => {
    if (!entry) return 0;

    console.log('🔍 [MOBILE] Calcul réel pour:', entry.supplier, 'budget_id:', entry.budget_id, 'Période:', startDate.toISOString().split('T')[0], '-', endDate.toISOString().split('T')[0]);

    // PRIORITÉ 1: Données real_budget API
    if (realBudgetData?.real_budget_items?.data) {
        const realBudgetsForEntry = realBudgetData.real_budget_items.data.filter(rb => {
            const matchesBudget = rb.budget_id === entry.budget_id;
            
            // Vérification de la date de collection
            let matchesDate = false;
            if (rb.collection_date) {
                try {
                    const collectionDate = new Date(rb.collection_date);
                    collectionDate.setHours(0, 0, 0, 0);
                    
                    const periodStart = new Date(startDate);
                    periodStart.setHours(0, 0, 0, 0);
                    
                    const periodEnd = new Date(endDate);
                    periodEnd.setHours(23, 59, 59, 999);
                    
                    matchesDate = collectionDate >= periodStart && collectionDate <= periodEnd;
                    
                    console.log('📅 [MOBILE] Vérification date:', {
                        supplier: entry.supplier,
                        collection_date: rb.collection_date,
                        period_start: periodStart.toISOString(),
                        period_end: periodEnd.toISOString(),
                        matchesDate
                    });
                } catch (error) {
                    console.error('Erreur de parsing date:', error);
                }
            }

            const isMatch = matchesBudget && matchesDate;
            
            console.log('🔍 [MOBILE] Correspondance:', {
                supplier: entry.supplier,
                entry_budget_id: entry.budget_id,
                real_budget_id: rb.budget_id,
                matchesBudget,
                matchesDate,
                isMatch,
                collection_amount: rb.collection_amount
            });

            return isMatch;
        });

        console.log(`📊 [MOBILE] ${entry.supplier}: ${realBudgetsForEntry.length} collections dans cette période`);

        if (realBudgetsForEntry.length > 0) {
            const totalAmount = realBudgetsForEntry.reduce((sum, rb) => {
                const amount = parseFloat(rb.collection_amount) || 0;
                console.log(`💰 [MOBILE] ${entry.supplier}: ${amount} depuis real_budget`);
                return sum + amount;
            }, 0);

            console.log(`✅ [MOBILE] FINAL ${entry.supplier}: ${totalAmount}`);
            return totalAmount;
        }
    }

    console.log(`❌ [MOBILE] Aucune donnée real_budget pour ${entry.supplier}`);

    // PRIORITÉ 2: Paiements traditionnels
    const entryActuals = actualTransactions.filter(actual =>
        actual.budgetId === entry.id || actual.budgetId === entry.id.replace('_vat', '')
    );

    const paymentsAmount = entryActuals.reduce((sum, actual) => {
        const paymentsInPeriod = (actual.payments || []).filter(p => {
            try {
                const paymentDate = new Date(p.paymentDate);
                paymentDate.setHours(0, 0, 0, 0);
                
                const periodStart = new Date(startDate);
                periodStart.setHours(0, 0, 0, 0);
                
                const periodEnd = new Date(endDate);
                periodEnd.setHours(23, 59, 59, 999);
                
                return paymentDate >= periodStart && paymentDate <= periodEnd;
            } catch (error) {
                return false;
            }
        });
        return sum + paymentsInPeriod.reduce((paymentSum, p) => paymentSum + (p.paidAmount || 0), 0);
    }, 0);

    console.log(`💳 [MOBILE] Paiements traditionnels ${entry.supplier}: ${paymentsAmount}`);

    return paymentsAmount;
};

/**
 * Composant de visualisation mobile du budget
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

    // Récupération des données real_budget
    const { realBudgetData, loading: realBudgetLoading } = useRealBudgetData(activeProjectId);

    // États pour l'API (comme dans la vue desktop)
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProjectData = async (projectId) => {
        if (!projectId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/trezo-tables/projects/${projectId}`);
            const data = response.data;

            if (data && data.budgets) {
                setProjectData(data);
            } else {
                setProjectData({ budgets: { budget_items: [] } });
            }
        } catch (err) {
            console.error('❌ Erreur détaillée:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Récupération des données de l'API
    useEffect(() => {
        fetchProjectData(activeProjectId);
    }, [activeProjectId]);

    // Fonction pour traiter les données de l'API (identique à la vue desktop)
    const processBudgetItems = (budgetItems) => {
        if (!budgetItems || !Array.isArray(budgetItems)) return [];

        return budgetItems.map(item => {
            let type;
            if (item.category_type_name === 'Revenue') {
                type = 'entree';
            } else if (item.category_type_name === 'Dépense') {
                type = 'sortie';
            } else {
                type = item.budget_type_name === 'Entrée' ? 'entree' : 'sortie';
            }

            const id = item.budget_detail_id?.toString() || `budget_${item.budget_id}`;

            return {
                id: id,
                budget_id: item.budget_id,
                budget_detail_id: item.budget_detail_id,
                frequency_id: item.frequency_id,
                frequency_name: item.frequency_name,
                frequency: item.frequency_name,
                budget_amount: parseFloat(item.budget_amount) || 0,
                amount: parseFloat(item.budget_amount) || 0,
                start_date: item.start_date,
                end_date: item.end_date,
                is_duration_indefinite: item.is_duration_indefinite,
                budget_description: item.project_description,
                description: item.budget_description,
                project_id: item.project_id,
                project_name: item.project_name,
                project_description: item.project_description,
                budget_type_id: item.budget_type_id,
                budget_type_name: item.budget_type_name,
                user_third_party_id: item.user_third_party_id,
                third_party_name: item.third_party_name,
                third_party_firstname: item.third_party_firstname,
                supplier: `${item.third_party_firstname || ''} ${item.third_party_name || ''}`.trim() || 'Non spécifié',
                third_party_email: item.third_party_email,
                amount_type_id: item.amount_type_id,
                amount_type_name: item.amount_type_name,
                amount_type_description: item.amount_type_description,
                currency_id: item.currency_id,
                currency_name: item.currency_name,
                currency_code: item.currency_code,
                currency_symbol: item.currency_symbol,
                user_subscriber_id: item.user_subscriber_id,
                subscriber_name: item.subscriber_name,
                subscriber_firstname: item.subscriber_firstname,
                subscriber_email: item.subscriber_email,
                sub_category_id: item.sub_category_id,
                sub_category_name: item.sub_category_name,
                category: item.sub_category_name,
                criticity_id: item.criticity_id,
                criticity_name: item.criticity_name,
                category_id: item.category_id,
                category_name: item.category_name,
                category_type_id: item.category_type_id,
                category_type_name: item.category_type_name,
                entity_status_id: item.entity_status_id,
                entity_status_name: item.entity_status_name,
                type: type,
                isProvision: false,
                is_vat_child: false,
                is_vat_payment: false,
                is_tax_payment: false,
                date: item.start_date,
                startDate: item.start_date ? new Date(item.start_date) : null,
                endDate: item.end_date ? new Date(item.end_date) : null
            };
        });
    };

    // Utiliser les données récupérées de l'API (comme la vue desktop)
    const processedBudgetEntries = useMemo(() => {
        if (projectData && projectData.budgets && projectData.budgets.budget_items) {
            const processed = processBudgetItems(projectData.budgets.budget_items);
            console.log('📱 [MOBILE] Entrées traitées depuis API:', processed.length);
            return processed;
        }
        console.log('📱 [MOBILE] Utilisation des entrées finales:', finalBudgetEntries?.length || 0);
        return finalBudgetEntries || [];
    }, [projectData, finalBudgetEntries]);

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
     * Traite les entrées pour l'affichage mobile (avec les données de l'API)
     */
    const mobileProcessedEntries = useProcessedEntries(
        processedBudgetEntries, // ← Utiliser processedBudgetEntries au lieu de finalBudgetEntries
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

        console.log('📱 [MOBILE] Début calcul données mobiles');
        console.log('📱 [MOBILE] Données real_budget disponibles:', realBudgetData?.real_budget_items?.data?.length || 0);
        console.log('📱 [MOBILE] Entrées traitées:', mobileProcessedEntries.length);

        // 1. Calculer les montants budgétisés et réels par tiers
        mobileProcessedEntries.forEach(entry => {
            const tierName = entry.supplier;
            if (!tierName) return;

            const budgetAmount = calculateEntryAmountForPeriod(entry, startDate, endDate);
            const actualAmount = calculateActualAmountForPeriod(
                entry, 
                finalActualTransactions, 
                startDate, 
                endDate, 
                realBudgetData
            );

            console.log(`📱 [MOBILE] ${tierName}: Budget=${budgetAmount}, Réel=${actualAmount}, budget_id=${entry.budget_id}`);

            if (budgetAmount !== 0 || actualAmount !== 0) {
                if (!tiersData.has(tierName)) {
                    tiersData.set(tierName, { 
                        budget: 0, 
                        actual: 0, 
                        type: entry.type,
                        hasRealBudgetData: false,
                        budget_id: entry.budget_id
                    });
                }
                const data = tiersData.get(tierName);
                
                // Pour les revenus : montants positifs
                // Pour les dépenses : montants négatifs
                if (entry.type === 'revenu' || entry.type === 'entree') {
                    data.budget += budgetAmount;
                    data.actual += actualAmount;
                } else {
                    data.budget -= budgetAmount;
                    data.actual -= actualAmount;
                }
                
                // Marquer si des données real_budget sont utilisées
                if (actualAmount > 0 && realBudgetData?.real_budget_items?.data) {
                    const hasRealBudget = realBudgetData.real_budget_items.data.some(rb => 
                        rb.budget_id === entry.budget_id && 
                        rb.collection_date &&
                        new Date(rb.collection_date) >= startDate && 
                        new Date(rb.collection_date) <= endDate
                    );
                    data.hasRealBudgetData = hasRealBudget;
                }
            }
        });

        // 2. Convertir la Map en tableau et trier (Revenus avant Dépenses)
        const dataArray = Array.from(tiersData.entries())
            .map(([supplier, data]) => ({
                supplier,
                ...data,
                reste: data.budget - data.actual,
                // Déterminer le type basé sur le signe du budget
                displayType: data.budget >= 0 ? 'revenu' : 'depense'
            }))
            .filter(item => item.budget !== 0 || item.actual !== 0)
            .sort((a, b) => {
                if (a.displayType !== b.displayType) return a.displayType === 'revenu' ? -1 : 1;
                return a.supplier.localeCompare(b.supplier);
            });

        // 3. Calculer les totaux
        const totalBudget = dataArray.reduce((sum, item) => sum + item.budget, 0);
        const totalActual = dataArray.reduce((sum, item) => sum + item.actual, 0);
        const totalReste = totalBudget - totalActual;

        console.log('📱 [MOBILE] Résultats finaux:', {
            totalBudget,
            totalActual, 
            totalReste,
            items: dataArray.length,
            itemsWithRealBudget: dataArray.filter(item => item.hasRealBudgetData).length
        });

        return {
            tiersData: dataArray,
            totals: { budget: totalBudget, actual: totalActual, reste: totalReste },
            hasRealBudgetData: dataArray.some(item => item.hasRealBudgetData)
        };
    }, [mobilePeriod, mobileProcessedEntries, finalActualTransactions, realBudgetData]);

    // Afficher les données de débogage
    console.log('📱 [MOBILE] Données real_budget complètes:', realBudgetData);
    console.log('📱 [MOBILE] Données mobiles calculées:', mobileData);

    // Indicateur de chargement
    if (realBudgetLoading || loading) {
        return (
            <div className="p-4">
                <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Chargement des données...</div>
                </div>
            </div>
        );
    }

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
                    {/* Indicateur de source des données - SEULEMENT si il y a des données real_budget */}
                    {mobileData.hasRealBudgetData && (
                        <div className="p-2 mb-3 text-xs text-green-600 rounded-lg bg-green-50">
                            ✓ Données réelles synchronisées
                        </div>
                    )}

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
                                <div className={
                                    mobileData.totals.actual !== 0 
                                        ? (mobileData.totals.actual >= 0 ? 'text-green-600' : 'text-red-700')
                                        : 'text-gray-700'
                                }>
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
                                        <div className="flex items-center gap-1">
                                            {item.hasRealBudgetData && (
                                                <span className="text-xs text-green-500" title="Données real_budget">
                                                    ✓
                                                </span>
                                            )}
                                            <span className={`text-xs uppercase px-2 py-0.5 rounded flex-shrink-0 ml-1 ${
                                                item.displayType === 'revenu' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {item.displayType === 'revenu' ? 'Encaissement' : 'Décaissement'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                        <div className="text-center">
                                            <div className="text-gray-500">Prév.</div>
                                            <div className="font-medium text-gray-700">
                                                {formatCurrency(Math.abs(item.budget), currencySettings)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-gray-500">Réel</div>
                                            <div className={`font-medium ${
                                                item.hasRealBudgetData 
                                                    ? 'text-green-600 font-semibold' 
                                                    : item.actual !== 0 
                                                        ? 'text-blue-600'
                                                        : 'text-gray-700'
                                            }`}>
                                                {formatCurrency(Math.abs(item.actual), currencySettings)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-gray-500">Reste</div>
                                            <div className={`font-medium ${
                                                // Pour les revenus : reste positif = bon, reste négatif = mauvais
                                                // Pour les dépenses : reste négatif = bon, reste positif = mauvais
                                                (item.displayType === 'revenu' && item.reste >= 0) || 
                                                (item.displayType === 'depense' && item.reste <= 0)
                                                    ? 'text-green-600' 
                                                    : 'text-red-600'
                                            }`}>
                                                {formatCurrency(Math.abs(item.reste), currencySettings)}
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