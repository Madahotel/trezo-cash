import React, { useState, useMemo, useEffect } from 'react';
import api from '../../../components/config/Axios';
import ReferralsTable from '../../../components/ambassador/ReferralsTable';
// import { cn } from '../../lib/utils';
import { Input } from '../../../components/ui/input';
import { cn } from '../../../lib/utils';

const ReferralsPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'registrationDate', direction: 'descending' });

    // Récupération des données depuis l'API
    useEffect(() => {
        const fetchReferrals = async () => {
            try {
                setLoading(true);
                const response = await api.get('/filleul');

                // Transformer les données pour correspondre au format attendu
                const transformedData = response.data.filleuls.map(filleul => ({
                    id: filleul.id,
                    name: filleul.name,
                    status: filleul.status === 'active' ? 'actif' : filleul.status === 'trial' ? 'essai' : 'inactif',
                    pack: filleul.pack,
                    registrationDate: filleul.date_inscription
                }));

                setData(transformedData);
                setError(null);
            } catch (err) {
                console.error('Erreur lors du chargement des filleuls:', err);
                setError('Impossible de charger les filleuls. Veuillez réessayer.');
            } finally {
                setLoading(false);
            }
        };

        fetchReferrals();
    }, []);

    const filteredAndSortedReferrals = useMemo(() => {
        if (!data) return [];

        let sortableItems = [...data];

        // Filtrage
        sortableItems = sortableItems.filter(referral => {
            const nameMatch = referral.name.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'all' || referral.status === statusFilter;
            return nameMatch && statusMatch;
        });

        // Tri
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Gestion spéciale pour les dates
                if (sortConfig.key === 'registrationDate') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return sortableItems;
    }, [data, searchTerm, statusFilter, sortConfig]);

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const statusOptions = [
        { value: 'all', label: 'Tous' },
        { value: 'actif', label: 'Actifs' },
        { value: 'essai', label: 'En essai' },
        { value: 'inactif', label: 'Inactifs' },
    ];

    if (loading) {
        return <div>Chargement...</div>;
    }

    if (error) {
        return <div>Erreur: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">Mes Filleuls</h2>
                <p className="text-muted-foreground">
                    Gérez et suivez tous les utilisateurs que vous avez parrainés.
                </p>
            </header>

            <div className="flex flex-col gap-4 sm:flex-row">
                <Input
                    type="text"
                    placeholder="Rechercher par nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <div className="flex items-center gap-2">
                    {statusOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setStatusFilter(option.value)}
                            className={cn(
                                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                                statusFilter === option.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-muted-foreground hover:bg-muted'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <ReferralsTable
                referrals={filteredAndSortedReferrals}
                onSort={handleSort}
                sortConfig={sortConfig}
            />
        </div>
    );
};

export default ReferralsPage;