import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Badge from '../ui/Badge';
import { cn } from '../../components/lib/utils';

const referralStatusStyles = {
  actif: 'bg-green-500/20 text-green-400 border-green-500/30',
  essai: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  inactif: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const paymentStatusStyles = {
    'Validé': 'bg-green-500/20 text-green-400 border-green-500/30',
    'En attente': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

const AmbassadorDetailsModal = ({ sponsor, onClose }) => {
  const [ibanCopied, setIbanCopied] = useState(false);

  if (!sponsor) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCopy = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-start justify-between sticky top-0 bg-card/95 backdrop-blur z-10 p-6">
          <div>
            <CardTitle className="text-2xl">{sponsor.name}</CardTitle>
            <p className={cn("font-semibold", sponsor.currentTier.color)}>
              Ambassadeur {sponsor.currentTier.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          {/* Banking Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Informations Bancaires (SEPA)</h4>
            <div className="p-4 bg-secondary rounded-lg space-y-3">
              {sponsor.bankingInfo ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">IBAN</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-medium">{sponsor.bankingInfo.iban}</p>
                      <button onClick={() => handleCopy(sponsor.bankingInfo.iban, setIbanCopied)} className="p-1.5 rounded-md hover:bg-muted/50">
                        {ibanCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">BIC / SWIFT</p>
                    <p className="font-mono font-medium">{sponsor.bankingInfo.bic}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">Aucune information bancaire fournie.</p>
              )}
            </div>
          </div>
        
          {/* Earnings History */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Historique des Gains</h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary">
                  <tr>
                    <th scope="col" className="px-6 py-3">Mois</th>
                    <th scope="col" className="px-6 py-3">Filleuls Actifs</th>
                    <th scope="col" className="px-6 py-3">Commission</th>
                    <th scope="col" className="px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsor.paymentHistory?.map((payment) => (
                    <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium">{payment.month}</td>
                      <td className="px-6 py-4">{payment.activeReferrals}</td>
                      <td className="px-6 py-4">€{payment.commission.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn(paymentStatusStyles[payment.status])}>
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Referrals History */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Historique des Filleuls</h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary">
                  <tr>
                    <th scope="col" className="px-6 py-3">Nom</th>
                    <th scope="col" className="px-6 py-3">Date d'inscription</th>
                    <th scope="col" className="px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsor.referrals?.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate)).map((referral) => (
                    <tr key={referral.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium">{referral.name}</td>
                      <td className="px-6 py-4">{formatDate(referral.registrationDate)}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn(referralStatusStyles[referral.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30')}>
                          {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-border">
             <button 
                onClick={onClose} 
                className="px-6 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors"
              >
                Fermer
              </button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default AmbassadorDetailsModal;
