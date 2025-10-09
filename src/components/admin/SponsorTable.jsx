import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../lib/utils';

const SponsorTable = ({ sponsors, onSponsorSelect }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des Ambassadeurs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
              <tr>
                <th scope="col" className="px-6 py-3">Ambassadeur</th>
                <th scope="col" className="px-6 py-3">Statut</th>
                <th scope="col" className="px-6 py-3 text-center">Filleuls Validés</th>
                <th scope="col" className="px-6 py-3 text-right">Commission Mensuelle</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((sponsor) => (
                <tr 
                  key={sponsor.id} 
                  className="border-b border-border hover:bg-muted cursor-pointer"
                  onClick={() => onSponsorSelect(sponsor)}
                >
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>{sponsor.name}</span>
                      <span className="text-xs text-muted-foreground">{sponsor.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('font-semibold', sponsor.currentTier.color)}>
                      {sponsor.currentTier.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">{sponsor.validatedReferrals}</td>
                  <td className="px-6 py-4 text-right">€{sponsor.monthlyCommission.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SponsorTable;
