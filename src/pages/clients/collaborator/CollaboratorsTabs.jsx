// components/CollaboratorsTabs.jsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import CollaboratorsList from './CollaboratorsList';
import InvitationsList from './InvitationsList';

const CollaboratorsTabs = ({
  collaborators,
  invitations,
  onRemoveCollaborator,
  onResendInvitation,
  onCancelInvitation,
  onCopyInvitationLink
}) => {
  return (
    <Tabs defaultValue="collaborators" className="space-y-4">
      <TabsList className="bg-gray-100 p-1 rounded-lg">
        <TabsTrigger value="collaborators" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
          Collaborateurs ({collaborators.length})
        </TabsTrigger>
        <TabsTrigger value="invitations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
          Invitations ({invitations.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="collaborators">
        <CollaboratorsList 
          collaborators={collaborators}
          onRemoveCollaborator={onRemoveCollaborator}
        />
      </TabsContent>

      <TabsContent value="invitations">
        <InvitationsList
          invitations={invitations}
          onResendInvitation={onResendInvitation}
          onCancelInvitation={onCancelInvitation}
          onCopyInvitationLink={onCopyInvitationLink}
        />
      </TabsContent>
    </Tabs>
  );
};

export default CollaboratorsTabs;