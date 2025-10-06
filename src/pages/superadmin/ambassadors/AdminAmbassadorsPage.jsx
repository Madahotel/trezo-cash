import React, { useState, useCallback, useMemo } from 'react';
import { getFullAmbassadorDataList, TIERS } from '../data/mockData';
import AmbassadorDetailsModal from '../../../components/admin/AmbassadorDetailsModal';
import { Input } from '../../../components/ui/Input';
import { cn } from '../../../components/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { ArrowUpDown } from 'lucide-react';

const SortableHeader = ({ children, sortKey, onSort, sortConfig, className }) => {
    const isSorted = sortConfig.key === sortKey;
    const direction = isSorted ? sortConfig.direction : null;

    return (
        <th scope="col" className={cn("px-6 py-3", className)}>
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

const AdminAmbassadorsPage = () => {
    const [sponsors] = useState(getFullAmbassadorDataList());
    const [selectedSponsor, setSelectedSponsor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [tierFilter, setTierFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'registrationDate', direction: 'descending' });

    const filteredAndSortedSponsors = useMemo(() => {
        let sortableItems = [...sponsors];

        // Filtering
        sortableItems = sortableItems.filter(sponsor => {
            const searchMatch = sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              sponsor.email.toLowerCase().includes(searchTerm.toLowerCase());
            const tierMatch = tierFilter === 'all' || sponsor.currentTier.name === tierFilter;
            return searchMatch && tierMatch;
        });

        // Sorting
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let valA, valB;
                if (sortConfig.key === 'tier') {
                    valA = a.currentTier.min;
                    valB = b.currentTier.min;
                } else {
                    valA = a[sortConfig.key];
                    valB = b[sortConfig.key];
                }

                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [sponsors, searchTerm, tierFilter, sortConfig]);

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSponsorSelect = useCallback((sponsor) => {
        setSelectedSponsor(sponsor);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedSponsor(null);
    }, []);
    
    const tierOptions = ['all', ...Object.values(TIERS).map(t => t.name)];

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">Gestion des Ambassadeurs</h2>
                <p className="text-muted-foreground">Consultez, filtrez et gérez tous les ambassadeurs du programme.</p>
            </header>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input
                            type="text"
                            placeholder="Rechercher par nom ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                            {tierOptions.map(tier => (
                                <button
                                    key={tier}
                                    onClick={() => setTierFilter(tier)}
                                    className={cn(
                                        'px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize',
                                        tierFilter === tier
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary text-muted-foreground hover:bg-muted'
                                    )}
                                >
                                    {tier === 'all' ? 'Tous les niveaux' : tier}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                                <tr>
                                    <SortableHeader sortKey="name" onSort={handleSort} sortConfig={sortConfig}>Ambassadeur</SortableHeader>
                                    <SortableHeader sortKey="tier" onSort={handleSort} sortConfig={sortConfig}>Statut</SortableHeader>
                                    <SortableHeader sortKey="registrationDate" onSort={handleSort} sortConfig={sortConfig}>Date d'inscription</SortableHeader>
                                    <SortableHeader sortKey="validatedReferrals" onSort={handleSort} sortConfig={sortConfig} className="text-center">Filleuls Validés</SortableHeader>
                                    <SortableHeader sortKey="monthlyCommission" onSort={handleSort} sortConfig={sortConfig} className="text-right">Commission Mensuelle</SortableHeader>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedSponsors.map((sponsor) => (
                                    <tr
                                        key={sponsor.id}
                                        className="border-b border-border hover:bg-muted cursor-pointer"
                                        onClick={() => handleSponsorSelect(sponsor)}
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
                                        <td className="px-6 py-4 text-muted-foreground">{formatDate(sponsor.registrationDate)}</td>
                                        <td className="px-6 py-4 text-center">{sponsor.validatedReferrals}</td>
                                        <td className="px-6 py-4 text-right">€{sponsor.monthlyCommission.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {selectedSponsor && (
                <AmbassadorDetailsModal
                    sponsor={selectedSponsor}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default AdminAmbassadorsPage;
