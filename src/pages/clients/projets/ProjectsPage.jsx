import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../components/config/Axios';
import toast from 'react-hot-toast';
import {
    Plus,
    FolderOpen,
    RotateCw,
    Briefcase,
    PartyPopper,
    Home,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/card';
import { useSettings } from '../../../contexts/SettingsContext';
import { archiveService } from '../../../services/archiveService';
import { useUI } from '../../../components/context/UIContext';
import { useProjects } from '../../../hooks/useProjects';

import ProjectCard from './ProjectCard';
import ArchiveDialog from './ArchiveDialog';
import ProjectStats from './ProjectStats';

// Configuration des icônes par type de projet
const projectTypeIcons = {
    'Business': Briefcase,
    'Événement': PartyPopper,
    'Ménages': Home,
    'Professionnel': Briefcase,
    'Evènement': PartyPopper,
    'Ménage': Home,
    'default': Briefcase
};

// Couleurs pour les types de projet
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
    const { language, formatCurrency } = useSettings();
    const { uiState } = useUI();

    // Utilisation du hook useProjects
    const { projects, loading, error, refetch: fetchProjects, setProjects } = useProjects();


    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [archiveReason, setArchiveReason] = useState('');

    // Nouveaux états pour la sélection multiple
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [isSelectMode, setIsSelectMode] = useState(false);

    const [projectStats, setProjectStats] = useState({
        total: 0,
        business: 0,
        events: 0,
        menages: 0
    });

    const [editingProjectId, setEditingProjectId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [localLoading, setLocalLoading] = useState(false);

    // Récupérer l'ID du projet actif
    const activeProjectId = uiState.activeProject?.id;

    // Debug: Afficher l'état du projet actif
    useEffect(() => {
        console.log("🔍 ProjectsPage - Projet actif:", uiState.activeProject);
        console.log("🔍 ProjectsPage - ID du projet actif:", activeProjectId);
    }, [uiState.activeProject, activeProjectId]);

    // Mettre à jour les stats quand les projets changent
    useEffect(() => {
        if (!loading && projects) {
            setProjectStats({
                total: projects.length,
                business: projects.filter(p => p.type === 'business').length,
                events: projects.filter(p => p.type === 'evenement').length,
                menages: projects.filter(p => p.type === 'menage').length
            });
        }
    }, [projects, loading]);

    // Redirection automatique selon l'état des projets
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

    // Fonction pour obtenir l'icône basée sur le typeName
    const getProjectIcon = (typeName) => {
        return projectTypeIcons[typeName] || projectTypeIcons.default;
    };

    // Fonction pour obtenir la couleur basée sur le typeName
    const getProjectColor = (typeName) => {
        return projectTypeColors[typeName] || projectTypeColors.default;
    };

    const handleNewProject = () => {
        navigate('/client/onboarding');
    };

    const handleArchiveProject = async (project) => {
        if (!window.confirm(`Voulez-vous vraiment archiver le projet "${project.name}" ?`)) {
            return;
        }

        try {
            setLocalLoading(true);
            const loadingToast = toast.loading('Archivage du projet en cours...');

            // Utiliser archiveService
            await archiveService.archiveProject(project.id, "Archivage manuel");

            // Mettre à jour l'état local en filtrant le projet archivé
            setProjects((prevProjects) =>
                prevProjects.filter((p) => p.id !== project.id)
            );

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
    };

    const confirmArchiveProject = async () => {
        if (!selectedProject) return;

        try {
            setLocalLoading(true);
            const loadingToast = toast.loading('Archivage du projet en cours...');
            const projectName = selectedProject.name;

            await archiveService.archiveProject(selectedProject.id, archiveReason);

            // Mettre à jour l'état local
            setProjects((prevProjects) =>
                prevProjects.filter((p) => p.id !== selectedProject.id)
            );

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
    };
    const handleDeleteProject = async (projectId) => {
        try {
            setLocalLoading(true);
            const loadingToast = toast.loading('Suppression du projet en cours...');

            await axios.delete(`/projects/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
            });

            setProjects(prev => prev.filter(project => project.id !== projectId));

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
    };

    const handleRestoreProject = async (projectId) => {
        try {
            setLocalLoading(true);
            const loadingToast = toast.loading('Restauration du projet en cours...');

            await axios.patch(`/projects/${projectId}/restore`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            // Rafraîchir toute la liste des projets
            await fetchProjects();

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
    };

    const updateProject = async (updatedProject) => {
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
    };

    // Fonctions pour la sélection multiple
    const toggleProjectSelection = (projectId) => {
        setSelectedProjects(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedProjects.length === projects.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects(projects.map(project => project.id));
        }
    };

    const clearSelection = () => {
        setSelectedProjects([]);
        setIsSelectMode(false);
    };

    const handleDeleteMultiple = async () => {
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
    };

    // Composant de squelette pour les cartes de projet
    const ProjectCardSkeleton = () => (
        <Card className="animate-pulse border-gray-200">
            <CardContent className="p-4">
                {/* En-tête */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                    <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>

                {/* Stats budget */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-gray-100 rounded-xl">
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="w-full bg-gray-200 rounded-full h-2"></div>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-xl">
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="w-full bg-gray-200 rounded-full h-2"></div>
                    </div>
                </div>

                {/* Solde net */}
                <div className="p-3 bg-gray-100 rounded-xl mb-4">
                    <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto mb-2"></div>
                    <div className="flex justify-between">
                        <div className="text-center">
                            <div className="h-3 bg-gray-200 rounded w-8 mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                        <div className="w-px h-8 bg-gray-300"></div>
                        <div className="text-center">
                            <div className="h-3 bg-gray-200 rounded w-8 mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="bg-gray-100 p-3 rounded-xl mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div>
                                <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                        <div className="text-gray-300">→</div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div>
                                <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
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

    // Composant de squelette pour les stats
    const StatsSkeleton = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    // Affichage du chargement avec squelettes
    if (loading) {
        return (
            <div className="p-4 sm:p-6 max-w-full space-y-6 sm:space-y-8 bg-gray-50/50 min-h-screen">
                {/* Header skeleton */}
                <div className="flex justify-between items-center sticky top-0 bg-white pt-4 pb-2 z-10">
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
                    </div>
                </div>

                {/* Stats skeleton */}
                <StatsSkeleton />

                {/* Projects grid skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, index) => (
                        <ProjectCardSkeleton key={index} />
                    ))}
                </div>
            </div>
        );
    }

    // Affichage des erreurs
    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h2 className="text-red-800 font-semibold">Erreur</h2>
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
        <div className="p-4 sm:p-6 max-w-full space-y-6 sm:space-y-8 bg-gray-50/50 min-h-screen">
            {/* Overlay de chargement local */}
            {localLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span className="text-gray-600">Traitement en cours...</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center sticky top-0 bg-white pt-4 pb-2 z-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
                    <p className="text-gray-500 text-sm">Gérez vos projets et budgets</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Mode sélection */}
                    {isSelectMode ? (
                        <>
                            <span className="text-sm text-gray-600 mr-2">
                                {selectedProjects.length} sélectionné(s)
                            </span>

                            {selectedProjects.length > 0 && (
                                <Button
                                    onClick={handleDeleteMultiple}
                                    variant="destructive"
                                    disabled={localLoading}
                                >
                                    Supprimer ({selectedProjects.length})
                                </Button>
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
                            >
                                Sélection multiple
                            </Button>

                            <Button
                                onClick={handleNewProject}
                                className="bg-blue-500 text-white hover:bg-blue-600"
                                disabled={localLoading}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nouveau projet
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats */}
            <ProjectStats stats={projectStats} />

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <Card className="text-center p-8">
                    <CardContent className="pt-6">
                        <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun projet</h3>
                        <p className="text-gray-500 text-sm mb-4">Commencez par créer votre premier projet</p>
                        <Button
                            onClick={handleNewProject}
                            className="bg-blue-500 hover:bg-blue-600"
                            disabled={localLoading}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Créer un projet
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            projectTypeIcons={projectTypeIcons}
                            projectTypeColors={projectTypeColors}
                            getProjectIcon={getProjectIcon}
                            getProjectColor={getProjectColor}
                            editingProjectId={editingProjectId}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            setEditingProjectId={setEditingProjectId}
                            updateProject={updateProject}
                            navigate={navigate}
                            handleArchiveProject={handleArchiveProject}
                            handleRestoreProject={handleRestoreProject}
                            handleDeleteProject={handleDeleteProject}
                            localLoading={localLoading}
                            isSelectMode={isSelectMode}
                            isSelected={selectedProjects.includes(project.id)}
                            onToggleSelection={toggleProjectSelection}
                            activeProjectId={activeProjectId}
                        />
                    ))}
                </div>
            )}

            {/* Archive Dialog */}
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

export default ProjectsPage;