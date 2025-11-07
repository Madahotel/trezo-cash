import categoryService from './categoryService';

// Collaboration service for project sharing and permissions
class CollaborationService {
  constructor() {
    this.collaborations = this.loadCollaborations();
  }

  // Generate a unique invitation token
  generateInvitationToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }

  // Create invitation
  createInvitation(projectId, invitation) {
    const invitationData = {
      id: this.generateInvitationToken(),
      projectId,
      email: invitation.email,
      name: invitation.name,
      permissions: {
        accessLevel: invitation.accessLevel, // 'read' or 'write'
        sections: {
          entries: invitation.sections.entries || false,
          expenses: invitation.sections.expenses || false
        },
        categories: {
          entries: invitation.categories.entries || [],
          expenses: invitation.categories.expenses || []
        }
      },
      status: 'pending', // 'pending', 'accepted', 'declined', 'expired'
      invitedBy: invitation.invitedBy,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      acceptedAt: null
    };

    // Store invitation
    if (!this.collaborations[projectId]) {
      this.collaborations[projectId] = {
        invitations: [],
        collaborators: []
      };
    }

    this.collaborations[projectId].invitations.push(invitationData);
    this.saveCollaborations();

    return invitationData;
  }

  // Get invitations for a project
  getProjectInvitations(projectId) {
    const project = this.collaborations[projectId];
    return project ? project.invitations : [];
  }

  // Get collaborators for a project
  getProjectCollaborators(projectId) {
    const project = this.collaborations[projectId];
    return project ? project.collaborators : [];
  }

  // Accept invitation
  acceptInvitation(invitationId, userInfo) {
    for (const projectId in this.collaborations) {
      const invitation = this.collaborations[projectId].invitations.find(
        inv => inv.id === invitationId
      );

      if (invitation) {
        // Check if invitation is still valid
        if (invitation.status !== 'pending') {
          throw new Error('Invitation is no longer valid');
        }

        if (new Date() > new Date(invitation.expiresAt)) {
          invitation.status = 'expired';
          this.saveCollaborations();
          throw new Error('Invitation has expired');
        }

        // Update invitation status
        invitation.status = 'accepted';
        invitation.acceptedAt = new Date().toISOString();

        // Add collaborator to project
        const collaborator = {
          id: this.generateInvitationToken(),
          email: invitation.email,
          name: userInfo.name || invitation.name,
          permissions: invitation.permissions,
          joinedAt: new Date().toISOString(),
          invitationId
        };

        this.collaborations[projectId].collaborators.push(collaborator);
        this.saveCollaborations();

        return { collaborator, projectId };
      }
    }

    throw new Error('Invitation not found');
  }

  // Update collaborator permissions
  updateCollaboratorPermissions(projectId, collaboratorId, newPermissions) {
    const project = this.collaborations[projectId];
    if (!project) return false;

    const collaborator = project.collaborators.find(c => c.id === collaboratorId);
    if (!collaborator) return false;

    collaborator.permissions = { ...collaborator.permissions, ...newPermissions };
    collaborator.updatedAt = new Date().toISOString();

    this.saveCollaborations();
    return true;
  }

  // Remove collaborator from project
  removeCollaborator(projectId, collaboratorId) {
    const project = this.collaborations[projectId];
    if (!project) return false;

    const index = project.collaborators.findIndex(c => c.id === collaboratorId);
    if (index === -1) return false;

    project.collaborators.splice(index, 1);
    this.saveCollaborations();
    return true;
  }

  // Cancel invitation
  cancelInvitation(projectId, invitationId) {
    const project = this.collaborations[projectId];
    if (!project) return false;

    const invitation = project.invitations.find(inv => inv.id === invitationId);
    if (!invitation) return false;

    invitation.status = 'cancelled';
    invitation.cancelledAt = new Date().toISOString();

    this.saveCollaborations();
    return true;
  }

  // Resend invitation
  resendInvitation(projectId, invitationId) {
    const project = this.collaborations[projectId];
    if (!project) return null;

    const invitation = project.invitations.find(inv => inv.id === invitationId);
    if (!invitation || invitation.status !== 'pending') return null;

    // Extend expiration
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    invitation.resentAt = new Date().toISOString();

    this.saveCollaborations();
    return invitation;
  }

  // Check if user has permission for specific action
  hasPermission(projectId, userEmail, action, section = null, category = null) {
    const project = this.collaborations[projectId];
    if (!project) return false;

    const collaborator = project.collaborators.find(c => c.email === userEmail);
    if (!collaborator) return false;

    const permissions = collaborator.permissions;

    // Check access level
    if (action === 'write' && permissions.accessLevel !== 'write') {
      return false;
    }

    // Check section permission
    if (section) {
      if (!permissions.sections[section]) {
        return false;
      }

      // Check category permission if specified
      if (category && permissions.categories[section]) {
        const allowedCategories = permissions.categories[section];
        if (allowedCategories.length > 0 && !allowedCategories.includes(category)) {
          return false;
        }
      }
    }

    return true;
  }

  // Get available categories for permission assignment
  getAvailableCategories() {
    return {
      entries: categoryService.getAllCategories('income').map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color
      })),
      expenses: categoryService.getAllCategories('expense').map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color
      }))
    };
  }

  // Generate invitation link
  generateInvitationLink(invitationId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invitation/${invitationId}`;
  }

  // Get invitation by ID (for accepting invitations)
  getInvitationById(invitationId) {
    for (const projectId in this.collaborations) {
      const invitation = this.collaborations[projectId].invitations.find(
        inv => inv.id === invitationId
      );
      if (invitation) {
        return { ...invitation, projectId };
      }
    }
    return null;
  }

  // Get summary statistics for a project
  getProjectCollaborationStats(projectId) {
    const project = this.collaborations[projectId];
    if (!project) {
      return { collaborators: 0, pendingInvitations: 0, totalInvitations: 0 };
    }

    const pendingInvitations = project.invitations.filter(
      inv => inv.status === 'pending'
    ).length;

    return {
      collaborators: project.collaborators.length,
      pendingInvitations,
      totalInvitations: project.invitations.length
    };
  }

  // Get formatted permissions for display
  formatPermissions(permissions) {
    const accessLevelText = permissions.accessLevel === 'write' ? 'Lecture-écriture' : 'Lecture seule';
    
    const sectionsText = [];
    if (permissions.sections.entries) sectionsText.push('Entrées');
    if (permissions.sections.expenses) sectionsText.push('Sorties');
    
    const categoriesText = [];
    if (permissions.categories.entries?.length > 0) {
      categoriesText.push(`Entrées: ${permissions.categories.entries.length} catégories`);
    }
    if (permissions.categories.expenses?.length > 0) {
      categoriesText.push(`Sorties: ${permissions.categories.expenses.length} catégories`);
    }

    return {
      accessLevel: accessLevelText,
      sections: sectionsText.join(', ') || 'Aucune section',
      categories: categoriesText.join(', ') || 'Toutes les catégories'
    };
  }

  // Save collaborations to localStorage
  saveCollaborations() {
    try {
      localStorage.setItem('collaborations', JSON.stringify(this.collaborations));
    } catch (error) {
      console.error('Error saving collaborations:', error);
    }
  }

  // Load collaborations from localStorage
  loadCollaborations() {
    try {
      const saved = localStorage.getItem('collaborations');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading collaborations:', error);
      return {};
    }
  }

  // Clean expired invitations
  cleanExpiredInvitations() {
    const now = new Date();
    let cleaned = false;

    for (const projectId in this.collaborations) {
      const project = this.collaborations[projectId];
      const originalLength = project.invitations.length;
      
      project.invitations = project.invitations.filter(invitation => {
        if (invitation.status === 'pending' && new Date(invitation.expiresAt) < now) {
          invitation.status = 'expired';
          return true;
        }
        return true;
      });

      if (project.invitations.length !== originalLength) {
        cleaned = true;
      }
    }

    if (cleaned) {
      this.saveCollaborations();
    }

    return cleaned;
  }

  // Export collaborations for backup
  exportCollaborations() {
    return {
      collaborations: this.collaborations,
      exportDate: new Date().toISOString()
    };
  }

  // Import collaborations from backup
  importCollaborations(data) {
    try {
      if (data.collaborations) {
        this.collaborations = data.collaborations;
        this.saveCollaborations();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing collaborations:', error);
      return false;
    }
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
export default collaborationService;