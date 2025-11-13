// components/CollaboratorsPage.jsx
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useSettings } from '../../../components/context/SettingsContext';
import { useTranslation } from '../../../i18n/translations';
import { useUI } from '../../../components/context/UIContext';
import { collaborationService } from '../../../services/collaborationService';

// Composants enfants
import CollaboratorsHeader from './CollaboratorsHeader';
import CollaborationStats from './CollaborationStats';
import CollaboratorsTabs from './CollaboratorsTabs';
import InviteCollaboratorDialog from './InviteCollaboratorDialog';
import RemoveCollaboratorDialog from './RemoveCollaboratorDialog';

const CollaboratorsPage = () => {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const { uiState } = useUI();
  
  const [collaborators, setCollaborators] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const project = uiState.activeProject;

  useEffect(() => {
    loadCollaborationData();
  }, [project?.id]);

  const loadCollaborationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer tous les collaborateurs
      const allCollaborators = await collaborationService.getFormattedCollaborators();
      
      // Filtrer par projet si un projet est sélectionné
      if (project?.id) {
        const projectCollaborators = allCollaborators.filter(collaborator => 
          collaborator.projects.some(proj => proj.id == project.id)
        );
        setCollaborators(projectCollaborators);
      } else {
        setCollaborators(allCollaborators);
      }
      
      // Pour les invitations, vous devrez adapter selon votre logique
      setInvitations([]); // À remplacer par votre logique d'invitations
      
    } catch (err) {
      console.error('Erreur chargement collaborateurs:', err);
      setError('Impossible de charger les collaborateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaborator) => {
    try {
      setSelectedCollaborator(collaborator);
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error('Erreur préparation suppression:', error);
    }
  };

  const confirmRemoveCollaborator = async () => {
    if (selectedCollaborator) {
      try {
        await collaborationService.removeCollaborator(selectedCollaborator.id);
        await loadCollaborationData();
        setDeleteDialogOpen(false);
        setSelectedCollaborator(null);
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  const stats = {
    collaborators: collaborators.length,
    pendingInvitations: invitations.length,
    totalInvitations: collaborators.length + invitations.length
  };

  // Vérifier si un projet est sélectionné
  if (!project) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Aucun projet sélectionné</h1>
          <p className="text-gray-500">Veuillez sélectionner un projet pour gérer les collaborateurs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des collaborateurs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadCollaborationData} variant="outline">
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <CollaboratorsHeader 
        project={project}
        onInviteClick={() => setIsInviteDialogOpen(true)}
      />

      <CollaborationStats stats={stats} />

      <CollaboratorsTabs
        collaborators={collaborators}
        invitations={invitations}
        onRemoveCollaborator={handleRemoveCollaborator}
        onResendInvitation={(invitation) => {
          // Logique pour renvoyer l'invitation
          console.log('Renvoi invitation:', invitation);
        }}
        onCancelInvitation={(invitation) => {
          // Logique pour annuler l'invitation
          console.log('Annulation invitation:', invitation);
        }}
        onCopyInvitationLink={(invitationId) => {
          const link = collaborationService.generateInvitationLink(invitationId);
          navigator.clipboard.writeText(link);
        }}
      />

      <InviteCollaboratorDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        project={project}
        onInviteSent={() => {
          loadCollaborationData();
          setIsInviteDialogOpen(false);
        }}
      />

      <RemoveCollaboratorDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        collaborator={selectedCollaborator}
        onConfirm={confirmRemoveCollaborator}
      />
    </div>
  );
};

export default CollaboratorsPage;