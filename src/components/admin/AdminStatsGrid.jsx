import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Users, UserCheck, Euro, Trophy } from 'lucide-react';

const StatCard = ({ icon, title, value, subtext }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </CardContent>
  </Card>
);

const AdminStatsGrid = ({ stats }) => {
  if (!stats) return null;

  const activePercentage = stats.totalAmbassadors > 0 
    ? ((stats.activeAmbassadors / stats.totalAmbassadors) * 100).toFixed(0)
    : 0;

  return (
    <div>
        <h3 className="text-xl font-semibold mb-4">Statistiques Globales</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Total ambassadeurs"
                value={stats.totalAmbassadors}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
                title="Ambassadeurs actifs"
                value={stats.activeAmbassadors}
                subtext={`${activePercentage}% du total`}
                icon={<UserCheck className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
                title="Commissions versées"
                value={`€${stats.totalMonthlyCommissions.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtext="par mois (estimation)"
                icon={<Euro className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
                title="Top ambassadeur"
                value={stats.topAmbassador.name}
                subtext={`€${stats.topAmbassador.monthlyCommission.toFixed(2)}/mois`}
                icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
            />
        </div>
    </div>
  );
};

export default AdminStatsGrid;
