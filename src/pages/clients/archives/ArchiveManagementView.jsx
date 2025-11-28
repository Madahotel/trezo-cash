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
import { Input } from '../../../components/ui/Input';
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
  const fetchAllProjects = async () => {
    try {
      setLoading(true);

      const response = await axios.get('/projects');
      const allProjects = response.data;
      const transformedProjects = transformApiData(allProjects);
      const archived = transformedProjects.filter(project => project.is_archived);
      
      setArchivedProjects(archived);

    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
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
    if (apiData.projects.business?.project_business_items?.data) {
      apiData.projects.business.project_business_items.data.forEach(project => {
        const isArchived = project.entity_status_id === 3;

        transformedProjects.push({
          id: project.id,
          name: project.name,
          description: project.description || 'Aucune description',
          type: 'business',
          typeName: project.type_name || 'Business',
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

    const restoredProject = archivedProjects.find(p => p.id === projectId);
    
    setArchivedProjects(prev => prev.filter(project => project.id !== projectId));

    window.dispatchEvent(new CustomEvent('projectRestored', {
      detail: { 
        projectId: projectId,
        project: restoredProject,
        action: 'restored'
      }
    }));

    window.dispatchEvent(new CustomEvent('projectsUpdated', {
      detail: { 
        action: 'restored',
        projectId: projectId,
        project: restoredProject
      }
    }));

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

  const ArchivedProjectCard = ({ project }) => (
    <Card className="transition-shadow border-l-4 border-l-orange-500 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Folder className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
              <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                {project.typeName || 'Projet'}
              </span>
            </div>

            {project.description && (
              <p className="mb-3 text-sm text-gray-600 line-clamp-2">
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
            className="flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-100 hover:bg-green-200"
          >
            <ArchiveRestore className="w-4 h-4" />
            Restaurer
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ArchiveCardSkeleton = () => (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="w-48 h-4 bg-gray-200 rounded"></div>
              <div className="w-16 h-6 bg-gray-200 rounded"></div>
            </div>
            <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
            <div className="w-32 h-3 bg-gray-200 rounded"></div>
          </div>
          <div className="w-24 bg-gray-200 rounded h-9"></div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-64 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-64 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
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
      {localLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10">
          <div className="flex items-center p-4 space-x-3 bg-white rounded-lg">
            <div className="w-6 h-6 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <span className="text-gray-600">Traitement en cours...</span>
          </div>
        </div>
      )}

      <div className="p-6 bg-white rounded-lg shadow">
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
          <div className="p-4 text-center rounded-lg bg-blue-50">
            <div className="text-2xl font-bold text-blue-600">{archivedProjects.length}</div>
            <div className="text-sm text-blue-600">Projets archivés</div>
          </div>
          <div className="p-4 text-center rounded-lg bg-purple-50">
            <div className="text-2xl font-bold text-purple-600">{archivedScenarios.length}</div>
            <div className="text-sm text-purple-600">Scénarios archivés</div>
          </div>
          <div className="p-4 text-center rounded-lg bg-gray-50">
            <div className="text-2xl font-bold text-gray-600">{totalArchivedItems}</div>
            <div className="text-sm text-gray-600">Total archivé</div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Barre de recherche */}
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
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
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold">
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