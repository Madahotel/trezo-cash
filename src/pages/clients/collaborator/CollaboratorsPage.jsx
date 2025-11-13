
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useSettings } from '../../../components/context/SettingsContext';
import { useTranslation } from '../../../i18n/translations';
import { useUI } from '../../../components/context/UIContext'; // Importer le contexte UI
import collaborationService from '../../../services/collaborationService';

// Composants enfants
import CollaboratorsHeader from './CollaboratorsHeader';
import CollaborationStats from './CollaborationStats';
import CollaboratorsTabs from './CollaboratorsTabs';
import InviteCollaboratorDialog from './InviteCollaboratorDialog';
import RemoveCollaboratorDialog from './RemoveCollaboratorDialog';

const CollaboratorsPage = () => {
  const { language } = useSettings();
  const { t } = useTranslation(language);
  const { uiState } = useUI(); // Récupérer l'état UI
  
  const [collaborators, setCollaborators] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Utiliser le projet actif du contexte UI
  const project = uiState.activeProject;

  useEffect(() => {
    if (project?.id) {
      loadCollaborationData();
    }
  }, [project?.id]); // Déclencher quand l'ID du projet change

  const loadCollaborationData = () => {
    if (!project?.id) return;

    const projectCollaborators = collaborationService.getProjectCollaborators(project.id);
    const projectInvitations = collaborationService.getProjectInvitations(project.id);
    
    setCollaborators(projectCollaborators);
    setInvitations(projectInvitations);
  };

  const handleRemoveCollaborator = (collaborator) => {
    setSelectedCollaborator(collaborator);
    setDeleteDialogOpen(true);
  };

  const confirmRemoveCollaborator = () => {
    if (selectedCollaborator && project?.id) {
      collaborationService.removeCollaborator(project.id, selectedCollaborator.id);
      loadCollaborationData();
      setDeleteDialogOpen(false);
      setSelectedCollaborator(null);
    }
  };

  const stats = project?.id ? collaborationService.getProjectCollaborationStats(project.id) : {
    collaborators: 0,
    pendingInvitations: 0,
    totalInvitations: 0
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
          if (project?.id) {
            collaborationService.resendInvitation(project.id, invitation.id);
            loadCollaborationData();
          }
        }}
        onCancelInvitation={(invitation) => {
          if (project?.id) {
            collaborationService.cancelInvitation(project.id, invitation.id);
            loadCollaborationData();
          }
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