import React, { useState, useEffect } from 'react';
import CollaboratorTable from './CollaboratorTable';
import { collaborationService } from '../../../services/collaborationService';
import { Button } from '../../../components/ui/Button';
import { Users, Plus, RefreshCw, Download, Filter } from 'lucide-react';
import { toast } from '../../../hooks/use-toast';
import { Input } from '../../../components/ui/Input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

const CollaboratorList = ({ projectId }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    phone: true,
    role: true,
    permission: true,
    status: true,
    joinDate: true,
    projects: true,
    actions: true
  });

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await collaborationService.getFormattedCollaborators(projectId);
      setCollaborators(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les collaborateurs');
      toast({
        title: "Erreur",
        description: "Impossible de charger les collaborateurs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCollaborators();
  };

  useEffect(() => {
    loadCollaborators();
  }, [projectId]);

  // Filtrage des collaborateurs
  const filteredCollaborators = collaborators.filter(collaborator => {
    const matchesSearch = 
      collaborator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.role?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || collaborator.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && collaborator.is_active) ||
      (statusFilter === 'inactive' && !collaborator.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      await collaborationService.removeCollaborator(collaboratorId);
      toast({
        title: "Succès",
        description: "Collaborateur supprimé avec succès",
      });
      await loadCollaborators();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le collaborateur",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePermissions = async (collaboratorId, permissionData) => {
    try {
      await collaborationService.updateCollaboratorPermissions(collaboratorId, permissionData);
      toast({
        title: "Succès",
        description: "Permissions mises à jour avec succès",
      });
      await loadCollaborators();
    } catch (error) {
      console.error('Erreur mise à jour permissions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les permissions",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    // Logique d'export des données
    toast({
      title: "Export réussi",
      description: "Les données ont été exportées avec succès",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Chargement des collaborateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="max-w-md p-6 mx-auto border border-red-200 rounded-lg bg-red-50">
          <Users className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h3 className="mb-2 text-lg font-semibold text-red-800">Erreur de chargement</h3>
          <p className="mb-4 text-red-600">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={loadCollaborators} variant="outline">
              Réessayer
            </Button>
            <Button onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques et contrôles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl">
            <Users className="w-6 h-6" />
            Liste des Collaborateurs 
          </h2>
          {projectId && (
            <p className="mt-1 text-gray-600">
              {filteredCollaborators.length} collaborateur(s) sur {collaborators.length} total
            </p>
          )}
        </div>
      </div>

      {/* Barre de filtres et recherche */}
      <div className="flex flex-col items-start justify-between gap-4 p-4 rounded-lg sm:flex-row sm:items-center bg-gray-50">
        <div className="flex flex-col flex-1 gap-3 sm:flex-row">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Rechercher un collaborateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Users className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          </div>
          
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les rôles</option>
            <option value="Éditeur">Éditeur</option>
            <option value="Lecteur">Lecteur</option>
            <option value="Admin">Admin</option>
          </select>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Colonnes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            {Object.entries(visibleColumns).map(([key, value]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={value}
                onCheckedChange={(checked) => 
                  setVisibleColumns(prev => ({ ...prev, [key]: checked }))
                }
              >
                {key === 'name' && 'Nom'}
                {key === 'email' && 'Email'}
                {key === 'phone' && 'Téléphone'}
                {key === 'role' && 'Rôle'}
                {key === 'permission' && 'Permission'}
                {key === 'status' && 'Statut'}
                {key === 'joinDate' && 'Date d\'arrivée'}
                {key === 'projects' && 'Projets'}
                {key === 'actions' && 'Actions'}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tableau des collaborateurs */}
      <CollaboratorTable
        collaborators={filteredCollaborators}
        visibleColumns={visibleColumns}
        onRemoveCollaborator={handleRemoveCollaborator}
        onUpdatePermissions={handleUpdatePermissions}
        emptyMessage={
          collaborators.length === 0 
            ? "Aucun collaborateur n'a été ajouté pour le moment."
            : "Aucun collaborateur ne correspond à vos critères de recherche."
        }
      />
    </div>
  );
};

export default CollaboratorList;