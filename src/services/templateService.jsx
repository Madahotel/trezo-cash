import categoryService from './categoryService';

// Template service for project templates with predefined category structures
class TemplateService {
  constructor() {
    this.privateTemplates = this.loadPrivateTemplates(); // Previously customTemplates
    this.communityTemplates = this.initializeCommunityTemplates(); // New category
    this.officialTemplates = this.initializeOfficialTemplates();
  }

  // Initialize official templates
  initializeOfficialTemplates() {
    return {
      vierge: {
        id: 'vierge',
        name: 'Template Vierge',
        description: 'Template complètement vide pour création personnalisée',
        type: null, // Can be used for any type
        isOfficial: true,
        icon: 'FileText',
        color: 'gray',
        structure: {
          incomeCategories: [],
          expenseCategories: [],
          budgetLines: []
        },
        createdAt: '2025-01-01T00:00:00.000Z'
      },

      business: {
        id: 'business',
        name: 'Template Business',
        description: 'Template pour activités commerciales avec fiscalité et personnel',
        type: 'business',
        isOfficial: true,
        icon: 'Building2',
        color: 'blue',
        structure: {
          incomeCategories: [
            'ventes_produits_services',
            'subventions_aides',
            'autres_revenus'
          ],
          expenseCategories: [
            'remuneration_personnel',
            'achats_materiel',
            'achat_marchandises',
            'logement',
            'transport',
            'formation',
            'impots'
          ],
          budgetLines: [
            {
              type: 'revenue',
              mainCategory: 'ventes_produits_services',
              subcategory: 'ca_principal',
              amount: 50000,
              frequency: 'monthly',
              description: 'Chiffre d\'affaires principal'
            },
            {
              type: 'expense',
              mainCategory: 'remuneration_personnel',
              subcategory: 'salaires',
              amount: 15000,
              frequency: 'monthly',
              description: 'Salaires équipe'
            },
            {
              type: 'expense',
              mainCategory: 'logement',
              subcategory: 'loyer',
              amount: 2000,
              frequency: 'monthly',
              description: 'Loyer local commercial'
            },
            {
              type: 'expense',
              mainCategory: 'impots',
              subcategory: 'tva',
              amount: 10000,
              frequency: 'quarterly',
              description: 'TVA à payer'
            }
          ]
        },
        createdAt: '2025-01-01T00:00:00.000Z'
      },

      menage: {
        id: 'menage',
        name: 'Template Ménage',
        description: 'Template pour gestion familiale et budget domestique',
        type: 'menage',
        isOfficial: true,
        icon: 'Home',
        color: 'green',
        structure: {
          incomeCategories: [
            'salaires_traitements',
            'prestations_sociales',
            'revenus_locatifs',
            'autres_revenus'
          ],
          expenseCategories: [
            'logement',
            'nourriture_restauration',
            'transport',
            'sante_bien_etre',
            'loisirs_sports',
            'epargne',
            'impots',
            'ameublement_equipement'
          ],
          budgetLines: [
            {
              type: 'revenue',
              mainCategory: 'salaires_traitements',
              subcategory: 'salaire_base',
              amount: 4000,
              frequency: 'monthly',
              description: 'Salaire principal'
            },
            {
              type: 'expense',
              mainCategory: 'logement',
              subcategory: 'loyer',
              amount: 1200,
              frequency: 'monthly',
              description: 'Loyer habitation'
            },
            {
              type: 'expense',
              mainCategory: 'nourriture_restauration',
              subcategory: 'courses',
              amount: 600,
              frequency: 'monthly',
              description: 'Courses alimentaires'
            },
            {
              type: 'expense',
              mainCategory: 'transport',
              subcategory: 'carburant',
              amount: 300,
              frequency: 'monthly',
              description: 'Carburant véhicule familial'
            },
            {
              type: 'expense',
              mainCategory: 'epargne',
              subcategory: 'livret_a',
              amount: 500,
              frequency: 'monthly',
              description: 'Épargne mensuelle'
            }
          ]
        },
        createdAt: '2025-01-01T00:00:00.000Z'
      },

      mariage: {
        id: 'mariage',
        name: 'Template Mariage',
        description: 'Template pour organisation de mariage avec tous les postes essentiels',
        type: 'evenement',
        isOfficial: true,
        icon: 'PartyPopper',
        color: 'purple',
        structure: {
          incomeCategories: [
            'autres_revenus',
            'remboursements'
          ],
          expenseCategories: [
            'nourriture_restauration',
            'ameublement_equipement',
            'loisirs_sports',
            'transport',
            'logement',
            'achats_materiel'
          ],
          budgetLines: [
            {
              type: 'revenue',
              mainCategory: 'autres_revenus',
              subcategory: 'dons_recus',
              amount: 5000,
              frequency: 'one_time',
              description: 'Cadeaux et dons de mariage'
            },
            {
              type: 'expense',
              mainCategory: 'nourriture_restauration',
              subcategory: 'traiteur',
              amount: 8000,
              frequency: 'one_time',
              description: 'Traiteur réception'
            },
            {
              type: 'expense',
              mainCategory: 'ameublement_equipement',
              subcategory: 'decoration',
              amount: 3000,
              frequency: 'one_time',
              description: 'Décoration salle'
            },
            {
              type: 'expense',
              mainCategory: 'transport',
              subcategory: 'transport_vacances',
              amount: 2000,
              frequency: 'one_time',
              description: 'Transport invités'
            },
            {
              type: 'expense',
              mainCategory: 'logement',
              subcategory: 'entretien_logement',
              amount: 1500,
              frequency: 'one_time',
              description: 'Location salle'
            },
            {
              type: 'expense',
              mainCategory: 'loisirs_sports',
              subcategory: 'jeux',
              amount: 1000,
              frequency: 'one_time',
              description: 'Animation et musique'
            }
          ]
        },
        createdAt: '2025-01-01T00:00:00.000Z'
      },

      vacance: {
        id: 'vacance',
        name: 'Template Vacance',
        description: 'Template pour organisation de vacances avec budget voyage',
        type: 'evenement',
        isOfficial: true,
        icon: 'PartyPopper',
        color: 'cyan',
        structure: {
          incomeCategories: [
            'autres_revenus',
            'remboursements'
          ],
          expenseCategories: [
            'vacances',
            'transport',
            'nourriture_restauration',
            'loisirs_sports',
            'ameublement_equipement'
          ],
          budgetLines: [
            {
              type: 'revenue',
              mainCategory: 'remboursements',
              subcategory: 'remb_frais',
              amount: 2000,
              frequency: 'one_time',
              description: 'Remboursement CE vacances'
            },
            {
              type: 'expense',
              mainCategory: 'vacances',
              subcategory: 'voyage',
              amount: 1500,
              frequency: 'one_time',
              description: 'Billets d\'avion'
            },
            {
              type: 'expense',
              mainCategory: 'vacances',
              subcategory: 'hebergement',
              amount: 2500,
              frequency: 'one_time',
              description: 'Hôtel/logement'
            },
            {
              type: 'expense',
              mainCategory: 'nourriture_restauration',
              subcategory: 'restaurant',
              amount: 1200,
              frequency: 'one_time',
              description: 'Restaurants sur place'
            },
            {
              type: 'expense',
              mainCategory: 'loisirs_sports',
              subcategory: 'sport',
              amount: 800,
              frequency: 'one_time',
              description: 'Activités touristiques'
            },
            {
              type: 'expense',
              mainCategory: 'transport',
              subcategory: 'transport_public',
              amount: 400,
              frequency: 'one_time',
              description: 'Transport local'
            }
          ]
        },
        createdAt: '2025-01-01T00:00:00.000Z'
      }
    };
  }

