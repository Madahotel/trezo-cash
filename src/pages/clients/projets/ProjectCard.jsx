import React from 'react';
import {
    Calendar,
    Edit,
    Trash2,
    BarChart,
    Globe,
    Archive,
    RotateCw,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Textarea } from '../../../components/ui/textarea';

const ProjectCard = ({
    project,
    isSelectMode,
    isSelected,
    onToggleSelection,
    projectTypeIcons,
    projectTypeColors,
    getProjectIcon,
    getProjectColor,
    formatCurrency,
    editingProjectId,
    editForm,
    setEditForm,
    setEditingProjectId,
    updateProject,
    navigate,
    handleArchiveProject,
    handleRestoreProject,
    handleDeleteProject,
    localLoading,
}) => {
    // Utilisez les nouvelles fonctions pour obtenir l'icône et la couleur
    const IconComponent = getProjectIcon(project.typeName);
    const projectColor = getProjectColor(project.typeName);

    const getProgressPercentage = (realized, budget) => {
        if (budget === 0) return 0;
        return Math.min((realized / budget) * 100, 100);
    };

    const getNetBudget = (project) => project.incomeBudget - project.expenseBudget;
    const getNetRealized = (project) => project.incomeRealized - project.expenseRealized;

    const formatDate = (dateString) => {
        if (!dateString) return 'Non définie';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const netBudget = getNetBudget(project);
    const netRealized = getNetRealized(project);
    const incomeProgress = getProgressPercentage(project.incomeRealized, project.incomeBudget);
    const expenseProgress = getProgressPercentage(project.expenseRealized, project.expenseBudget);

    // Classes Tailwind dynamiques pour les couleurs
    const colorClasses = {
        blue: {
            bg: 'bg-blue-100',
            text: 'text-blue-600',
            badge: 'bg-blue-500',
            icon: 'text-blue-500'
        },
        pink: {
            bg: 'bg-pink-100',
            text: 'text-pink-600',
            badge: 'bg-pink-500',
            icon: 'text-pink-500'
        },
        green: {
            bg: 'bg-green-100',
            text: 'text-green-600',
            badge: 'bg-green-500',
            icon: 'text-green-500'
        },
        gray: {
            bg: 'bg-gray-100',
            text: 'text-gray-600',
            badge: 'bg-gray-500',
            icon: 'text-gray-500'
        }
    };

    const currentColor = colorClasses[projectColor] || colorClasses.gray;

    return (
        <Card className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>

            {isSelectMode && (
                <div className="absolute top-3 left-3 z-10">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(project.id)}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                </div>
            )}
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg ${currentColor.bg} flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className={`w-5 h-5 ${currentColor.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            {editingProjectId === project.id ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                    <Textarea
                                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                                        rows={2}
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    />
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingProjectId(null)}
                                            className="h-7 text-xs"
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                updateProject(editForm);
                                                setEditingProjectId(null);
                                            }}
                                            className="h-7 text-xs bg-blue-500 hover:bg-blue-600"
                                        >
                                            Enregistrer
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <CardTitle className="text-base truncate">{project.name}</CardTitle>
                                        <span className={`px-2 py-0.5 text-xs ${currentColor.badge} text-white rounded-full flex-shrink-0`}>
                                            {project.typeName}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">{project.description}</p>
                                    <div className="flex items-center space-x-1 mt-1">
                                        <Globe className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">{project.mainCurrency}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {project.is_archived ? (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full flex-shrink-0">Archivé</span>
                    ) : (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full flex-shrink-0">Actif</span>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-3">
                    {/* Budget Summary */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-500 mb-1">Revenus</p>
                            <p className="font-semibold text-green-600 text-sm">
                                {formatCurrency(project.incomeRealized, project.mainCurrency)} / {formatCurrency(project.incomeBudget, project.mainCurrency)}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                    className="bg-green-500 h-1.5 rounded-full"
                                    style={{ width: `${Math.min(incomeProgress, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-500 mb-1">Dépenses</p>
                            <p className="font-semibold text-red-500 text-sm">
                                {formatCurrency(project.expenseRealized, project.mainCurrency)} / {formatCurrency(project.expenseBudget, project.mainCurrency)}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                    className="bg-red-500 h-1.5 rounded-full"
                                    style={{ width: `${Math.min(expenseProgress, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 mb-1">Solde Net</p>
                        <div className="flex justify-between text-xs">
                            <span>
                                Prévu: <span className={`font-semibold ${netBudget >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {formatCurrency(netBudget, project.mainCurrency)}
                                </span>
                            </span>
                            <span>
                                Réalisé: <span className={`font-semibold ${netRealized >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {formatCurrency(netRealized, project.mainCurrency)}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Durée indéterminée */}
                    {project.isDurationUndetermined && (
                        <div className="text-center p-1 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-600 font-medium">
                                ⏳ Durée indéterminée
                            </p>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(project.startDate)}
                        </div>
                        {!project.isDurationUndetermined && (
                            <>
                                <span className="text-gray-400">→</span>
                                <div>{formatDate(project.endDate)}</div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 pt-2 border-t border-gray-100">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-7"
                            onClick={() => navigate(`/client/project/${project.id}/dashboard`)}
                            disabled={project.is_archived || localLoading}
                        >
                            <BarChart className="w-3 h-3 mr-1" />
                            Voir
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            disabled={project.is_archived || localLoading}
                            onClick={() => {
                                setEditingProjectId(project.id);
                                setEditForm({ ...project });
                            }}
                        >
                            <Edit className="w-3 h-3" />
                        </Button>

                        {project.is_archived ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0"
                                onClick={() => handleRestoreProject(project.id)}
                                title="Restaurer le projet"
                            >
                                <RotateCw className="w-3 h-3" />
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0"
                                onClick={() => handleArchiveProject(project)}
                                title="Archiver le projet"
                            >
                                <Archive className="w-3 h-3" />
                            </Button>
                        )}

                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                                if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le projet "${project.name}" ?`)) {
                                    handleDeleteProject(project.id);
                                }
                            }}
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProjectCard;