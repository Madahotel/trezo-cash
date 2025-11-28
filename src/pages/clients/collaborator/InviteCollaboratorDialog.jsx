import React, { useState, useEffect } from 'react';
import { Send, Eye, Edit } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from '../../../hooks/use-toast';
import { apiService } from '../../../utils/ApiService';

const InviteCollaboratorDialog = ({ open, onOpenChange, project, onInviteSent }) => {
  const [formData, setFormData] = useState({
    name: '',
    firstname: '',
    email: '',
    phone_number: '',
    collaborator_permission_id: '',
    collaborator_role_id: '',
    project_id: [],
    password: 'defaultPassword123!'
  });
  
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // Charger les permissions et rôles disponibles
  useEffect(() => {
    if (open) {
      loadPermissionsAndRoles();
      setValidationErrors({}); // Réinitialiser les erreurs à l'ouverture
    }
  }, [open]);
const loadPermissionsAndRoles = async () => {
  try {
    const [permissionsData, rolesData] = await Promise.all([
      apiService.get('/users/collaborator-permission'),
      apiService.get('/users/collaborator-roles')
    ]);

    console.log("permissionsData =", permissionsData);
    console.log("rolesData =", rolesData);

    setPermissions(
      Array.isArray(permissionsData)
        ? permissionsData
        : permissionsData.data ?? []
    );

    setRoles(
      Array.isArray(rolesData)
        ? rolesData
        : rolesData.data ?? []
    );

  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    toast({
      title: "Erreur",
      description: "Impossible de charger les permissions et rôles",
      variant: "destructive"
    });
  }
};


  const validateForm = () => {
    const errors = {};

    // Validation de l'email
    if (!formData.email) {
      errors.email = 'L\'email est obligatoire';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    // Validation des autres champs obligatoires
    if (!formData.name) {
      errors.name = 'Le nom est obligatoire';
    }
    if (!formData.collaborator_permission_id) {
      errors.permission = 'La permission est obligatoire';
    }
    if (!formData.collaborator_role_id) {
      errors.role = 'Le rôle est obligatoire';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Effacer l'erreur de validation quand l'utilisateur tape
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Effacer l'erreur de validation quand l'utilisateur sélectionne
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSendInvitation = async () => {
    try {
      // Validation côté client d'abord
      if (!validateForm()) {
        toast({
          title: "Erreur de validation",
          description: "Veuillez corriger les erreurs dans le formulaire",
          variant: "destructive"
        });
        return;
      }

      // Vérifier que le projet est valide
      if (!project?.id) {
        toast({
          title: "Erreur",
          description: "Aucun projet sélectionné",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);

      // Préparer les données pour l'API - format correct
      const apiData = {
        name: formData.name.trim(),
        firstname: formData.firstname.trim(),
        email: formData.email.toLowerCase().trim(), // Normaliser l'email
        phone_number: formData.phone_number.trim(),
        collaborator_permission_id: parseInt(formData.collaborator_permission_id),
        collaborator_role_id: parseInt(formData.collaborator_role_id),
        project_id: [parseInt(project.id)],
        password: formData.password
      };

      console.log('Données envoyées à l\'API:', apiData);

      // Appel API avec gestion d'erreur améliorée
      const result = await apiService.post('/users/collaborators', apiData);

      // Succès
      toast({
        title: "Succès",
        description: result.message || "Collaborateur invité avec succès",
      });

      // Réinitialiser le formulaire
      resetForm();
      
      // Appeler le callback de succès
      onInviteSent();

    } catch (error) {
      console.error('Erreur détaillée:', error);
      
      // Gestion des erreurs de validation du serveur
      if (error.response?.status === 422) {
        const serverErrors = error.response.data.errors || {};
        
        // Convertir les erreurs du serveur en format utilisable
        const formattedErrors = {};
        Object.keys(serverErrors).forEach(key => {
          formattedErrors[key] = serverErrors[key].join(', ');
        });
        
        setValidationErrors(formattedErrors);
        
        toast({
          title: "Erreur de validation",
          description: "Veuillez vérifier les informations saisies",
          variant: "destructive"
        });
      } else {
        // Autres erreurs
        let errorMessage = "Erreur lors de l'envoi de l'invitation";
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      firstname: '',
      email: '',
      phone_number: '',
      collaborator_permission_id: '',
      collaborator_role_id: '',
      project_id: [],
      password: 'defaultPassword123!'
    });
    setValidationErrors({});
  };

  const handleDialogChange = (isOpen) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Inviter un collaborateur</DialogTitle>
          <DialogDescription className="text-gray-600">
            Invitez un collaborateur à travailler sur le projet "{project?.name}" avec des permissions spécifiques.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nom du collaborateur *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Dupont"
                className={`bg-white border-gray-300 ${
                  validationErrors.name ? 'border-red-500' : ''
                }`}
                disabled={loading}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500">{validationErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstname" className="text-sm font-medium">
                Prénom du collaborateur
              </Label>
              <Input
                id="firstname"
                name="firstname"
                value={formData.firstname}
                onChange={handleInputChange}
                placeholder="Jean"
                className="bg-white border-gray-300"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email du collaborateur *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="collaborateur@email.com"
                className={`bg-white border-gray-300 ${
                  validationErrors.email ? 'border-red-500' : ''
                }`}
                disabled={loading}
              />
              {validationErrors.email && (
                <p className="text-xs text-red-500">{validationErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-sm font-medium">
                Téléphone
              </Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="+33 1 23 45 67 89"
                className="bg-white border-gray-300"
                disabled={loading}
              />
            </div>
          </div>

          {/* Sélection manuelle des permissions */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Permissions détaillées</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collaborator_permission_id" className="text-sm font-medium">
                  Permission *
                </Label>
                <Select 
                  value={formData.collaborator_permission_id} 
                  onValueChange={(value) => handleSelectChange('collaborator_permission_id', value)}
                  disabled={loading}
                >
                  <SelectTrigger className={`bg-white border-gray-300 ${
                    validationErrors.permission ? 'border-red-500' : ''
                  }`}>
                    <SelectValue placeholder="Sélectionnez une permission" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    {permissions.map((permission) => (
                      <SelectItem key={permission.id} value={permission.id.toString()}>
                        {permission.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.permission && (
                  <p className="text-xs text-red-500">{validationErrors.permission}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="collaborator_role_id" className="text-sm font-medium">
                  Rôle *
                </Label>
                <Select 
                  value={formData.collaborator_role_id} 
                  onValueChange={(value) => handleSelectChange('collaborator_role_id', value)}
                  disabled={loading}
                >
                  <SelectTrigger className={`bg-white border-gray-300 ${
                    validationErrors.role ? 'border-red-500' : ''
                  }`}>
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.role && (
                  <p className="text-xs text-red-500">{validationErrors.role}</p>
                )}
              </div>
            </div>
          </div>

          {/* Message personnel */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Message personnel (optionnel)
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder={`Un message personnalisé pour accompagner l'invitation au projet "${project?.name}"...`}
              rows={3}
              className="bg-white border-gray-300"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => handleDialogChange(false)}
              className="border-gray-300"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSendInvitation}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer l'invitation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCollaboratorDialog;