import React, { useState, useEffect } from 'react';
import {
  Archive,
  ArchiveRestore,
  Folder,
  Layers,
  RotateCw,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import EmptyState from '../../../components/emptystate/EmptyState';
import axios from '../../../components/config/Axios';
import toast from 'react-hot-toast';

const ArchiveManagementView = () => {
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [archivedScenarios, setArchivedScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Récupérer TOUS les projets et filtrer les archivés côté client
  const fetchAllProjects = async () => {
    try {
      setLoading(true);

      const response = await axios.get('/projects');
      const allProjects = response.data;

      const transformedProjects = transformApiData(allProjects);

      // 🔥 CORRECTION : Filtrer uniquement les projets archivés
      const archived = transformedProjects.filter(project => project.is_archived);

      setArchivedProjects(archived);

      console.log('📁 Archives chargées:', archived.length, 'projets archivés');

    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };
  // Fonction de transformation des données
  const transformApiData = (apiData) => {
    const transformedProjects = [];

    if (!apiData.projects) {
      console.warn('Aucun projet trouvé dans la réponse API');
      return transformedProjects;
    }

    // Même logique de transformation que ProjectsPage mais sans filtre
    if (apiData.projects.business?.project_business_items?.data) {
      apiData.projects.business.project_business_items.data.forEach(project => {
        const isArchived = project.entity_status_id === 3;

        transformedProjects.push({
          id: project.id,
          name: project.name,
          description: project.description || 'Aucune description',
          type: 'business',
          typeName: project.type_name || 'Business',
          // ... autres champs
          is_archived: isArchived,
          entity_status_id: project.entity_status_id || 1,
          archived_at: project.updated_at,
          archived_reason: 'Archivé via le système'
        });
      });
    }
    // Transformation des projets événements
    if (apiData.projects.events?.project_event_items?.data) {
      apiData.projects.events.project_event_items.data.forEach(project => {
        const isArchived = project.entity_status_id === 3;

        transformedProjects.push({
          id: project.id,
          name: project.name,
          description: project.description || 'Aucune description',
          type: 'evenement',
          typeName: project.type_name || 'Événement',
          mainCurrency: 'EUR',
          incomeBudget: project.income_budget || 0,
          expenseBudget: project.expense_budget || 0,
          incomeRealized: project.income_realized || 0,
          expenseRealized: project.expense_realized || 0,
          startDate: project.start_date,
          endDate: project.end_date || project.start_date,
          status: project.status || 'active',
          isDurationUndetermined: project.is_duration_undetermined === 1,
          templateId: project.template_id,
          projectTypeId: project.project_type_id,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          userSubscriberId: project.user_subscriber_id,
          collaborators: [],
          is_archived: isArchived,
          entity_status_id: project.entity_status_id,
          archived_at: project.updated_at,
          archived_reason: 'Archivé via le système'
        });
      });
    }

    // Transformation des projets ménages
    if (apiData.projects.menages?.project_menage_items?.data) {
      apiData.projects.menages.project_menage_items.data.forEach(project => {
        const isArchived = project.entity_status_id === 3;

        transformedProjects.push({
          id: project.id,
          name: project.name,
          description: project.description || 'Aucune description',
          type: 'menage',
          typeName: project.type_name || 'Ménage',
          mainCurrency: 'EUR',
          incomeBudget: project.income_budget || 0,
          expenseBudget: project.expense_budget || 0,
          incomeRealized: project.income_realized || 0,
          expenseRealized: project.expense_realized || 0,
          startDate: project.start_date,
          endDate: project.end_date || project.start_date,
          status: project.status || 'active',
          isDurationUndetermined: project.is_duration_undetermined === 1,
          templateId: project.template_id,
          projectTypeId: project.project_type_id,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          userSubscriberId: project.user_subscriber_id,
          collaborators: [],
          is_archived: isArchived,
          entity_status_id: project.entity_status_id,
          archived_at: project.updated_at,
          archived_reason: 'Archivé via le système'
        });
      });
    }

    console.log(`${transformedProjects.length} projets transformés, ${transformedProjects.filter(p => p.is_archived).length} archivés`);
    return transformedProjects;
  };

  useEffect(() => {
    fetchAllProjects();
  }, []);

  // Fonction pour restaurer un projet avec l'endpoint RESTORE
  const handleRestoreProject = async (projectId) => {
    try {
      setLocalLoading(true);
      const loadingToast = toast.loading('Restauration du projet en cours...');

      // Utiliser l'endpoint RESTORE dédié
      await axios.patch(`/projects/${projectId}/restore`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      // Mettre à jour la liste locale
      setArchivedProjects(prev => prev.filter(project => project.id !== projectId));

      toast.success('Projet restauré avec succès !', {
        id: loadingToast,
        duration: 4000,
      });

    } catch (error) {
      console.error('Erreur lors de la restauration:', error);

      if (error.response?.status === 404) {
        toast.error('Projet non trouvé');
      } else {
        toast.error('Erreur lors de la restauration du projet');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  // Filtrer les données selon la recherche
  const filteredProjects = archivedProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredScenarios = archivedScenarios.filter(scenario =>
    scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Composant de carte pour projet archivé
  const ArchivedProjectCard = ({ project }) => (
    <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Folder className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {project.typeName || 'Projet'}
              </span>
            </div>

            {project.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {project.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Archivé le {formatDate(project.archived_at)}</span>
              </div>
              {project.archived_reason && (
                <span className="text-orange-600">• {project.archived_reason}</span>
              )}
            </div>
          </div>

          <Button
            onClick={() => handleRestoreProject(project.id)}
            disabled={localLoading}
            className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-2 flex items-center gap-2 text-sm"
          >
            <ArchiveRestore className="w-4 h-4" />
            Restaurer
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Squelette de chargement
  const ArchiveCardSkeleton = () => (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-9 bg-gray-200 rounded w-24"></div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
        </div>

        {/* Filtres skeleton */}
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <ArchiveCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  const totalArchivedItems = filteredProjects.length + filteredScenarios.length;

  return (
    <div className="space-y-6">
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
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-3 mb-2">
          <Archive className="w-8 h-8 text-slate-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Archives</h1>
            <p className="text-gray-600">
              Gérez et restaurez vos projets et scénarios archivés
            </p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{archivedProjects.length}</div>
            <div className="text-sm text-blue-600">Projets archivés</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{archivedScenarios.length}</div>
            <div className="text-sm text-purple-600">Scénarios archivés</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{totalArchivedItems}</div>
            <div className="text-sm text-gray-600">Total archivé</div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Rechercher dans les archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres par type */}
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Tous
            </Button>
            <Button
              variant={filterType === 'projects' ? 'default' : 'outline'}
              onClick={() => setFilterType('projects')}
              className="flex items-center gap-2"
            >
              <Folder className="w-4 h-4" />
              Projets
            </Button>
          </div>
        </div>
      </div>

      {/* Section Projets Archivés */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Folder className="w-5 h-5 text-orange-500" />
          Projets Archivés ({filteredProjects.length})
        </h2>

        {filteredProjects.length > 0 ? (
          <div className="space-y-4">
            {filteredProjects.map(project => (
              <ArchivedProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Archive}
            title="Aucun projet archivé"
            message={
              searchTerm
                ? "Aucun projet ne correspond à votre recherche."
                : "Les projets que vous archivez apparaîtront ici pour une consultation ou une restauration future."
            }
          />
        )}
      </div>

      {/* Bouton de rafraîchissement */}
      <div className="flex justify-center">
        <Button
          onClick={fetchAllProjects}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCw className="w-4 h-4" />
          Actualiser
        </Button>
      </div>
    </div>
  );
};

export default ArchiveManagementView;