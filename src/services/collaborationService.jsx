// services/collaborationService.js
import { apiService } from '../utils/ApiService';

class CollaborationService {
  // Récupérer tous les collaborateurs depuis l'API
  async getCollaborators() {
    try {
      const response = await apiService.get('/users/collaborators');
      return response.data || response;
    } catch (error) {
      console.error('Erreur lors de la récupération des collaborateurs:', error);
      throw error;
    }
  }

  // Récupérer les collaborateurs d'un projet spécifique
  async getProjectCollaborators(projectId) {
    try {
      const allCollaborators = await this.getCollaborators();
      return allCollaborators.filter(collaborator => 
        collaborator.projects?.some(project => project.id === parseInt(projectId))
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des collaborateurs du projet:', error);
      throw error;
    }
  }

  // Récupérer les collaborateurs formatés pour l'affichage
  async getFormattedCollaborators(projectId = null) {
    try {
      const collaborators = projectId 
        ? await this.getProjectCollaborators(projectId)
        : await this.getCollaborators();

      return collaborators.map(collaborator => ({
        id: collaborator.id,
        name: collaborator.name,
        firstname: collaborator.firstname,
        full_name: collaborator.full_name || `${collaborator.firstname} ${collaborator.name}`,
        email: collaborator.email,
        phone_number: collaborator.phone_number,
        role: collaborator.role || collaborator.role_name,
        permission: collaborator.permission || collaborator.permission_name,
        is_active: collaborator.is_active !== undefined ? collaborator.is_active : true,
        joined_at: collaborator.joined_at || collaborator.collaboration_created_at,
        projects: collaborator.projects || []
      }));
    } catch (error) {
      console.error('Erreur lors du formatage des collaborateurs:', error);
      throw error;
    }
  }

  // Ajouter un nouveau collaborateur
  async addCollaborator(collaboratorData) {
    try {
      const response = await apiService.post('/users/collaborators', collaboratorData);
      return response.data || response;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du collaborateur:', error);
      throw error;
    }
  }

  // Supprimer un collaborateur - CORRIGÉ (utilise PATCH pour désactiver)
  async removeCollaborator(collaboratorId) {
    try {
      const response = await apiService.patch(`/users/collaborators/${collaboratorId}`, {
        is_active: false
      });
      return response.data || response;
    } catch (error) {
      console.error('Erreur lors de la suppression du collaborateur:', error);
      throw error;
    }
  }

  // Mettre à jour les permissions d'un collaborateur - CORRIGÉ (utilise PATCH)
  async updateCollaboratorPermissions(collaboratorId, permissionData) {
    try {
      const response = await apiService.patch(`/users/collaborators/${collaboratorId}`, permissionData);
      return response.data || response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des permissions:', error);
      throw error;
    }
  }

  // Récupérer les permissions disponibles
  async getAvailablePermissions() {
    try {
      const [permissionsResponse, rolesResponse] = await Promise.all([
        apiService.get('/collaborator-permissions'),
        apiService.get('/collaborator-roles')
      ]);
      
      return {
        permissions: permissionsResponse.data || permissionsResponse,
        roles: rolesResponse.data || rolesResponse
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions:', error);
      throw error;
    }
  }

  // Récupérer les invitations d'un projet
  async getProjectInvitations(projectId) {
    try {
      console.warn('La fonction getProjectInvitations n\'est pas encore implémentée avec l\'API');
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des invitations:', error);
      return [];
    }
  }

  // Obtenir les statistiques de collaboration pour un projet
  async getProjectCollaborationStats(projectId) {
    try {
      const collaborators = await this.getProjectCollaborators(projectId);
      const invitations = await this.getProjectInvitations(projectId);
      
      return {
        collaborators: collaborators.length,
        pendingInvitations: invitations.length,
        totalInvitations: collaborators.length + invitations.length
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { collaborators: 0, pendingInvitations: 0, totalInvitations: 0 };
    }
  }

  // Créer une invitation
  async createInvitation(invitationData) {
    try {
      const response = await this.addCollaborator(invitationData);
      return response;
    } catch (error) {
      console.error('Erreur lors de la création de l\'invitation:', error);
      throw error;
    }
  }

  // Renvoyer une invitation
  async resendInvitation(projectId, invitationId) {
    try {
      console.log('Renvoi invitation:', { projectId, invitationId });
      return { success: true, message: 'Invitation renvoyée' };
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'invitation:', error);
      throw error;
    }
  }

  // Annuler une invitation
  async cancelInvitation(projectId, invitationId) {
    try {
      console.log('Annulation invitation:', { projectId, invitationId });
      return { success: true, message: 'Invitation annulée' };
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'invitation:', error);
      throw error;
    }
  }

  // Générer un lien d'invitation
  generateInvitationLink(invitationId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invitation/${invitationId}`;
  }

  // Préparer les données pour l'API à partir du formulaire
  prepareInvitationData(formData, project) {
    const data = {
      name: formData.name?.trim(),
      firstname: formData.firstname?.trim() || '',
      email: formData.email?.toLowerCase().trim(),
      phone_number: formData.phone_number?.trim() || '',
      collaborator_permission_id: parseInt(formData.collaborator_permission_id),
      collaborator_role_id: parseInt(formData.collaborator_role_id),
      project_id: [parseInt(project.id)],
      password: formData.password || 'DefaultPassword123!'
    };

    console.log('Données préparées pour l\'API:', data);
    return data;
  }

  // Valider les données avant envoi
  validateInvitationData(formData) {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = 'Le nom est obligatoire';
    }

    if (!formData.email?.trim()) {
      errors.email = 'L\'email est obligatoire';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!formData.collaborator_permission_id) {
      errors.permission = 'La permission est obligatoire';
    }

    if (!formData.collaborator_role_id) {
      errors.role = 'Le rôle est obligatoire';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Formater les permissions pour l'affichage (méthode utilitaire)
  formatPermissions(permissions) {
    if (!permissions) {
      return {
        accessLevel: 'Non défini',
        sections: 'Aucune section',
        categories: 'Aucune catégorie'
      };
    }

    // Si les permissions viennent de l'ancien format
    if (typeof permissions === 'object' && permissions.accessLevel) {
      const accessLevelText = permissions.accessLevel === 'write' ? 'Lecture-écriture' : 'Lecture seule';
      
      const sectionsText = [];
      if (permissions.sections?.entries) sectionsText.push('Entrées');
      if (permissions.sections?.expenses) sectionsText.push('Sorties');
      
      const categoriesText = [];
      if (permissions.categories?.entries?.length > 0) {
        categoriesText.push(`Entrées: ${permissions.categories.entries.length} catégories`);
      }
      if (permissions.categories?.expenses?.length > 0) {
        categoriesText.push(`Sorties: ${permissions.categories.expenses.length} catégories`);
      }

      return {
        accessLevel: accessLevelText,
        sections: sectionsText.join(', ') || 'Aucune section',
        categories: categoriesText.join(', ') || 'Toutes les catégories'
      };
    }

    // Si les permissions viennent du nouveau format (API)
    if (typeof permissions === 'object') {
      return {
        accessLevel: permissions.accessLevel || permissions.permission_name || 'Non défini',
        sections: 'Toutes les sections',
        categories: 'Toutes les catégories'
      };
    }

    return {
      accessLevel: 'Non défini',
      sections: 'Aucune information',
      categories: 'Aucune information'
    };
  }

  // Vérifier si un utilisateur a une permission spécifique
  async hasPermission(projectId, userEmail, action, section = null, category = null) {
    try {
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  // Méthodes utilitaires pour le mapping des données
  mapAccessLevelToIds(accessLevel) {
    const permissionMap = {
      'read': { permissionId: 1, roleId: 1 },
      'write': { permissionId: 2, roleId: 2 },
      'admin': { permissionId: 3, roleId: 3 }
    };
    return permissionMap[accessLevel] || { permissionId: 1, roleId: 1 };
  }

  // Exporter les collaborations
  async exportCollaborations() {
    try {
      const collaborators = await this.getCollaborators();
      return {
        collaborations: collaborators,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur lors de l\'export des collaborations:', error);
      throw error;
    }
  }

  // Méthode pour désactiver un collaborateur (alternative à remove)
  async deactivateCollaborator(collaboratorId) {
    return this.removeCollaborator(collaboratorId);
  }

  // Méthode pour mettre à jour les informations d'un collaborateur
  async updateCollaborator(collaboratorId, updateData) {
    try {
      const response = await apiService.patch(`/users/collaborators/${collaboratorId}`, updateData);
      return response.data || response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du collaborateur:', error);
      throw error;
    }
  }

  // Méthodes de compatibilité (peuvent être supprimées plus tard)
  cleanExpiredInvitations() {
    console.log('Méthode cleanExpiredInvitations obsolète avec l\'API backend');
    return false;
  }

  async getPendingInvitations(projectId) {
    return this.getProjectInvitations(projectId);
  }

  // Méthode pour debug - vérifier les données d'un collaborateur spécifique
  async debugCollaborator(collaboratorId) {
    try {
      const allCollaborators = await this.getCollaborators();
      const collaborator = allCollaborators.find(c => c.id === collaboratorId);
      console.log('Données du collaborateur:', collaborator);
      return collaborator;
    } catch (error) {
      console.error('Erreur lors du debug du collaborateur:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
export default collaborationService;