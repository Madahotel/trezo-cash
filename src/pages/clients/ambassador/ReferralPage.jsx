import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Check, Clock, XCircle, Calendar, Package, UserCheck, Mail, Phone } from 'lucide-react';

const ReferralsPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'registrationDate', direction: 'descending' });

    // Données de démonstration
    const mockData = [
        { id: 1, name: 'Jean Dupont', status: 'actif', pack: 'Premium', registrationDate: '2024-11-01', email: 'jean.dupont@email.com', phone: '+33 6 12 34 56 78' },
        { id: 2, name: 'Marie Martin', status: 'essai', pack: 'Starter', registrationDate: '2024-11-05', email: 'marie.martin@email.com', phone: '+33 6 23 45 67 89' },
        { id: 3, name: 'Pierre Lambert', status: 'actif', pack: 'Business', registrationDate: '2024-10-28', email: 'pierre.lambert@email.com', phone: '+33 6 34 56 78 90' },
        { id: 4, name: 'Sophie Bernard', status: 'inactif', pack: 'Starter', registrationDate: '2024-10-15', email: 'sophie.bernard@email.com', phone: '+33 6 45 67 89 01' },
        { id: 5, name: 'Thomas Moreau', status: 'actif', pack: 'Premium', registrationDate: '2024-11-08', email: 'thomas.moreau@email.com', phone: '+33 6 56 78 90 12' },
        { id: 6, name: 'Julie Dubois', status: 'essai', pack: 'Business', registrationDate: '2024-11-10', email: 'julie.dubois@email.com', phone: '+33 6 67 89 01 23' },
        { id: 7, name: 'Lucas Petit', status: 'actif', pack: 'Premium', registrationDate: '2024-10-22', email: 'lucas.petit@email.com', phone: '+33 6 78 90 12 34' },
        { id: 8, name: 'Emma Roux', status: 'inactif', pack: 'Starter', registrationDate: '2024-10-10', email: 'emma.roux@email.com', phone: '+33 6 89 01 23 45' },
    ];

    useEffect(() => {
        // Simulation du chargement des données
        setTimeout(() => {
            setData(mockData);
            setLoading(false);
        }, 800);
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

    const getStatusInfo = (status) => {
        switch (status) {
            case 'actif':
                return {
                    label: 'Actif',
                    icon: Check,
                    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                };
            case 'essai':
                return {
                    label: 'En essai',
                    icon: Clock,
                    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                };
            case 'inactif':
                return {
                    label: 'Inactif',
                    icon: XCircle,
                    color: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                };
            default:
                return {
                    label: status,
                    icon: UserCheck,
                    color: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                };
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    const statusOptions = [
        { value: 'all', label: 'Tous les statuts', count: data?.length || 0 },
        { value: 'actif', label: 'Actifs', count: data?.filter(r => r.status === 'actif').length || 0 },
        { value: 'essai', label: 'En essai', count: data?.filter(r => r.status === 'essai').length || 0 },
        { value: 'inactif', label: 'Inactifs', count: data?.filter(r => r.status === 'inactif').length || 0 },
    ];

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
        }
        return sortConfig.direction === 'ascending'
            ? <ArrowUp className="w-4 h-4 text-blue-600" />
            : <ArrowDown className="w-4 h-4 text-blue-600" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="p-8 text-center bg-white border border-red-100 shadow-sm rounded-2xl">
                    <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">Erreur de chargement</h3>
                    <p className="text-sm text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            <div className="mx-auto space-y-6 max-w-7xl">

                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-gray-900">Mes Filleuls</h1>
                    <p className="text-gray-600">Gérez et suivez tous les utilisateurs que vous avez parrainés</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {statusOptions.map(option => (
                        <div
                            key={option.value}
                            className="p-5 transition-shadow bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md"
                        >
                            <div className="text-sm text-gray-600">{option.label}</div>
                            <div className="mt-1 text-3xl font-bold text-gray-900">{option.count}</div>
                        </div>
                    ))}
                </div>

                {/* Filters and Search */}
                <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full py-3 pl-10 pr-4 text-sm transition-all border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filters */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <div className="flex flex-wrap gap-2">
                                {statusOptions.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setStatusFilter(option.value)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${statusFilter === option.value
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                                        <button
                                            onClick={() => handleSort('name')}
                                            className="flex items-center gap-2 transition-colors hover:text-blue-600"
                                        >
                                            Filleul
                                            {getSortIcon('name')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                                        <button
                                            onClick={() => handleSort('status')}
                                            className="flex items-center gap-2 transition-colors hover:text-blue-600"
                                        >
                                            Statut
                                            {getSortIcon('status')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                                        <button
                                            onClick={() => handleSort('pack')}
                                            className="flex items-center gap-2 transition-colors hover:text-blue-600"
                                        >
                                            Pack
                                            {getSortIcon('pack')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                                        <button
                                            onClick={() => handleSort('registrationDate')}
                                            className="flex items-center gap-2 transition-colors hover:text-blue-600"
                                        >
                                            Inscription
                                            {getSortIcon('registrationDate')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                                        Contact
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAndSortedReferrals.length > 0 ? (
                                    filteredAndSortedReferrals.map(referral => {
                                        const statusInfo = getStatusInfo(referral.status);
                                        const StatusIcon = statusInfo.icon;

                                        return (
                                            <tr
                                                key={referral.id}
                                                className="transition-colors hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-10 h-10 font-semibold text-blue-600 rounded-full bg-blue-50">
                                                            {referral.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{referral.name}</div>
                                                            <div className="text-xs text-gray-500">{referral.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${statusInfo.color}`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-900">{referral.pack}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        {formatDate(referral.registrationDate)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button className="p-2 transition-colors rounded-lg hover:bg-blue-50 group">
                                                            <Mail className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                                        </button>
                                                        <button className="p-2 transition-colors rounded-lg hover:bg-blue-50 group">
                                                            <Phone className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-4 mb-4 bg-gray-100 rounded-full">
                                                    <UserCheck className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h3 className="mb-1 text-lg font-semibold text-gray-900">Aucun filleul trouvé</h3>
                                                <p className="text-sm text-gray-500">
                                                    {searchTerm || statusFilter !== 'all'
                                                        ? 'Essayez de modifier vos filtres de recherche'
                                                        : 'Invitez votre premier filleul pour commencer'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Info */}
                {filteredAndSortedReferrals.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-white border border-gray-100 shadow-sm rounded-xl">
                        <div className="text-sm text-gray-600">
                            Affichage de <span className="font-medium text-gray-900">{filteredAndSortedReferrals.length}</span> filleul{filteredAndSortedReferrals.length > 1 ? 's' : ''}
                            {(searchTerm || statusFilter !== 'all') && data && (
                                <span> sur <span className="font-medium text-gray-900">{data.length}</span> au total</span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">
                            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ReferralsPage;