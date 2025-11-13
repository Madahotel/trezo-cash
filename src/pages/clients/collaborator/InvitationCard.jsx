import React from 'react';
import { Mail, Copy, RefreshCw, X, Settings } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import Badge from '../../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import collaborationService from '../../../services/collaborationService';
import StatusBadge from './StatusBadge';

const InvitationCard = ({ invitation, onResend, onCancel, onCopyLink }) => {
  const formattedPermissions = collaborationService.formatPermissions(invitation.permissions);
  const isExpired = new Date() > new Date(invitation.expiresAt);

  return (
    <Card className="bg-white border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
              <Mail className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium">{invitation.name}</h3>
              <p className="text-sm text-gray-500">{invitation.email}</p>
              <div className="flex items-center mt-1 space-x-2">
                <StatusBadge status={invitation.status} />
                <span className="text-xs text-gray-400">
                  {isExpired ? 'Expirée' : `Expire le ${new Date(invitation.expiresAt).toLocaleDateString('fr-FR')}`}
                </span>
              </div>
            </div>
          </div>
          
          {invitation.status === 'pending' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                <DropdownMenuItem onClick={onCopyLink} className="cursor-pointer">
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le lien
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onResend} className="cursor-pointer">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Renvoyer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onCancel}
                  className="text-red-600 cursor-pointer"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler l'invitation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          <p><strong>Accès :</strong> {formattedPermissions.accessLevel}</p>
          <p><strong>Sections :</strong> {formattedPermissions.sections}</p>
          <p><strong>Catégories :</strong> {formattedPermissions.categories}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvitationCard;