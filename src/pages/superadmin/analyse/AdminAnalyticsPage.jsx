import React, { useState, useMemo } from 'react';
import { getDailyRevenueData } from '../data/mockData';
import RevenueChart from '../../../components/admin/RevenueChart';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { cn } from '../../../components/lib/utils';

const timeframes = [
    { key: '30d', label: '30 jours', days: 30 },
    { key: '3m', label: '3 mois', days: 90 },
    { key: '6m', label: '6 mois', days: 180 },
    { key: '1y', label: '1 an', days: 365 },
];

const AdminAnalyticsPage = () => {
    const [activeTimeframe, setActiveTimeframe] = useState('30d');

    const dailyData = useMemo(() => getDailyRevenueData(365), []);

    const filteredData = useMemo(() => {
        const selected = timeframes.find(t => t.key === activeTimeframe);
        return dailyData.slice(-selected.days);
    }, [dailyData, activeTimeframe]);

    const totalRevenue = useMemo(() => {
        return filteredData.reduce((sum, item) => sum + item.revenue, 0);
    }, [filteredData]);
    
    const latestSubscriberCount = useMemo(() => {
        return filteredData.length > 0 ? filteredData[filteredData.length - 1].subscriberCount : 0;
    }, [filteredData]);


    const formatCurrency = (value) => {
        return `€${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">Analyse de la Croissance</h2>
                <p className="text-muted-foreground">Évolution du chiffre d'affaires et des abonnés sur différentes périodes.</p>
            </header>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle>Évolution du CA et des Abonnés</CardTitle>
                            <div className="text-muted-foreground text-sm mt-1 flex flex-wrap gap-x-4">
                                <p>
                                    Total CA : <span className="font-bold text-primary">{formatCurrency(totalRevenue)}</span>
                                </p>
                                <p>
                                    Abonnés : <span className="font-bold text-info">{latestSubscriberCount.toLocaleString('fr-FR')}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
                            {timeframes.map(tf => (
                                <button
                                    key={tf.key}
                                    onClick={() => setActiveTimeframe(tf.key)}
                                    className={cn(
                                        'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                                        activeTimeframe === tf.key
                                            ? 'bg-background shadow-sm text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-background/50'
                                    )}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                        <RevenueChart data={filteredData} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminAnalyticsPage;
