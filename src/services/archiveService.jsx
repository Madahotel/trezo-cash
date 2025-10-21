// Archive service for managing project archiving and restoration
class ArchiveService {
  constructor() {
    this.archives = this.loadArchives();
  }

  // Archive a project
  archiveProject(project, reason = '') {
    const archivedProject = {
      ...project,
      archived: true,
      archivedAt: new Date().toISOString(),
      archivedReason: reason,
      originalStatus: project.status
    };

    // Add to archives if not already there
    const existingIndex = this.archives.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      this.archives[existingIndex] = archivedProject;
    } else {
      this.archives.push(archivedProject);
    }

    this.saveArchives();
    return archivedProject;
  }

  // Restore a project from archives
  restoreProject(projectId) {
    const archiveIndex = this.archives.findIndex(p => p.id === projectId);
    if (archiveIndex === -1) return null;

    const project = this.archives[archiveIndex];
    const restoredProject = {
      ...project,
      archived: false,
      archivedAt: null,
      archivedReason: null,
      restoredAt: new Date().toISOString(),
      status: project.originalStatus || 'active'
    };

    // Remove from archives
    this.archives.splice(archiveIndex, 1);
    this.saveArchives();

    return restoredProject;
  }

  // Get all archived projects
  getArchivedProjects() {
    return this.archives.filter(project => project.archived);
  }

  // Get archived projects by type
  getArchivedProjectsByType(type) {
    return this.archives.filter(project => project.archived && project.type === type);
  }

  // Get archived project by ID
  getArchivedProject(projectId) {
    return this.archives.find(p => p.id === projectId && p.archived);
  }

  // Permanently delete archived project
  permanentlyDeleteProject(projectId) {
    const archiveIndex = this.archives.findIndex(p => p.id === projectId);
    if (archiveIndex === -1) return false;

    this.archives.splice(archiveIndex, 1);
    this.saveArchives();
    return true;
  }

  // Get archive statistics
  getArchiveStats() {
    const totalArchived = this.archives.length;
    const archivedByType = this.archives.reduce((acc, project) => {
      acc[project.type] = (acc[project.type] || 0) + 1;
      return acc;
    }, {});

    const archivedThisMonth = this.archives.filter(project => {
      const archivedDate = new Date(project.archivedAt);
      const now = new Date();
      return archivedDate.getFullYear() === now.getFullYear() &&
             archivedDate.getMonth() === now.getMonth();
    }).length;

    const oldestArchive = this.archives.reduce((oldest, project) => {
      const projectDate = new Date(project.archivedAt);
      return projectDate < oldest ? projectDate : oldest;
    }, new Date());

    return {
      total: totalArchived,
      byType: archivedByType,
      thisMonth: archivedThisMonth,
      oldestDate: totalArchived > 0 ? oldestArchive : null
    };
  }

  // Search archived projects
  searchArchivedProjects(query) {
    const lowercaseQuery = query.toLowerCase();
    return this.archives.filter(project =>
      project.name.toLowerCase().includes(lowercaseQuery) ||
      project.description.toLowerCase().includes(lowercaseQuery) ||
      project.type.toLowerCase().includes(lowercaseQuery) ||
      (project.archivedReason && project.archivedReason.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Get projects archived in date range
  getArchivedProjectsByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.archives.filter(project => {
      const archivedDate = new Date(project.archivedAt);
      return archivedDate >= start && archivedDate <= end;
    });
  }

  // Bulk operations
  bulkRestoreProjects(projectIds) {
    const restoredProjects = [];
    const failedProjectIds = [];

    projectIds.forEach(projectId => {
      const restored = this.restoreProject(projectId);
      if (restored) {
        restoredProjects.push(restored);
      } else {
        failedProjectIds.push(projectId);
      }
    });

    return {
      restored: restoredProjects,
      failed: failedProjectIds,
      success: failedProjectIds.length === 0
    };
  }

  bulkDeleteProjects(projectIds) {
    const deletedProjects = [];
    const failedProjectIds = [];

    projectIds.forEach(projectId => {
      const deleted = this.permanentlyDeleteProject(projectId);
      if (deleted) {
        deletedProjects.push(projectId);
      } else {
        failedProjectIds.push(projectId);
      }
    });

    return {
      deleted: deletedProjects,
      failed: failedProjectIds,
      success: failedProjectIds.length === 0
    };
  }

  // Export archives for backup
  exportArchives() {
    return {
      archives: this.archives,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import archives from backup
  importArchives(data) {
    try {
      if (data.archives && Array.isArray(data.archives)) {
        // Merge with existing archives (avoid duplicates)
        const existingIds = this.archives.map(p => p.id);
        const newArchives = data.archives.filter(p => !existingIds.includes(p.id));
        
        this.archives = [...this.archives, ...newArchives];
        this.saveArchives();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing archives:', error);
      return false;
    }
  }

  // Clean old archives (optional maintenance)
  cleanOldArchives(daysOld = 365) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const originalLength = this.archives.length;

    this.archives = this.archives.filter(project => 
      new Date(project.archivedAt) > cutoffDate
    );

    if (this.archives.length !== originalLength) {
      this.saveArchives();
      return originalLength - this.archives.length;
    }

    return 0;
  }

  // Save archives to localStorage
  saveArchives() {
    try {
      localStorage.setItem('archivedProjects', JSON.stringify(this.archives));
    } catch (error) {
      console.error('Error saving archives:', error);
    }
  }

  // Load archives from localStorage
  loadArchives() {
    try {
      const saved = localStorage.getItem('archivedProjects');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading archives:', error);
      return [];
    }
  }

  // Check if a project is archived
  isProjectArchived(projectId) {
    return this.archives.some(p => p.id === projectId && p.archived);
  }

  // Get archive info for a project
  getProjectArchiveInfo(projectId) {
    const archived = this.archives.find(p => p.id === projectId && p.archived);
    if (!archived) return null;

    return {
      archivedAt: archived.archivedAt,
      archivedReason: archived.archivedReason,
      originalStatus: archived.originalStatus,
      daysInArchive: Math.floor(
        (new Date() - new Date(archived.archivedAt)) / (24 * 60 * 60 * 1000)
      )
    };
  }
}

// Export singleton instance
export const archiveService = new ArchiveService();
export default archiveService;