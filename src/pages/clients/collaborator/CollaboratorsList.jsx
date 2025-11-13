// components/CollaboratorList.jsx
import React, { useState, useEffect } from 'react';
import CollaboratorCard from './CollaboratorCard';
import { collaborationService } from '../../../services/collaborationService';
import { Button } from '../../../components/ui/Button';
import { Users, Plus, RefreshCw } from 'lucide-react';
import { toast } from '../../../hooks/use-toast';

const CollaboratorList = ({ projectId }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser la méthode du service pour récupérer les collaborateurs formatés
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
      {/* En-tête avec statistiques */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-6 h-6" />
            Collaborateurs 
            <span className="text-blue-600">({collaborators.length})</span>
          </h2>
          {projectId && (
            <p className="text-gray-600 mt-1">
              {collaborators.length} collaborateur(s) sur ce projet
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Inviter un collaborateur
          </Button>
        </div>
      </div>

      {/* Liste des collaborateurs */}
      {collaborators.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun collaborateur</h3>
          <p className="text-gray-500 mb-6">
            {projectId 
              ? "Aucun collaborateur n'est assigné à ce projet pour le moment." 
              : "Aucun collaborateur n'a été ajouté pour le moment."
            }
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Inviter le premier collaborateur
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Résumé des rôles */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from(new Set(collaborators.map(c => c.permissions.accessLevel))).map(role => {
              const count = collaborators.filter(c => c.permissions.accessLevel === role).length;
              return (
                <div key={role} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                  {count} {role.toLowerCase()}
                </div>
              );
            })}
          </div>

          {/* Grille des cartes collaborateurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {collaborators.map((collaborator) => (
              <CollaboratorCard
                key={collaborator.id}
                collaborator={collaborator}
                onRemove={() => handleRemoveCollaborator(collaborator.id)}
                onUpdatePermissions={(permissionData) => 
                  handleUpdatePermissions(collaborator.id, permissionData)
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaboratorList;