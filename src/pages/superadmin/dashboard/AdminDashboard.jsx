import React, { useState, useCallback, useEffect } from 'react';
import { getGlobalAdminStats, getPendingValidations } from '../data/mockData';
import AdminStatsGrid from '../../../components/admin/AdminStatsGrid';
import TierDistribution from '../../../components/admin/TierDistribution';
import ValidationQueue from '../../../components/admin/ValidationQueue';
import AdminAmbassadorsSummaryCard from '../../../components/admin/AdminAmbassadorsSummaryCard';

const AdminDashboard = () => {
  const [pendingValidations, setPendingValidations] = useState([]);
  
  const globalStats = getGlobalAdminStats();

  useEffect(() => {
    setPendingValidations(getPendingValidations());
  }, []);

  const handleValidatePayment = useCallback((paymentId) => {
    setPendingValidations(prev => prev.filter(p => p.id !== paymentId));
    // In a real app, this would trigger an API call to update the payment status.
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">📊 Dashboard Admin</h2>
        <p className="text-muted-foreground">Vue d'ensemble du programme Ambassadeur.</p>
      </header>
      
      <AdminStatsGrid stats={globalStats} />

      <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <ValidationQueue 
            validations={pendingValidations} 
            onValidate={handleValidatePayment} 
          />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <TierDistribution 
            distribution={globalStats.tierDistribution} 
            total={globalStats.totalAmbassadors} 
          />
          <AdminAmbassadorsSummaryCard totalAmbassadors={globalStats.totalAmbassadors} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
