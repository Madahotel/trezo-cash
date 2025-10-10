import { deriveActualsFromEntry } from "../../utils/scenarioCalculations";
import { templates as officialTemplatesData } from "../../utils/templates";

// Configuration Vite
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Données mock complètes
const mockData = {
  projects: {
    data: [
      {
        id: 1,
        user_id: 1,
        name: "Projet Personnel",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        currency: "EUR",
        currency_symbol: "€",
        expense_targets: {
          "exp-main-1": 20, "exp-main-2": 35, "exp-main-3": 10, "exp-main-4": 0,
          "exp-main-5": 10, "exp-main-6": 5, "exp-main-7": 10, "exp-main-8": 5,
          "exp-main-9": 5, "exp-main-10": 0
        },
        onboarding_step: "completed",
        is_archived: false,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: 2,
        user_id: 1,
        name: "Projet Freelance",
        start_date: "2024-01-01",
        end_date: null,
        currency: "EUR",
        currency_symbol: "€",
        expense_targets: {
          "exp-main-1": 15, "exp-main-2": 30, "exp-main-3": 15, "exp-main-4": 5,
          "exp-main-5": 10, "exp-main-6": 10, "exp-main-7": 5, "exp-main-8": 5,
          "exp-main-9": 5, "exp-main-10": 0
        },
        onboarding_step: "completed",
        is_archived: false,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z"
      }
    ]
  },
  'cash-accounts': {
    data: [
      {
        id: 1,
        project_id: 1,
        user_id: 1,
        main_category_id: "bank",
        name: "Compte Courant Principal",
        initial_balance: 2500.00,
        initial_balance_date: "2024-01-01",
        is_closed: false,
        closure_date: null,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: 2,
        project_id: 1,
        user_id: 1,
        main_category_id: "savings",
        name: "Livret A",
        initial_balance: 5000.00,
        initial_balance_date: "2024-01-01",
        is_closed: false,
        closure_date: null,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: 3,
        project_id: 2,
        user_id: 1,
        main_category_id: "bank",
        name: "Compte Pro",
        initial_balance: 1500.00,
        initial_balance_date: "2024-01-15",
        is_closed: false,
        closure_date: null,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z"
      }
    ]
  },
  'budget-entries': {
    data: [
      {
        id: 1,
        project_id: 1,
        user_id: 1,
        type: "revenu",
        category: "rev-main-1.sal-salaire",
        frequency: "mensuel",
        amount: 2500.00,
        date: null,
        start_date: "2024-01-01",
        end_date: null,
        supplier: "Mon Employeur",
        description: "Salaire mensuel",
        is_off_budget: false,
        payments: [],
        is_provision: false,
        currency: "EUR",
        original_amount: 2500.00,
        amount_type: "ttc",
        vat_rate_id: null,
        ht_amount: 2500.00,
        ttc_amount: 2500.00,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: 2,
        project_id: 1,
        user_id: 1,
        type: "depense",
        category: "exp-main-1.log-loyer",
        frequency: "mensuel",
        amount: 800.00,
        date: null,
        start_date: "2024-01-01",
        end_date: null,
        supplier: "Propriétaire",
        description: "Loyer appartement",
        is_off_budget: false,
        payments: [],
        is_provision: false,
        currency: "EUR",
        original_amount: 800.00,
        amount_type: "ttc",
        vat_rate_id: null,
        ht_amount: 800.00,
        ttc_amount: 800.00,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: 3,
        project_id: 2,
        user_id: 1,
        type: "revenu",
        category: "rev-main-2.fre-freelance",
        frequency: "ponctuel",
        amount: 1500.00,
        date: "2024-02-01",
        start_date: null,
        end_date: null,
        supplier: "Client A",
        description: "Projet développement web",
        is_off_budget: false,
        payments: [],
        is_provision: false,
        currency: "EUR",
        original_amount: 1500.00,
        amount_type: "ttc",
        vat_rate_id: null,
        ht_amount: 1250.00,
        ttc_amount: 1500.00,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z"
      }
    ]
  },
  'actual-transactions': {
    data: [
      {
        id: 1,
        budget_id: 1,
        project_id: 1,
        user_id: 1,
        type: "receivable",
        category: "rev-main-1.sal-salaire",
        third_party: "Mon Employeur",
        description: "Salaire janvier 2024",
        date: "2024-01-31",
        amount: 2500.00,
        status: "received",
        is_off_budget: false,
        payments: [
          {
            id: 1,
            date: "2024-01-31",
            paid_amount: 2500.00,
            is_final_payment: true
          }
        ],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-31T10:00:00Z"
      },
      {
        id: 2,
        budget_id: 2,
        project_id: 1,
        user_id: 1,
        type: "payable",
        category: "exp-main-1.log-loyer",
        third_party: "Propriétaire",
        description: "Loyer janvier 2024",
        date: "2024-01-05",
        amount: 800.00,
        status: "paid",
        is_off_budget: false,
        payments: [
          {
            id: 2,
            date: "2024-01-05",
            paid_amount: 800.00,
            is_final_payment: true
          }
        ],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-05T10:00:00Z"
      },
      {
        id: 3,
        budget_id: 3,
        project_id: 2,
        user_id: 1,
        type: "receivable",
        category: "rev-main-2.fre-freelance",
        third_party: "Client A",
        description: "Facture Projet Dev Web",
        date: "2024-02-01",
        amount: 1500.00,
        status: "pending",
        is_off_budget: false,
        payments: [],
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z"
      }
    ]
  },
  tiers: {
    data: [
      {
        id: 1,
        name: "Mon Employeur",
        type: "client",
        user_id: 1,
        payment_terms: 30,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: 2,
        name: "Propriétaire",
        type: "fournisseur",
        user_id: 1,
        payment_terms: 0,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: 3,
        name: "Client A",
        type: "client",
        user_id: 1,
        payment_terms: 45,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z"
      },
      {
        id: 4,
        name: "EDF",
        type: "fournisseur",
        user_id: 1,
        payment_terms: 30,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      }
    ]
  },
  'user-categories': {
    data: [
      {
        id: "rev-main-1",
        user_id: 1,
        name: "Salaires",
        type: "revenu",
        is_fixed: true,
        sub_categories: [
          {
            id: "sal-salaire",
            name: "Salaire principal",
            is_fixed: true,
            criticality: "essential"
          },
          {
            id: "sal-prime",
            name: "Primes",
            is_fixed: false,
            criticality: "non_essential"
          }
        ],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: "rev-main-2",
        user_id: 1,
        name: "Freelance",
        type: "revenu",
        is_fixed: false,
        sub_categories: [
          {
            id: "fre-freelance",
            name: "Prestations freelance",
            is_fixed: false,
            criticality: "essential"
          }
        ],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: "exp-main-1",
        user_id: 1,
        name: "Logement",
        type: "depense",
        is_fixed: true,
        sub_categories: [
          {
            id: "log-loyer",
            name: "Loyer ou crédit",
            is_fixed: true,
            criticality: "essential"
          },
          {
            id: "log-charge",
            name: "Charges",
            is_fixed: true,
            criticality: "essential"
          }
        ],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: "exp-main-2",
        user_id: 1,
        name: "Alimentation",
        type: "depense",
        is_fixed: false,
        sub_categories: [
          {
            id: "ali-course",
            name: "Courses alimentaires",
            is_fixed: false,
            criticality: "essential"
          },
          {
            id: "ali-resto",
            name: "Restaurants",
            is_fixed: false,
            criticality: "non_essential"
          }
        ],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      }
    ]
  },
  'tax-configs': {
    data: [
      {
        id: 1,
        user_id: 1,
        name: "TVA 20%",
        rate: 20.0,
        type: "vat",
        country: "FR",
        is_active: true,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: 2,
        user_id: 1,
        name: "Impôt sur le revenu",
        rate: 0.0,
        type: "income_tax",
        country: "FR",
        is_active: true,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      }
    ]
  },
  'consolidated-views': {
    data: [
      {
        id: 1,
        user_id: 1,
        name: "Vue Globale",
        project_ids: [1, 2],
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      }
    ]
  },
  templates: {
    data: [
      {
        id: "personal-basic",
        user_id: 1,
        name: "Budget Personnel Basique",
        type: "personal",
        structure: {
          cashAccounts: [
            {
              mainCategoryId: "bank",
              name: "Compte Courant",
              initialBalance: 0
            }
          ],
          entries: [
            {
              type: "revenu",
              category: "rev-main-1.sal-salaire",
              frequency: "mensuel",
              amount: 2000,
              supplier: "Employeur",
              description: "Salaire mensuel"
            },
            {
              type: "depense",
              category: "exp-main-1.log-loyer",
              frequency: "mensuel",
              amount: 700,
              supplier: "Propriétaire",
              description: "Loyer"
            }
          ]
        },
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      }
    ]
  },
  comments: {
    data: [
      {
        id: 1,
        project_id: 1,
        user_id: 1,
        row_id: "budget_1",
        column_id: "amount",
        content: "À vérifier si ce montant inclut les primes",
        mentioned_users: [],
        created_at: "2024-01-02T15:30:00Z",
        updated_at: "2024-01-02T15:30:00Z"
      }
    ]
  }
};

