import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../components/config/Axios';
import {
    Plus,
    FolderOpen,
    Calendar,
    Edit,
    Trash2,
    BarChart,
    Building2,
    Home,
    PartyPopper,
    Globe,
    Archive,
    RotateCcw,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/textarea';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { useSettings } from '../../../contexts/SettingsContext';
import archiveService from '../../../services/archiveService';

const ProjectsPage = () => {
    const navigate = useNavigate();
    const { language, formatCurrency, currencies } = useSettings();

    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [archiveReason, setArchiveReason] = useState('');
    
    // Suppression des états liés au modal de création
    const [availableTemplates, setAvailableTemplates] = useState([]);
    const [templatePreview, setTemplatePreview] = useState(null);

    // États pour les données de l'API
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projectStats, setProjectStats] = useState({
        total: 0,
        business: 0,
        events: 0,
        menages: 0
    });

    // Récupération des données depuis l'API
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('/projects');
            const data = response.data;

            // Transformation des données de l'API
            const transformedProjects = transformApiData(data);
            setProjects(transformedProjects);

            // Mise à jour des statistiques
            setProjectStats({
                total: data.project_count,
                business: data.projects.business.project_business_count,
                events: data.projects.events.project_event_count,
                menages: data.projects.menages.project_menage_count
            });

        } catch (err) {
            console.error('Erreur lors de la récupération des projets:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour transformer les données de l'API en format compatible avec le composant
    const transformApiData = (apiData) => {
        const transformedProjects = [];

        // Transformation des projets business
        if (apiData.projects.business && apiData.projects.business.project_business_items.data) {
            apiData.projects.business.project_business_items.data.forEach(project => {
                transformedProjects.push({
                    id: project.id,
                    name: project.name,
                    description: project.description || 'Aucune description',
                    type: 'business',
                    mainCurrency: 'EUR',
                    incomeBudget: 0,
                    expenseBudget: 0,
                    incomeRealized: 0,
                    expenseRealized: 0,
                    startDate: project.start_date,
                    endDate: project.end_date || project.start_date,
                    status: 'active',
                    isDurationUndetermined: project.is_duration_undetermined === 1,
                    templateId: project.template_id,
                    projectTypeId: project.project_type_id,
                    typeName: project.type_name,
                    createdAt: project.created_at,
                    updatedAt: project.updated_at,
                    userSubscriberId: project.user_subscriber_id,
                    collaborators: []
                });
            });
        }

        // Transformation des projets événements
        if (apiData.projects.events && apiData.projects.events.project_event_items.data) {
            apiData.projects.events.project_event_items.data.forEach(project => {
                transformedProjects.push({
                    id: project.id,
                    name: project.name,
                    description: project.description || 'Aucune description',
                    type: 'evenement',
                    mainCurrency: 'EUR',
                    incomeBudget: 0,
                    expenseBudget: 0,
                    incomeRealized: 0,
                    expenseRealized: 0,
                    startDate: project.start_date,
                    endDate: project.end_date || project.start_date,
                    status: 'active',
                    isDurationUndetermined: project.is_duration_undetermined === 1,
                    templateId: project.template_id,
                    projectTypeId: project.project_type_id,
                    typeName: project.type_name,
                    createdAt: project.created_at,
                    updatedAt: project.updated_at,
                    userSubscriberId: project.user_subscriber_id,
                    collaborators: []
                });
            });
        }

        // Transformation des projets ménages
        if (apiData.projects.menages && apiData.projects.menages.project_menage_items.data) {
            apiData.projects.menages.project_menage_items.data.forEach(project => {
                transformedProjects.push({
                    id: project.id,
                    name: project.name,
                    description: project.description || 'Aucune description',
                    type: 'menage',
                    mainCurrency: 'EUR',
                    incomeBudget: 0,
                    expenseBudget: 0,
                    incomeRealized: 0,
                    expenseRealized: 0,
                    startDate: project.start_date,
                    endDate: project.end_date || project.start_date,
                    status: 'active',
                    isDurationUndetermined: project.is_duration_undetermined === 1,
                    templateId: project.template_id,
                    projectTypeId: project.project_type_id,
                    typeName: project.type_name,
                    createdAt: project.created_at,
                    updatedAt: project.updated_at,
                    userSubscriberId: project.user_subscriber_id,
                    collaborators: []
                });
            });
        }

        return transformedProjects;
    };

    // Project types configuration
    const projectTypes = {
        business: {
            id: 'business',
            name: 'Business',
            description: 'Activité régulière avec fiscalité (TVA, impôt société)',
            icon: Building2,
            color: 'blue',
            features: ['tva', 'impots_societe']
        },
        menage: {
            id: 'menage',
            name: 'Ménage',
            description: 'Gestion familiale quotidienne',
            icon: Home,
            color: 'green',
            features: []
        },
        evenement: {
            id: 'evenement',
            name: 'Événement',
            description: 'Événements ponctuels (mariage, vacances)',
            icon: PartyPopper,
            color: 'purple',
            features: []
        }
    };

    // Nouvelle fonction pour gérer le clic sur "Nouveau projet"
    const handleNewProject = () => {
        navigate('/client/onboarding');
    };

    const getProjectTypeInfo = (type) => {
        return projectTypes[type] || projectTypes.business;
    };

    const getProgressPercentage = (realized, budget) => {
        if (budget === 0) return 0;
        return Math.min((realized / budget) * 100, 100);
    };

    const getNetBudget = (project) => {
        return project.incomeBudget - project.expenseBudget;
    };

    const getNetRealized = (project) => {
        return project.incomeRealized - project.expenseRealized;
    };

    const handleArchiveProject = (project) => {
        setSelectedProject(project);
        setArchiveDialogOpen(true);
    };

    const confirmArchiveProject = async () => {
        if (selectedProject) {
            try {
                // Archive the project via API
                await archiveService.archiveProject(selectedProject, archiveReason);

                // Recharger la liste des projets
                await fetchProjects();

                // Reset dialog state
                setArchiveDialogOpen(false);
                setSelectedProject(null);
                setArchiveReason('');

                alert(`Projet "${selectedProject.name}" archivé avec succès !`);
            } catch (err) {
                console.error('Erreur lors de l\'archivage:', err);
                setError(err.message);
            }
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'active') {
            return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Actif</span>;
        }
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Terminé</span>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Non définie';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    // Affichage du chargement
    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement des projets...</p>
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
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Réessayer
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 w-100 h-50">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Projets</h1>
                    <p className="text-gray-600">Gérez vos projets et budgets</p>
                </div>
                {/* Bouton modifié pour utiliser la navigation */}
                <Button onClick={handleNewProject}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau projet
                </Button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total projets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{projectStats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Projets Business</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                            {projectStats.business}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Événements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">
                            {projectStats.events}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Ménages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {projectStats.menages}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <Card className="text-center p-12">
                    <CardContent>
                        <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun projet</h3>
                        <p className="text-gray-500 mb-4">Commencez par créer votre premier projet</p>
                        <Button onClick={handleNewProject}>
                            <Plus className="w-4 h-4 mr-2" />
                            Créer un projet
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {projects.map((project) => {
                        const typeInfo = getProjectTypeInfo(project.type);
                        const IconComponent = typeInfo.icon;
                        const netBudget = getNetBudget(project);
                        const netRealized = getNetRealized(project);
                        const incomeProgress = getProgressPercentage(project.incomeRealized, project.incomeBudget);
                        const expenseProgress = getProgressPercentage(project.expenseRealized, project.expenseBudget);

                        return (
                            <Card key={project.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className={`w-12 h-12 rounded-lg bg-${typeInfo.color}-100 flex items-center justify-center`}>
                                                <IconComponent className={`w-6 h-6 text-${typeInfo.color}-600`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <CardTitle className="text-lg">{project.name}</CardTitle>
                                                    <span className={`px-2 py-1 text-xs bg-${typeInfo.color}-100 text-${typeInfo.color}-700 rounded-full`}>
                                                        {typeInfo.name}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">{project.description}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Globe className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">{project.mainCurrency}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {getStatusBadge(project.status)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Budget Summary */}
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div className="p-3 bg-green-50 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-1">Revenus</p>
                                                <p className="font-semibold text-green-600">
                                                    {formatCurrency(project.incomeRealized, project.mainCurrency)} / {formatCurrency(project.incomeBudget, project.mainCurrency)}
                                                </p>
                                                <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full"
                                                        style={{ width: `${Math.min(incomeProgress, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-red-50 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-1">Dépenses</p>
                                                <p className="font-semibold text-red-600">
                                                    {formatCurrency(project.expenseRealized, project.mainCurrency)} / {formatCurrency(project.expenseBudget, project.mainCurrency)}
                                                </p>
                                                <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                                                    <div
                                                        className="bg-red-500 h-2 rounded-full"
                                                        style={{ width: `${Math.min(expenseProgress, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Net Balance */}
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-600 mb-1">Solde Net</p>
                                            <div className="flex justify-between">
                                                <span className="text-sm">
                                                    Prévu: <span className={`font-semibold ${netBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(netBudget, project.mainCurrency)}
                                                    </span>
                                                </span>
                                                <span className="text-sm">
                                                    Réalisé: <span className={`font-semibold ${netRealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(netRealized, project.mainCurrency)}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Durée indéterminée */}
                                        {project.isDurationUndetermined && (
                                            <div className="text-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                <p className="text-xs text-yellow-700 font-medium">
                                                    ⏳ Durée indéterminée
                                                </p>
                                            </div>
                                        )}

                                        {/* Dates */}
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center text-gray-600">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                {formatDate(project.startDate)}
                                            </div>
                                            {!project.isDurationUndetermined && (
                                                <>
                                                    <span className="text-gray-400">→</span>
                                                    <div className="text-gray-600">
                                                        {formatDate(project.endDate)}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2 border-t">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => navigate(`/app/project/${project.id}/dashboard`)}
                                            >
                                                <BarChart className="w-4 h-4 mr-1" />
                                                Voir
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleArchiveProject(project)}
                                                title="Archiver le projet"
                                            >
                                                <Archive className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Archive Confirmation Dialog */}
            <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archiver le projet</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir archiver ce projet ? Il sera déplacé vers les archives et ne sera plus visible dans la liste des projets actifs.
                            {selectedProject && (
                                <div className="mt-2 font-medium">
                                    {selectedProject.name}
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-2 py-4">
                        <Label htmlFor="archiveReason">Raison de l'archivage (optionnel)</Label>
                        <Textarea
                            id="archiveReason"
                            value={archiveReason}
                            onChange={(e) => setArchiveReason(e.target.value)}
                            placeholder="Ex: Projet terminé, En pause, Budget épuisé..."
                            rows={3}
                        />
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setArchiveReason('')}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmArchiveProject} className="bg-orange-600 hover:bg-orange-700">
                            <Archive className="w-4 h-4 mr-2" />
                            Archiver
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ProjectsPage;