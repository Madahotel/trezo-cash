import React, { useMemo, useCallback } from 'react';
import { useProcessedEntries } from '../../../hooks/useProcessedEntries.jsx';
import { useGroupedData } from '../../../hooks/useGroupedData.jsx';
import { calculateGeneralTotals } from '../../../hooks/calculateGeneralTotals.jsx';
import { calculateMainCategoryTotals } from '../../../hooks/calculateMainCategoryTotals.jsx';
import { calculateEntryAmountForPeriod, calculateActualAmountForPeriod, getEntryDescription } from '../../../utils/budgetCalculations.js';



const calculateWeeklyPeriods = (baseDate, count) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    // Trouver le lundi de la semaine courante (lundi = 1, dimanche = 0)
    const dayOfWeek = currentDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + diffToMonday);

    for (let i = 0; i < count; i++) {
        // Pour chaque jour de la semaine
        for (let day = 0; day < 7; day++) {
            const dayStart = new Date(currentDate);
            dayStart.setDate(dayStart.getDate() + day + (i * 7));
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            dayEnd.setMilliseconds(-1);

            const dayOfWeekName = dayStart.toLocaleDateString('fr-FR', { weekday: 'short' });
            const dayNumber = dayStart.getDate();
            const monthNumber = dayStart.getMonth() + 1;
            const year = dayStart.getFullYear();

            periods.push({
                label: `${dayOfWeekName} ${dayNumber}/${monthNumber}/${year}`,
                startDate: new Date(dayStart),
                endDate: new Date(dayEnd),
                timeView: 'week',
                dayOfWeek: day,
                weekIndex: i,
                // Ajouter la date complète pour référence
                fullDate: new Date(dayStart),
                // Identifier la semaine (lundi au dimanche)
                weekStart: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (i * 7)),
                weekEnd: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (i * 7) + 6, 23, 59, 59, 999),
                // Ajouter l'année et le mois pour faciliter les comparaisons
                year: year,
                month: monthNumber,
                day: dayNumber
            });
        }
    }

    return periods;
};

const calculateMonthlyPeriods = (baseDate, count, byWeek = false) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    for (let i = 0; i < count; i++) {
        const monthStart = new Date(currentDate);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setMilliseconds(-1);

        const daysInMonth = Math.floor((monthEnd - monthStart) / (1000 * 60 * 60 * 24)) + 1;
        const weeksInMonth = Math.ceil(daysInMonth / 7);

        const monthName = monthStart.toLocaleDateString('fr-FR', { month: 'long' });
        const year = monthStart.getFullYear();

        for (let week = 0; week < weeksInMonth; week++) {
            const weekStart = new Date(monthStart);
            weekStart.setDate(weekStart.getDate() + (week * 7));

            let weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            if (weekEnd > monthEnd) {
                weekEnd = new Date(monthEnd);
            }

            const weekStartDate = weekStart.getDate();
            const weekStartMonth = weekStart.getMonth() + 1;
            const weekEndDate = weekEnd.getDate();
            const weekEndMonth = weekEnd.getMonth() + 1;

            let label;
            if (weekStartMonth === weekEndMonth) {
                label = `S${week + 1} (${weekStartDate}-${weekEndDate}/${String(weekStartMonth).padStart(2, '0')})`;
            } else {
                label = `S${week + 1} (${weekStartDate}/${String(weekStartMonth).padStart(2, '0')}-${weekEndDate}/${String(weekEndMonth).padStart(2, '0')})`;
            }

            periods.push({
                label,
                startDate: new Date(weekStart),
                endDate: new Date(weekEnd),
                timeView: 'month',
                weekIndex: week,
                monthIndex: i,
                monthStart: new Date(monthStart),
                monthEnd: new Date(monthEnd),
                year: year,
                totalWeeksInMonth: weeksInMonth,
                monthName: monthName,
                monthIdentifier: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`
            });
        }

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return periods;
};
const calculateQuarterPeriods = (baseDate, count) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    // Trouver le trimestre courant
    const currentMonth = currentDate.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3); // 0=T1, 1=T2, 2=T3, 3=T4

    // Commencer au début du trimestre courant
    const startMonth = currentQuarter * 3;
    let quarterStart = new Date(currentDate.getFullYear(), startMonth, 1);
    quarterStart.setHours(0, 0, 0, 0);

    for (let i = 0; i < count; i++) {
        const quarterEnd = new Date(quarterStart);
        quarterEnd.setMonth(quarterEnd.getMonth() + 3);
        quarterEnd.setMilliseconds(-1);

        const quarterNumber = Math.floor(quarterStart.getMonth() / 3) + 1;
        const year = quarterStart.getFullYear();

        periods.push({
            label: `T${quarterNumber} ${year}`,
            startDate: new Date(quarterStart),
            endDate: new Date(quarterEnd),
            timeView: 'trimester',
            quarterIndex: i,
            quarterNumber: quarterNumber,
            year: year,
            // Ajout pour l'identification unique
            identifier: `T${quarterNumber}_${year}`,
            // Propriétés supplémentaires pour compatibilité
            isToday: false,
            monthIndex: quarterStart.getMonth(),
            totalWeeksInMonth: 1 // Une seule colonne par trimestre
        });

        // Passer au trimestre suivant
        quarterStart.setMonth(quarterStart.getMonth() + 3);
    }

    return periods;
};

const calculateYearlyPeriods = (baseDate, count) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    for (let i = 0; i < count; i++) {
        const yearStart = new Date(currentDate);
        yearStart.setMonth(0, 1);
        yearStart.setHours(0, 0, 0, 0);

        for (let month = 0; month < 12; month++) {
            const monthStart = new Date(yearStart.getFullYear(), month, 1);
            const monthEnd = new Date(yearStart.getFullYear(), month + 1, 0, 23, 59, 59, 999);

            const monthName = monthStart.toLocaleDateString('fr-FR', { month: 'short' });
            const yearShort = monthStart.getFullYear().toString().slice(-2);

            periods.push({
                label: `${monthName} '${yearShort}`,
                startDate: new Date(monthStart),
                endDate: new Date(monthEnd),
                timeView: 'year',
                monthIndex: month,
                yearIndex: i
            });
        }

        currentDate.setFullYear(currentDate.getFullYear() + 1);
    }

    return periods;
};

const calculateBimesterPeriods = (baseDate, count) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    for (let i = 0; i < count; i++) {
        // 8 semaines = 2 mois environ
        for (let week = 0; week < 8; week++) {
            const weekStart = new Date(currentDate);
            weekStart.setDate(weekStart.getDate() + (week * 7));

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            weekEnd.setMilliseconds(-1);

            const weekNumber = week + 1;
            const startDateStr = weekStart.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short'
            });
            const endDateStr = weekEnd.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short'
            });

            periods.push({
                label: `S${weekNumber} (${startDateStr}-${endDateStr})`,
                startDate: new Date(weekStart),
                endDate: new Date(weekEnd),
                timeView: 'bimester',
                weekIndex: week,
                bimesterIndex: i
            });
        }

        // Avancer de 8 semaines pour le prochain bimestre
        currentDate.setDate(currentDate.getDate() + 56); // 8 semaines * 7 jours
    }

    return periods;
};

const calculateSemesterPeriods = (baseDate, count, byMonth = false) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    for (let i = 0; i < count; i++) {
        const semesterStart = new Date(currentDate);

        if (byMonth) {
            // Affichage par mois pour un semestre (6 mois)
            for (let month = 0; month < 6; month++) {
                const monthStart = new Date(semesterStart.getFullYear(), semesterStart.getMonth() + month, 1);
                const monthEnd = new Date(semesterStart.getFullYear(), semesterStart.getMonth() + month + 1, 0, 23, 59, 59, 999);

                const monthName = monthStart.toLocaleDateString('fr-FR', { month: 'short' });
                const year = monthStart.getFullYear().toString().slice(-2);

                periods.push({
                    label: `${monthName} '${year}`,
                    startDate: new Date(monthStart),
                    endDate: new Date(monthEnd),
                    timeView: 'semester',
                    monthIndex: month,
                    semesterIndex: i,
                    isMonthView: true
                });
            }
        } else {
            // Un seul période pour tout le semestre
            const semesterEnd = new Date(semesterStart);
            semesterEnd.setMonth(semesterEnd.getMonth() + 6);
            semesterEnd.setMilliseconds(-1);

            const semesterNumber = Math.floor(semesterStart.getMonth() / 6) + 1;
            const year = semesterStart.getFullYear();

            periods.push({
                label: `S${semesterNumber} ${year}`,
                startDate: new Date(semesterStart),
                endDate: new Date(semesterEnd),
                timeView: 'semester',
                semesterIndex: i,
                isMonthView: false
            });
        }

        currentDate.setMonth(currentDate.getMonth() + 6);
    }

    return periods;
};

const calculateYear3Periods = (baseDate, count) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    for (let i = 0; i < count * 3; i++) { // 3 ans
        // Affichage par semestre (6 mois)
        for (let semester = 0; semester < 2; semester++) {
            const semesterStart = new Date(currentDate.getFullYear(), semester * 6, 1);
            const semesterEnd = new Date(currentDate.getFullYear(), (semester + 1) * 6, 0, 23, 59, 59, 999);

            const semesterNumber = semester + 1;
            const year = semesterStart.getFullYear();

            periods.push({
                label: `S${semesterNumber} ${year}`,
                startDate: new Date(semesterStart),
                endDate: new Date(semesterEnd),
                timeView: 'year3',
                semesterIndex: semester,
                yearIndex: i
            });
        }

        currentDate.setFullYear(currentDate.getFullYear() + 1);
    }

    return periods;
};

const calculateYear5Periods = (baseDate, count) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    for (let i = 0; i < count; i++) { // 5 ans
        const yearStart = new Date(currentDate.getFullYear(), 0, 1);
        const yearEnd = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999);

        periods.push({
            label: currentDate.getFullYear().toString(),
            startDate: new Date(yearStart),
            endDate: new Date(yearEnd),
            timeView: 'year5',
            yearIndex: i
        });

        currentDate.setFullYear(currentDate.getFullYear() + 1);
    }

    return periods;
};

const calculateYear7Periods = (baseDate, count) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    for (let i = 0; i < count; i++) { // 7 ans
        const yearStart = new Date(currentDate.getFullYear(), 0, 1);
        const yearEnd = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999);

        periods.push({
            label: currentDate.getFullYear().toString(),
            startDate: new Date(yearStart),
            endDate: new Date(yearEnd),
            timeView: 'year7',
            yearIndex: i
        });

        currentDate.setFullYear(currentDate.getFullYear() + 1);
    }

    return periods;
};


