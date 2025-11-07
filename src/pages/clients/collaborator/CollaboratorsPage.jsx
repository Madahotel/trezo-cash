import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Plus, 
  Mail, 
  Edit, 
  Trash2, 
  Send, 
  Eye, 
  EyeOff,
  Users, 
  Clock, 
  Check, 
  X,
  Shield,
  Settings,
  Copy,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import Badge from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { toast } from '../../../hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { useSettings } from '../../../components/context/SettingsContext';
import { useTranslation } from '../../../i18n/translations';
import collaborationService from '../../../services/collaborationService';

const CollaboratorsPage = () => {
  const { projectId } = useParams();
  const { language } = useSettings();
  const { t } = useTranslation(language);
  
  const [collaborators, setCollaborators] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    accessLevel: 'read',
    sections: {
      entries: false,
      expenses: false
    },
    categories: {
      entries: [],
      expenses: []
    },
    message: ''
  });
  const [availableCategories, setAvailableCategories] = useState({
    entries: [],
    expenses: []
  });

  // Mock project data
  const project = {
    id: projectId,
    name: projectId === '1' ? 'Expansion 2025' : projectId === '2' ? 'Refonte Site Web' : 'Formation Équipe',
    type: 'business'
  };

  useEffect(() => {
    loadCollaborationData();
    loadCategories();
  }, [projectId]);

  const loadCollaborationData = () => {
    const projectCollaborators = collaborationService.getProjectCollaborators(projectId);
    const projectInvitations = collaborationService.getProjectInvitations(projectId);
    
    setCollaborators(projectCollaborators);
    setInvitations(projectInvitations);
  };

  const loadCategories = () => {
    const categories = collaborationService.getAvailableCategories();
    setAvailableCategories(categories);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSectionChange = (section, checked) => {
    setFormData({
      ...formData,
      sections: {
        ...formData.sections,
        [section]: checked
      },
      // Reset categories for this section if section is unchecked
      categories: {
        ...formData.categories,
        [section]: checked ? formData.categories[section] : []
      }
    });
  };

  const handleCategoryChange = (section, categoryId, checked) => {
    const currentCategories = formData.categories[section] || [];
    
    setFormData({
      ...formData,
      categories: {
        ...formData.categories,
        [section]: checked 
          ? [...currentCategories, categoryId]
          : currentCategories.filter(id => id !== categoryId)
      }
    });
  };

  const handleSendInvitation = async () => {
    try {
      // Validate form
      if (!formData.email || !formData.name) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive"
        });
        return;
      }

      if (!formData.sections.entries && !formData.sections.expenses) {
        toast({
          title: "Erreur", 
          description: "Veuillez sélectionner au moins une section",
          variant: "destructive"
        });
        return;
      }

      // Create invitation
      const invitation = collaborationService.createInvitation(projectId, {
        ...formData,
        invitedBy: 'Demo User' // Should come from auth context
      });

      // Generate invitation link
      const invitationLink = collaborationService.generateInvitationLink(invitation.id);

      // Send email via EmailJS
      const emailParams = {
        to_email: formData.email,
        to_name: formData.name,
        project_name: project.name,
        invitation_link: invitationLink,
        sender_name: 'Demo User',
        access_level: formData.accessLevel === 'write' ? 'Lecture-écriture' : 'Lecture seule',
        sections: Object.keys(formData.sections)
          .filter(key => formData.sections[key])
          .map(key => key === 'entries' ? 'Entrées' : 'Sorties')
          .join(', '),
        message: formData.message || 'Invitation à collaborer sur ce projet.',
        expires_date: new Date(invitation.expiresAt).toLocaleDateString('fr-FR')
      };

      // TODO: Configure EmailJS with your service ID and template
      // For now, show success message
      console.log('Email params:', emailParams);
      console.log('Invitation link:', invitationLink);

      // Reload collaboration data
      loadCollaborationData();

      // Reset form
      setFormData({
        email: '',
        name: '',
        accessLevel: 'read',
        sections: { entries: false, expenses: false },
        categories: { entries: [], expenses: [] },
        message: ''
      });

      setIsInviteDialogOpen(false);

      toast({
        title: "Invitation envoyée !",
        description: `Une invitation a été envoyée à ${formData.email}`,
      });

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de l'invitation",
        variant: "destructive"
      });
    }
  };

  const handleRemoveCollaborator = (collaborator) => {
    setSelectedCollaborator(collaborator);
    setDeleteDialogOpen(true);
  };

  const confirmRemoveCollaborator = () => {
    if (selectedCollaborator) {
      collaborationService.removeCollaborator(projectId, selectedCollaborator.id);
      loadCollaborationData();
      setDeleteDialogOpen(false);
      setSelectedCollaborator(null);
      
      toast({
        title: "Collaborateur supprimé",
        description: `${selectedCollaborator.name} n'a plus accès à ce projet`
      });
    }
  };

  const handleResendInvitation = (invitation) => {
    const updatedInvitation = collaborationService.resendInvitation(projectId, invitation.id);
    if (updatedInvitation) {
      loadCollaborationData();
      toast({
        title: "Invitation renvoyée",
        description: `Invitation renvoyée à ${invitation.email}`
      });
    }
  };

  const handleCancelInvitation = (invitation) => {
    collaborationService.cancelInvitation(projectId, invitation.id);
    loadCollaborationData();
    toast({
      title: "Invitation annulée",
      description: `Invitation pour ${invitation.email} annulée`
    });
  };

  const copyInvitationLink = (invitationId) => {
    const link = collaborationService.generateInvitationLink(invitationId);
    navigator.clipboard.writeText(link);
    toast({
      title: "Lien copié !",
      description: "Le lien d'invitation a été copié dans le presse-papiers"
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
      accepted: { label: 'Acceptée', color: 'bg-green-100 text-green-700' },
      declined: { label: 'Refusée', color: 'bg-red-100 text-red-700' },
      expired: { label: 'Expirée', color: 'bg-gray-100 text-gray-700' },
      cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-700' }
    };
    
    const statusInfo = statusMap[status] || statusMap.pending;
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const stats = collaborationService.getProjectCollaborationStats(projectId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white">
        <div>
          <h1 className="text-3xl font-bold">Collaborateurs</h1>
          <p className="text-gray-600">Gérez les accès et permissions pour "{project.name}"</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Inviter un collaborateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Inviter un collaborateur</DialogTitle>
              <DialogDescription className="text-gray-600">
                Invitez un collaborateur à travailler sur ce projet avec des permissions spécifiques.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email du collaborateur *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="collaborateur@email.com"
                    className="bg-white border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nom du collaborateur *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Jean Dupont"
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>

              {/* Access Level */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Niveau d'accès</Label>
                <Select value={formData.accessLevel} onValueChange={(value) => handleSelectChange('accessLevel', value)}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    <SelectItem value="read">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>Lecture seule</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="write">
                      <div className="flex items-center space-x-2">
                        <Edit className="w-4 h-4" />
                        <span>Lecture-écriture</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sections Access */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Sections autorisées</Label>
                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="entries"
                      checked={formData.sections.entries}
                      onCheckedChange={(checked) => handleSectionChange('entries', checked)}
                      className="border-gray-300"
                    />
                    <Label htmlFor="entries" className="cursor-pointer text-sm">Entrées (revenus)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="expenses"
                      checked={formData.sections.expenses}
                      onCheckedChange={(checked) => handleSectionChange('expenses', checked)}
                      className="border-gray-300"
                    />
                    <Label htmlFor="expenses" className="cursor-pointer text-sm">Sorties (dépenses)</Label>
                  </div>
                </div>
              </div>

              {/* Categories Access */}
              {(formData.sections.entries || formData.sections.expenses) && (
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Catégories autorisées (laisser vide pour toutes les catégories)</Label>
                  
                  <Tabs defaultValue="expenses" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                      <TabsTrigger 
                        value="expenses" 
                        disabled={!formData.sections.expenses}
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Catégories de sortie
                      </TabsTrigger>
                      <TabsTrigger 
                        value="entries" 
                        disabled={!formData.sections.entries}
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Catégories d'entrée
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="expenses" className="space-y-3">
                      {formData.sections.expenses && (
                        <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                          {availableCategories.expenses.map((category) => {
                            const IconComponent = category.icon;
                            return (
                              <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`expense_${category.id}`}
                                  checked={formData.categories.expenses.includes(category.id)}
                                  onCheckedChange={(checked) => handleCategoryChange('expenses', category.id, checked)}
                                  className="border-gray-300"
                                />
                                <Label htmlFor={`expense_${category.id}`} className="cursor-pointer flex items-center space-x-2 text-sm">
                                  {IconComponent && <IconComponent className="w-4 h-4 text-gray-600" />}
                                  <span>{category.name}</span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="entries" className="space-y-3">
                      {formData.sections.entries && (
                        <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                          {availableCategories.entries.map((category) => {
                            const IconComponent = category.icon;
                            return (
                              <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`income_${category.id}`}
                                  checked={formData.categories.entries.includes(category.id)}
                                  onCheckedChange={(checked) => handleCategoryChange('entries', category.id, checked)}
                                  className="border-gray-300"
                                />
                                <Label htmlFor={`income_${category.id}`} className="cursor-pointer flex items-center space-x-2 text-sm">
                                  {IconComponent && <IconComponent className="w-4 h-4 text-gray-600" />}
                                  <span>{category.name}</span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Personal Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium">Message personnel (optionnel)</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Un message personnalisé pour accompagner l'invitation..."
                  rows={3}
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setIsInviteDialogOpen(false)}
                  className="border-gray-300"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleSendInvitation}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer l'invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Collaborateurs actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.collaborators}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Invitations en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingInvitations}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.totalInvitations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Collaborators and Invitations */}
      <Tabs defaultValue="collaborators" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="collaborators" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Collaborateurs ({collaborators.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Invitations ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collaborators" className="space-y-4">
          {collaborators.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucun collaborateur actuel</p>
              <p className="text-sm">Invitez des collaborateurs pour commencer à partager ce projet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {collaborators.map((collaborator) => {
                const formattedPermissions = collaborationService.formatPermissions(collaborator.permissions);
                
                return (
                  <Card key={collaborator.id} className="bg-white border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{collaborator.name}</h3>
                            <p className="text-sm text-gray-500">{collaborator.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="bg-gray-100">{formattedPermissions.accessLevel}</Badge>
                              <span className="text-xs text-gray-400">
                                Rejoint le {new Date(collaborator.joinedAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier les permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleRemoveCollaborator(collaborator)}
                              className="text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer l'accès
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-600">
                        <p><strong>Sections :</strong> {formattedPermissions.sections}</p>
                        <p><strong>Catégories :</strong> {formattedPermissions.categories}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
              <Mail className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucune invitation envoyée</p>
              <p className="text-sm">Les invitations apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => {
                const formattedPermissions = collaborationService.formatPermissions(invitation.permissions);
                const isExpired = new Date() > new Date(invitation.expiresAt);
                
                return (
                  <Card key={invitation.id} className="bg-white border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{invitation.name}</h3>
                            <p className="text-sm text-gray-500">{invitation.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {getStatusBadge(invitation.status)}
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
                              <DropdownMenuItem onClick={() => copyInvitationLink(invitation.id)} className="cursor-pointer">
                                <Copy className="w-4 h-4 mr-2" />
                                Copier le lien
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResendInvitation(invitation)} className="cursor-pointer">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Renvoyer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleCancelInvitation(invitation)}
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
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Remove Collaborator Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'accès</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer l'accès de ce collaborateur au projet ?
              {selectedCollaborator && (
                <div className="mt-2 font-medium text-gray-900">
                  {selectedCollaborator.name} ({selectedCollaborator.email})
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveCollaborator} className="bg-red-600 hover:bg-red-700">
              Supprimer l'accès
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CollaboratorsPage;