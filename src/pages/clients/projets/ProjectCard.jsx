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
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Textarea } from '../../../components/ui/textarea';
import Badge from '../../../components/ui/badge';
import { getBudget } from '../../../components/context/budgetAction';
import { formatCurrency } from '../../../utils/formatters';

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

    // LOGIQUE CORRIGÉE POUR DÉTECTER LA DURÉE INDÉTERMINÉE
    const isDurationUndetermined = project.isDurationUndetermined || 
                                  project.isEndDateIndefinite || 
                                  !project.endDate || 
                                  project.endDate === project.startDate;

    // ÉTAT POUR LE BUDGET DU PROJET
    const [projectBudget, setProjectBudget] = useState({
        sumEntries: 0,
        sumExpenses: 0,
        sumForecast: 0
    });
    const [budgetLoading, setBudgetLoading] = useState(false);
    const [showCollaborators, setShowCollaborators] = useState(false);

    // DONNÉES EXEMPLES POUR LES COLLABORATEURS
    const [collaborators, setCollaborators] = useState([
        { id: 1, name: 'Jean Dupont', role: 'Manager', avatar: null },
        { id: 2, name: 'Marie Martin', role: 'Développeur', avatar: null },
        { id: 3, name: 'Pierre Lambert', role: 'Designer', avatar: null },
    ]);

    // FONCTION POUR RÉCUPÉRER LE BUDGET DU PROJET
const fetchProjectBudget = async () => {
    if (!project.id || typeof project.id !== 'number') return;

    try {
        setBudgetLoading(true);
        
        // 🔥 AJOUTER UN DÉLAI POUR ÉVITER LES REQUÊTES MASSIVES
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const data = await getBudget(project.id);
        setProjectBudget({
            sumEntries: data.sumEntries || 0,
            sumExpenses: data.sumExpenses || 0,
            sumForecast: data.sumForecast || 0
        });
    } catch (err) {
        console.error('Erreur lors du chargement du budget du projet:', err);
        // 🔥 NE PAS RELANCER AUTOMATIQUEMENT
        setProjectBudget({
            sumEntries: 0,
            sumExpenses: 0,
            sumForecast: 0
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
}, [project.id]); // 🔥 SEULEMENT project.id comme dépendance

    const getProgressPercentage = (realized, budget) => {
        if (budget === 0) return 0;
        return Math.min((realized / budget) * 100, 100);
    };

    // UTILISER LES DONNÉES BUDGÉTAIRES POUR LES CALCULS
    const netBudget = projectBudget.sumEntries - projectBudget.sumExpenses;
    const netRealized = project.incomeRealized - project.expenseRealized;

    const incomeProgress = getProgressPercentage(project.incomeRealized, projectBudget.sumEntries || 1);
    const expenseProgress = getProgressPercentage(project.expenseRealized, projectBudget.sumExpenses || 1);

    const formatDate = (dateString) => {
        if (!dateString) return 'Non définie';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            badge: 'bg-blue-100 text-blue-700 border-blue-200',
            icon: 'text-blue-500',
            progress: 'bg-blue-500'
        },
        pink: {
            bg: 'bg-pink-50',
            text: 'text-pink-700',
            badge: 'bg-pink-100 text-pink-700 border-pink-200',
            icon: 'text-pink-500',
            progress: 'bg-pink-500'
        },
        green: {
            bg: 'bg-green-50',
            text: 'text-green-700',
            badge: 'bg-green-100 text-green-700 border-green-200',
            icon: 'text-green-500',
            progress: 'bg-green-500'
        },
        gray: {
            bg: 'bg-gray-50',
            text: 'text-gray-700',
            badge: 'bg-gray-100 text-gray-700 border-gray-200',
            icon: 'text-gray-500',
            progress: 'bg-gray-500'
        }
    };

    const currentColor = colorClasses[projectColor] || colorClasses.gray;

    // FONCTION POUR GÉRER LE CHANGEMENT DE LA DURÉE INDÉTERMINÉE
    const handleDurationChange = (isIndetermined) => {
        setEditForm(prev => ({
            ...prev,
            isDurationUndetermined: isIndetermined,
            endDate: isIndetermined ? null : prev.endDate
        }));
    };

    return (
        <Card className={`relative transition-all duration-200 hover:shadow-lg ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'border-gray-200'
            } ${isActiveProject ? 'ring-2 ring-green-500 border-green-200 shadow-md' : ''}`}>

            {/* Checkbox de sélection */}
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
                        <div className={`w-12 h-12 rounded-xl ${currentColor.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <IconComponent className={`w-6 h-6 ${currentColor.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            {editingProjectId === project.id ? (
                                <div className="space-y-4">
                                    {/* Nom du projet */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nom du projet *
                                        </label>
                                        <input
                                            type="text"
                                            className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <Textarea
                                            className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows={2}
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        />
                                    </div>

                                    {/* Dates avec option durée indéterminée */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Période du projet
                                        </label>
                                        
                                        {/* Date de début */}
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                                Date de début
                                            </label>
                                            <input
                                                type="date"
                                                className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={editForm.startDate ? new Date(editForm.startDate).toISOString().split('T')[0] : ''}
                                                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                            />
                                        </div>

                                        {/* Option durée indéterminée */}
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="edit-duration-indetermined"
                                                checked={editForm.isDurationUndetermined || !editForm.endDate}
                                                onChange={(e) => handleDurationChange(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="edit-duration-indetermined" className="ml-2 block text-sm text-gray-900">
                                                Durée indéterminée
                                            </label>
                                        </div>

                                        {/* Date de fin (seulement si pas durée indéterminée) */}
                                        {!(editForm.isDurationUndetermined || !editForm.endDate) && (
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">
                                                    Date de fin
                                                </label>
                                                <input
                                                    type="date"
                                                    className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={editForm.endDate ? new Date(editForm.endDate).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                                    min={editForm.startDate}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Boutons d'action */}
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingProjectId(null)}
                                            className="h-8 text-xs"
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                updateProject(editForm);
                                                setEditingProjectId(null);
                                            }}
                                            className="h-8 text-xs bg-blue-500 hover:bg-blue-600"
                                        >
                                            Enregistrer
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <CardTitle className="text-lg font-semibold truncate text-gray-900">
                                            {project.name}
                                        </CardTitle>
                                        <Badge variant="outline" className={currentColor.badge}>
                                            {project.typeName}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                        {project.description}
                                    </p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <div className="flex items-center space-x-1">
                                            <Globe className="w-3 h-3" />
                                            <span>{project.mainCurrency}</span>
                                        </div>

                                        {/* Section Collaborateurs */}
                                        <div
                                            className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 transition-colors"
                                            onMouseEnter={() => setShowCollaborators(true)}
                                            onMouseLeave={() => setShowCollaborators(false)}
                                        >
                                            <Users className="w-3 h-3" />
                                            <span>{collaborators.length} collaborateur{collaborators.length > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Statut du projet */}
                    <div className="flex flex-col items-end space-y-2">
                        {project.is_archived ? (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                Archivé
                            </Badge>
                        ) : isActiveProject ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                Actif
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                Inactif
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Tooltip Collaborateurs */}
                {showCollaborators && collaborators.length > 0 && (
                    <div
                        className="absolute top-16 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3"
                        onMouseEnter={() => setShowCollaborators(true)}
                        onMouseLeave={() => setShowCollaborators(false)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-900">Équipe du projet</h4>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <UserPlus className="w-3 h-3" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {collaborators.map((collaborator) => (
                                <div key={collaborator.id} className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                                        {getInitials(collaborator.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {collaborator.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {collaborator.role}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-4">
                    {/* Budget Summary */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* --- Revenus --- */}
                        <div className="p-3 bg-gradient-to-br from-green-50 to-green-25 rounded-xl border border-green-100">
                            <p className="text-xs font-medium text-green-700 mb-2">Revenus</p>
                            <p className="font-bold text-green-800 text-sm mb-2">
                                {budgetLoading ? (
                                    <span className="text-gray-400">Chargement...</span>
                                ) : (
                                    formatCurrency(projectBudget.sumEntries, project.mainCurrency)
                                )}
                            </p>
                            <div className="w-full bg-green-100 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(incomeProgress, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* --- Dépenses --- */}
                        <div className="p-3 bg-gradient-to-br from-red-50 to-red-25 rounded-xl border border-red-100">
                            <p className="text-xs font-medium text-red-700 mb-2">Dépenses</p>
                            <p className="font-bold text-red-800 text-sm mb-2">
                                {budgetLoading ? (
                                    <span className="text-gray-400">Chargement...</span>
                                ) : (
                                    formatCurrency(projectBudget.sumExpenses, project.mainCurrency)
                                )}
                            </p>
                            <div className="w-full bg-red-100 rounded-full h-2">
                                <div
                                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(expenseProgress, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-25 rounded-xl border border-blue-100">
                        <p className="text-xs font-medium text-blue-700 mb-2 text-center">Solde Net</p>
                        <div className="flex justify-between items-center">
                            <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Prévu</p>
                                <p className={`text-sm font-bold ${netBudget >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {budgetLoading ? (
                                        <span className="text-gray-400">...</span>
                                    ) : (
                                        formatCurrency(netBudget, project.mainCurrency)
                                    )}
                                </p>
                            </div>
                            <div className="w-px h-8 bg-blue-200"></div>
                            <div className="text-center">
                                <p className="text-xs text-gray-600 mb-1">Réalisé</p>
                                <p className={`text-sm font-bold ${netRealized >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {formatCurrency(netRealized, project.mainCurrency)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section Dates Réorganisée */}
                    <div className="space-y-3">
                        {/* Ligne : Date de début + Durée indéterminée/Date de fin */}
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                            {/* Date de début */}
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <div className="text-sm">
                                    <p className="text-xs text-gray-500">Début</p>
                                    <p className="font-medium text-gray-900">{formatDate(project.startDate)}</p>
                                </div>
                            </div>

                            {/* Séparateur */}
                            <div className="text-gray-300 mx-2">→</div>

                            {/* Durée indéterminée ou Date de fin */}
                            <div className="flex items-center space-x-2">
                                {isDurationUndetermined ? (
                                    <>
                                        <Infinity className="w-4 h-4 text-yellow-500" />
                                        <div className="text-sm">
                                            <p className="text-xs text-gray-500">Fin</p>
                                            <p className="font-medium text-yellow-600">Indéterminée</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <div className="text-sm">
                                            <p className="text-xs text-gray-500">Fin</p>
                                            <p className="font-medium text-gray-900">{formatDate(project.endDate)}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                            size="sm"
                            className="flex-1 text-xs h-8 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm"
                            // onClick={() => navigate(`/client/project/${project.id}/dashboard`)}
                            onClick={() => navigate(`/client/dashboard`)}
                            disabled={project.is_archived || localLoading || budgetLoading}
                        >
                            <BarChart className="w-3 h-3 mr-1" />
                            Voir
                        </Button>

                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                                disabled={project.is_archived || localLoading || budgetLoading}
                                onClick={() => {
                                    setEditingProjectId(project.id);
                                    setEditForm({ 
                                        ...project,
                                        isDurationUndetermined: project.isDurationUndetermined || !project.endDate
                                    });
                                }}
                            >
                                <Edit className="w-3 h-3" />
                            </Button>

                            {project.is_archived ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 border-gray-300 hover:border-green-300 hover:bg-green-50"
                                    onClick={() => handleRestoreProject(project.id)}
                                    title="Restaurer le projet"
                                >
                                    <RotateCw className="w-3 h-3" />
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                                    onClick={() => handleArchiveProject(project)}
                                    title="Archiver le projet"
                                >
                                    <Archive className="w-3 h-3" />
                                </Button>
                            )}

                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 border-gray-300 text-red-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
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
                </div>
            </CardContent>
        </Card>
    );
};

export default ProjectCard;