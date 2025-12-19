import React, { useMemo, useCallback } from 'react';
import { useProcessedEntries } from '../../../hooks/useProcessedEntries.jsx';
import { useGroupedData } from '../../../hooks/useGroupedData.jsx';
import { calculateGeneralTotals } from '../../../hooks/calculateGeneralTotals.jsx';
import { calculateMainCategoryTotals } from '../../../hooks/calculateMainCategoryTotals.jsx';
import { calculateEntryAmountForPeriod, calculateActualAmountForPeriod, getEntryDescription } from '../../../utils/budgetCalculations.js';

const calculateWeeklyPeriods = (baseDate, count) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    const dayOfWeek = currentDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + diffToMonday);

    for (let i = 0; i < count; i++) {
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
                fullDate: new Date(dayStart),
                weekStart: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (i * 7)),
                weekEnd: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (i * 7) + 6, 23, 59, 59, 999),
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

const calculateQuarterPeriods = (baseDate, count, byHalfMonth = true) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    currentDate.setDate(1);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < count; i++) {
        const quarterEnd = new Date(currentDate);
        quarterEnd.setMonth(quarterEnd.getMonth() + 3);
        quarterEnd.setMilliseconds(-1);

        const quarterNumber = Math.floor(currentDate.getMonth() / 3) + 1;
        const year = currentDate.getFullYear();

        if (byHalfMonth) {
            for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
                const monthStart = new Date(currentDate);
                monthStart.setMonth(monthStart.getMonth() + monthOffset);
                const month = monthStart.getMonth();
                const year = monthStart.getFullYear();

                const firstHalfStart = new Date(year, month, 1);
                const firstHalfEnd = new Date(year, month, 15, 23, 59, 59, 999);

                const secondHalfStart = new Date(year, month, 16);
                const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                const secondHalfEnd = new Date(year, month, lastDayOfMonth, 23, 59, 59, 999);

                const monthName = firstHalfStart.toLocaleDateString('fr-FR', { month: 'short' });
                const monthNumber = month + 1;

                const today = new Date();
                const isFirstHalfInFuture = firstHalfStart > today;
                const isSecondHalfInFuture = secondHalfStart > today;

                periods.push({
                    label: `${monthName} 1-15`,
                    startDate: new Date(firstHalfStart),
                    endDate: new Date(firstHalfEnd),
                    timeView: 'trimester',
                    halfIndex: monthOffset * 2,
                    monthIndex: monthOffset,
                    quarterIndex: i,
                    quarterNumber: quarterNumber,
                    year: year,
                    isFirstHalf: true,
                    monthName: monthName,
                    monthNumber: monthNumber,
                    quarterLabel: `T${quarterNumber} ${year}`,
                    isInFuture: isFirstHalfInFuture
                });

                periods.push({
                    label: `${monthName} 16-${lastDayOfMonth}`,
                    startDate: new Date(secondHalfStart),
                    endDate: new Date(secondHalfEnd),
                    timeView: 'trimester',
                    halfIndex: (monthOffset * 2) + 1,
                    monthIndex: monthOffset,
                    quarterIndex: i,
                    quarterNumber: quarterNumber,
                    year: year,
                    isSecondHalf: true,
                    monthName: monthName,
                    monthNumber: monthNumber,
                    quarterLabel: `T${quarterNumber} ${year}`,
                    isInFuture: isSecondHalfInFuture
                });
            }
        } else {
            periods.push({
                label: `T${quarterNumber} ${year}`,
                startDate: new Date(currentDate),
                endDate: new Date(quarterEnd),
                timeView: 'trimester',
                quarterIndex: i,
                quarterNumber: quarterNumber,
                year: year,
                identifier: `T${quarterNumber}_${year}`
            });
        }

        currentDate.setMonth(currentDate.getMonth() + 3);
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
    const dayOfWeek = currentDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + diffToMonday);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < count; i++) {
        const bimesterStart = new Date(currentDate);
        const bimesterEnd = new Date(currentDate);
        bimesterEnd.setDate(bimesterEnd.getDate() + (8 * 7) - 1);
        bimesterEnd.setHours(23, 59, 59, 999);

        for (let week = 0; week < 8; week++) {
            const weekStart = new Date(currentDate);
            weekStart.setDate(weekStart.getDate() + (week * 7));
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const weekNumber = week + 1;

            const startDateStr = weekStart.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short'
            });

            const endDateStr = weekEnd.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short'
            });

            let label;
            if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
                const startYear = weekStart.getFullYear().toString().slice(-2);
                const endYear = weekEnd.getFullYear().toString().slice(-2);
                label = `S${weekNumber} (${startDateStr}/${startYear}-${endDateStr}/${endYear})`;
            } else if (weekStart.getMonth() !== weekEnd.getMonth()) {
                label = `S${weekNumber} (${startDateStr}-${endDateStr})`;
            } else {
                label = `S${weekNumber} (${startDateStr}-${endDateStr})`;
            }

            periods.push({
                label,
                startDate: new Date(weekStart),
                endDate: new Date(weekEnd),
                timeView: 'bimester',
                weekIndex: week,
                bimesterIndex: i,
                month: weekStart.getMonth(),
                year: weekStart.getFullYear(),
                monthIdentifier: `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}`,
                weekInMonth: Math.floor((weekStart.getDate() - 1) / 7) + 1,
                mondayDate: new Date(weekStart),
                sundayDate: new Date(weekEnd),
                bimesterStart: new Date(bimesterStart),
                bimesterEnd: new Date(bimesterEnd)
            });
        }
        currentDate.setDate(currentDate.getDate() + 56);
    }

    return periods;
};

