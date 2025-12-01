import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Layers,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Users,
    PieChart,
    BarChart,
    Download,
    Share2,
    Filter,
    Calendar,
    Target,
    CheckCircle,
    AlertCircle,
    XCircle,
    ChevronLeft,
    Save,
    FileText,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Loader2,
    RefreshCw,
    MoreVertical,
    Edit,
    Archive,
    Trash2
} from '../../../utils/Icons';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../../components/context/UIContext';

const ConsolidatedView = ({
    consolidatedViewData,
    onBack,
    onSave,
    onRefresh,
    formatCurrency,
    getProjectIcon,
    getProjectColor,
    loading,
    error,
    data,
    onEdit,
    onArchive,
    onDelete
}) => {
    const { uiDispatch } = useUI();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Gestion du clic en dehors du menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Gestion du clic sur la carte de vue consolidée
    const handleViewClick = () => {
        if (consolidatedViewData?.id) {
            uiDispatch({ 
                type: 'SET_ACTIVE_PROJECT', 
                payload: `consolidated_view_${consolidatedViewData.id}` 
            });
            navigate('/app/dashboard');
        }
    };

    // Calculer des métriques supplémentaires avec sécurité
    const metrics = useMemo(() => {
        if (!data) {
            return {
                performance: 0,
                profitableProjects: 0,
                deficitProjects: 0,
                averageMargin: 0,
                performanceColor: 'text-gray-600',
                performanceLabel: 'Non disponible',
                performanceIconColor: 'bg-gray-100 text-gray-600'
            };
        }

        // S'assurer que les valeurs sont des nombres
        const totalBudget = Number(data.totalBudget) || 0;
        const totalExpenses = Number(data.totalExpenses) || 0;
        const selectedProjects = Array.isArray(data.selectedProjects) ? data.selectedProjects : [];
        
        const performance = totalBudget > 0 ? 
            ((totalBudget - totalExpenses) / totalBudget) * 100 : 0;

        const profitableProjects = selectedProjects.filter(p => 
            (Number(p.net) || 0) > 0
        ).length;

        const deficitProjects = selectedProjects.filter(p => 
            (Number(p.net) || 0) < 0
        ).length;

        const averageMargin = totalBudget > 0 ? 
            ((totalBudget - totalExpenses) / totalBudget) * 100 : 0;

        return {
            performance,
            profitableProjects,
            deficitProjects,
            averageMargin,
            performanceColor: performance >= 80 ? 'text-green-600' : 
                            performance >= 60 ? 'text-blue-600' : 
                            performance >= 40 ? 'text-yellow-600' : 
                            performance >= 20 ? 'text-orange-600' : 'text-red-600',
            performanceLabel: performance >= 80 ? 'Excellent' : 
                            performance >= 60 ? 'Bon' : 
                            performance >= 40 ? 'Moyen' : 
                            performance >= 20 ? 'Faible' : 'Critique',
            performanceIconColor: performance >= 80 ? 'bg-green-100 text-green-600' : 
                                performance >= 60 ? 'bg-blue-100 text-blue-600' : 
                                performance >= 40 ? 'bg-yellow-100 text-yellow-600' : 
                                performance >= 20 ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
        };
    }, [data]);

    // Fonction pour exporter les données avec sécurité
    const exportData = () => {
        if (!data) return;

        try {
            const exportObj = {
                titre: "Rapport Consolidé",
                date: new Date().toISOString(),
                vueConsolidee: consolidatedViewData?.name || "Vue sans nom",
                nombreProjets: data.totalProjects || 0,
                resume: {
                    totalBudget: data.totalBudget || 0,
                    totalDepenses: data.totalExpenses || 0,
                    soldeNet: data.totalNet || 0,
                    performance: metrics.performance.toFixed(2) + '%'
                },
                projets: (data.selectedProjects || []).map(p => ({
                    nom: p.name || 'Sans nom',
                    type: p.typeName || 'Non défini',
                    budget: p.incomeRealized || 0,
                    depenses: p.expenseRealized || 0,
                    solde: p.net || 0,
                    performance: (p.performance || 0).toFixed(2) + '%'
                })),
                parType: Object.entries(data.projectsByType || {}).map(([type, info]) => ({
                    type,
                    nombre: info.count || 0,
                    budget: info.budget || 0,
                    depenses: info.expenses || 0,
                    marge: info.budget > 0 ? ((info.budget - info.expenses) / info.budget * 100).toFixed(2) + '%' : '0%'
                }))
            };

            const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rapport-consolide-${(consolidatedViewData?.name || 'vue').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erreur lors de l\'export:', err);
            alert('Erreur lors de l\'export des données');
        }
    };

    // Fonction pour exporter en CSV avec sécurité
    const exportToCSV = () => {
        if (!data) return;

        try {
            const headers = ['Projet', 'Type', 'Budget', 'Dépenses', 'Solde', 'Performance'];
            const rows = (data.selectedProjects || []).map(p => [
                `"${p.name || 'Sans nom'}"`,
                `"${p.typeName || 'Non défini'}"`,
                p.incomeRealized || 0,
                p.expenseRealized || 0,
                p.net || 0,
                (p.performance || 0).toFixed(2) + '%'
            ]);

            rows.push([
                'TOTAUX',
                '',
                data.totalBudget || 0,
                data.totalExpenses || 0,
                data.totalNet || 0,
                metrics.performance.toFixed(2) + '%'
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rapport-consolide-${(consolidatedViewData?.name || 'vue').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erreur lors de l\'export CSV:', err);
            alert('Erreur lors de l\'export CSV');
        }
    };

    const shareReport = () => {
        if (!data) return;
        
        try {
            if (navigator.share) {
                navigator.share({
                    title: `Rapport Consolidé: ${consolidatedViewData?.name || 'Vue sans nom'}`,
                    text: `Consolidation de ${data.totalProjects || 0} projets - Budget: ${formatCurrency(data.totalBudget || 0, data.currency || 'EUR')}`,
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Lien copié dans le presse-papier !');
            }
        } catch (err) {
            console.error('Erreur lors du partage:', err);
            alert('Erreur lors du partage');
        }
    };

    // États de chargement
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-gray-600">Chargement de la vue consolidée...</p>
                <Button onClick={onBack} variant="outline">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Retour
                </Button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <AlertCircle className="w-12 h-12 text-red-600" />
                <p className="text-gray-600">{error}</p>
                <div className="flex gap-2">
                    <Button onClick={onBack} variant="outline">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                    {onRefresh && (
                        <Button onClick={onRefresh} variant="default">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Réessayer
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <AlertCircle className="w-12 h-12 text-yellow-600" />
                <p className="text-gray-600">Aucune donnée disponible</p>
                <div className="flex gap-2">
                    <Button onClick={onBack} variant="outline">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                    {onRefresh && (
                        <Button onClick={onRefresh} variant="default">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Rafraîchir
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // S'assurer que les données sont disponibles
    const safeData = {
        totalProjects: data.totalProjects || 0,
        totalBudget: data.totalBudget || 0,
        totalExpenses: data.totalExpenses || 0,
        totalNet: data.totalNet || 0,
        currency: data.currency || 'EUR',
        projectsByType: data.projectsByType || {},
        selectedProjects: data.selectedProjects || []
    };

    return (
        <div className="space-y-4">
            {/* En-tête compact avec menu */}
            <Card className="border-blue-200 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div 
                                className="p-2 transition-shadow bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md"
                                onClick={handleViewClick}
                            >
                                <Layers className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-gray-900 truncate">
                                        {consolidatedViewData?.name || 'Vue Consolidée'}
                                    </h2>
                                    <div className="relative" ref={menuRef}>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setIsMenuOpen(!isMenuOpen); 
                                            }} 
                                            className="p-1 text-gray-400 transition-colors rounded-full hover:text-gray-600 hover:bg-white/50"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                        <AnimatePresence>
                                            {isMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute right-0 z-50 w-48 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg top-full"
                                                >
                                                    <ul className="p-1">
                                                        <li>
                                                            <button 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    onEdit?.(); 
                                                                    setIsMenuOpen(false); 
                                                                }} 
                                                                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                                                            >
                                                                <Edit size={14} /> 
                                                                Modifier
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    onArchive?.(); 
                                                                    setIsMenuOpen(false); 
                                                                }} 
                                                                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                                                            >
                                                                <Archive size={14} /> 
                                                                Archiver
                                                            </button>
                                                        </li>
                                                        <li><hr className="my-1 border-gray-200" /></li>
                                                        <li>
                                                            <button 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    onDelete?.(); 
                                                                    setIsMenuOpen(false); 
                                                                }} 
                                                                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-red-600 hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 size={14} /> 
                                                                Supprimer
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <p className="text-sm text-blue-700 transition-colors cursor-pointer hover:text-blue-800" onClick={handleViewClick}>
                                    {safeData.totalProjects} projet{safeData.totalProjects > 1 ? 's' : ''} • 
                                    <span className="ml-1 font-semibold">{formatCurrency(safeData.totalNet, safeData.currency)}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {onRefresh && (
                                <Button
                                    onClick={onRefresh}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2.5 text-xs"
                                    title="Rafraîchir les données"
                                >
                                    <RefreshCw className="w-3 h-3 mr-1.5" />
                                    Rafraîchir
                                </Button>
                            )}
                            <Button
                                onClick={onSave}
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs"
                                disabled={!data}
                            >
                                <Save className="w-3 h-3 mr-1.5" />
                                Sauvegarder
                            </Button>
                            <Button
                                onClick={exportData}
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs"
                                disabled={!data}
                            >
                                <Download className="w-3 h-3 mr-1.5" />
                                Exporter
                            </Button>
                            <Button
                                onClick={shareReport}
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs"
                                disabled={!data}
                            >
                                <Share2 className="w-3 h-3 mr-1.5" />
                                Partager
                            </Button>
                            <Button
                                onClick={onBack}
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs"
                            >
                                <ChevronLeft className="w-3 h-3 mr-1" />
                                Retour
                            </Button>
                        </div>
                    </div>
                    
                    {/* Stats miniatures en ligne */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        <div 
                            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-700 transition-colors rounded-md cursor-pointer bg-blue-50 hover:bg-blue-100"
                            onClick={handleViewClick}
                        >
                            <DollarSign className="w-3 h-3" />
                            <span className="font-medium">{formatCurrency(safeData.totalBudget, safeData.currency)}</span>
                        </div>
                        <div 
                            className="flex items-center gap-1 px-2 py-1 text-xs text-red-700 transition-colors rounded-md cursor-pointer bg-red-50 hover:bg-red-100"
                            onClick={handleViewClick}
                        >
                            <TrendingDown className="w-3 h-3" />
                            <span className="font-medium">{formatCurrency(safeData.totalExpenses, safeData.currency)}</span>
                        </div>
                        <div 
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer transition-colors ${
                                safeData.totalNet >= 0 
                                    ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                            onClick={handleViewClick}
                        >
                            <TrendingUp className="w-3 h-3" />
                            <span className="font-medium">{formatCurrency(safeData.totalNet, safeData.currency)}</span>
                        </div>
                        <div 
                            className="flex items-center gap-1 px-2 py-1 text-xs text-purple-700 transition-colors rounded-md cursor-pointer bg-purple-50 hover:bg-purple-100"
                            onClick={handleViewClick}
                        >
                            <Target className="w-3 h-3" />
                            <span className="font-medium">{metrics.performance.toFixed(0)}%</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Cartes de statistiques compactes */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {/* Performance */}
                <Card className="transition-shadow border-green-100 cursor-pointer hover:shadow-md" onClick={handleViewClick}>
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className={`p-1 rounded ${metrics.performanceIconColor}`}>
                                    <Target className="w-3 h-3" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Performance</p>
                                    <p className={`text-sm font-bold ${metrics.performanceColor}`}>
                                        {metrics.performance.toFixed(0)}%
                                    </p>
                                </div>
                            </div>
                            <Badge 
                                size="sm" 
                                className={metrics.performance >= 60 ? 'bg-green-100 text-green-800' : 
                                                        metrics.performance >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                                                        'bg-red-100 text-red-800'}
                            >
                                {metrics.performanceLabel}
                            </Badge>
                        </div>
                        <Progress value={metrics.performance} className="h-1" />
                    </CardContent>
                </Card>

                {/* Budget */}
                <Card className="transition-shadow border-blue-100 cursor-pointer hover:shadow-md" onClick={handleViewClick}>
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1 text-blue-600 bg-blue-100 rounded">
                                    <DollarSign className="w-3 h-3" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Budget</p>
                                    <p className="text-sm font-bold text-blue-600">
                                        {formatCurrency(safeData.totalBudget, safeData.currency)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-blue-700">Projets rentables</span>
                                <span className="font-semibold">{metrics.profitableProjects}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dépenses */}
                <Card className="transition-shadow border-red-100 cursor-pointer hover:shadow-md" onClick={handleViewClick}>
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1 text-red-600 bg-red-100 rounded">
                                    <TrendingDownIcon className="w-3 h-3" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Dépenses</p>
                                    <p className="text-sm font-bold text-red-600">
                                        {formatCurrency(safeData.totalExpenses, safeData.currency)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-red-700">Projets déficitaires</span>
                                <span className="font-semibold">{metrics.deficitProjects}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Projets */}
                <Card className="transition-shadow border-purple-100 cursor-pointer hover:shadow-md" onClick={handleViewClick}>
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className="p-1 text-purple-600 bg-purple-100 rounded">
                                    <Users className="w-3 h-3" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Projets</p>
                                    <p className="text-sm font-bold text-purple-600">
                                        {safeData.totalProjects}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs space-y-0.5">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Types</span>
                                <Badge variant="outline" size="sm">
                                    {Object.keys(safeData.projectsByType).length}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Marge moy.</span>
                                <span className={`font-semibold ${metrics.averageMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.averageMargin.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Graphiques compactés */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Répartition par type - Version compacte */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                <PieChart className="w-4 h-4 text-gray-500" />
                                Répartition par type
                            </h3>
                            <span className="text-xs text-gray-500">
                                {Object.keys(safeData.projectsByType).length} types
                            </span>
                        </div>
                        <div className="space-y-2">
                            {Object.entries(safeData.projectsByType).map(([type, info]) => {
                                const percentage = safeData.totalBudget > 0 ? (info.budget / safeData.totalBudget) * 100 : 0;
                                const color = getProjectColor(type);
                                const colorClasses = {
                                    blue: 'bg-blue-500',
                                    green: 'bg-green-500',
                                    pink: 'bg-pink-500',
                                    gray: 'bg-gray-500'
                                };

                                return (
                                    <div key={type} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${colorClasses[color] || 'bg-gray-300'}`}></div>
                                                <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">{type}</span>
                                                <Badge variant="outline" size="sm" className="text-xs">
                                                    {info.count}
                                                </Badge>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-semibold text-gray-900">
                                                    {formatCurrency(info.budget - info.expenses, safeData.currency)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {percentage.toFixed(0)}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-1 overflow-hidden bg-gray-200 rounded-full">
                                            <div 
                                                className={`h-full ${colorClasses[color] || 'bg-gray-400'}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Performance par projet - Version compacte */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                <BarChart className="w-4 h-4 text-gray-500" />
                                Performance par projet
                            </h3>
                            <span className="text-xs text-gray-500">
                                Triée par performance
                            </span>
                        </div>
                        <div className="pr-1 space-y-2 overflow-y-auto max-h-64">
                            {safeData.selectedProjects
                                .sort((a, b) => (b.performance || 0) - (a.performance || 0))
                                .slice(0, 8)
                                .map((project) => {
                                    const performance = project.performance || 0;
                                    const performanceColor = performance >= 80 ? 'border-green-200 bg-green-50' :
                                                          performance >= 60 ? 'border-blue-200 bg-blue-50' :
                                                          performance >= 40 ? 'border-yellow-200 bg-yellow-50' :
                                                          performance >= 20 ? 'border-orange-200 bg-orange-50' :
                                                          'border-red-200 bg-red-50';
                                    
                                    const IconComponent = getProjectIcon(project.typeName);
                                    const color = getProjectColor(project.typeName);
                                    const colorClasses = {
                                        blue: 'bg-blue-100 text-blue-700',
                                        green: 'bg-green-100 text-green-700',
                                        pink: 'bg-pink-100 text-pink-700',
                                        gray: 'bg-gray-100 text-gray-700'
                                    };

                                    const solde = (project.incomeRealized || 0) - (project.expenseRealized || 0);

                                    return (
                                        <div key={project.id} className={`p-2 border rounded-md ${performanceColor} hover:shadow-sm transition-shadow cursor-pointer`}
                                             onClick={handleViewClick}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${colorClasses[color] || 'bg-gray-100'}`}>
                                                        {IconComponent && <IconComponent className="w-3 h-3" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate">{project.name || 'Sans nom'}</p>
                                                        <p className="text-xs text-gray-500 truncate">{project.typeName || 'Non défini'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-bold">
                                                        {performance.toFixed(0)}%
                                                    </div>
                                                    <div className={`text-xs ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(solde, safeData.currency)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-1 overflow-hidden bg-gray-200 rounded-full">
                                                <div 
                                                    className={`h-full ${performance >= 80 ? 'bg-green-500' : 
                                                               performance >= 60 ? 'bg-blue-500' : 
                                                               performance >= 40 ? 'bg-yellow-500' : 
                                                               performance >= 20 ? 'bg-orange-500' : 'bg-red-500'}`}
                                                    style={{ width: `${performance}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            {safeData.selectedProjects.length > 8 && (
                                <div className="pt-1 text-center">
                                    <span className="text-xs text-gray-500">
                                        +{safeData.selectedProjects.length - 8} autres projets
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tableau compact */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Détail des projets</h3>
                            <p className="text-xs text-gray-500">
                                {safeData.totalProjects} projets • Performance moyenne: {metrics.performance.toFixed(0)}%
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                onClick={exportToCSV}
                                variant="outline"
                                size="sm"
                                className="px-2 text-xs h-7"
                                disabled={!data}
                            >
                                <FileText className="w-3 h-3 mr-1" />
                                CSV
                            </Button>
                            <Badge variant="outline" size="sm" className="text-xs">
                                <Filter className="w-3 h-3 mr-1" />
                                Triée
                            </Badge>
                        </div>
                    </div>
                    
                    {/* Tableau compact avec scroll horizontal */}
                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th scope="col" className="py-2 pl-3 pr-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            Projet
                                        </th>
                                        <th scope="col" className="px-2 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            Type
                                        </th>
                                        <th scope="col" className="px-2 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            Budget
                                        </th>
                                        <th scope="col" className="px-2 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            Dépenses
                                        </th>
                                        <th scope="col" className="px-2 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            Solde
                                        </th>
                                        <th scope="col" className="px-2 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                            Perf.
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {safeData.selectedProjects.map((project) => {
                                        const solde = (project.incomeRealized || 0) - (project.expenseRealized || 0);
                                        const performance = project.performance || 0;
                                        const performanceIcon = performance >= 80 ? <CheckCircle className="w-3 h-3 text-green-500" /> :
                                                             performance >= 60 ? <CheckCircle className="w-3 h-3 text-blue-500" /> :
                                                             performance >= 40 ? <AlertCircle className="w-3 h-3 text-yellow-500" /> :
                                                             <XCircle className="w-3 h-3 text-red-500" />;

                                        const IconComponent = getProjectIcon(project.typeName);
                                        const projectColor = getProjectColor(project.typeName);

                                        return (
                                            <tr key={project.id} className="cursor-pointer hover:bg-gray-50" onClick={handleViewClick}>
                                                <td className="py-2 pl-3 pr-2 text-sm whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`w-5 h-5 rounded mr-2 flex items-center justify-center ${
                                                            projectColor === 'blue' ? 'bg-blue-100' : 
                                                            projectColor === 'green' ? 'bg-green-100' : 
                                                            projectColor === 'pink' ? 'bg-pink-100' : 
                                                            'bg-gray-100'
                                                        }`}>
                                                            {IconComponent && <IconComponent className="w-2.5 h-2.5" />}
                                                        </div>
                                                        <div className="max-w-[120px]">
                                                            <div className="text-xs font-medium text-gray-900 truncate">{project.name || 'Sans nom'}</div>
                                                            <div className="text-xs text-gray-500 truncate">{project.typeName || 'Non défini'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 whitespace-nowrap">
                                                    <Badge variant="outline" size="sm" className="text-xs">
                                                        {(project.typeName || 'ND').substring(0, 3)}
                                                    </Badge>
                                                </td>
                                                <td className="px-2 py-2 text-xs font-medium text-green-600 whitespace-nowrap">
                                                    {formatCurrency(project.incomeRealized || 0, safeData.currency)}
                                                </td>
                                                <td className="px-2 py-2 text-xs font-medium text-red-600 whitespace-nowrap">
                                                    {formatCurrency(project.expenseRealized || 0, safeData.currency)}
                                                </td>
                                                <td className="px-2 py-2 whitespace-nowrap">
                                                    <div className={`text-xs font-medium ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {solde >= 0 ? '+' : ''}{formatCurrency(solde, safeData.currency)}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        {performanceIcon}
                                                        <span className="text-xs font-medium">{performance.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="2" className="py-2 pl-3 pr-2 text-xs font-semibold text-right text-gray-900">
                                            Totaux
                                        </td>
                                        <td className="px-2 py-2 text-xs font-semibold text-green-600">
                                            {formatCurrency(safeData.totalBudget, safeData.currency)}
                                        </td>
                                        <td className="px-2 py-2 text-xs font-semibold text-red-600">
                                            {formatCurrency(safeData.totalExpenses, safeData.currency)}
                                        </td>
                                        <td className="px-2 py-2 text-xs font-semibold">
                                            <span className={safeData.totalNet >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {safeData.totalNet >= 0 ? '+' : ''}{formatCurrency(safeData.totalNet, safeData.currency)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2 text-xs font-semibold text-gray-900">
                                            {metrics.performance.toFixed(0)}%
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Résumé compact en bas du tableau */}
                    <div className="pt-3 mt-3 border-t border-gray-200">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="text-xs text-gray-600">
                                    <span className="font-medium">{metrics.profitableProjects}</span> rentables
                                </div>
                                <div className="text-xs text-gray-600">
                                    <span className="font-medium">{metrics.deficitProjects}</span> déficitaires
                                </div>
                                <div className="text-xs text-gray-600">
                                    <span className="font-medium">{Object.keys(safeData.projectsByType).length}</span> types
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    onClick={exportData}
                                    variant="outline"
                                    size="sm"
                                    className="px-2 text-xs h-7"
                                    disabled={!data}
                                >
                                    <Download className="w-3 h-3 mr-1" />
                                    Exporter
                                </Button>
                                <Button
                                    onClick={onSave}
                                    variant="default"
                                    size="sm"
                                    className="px-2 text-xs bg-blue-600 h-7 hover:bg-blue-700"
                                    disabled={!data}
                                >
                                    <Save className="w-3 h-3 mr-1" />
                                    Sauvegarder
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default React.memo(ConsolidatedView);