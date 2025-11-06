import { useMemo } from "react";
import getTodayInTimezone from '../utils/getTodayInTimezone';
export const useScheduleData = (actualTransactions, settings) => {
    return useMemo(() => {
        if (!settings) return { transactionsByDate: new Map(), overdueTransactions: [] };
        const byDate = new Map();
        const overdue = [];
        const today = getTodayInTimezone(settings.timezoneOffset);

        (actualTransactions || []).forEach(actual => {
            const dueDate = new Date(actual.date);
            dueDate.setHours(0, 0, 0, 0);

            const isUnsettled = !['paid', 'received', 'written_off'].includes(actual.status);

            if (isUnsettled) {
                const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0);
                const remainingAmount = actual.amount - totalPaid;

                if (remainingAmount > 0.001) {
                    const transactionForDisplay = { ...actual, amount: remainingAmount };

                    const dateKey = dueDate.toISOString().split('T')[0];
                    if (!byDate.has(dateKey)) {
                        byDate.set(dateKey, []);
                    }
                    byDate.get(dateKey).push(transactionForDisplay);

                    if (dueDate < today) {
                        overdue.push(transactionForDisplay);
                    }
                }
            }
        });

        overdue.sort((a, b) => new Date(a.date) - new Date(b.date));

        return { transactionsByDate: byDate, overdueTransactions: overdue };
    }, [actualTransactions, settings]);
};
