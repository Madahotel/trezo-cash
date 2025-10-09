import React from 'react';
import { getRevenueData } from '../data/mockData';
import RevenueTable from '../../../components/admin/RevenueTable';

const AdminRevenuePage = () => {
    const revenueData = getRevenueData();

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">Chiffre d'affaires</h2>
                <p className="text-muted-foreground">Analyse financière mensuelle du programme.</p>
            </header>

            <RevenueTable data={revenueData} />
        </div>
    );
};

export default AdminRevenuePage;
