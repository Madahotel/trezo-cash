import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

const CollaboratorsHeader = ({ project, onInviteClick }) => {
  return (
    <div className="flex items-center justify-between bg-white">
      <div>
        <h1 className="text-3xl font-bold">Collaborateurs</h1>
        <p className="text-gray-600">Gérez les accès et permissions pour "{project.name}"</p>
      </div>
      <Button onClick={onInviteClick}>
        <Plus className="w-4 h-4 mr-2" />
        Inviter un collaborateur
      </Button>
    </div>
  );
};

export default CollaboratorsHeader;