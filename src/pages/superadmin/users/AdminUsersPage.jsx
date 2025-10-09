import React, { useState, useMemo } from 'react';
import { getAllUsersData, PACKS } from '../data/mockData';
import UsersTable from '../../../components/admin/UsersTable';
import { Input } from '../../../components/ui/Input';
import { cn } from '../../../components/lib/utils';

const AdminUsersPage = () => {
    const [users] = useState(getAllUsersData());
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [packFilter, setPackFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'registrationDate', direction: 'descending' });

    const filteredAndSortedUsers = useMemo(() => {
        let sortableItems = [...users];

        // Filtering
        sortableItems = sortableItems.filter(user => {
            const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'all' || user.status === statusFilter;
            const packMatch = packFilter === 'all' || user.packId === packFilter;
            return searchMatch && statusMatch && packMatch;
        });

        // Sorting
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return sortableItems;
    }, [users, searchTerm, statusFilter, packFilter, sortConfig]);

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const statusOptions = [
        { value: 'all', label: 'Tous les statuts' },
        { value: 'abonné', label: 'Abonné' },
        { value: 'essai', label: 'En essai' },
    ];
    
    const packOptions = [
        { value: 'all', label: 'Tous les packs' },
        ...Object.values(PACKS).map(p => ({ value: p.id, label: p.name }))
    ];

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h2>
                <p className="text-muted-foreground">Liste complète de tous les utilisateurs de l'application.</p>
            </header>

            <div className="space-y-4">
                <Input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
                <div className="flex flex-wrap gap-2">
                     <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
                        {statusOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setStatusFilter(option.value)}
                                className={cn(
                                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                                    statusFilter === option.value
                                        ? 'bg-background shadow-sm text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-background/50'
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                     <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
                        <select 
                            value={packFilter} 
                            onChange={(e) => setPackFilter(e.target.value)}
                            className="bg-background shadow-sm text-primary-foreground px-3 py-1.5 text-sm font-medium rounded-md transition-colors border-0 focus:ring-0"
                        >
                            {packOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <UsersTable 
                users={filteredAndSortedUsers}
                onSort={handleSort}
                sortConfig={sortConfig}
            />
        </div>
    );
};

export default AdminUsersPage;
