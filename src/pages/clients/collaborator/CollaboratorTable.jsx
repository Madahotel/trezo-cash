import React, { useState, useMemo } from 'react';
import { Edit, Trash2, MoreVertical, Mail, Phone, Calendar, Building, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import Badge from '../../../components/ui/badge';
import { useUI } from '../../../components/context/UIContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

const CollaboratorTable = ({ 
  collaborators, 
  visibleColumns, 
  onRemoveCollaborator, 
  onUpdatePermissions,
  emptyMessage 
}) => {
  const { uiState } = useUI(); 
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const filteredCollaborators = useMemo(() => {
    if (!uiState.activeProject?.id) {
      return collaborators;
    }
if (uiState.activeProject && typeof uiState.activeProject.id === "string" &&
    (uiState.activeProject.id === "consolidated" || 
     uiState.activeProject.id.startsWith("consolidated_view_"))) {
  return collaborators;
}
    return collaborators.filter(collaborator => {
      return collaborator.projects?.some(project => 
        project.id === uiState.activeProject.id
      );
    });
  }, [collaborators, uiState.activeProject]);

  const toggleRowExpansion = (collaboratorId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(collaboratorId)) {
      newExpanded.delete(collaboratorId);
    } else {
      newExpanded.add(collaboratorId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCollaborators = useMemo(() => {
    return [...filteredCollaborators].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'name') {
        aValue = `${a.firstname} ${a.name}`;
        bValue = `${b.firstname} ${b.name}`;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCollaborators, sortField, sortDirection]);

  const getBadgeVariant = (type, value) => {
    if (type === 'permission') {
      const permission = value?.toLowerCase() || '';
      if (permission.includes('entrée/sortie') || permission.includes('admin')) {
        return 'destructive';
      } else if (permission.includes('éditeur') || permission.includes('editor')) {
        return 'default';
      } else {
        return 'outline';
      }
    }
    
    if (type === 'role') {
      const role = value?.toLowerCase() || '';
      if (role.includes('éditeur') || role.includes('editor')) {
        return 'secondary';
      } else if (role.includes('lecteur') || role.includes('reader')) {
        return 'outline';
      } else {
        return 'default';
      }
    }
    
    if (type === 'status') {
      return value ? 'default' : 'outline';
    }
    
    return 'outline';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const SortableHeader = ({ field, children }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </TableHead>
  );

  if (filteredCollaborators.length === 0) {
    return (
      <div className="py-16 text-center bg-white border-2 border-gray-300 border-dashed rounded-lg">
        <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-600">
          {uiState.activeProject ? 
            "Aucun collaborateur pour ce projet" : 
            "Aucun collaborateur"
          }
        </h3>
        <p className="mb-6 text-gray-500">
          {uiState.activeProject ? 
            "Aucun collaborateur n'est actuellement associé à ce projet." : 
            emptyMessage
          }
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Inviter un collaborateur
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
      {uiState.activeProject && (
        <div className="px-4 py-2 border-b border-blue-100 bg-blue-50">
          <p className="text-sm text-blue-700">
            Affichage des collaborateurs du projet : <strong>{uiState.activeProject.name}</strong>
            <span className="ml-2 text-blue-500">
              ({filteredCollaborators.length} collaborateur{filteredCollaborators.length > 1 ? 's' : ''})
            </span>
          </p>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="w-12"></TableHead>
            {visibleColumns.name && (
              <SortableHeader field="name">Nom</SortableHeader>
            )}
            {visibleColumns.email && (
              <SortableHeader field="email">Email</SortableHeader>
            )}
            {visibleColumns.phone && (
              <TableHead>Téléphone</TableHead>
            )}
            {visibleColumns.role && (
              <SortableHeader field="role">Rôle</SortableHeader>
            )}
            {visibleColumns.permission && (
              <SortableHeader field="permission">Permission</SortableHeader>
            )}
            {visibleColumns.status && (
              <SortableHeader field="is_active">Statut</SortableHeader>
            )}
            {visibleColumns.joinDate && (
              <SortableHeader field="joined_at">Date d'arrivée</SortableHeader>
            )}
            {visibleColumns.projects && (
              <TableHead>Projets</TableHead>
            )}
            {visibleColumns.actions && (
              <TableHead className="w-20">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCollaborators.map((collaborator) => (
            <React.Fragment key={collaborator.id}>
              <TableRow className="border-b border-gray-100 hover:bg-gray-50">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRowExpansion(collaborator.id)}
                    className="w-8 h-8 p-0"
                  >
                    {expandedRows.has(collaborator.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </TableCell>
                
                {visibleColumns.name && (
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">
                        {/* {collaborator.firstname} {collaborator.name} */}
                      </div>
                      {collaborator.full_name && (
                        <div className="text-sm text-gray-500">{collaborator.full_name}</div>
                      )}
                    </div>
                  </TableCell>
                )}
                
                {visibleColumns.email && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px]">{collaborator.email}</span>
                    </div>
                  </TableCell>
                )}
                
                {visibleColumns.phone && (
                  <TableCell>
                    {collaborator.phone_number ? (
                      <div className="flex items-center gap-2">
                        <span>{collaborator.phone_number}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                )}
                
                {visibleColumns.role && (
                  <TableCell>
                    <Badge variant={getBadgeVariant('role', collaborator.role)}>
                      {collaborator.role}
                    </Badge>
                  </TableCell>
                )}
                
                {visibleColumns.permission && (
                  <TableCell>
                    <Badge variant={getBadgeVariant('permission', collaborator.permission)}>
                      {collaborator.permission}
                    </Badge>
                  </TableCell>
                )}
                
                {visibleColumns.status && (
                  <TableCell>
                    <Badge 
                      variant={getBadgeVariant('status', collaborator.is_active)}
                      className={
                        collaborator.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    >
                      {collaborator.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                )}
                
                {visibleColumns.joinDate && (
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {formatDate(collaborator.joined_at)}
                    </div>
                  </TableCell>
                )}
                
                {visibleColumns.projects && (
                  <TableCell>
                    <div className="text-sm">
                      {collaborator.projects && collaborator.projects.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span>{collaborator.projects.length} projet(s)</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Aucun projet</span>
                      )}
                    </div>
                  </TableCell>
                )}
                
                {visibleColumns.actions && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200">
                        <DropdownMenuItem 
                          className="flex items-center cursor-pointer"
                          onClick={() => onUpdatePermissions(collaborator.id, {})}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier les permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onRemoveCollaborator(collaborator.id)}
                          className="flex items-center text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer l'accès
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
              
              {/* Ligne détaillée expandable */}
              {expandedRows.has(collaborator.id) && (
                <TableRow className="border-b border-blue-100 bg-blue-50">
                  <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1}>
                    <div className="p-4">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Informations de contact */}
                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-gray-700">Informations de contact</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span>{collaborator.email}</span>
                            </div>
                            {collaborator.phone_number && (
                              <div className="flex items-center gap-2">
                                <span>{collaborator.phone_number}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span>Rejoint le {formatDate(collaborator.joined_at)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Détails des permissions */}
                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-gray-700">Détails des accès</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Type de permission:</span>
                              <Badge variant={getBadgeVariant('permission', collaborator.permission)}>
                                {collaborator.permission}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Rôle:</span>
                              <Badge variant={getBadgeVariant('role', collaborator.role)}>
                                {collaborator.role}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Projets assignés */}
                        <div>
                          <h4 className="mb-3 text-sm font-semibold text-gray-700">
                            Projets assignés ({collaborator.projects?.length || 0})
                          </h4>
                          <div className="space-y-1 overflow-y-auto max-h-32">
                            {collaborator.projects && collaborator.projects.length > 0 ? (
                              collaborator.projects.map((project, index) => (
                                <div 
                                  key={project.id || index}
                                  className="flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-200 rounded"
                                >
                                  <span className="truncate">{project.name}</span>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded">
                                Aucun projet assigné
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CollaboratorTable;