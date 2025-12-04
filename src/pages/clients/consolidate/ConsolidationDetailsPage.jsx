import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConsolidationDetails } from '../../../hooks/useConsolidationDetails';
import ConsolidatedView from './ConsolidatedView';
import { formatCurrency } from '../../../utils/formatters';
import { useUI } from '../../../components/context/UIContext';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/card';
import { ArrowLeft, Loader2, AlertCircle, RefreshCw, Filter, BarChart3, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useConsolidations } from '../../../hooks/useConsolidations';

const ConsolidationDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    // const { formatCurrency } = useSettings();
    const { uiDispatch } = useUI();
    const { consolidations, loading: consolidationsLoading } = useConsolidations();

    const {
        loading,
        error,
        refetch,
        consolidatedViewData, 
        pagination,
        fetchPage
    } = useConsolidationDetails(id);

    const [currentPage, setCurrentPage] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedFrequency, setSelectedFrequency] = useState('tous');
    const currentConsolidation = consolidations?.find(c => c.id === parseInt(id)) || null;

    useEffect(() => {
        if (currentConsolidation) {
            uiDispatch({
                type: 'SET_ACTIVE_PROJECT',
                payload: {
                    id: `consolidated_view_${currentConsolidation.id}`,
                    name: currentConsolidation.name,
                    type: 'consolidated'
                }
            });
        }
    }, [currentConsolidation, uiDispatch]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch(id); 
        setIsRefreshing(false);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            setCurrentPage(newPage);
            fetchPage(newPage);
        }
    };

    const hasDataToDisplay = useMemo(() => {
        if (!consolidatedViewData) return false;

        const checks = [
            consolidatedViewData.hasData === true,
            consolidatedViewData.totalProjects > 0,
            consolidatedViewData.totalRevenue > 0 || consolidatedViewData.totalExpenses > 0,
            consolidatedViewData.selectedProjects && consolidatedViewData.selectedProjects.length > 0,
            consolidatedViewData.budgetsByProject && consolidatedViewData.budgetsByProject.length > 0,
            consolidatedViewData.realBudgets && consolidatedViewData.realBudgets.length > 0
        ];
        
        const hasData = checks.some(check => check === true);
        return hasData;
    }, [consolidatedViewData]);

    const isLoading = loading || consolidationsLoading || isRefreshing;

    if (loading && !consolidatedViewData) {
        return (
            <div className="min-h-screen p-4 space-y-6 bg-gray-50/50">
                <div className="space-y-4 animate-pulse">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-gray-200 rounded"></div>
                            <div className="w-64 h-4 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 animate-pulse">
                    {[...Array(4)].map((_, index) => (
                        <Card key={index} className="border-gray-200">
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                    <div className="flex-1">
                                        <div className="w-3/4 h-4 mb-2 bg-gray-200 rounded"></div>
                                        <div className="w-1/2 h-6 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="border-gray-200 animate-pulse">
                    <CardContent className="p-4">
                        <div className="h-48 bg-gray-100 rounded-lg"></div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 animate-pulse">
                    <CardContent className="p-0">
                        <div className="p-4 bg-gray-100 border-b">
                            <div className="w-48 h-5 bg-gray-200 rounded"></div>
                        </div>
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="p-4 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="w-32 h-4 bg-gray-200 rounded"></div>
                                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-red-200">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center space-y-4">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900">Erreur de chargement</h3>
                                <p className="mt-1 text-gray-600">{error}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => navigate('/client/projets')} variant="outline">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Retour
                                </Button>
                                <Button onClick={handleRefresh}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Réessayer
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => navigate('/client/projets')}
                        variant="outline"
                        size="sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {currentConsolidation?.name || 'Consolidation'}
                        </h1>
                        <p className="text-sm text-gray-600">
                            {consolidatedViewData?.totalProjects || 0} projet(s) consolidé(s)
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card className={`border-blue-100 ${consolidatedViewData?.totalProjects > 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${consolidatedViewData?.totalProjects > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                    <BarChart3 className={`w-5 h-5 ${consolidatedViewData?.totalProjects > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-700">Projets</p>
                                    <p className={`text-xl font-bold ${consolidatedViewData?.totalProjects > 0 ? 'text-blue-900' : 'text-gray-500'}`}>
                                        {consolidatedViewData?.totalProjects || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`border-emerald-100 ${consolidatedViewData?.totalRevenue > 0 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${consolidatedViewData?.totalRevenue > 0 ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                    <DollarSign className={`w-5 h-5 ${consolidatedViewData?.totalRevenue > 0 ? 'text-emerald-600' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-700">Revenus</p>
                                    <p className={`text-xl font-bold ${consolidatedViewData?.totalRevenue > 0 ? 'text-emerald-900' : 'text-gray-500'}`}>
                                        {formatCurrency(consolidatedViewData?.totalRevenue || 0, 'EUR')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`border-orange-100 ${consolidatedViewData?.totalExpenses > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${consolidatedViewData?.totalExpenses > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                                    <TrendingUp className={`w-5 h-5 ${consolidatedViewData?.totalExpenses > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-700">Dépenses</p>
                                    <p className={`text-xl font-bold ${consolidatedViewData?.totalExpenses > 0 ? 'text-orange-900' : 'text-gray-500'}`}>
                                        {formatCurrency(consolidatedViewData?.totalExpenses || 0, 'EUR')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`border-purple-100 ${consolidatedViewData?.totalNet !== 0 ? 'bg-purple-50' : 'bg-gray-50'}`}>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${consolidatedViewData?.totalNet !== 0 ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                    <Calendar className={`w-5 h-5 ${consolidatedViewData?.totalNet !== 0 ? 'text-purple-600' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-700">Solde Net</p>
                                    <p className={`text-xl font-bold ${consolidatedViewData?.totalNet > 0 ? 'text-purple-900' : consolidatedViewData?.totalNet < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                        {formatCurrency(consolidatedViewData?.totalNet || 0, 'EUR')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>

            {isLoading ? (
                <Card className="border-gray-200 animate-pulse">
                    <CardContent className="p-6">
                        <div className="h-48 mb-4 bg-gray-100 rounded-lg"></div>
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-8 bg-gray-100 rounded"></div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : hasDataToDisplay ? (
                <ConsolidatedView
                    consolidatedViewData={currentConsolidation}
                    data={consolidatedViewData}
                    formatCurrency={formatCurrency}
                    selectedFrequency={selectedFrequency}
                    onFilterChange={setSelectedFrequency}
                />
            ) : (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">
                            <AlertCircle className="w-12 h-12 mx-auto text-gray-400" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">
                                Consolidation configurée
                            </h3>
                            <p className="mt-2 text-gray-600">
                                {consolidatedViewData?.totalProjects === 0 
                                    ? 'Cette consolidation ne contient aucun projet.'
                                    : consolidatedViewData?.totalRevenue === 0 && consolidatedViewData?.totalExpenses === 0
                                    ? 'Cette consolidation contient des projets mais aucun budget n\'a été défini.'
                                    : 'Cette consolidation est configurée mais ne contient pas encore de données financières.'
                                }
                            </p>
                            <div className="flex justify-center gap-2 mt-4">
                                <Button 
                                    onClick={() => navigate(`/client/consolidations/edit/${id}`)}
                                    variant="default"
                                    size="sm"
                                >
                                    Modifier la consolidation
                                </Button>
                                <Button 
                                    onClick={() => navigate('/client/projets')}
                                    variant="outline"
                                    size="sm"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Retour aux projets
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {hasDataToDisplay && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Page {pagination.current_page} sur {pagination.total_pages}
                    </div>
                    <div className="flex gap-1">
                        <Button
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                            disabled={pagination.current_page <= 1}
                            variant="outline"
                            size="sm"
                        >
                            Précédent
                        </Button>
                        {Array.from({ length: Math.min(3, pagination.total_pages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <Button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    variant={pagination.current_page === pageNum ? "default" : "outline"}
                                    size="sm"
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                        {pagination.total_pages > 3 && <span className="px-2">...</span>}
                        <Button
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                            disabled={pagination.current_page >= pagination.total_pages}
                            variant="outline"
                            size="sm"
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsolidationDetailsPage;