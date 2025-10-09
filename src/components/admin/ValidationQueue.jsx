import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Check } from 'lucide-react';

const ValidationQueue = ({ validations, onValidate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Validations</CardTitle>
      </CardHeader>
      <CardContent>
        {validations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aucune validation en attente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Ambassadeur</th>
                  <th scope="col" className="px-6 py-3">Période</th>
                  <th scope="col" className="px-6 py-3 text-right">Montant</th>
                  <th scope="col" className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {validations.map((validation) => (
                  <tr key={validation.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-4 font-medium">{validation.ambassadorName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{validation.month}</td>
                    <td className="px-6 py-4 text-right font-semibold">€{validation.commission.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onValidate(validation.id)}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                      >
                        <Check className="h-4 w-4 mr-1.5" />
                        Valider
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ValidationQueue;
