import React from 'react';
import { useState, useEffect } from 'react';
import {
    Calendar,
    Edit,
    Trash2,
    BarChart,
    Globe,
    Archive,
    RotateCw,
    Users,
    UserPlus,
    Infinity,
    Target,
    TrendingUp,
    MoreVertical,
} from '../../../utils/Icons';
import { Button } from '../../../components/ui/Button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card';
import { Textarea } from '../../../components/ui/textarea';
import Badge from '../../../components/ui/badge';
import { formatCurrency } from '../../../utils/formatters';
import { apiGet } from '../../../components/context/actionsMethode';

const ProjectCard = ({
    project,
    isSelectMode,
    isSelected,
    onToggleSelection,
    projectTypeIcons,
    projectTypeColors,
    getProjectIcon,
    getProjectColor,
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
    activeProjectId,
}) => {
    const IconComponent = getProjectIcon(project.typeName);
    const projectColor = getProjectColor(project.typeName);
    const isActiveProject = activeProjectId === project.id;

    const isDurationUndetermined = project.isDurationUndetermined ||
        project.isEndDateIndefinite ||
        !project.endDate ||
        project.endDate === project.startDate;

    const [projectBudget, setProjectBudget] = useState({
        sumEntries: 0,
        sumExpenses: 0,
        sumForecast: 0,
        entryCount: 0,
        exitCount: 0
    });
    const [budgetLoading, setBudgetLoading] = useState(false);
    const [showCollaborators, setShowCollaborators] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    const [collaborators, setCollaborators] = useState([
        { id: 1, name: 'Jean Dupont', role: 'Manager', avatar: null },
        { id: 2, name: 'Marie Martin', role: 'Développeur', avatar: null },
        { id: 3, name: 'Pierre Lambert', role: 'Designer', avatar: null },
    ]);

    const fetchProjectBudget = async () => {
        if (!project.id || typeof project.id !== 'number') return;

        try {
            setBudgetLoading(true);
            
            const data = await apiGet(`/budget-projects/${project.id}`);
            
            // Calculez les sommes à partir de la réponse API
            let sumEntries = 0;
            let sumExpenses = 0;
            let entryCount = 0;
            let exitCount = 0;

            // Calcul des revenus (entries)
            if (data.entries && data.entries.entry_items && data.entries.entry_items.sub_categories) {
                sumEntries = data.entries.entry_items.sub_categories.reduce((total, item) => {
                    return total + parseFloat(item.amount || 0);
                }, 0);
                entryCount = data.entries.entry_count || 0;
            }

            // Calcul des dépenses (exits)
            if (data.exits && data.exits.exit_items && data.exits.exit_items.sub_categories) {
                sumExpenses = data.exits.exit_items.sub_categories.reduce((total, item) => {
                    return total + parseFloat(item.amount || 0);
                }, 0);
                exitCount = data.exits.exit_count || 0;
            }

            setProjectBudget({
                sumEntries: sumEntries,
                sumExpenses: sumExpenses,
                sumForecast: data.sumForecast || 0,
                entryCount: entryCount,
                exitCount: exitCount
            });
        } catch (err) {
            console.error('Erreur lors du chargement du budget du projet:', err);
            setProjectBudget({
                sumEntries: 0,
                sumExpenses: 0,
                sumForecast: 0,
                entryCount: 0,
                exitCount: 0
            });
        } finally {
            setBudgetLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        if (project.id && !budgetLoading) {
            fetchProjectBudget();
        }
        return () => {
            isMounted = false;
        };
    }, [project.id]);

    const getProgressPercentage = (realized, budget) => {
        if (budget === 0) return 0;
        return Math.min((realized / budget) * 100, 100);
    };

    const netBudget = projectBudget.sumEntries - projectBudget.sumExpenses;
    const netRealized = project.incomeRealized - project.expenseRealized;

    const incomeProgress = getProgressPercentage(
        project.incomeRealized,
        projectBudget.sumEntries || 1
    );
    const expenseProgress = getProgressPercentage(
        project.expenseRealized,
        projectBudget.sumExpenses || 1
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'Non définie';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

    // Palette de couleurs épurée et professionnelle
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-900',
            badge: 'bg-blue-100 text-blue-800 border-blue-200',
            icon: 'text-blue-600',
            progress: 'bg-blue-500',
            accent: 'bg-blue-500'
        },
        pink: {
            bg: 'bg-purple-50',
            text: 'text-purple-900',
            badge: 'bg-purple-100 text-purple-800 border-purple-200',
            icon: 'text-purple-600',
            progress: 'bg-purple-500',
            accent: 'bg-purple-500'
        },
        green: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-900',
            badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            icon: 'text-emerald-600',
            progress: 'bg-emerald-500',
            accent: 'bg-emerald-500'
        },
        gray: {
            bg: 'bg-slate-50',
            text: 'text-slate-900',
            badge: 'bg-slate-100 text-slate-800 border-slate-200',
            icon: 'text-slate-600',
            progress: 'bg-slate-500',
            accent: 'bg-slate-500'
        }
    };

    const currentColor = colorClasses[projectColor] || colorClasses.gray;

    const handleDurationChange = (isIndetermined) => {
        setEditForm(prev => ({
            ...prev,
            isDurationUndetermined: isIndetermined,
            endDate: isIndetermined ? null : prev.endDate
        }));
    };

    const getFinancialHealth = () => {
        // 1. Budget non défini
        if (netBudget === null || netBudget === undefined) {
            return "budget non défini";
        }
        // 2. Budget négatif → alerte fa manohy manao évaluation ihany
        if (netBudget < 0) {
            return "⚠️ budget négatif (à vérifier)";
        }
        // 3. Budget = 0 → tsy azo kajiana ny pourcentage
        if (netBudget === 0) {
            return "aucun budget alloué";
        }
        // 4. Raha netRealized négatif → déficit
        if (netRealized < 0) {
            return "déficitaire";
        }
        // 5. Raha ara-dalàna → kajy pourcentage
        const pourcentage = (netRealized / netBudget) * 100;

        if (pourcentage >= 100) return "excellent";
        if (pourcentage >= 80) return "très bon";
        if (pourcentage >= 60) return "bon";
        if (pourcentage >= 40) return "moyen";
        if (pourcentage >= 20) return "faible";

        return "à améliorer";
    };
    const financialHealth = getFinancialHealth();

    // Fonction pour fermer le menu d'actions en cliquant à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showActionsMenu) {
                setShowActionsMenu(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showActionsMenu]);

    return (
        <Card className={`relative transition-all duration-200 hover:shadow-md border border-slate-200 bg-white ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' :
                'hover:border-slate-300'
            } ${isActiveProject ? 'ring-1 ring-emerald-500' : ''}`}>

            {/* Indicateur de sélection compact */}
            {isSelectMode && (
                <div className="absolute z-10 top-2 left-2">
                    <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 cursor-pointer ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 hover:border-slate-400'
                            }`}
                        onClick={() => onToggleSelection(project.id)}
                    >
                        {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            <CardHeader className="pt-3 pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center flex-1 min-w-0 space-x-2">
                        <div className={`w-8 h-8 rounded-lg ${currentColor.bg} flex items-center justify-center flex-shrink-0 border border-slate-100`}>
                            <IconComponent className={`w-4 h-4 ${currentColor.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            {editingProjectId === project.id ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-slate-700">
                                            Nom du projet *
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 text-sm transition-all border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-slate-700">
                                            Description
                                        </label>
                                        <Textarea
                                            className="w-full px-3 py-2 text-sm transition-all border rounded-lg resize-none border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows={2}
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            Période du projet
                                        </label>

                                        <div>
                                            <label className="block mb-1 text-xs text-slate-600">
                                                Date de début
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2 text-sm transition-all border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={editForm.startDate ? new Date(editForm.startDate).toISOString().split('T')[0] : ''}
                                                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="edit-duration-indetermined"
                                                checked={editForm.isDurationUndetermined || !editForm.endDate}
                                                onChange={(e) => handleDurationChange(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            />
                                            <label htmlFor="edit-duration-indetermined" className="block ml-2 text-sm text-slate-700">
                                                Durée indéterminée
                                            </label>
                                        </div>

                                        {!(editForm.isDurationUndetermined || !editForm.endDate) && (
                                            <div>
                                                <label className="block mb-1 text-xs text-slate-600">
                                                    Date de fin
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full px-3 py-2 text-sm transition-all border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={editForm.endDate ? new Date(editForm.endDate).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                                    min={editForm.startDate}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingProjectId(null)}
                                            className="h-8 text-xs border-slate-300"
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                updateProject(editForm);
                                                setEditingProjectId(null);
                                            }}
                                            className="h-8 text-xs text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Enregistrer
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center flex-1 min-w-0 space-x-2">
                                            <CardTitle className="text-base font-semibold leading-tight truncate text-slate-900">
                                                {project.name}
                                            </CardTitle>
                                            <Badge variant="outline" className={`${currentColor.badge} text-xs font-medium px-1.5 py-0.5`}>
                                                {project.typeName}
                                            </Badge>
                                        </div>

                                        {/* Menu d'actions compact */}
                                        <div className="relative">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="p-0 w-7 h-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowActionsMenu(!showActionsMenu);
                                                }}
                                            >
                                                <MoreVertical className="w-3.5 h-3.5" />
                                            </Button>

                                            {showActionsMenu && (
                                                <div className="absolute right-0 top-7 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 min-w-[130px]">
                                                    <button
                                                        className="flex items-center w-full px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                                        onClick={() => {
                                                            setEditingProjectId(project.id);
                                                            setEditForm({
                                                                ...project,
                                                                isDurationUndetermined: project.isDurationUndetermined || !project.endDate
                                                            });
                                                            setShowActionsMenu(false);
                                                        }}
                                                    >
                                                        <Edit className="w-3 h-3 mr-1.5" />
                                                        Modifier
                                                    </button>
                                                    {project.is_archived ? (
                                                        <button
                                                            className="flex items-center w-full px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                                            onClick={() => {
                                                                handleRestoreProject(project.id);
                                                                setShowActionsMenu(false);
                                                            }}
                                                        >
                                                            <RotateCw className="w-3 h-3 mr-1.5" />
                                                            Restaurer
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="flex items-center w-full px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                                            onClick={() => {
                                                                handleArchiveProject(project);
                                                                setShowActionsMenu(false);
                                                            }}
                                                        >
                                                            <Archive className="w-3 h-3 mr-1.5" />
                                                            Archiver
                                                        </button>
                                                    )}

                                                    <button
                                                        className="flex items-center w-full px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                                                        onClick={async () => {
                                                            if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le projet "${project.name}" ?`)) {
                                                                try {
                                                                    await handleDeleteProject(project.id);

                                                                    // Déclencher un événement pour notifier la suppression
                                                                    window.dispatchEvent(new CustomEvent('projectDeleted', {
                                                                        detail: { projectId: project.id }
                                                                    }));

                                                                    // OU déclencher l'événement existant
                                                                    window.dispatchEvent(new CustomEvent('projectsUpdated', {
                                                                        detail: {
                                                                            action: 'deleted',
                                                                            projectId: project.id
                                                                        }
                                                                    }));

                                                                } catch (error) {
                                                                    console.error('Erreur lors de la suppression:', error);
                                                                }
                                                            }
                                                            setShowActionsMenu(false);
                                                        }}
                                                    >
                                                        <Trash2 className="w-3 h-3 mr-1.5" />
                                                        Supprimer
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <p className="mb-2 text-sm leading-relaxed text-slate-600 line-clamp-2">
                                        {project.description || "Aucune description fournie"}
                                    </p>
                                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                                        <div className="flex items-center space-x-1">
                                            <Globe className="w-3 h-3" />
                                            <span>{project.mainCurrency}</span>
                                        </div>

                                        <div
                                            className="flex items-center space-x-1 transition-colors cursor-pointer hover:text-slate-700"
                                            onMouseEnter={() => setShowCollaborators(true)}
                                            onMouseLeave={() => setShowCollaborators(false)}
                                        >
                                            <Users className="w-3 h-3" />
                                            <span>{collaborators.length}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {showCollaborators && collaborators.length > 0 && (
                    <div
                        className="absolute left-0 right-0 z-20 p-3 bg-white border rounded-lg shadow-lg border-slate-200 top-14"
                        onMouseEnter={() => setShowCollaborators(true)}
                        onMouseLeave={() => setShowCollaborators(false)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-slate-900">Équipe du projet</h4>
                            <Button size="sm" className="h-6 text-xs bg-blue-600 hover:bg-blue-700">
                                <UserPlus className="w-3 h-3 mr-1" />
                                Inviter
                            </Button>
                        </div>
                        <div className="space-y-1.5">
                            {collaborators.map((collaborator) => (
                                <div key={collaborator.id} className="flex items-center space-x-2 p-1.5 rounded hover:bg-slate-50">
                                    <div className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white rounded-full bg-slate-600">
                                        {getInitials(collaborator.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate text-slate-900">
                                            {collaborator.name}
                                        </p>
                                        <p className="text-xs truncate text-slate-500">
                                            {collaborator.role}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardHeader>

            {editingProjectId !== project.id && (
                <CardContent className="pt-0">
                    <div className="space-y-3">
                        {/* Indicateur de performance financière compact */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                            <span className="text-xs font-medium text-slate-700">Performance</span>
                            <div className="flex items-center space-x-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${financialHealth === 'excellent' ? 'bg-emerald-500' :
                                        financialHealth === 'bon' ? 'bg-blue-500' :
                                            financialHealth === 'moyen' ? 'bg-amber-500' :
                                                financialHealth === 'à améliorer' ? 'bg-orange-500' : 'bg-red-500'
                                    }`}></div>
                                <span className={`text-xs font-semibold ${financialHealth === 'excellent' ? 'text-emerald-700' :
                                        financialHealth === 'bon' ? 'text-blue-700' :
                                            financialHealth === 'moyen' ? 'text-amber-700' :
                                                financialHealth === 'à améliorer' ? 'text-orange-700' : 'text-red-700'
                                    }`}>
                                    {financialHealth.charAt(0).toUpperCase() + financialHealth.slice(1)}
                                </span>
                            </div>
                        </div>

                        {/* Budget Summary - Design compact */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-white border rounded-lg border-slate-200">
                                <div className="flex items-center justify-between mb-1">
                                    <div>
                                        <p className="text-xs font-medium text-slate-700">Revenus</p>
                                        <p className="text-xs text-slate-500">
                                            {projectBudget.entryCount} entrée{projectBudget.entryCount > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <Target className="w-3 h-3 text-slate-500" />
                                </div>
                                <p className="mb-1 text-sm font-bold text-slate-900">
                                    {budgetLoading ? (
                                        <span className="text-slate-400">...</span>
                                    ) : (
                                        formatCurrency(projectBudget.sumEntries, project.mainCurrency)
                                    )}
                                </p>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-500 ${currentColor.progress}`}
                                        style={{ width: `${Math.min(incomeProgress, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="p-2 bg-white border rounded-lg border-slate-200">
                                <div className="flex items-center justify-between mb-1">
                                    <div>
                                        <p className="text-xs font-medium text-slate-700">Dépenses</p>
                                        <p className="text-xs text-slate-500">
                                            {projectBudget.exitCount} sortie{projectBudget.exitCount > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <TrendingUp className="w-3 h-3 text-slate-500" />
                                </div>
                                <p className="mb-1 text-sm font-bold text-slate-900">
                                    {budgetLoading ? (
                                        <span className="text-slate-400">...</span>
                                    ) : (
                                        formatCurrency(projectBudget.sumExpenses, project.mainCurrency)
                                    )}
                                </p>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-500 ${currentColor.progress}`}
                                        style={{ width: `${Math.min(expenseProgress, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Net Balance - Design épuré */}
                        <div className="p-2 bg-white border rounded-lg border-slate-200">
                            <p className="mb-1 text-xs font-medium text-center text-slate-700">Solde Net</p>
                            <div className="flex items-center justify-between">
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 mb-0.5">Prévu</p>
                                    <p className={`text-sm font-bold ${netBudget >= 0 ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                        {budgetLoading ? (
                                            <span className="text-slate-400">...</span>
                                        ) : (
                                            formatCurrency(netBudget, project.mainCurrency)
                                        )}
                                    </p>
                                </div>
                                <div className="w-px h-5 bg-slate-300"></div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 mb-0.5">Réalisé</p>
                                    <p className={`text-sm font-bold ${netRealized >= 0 ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                        {formatCurrency(netRealized, project.mainCurrency)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section Dates - Design compact */}
                        <div className="p-2 rounded-lg bg-slate-50">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3 text-slate-500" />
                                    <span className="text-slate-600">Début:</span>
                                    <span className="font-medium text-slate-900">{formatDate(project.startDate)}</span>
                                </div>

                                <div className="text-slate-300">→</div>

                                <div className="flex items-center space-x-1">
                                    {isDurationUndetermined ? (
                                        <>
                                            <Infinity className="w-3.5 h-3.5 text-amber-600" />
                                            <span className="text-slate-600">Indéterminée</span>
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="w-3 h-3 text-slate-500" />
                                            <span className="text-slate-600">Fin:</span>
                                            <span className="font-medium text-slate-900">{formatDate(project.endDate)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions principales */}
                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                            <Button
                                size="sm"
                                className="flex-1 h-8 text-xs text-white bg-slate-700 hover:bg-slate-800"
                                onClick={() => navigate(`/client/dashboard`)}
                                disabled={project.is_archived || localLoading || budgetLoading}
                            >
                                <BarChart className="w-3 h-3 mr-1" />
                                Tableau de bord
                            </Button>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default ProjectCard;