const BudgetDataManager = ({
    projectData,
    finalBudgetEntries,
    finalActualTransactions,
    finalCategories,
    vatRegimes,
    taxConfigs,
    activeProjectId,
    collectionData,
    searchTerm,
    frequencyFilter,
    quickFilter,
    timeView,
    monthDisplayMode,
    settings,
    effectiveHorizonLength,
    periodOffset,
    today,
    isDateToday,
    children, effectiveCashAccounts = [],
}) => {
    const periods = useMemo(() => {
        try {
            const todayDate = new Date(today || new Date());
            let baseDate = new Date(todayDate);

            // Ajuster selon le décalage
            switch (timeView) {
                case 'trimester':
                    baseDate.setMonth(baseDate.getMonth() + ((periodOffset || 0) * 3));
                    break;
                case 'day':
                    baseDate.setDate(baseDate.getDate() + (periodOffset || 0));
                    break;
                case 'week':
                    baseDate.setDate(baseDate.getDate() + ((periodOffset || 0) * 7));
                    break;
                case 'month':
                    baseDate.setMonth(baseDate.getMonth() + (periodOffset || 0));
                    break;
                case 'year':
                    baseDate.setFullYear(baseDate.getFullYear() + (periodOffset || 0));
                    break;
                case 'semester':
                    baseDate.setMonth(baseDate.getMonth() + ((periodOffset || 0) * 6));
                    break;
                case 'bimester':
                    baseDate.setDate(baseDate.getDate() + ((periodOffset || 0) * 56));
                    break;
                case 'year3':
                case 'year5':
                case 'year7':
                    baseDate.setFullYear(baseDate.getFullYear() + (periodOffset || 0));
                    break;
                default:
                    baseDate.setDate(baseDate.getDate() + (periodOffset || 0));
            }

            // Déterminer l'horizon selon la vue
            let horizon = effectiveHorizonLength || 1;

            // Générer les périodes selon le mode d'affichage
            switch (timeView) {
                case 'day':
                    const dayPeriods = [];
                    const periodStart = new Date(baseDate);
                    periodStart.setHours(0, 0, 0, 0);

                    const periodEnd = new Date(periodStart);
                    periodEnd.setDate(periodEnd.getDate() + 1);
                    periodEnd.setMilliseconds(-1);

                    const dayName = periodStart.toLocaleDateString('fr-FR', { weekday: 'short' });
                    const dayNumber = periodStart.getDate();
                    const monthName = periodStart.toLocaleDateString('fr-FR', { month: 'short' });

                    dayPeriods.push({
                        label: `${dayName} ${dayNumber} ${monthName}`,
                        startDate: new Date(periodStart),
                        endDate: new Date(periodEnd),
                        timeView: 'day',
                        isToday: isDateToday ? isDateToday(periodStart) : false
                    });
                    return dayPeriods;

                case 'week':
                    return calculateWeeklyPeriods(baseDate, horizon);

                case 'month':
                    return calculateMonthlyPeriods(baseDate, horizon, monthDisplayMode === 'byWeek');

                case 'year':
                    return calculateYearlyPeriods(baseDate, horizon);

                case 'ponctuel':
                    const ponctuelPeriods = [];
                    for (let i = 0; i < (horizon * 30); i++) {
                        const periodStart = new Date(baseDate);
                        periodStart.setDate(periodStart.getDate() + i);
                        periodStart.setHours(0, 0, 0, 0);

                        const periodEnd = new Date(periodStart);
                        periodEnd.setDate(periodEnd.getDate() + 1);
                        periodEnd.setMilliseconds(-1);

                        ponctuelPeriods.push({
                            label: periodStart.toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            }),
                            startDate: new Date(periodStart),
                            endDate: new Date(periodEnd),
                            timeView: 'ponctuel',
                            isToday: isDateToday ? isDateToday(periodStart) : false
                        });
                    }
                    return ponctuelPeriods;

                case 'trimester':
                    // CORRECTION: Pour la vue trimestre, on génère 4 trimestres
                    return calculateQuarterPeriods(baseDate, 4);

                case 'semester':
                    const semesterPeriods = [];
                    for (let i = 0; i < horizon; i++) {
                        const semesterStart = new Date(baseDate);
                        semesterStart.setMonth(semesterStart.getMonth() + (i * 6));

                        const semesterMonth = Math.floor(semesterStart.getMonth() / 6) * 6;
                        semesterStart.setMonth(semesterMonth, 1);
                        semesterStart.setHours(0, 0, 0, 0);

                        const semesterEnd = new Date(semesterStart);
                        semesterEnd.setMonth(semesterEnd.getMonth() + 6);
                        semesterEnd.setMilliseconds(-1);

                        const semesterNumber = Math.floor(semesterStart.getMonth() / 6) + 1;
                        const year = semesterStart.getFullYear();

                        semesterPeriods.push({
                            label: `S${semesterNumber} ${year}`,
                            startDate: new Date(semesterStart),
                            endDate: new Date(semesterEnd),
                            timeView: 'semester'
                        });
                    }
                    return semesterPeriods;

                case 'bimester':
                    return calculateBimesterPeriods(baseDate, horizon);

                case 'year3':
                    return calculateYear3Periods(baseDate, horizon);

                case 'year5':
                    return calculateYear5Periods(baseDate, horizon);

                case 'year7':
                    return calculateYear7Periods(baseDate, horizon);

                default:
                    const defaultPeriods = [];
                    const defaultPeriodStart = new Date(baseDate);
                    defaultPeriodStart.setHours(0, 0, 0, 0);

                    const defaultPeriodEnd = new Date(defaultPeriodStart);
                    defaultPeriodEnd.setDate(defaultPeriodEnd.getDate() + 1);
                    defaultPeriodEnd.setMilliseconds(-1);

                    defaultPeriods.push({
                        label: defaultPeriodStart.toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                        }),
                        startDate: new Date(defaultPeriodStart),
                        endDate: new Date(defaultPeriodEnd),
                        timeView: 'day',
                        isToday: isDateToday ? isDateToday(defaultPeriodStart) : false
                    });
                    return defaultPeriods;
            }
        } catch (error) {
            console.error('Erreur dans le calcul des périodes:', error);
            return [];
        }
    }, [timeView, periodOffset, settings?.timezoneOffset, effectiveHorizonLength, monthDisplayMode, today, isDateToday]);

    // Traitement des entrées budgétaires
    const processBudgetItems = useCallback((budgetItems) => {
        if (!budgetItems || !Array.isArray(budgetItems)) return [];

        return budgetItems.map((item) => {
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
                frequency_id: item.frequency_id ? item.frequency_id.toString() : null,
                frequency_name: item.frequency_name || '',
                frequency: item.frequency_name || '',
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
                endDate: item.end_date ? new Date(item.end_date) : null,
            };
        });
    }, []);

    const processedBudgetEntries = useMemo(() => {
        if (projectData && projectData.budgets && projectData.budgets.budget_items) {
            return processBudgetItems(projectData.budgets.budget_items);
        }
        return finalBudgetEntries || [];
    }, [projectData, finalBudgetEntries, processBudgetItems]);

    const filteredBudgetEntries = useMemo(() => {
        try {
            let entries = processedBudgetEntries || [];

            if (searchTerm) {
                entries = entries.filter((entry) =>
                    entry?.supplier?.toLowerCase().includes(searchTerm?.toLowerCase() || '')
                );
            }

            // CORRECTION IMPORTANTE: Le filtre de fréquence ne doit PAS filtrer dans les vues longues terme
            // Il s'agit d'un filtrage de données, pas d'affichage
            if (frequencyFilter !== 'all') {
                entries = entries.filter((entry) => {
                    const entryFrequencyId = entry?.frequency_id?.toString();
                    return entryFrequencyId === frequencyFilter;
                });
            }

            if (quickFilter !== 'all') {
                // ... (inchangé)
            }

            return entries;
        } catch (error) {
            console.error('Erreur dans le filtrage des entrées:', error);
            return [];
        }
    }, [processedBudgetEntries, searchTerm, quickFilter, finalCategories, frequencyFilter]);

    // Traitement des transactions réelles avec vérifications
    const processActualTransactions = useCallback(() => {
        try {
            if (projectData?.real_budgets?.real_budget_items?.data) {
                return projectData.real_budgets.real_budget_items.data.map(realBudget => ({
                    id: `real_${realBudget.budget_id}_${realBudget.collection_date}`,
                    budgetId: realBudget.budget_id?.toString(),
                    budget_id: realBudget.budget_id,
                    thirdParty: 'Collecté',
                    type: 'receivable',
                    cashAccount: 'default',
                    payments: [{
                        id: `payment_${realBudget.budget_id}_${realBudget.collection_date}`,
                        paymentDate: realBudget.collection_date,
                        paidAmount: parseFloat(realBudget.collection_amount) || 0,
                        status: 'paid'
                    }]
                }));
            }

            if (finalActualTransactions && Array.isArray(finalActualTransactions)) {
                return finalActualTransactions.map(transaction => ({
                    id: transaction.id || `trans_${Math.random()}`,
                    budgetId: transaction.budgetId || transaction.budget_id,
                    budget_detail_id: transaction.budget_detail_id,
                    thirdParty: transaction.thirdParty || transaction.third_party,
                    type: transaction.type,
                    cashAccount: transaction.cashAccount || transaction.cash_account,
                    payments: Array.isArray(transaction.payments)
                        ? transaction.payments.map(p => ({
                            id: p.id || `pay_${Math.random()}`,
                            paymentDate: p.paymentDate || p.date || p.payment_date,
                            paidAmount: p.paidAmount || p.amount,
                            status: p.status
                        }))
                        : [],
                }));
            }

            console.warn('No actual transactions found');
            return [];
        } catch (error) {
            console.error('Erreur dans le traitement des transactions:', error);
            return [];
        }
    }, [projectData, finalActualTransactions]);

    const normalizedTransactions = useMemo(() => processActualTransactions(), [processActualTransactions]);

    // Données étendues avec TVA et taxes avec vérifications
    const safeBudgetEntries = useMemo(() => filteredBudgetEntries || [], [filteredBudgetEntries]);
    const safeActualTransactions = useMemo(() => finalActualTransactions || [], [finalActualTransactions]);
    const safeCategories = useMemo(() => finalCategories || {}, [finalCategories]);
    const safeVatRegimes = useMemo(() => vatRegimes || {}, [vatRegimes]);
    const safeTaxConfigs = useMemo(() => taxConfigs || [], [taxConfigs]);
    const safePeriods = useMemo(() => periods || [], [periods]);

    const expandedAndVatEntries = useProcessedEntries(
        safeBudgetEntries,
        safeActualTransactions,
        safeCategories,
        safeVatRegimes,
        safeTaxConfigs,
        activeProjectId,
        safePeriods,
        false,
        false,
        collectionData
    );

    const entriesWithCollectionData = useMemo(() => {
        try {
            if (!expandedAndVatEntries || expandedAndVatEntries.length === 0) return [];
            return expandedAndVatEntries.map((entry) => ({
                ...entry,
                collectionData: collectionData?.[entry.id] || collectionData?.[entry.budget_detail_id] || collectionData?.[entry.budget_id],
            }));
        } catch (error) {
            console.error('Erreur dans entriesWithCollectionData:', error);
            return [];
        }
    }, [expandedAndVatEntries, collectionData]);

    const filteredExpandedAndVatEntries = useMemo(() => {
        try {
            if (frequencyFilter === 'all') {
                return entriesWithCollectionData;
            }

            const shouldIncludeExtendedEntry = (entry, filteredEntries) => {
                if (!entry?.is_vat_child && !entry?.is_vat_payment && !entry?.is_tax_payment) {
                    return filteredEntries.some((filteredEntry) => filteredEntry?.id === entry?.id);
                }
                if (entry?.is_vat_child) {
                    const parentEntryId = entry.id.replace('_vat', '');
                    return filteredEntries.some((filteredEntry) => filteredEntry?.id === parentEntryId);
                }
                if (entry?.is_vat_payment || entry?.is_tax_payment) {
                    const associatedEntryId = entry.associatedEntryId || entry.id.replace('_vat_payment', '').replace('_tax_payment', '');
                    return filteredEntries.some((filteredEntry) => filteredEntry?.id === associatedEntryId);
                }
                return true;
            };

            return entriesWithCollectionData.filter((entry) =>
                shouldIncludeExtendedEntry(entry, filteredBudgetEntries)
            );
        } catch (error) {
            console.error('Erreur dans filteredExpandedAndVatEntries:', error);
            return [];
        }
    }, [entriesWithCollectionData, filteredBudgetEntries, frequencyFilter]);

    const isRowVisibleInPeriods = useCallback(() => true, []);

    // Groupement des données par catégorie avec vérifications
    const groupedData = useGroupedData(
        filteredExpandedAndVatEntries,
        finalCategories,
        isRowVisibleInPeriods
    );


    const hasOffBudgetRevenues = useMemo(
        () => {
            try {
                return filteredExpandedAndVatEntries.some((e) => e?.isOffBudget && e?.type === 'revenu' && isRowVisibleInPeriods(e));
            } catch (error) {
                console.error('Erreur dans hasOffBudgetRevenues:', error);
                return false;
            }
        },
        [filteredExpandedAndVatEntries, isRowVisibleInPeriods]
    );

    const hasOffBudgetExpenses = useMemo(
        () => {
            try {
                return filteredExpandedAndVatEntries.some((e) => e?.isOffBudget && e?.type === 'depense' && isRowVisibleInPeriods(e));
            } catch (error) {
                console.error('Erreur dans hasOffBudgetExpenses:', error);
                return false;
            }
        },
        [filteredExpandedAndVatEntries, isRowVisibleInPeriods]
    );
