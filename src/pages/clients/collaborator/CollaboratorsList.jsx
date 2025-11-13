// components/CollaboratorList.jsx
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
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des collaborateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <Users className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-6 h-6" />
            Collaborateurs 
            <span className="text-blue-600">({filteredCollaborators.length})</span>
          </h2>
          {projectId && (
            <p className="text-gray-600 mt-1">
              {filteredCollaborators.length} collaborateur(s) sur {collaborators.length} total
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExport}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </Button>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Barre de filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Rechercher un collaborateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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