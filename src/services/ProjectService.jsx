import { apiService } from '../utils/ApiService';

class ProjectService {
  endpoints = {
    projects: '/projects',
    templates: '/templates',
  };

  async createProject(projectData) {
    return await apiService.post(this.endpoints.projects, projectData);
  }

  async updateProject(projectId, updates) {
    return await apiService.put(`${this.endpoints.projects}/${projectId}`, updates);
  }

  async deleteProject(projectId) {
    return await apiService.delete(`${this.endpoints.projects}/${projectId}`);
  }

  async updateOnboardingStep(projectId, step) {
    return await apiService.put(
      `${this.endpoints.projects}/${projectId}/onboarding-step`,
      { step }
    );
  }

  async getAllTemplates() {
    const response = await apiService.get(this.endpoints.templates);
    
    if (response.status === 200 && response.templates) {
      const { templates } = response;
      
      // Fusionner tous les types de templates
      const allTemplates = [
        ...(templates.officials?.template_official_items?.data || []),
        ...(templates.personals?.template_personal_items?.data || []),
        ...(templates.communities?.template_community_items?.data || []),
      ];

      // Éliminer les doublons
      const uniqueTemplates = allTemplates.reduce((acc, template) => {
        if (!acc.find(t => t.id === template.id)) {
          acc.push(template);
        }
        return acc;
      }, []);

      return uniqueTemplates;
    }
    
    return [];
  }

  async findTemplateById(templateId) {
    const templates = await this.getAllTemplates();
    return templates.find(t => t.id.toString() === templateId.toString());
  }

  async findTemplateByName(templateName) {
    const templates = await this.getAllTemplates();
    return templates.find(t => 
      t.name?.toLowerCase() === templateName.toLowerCase()
    );
  }
}

export const projectService = new ProjectService();