import React, { useMemo } from 'react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    Filter,
} from '../../../utils/Icons';
import { Card, CardContent } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';

const ConsolidatedView = ({
    consolidatedViewData,
    data,
    formatCurrency,
    selectedFrequency,
    onFilterChange
}) => {
    const filteredData = useMemo(() => {
        if (!data || !data.selectedProjects || !Array.isArray(data.selectedProjects)) {
            return {
                selectedProjects: [],
                totalRevenue: 0,
                totalExpenses: 0,
                totalNet: 0,
                totalProjects: 0,
                averagePerformance: 0
            };
        }
        const filterProjects = (projects) => {
            if (selectedFrequency === 'tous') {
                return projects.map(project => {
                    const budgetsWithAmount = project.budgets?.filter(b => b.hasAmount) || [];
                    const revenues = budgetsWithAmount
                        .filter(b => b.typeId === 2)
                        .reduce((sum, b) => sum + b.amount, 0);
                    const expenses = budgetsWithAmount
                        .filter(b => b.typeId === 1)
                        .reduce((sum, b) => sum + b.amount, 0);
                    return {
                        ...project,
                        revenue: revenues,
                        expenses: expenses,
                        net: revenues - expenses,
                        performance: revenues > 0 ? ((revenues - expenses) / revenues) * 100 : 0
                    };
                });
            }

            return projects.map(project => {
                if (!project.budgets || !Array.isArray(project.budgets)) {
                    return {
                        ...project,
                        revenue: 0,
                        expenses: 0,
                        net: 0,
                        performance: 0,
                        budgets: []
                    };
                }
                const filteredBudgets = project.budgets.filter(budget => {
                    if (!budget || !budget.hasAmount) return false;

                    const frequency = budget.frequency?.toLowerCase() || '';
                    if (!frequency) return false;
                    const normalizedFreq = frequency === 'monsuel' ? 'mensuel' : frequency;

                    return normalizedFreq === selectedFrequency;
                });
                const totalRevenue = filteredBudgets
                    .filter(b => b.typeId === 2) // Revenus (Entrée)
                    .reduce((sum, b) => sum + b.amount, 0);

                const totalExpenses = filteredBudgets
                    .filter(b => b.typeId === 1) // Dépenses (Sortie)
                    .reduce((sum, b) => sum + b.amount, 0);

                return {
                    ...project,
                    budgets: filteredBudgets,
                    revenue: totalRevenue,
                    expenses: totalExpenses,
                    net: totalRevenue - totalExpenses,
                    performance: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
                    budgetCount: filteredBudgets.length
                };
            });
        };

        const filteredProjects = filterProjects(data.selectedProjects);

        const totalRevenue = filteredProjects.reduce((sum, p) => sum + (p.revenue || 0), 0);
        const totalExpenses = filteredProjects.reduce((sum, p) => sum + (p.expenses || 0), 0);
        const totalNet = totalRevenue - totalExpenses;
        const totalProjects = filteredProjects.length;
        const averagePerformance = totalProjects > 0 ?
            filteredProjects.reduce((sum, p) => sum + (p.performance || 0), 0) / totalProjects : 0;

        return {
            selectedProjects: filteredProjects,
            totalRevenue,
            totalExpenses,
            totalNet,
            totalProjects,
            averagePerformance
        };
    }, [data, selectedFrequency]);

    const frequencyStats = useMemo(() => {
        const stats = {
            tous: { count: 0, revenue: 0, expenses: 0 },
            ponctuel: { count: 0, revenue: 0, expenses: 0 },
            mensuel: { count: 0, revenue: 0, expenses: 0 },
            journalier: { count: 0, revenue: 0, expenses: 0 },
            hebdomadaire: { count: 0, revenue: 0, expenses: 0 },
            annuel: { count: 0, revenue: 0, expenses: 0 }
        };

        if (!data || !data.selectedProjects || !Array.isArray(data.selectedProjects)) {
            return stats;
        }
        data.selectedProjects.forEach(project => {
            if (!project.budgets || !Array.isArray(project.budgets)) {
                return;
            }
            project.budgets.forEach(budget => {
                const freq = budget.frequency?.toLowerCase() || 'non spécifiée';
                const key = freq === 'monsuel' ? 'mensuel' :
                    ['ponctuel', 'mensuel', 'journalier', 'hebdomadaire', 'annuel'].includes(freq) ? freq : 'autres';
                if (stats[key]) {
                    stats[key].count++;
                    if (budget.hasAmount) {
                        if (budget.typeId === 2) { // Revenu (Entrée)
                            stats[key].revenue += (budget.amount || 0);
                        } else if (budget.typeId === 1) { // Dépense (Sortie)
                            stats[key].expenses += (budget.amount || 0);
                        }
                    }
                }
            });
        });
        Object.keys(stats).forEach(key => {
            if (key !== 'tous' && stats[key]) {
                stats.tous.count += (stats[key].count || 0);
                stats.tous.revenue += (stats[key].revenue || 0);
                stats.tous.expenses += (stats[key].expenses || 0);
            }
        });

        return stats;
    }, [data]);

    if (!filteredData) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500">Aucune donnée disponible</p>
            </div>
        );
    }

    const { totalRevenue, totalExpenses, totalNet, selectedProjects } = filteredData;
    const performance = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

    if (selectedProjects.length === 0) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-gray-500">
                            {selectedFrequency === 'tous'
                                ? 'Aucun projet avec des budgets consolidés'
                                : `Aucun budget avec la fréquence "${selectedFrequency}"`}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-gray-600">Revenus totaux</span>
                            </div>
                            <p className="text-2xl font-bold text-green-700">
                                {formatCurrency(totalRevenue, 'EUR')}
                            </p>
                            <div className="mt-1 text-xs text-gray-500">
                                Consolidés
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                                <span className="text-sm font-medium text-gray-600">Dépenses totales</span>
                            </div>
                            <p className="text-2xl font-bold text-red-700">
                                {formatCurrency(totalExpenses, 'EUR')}
                            </p>
                            <div className="mt-1 text-xs text-gray-500">
                                Consolidées
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium text-gray-600">Solde net</span>
                            </div>
                            <p className={`text-2xl font-bold ${totalNet >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {formatCurrency(totalNet, 'EUR')}
                            </p>
                            <div className="mt-1 text-xs text-gray-500">
                                Performance: {performance.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between mb-1 text-xs text-gray-600">
                            <span>Performance globale</span>
                            <span>{performance.toFixed(1)}%</span>
                        </div>
                        <Progress
                            value={Math.min(Math.max(performance, 0), 100)}
                            className="h-2"
                            indicatorClassName={performance >= 0 ? 'bg-green-500' : 'bg-red-500'}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <h3 className="font-semibold text-gray-900">Répartition par fréquence</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                        {Object.entries(frequencyStats).map(([freq, stats]) => (
                            <button
                                key={freq}
                                onClick={() => onFilterChange(freq)}
                                className={`p-3 rounded-lg border transition-all ${selectedFrequency === freq
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="mb-1 text-xs font-medium text-gray-600 capitalize">
                                        {freq === 'tous' ? 'Total' : freq}
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {stats.count || 0}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        budgets
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <div className="text-xs">
                                            <span className="text-green-600">
                                                +{formatCurrency(stats.revenue || 0, 'EUR')}
                                            </span>
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-red-600">
                                                -{formatCurrency(stats.expenses || 0, 'EUR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Projets consolidés</h3>
                        <Badge variant="outline">
                            {selectedProjects.length} projets
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        {selectedProjects.map(project => {
                            const isProfitable = project.net >= 0;
                            const budgetsWithAmount = project.budgets?.filter(b => b.hasAmount) || [];
                            return (
                                <div key={project.id} className="p-4 transition-colors border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{project.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Calendar className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs text-gray-500">
                                                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Sans date'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(project.net, 'EUR')}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {project.performance?.toFixed(1) || 0}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-3 mt-3 border-t">
                                        <div>
                                            <div className="text-xs text-gray-500">Revenus</div>
                                            <div className="text-sm font-medium text-green-600">
                                                {formatCurrency(project.revenue || 0, 'EUR')}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Dépenses</div>
                                            <div className="text-sm font-medium text-red-600">
                                                {formatCurrency(project.expenses || 0, 'EUR')}
                                            </div>
                                        </div>
                                    </div>

                                    {budgetsWithAmount.length > 0 && (
                                        <div className="pt-3 mt-3 border-t">
                                            <div className="mb-2 text-xs text-gray-500">
                                                Budgets ({budgetsWithAmount.length})
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {budgetsWithAmount.slice(0, 3).map(budget => (
                                                    <Badge
                                                        key={budget.id}
                                                        variant="outline"
                                                        size="sm"
                                                        className={`text-xs ${budget.typeId === 2 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                                                    >
                                                        {budget.frequency || 'Sans fréquence'}
                                                    </Badge>
                                                ))}
                                                {budgetsWithAmount.length > 3 && (
                                                    <Badge variant="outline" size="sm" className="text-xs">
                                                        +{budgetsWithAmount.length - 3} autres
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {selectedProjects.length > 0 && (
                        <div className="pt-4 mt-6 border-t">
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div>
                                    <div className="text-xs text-gray-500">Projets rentables</div>
                                    <div className="text-sm font-medium text-green-600">
                                        {selectedProjects.filter(p => (p.net || 0) > 0).length}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Projets déficitaires</div>
                                    <div className="text-sm font-medium text-red-600">
                                        {selectedProjects.filter(p => (p.net || 0) < 0).length}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Moyenne revenus</div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {formatCurrency(
                                            selectedProjects.reduce((sum, p) => sum + (p.revenue || 0), 0) / selectedProjects.length,
                                            'EUR'
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Moyenne performance</div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {(
                                            selectedProjects.reduce((sum, p) => sum + (p.performance || 0), 0) / selectedProjects.length
                                        ).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default React.memo(ConsolidatedView);