// components/CollaboratorCard.jsx
import React from 'react';
import { Users, Edit, Trash2, Settings, Mail, Phone, Calendar, Building, Briefcase } from 'lucide-react';
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

const CollaboratorCard = ({ collaborator, onRemove }) => {
  // Fonction pour obtenir la couleur du badge selon le rôle/permission
  const getBadgeVariant = (type, value) => {
    if (type === 'permission') {
      const permission = value?.toLowerCase() || '';
      if (permission.includes('entrée/sortie') || permission.includes('admin')) {
        return 'destructive'; // Rouge pour admin/entrée-sortie
      } else if (permission.includes('éditeur') || permission.includes('editor')) {
        return 'default'; // Bleu pour éditeur
      } else {
        return 'outline'; // Gris pour lecteur
      }
    }
    
    if (type === 'role') {
      const role = value?.toLowerCase() || '';
      if (role.includes('éditeur') || role.includes('editor')) {
        return 'secondary'; // Violet pour éditeur
      } else if (role.includes('lecteur') || role.includes('reader')) {
        return 'outline'; // Gris pour lecteur
      } else {
        return 'default';
      }
    }
    
    return 'outline';
  };

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Déterminer les couleurs basées sur les permissions/rôles
  const getPermissionColor = (permission) => {
    const perm = permission?.toLowerCase();
    if (perm?.includes('entrée/sortie')) return 'bg-red-100 text-red-800 border-red-200';
    if (perm?.includes('sortie')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (perm?.includes('entrée')) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoleColor = (role) => {
    const roleLower = role?.toLowerCase();
    if (roleLower?.includes('éditeur')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (roleLower?.includes('lecteur')) return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-4">
        {/* En-tête avec infos principales */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {collaborator.name} {collaborator.firstname}
              </h3>
              <p className="text-sm text-gray-500">{collaborator.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  className={`text-xs ${getPermissionColor(collaborator.permission)}`}
                >
                  {collaborator.permission}
                </Badge>
                <Badge 
                  className={`text-xs ${getRoleColor(collaborator.role)}`}
                >
                  {collaborator.role}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-gray-200 w-48">
              <DropdownMenuItem className="cursor-pointer flex items-center">
                <Edit className="w-4 h-4 mr-2" />
                Modifier les permissions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onRemove}
                className="text-red-600 cursor-pointer flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer l'accès
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Informations de contact */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span className="truncate">{collaborator.email}</span>
          </div>
          
          {collaborator.phone_number && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{collaborator.phone_number}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Rejoint le {formatDate(collaborator.joined_at)}</span>
          </div>
        </div>

        {/* Détails des permissions */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Détails des accès</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <span className="font-medium">Type de permission:</span>
              <Badge className={getPermissionColor(collaborator.permission)}>
                {collaborator.permission}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Rôle:</span>
              <Badge className={getRoleColor(collaborator.role)}>
                {collaborator.role}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Statut:</span>
              <span className={collaborator.is_active ? "text-green-600 font-medium" : "text-red-600"}>
                {collaborator.is_active ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        </div>

        {/* Projets */}
        {collaborator.projects && collaborator.projects.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center space-x-2 mb-2">
              <Building className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-sm text-gray-700">
                Projets ({collaborator.projects.length})
              </h4>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {collaborator.projects.map((project, index) => (
                <div 
                  key={project.id || index}
                  className="flex items-center space-x-2 text-sm bg-white border border-gray-200 rounded px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <Briefcase className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 truncate flex-1">{project.name}</span>
                  <Badge variant="outline" className="text-xs bg-blue-50">
                    ID: {project.id}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aucun projet */}
        {(!collaborator.projects || collaborator.projects.length === 0) && (
          <div className="border-t pt-3">
            <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded border">
              <Building className="w-4 h-4" />
              <span>Aucun projet assigné</span>
            </div>
          </div>
        )}

        {/* Footer avec ID et statut */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span>ID: {collaborator.id}</span>
            {collaborator.full_name && (
              <span className="text-gray-400">• {collaborator.full_name}</span>
            )}
          </div>
          <Badge 
            variant={collaborator.is_active ? 'default' : 'outline'} 
            className={
              collaborator.is_active 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          >
            {collaborator.is_active ? '✓ Actif' : '✗ Inactif'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollaboratorCard;