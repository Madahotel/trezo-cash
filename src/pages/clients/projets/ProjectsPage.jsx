import React, { useState, useEffect, useCallback, useMemo, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../components/config/Axios';
import toast from 'react-hot-toast';
import {
    Plus,
    FolderOpen,
    RotateCw,
    Filter,
    Grid,
    List,
    X,
    Search,
    Layers, FolderKanban
} from '../../../utils/Icons';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/card';
import Badge from '../../../components/ui/badge';
import { useSettings } from '../../../contexts/SettingsContext';
import { archiveService } from '../../../services/archiveService';
import { useUI } from '../../../components/context/UIContext';
import { useProjects } from '../../../hooks/useProjects';
import ConsolidatedView from '../consolidate/ConsolidatedView';

const ProjectCard = lazy(() => import('./ProjectCard'));
const ArchiveDialog = lazy(() => import('./ArchiveDialog'));
const ProjectStats = lazy(() => import('./ProjectStats'));

const projectTypeIcons = {
    'Business': lazy(() => import('../../../utils/Icons').then(module => ({ default: module.Briefcase }))),
    'Événement': lazy(() => import('../../../utils/Icons').then(module => ({ default: module.PartyPopper }))),
    'Ménages': lazy(() => import('../../../utils/Icons').then(module => ({ default: module.Home }))),
    'Professionnel': lazy(() => import('../../../utils/Icons').then(module => ({ default: module.Briefcase }))),
    'Evènement': lazy(() => import('../../../utils/Icons').then(module => ({ default: module.PartyPopper }))),
    'Ménage': lazy(() => import('../../../utils/Icons').then(module => ({ default: module.Home }))),
    'default': lazy(() => import('../../../utils/Icons').then(module => ({ default: module.Briefcase })))
};

const projectTypeColors = {
    'Business': 'blue',
    'Événement': 'pink',
    'Ménages': 'green',
    'Professionnel': 'blue',
    'Evènement': 'pink',
    'Ménage': 'green',
    'default': 'gray'
};

const ProjectsPage = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useSettings();
    const { uiState } = useUI();

    const { projects, loading, error, refetch: fetchProjects, setProjects } = useProjects();

    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [archiveReason, setArchiveReason] = useState('');
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [localLoading, setLocalLoading] = useState(false);

    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [showConsolidatedView, setShowConsolidatedView] = useState(false);
    const [consolidatedData, setConsolidatedData] = useState(null);
    const [consolidatedLoading, setConsolidatedLoading] = useState(false);

    const activeProjectId = uiState.activeProject?.id;

    const filterOptions = {
        types: [
            { value: 'all', label: 'Tous les types' },
            { value: 'business', label: 'Business' },
            { value: 'evenement', label: 'Événement' },
            { value: 'menage', label: 'Ménage' }
        ],
        statuses: [
            { value: 'all', label: 'Tous' },
            { value: 'active', label: 'Actifs' },
            { value: 'archived', label: 'Archivés' }
        ],
        sortOptions: [
            { value: 'name', label: 'Nom (A-Z)' },
            { value: 'name_desc', label: 'Nom (Z-A)' },
            { value: 'date_new', label: 'Date (récent)' },
            { value: 'date_old', label: 'Date (ancien)' },
            { value: 'budget_high', label: 'Budget élevé' },
            { value: 'budget_low', label: 'Budget faible' },
            { value: 'performance', label: 'Performance' }
        ]
    };

    const projectStats = useMemo(() => {
        if (!projects || projects.length === 0) {
            return { total: 0, business: 0, events: 0, menages: 0 };
        }

        return {
            total: projects.length,
            business: projects.filter(p => p.type === 'business' || p.typeName === 'Business').length,
            events: projects.filter(p => p.type === 'evenement' || p.typeName === 'Événement').length,
            menages: projects.filter(p => p.type === 'menage' || p.typeName === 'Ménage').length
        };
    }, [projects]);

    const filteredProjects = useMemo(() => {
        if (!projects) return [];

        return projects
            .filter(project => {
                if (searchTerm &&
                    !project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    !project.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                }

                if (selectedType !== 'all') {
                    const projectType = project.type || project.typeName?.toLowerCase();
                    if (!projectType || projectType !== selectedType) {
                        return false;
                    }
                }

                if (selectedStatus !== 'all') {
                    const isArchived = project.is_archived || project.isArchived;
                    if (selectedStatus === 'active' && isArchived) return false;
                    if (selectedStatus === 'archived' && !isArchived) return false;
                }

                return true;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'name_desc':
                        return b.name.localeCompare(a.name);
                    case 'date_new':
                        return new Date(b.created_at || b.startDate || 0) - new Date(a.created_at || a.startDate || 0);
                    case 'date_old':
                        return new Date(a.created_at || a.startDate || 0) - new Date(b.created_at || b.startDate || 0);
                    case 'budget_high':
                        return (b.incomeRealized - b.expenseRealized) - (a.incomeRealized - a.expenseRealized);
                    case 'budget_low':
                        return (a.incomeRealized - a.expenseRealized) - (b.incomeRealized - b.expenseRealized);
                    case 'performance':
                        const perfA = ((a.incomeRealized || 0) - (a.expenseRealized || 0)) / (a.incomeRealized || 1);
                        const perfB = ((b.incomeRealized || 0) - (b.expenseRealized || 0)) / (b.incomeRealized || 1);
                        return perfB - perfA;
                    default:
                        return 0;
                }
            });
    }, [projects, searchTerm, selectedType, selectedStatus, sortBy]);

    useEffect(() => {
        const refreshProjects = () => {
            console.log('🔄 ProjectsPage: Rafraîchissement déclenché par événement');
            fetchProjects().catch(error =>
                console.warn("Erreur lors du rafraîchissement:", error)
            );
        };

        window.addEventListener('projectCreated', refreshProjects);
        window.addEventListener('projectsUpdated', refreshProjects);
        window.addEventListener('projectCreatedInSwitcher', refreshProjects);
        window.addEventListener('projectArchived', refreshProjects);
        window.addEventListener('projectRestored', refreshProjects);
        window.addEventListener('projectDeleted', refreshProjects);

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                setTimeout(() => {
                    fetchProjects();
                }, 1000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('projectCreated', refreshProjects);
            window.removeEventListener('projectsUpdated', refreshProjects);
            window.removeEventListener('projectCreatedInSwitcher', refreshProjects);
            window.removeEventListener('projectArchived', refreshProjects);
            window.removeEventListener('projectRestored', refreshProjects);
            window.removeEventListener('projectDeleted', refreshProjects);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchProjects]);

    useEffect(() => {
        if (!loading && !error) {
            if (projects.length === 0) {
                console.log('Aucun projet trouvé, redirection vers onboarding');
                navigate('/client/onboarding');
            }
            else if (projects.length > 0 && !activeProjectId) {
                console.log('Projets existants mais aucun actif, rester sur la page de sélection');
            }
        }
    }, [loading, error, projects.length, activeProjectId, navigate]);

    const getProjectIcon = useCallback((typeName) => {
        return projectTypeIcons[typeName] || projectTypeIcons.default;
    }, []);

    const getProjectColor = useCallback((typeName) => {
        return projectTypeColors[typeName] || projectTypeColors.default;
    }, []);

    const handleNewProject = useCallback(() => {
        navigate('/client/onboarding');
    }, [navigate]);

    const handleArchiveProject = useCallback(async (project) => {
        if (!window.confirm(`Voulez-vous vraiment archiver le projet "${project.name}" ?`)) {
            return;
        }

        try {
            setLocalLoading(true);
            const loadingToast = toast.loading('Archivage du projet en cours...');

            await archiveService.archiveProject(project.id, "Archivage manuel");
            setProjects((prevProjects) =>
                prevProjects.filter((p) => p.id !== project.id)
            );
            window.dispatchEvent(new CustomEvent('projectArchived', {
                detail: { projectId: project.id }
            }));
            if (activeProjectId === project.id) {
                window.dispatchEvent(new CustomEvent('activeProjectArchived', {
                    detail: { projectId: project.id }
                }));
            }

            toast.success('Projet archivé avec succès !', {
                id: loadingToast,
                duration: 4000,
            });

        } catch (err) {
            console.error('Erreur lors de l\'archivage du projet :', err);
            toast.error(`Erreur lors de l'archivage : ${err.message}`, {
                duration: 5000,
            });
        } finally {
            setLocalLoading(false);
        }
    }, [setProjects, activeProjectId]);


    const confirmArchiveProject = useCallback(async () => {
        if (!selectedProject) return;

        try {
            setLocalLoading(true);
            const loadingToast = toast.loading('Archivage du projet en cours...');
            const projectName = selectedProject.name;

            await archiveService.archiveProject(selectedProject.id, archiveReason);

            setProjects((prevProjects) =>
                prevProjects.filter((p) => p.id !== selectedProject.id)
            );
            window.dispatchEvent(new CustomEvent('projectArchived', {
                detail: { projectId: selectedProject.id }
            }));

            if (activeProjectId === selectedProject.id) {
                window.dispatchEvent(new CustomEvent('activeProjectArchived', {
                    detail: { projectId: selectedProject.id }
                }));
            }

            setArchiveDialogOpen(false);
            setSelectedProject(null);
            setArchiveReason('');

            toast.success(`Projet "${projectName}" archivé avec succès !`, {
                id: loadingToast,
                duration: 4000,
            });

        } catch (err) {
            console.error("Erreur lors de l'archivage:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Erreur inconnue';
            toast.error(`Erreur lors de l'archivage : ${errorMsg}`, {
                duration: 5000,
            });
        } finally {
            setLocalLoading(false);
        }
    }, [selectedProject, archiveReason, setProjects, activeProjectId]);

    const handleDeleteProject = useCallback(async (projectId) => {
        try {
            setLocalLoading(true);
            const loadingToast = toast.loading('Suppression du projet en cours...');

            await axios.delete(`/projects/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
            });

            setProjects(prev => prev.filter(project => project.id !== projectId));
            window.dispatchEvent(new CustomEvent('projectDeleted', {
                detail: { projectId }
            }));
            window.dispatchEvent(new CustomEvent('projectsUpdated', {
                detail: {
                    action: 'deleted',
                    projectId: projectId
                }
            }));

            toast.success('Projet supprimé avec succès !', {
                id: loadingToast,
                duration: 4000,
            });

        } catch (err) {
            console.error('Erreur lors de la suppression du projet:', err);
            toast.error(`Erreur lors de la suppression : ${err.message}`, {
                duration: 5000,
            });
        } finally {
            setLocalLoading(false);
        }
    }, [setProjects]);

    const handleRestoreProject = useCallback(async (projectId) => {
        try {
            setLocalLoading(true);
            const loadingToast = toast.loading('Restauration du projet en cours...');

            await axios.patch(`/projects/${projectId}/restore`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            await fetchProjects();

            window.dispatchEvent(new CustomEvent('projectRestored', {
                detail: { projectId }
            }));

            toast.success('Projet restauré avec succès !', {
                id: loadingToast,
                duration: 4000,
            });

        } catch (err) {
            console.error('Erreur lors de la restauration du projet:', err);
            toast.error(`Erreur lors de la restauration : ${err.message}`, {
                duration: 5000,
            });
        } finally {
            setLocalLoading(false);
        }
    }, [fetchProjects]);

    const updateProject = useCallback(async (updatedProject) => {
        try {
            setLocalLoading(true);
            const loadingToast = toast.loading('Mise à jour du projet en cours...');

            if (!updatedProject.name || !updatedProject.name.trim()) {
                toast.error('Le nom du projet est requis');
                return;
            }

            const payload = {
                name: updatedProject.name.trim(),
                description: updatedProject.description?.trim() || '',
                start_date: updatedProject.startDate,
                end_date: updatedProject.endDate || null,
                is_duration_undetermined: updatedProject.isDurationUndetermined ? 1 : 0,
                template_id: updatedProject.templateId || null,
                project_type_id: updatedProject.projectTypeId || null
            };

            const response = await axios.put(`/projects/${updatedProject.id}`, payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            setProjects((prev) =>
                prev.map((p) =>
                    p.id === updatedProject.id
                        ? { ...p, ...updatedProject }
                        : p
                )
            );

            setEditingProjectId(null);

            toast.success(response.data.message || 'Projet mis à jour avec succès !', {
                id: loadingToast,
                duration: 4000,
            });

        } catch (err) {
            console.error('Erreur lors de la mise à jour du projet:', err);

            let errorMessage = 'Erreur lors de la mise à jour du projet';

            if (err.response?.status === 422) {
                const validationErrors = err.response.data.errors;
                if (validationErrors) {
                    errorMessage += ': ' + Object.values(validationErrors).flat().join(', ');
                } else {
                    errorMessage += ': Données invalides';
                }
            } else if (err.response?.data?.message) {
                errorMessage += ': ' + err.response.data.message;
            } else {
                errorMessage += ': ' + err.message;
            }

            toast.error(errorMessage, {
                duration: 5000,
            });
        } finally {
            setLocalLoading(false);
        }
    }, [setProjects]);

    const toggleProjectSelection = useCallback((projectId) => {
        setSelectedProjects(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (selectedProjects.length === filteredProjects.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects(filteredProjects.map(project => project.id));
        }
    }, [selectedProjects.length, filteredProjects]);

    const clearSelection = useCallback(() => {
        setSelectedProjects([]);
        setIsSelectMode(false);
        toast.info('Sélection annulée');
    }, []);

    const handleDeleteMultiple = useCallback(async () => {
        if (selectedProjects.length === 0) return;

        const projectNames = projects
            .filter(p => selectedProjects.includes(p.id))
            .map(p => p.name)
            .join(', ');

        if (!window.confirm(`Voulez-vous vraiment supprimer les projets suivants ?\n${projectNames}`)) {
            return;
        }

        try {
            setLocalLoading(true);
            const loadingToast = toast.loading(`Suppression de ${selectedProjects.length} projet(s) en cours...`);

            const deletePromises = selectedProjects.map(projectId =>
                axios.delete(`/projects/${projectId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                })
            );

            await Promise.all(deletePromises);

            setProjects(prev => prev.filter(project => !selectedProjects.includes(project.id)));
            clearSelection();

            toast.success(`${selectedProjects.length} projet(s) supprimé(s) avec succès !`, {
                id: loadingToast,
                duration: 4000,
            });

        } catch (err) {
            console.error('Erreur lors de la suppression multiple:', err);
            toast.error(`Erreur lors de la suppression : ${err.message}`, {
                duration: 5000,
            });
        } finally {
            setLocalLoading(false);
        }
    }, [selectedProjects, projects, setProjects, clearSelection]);

    const resetFilters = useCallback(() => {
        setSearchTerm('');
        setSelectedType('all');
        setSelectedStatus('all');
        setSortBy('name');
        toast.success('Filtres réinitialisés');
    }, []);

    const loadConsolidatedData = useCallback(async () => {
        const projectsToConsolidate = selectedProjects.length > 0
            ? selectedProjects
            : filteredProjects.map(p => p.id);

        if (projectsToConsolidate.length === 0) {
            toast.error('Veuillez sélectionner au moins un projet');
            return false;
        }

        try {
            setConsolidatedLoading(true);
            const loadingToast = toast.loading('Préparation de la vue consolidée...');

            await new Promise(resolve => setTimeout(resolve, 800));

            const selectedProjectsData = filteredProjects.filter(p =>
                selectedProjects.length > 0 ? selectedProjects.includes(p.id) : true
            );

            const totalBudget = selectedProjectsData.reduce((sum, p) =>
                sum + (p.incomeRealized || 0), 0
            );
            const totalExpenses = selectedProjectsData.reduce((sum, p) =>
                sum + (p.expenseRealized || 0), 0
            );
            const totalNet = totalBudget - totalExpenses;

            const projectsByType = selectedProjectsData.reduce((acc, p) => {
                const type = p.type || p.typeName || 'Autre';
                if (!acc[type]) acc[type] = { count: 0, budget: 0, expenses: 0 };
                acc[type].count++;
                acc[type].budget += p.incomeRealized || 0;
                acc[type].expenses += p.expenseRealized || 0;
                return acc;
            }, {});

            const projectsWithPerformance = selectedProjectsData.map(p => ({
                ...p,
                performance: p.incomeRealized > 0 ?
                    ((p.incomeRealized - p.expenseRealized) / p.incomeRealized) * 100 : 0
            }));

            setConsolidatedData({
                totalProjects: selectedProjectsData.length,
                totalBudget,
                totalExpenses,
                totalNet,
                averageBudget: selectedProjectsData.length > 0 ? totalBudget / selectedProjectsData.length : 0,
                averageExpenses: selectedProjectsData.length > 0 ? totalExpenses / selectedProjectsData.length : 0,
                averagePerformance: selectedProjectsData.length > 0 ?
                    projectsWithPerformance.reduce((sum, p) => sum + p.performance, 0) / selectedProjectsData.length : 0,
                projectsByType,
                selectedProjects: projectsWithPerformance,
                projectIds: projectsToConsolidate,
                currency: 'EUR'
            });

            toast.dismiss(loadingToast);
            setShowConsolidatedView(true);
            toast.success(`Vue consolidée affichée (${selectedProjectsData.length} projets)`);
            return true;

        } catch (err) {
            console.error('Erreur lors du chargement des données consolidées:', err);
            toast.error('Erreur lors du chargement des données consolidées');
            return false;
        } finally {
            setConsolidatedLoading(false);
        }
    }, [selectedProjects, filteredProjects]);

    const toggleConsolidatedView = async () => {
        setConsolidatedLoading(true);

        const success = await loadConsolidatedData();

        setConsolidatedLoading(false);

        if (!success) {
            toast.error("Impossible de charger la vue consolidée");
            return;
        }
        navigate("/client/consolidations");
    };

    const saveConsolidatedView = useCallback(async () => {
        if (!consolidatedData) return;

        try {
            const viewName = window.prompt(
                'Nommez cette vue consolidée :',
                selectedProjects.length > 0
                    ? `Vue consolidée (${selectedProjects.length} projets)`
                    : 'Tous les projets filtrés'
            );

            if (!viewName || !viewName.trim()) {
                toast.info('Sauvegarde annulée');
                return;
            }

            const savedViews = JSON.parse(localStorage.getItem('consolidatedViews') || '[]');
            const newView = {
                id: `consolidated_view_${Date.now()}`,
                name: viewName.trim(),
                projectIds: consolidatedData.projectIds,
                createdAt: new Date().toISOString(),
                totalProjects: consolidatedData.totalProjects,
                totalBudget: consolidatedData.totalBudget
            };

            savedViews.push(newView);
            localStorage.setItem('consolidatedViews', JSON.stringify(savedViews));

            toast.success(`Vue "${viewName}" sauvegardée avec succès`);

        } catch (err) {
            console.error('Erreur lors de la sauvegarde:', err);
            toast.error('Erreur lors de la sauvegarde');
        }
    }, [consolidatedData, selectedProjects]);

    const backToProjectsList = useCallback(() => {
        setShowConsolidatedView(false);
        setConsolidatedData(null);
        toast.info('Retour à la liste des projets');
    }, []);

    const commonProjectCardProps = useMemo(() => ({
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
        isSelectMode,
        activeProjectId,
        onToggleSelection: toggleProjectSelection
    }), [
        getProjectIcon,
        getProjectColor,
        editingProjectId,
        editForm,
        updateProject,
        navigate,
        handleArchiveProject,
        handleRestoreProject,
        handleDeleteProject,
        localLoading,
        isSelectMode,
        activeProjectId,
        toggleProjectSelection
    ]);

    const ProjectCardSkeleton = useMemo(() => {
        const Skeleton = () => (
            <Card className="border-gray-200 animate-pulse">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center flex-1 space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                            <div className="flex-1 space-y-2">
                                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                                <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div className="w-16 h-6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-gray-100 rounded-xl">
                            <div className="w-1/2 h-3 mb-2 bg-gray-200 rounded"></div>
                            <div className="w-3/4 h-4 mb-2 bg-gray-200 rounded"></div>
                            <div className="w-full h-2 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-xl">
                            <div className="w-1/2 h-3 mb-2 bg-gray-200 rounded"></div>
                            <div className="w-3/4 h-4 mb-2 bg-gray-200 rounded"></div>
                            <div className="w-full h-2 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                    <div className="p-3 mb-4 bg-gray-100 rounded-xl">
                        <div className="w-1/3 h-3 mx-auto mb-2 bg-gray-200 rounded"></div>
                        <div className="flex justify-between">
                            <div className="text-center">
                                <div className="w-8 h-3 mb-1 bg-gray-200 rounded"></div>
                                <div className="w-12 h-4 bg-gray-200 rounded"></div>
                            </div>
                            <div className="w-px h-8 bg-gray-300"></div>
                            <div className="text-center">
                                <div className="w-8 h-3 mb-1 bg-gray-200 rounded"></div>
                                <div className="w-12 h-4 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                        <div className="flex gap-1">
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
        return Skeleton;
    }, []);

    const StatsSkeleton = useMemo(() => {
        const Skeleton = () => (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, index) => (
                    <Card key={index} className="animate-pulse">
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
        );
        return Skeleton;
    }, []);

    if (loading) {
        return (
            <div className="max-w-full min-h-screen p-4 space-y-6 sm:p-6 sm:space-y-8 bg-gray-50/50">
                <div className="sticky top-0 z-10 flex items-center justify-between pt-4 pb-2 bg-white">
                    <div className="space-y-2">
                        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-64 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-40 h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>

                <StatsSkeleton />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {[...Array(8)].map((_, index) => (
                        <ProjectCardSkeleton key={index} />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h2 className="font-semibold text-red-800">Erreur</h2>
                    <p className="text-red-600">{error}</p>
                    <Button onClick={fetchProjects} className="mt-2">
                        <RotateCw className="w-4 h-4 mr-2" />
                        Réessayer
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-full min-h-screen p-4 space-y-6 sm:p-6 sm:space-y-8 bg-gray-50/50">
            {localLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10">
                    <div className="flex items-center p-4 space-x-3 bg-white rounded-lg">
                        <div className="w-6 h-6 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                        <span className="text-gray-600">Traitement en cours...</span>
                    </div>
                </div>
            )}

            <div className="sticky top-0 z-10 flex items-center justify-between pt-4 pb-2 bg-white">
                <div>


                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                        {showConsolidatedView ? (
                            <>
                                <Layers className="w-6 h-6" />
                                Vue Consolidée
                            </>
                        ) : (
                            <>
                                <FolderKanban className="w-6 h-6" />
                                Projets
                            </>
                        )}
                    </h1>

                    <p className="text-sm text-gray-500">
                        {showConsolidatedView
                            ? `Vue globale de ${consolidatedData?.totalProjects || 0} projets`
                            : `${projects.length} projet${projects.length !== 1 ? 's' : ''} au total`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {showConsolidatedView ? (
                        <Button
                            onClick={backToProjectsList}
                            variant="outline"
                            className="text-gray-700 border-gray-300 hover:bg-gray-50"
                        >
                            ← Retour aux projets
                        </Button>
                    ) : isSelectMode ? (
                        <>
                            <span className="mr-2 text-sm text-gray-600">
                                {selectedProjects.length} sélectionné(s)
                            </span>
                            {selectedProjects.length > 0 && (
                                <>
                                    <Button
                                        onClick={toggleConsolidatedView}
                                        variant="default"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={consolidatedLoading}
                                    >
                                        {consolidatedLoading ? (
                                            <>
                                                <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                                                Chargement...
                                            </>
                                        ) : (
                                            <>
                                                <Layers className="w-4 h-4 mr-2" />
                                                Voir consolidé
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleDeleteMultiple}
                                        variant="destructive"
                                        disabled={localLoading}
                                    >
                                        Supprimer ({selectedProjects.length})
                                    </Button>
                                </>
                            )}
                            <Button
                                onClick={clearSelection}
                                variant="outline"
                                disabled={localLoading}
                            >
                                Annuler
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={() => setIsSelectMode(true)}
                                variant="outline"
                                disabled={localLoading}
                                title="Sélectionner plusieurs projets"
                            >
                                <Layers className="w-4 h-4 mr-2" />
                                Sélection multiple
                            </Button>
                            <Button
                                onClick={handleNewProject}
                                className="text-white bg-blue-500 hover:bg-blue-600"
                                disabled={localLoading}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nouveau projet
                            </Button>

                            {selectedProjects.length > 0 && (
                                <Button
                                    onClick={toggleSelectAll}
                                    variant="outline"
                                    size="sm"
                                    className="text-white bg-blue-500 hover:bg-blue-600"
                                >
                                    {selectedProjects.length === filteredProjects.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                </Button>
                            )}
                            <Button
                                onClick={toggleConsolidatedView}
                                variant="default"
                                className="text-white bg-blue-500 hover:bg-blue-600"
                                disabled={filteredProjects.length === 0 || consolidatedLoading}
                            >
                                {consolidatedLoading ? (
                                    <>
                                        <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                                        Préparation...
                                    </>
                                ) : (
                                    <>
                                        <Layers className="w-4 h-4 mr-2" />
                                        {selectedProjects.length > 0
                                            ? `Voir consolidé (${selectedProjects.length})`
                                            : 'Voir tous consolidés'}
                                    </>
                                )}
                            </Button>

                        </>
                    )}
                </div>
            </div>

            {!showConsolidatedView && <ProjectStats stats={projectStats} />}

            {!showConsolidatedView && (
                <div className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un projet..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                Filtres
                                {(selectedType !== 'all' || selectedStatus !== 'all') && (
                                    <span className="px-1.5 py-0.5 ml-1 text-xs text-blue-700 bg-blue-100 rounded-full">
                                        {(selectedType !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0)}
                                    </span>
                                )}
                            </Button>

                            <div className="flex overflow-hidden border border-gray-300 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                    title="Vue grille"
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                    title="Vue liste"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {showFilters && (
                        <Card className="border border-gray-200 shadow-sm animate-slideDown">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-gray-900">Filtres et tri</h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={resetFilters}
                                            className="text-gray-600 hover:text-gray-900"
                                        >
                                            <RotateCw className="w-3 h-3 mr-1" />
                                            Réinitialiser
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowFilters(false)}
                                            className="text-gray-600 hover:text-gray-900"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {/* Filtre par type */}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">
                                            Type de projet
                                        </label>
                                        <div className="space-y-2">
                                            {filterOptions.types.map((type) => (
                                                <label key={type.value} className="flex items-center p-1 rounded cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="radio"
                                                        name="typeFilter"
                                                        value={type.value}
                                                        checked={selectedType === type.value}
                                                        onChange={(e) => setSelectedType(e.target.value)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">
                                            Statut
                                        </label>
                                        <div className="space-y-2">
                                            {filterOptions.statuses.map((status) => (
                                                <label key={status.value} className="flex items-center p-1 rounded cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="radio"
                                                        name="statusFilter"
                                                        value={status.value}
                                                        checked={selectedStatus === status.value}
                                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">{status.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700">
                                            Trier par
                                        </label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                                        >
                                            {filterOptions.sortOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600">
                                            {filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''} trouvé{filteredProjects.length !== 1 ? 's' : ''}
                                        </p>
                                        {filteredProjects.length < projects.length && (
                                            <Badge variant="outline" className="text-xs">
                                                Filtres actifs
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {(selectedType !== 'all' || selectedStatus !== 'all' || searchTerm) && !showFilters && (
                        <div className="flex items-center gap-2 p-2 border border-blue-100 rounded-lg bg-blue-50">
                            <span className="text-sm text-blue-700">Filtres actifs:</span>
                            {searchTerm && (
                                <Badge variant="outline" className="text-blue-700 bg-blue-100 border-blue-200 hover:bg-blue-200">
                                    Recherche: "{searchTerm}"
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="ml-1 text-blue-500 hover:text-blue-700"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            )}
                            {selectedType !== 'all' && (
                                <Badge variant="outline" className="text-blue-700 bg-blue-100 border-blue-200 hover:bg-blue-200">
                                    {filterOptions.types.find(t => t.value === selectedType)?.label}
                                    <button
                                        onClick={() => setSelectedType('all')}
                                        className="ml-1 text-blue-500 hover:text-blue-700"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            )}
                            {selectedStatus !== 'all' && (
                                <Badge variant="outline" className="text-blue-700 bg-blue-100 border-blue-200 hover:bg-blue-200">
                                    {filterOptions.statuses.find(s => s.value === selectedStatus)?.label}
                                    <button
                                        onClick={() => setSelectedStatus('all')}
                                        className="ml-1 text-blue-500 hover:text-blue-700"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showConsolidatedView ? (
                consolidatedLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
                        <p className="text-gray-600">Chargement de la vue consolidée...</p>
                        <p className="text-sm text-gray-500">
                            Préparation des données pour {selectedProjects.length > 0 ? selectedProjects.length : filteredProjects.length} projets
                        </p>
                    </div>
                ) : consolidatedData ? (
                    <ConsolidatedView
                        data={consolidatedData}
                        onBack={backToProjectsList}
                        onSave={saveConsolidatedView}
                        formatCurrency={formatCurrency}
                        getProjectIcon={getProjectIcon}
                        getProjectColor={getProjectColor}
                    />
                ) : null
            ) : filteredProjects.length === 0 ? (
                <Card className="p-8 text-center border-2 border-dashed">
                    <CardContent className="pt-6">
                        <FolderOpen className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                        <h3 className="mb-2 text-lg font-semibold text-gray-600">
                            {projects.length === 0 ? 'Aucun projet trouvé' : 'Aucun projet correspondant'}
                        </h3>
                        <p className="mb-4 text-sm text-gray-500">
                            {projects.length === 0
                                ? 'Commencez par créer votre premier projet'
                                : 'Aucun projet ne correspond à vos critères de recherche'}
                        </p>
                        <div className="flex flex-col justify-center gap-2 sm:flex-row">
                            <Button
                                onClick={handleNewProject}
                                className="bg-blue-500 hover:bg-blue-600"
                                disabled={localLoading}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {projects.length === 0 ? 'Créer un projet' : 'Créer un nouveau projet'}
                            </Button>
                            {projects.length > 0 && (
                                <Button
                                    onClick={resetFilters}
                                    variant="outline"
                                    className="border-gray-300"
                                >
                                    <RotateCw className="w-4 h-4 mr-2" />
                                    Réinitialiser les filtres
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isSelected={selectedProjects.includes(project.id)}
                            {...commonProjectCardProps}
                        />
                    ))}
                </div>
            )}

            <ArchiveDialog
                open={archiveDialogOpen}
                onOpenChange={setArchiveDialogOpen}
                selectedProject={selectedProject}
                archiveReason={archiveReason}
                setArchiveReason={setArchiveReason}
                onConfirm={confirmArchiveProject}
                loading={localLoading}
            />
        </div>
    );
};

export default React.memo(ProjectsPage);