const calculateSemesterPeriods = (baseDate, count, byMonth = false) => {
    const periods = [];
    let currentDate = new Date(baseDate);

    for (let i = 0; i < count; i++) {
        const semesterStart = new Date(currentDate);

        if (byMonth) {
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

    for (let i = 0; i < count * 3; i++) {
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

    for (let i = 0; i < count; i++) {
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

    for (let i = 0; i < count; i++) {
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
    children,
    effectiveCashAccounts = [],
}) => {
    const periods = useMemo(() => {
        try {
            const todayDate = new Date(today || new Date());
            let baseDate = new Date(todayDate);

            // Ajuster selon le décalage
            switch (timeView) {
                case 'day':
                    baseDate.setDate(baseDate.getDate() + (periodOffset || 0));
                    break;
                case 'week':
                    baseDate.setDate(baseDate.getDate() + ((periodOffset || 0) * 7));
                    break;
                case 'month':
                    baseDate.setMonth(baseDate.getMonth() + (periodOffset || 0));
                    break;
                case 'bimester':
                    baseDate.setDate(baseDate.getDate() + ((periodOffset || 0) * 56));
                    break;
                case 'trimester':
                    baseDate.setMonth(baseDate.getMonth() + ((periodOffset || 0) * 3));
                    return calculateQuarterPeriods(baseDate, 4, true);
                case 'semester':
                    baseDate.setMonth(baseDate.getMonth() + ((periodOffset || 0) * 6));
                    break;
                case 'year':
                    baseDate.setFullYear(baseDate.getFullYear() + (periodOffset || 0));
                    break;
                case 'year3':
                case 'year5':
                case 'year7':
                    baseDate.setFullYear(baseDate.getFullYear() + (periodOffset || 0));
                    break;
                default:
                    baseDate.setDate(baseDate.getDate() + (periodOffset || 0));
            }

            let horizon = effectiveHorizonLength || 1;

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
                    return calculateQuarterPeriods(baseDate, 4, true);

                case 'semester':
                    baseDate.setMonth(baseDate.getMonth() + ((periodOffset || 0) * 6));
                    // Pour afficher par mois dans le semestre - TOUJOURS true
                    return calculateSemesterPeriods(baseDate, effectiveHorizonLength || 1, true);

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

            if (frequencyFilter !== 'all') {
                entries = entries.filter((entry) => {
                    const entryFrequencyId = entry?.frequency_id?.toString();
                    return entryFrequencyId === frequencyFilter;
                });
            }

            return entries;
        } catch (error) {
            console.error('Erreur dans le filtrage des entrées:', error);
            return [];
        }
    }, [processedBudgetEntries, searchTerm, frequencyFilter]);

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

    // Ao amin'ny BudgetDataManager, corrigez la fonction calculateEntryBudgetForPeriod
    const calculateEntryBudgetForPeriod = useCallback((entry, periodStart, periodEnd, periodIndex, periodInfo) => {
        try {
            const amount = entry?.budget_amount || entry?.amount || 0;

            const isActive = isEntryActiveForPeriod(entry, periodStart, periodEnd);
            if (!isActive) return 0;

            const effectiveStartDate = entry.startDate ? new Date(entry.startDate) :
                (entry.start_date ? new Date(entry.start_date) : null);

            if (!effectiveStartDate) return 0;

            const frequencyId = entry?.frequency_id?.toString();

            // DÉTERMINER LA FRÉQUENCE
            const isOneTime = frequencyId === "1" || entry?.frequency_name === "Ponctuel" || entry?.frequency === "Ponctuel";
            const isMonthly = frequencyId === "3" || entry?.frequency_name === "Mensuel" || entry?.frequency === "Mensuel";
            const isWeekly = frequencyId === "4" || entry?.frequency_name === "Hebdomadaire" || entry?.frequency === "Hebdomadaire";
            const isBimonthly = frequencyId === "5" || entry?.frequency_name === "Bimensuel" || entry?.frequency === "Bimensuel";
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

            // CAS 2: FRÉQUENCE MENSUELLE - GESTION POUR TOUTES LES VUES
            if (isMonthly) {
                const paymentDay = effectiveStartDate.getDate();

                // VUE TRIMESTRE PAR QUINZAINE
                if (timeView === 'trimester') {
                    // [Gardez le code existant pour trimestre]
                    let currentDate = new Date(effectiveStartDate);

                    if (currentDate < periodStart) {
                        const periodYear = periodStart.getFullYear();
                        const periodMonth = periodStart.getMonth();

                        const monthsDiff = (periodYear - currentDate.getFullYear()) * 12 +
                            (periodMonth - currentDate.getMonth());

                        if (monthsDiff > 0) {
                            currentDate.setMonth(currentDate.getMonth() + monthsDiff);
                        }

                        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                        const actualDay = Math.min(paymentDay, lastDayOfMonth);
                        currentDate.setDate(actualDay);
                    }

                    while (currentDate <= periodEnd) {
                        if (currentDate >= periodStart && currentDate <= periodEnd) {
                            if (currentDate.getMonth() === periodStart.getMonth() &&
                                currentDate.getFullYear() === periodStart.getFullYear()) {
                                const dayOfMonth = currentDate.getDate();
                                const periodStartDay = periodStart.getDate();

                                const isFirstHalf = periodStartDay >= 1 && periodStartDay <= 15;
                                const isSecondHalf = periodStartDay >= 16;

                                if (isFirstHalf && dayOfMonth >= 1 && dayOfMonth <= 15) {
                                    return amount;
                                }

                                if (isSecondHalf && dayOfMonth >= 16) {
                                    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                                    if (dayOfMonth <= lastDayOfMonth) {
                                        return amount;
                                    }
                                }
                            }
                        }
                        currentDate.setMonth(currentDate.getMonth() + 1);
                        const lastDayOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                        const nextPaymentDay = Math.min(paymentDay, lastDayOfNextMonth);
                        currentDate.setDate(nextPaymentDay);
                    }

                    return 0;
                }

                if (timeView === 'bimester') {

                    let currentDate = new Date(effectiveStartDate);

                    if (currentDate < periodStart) {
                        const monthsDiff = Math.ceil((periodStart - currentDate) / (30.44 * 24 * 60 * 60 * 1000));
                        if (monthsDiff > 0) {
                            currentDate.setMonth(currentDate.getMonth() + monthsDiff);
                        }

                        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                        const actualDay = Math.min(paymentDay, lastDayOfMonth);
                        currentDate.setDate(actualDay);

                        if (currentDate < periodStart) {
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            const nextMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                            const nextMonthDay = Math.min(paymentDay, nextMonthLastDay);
                            currentDate.setDate(nextMonthDay);
                        }
                    }

                    let totalAmount = 0;

                    while (currentDate <= periodEnd) {
                        if (currentDate >= periodStart && currentDate <= periodEnd) {

                            return amount;
                        }


                        currentDate.setMonth(currentDate.getMonth() + 1);
                        const lastDayOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                        const nextPaymentDay = Math.min(paymentDay, lastDayOfNextMonth);
                        currentDate.setDate(nextPaymentDay);


                        if (currentDate > periodEnd) break;
                    }

                    return totalAmount;
                }

                if (timeView === 'semester') {

                    const isMonthPeriod = (periodEnd - periodStart) >= (28 * 24 * 60 * 60 * 1000) &&
                        (periodEnd - periodStart) <= (31 * 24 * 60 * 60 * 1000);

                    if (isMonthPeriod) {
                        const periodMonth = periodStart.getMonth();
                        const periodYear = periodStart.getFullYear();

                        let currentDate = new Date(effectiveStartDate);

                        if (currentDate < periodStart) {
                            const monthsDiff = (periodYear - currentDate.getFullYear()) * 12 +
                                (periodMonth - currentDate.getMonth());

                            if (monthsDiff > 0) {
                                currentDate.setMonth(currentDate.getMonth() + monthsDiff);
                            }

                            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                            const actualDay = Math.min(paymentDay, lastDayOfMonth);
                            currentDate.setDate(actualDay);
                        }

                        if (currentDate.getMonth() === periodMonth &&
                            currentDate.getFullYear() === periodYear &&
                            currentDate >= periodStart &&
                            currentDate <= periodEnd) {
                            return amount;
                        }

                        // Vérifier aussi le mois suivant si on est à la fin du mois
                        const nextMonthDate = new Date(currentDate);
                        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
                        const lastDayOfNextMonth = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, 0).getDate();
                        const nextPaymentDay = Math.min(paymentDay, lastDayOfNextMonth);
                        nextMonthDate.setDate(nextPaymentDay);

                        if (nextMonthDate >= periodStart && nextMonthDate <= periodEnd &&
                            nextMonthDate.getMonth() === periodMonth) {
                            return amount;
                        }
                    } else {
                        // Vue semestre entier - utiliser la logique standard
                        return calculateEntryAmountForPeriod(entry, periodStart, periodEnd, timeView);
                    }

                    return 0;
                }

                // Pour les autres vues (week, month, year), utiliser la fonction existante
                return calculateEntryAmountForPeriod(entry, periodStart, periodEnd, timeView);
            }

            // Pour toutes les autres fréquences, utiliser la fonction existante
            return calculateEntryAmountForPeriod(entry, periodStart, periodEnd, timeView);

        } catch (error) {
            console.error('Erreur dans calculateEntryBudgetForPeriod:', error);
            return 0;
        }
    }, [timeView]);
    const isEntryActiveForPeriod = useCallback((entry, periodStart, periodEnd) => {
        try {
            const entryStart = entry.startDate ? new Date(entry.startDate) :
                (entry.start_date ? new Date(entry.start_date) : null);
            const entryEnd = entry.endDate ? new Date(entry.endDate) :
                (entry.end_date ? new Date(entry.end_date) : null);

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

            const totalInitialBalance = cashAccounts?.reduce((sum, account) => {
                if (!account) return sum;
                const initialBalance = parseFloat(account.initialBalance || account.initial_amount || 0);
                if (isNaN(initialBalance)) return sum;
                return sum + initialBalance;
            }, 0) || 0;

            const positions = [];
            let runningBalance = totalInitialBalance;

            for (let i = 0; i < periods.length; i++) {
                const period = periods[i];
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

                const actualEntrees = revenueTotals?.actual || 0;
                const actualSorties = expenseTotals?.actual || 0;
                const actualNetFlow = actualEntrees - actualSorties;

                const initialBalance = runningBalance;
                const finalBalance = initialBalance + actualNetFlow;

                positions.push({
                    initial: initialBalance,
                    final: finalBalance,
                    netCashFlow: actualNetFlow,
                    totalEntrees: actualEntrees,
                    totalSorties: actualSorties,
                    actualNetFlow: actualNetFlow,
                    periodInfo: period.label,
                    periodStart: period.startDate,
                    periodEnd: period.endDate,
                    budgetNetFlow: (revenueTotals?.budget || 0) - (expenseTotals?.budget || 0)
                });
                runningBalance = finalBalance;
            }

            return positions;
        } catch (error) {
            console.error('Erreur dans calculatePeriodPositions:', error);
            return [];
        }
    }, [calculateGeneralTotals]);

    const periodPositions = useMemo(() => {
        try {
            return calculatePeriodPositions(
                periods,
                effectiveCashAccounts || [],
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
        effectiveCashAccounts,
        groupedData,
        filteredExpandedAndVatEntries,
        finalActualTransactions,
        hasOffBudgetRevenues,
        hasOffBudgetExpenses,
        calculatePeriodPositions
    ]);

    const calculateActualAmountForPeriodWrapper = useCallback((entry, transactions, periodStart, periodEnd, realBudgetData) => {
        return calculateActualAmountForPeriod(entry, transactions, periodStart, periodEnd, realBudgetData);
    }, []);

    const calculateGeneralTotalsWrapper = useCallback((data, period, type, expandedEntries, transactions, hasOffBudgetRevenues, hasOffBudgetExpenses) => {
        return calculateGeneralTotals(data, period, type, expandedEntries, transactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
    }, []);

    const calculateMainCategoryTotalsWrapper = useCallback((entries, period, transactions) => {
        return calculateMainCategoryTotals(entries, period, transactions);
    }, []);

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

    const dataState = {
        periods,
        groupedData,
        filteredExpandedAndVatEntries,
        hasOffBudgetRevenues,
        hasOffBudgetExpenses,
        periodPositions,
        calculateGeneralTotals: calculateGeneralTotalsWrapper,
        calculateMainCategoryTotals: calculateMainCategoryTotalsWrapper,
        calculateEntryBudgetForPeriod,
        calculateActualAmountForPeriod: calculateActualAmountForPeriodWrapper,
        getEntryDescription,
        getFrequencyTitle,
        getResteColor,
        filteredBudgetEntries,
        normalizedTransactions
    };

    return children(dataState);
};

export default BudgetDataManager;