// Calcul des positions de trésorerie avec vérifications
const calculatePeriodPositions = useCallback((
    periods,
    cashAccounts,
    groupedData,
    expandedAndVatEntries,
    finalActualTransactions,
    hasOffBudgetRevenues,
    hasOffBudgetExpenses
) => {
    try {
        console.log('🔍 DEBUG calculatePeriodPositions - cashAccounts:', cashAccounts);
        
        if (!periods || periods.length === 0) {
            return periods?.map(() => ({
                initial: 0,
                final: 0,
                netCashFlow: 0,
                totalEntrees: 0,
                totalSorties: 0,
                budgetNetFlow: 0,
                actualNetFlow: 0,
            })) || [];
        }

        // 1. Calculer le solde initial total de tous les comptes avec vérification stricte
        const totalInitialBalance = cashAccounts?.reduce((sum, account) => {
            if (!account) return sum;
            
            // Vérifier explicitement si c'est 0 ou une valeur valide
            const initialBalance = parseFloat(account.initialBalance || account.initial_amount || 0);
            
            // Si c'est NaN ou une valeur non numérique, retourner 0
            if (isNaN(initialBalance)) {
                console.warn('⚠️ Valeur initiale invalide pour le compte:', account);
                return sum;
            }
            
            // Si c'est 10000, vérifier si c'est intentionnel ou une valeur par défaut
            if (initialBalance === 10000) {
                console.warn('⚠️ Valeur initiale suspecte (10000) pour le compte:', account);
                // Si l'utilisateur n'a pas configuré de solde, supposer 0
                if (!account.is_configured || account.has_initial_balance === false) {
                    return sum; // Ne pas ajouter les 10000€
                }
            }
            
            return sum + initialBalance;
        }, 0) || 0;

        console.log('🔢 Solde initial total calculé:', totalInitialBalance);

        // Si le total est toujours 10000 et il n'y a pas de comptes configurés, mettre à 0
        if (totalInitialBalance === 10000 && (!cashAccounts || cashAccounts.length === 0 || cashAccounts.every(acc => !acc.is_configured))) {
            console.log('🔄 Correction: Pas de solde initial réel, on utilise 0');
            runningBalance = 0;
        } else {
            runningBalance = totalInitialBalance;
        }

        const positions = [];
        let runningBalance = totalInitialBalance;

        for (let i = 0; i < periods.length; i++) {
            const period = periods[i];

            // 2. Calculer les totaux pour cette période
            const revenueTotals = calculateGeneralTotals(
                groupedData?.entree || [],
                period,
                'entree',
                expandedAndVatEntries,
                finalActualTransactions,
                hasOffBudgetRevenues,
                hasOffBudgetExpenses
            );

            const expenseTotals = calculateGeneralTotals(
                groupedData?.sortie || [],
                period,
                'sortie',
                expandedAndVatEntries,
                finalActualTransactions,
                hasOffBudgetRevenues,
                hasOffBudgetExpenses
            );

            // 3. Calculer les flux nets (Budget et Réel)
            const budgetEntrees = revenueTotals?.budget || 0;
            const budgetSorties = expenseTotals?.budget || 0;
            const budgetNetFlow = budgetEntrees - budgetSorties;

            const actualEntrees = revenueTotals?.actual || 0;
            const actualSorties = expenseTotals?.actual || 0;
            const actualNetFlow = actualEntrees - actualSorties;

            // 4. Calculer la trésorerie fin de période
            const initialBalance = runningBalance;
            const finalBalance = initialBalance + actualNetFlow;
            const finalBalanceBudget = initialBalance + budgetNetFlow;

            // Mettre à jour le solde pour la période suivante
            runningBalance = finalBalance;

            positions.push({
                initial: initialBalance,
                final: finalBalance,
                finalBudget: finalBalanceBudget,
                netCashFlow: actualNetFlow,
                netCashFlowBudget: budgetNetFlow,
                totalEntrees: actualEntrees,
                totalSorties: actualSorties,
                totalEntreesBudget: budgetEntrees,
                totalSortiesBudget: budgetSorties,
                budgetNetFlow: budgetNetFlow,
                actualNetFlow: actualNetFlow,
                periodInfo: period.label,
                periodStart: period.startDate,
                periodEnd: period.endDate,
            });

            console.log(`💰 Période ${period.label}:`, {
                initial: positions[i].initial,
                fluxNet: actualNetFlow,
                final: positions[i].final,
                entrées: actualEntrees,
                sorties: actualSorties,
            });
        }

        return positions;
    } catch (error) {
        console.error('Erreur dans calculatePeriodPositions:', error);
        return [];
    }
}, [calculateGeneralTotals]);

    const periodPositions = useMemo(() => {
        console.log('Calcul des positions avec:', {
            periodsCount: periods.length,
            cashAccountsCount: effectiveCashAccounts?.length || 0,
            cashAccounts: effectiveCashAccounts,
            totalInitialBalance: effectiveCashAccounts?.reduce((sum, acc) => sum + (acc.initialBalance || 0), 0) || 0
        });
        try {
            return calculatePeriodPositions(
                periods,
                effectiveCashAccounts || [], // ← UTILISE effectiveCashAccounts ici
                groupedData,
                filteredExpandedAndVatEntries,
                finalActualTransactions,
                hasOffBudgetRevenues,
                hasOffBudgetExpenses
            );
        } catch (error) {
            console.error('Erreur dans periodPositions:', error);
            return [];
        }
    }, [
        periods,
        effectiveCashAccounts, // ← AJOUT dans les dépendances
        groupedData,
        filteredExpandedAndVatEntries,
        finalActualTransactions,
        hasOffBudgetRevenues,
        hasOffBudgetExpenses,
        calculatePeriodPositions
    ]);

    const calculateEntryBudgetForPeriod = useCallback((entry, periodStart, periodEnd, periodIndex, periodInfo) => {
        try {
            const amount = entry?.budget_amount || entry?.amount || 0;

            // Vérifier d'abord si l'entrée est active pour cette période
            const isActive = isEntryActiveForPeriod(entry, periodStart, periodEnd);
            if (!isActive) return 0;

            const effectiveStartDate = entry.startDate ? new Date(entry.startDate) :
                (entry.start_date ? new Date(entry.start_date) : null);

            if (!effectiveStartDate) return 0;

            const frequencyId = entry?.frequency_id?.toString();

            // DÉTERMINER LA FRÉQUENCE CORRECTEMENT
            const isOneTime = frequencyId === "1" || entry?.frequency_name === "Ponctuel" || entry?.frequency === "Ponctuel";
            const isMonthly = frequencyId === "3" || entry?.frequency_name === "Mensuel" || entry?.frequency === "Mensuel";
            const isWeekly = frequencyId === "4" || entry?.frequency_name === "Hebdomadaire" || entry?.frequency === "Hebdomadaire";
            const isQuarterly = frequencyId === "6" || entry?.frequency_name === "Trimestriel" || entry?.frequency === "Trimestriel";
            const isSemiannual = frequencyId === "7" || entry?.frequency_name === "Semestriel" || entry?.frequency === "Semestriel";
            const isAnnual = frequencyId === "8" || entry?.frequency_name === "Annuel" || entry?.frequency === "Annuel";

            // CAS 1: FRÉQUENCE PONCTUELLE
            if (isOneTime) {
                const entryDate = effectiveStartDate;
                if (entryDate >= periodStart && entryDate <= periodEnd) {
                    return amount;
                }
                return 0;
            }

            // CAS 2: FRÉQUENCE MENSUELLE - IMPORTANT: Doit fonctionner pour TOUTES les vues
            if (isMonthly) {
                // Pour toutes les vues (trimestre, semestre, année, etc.), 
                // on doit calculer le montant mensuel qui tombe dans la période

                // Si la période est plus longue qu'un mois (trimestre, semestre, année)
                if (timeView === 'trimester' || timeView === 'semester' || timeView === 'year' ||
                    timeView === 'year3' || timeView === 'year5' || timeView === 'year7') {

                    // Calculer combien de mois complets sont dans la période
                    let totalAmount = 0;
                    let currentMonth = new Date(effectiveStartDate);

                    // Avancer mois par mois jusqu'à la fin de la période
                    while (currentMonth <= periodEnd) {
                        // Vérifier si ce mois est dans la période
                        if (currentMonth >= periodStart && currentMonth <= periodEnd) {
                            // Vérifier si c'est un mois complet dans la période
                            const monthStart = new Date(currentMonth);
                            monthStart.setDate(1);
                            monthStart.setHours(0, 0, 0, 0);

                            const monthEnd = new Date(monthStart);
                            monthEnd.setMonth(monthEnd.getMonth() + 1);
                            monthEnd.setMilliseconds(-1);

                            // Si le mois est entièrement dans la période, ajouter le montant
                            if (monthStart >= periodStart && monthEnd <= periodEnd) {
                                totalAmount += amount;
                            }
                        }
                        // Passer au mois suivant
                        currentMonth.setMonth(currentMonth.getMonth() + 1);
                    }

                    return totalAmount;
                }

                // Pour les vues plus courtes (jour, semaine, mois), utiliser la logique existante
                const entryDayOfMonth = effectiveStartDate.getDate();
                const entryMonth = effectiveStartDate.getMonth();
                const entryYear = effectiveStartDate.getFullYear();

                const periodStartDate = new Date(periodStart);
                const periodEndDate = new Date(periodEnd);
                const periodMonth = periodStartDate.getMonth();
                const periodYear = periodStartDate.getFullYear();

                // Pour la vue mois (affichage par semaine)
                if (timeView === "month" && periodInfo.weekIndex !== undefined) {
                    const weekStartDay = periodStartDate.getDate();
                    const weekEndDay = periodEndDate.getDate();

                    if (entryMonth === periodMonth && entryYear === periodYear) {
                        if (entryDayOfMonth >= weekStartDay && entryDayOfMonth <= weekEndDay) {
                            return amount;
                        }
                    }
                } else {
                    if (entryDayOfMonth === periodStartDate.getDate() &&
                        entryMonth === periodStartDate.getMonth() &&
                        entryYear === periodStartDate.getFullYear()) {
                        return amount;
                    }
                }

                return 0;
            }

            // CAS 3: FRÉQUENCE HEBDOMADAIRE - Doit fonctionner pour toutes les vues
            if (isWeekly) {
                if (timeView === 'trimester' || timeView === 'semester' || timeView === 'year' ||
                    timeView === 'year3' || timeView === 'year5' || timeView === 'year7') {

                    // Pour les vues longues terme, calculer toutes les semaines dans la période
                    let totalAmount = 0;
                    let currentWeek = new Date(effectiveStartDate);

                    // Avancer semaine par semaine
                    while (currentWeek <= periodEnd) {
                        if (currentWeek >= periodStart && currentWeek <= periodEnd) {
                            // Vérifier si c'est une semaine complète dans la période
                            const weekEnd = new Date(currentWeek);
                            weekEnd.setDate(weekEnd.getDate() + 6);
                            weekEnd.setHours(23, 59, 59, 999);

                            if (weekEnd <= periodEnd) {
                                totalAmount += amount;
                            }
                        }
                        // Passer à la semaine suivante
                        currentWeek.setDate(currentWeek.getDate() + 7);
                    }

                    return totalAmount;
                }

                // Logique existante pour les vues courtes
                const weeksSinceStart = Math.floor((periodStart - effectiveStartDate) / (7 * 24 * 60 * 60 * 1000));
                if (weeksSinceStart >= 0 && weeksSinceStart % 1 === 0) {
                    return amount;
                }
                return 0;
            }

            // CAS 4: FRÉQUENCE TRIMESTRIELLE
            if (isQuarterly) {
                // Même logique pour les vues longues terme
                if (timeView === 'trimester' || timeView === 'semester' || timeView === 'year' ||
                    timeView === 'year3' || timeView === 'year5' || timeView === 'year7') {

                    // Vérifier si un paiement trimestriel tombe dans la période
                    let currentDate = new Date(effectiveStartDate);
                    while (currentDate <= periodEnd) {
                        if (currentDate >= periodStart && currentDate <= periodEnd) {
                            return amount;
                        }
                        // Passer au trimestre suivant
                        currentDate.setMonth(currentDate.getMonth() + 3);
                    }
                    return 0;
                }

                const entryDate = effectiveStartDate;
                const monthsSinceStart = (periodStart.getFullYear() - entryDate.getFullYear()) * 12 +
                    (periodStart.getMonth() - entryDate.getMonth());

                if (monthsSinceStart >= 0 && monthsSinceStart % 3 === 0) {
                    const entryDayOfMonth = entryDate.getDate();
                    const periodDayOfMonth = periodStart.getDate();
                    if (entryDayOfMonth === periodDayOfMonth) {
                        return amount;
                    }
                }
                return 0;
            }

            // CAS 5: FRÉQUENCE SEMESTRIELLE
            if (isSemiannual) {
                // Même logique pour les vues longues terme
                if (timeView === 'trimester' || timeView === 'semester' || timeView === 'year' ||
                    timeView === 'year3' || timeView === 'year5' || timeView === 'year7') {

                    let currentDate = new Date(effectiveStartDate);
                    while (currentDate <= periodEnd) {
                        if (currentDate >= periodStart && currentDate <= periodEnd) {
                            return amount;
                        }
                        currentDate.setMonth(currentDate.getMonth() + 6);
                    }
                    return 0;
                }

                const entryDate = effectiveStartDate;
                const monthsSinceStart = (periodStart.getFullYear() - entryDate.getFullYear()) * 12 +
                    (periodStart.getMonth() - entryDate.getMonth());

                if (monthsSinceStart >= 0 && monthsSinceStart % 6 === 0) {
                    const entryDayOfMonth = entryDate.getDate();
                    const periodDayOfMonth = periodStart.getDate();
                    if (entryDayOfMonth === periodDayOfMonth) {
                        return amount;
                    }
                }
                return 0;
            }

            // CAS 6: FRÉQUENCE ANNUELLE
            if (isAnnual) {
                // Même logique pour les vues longues terme
                if (timeView === 'trimester' || timeView === 'semester' || timeView === 'year' ||
                    timeView === 'year3' || timeView === 'year5' || timeView === 'year7') {

                    let currentDate = new Date(effectiveStartDate);
                    while (currentDate <= periodEnd) {
                        if (currentDate >= periodStart && currentDate <= periodEnd) {
                            return amount;
                        }
                        currentDate.setFullYear(currentDate.getFullYear() + 1);
                    }
                    return 0;
                }

                const entryDate = effectiveStartDate;
                const periodDate = new Date(periodStart);

                if (periodDate.getMonth() === entryDate.getMonth() &&
                    periodDate.getDate() === entryDate.getDate() &&
                    periodDate.getFullYear() >= entryDate.getFullYear()) {

                    const yearsSinceStart = periodDate.getFullYear() - entryDate.getFullYear();
                    if (yearsSinceStart % 1 === 0) {
                        return amount;
                    }
                }
                return 0;
            }

            // Pour les autres fréquences, utiliser la fonction de calcul générique
            return calculateEntryAmountForPeriod(entry, periodStart, periodEnd, timeView);

        } catch (error) {
            console.error('Erreur dans calculateEntryBudgetForPeriod:', error);
            return 0;
        }
    }, [timeView]);

    const isEntryActiveForPeriod = useCallback((entry, periodStart, periodEnd) => {
        try {
            const entryStart = entry.startDate ? new Date(entry.startDate) : (entry.start_date ? new Date(entry.start_date) : null);
            const entryEnd = entry.endDate ? new Date(entry.endDate) : (entry.end_date ? new Date(entry.end_date) : null);

            if (!entryStart) return true;

            const frequencyId = entry?.frequency_id?.toString();
            const isOneTime = frequencyId === "1" || entry?.frequency_name === "Ponctuel";

            if (isOneTime) {
                return entryStart >= periodStart && entryStart <= periodEnd;
            }

            if (entryStart > periodEnd) return false;
            if (entryEnd && entryEnd < periodStart) return false;

            return true;
        } catch (error) {
            console.error('Erreur dans isEntryActiveForPeriod:', error);
            return false;
        }
    }, []);

    // Formatage
    const formatDate = (dateString) => {
        try {
            return dateString
                ? new Date(dateString).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                })
                : '';
        } catch (error) {
            console.error('Erreur dans formatDate:', error);
            return '';
        }
    };

    const getFrequencyTitle = (entry) => {
        try {
            const freq = entry?.frequency_name || entry?.frequency || '';
            const freqFormatted = freq.charAt(0).toUpperCase() + freq.slice(1);

            if (freq.toLowerCase() === 'ponctuel' || freq.toLowerCase() === 'ponctuelle') {
                const dateToShow = entry?.date || entry?.start_date;
                return `Ponctuel: ${formatDate(dateToShow)}`;
            }
            if (freq.toLowerCase() === 'irregulier') {
                return `Irrégulier: ${entry?.payments?.length || 0} paiements`;
            }
            const period = `De ${formatDate(entry?.startDate || entry?.start_date)} à ${entry?.endDate || entry?.end_date
                ? formatDate(entry.endDate || entry.end_date)
                : '...'
                }`;
            return `${freqFormatted} | ${period}`;
        } catch (error) {
            console.error('Erreur dans getFrequencyTitle:', error);
            return 'Fréquence inconnue';
        }
    };

    const getResteColor = (reste, isEntree) => {
        try {
            return reste === 0
                ? 'text-text-secondary'
                : isEntree
                    ? reste <= 0
                        ? 'text-success-600'
                        : 'text-danger-600'
                    : reste >= 0
                        ? 'text-success-600'
                        : 'text-danger-600';
        } catch (error) {
            console.error('Erreur dans getResteColor:', error);
            return 'text-text-secondary';
        }
    };

    // Préparer les données pour les enfants
    const dataState = {
        periods,
        groupedData,
        filteredExpandedAndVatEntries,
        hasOffBudgetRevenues,
        hasOffBudgetExpenses,
        periodPositions,
        calculateGeneralTotals,
        calculateMainCategoryTotals,
        calculateEntryBudgetForPeriod,
        calculateActualAmountForPeriod,
        getEntryDescription,
        getFrequencyTitle,
        getResteColor,
        filteredBudgetEntries,
        normalizedTransactions
    };

    return children(dataState);
};

export default BudgetDataManager;