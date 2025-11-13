import React from 'react';
import { Mail } from 'lucide-react';
import InvitationCard from './InvitationCard';

const InvitationsList = ({ 
  invitations, 
  onResendInvitation, 
  onCancelInvitation, 
  onCopyInvitationLink 
}) => {
  if (invitations.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 bg-white border border-gray-200 rounded-lg">
        <Mail className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>Aucune invitation envoyée</p>
        <p className="text-sm">Les invitations apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          onResend={() => onResendInvitation(invitation)}
          onCancel={() => onCancelInvitation(invitation)}
          onCopyLink={() => onCopyInvitationLink(invitation.id)}
        />
      ))}
    </div>
  );
};

export default InvitationsList;