  // Initialize community templates (created by users but made public)
  initializeCommunityTemplates() {
    const communityTemplates = [
      {
        id: 'community_restaurant',
        name: 'Gestion de Restaurant',
        description: 'Template complet pour gestion d\'un restaurant avec tous les postes spécifiques',
        type: 'business',
        isOfficial: false,
        isCommunity: true,
        icon: 'Building2',
        color: 'orange',
        createdBy: 'Chef Antoine M.',
        ratings: { average: 4.8, count: 156 },
        downloads: 1247,
        structure: {
          incomeCategories: ['ventes_produits_services', 'autres_revenus'],
          expenseCategories: ['nourriture_restauration', 'remuneration_personnel', 'logement', 'ameublement_equipement', 'achats_materiel', 'impots', 'formation'],
          budgetLines: [
            { type: 'revenue', mainCategory: 'ventes_produits_services', subcategory: 'ca_principal', amount: 25000, frequency: 'monthly', description: 'Chiffre d\'affaires restaurant' },
            { type: 'expense', mainCategory: 'nourriture_restauration', subcategory: 'courses', amount: 8000, frequency: 'monthly', description: 'Achats alimentaires et boissons' },
            { type: 'expense', mainCategory: 'remuneration_personnel', subcategory: 'salaires', amount: 12000, frequency: 'monthly', description: 'Salaires équipe cuisine et service' },
            { type: 'expense', mainCategory: 'logement', subcategory: 'loyer', amount: 3500, frequency: 'monthly', description: 'Loyer local restaurant' },
            { type: 'expense', mainCategory: 'ameublement_equipement', subcategory: 'electromenager', amount: 2000, frequency: 'quarterly', description: 'Équipement cuisine professionnel' },
            { type: 'expense', mainCategory: 'achats_materiel', subcategory: 'fournitures', amount: 800, frequency: 'monthly', description: 'Vaisselle et matériel service' },
            { type: 'expense', mainCategory: 'impots', subcategory: 'tva', amount: 5000, frequency: 'quarterly', description: 'TVA restauration' }
          ]
        },
        createdAt: '2024-11-15T10:30:00.000Z',
        publishedAt: '2024-11-20T14:00:00.000Z'
      },

      {
        id: 'community_immobilier',
        name: 'Service Gestion Immobilier',
        description: 'Template pour agence ou service de gestion immobilière avec commissions et frais',
        type: 'business',
        isOfficial: false,
        isCommunity: true,
        icon: 'Building2',
        color: 'emerald',
        createdBy: 'Immo Expert Pro',
        ratings: { average: 4.6, count: 89 },
        downloads: 743,
        structure: {
          incomeCategories: ['ventes_produits_services', 'revenus_locatifs', 'autres_revenus'],
          expenseCategories: ['remuneration_personnel', 'logement', 'transport', 'achats_materiel', 'formation', 'impots', 'ameublement_equipement'],
          budgetLines: [
            { type: 'revenue', mainCategory: 'ventes_produits_services', subcategory: 'commissions', amount: 15000, frequency: 'monthly', description: 'Commissions gestion locative' },
            { type: 'revenue', mainCategory: 'ventes_produits_services', subcategory: 'prestations', amount: 8000, frequency: 'monthly', description: 'Prestations conseil immobilier' },
            { type: 'expense', mainCategory: 'remuneration_personnel', subcategory: 'salaires', amount: 8500, frequency: 'monthly', description: 'Salaires agents immobiliers' },
            { type: 'expense', mainCategory: 'logement', subcategory: 'loyer', amount: 2200, frequency: 'monthly', description: 'Loyer bureau agence' },
            { type: 'expense', mainCategory: 'transport', subcategory: 'carburant', amount: 600, frequency: 'monthly', description: 'Déplacements visites clients' },
            { type: 'expense', mainCategory: 'achats_materiel', subcategory: 'materiel_bureau', amount: 400, frequency: 'monthly', description: 'Matériel bureau et informatique' },
            { type: 'expense', mainCategory: 'formation', subcategory: 'formation_pro', amount: 1000, frequency: 'quarterly', description: 'Formation réglementaire immobilier' }
          ]
        },
        createdAt: '2024-10-22T16:45:00.000Z',
        publishedAt: '2024-10-28T09:15:00.000Z'
      }
    ];

    // Generate additional community templates for testing scalability
    const additionalTemplates = [];
    const businesses = [
      { name: 'Boulangerie Artisanale', creator: 'Marie Boulanger', rating: 4.7, downloads: 892, description: 'Gestion complète d\'une boulangerie avec matières premières et ventes' },
      { name: 'Salon de Coiffure', creator: 'Style Expert', rating: 4.5, downloads: 634, description: 'Budget salon de coiffure avec produits et services' },
      { name: 'Cabinet Dentaire', creator: 'Dr. Santé', rating: 4.9, downloads: 1156, description: 'Gestion financière cabinet dentaire avec équipements' },
      { name: 'Auto-École', creator: 'Conduite Pro', rating: 4.3, downloads: 445, description: 'Template auto-école avec véhicules et formations' },
      { name: 'Pharmacie', creator: 'PharmaCare', rating: 4.6, downloads: 778, description: 'Gestion pharmacie avec stocks et réglementation' },
      { name: 'Garage Automobile', creator: 'MecaniqueMax', rating: 4.4, downloads: 523, description: 'Atelier mécanique avec pièces et main d\'œuvre' },
      { name: 'Agence Voyage', creator: 'VoyagePro', rating: 4.2, downloads: 356, description: 'Agence de voyage avec commissions et services' },
      { name: 'Librairie', creator: 'LivrePassion', rating: 4.8, downloads: 289, description: 'Librairie avec achats livres et événements culturels' },
      { name: 'Salle de Sport', creator: 'FitnessPro', rating: 4.1, downloads: 712, description: 'Salle de fitness avec abonnements et équipements' },
      { name: 'Crèche Privée', creator: 'EnfanceHeureuse', rating: 4.7, downloads: 445, description: 'Gestion crèche avec personnel et matériel éducatif' }
    ];

    businesses.forEach((business, index) => {
      additionalTemplates.push({
        id: `community_business_${index + 3}`,
        name: business.name,
        description: business.description,
        type: 'business',
        isOfficial: false,
        isCommunity: true,
        icon: 'Building2',
        color: ['blue', 'green', 'purple', 'orange', 'red', 'cyan', 'pink', 'yellow', 'indigo', 'emerald'][index % 10],
        createdBy: business.creator,
        ratings: { average: business.rating, count: Math.floor(Math.random() * 200) + 50 },
        downloads: business.downloads,
        structure: {
          incomeCategories: ['ventes_produits_services', 'autres_revenus'],
          expenseCategories: ['remuneration_personnel', 'logement', 'achats_materiel', 'impots'],
          budgetLines: [
            { type: 'revenue', mainCategory: 'ventes_produits_services', subcategory: 'ca_principal', amount: Math.floor(Math.random() * 30000) + 10000, frequency: 'monthly', description: 'Revenus principaux' },
            { type: 'expense', mainCategory: 'remuneration_personnel', subcategory: 'salaires', amount: Math.floor(Math.random() * 15000) + 5000, frequency: 'monthly', description: 'Salaires équipe' },
            { type: 'expense', mainCategory: 'logement', subcategory: 'loyer', amount: Math.floor(Math.random() * 3000) + 1000, frequency: 'monthly', description: 'Loyer local' }
          ]
        },
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString(),
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 300) * 24 * 60 * 60 * 1000).toISOString()
      });
    });

    return [...communityTemplates, ...additionalTemplates];
  }

  // Get all available templates (official + community + private)
  getAllTemplates() {
    return [
      ...Object.values(this.officialTemplates),
      ...this.communityTemplates,
      ...this.privateTemplates
    ];
  }

  // Get only official templates
  getOfficialTemplates() {
    return Object.values(this.officialTemplates);
  }

  // Get only community templates
  getCommunityTemplates() {
    return this.communityTemplates;
  }

  // Get only private templates (previously custom templates)
  getPrivateTemplates() {
    return this.privateTemplates;
  }

  // Get only custom templates (alias for backward compatibility)
  getCustomTemplates() {
    return this.privateTemplates;
  }

  // Get template by ID
  getTemplateById(templateId) {
    // Check official templates first
    if (this.officialTemplates[templateId]) {
      return this.officialTemplates[templateId];
    }
    
    // Check community templates
    const communityTemplate = this.communityTemplates.find(template => template.id === templateId);
    if (communityTemplate) {
      return communityTemplate;
    }
    
    // Check private templates
    return this.privateTemplates.find(template => template.id === templateId);
  }

  // Get templates by project type
  getTemplatesByType(projectType) {
    const allTemplates = this.getAllTemplates();
    return allTemplates.filter(template => 
      !template.type || template.type === projectType
    );
  }

  // Create custom template from project structure
  createTemplateFromProject(project, templateData, budgetLines = []) {
    // Extract unique categories used in the project
    const usedIncomeCategories = [...new Set(
      budgetLines
        .filter(line => line.type === 'revenue')
        .map(line => line.mainCategory)
        .filter(Boolean)
    )];

    const usedExpenseCategories = [...new Set(
      budgetLines
        .filter(line => line.type === 'expense')
        .map(line => line.mainCategory)
        .filter(Boolean)
    )];

    const customTemplate = {
      id: `custom_${Date.now()}`,
      name: templateData.name,
      description: templateData.description || `Template basé sur le projet ${project.name}`,
      type: project.type,
      isOfficial: false,
      icon: 'FileText',
      color: 'indigo',
      structure: {
        incomeCategories: usedIncomeCategories,
        expenseCategories: usedExpenseCategories,
        budgetLines: budgetLines.map(line => ({
          type: line.type,
          mainCategory: line.mainCategory,
          subcategory: line.subcategory,
          amount: line.montant || line.amount || 0,
          frequency: line.frequency,
          description: line.description
        }))
      },
      sourceProjectId: project.id,
      sourceProjectName: project.name,
      createdAt: new Date().toISOString(),
      createdBy: 'Demo User' // Should come from auth context
    };

    this.privateTemplates.push(customTemplate);
    this.saveCustomTemplates();
    return customTemplate;
  }

  // Apply template to new project
  applyTemplateToProject(templateId, projectData) {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    // Create project with template structure
    const projectWithTemplate = {
      ...projectData,
      templateId,
      templateName: template.name,
      // Apply template type if not already set
      type: projectData.type || template.type || 'business',
      // Initialize with template structure
      usedIncomeCategories: [...template.structure.incomeCategories],
      usedExpenseCategories: [...template.structure.expenseCategories],
      // Create initial budget lines from template
      initialBudgetLines: template.structure.budgetLines.map(line => ({
        ...line,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        currency: projectData.mainCurrency || 'EUR',
        startDate: projectData.startDate || new Date().toISOString().split('T')[0],
        endDate: projectData.endDate || '',
        isIndefinite: !projectData.endDate,
        categoryName: this.getCategoryDisplayName(line.mainCategory, line.type),
        subcategoryName: this.getSubcategoryDisplayName(line.mainCategory, line.subcategory, line.type),
        categoryColor: this.getCategoryColor(line.mainCategory, line.type)
      }))
    };

    return projectWithTemplate;
  }

  // Get category display name
  getCategoryDisplayName(categoryId, type) {
    const categoryType = type === 'revenue' ? 'income' : 'expense';
    const category = categoryService.getCategoryById(categoryId, categoryType);
    return category?.name || categoryId;
  }

  // Get subcategory display name
  getSubcategoryDisplayName(categoryId, subcategoryId, type) {
    const categoryType = type === 'revenue' ? 'income' : 'expense';
    const subcategory = categoryService.getSubcategoryById(categoryId, subcategoryId, categoryType);
    return subcategory?.name || subcategoryId;
  }

  // Get category color
  getCategoryColor(categoryId, type) {
    const categoryType = type === 'revenue' ? 'income' : 'expense';
    const category = categoryService.getCategoryById(categoryId, categoryType);
    return category?.color || 'gray';
  }

  // Update custom template
  updateCustomTemplate(templateId, updateData) {
    const templateIndex = this.privateTemplates.findIndex(template => template.id === templateId);
    if (templateIndex === -1) return false;

    this.privateTemplates[templateIndex] = {
      ...this.privateTemplates[templateIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    this.saveCustomTemplates();
    return true;
  }

  // Delete custom template
  deleteCustomTemplate(templateId) {
    const templateIndex = this.privateTemplates.findIndex(template => template.id === templateId);
    if (templateIndex === -1) return false;

    this.privateTemplates.splice(templateIndex, 1);
    this.saveCustomTemplates();
    return true;
  }

  // Get template preview/summary
  getTemplatePreview(templateId) {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    const structure = template.structure;
    return {
      name: template.name,
      description: template.description,
      type: template.type,
      categoryCounts: {
        income: structure.incomeCategories.length,
        expense: structure.expenseCategories.length
      },
      budgetLineCount: structure.budgetLines.length,
      estimatedBudget: {
        income: structure.budgetLines
          .filter(line => line.type === 'revenue')
          .reduce((sum, line) => sum + (line.amount || 0), 0),
        expense: structure.budgetLines
          .filter(line => line.type === 'expense')
          .reduce((sum, line) => sum + (line.amount || 0), 0)
      },
      isOfficial: template.isOfficial
    };
  }

  // Get template usage statistics
  getTemplateStats() {
    const totalTemplates = this.getAllTemplates().length;
    const privateTemplates = this.privateTemplates.length;
    const communityTemplates = this.communityTemplates.length;
    const officialTemplates = Object.keys(this.officialTemplates).length;

    const templatesByType = this.getAllTemplates().reduce((acc, template) => {
      const type = template.type || 'universal';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: totalTemplates,
      official: officialTemplates,
      community: communityTemplates,
      private: privateTemplates,
      byType: templatesByType
    };
  }

  // Search templates
  searchTemplates(query) {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllTemplates().filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      (template.type && template.type.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Duplicate template (create custom copy of official template)
  duplicateTemplate(templateId, newName, newDescription) {
    const sourceTemplate = this.getTemplateById(templateId);
    if (!sourceTemplate) return null;

    const duplicatedTemplate = {
      id: `custom_${Date.now()}`,
      name: newName,
      description: newDescription,
      type: sourceTemplate.type,
      isOfficial: false,
      icon: 'FileText',
      color: 'indigo',
      structure: JSON.parse(JSON.stringify(sourceTemplate.structure)), // Deep copy
      sourceTemplateId: templateId,
      sourceTemplateName: sourceTemplate.name,
      createdAt: new Date().toISOString(),
      createdBy: 'Demo User'
    };

    this.privateTemplates.push(duplicatedTemplate);
    this.saveCustomTemplates();
    return duplicatedTemplate;
  }

  // Export templates for backup
  exportTemplates() {
    return {
      privateTemplates: this.privateTemplates,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import templates from backup
  importTemplates(data) {
    try {
      if (data.privateTemplates && Array.isArray(data.privateTemplates)) {
        // Merge with existing templates (avoid duplicates)
        const existingIds = this.privateTemplates.map(t => t.id);
        const newTemplates = data.privateTemplates.filter(t => !existingIds.includes(t.id));
        
        this.privateTemplates = [...this.privateTemplates, ...newTemplates];
        this.saveCustomTemplates();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing templates:', error);
      return false;
    }
  }

  // Save private templates to localStorage (renamed from custom)
  saveCustomTemplates() {
    try {
      localStorage.setItem('privateTemplates', JSON.stringify(this.privateTemplates));
    } catch (error) {
      console.error('Error saving private templates:', error);
    }
  }

  // Load private templates from localStorage (renamed from custom)
  loadPrivateTemplates() {
    try {
      // Try new key first, fallback to old key for compatibility
      const saved = localStorage.getItem('privateTemplates') || localStorage.getItem('customTemplates');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading private templates:', error);
      return [];
    }
  }

  // Load community templates from localStorage (in real app, would come from API)
  loadCommunityTemplates() {
    // In production, this would fetch from API
    // For now, initialize community templates directly
    return this.initializeCommunityTemplates();
  }

  // Load custom templates from localStorage
  loadCustomTemplates() {
    try {
      const saved = localStorage.getItem('customTemplates');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading custom templates:', error);
      return [];
    }
  }

  // Validate template structure
  validateTemplate(template) {
    const errors = [];

    if (!template.name) {
      errors.push('Le nom du template est requis');
    }

    if (!template.structure) {
      errors.push('La structure du template est requise');
    } else {
      if (!Array.isArray(template.structure.incomeCategories)) {
        errors.push('Les catégories de revenus doivent être un tableau');
      }
      if (!Array.isArray(template.structure.expenseCategories)) {
        errors.push('Les catégories de dépenses doivent être un tableau');
      }
      if (!Array.isArray(template.structure.budgetLines)) {
        errors.push('Les lignes budgétaires doivent être un tableau');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get recommended templates for project type
  getRecommendedTemplates(projectType) {
    const templates = this.getTemplatesByType(projectType);
    const universal = this.getTemplatesByType(null);
    
    return [
      ...templates,
      ...universal.filter(t => t.id === 'vierge') // Always include empty template
    ].sort((a, b) => {
      // Sort: official first, then custom, then by creation date
      if (a.isOfficial && !b.isOfficial) return -1;
      if (!a.isOfficial && b.isOfficial) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }
}

// Export singleton instance
export const templateService = new TemplateService();
export default templateService;