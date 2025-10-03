import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { TIERS } from '../../pages/superadmin/data/mockData';
import { cn } from '../../components/lib/utils';

const TierDistribution = ({ distribution, total }) => {
  const sortedTiers = Object.values(TIERS).sort((a, b) => b.min - a.min);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par Niveau</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {sortedTiers.map(tier => {
            const count = distribution[tier.name] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <li key={tier.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className={cn("font-semibold", tier.color)}>{tier.name}</span>
                  <span className="text-sm text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className={cn("h-2 rounded-full", tier.color.replace('text-', 'bg-'))}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default TierDistribution;
