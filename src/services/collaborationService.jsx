// services/collaborationService.js
import { apiService } from '../utils/ApiService';

class CollaborationService {

    async getProjectInvitations(projectId) {
    try {
      // Si votre API a un endpoint pour les invitations
      // const response = await apiService.get(`/projects/${projectId}/invitations`);
      // return response;
      
      // Pour l'instant, retourner un tableau vide car cette fonctionnalité
      // n'est pas encore implémentée dans votre API backend
      console.warn('La fonction getProjectInvitations n\'est pas encore implémentée avec l\'API');
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des invitations:', error);
      return [];
    }
  }

  // Autre méthode liée aux invitations si nécessaire
  async getPendingInvitations(projectId) {
    return this.getProjectInvitations(projectId);
  }
  // Récupérer tous les collaborateurs depuis l'API
  async getCollaborators() {
    try {
      const response = await apiService.get('/users/collaborators');
      return response;
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

  // Créer une invitation (envoyer vers l'API)
  async createInvitation(invitationData) {
    try {
      const response = await apiService.post('/users/collaborators', invitationData);
      return response;
    } catch (error) {
      console.error('Erreur lors de la création de l\'invitation:', error);
      throw error;
    }
  }

  // Supprimer un collaborateur
  async removeCollaborator(collaboratorId) {
    try {
      const response = await apiService.delete(`/users/collaborators/${collaboratorId}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la suppression du collaborateur:', error);
      throw error;
    }
  }

  // Mettre à jour les permissions d'un collaborateur
  async updateCollaboratorPermissions(collaboratorId, permissionData) {
    try {
      const response = await apiService.put(`/users/collaborators/${collaboratorId}`, permissionData);
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des permissions:', error);
      throw error;
    }
  }

  // Récupérer les permissions disponibles
  async getAvailablePermissions() {
    try {
      const [permissions, roles] = await Promise.all([
        apiService.get('/collaborator-permissions'),
        apiService.get('/collaborator-roles')
      ]);
      return { permissions, roles };
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions:', error);
      throw error;
    }
  }

  // Formater les permissions pour l'affichage
  formatPermissions(permissions) {
    if (!permissions) {
      return {
        accessLevel: 'Non défini',
        sections: 'Aucune section',
        categories: 'Aucune catégorie'
      };
    }

    // Si les permissions viennent de l'ancien format (localStorage)
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
        sections: 'Toutes les sections', // À adapter selon votre logique métier
        categories: 'Toutes les catégories' // À adapter selon votre logique métier
      };
    }

    // Fallback
    return {
      accessLevel: 'Non défini',
      sections: 'Aucune information',
      categories: 'Aucune information'
    };
  }

  // Vérifier si un utilisateur a une permission spécifique
  async hasPermission(projectId, userEmail, action, section = null, category = null) {
    try {
      // Cette méthode peut être implémentée côté backend
      // Pour l'instant, retourne true par défaut
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  // Obtenir les statistiques de collaboration pour un projet
  async getProjectCollaborationStats(projectId) {
    try {
      const collaborators = await this.getProjectCollaborators(projectId);
      return {
        collaborators: collaborators.length,
        pendingInvitations: 0, // À implémenter si vous avez des invitations en attente
        totalInvitations: collaborators.length
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { collaborators: 0, pendingInvitations: 0, totalInvitations: 0 };
    }
  }

  // Générer un lien d'invitation (pour compatibilité avec l'ancien code)
  generateInvitationLink(invitationId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invitation/${invitationId}`;
  }

  // Nettoyer les données (pour compatibilité)
  cleanExpiredInvitations() {
    // Cette méthode n'est plus nécessaire avec l'API
    console.log('Méthode cleanExpiredInvitations obsolète avec l\'API backend');
    return false;
  }

  // Exporter les collaborations (pour compatibilité)
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

  // Méthodes utilitaires pour le mapping des données
  mapAccessLevelToIds(accessLevel) {
    const permissionMap = {
      'read': { permissionId: 1, roleId: 1 },
      'write': { permissionId: 2, roleId: 2 }
    };
    return permissionMap[accessLevel] || { permissionId: 1, roleId: 1 };
  }

  // Préparer les données pour l'API à partir du formulaire
  prepareInvitationData(formData, project) {
    return {
      name: formData.name.trim(),
      firstname: formData.firstname.trim(),
      email: formData.email.toLowerCase().trim(),
      phone_number: formData.phone_number.trim(),
      collaborator_permission_id: parseInt(formData.collaborator_permission_id),
      collaborator_role_id: parseInt(formData.collaborator_role_id),
      project_id: [parseInt(project.id)],
      password: 'defaultPassword123!' // Mot de passe par défaut
    };
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

  // Obtenir les collaborateurs formatés pour l'affichage
  async getFormattedCollaborators(projectId = null) {
    try {
      const collaborators = projectId 
        ? await this.getProjectCollaborators(projectId)
        : await this.getCollaborators();

      return collaborators.map(collaborator => ({
        id: collaborator.id,
        name: collaborator.name,
        email: collaborator.email,
        phone_number: collaborator.phone_number,
        joinedAt: collaborator.joinedAt,
        permissions: this.formatPermissions(collaborator.permissions),
        projects: collaborator.projects || []
      }));
    } catch (error) {
      console.error('Erreur lors du formatage des collaborateurs:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
export default collaborationService;