// Service API unifié
class ApiService {
  constructor() {
    this.USE_MOCK_DATA = USE_MOCK_DATA;
    this.API_BASE_URL = API_BASE_URL;
    this.API_HEADERS = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async request(endpoint, options = {}) {
    if (this.USE_MOCK_DATA) {
      return this.mockRequest(endpoint, options);
    }
    return this.realRequest(endpoint, options);
  }

  async mockRequest(endpoint, options = {}) {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));

    const method = options.method || 'GET';
    const data = options.body ? JSON.parse(options.body) : null;

    console.log(`🎭 Mock ${method} ${endpoint}`, data);

    switch (method) {
      case 'GET':
        return this.handleMockGet(endpoint);
      case 'POST':
        return this.handleMockPost(endpoint, data);
      case 'PUT':
        return this.handleMockPut(endpoint, data);
      case 'DELETE':
        return this.handleMockDelete(endpoint);
      default:
        throw new Error(`Méthode non supportée: ${method}`);
    }
  }

  handleMockGet(endpoint) {
    const endpointKey = endpoint.replace('/api/', '').split('?')[0];
    let data = mockData[endpointKey]?.data || [];

    // Filtrage basique
    if (endpoint.includes('?')) {
      const params = new URLSearchParams(endpoint.split('?')[1]);
      
      if (params.has('project_id')) {
        const projectId = parseInt(params.get('project_id'));
        data = data.filter(item => item.project_id === projectId);
      }
      
      if (params.has('budget_entry_id')) {
        const budgetId = parseInt(params.get('budget_entry_id'));
        data = data.filter(item => item.budget_id === budgetId);
      }
    }

    return { data };
  }

  handleMockPost(endpoint, data) {
    const endpointKey = endpoint.replace('/api/', '');
    const collection = mockData[endpointKey]?.data || [];
    
    const newId = Math.max(...collection.map(item => item.id || 0), 0) + 1;
    const newItem = {
      id: newId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    collection.push(newItem);
    
    return { data: newItem };
  }

  handleMockPut(endpoint, data) {
    const endpointKey = endpoint.split('/').slice(0, -1).join('/').replace('/api/', '');
    const id = parseInt(endpoint.split('/').pop());
    const collection = mockData[endpointKey]?.data || [];
    
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('Resource not found');
    }
    
    const updatedItem = {
      ...collection[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    collection[index] = updatedItem;
    
    return { data: updatedItem };
  }

  handleMockDelete(endpoint) {
    const endpointKey = endpoint.split('/').slice(0, -1).join('/').replace('/api/', '');
    const id = parseInt(endpoint.split('/').pop());
    const collection = mockData[endpointKey]?.data || [];
    
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('Resource not found');
    }
    
    collection.splice(index, 1);
    
    return { message: 'Resource deleted successfully' };
  }

  async realRequest(endpoint, options = {}) {
    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      headers: this.API_HEADERS,
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Méthodes pratiques
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Instance unique
const apiService = new ApiService();

// Fonctions API existantes adaptées
const apiEndpoints = {
  projects: "/projects",
  cashAccounts: "/cash-accounts",
  budgetEntries: "/budget-entries",
  actualTransactions: "/actual-transactions",
  tiers: "/tiers",
  scenarios: "/scenarios",
  scenarioEntries: "/scenario-entries",
  templates: "/templates",
  userCategories: "/user-categories",
  taxConfigs: "/tax-configs",
  consolidatedViews: "/consolidated-views",
  collaborators: "/collaborators",
  comments: "/comments",
};

const getDefaultExpenseTargets = () => ({
  "exp-main-1": 20, "exp-main-2": 35, "exp-main-3": 10, "exp-main-4": 0,
  "exp-main-5": 10, "exp-main-6": 5, "exp-main-7": 10, "exp-main-8": 5,
  "exp-main-9": 5, "exp-main-10": 0
});

// Export des fonctions existantes (adaptées pour utiliser apiService)
export const updateProjectOnboardingStep = async (
  { dataDispatch, uiDispatch },
  { projectId, step }
) => {
  try {
    const response = await apiService.put(
      `${apiEndpoints.projects}/${projectId}/onboarding-step`,
      { step }
    );

    dataDispatch({
      type: "UPDATE_PROJECT_ONBOARDING_STEP",
      payload: { projectId, step },
    });
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: "Étape validée !", type: "success" },
    });
  } catch (error) {
    console.error("Error updating onboarding step:", error);
    uiDispatch({
      type: "ADD_TOAST",
      payload: { message: `Erreur: ${error.message}`, type: "error" },
    });
  }
};

// ... Continuez avec toutes vos autres fonctions en remplaçant 'api' par 'apiService'

export const loadInitialData = async (user) => {
  try {
    const [
      projectsResponse,
      cashAccountsResponse,
      budgetEntriesResponse,
      actualTransactionsResponse,
      tiersResponse,
      templatesResponse,
      userCategoriesResponse,
      taxConfigsResponse,
      consolidatedViewsResponse,
    ] = await Promise.all([
      apiService.get(apiEndpoints.projects),
      apiService.get(apiEndpoints.cashAccounts),
      apiService.get(apiEndpoints.budgetEntries),
      apiService.get(apiEndpoints.actualTransactions),
      apiService.get(apiEndpoints.tiers),
      apiService.get(apiEndpoints.templates),
      apiService.get(apiEndpoints.userCategories),
      apiService.get(apiEndpoints.taxConfigs),
      apiService.get(apiEndpoints.consolidatedViews),
    ]);

    return {
      projects: projectsResponse.data,
      cashAccounts: cashAccountsResponse.data,
      budgetEntries: budgetEntriesResponse.data,
      actualTransactions: actualTransactionsResponse.data,
      tiers: tiersResponse.data,
      templates: templatesResponse.data,
      userCategories: userCategoriesResponse.data,
      taxConfigs: taxConfigsResponse.data,
      consolidatedViews: consolidatedViewsResponse.data,
    };
  } catch (error) {
    console.error("Error loading initial data:", error);
    throw error;
  }
};

// Export pour debug
export { apiService, mockData };