import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
// import { cn } from '../../lib/utils';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '../lib/utils';

const statusStyles = {
    actif: 'bg-green-500/20 text-green-400 border-green-500/30',
    essai: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    inactif: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const SortableHeader = ({ children, sortKey, onSort, sortConfig }) => {
    const isSorted = sortConfig.key === sortKey;
    const direction = isSorted ? sortConfig.direction : null;

    return (
        <th scope="col" className="px-6 py-3">
            <button onClick={() => onSort(sortKey)} className="flex items-center gap-2 group">
                {children}
                <ArrowUpDown className={cn(
                    "h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground",
                    isSorted && "text-foreground"
                )} />
            </button>
        </th>
    );
};


const ReferralsTable = ({ referrals, onSort, sortConfig }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase text-muted-foreground bg-secondary/50">
                            <tr>
                                <SortableHeader sortKey="name" onSort={onSort} sortConfig={sortConfig}>Nom</SortableHeader>
                                <SortableHeader sortKey="status" onSort={onSort} sortConfig={sortConfig}>Statut</SortableHeader>
                                <th scope="col" className="px-6 py-3">Pack</th>
                                <SortableHeader sortKey="registrationDate" onSort={onSort} sortConfig={sortConfig}>Date d'inscription</SortableHeader>
                            </tr>
                        </thead>
                        <tbody>
                            {referrals.length > 0 ? referrals.map((referral) => (
                                <tr key={referral.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                                    <td className="px-6 py-4 font-medium">{referral.name}</td>
                                    <td className="px-6 py-4">
                                        <Badge className={cn(statusStyles[referral.status])}>
                                            {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{referral.pack}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{formatDate(referral.registrationDate)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="py-16 text-center text-muted-foreground">
                                        Aucun filleul ne correspond à vos critères.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default ReferralsTable;
