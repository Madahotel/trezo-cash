import React, { useState, useMemo } from 'react';
import { History, DollarSign, TrendingUp, Calendar, CheckCircle, Clock, ArrowUpDown, ArrowUp, ArrowDown, Users, Eye, X } from 'lucide-react';

const PaymentHistoryPage = () => {
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'month', direction: 'descending' });

    // Données de démonstration
    const paymentHistory = [
        {
            id: 1,
            month: 'Novembre 2024',
            filleuls_actifs: 5,
            commission: 62.50,
            statut: 'En attente',
            date: '2024-11-30',
            filleuls_details: [
                { name: 'Jean Dupont', pack: 'Premium', amount: 12.50 },
                { name: 'Marie Martin', pack: 'Starter', amount: 12.50 },
                { name: 'Pierre Lambert', pack: 'Business', amount: 12.50 },
                { name: 'Thomas Moreau', pack: 'Premium', amount: 12.50 },
                { name: 'Lucas Petit', pack: 'Premium', amount: 12.50 },
            ]
        },
        {
            id: 2,
            month: 'Octobre 2024',
            filleuls_actifs: 4,
            commission: 50.00,
            statut: 'Validé',
            date: '2024-10-31',
            filleuls_details: [
                { name: 'Jean Dupont', pack: 'Premium', amount: 12.50 },
                { name: 'Pierre Lambert', pack: 'Business', amount: 12.50 },
                { name: 'Thomas Moreau', pack: 'Premium', amount: 12.50 },
                { name: 'Lucas Petit', pack: 'Premium', amount: 12.50 },
            ]
        },
        {
            id: 3,
            month: 'Septembre 2024',
            filleuls_actifs: 3,
            commission: 37.50,
            statut: 'Validé',
            date: '2024-09-30',
            filleuls_details: [
                { name: 'Jean Dupont', pack: 'Premium', amount: 12.50 },
                { name: 'Pierre Lambert', pack: 'Business', amount: 12.50 },
                { name: 'Thomas Moreau', pack: 'Premium', amount: 12.50 },
            ]
        },
        {
            id: 4,
            month: 'Août 2024',
            filleuls_actifs: 2,
            commission: 25.00,
            statut: 'Validé',
            date: '2024-08-31',
            filleuls_details: [
                { name: 'Jean Dupont', pack: 'Premium', amount: 12.50 },
                { name: 'Pierre Lambert', pack: 'Business', amount: 12.50 },
            ]
        },
    ];

    const sortedPayments = useMemo(() => {
        let sortable = [...paymentHistory];

        if (sortConfig.key) {
            sortable.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'month') {
                    aValue = new Date(a.date).getTime();
                    bValue = new Date(b.date).getTime();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return sortable;
    }, [sortConfig]);

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
        }
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-4 h-4 text-blue-600" />
            : <ArrowDown className="w-4 h-4 text-blue-600" />;
    };

    const getStatusInfo = (statut) => {
        switch (statut) {
            case 'Validé':
                return {
                    label: 'Validé',
                    icon: CheckCircle,
                    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                };
            case 'En attente':
                return {
                    label: 'En attente',
                    icon: Clock,
                    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                };
            default:
                return {
                    label: statut,
                    icon: Clock,
                    color: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                };
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    // Calculs statistiques
    const totalCommissions = paymentHistory.reduce((sum, p) => sum + p.commission, 0);
    const validatedCommissions = paymentHistory.filter(p => p.statut === 'Validé').reduce((sum, p) => sum + p.commission, 0);
    const pendingCommissions = paymentHistory.filter(p => p.statut === 'En attente').reduce((sum, p) => sum + p.commission, 0);
    const avgActiveReferrals = Math.round(paymentHistory.reduce((sum, p) => sum + p.filleuls_actifs, 0) / paymentHistory.length);

    return (
        <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            <div className="mx-auto space-y-6 max-w-7xl">

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-gray-900">Historique des Paiements</h1>
                    <p className="text-gray-600">Suivez vos commissions et paiements mensuels</p>
                </div>

                {/* Stats Cards */}


                {/* Payment History Table */}
                <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-900">Détail des Paiements</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                                        <button
                                            onClick={() => handleSort('month')}
                                            className="flex items-center gap-2 transition-colors hover:text-blue-600"
                                        >
                                            Mois
                                            {getSortIcon('month')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                                        <button
                                            onClick={() => handleSort('filleuls_actifs')}
                                            className="flex items-center justify-center gap-2 mx-auto transition-colors hover:text-blue-600"
                                        >
                                            Filleuls Actifs
                                            {getSortIcon('filleuls_actifs')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-right text-gray-600 uppercase">
                                        <button
                                            onClick={() => handleSort('commission')}
                                            className="flex items-center justify-end gap-2 ml-auto transition-colors hover:text-blue-600"
                                        >
                                            Commission
                                            {getSortIcon('commission')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                                        <button
                                            onClick={() => handleSort('statut')}
                                            className="flex items-center justify-center gap-2 mx-auto transition-colors hover:text-blue-600"
                                        >
                                            Statut
                                            {getSortIcon('statut')}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedPayments.length > 0 ? (
                                    sortedPayments.map(payment => {
                                        const statusInfo = getStatusInfo(payment.statut);
                                        const StatusIcon = statusInfo.icon;

                                        return (
                                            <tr
                                                key={payment.id}
                                                className="transition-colors hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-blue-50">
                                                            <Calendar className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <span className="font-medium text-gray-900">{payment.month}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => payment.filleuls_actifs > 0 && setSelectedPayment(payment)}
                                                        disabled={payment.filleuls_actifs === 0}
                                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 transition-all rounded-lg bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50"
                                                    >
                                                        <Users className="w-4 h-4" />
                                                        {payment.filleuls_actifs}
                                                        {payment.filleuls_actifs > 0 && <Eye className="w-3.5 h-3.5" />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-lg font-bold text-gray-900">
                                                        {formatCurrency(payment.commission)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${statusInfo.color}`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-4 mb-4 bg-gray-100 rounded-full">
                                                    <History className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h3 className="mb-1 text-lg font-semibold text-gray-900">Aucun paiement</h3>
                                                <p className="text-sm text-gray-500">
                                                    Vos paiements apparaîtront ici une fois que vous aurez des filleuls actifs
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info Section */}
                <div className="p-6 border border-blue-100 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white shadow-sm rounded-xl">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">
                                Calendrier de paiement
                            </h3>
                            <p className="text-sm text-gray-700">
                                Les commissions sont calculées mensuellement et validées le 5 du mois suivant. Les paiements sont effectués entre le 10 et le 15 de chaque mois pour les commissions validées.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal Détails des Filleuls */}
            {selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">Détails des Filleuls</h3>
                                <p className="text-sm text-gray-600">{selectedPayment.month}</p>
                            </div>
                            <button
                                onClick={() => setSelectedPayment(null)}
                                className="p-2 transition-colors rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {selectedPayment.filleuls_details.map((filleul, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 transition-colors border border-gray-100 rounded-xl hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 font-semibold text-blue-600 rounded-full bg-blue-50">
                                                {filleul.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{filleul.name}</div>
                                                <div className="text-xs text-gray-500">{filleul.pack}</div>
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {formatCurrency(filleul.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                                <span className="font-medium text-gray-700">Total</span>
                                <span className="text-xl font-bold text-gray-900">
                                    {formatCurrency(selectedPayment.commission)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentHistoryPage;