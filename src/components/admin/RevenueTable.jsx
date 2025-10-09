import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const RevenueTable = ({ data }) => {
    const formatCurrency = (value) => {
        return `€${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Rapport Financier Mensuel</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 whitespace-nowrap">
                            <tr>
                                <th scope="col" className="px-6 py-3">Mois</th>
                                <th scope="col" className="px-6 py-3 text-center">En Essai</th>
                                <th scope="col" className="px-6 py-3 text-center">Solo (M)</th>
                                <th scope="col" className="px-6 py-3 text-center">Solo (A)</th>
                                <th scope="col" className="px-6 py-3 text-center">Team (M)</th>
                                <th scope="col" className="px-6 py-3 text-center">Team (A)</th>
                                <th scope="col" className="px-6 py-3 text-right">Chiffre d'Affaires</th>
                                <th scope="col" className="px-6 py-3 text-right">Commissions</th>
                                <th scope="col" className="px-6 py-3 text-right">Marge Brute</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                    <td className="px-6 py-4 font-medium whitespace-nowrap">{row.month}</td>
                                    <td className="px-6 py-4 text-center">{row.trialUsers}</td>
                                    <td className="px-6 py-4 text-center">{row.subscribers.solo_monthly}</td>
                                    <td className="px-6 py-4 text-center">{row.subscribers.solo_yearly}</td>
                                    <td className="px-6 py-4 text-center">{row.subscribers.team_monthly}</td>
                                    <td className="px-6 py-4 text-center">{row.subscribers.team_yearly}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{formatCurrency(row.revenue)}</td>
                                    <td className="px-6 py-4 text-right text-orange-400">{formatCurrency(row.commissions)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-primary">{formatCurrency(row.grossMargin)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default RevenueTable;
