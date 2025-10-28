import { 
  PiggyBank, 
  GraduationCap, 
  TrendingUp, 
  Plane, 
  Gamepad2, 
  UtensilsCrossed, 
  Car, 
  Home, 
  Users, 
  Heart, 
  Receipt, 
  Sofa, 
  Package, 
  CreditCard, 
  Wrench,
  DollarSign,
  ShoppingCart,
  Building,
  HandCoins,
  MapPin,
  Gift,
  RefreshCw,
  Wallet,
  Briefcase,
  FileText,
  Award
} from 'lucide-react';

// Category management service for budget entries
class CategoryService {
  constructor() {
    // Base categories that cannot be modified or deleted
    this.baseCategories = {
      expense: [
        {
          id: 'epargne',
          name: 'Épargne',
          icon: PiggyBank,
          color: 'green',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'livret_a', name: 'Livret A' },
            { id: 'pel', name: 'PEL' },
            { id: 'assurance_vie', name: 'Assurance vie' },
            { id: 'plan_epargne', name: "Plan d'épargne entreprise" },
            { id: 'epargne_retraite', name: 'Épargne retraite' }
          ]
        },
        {
          id: 'formation',
          name: 'Formation',
          icon: GraduationCap,
          color: 'blue',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'formation_pro', name: 'Formation professionnelle' },
            { id: 'cours_langue', name: 'Cours de langues' },
            { id: 'certification', name: 'Certifications' },
            { id: 'conference', name: 'Conférences et séminaires' },
            { id: 'coaching', name: 'Coaching' }
          ]
        },
        {
          id: 'investissement',
          name: 'Investissement',
          icon: TrendingUp,
          color: 'purple',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'vehicule', name: 'Véhicule' },
            { id: 'materiel_info', name: 'Matériel informatique' },
            { id: 'immobilier', name: 'Immobilier' },
            { id: 'equipement_pro', name: 'Équipement professionnel' },
            { id: 'actions', name: 'Actions et obligations' }
          ]
        },
        {
          id: 'vacances',
          name: 'Vacances',
          icon: Plane,
          color: 'cyan',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'voyage', name: 'Voyage' },
            { id: 'hebergement', name: 'Hébergement' },
            { id: 'activites_vacances', name: 'Activités touristiques' },
            { id: 'transport_vacances', name: 'Transport vacances' },
            { id: 'souvenirs', name: 'Souvenirs' }
          ]
        },
        {
          id: 'loisirs_sports',
          name: 'Loisirs & Sports',
          icon: Gamepad2,
          color: 'orange',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'sport', name: 'Sport et fitness' },
            { id: 'cinema', name: 'Cinéma et spectacles' },
            { id: 'jeux', name: 'Jeux et divertissements' },
            { id: 'lecture', name: 'Livres et magazines' },
            { id: 'hobbies', name: 'Hobbies divers' }
          ]
        },
        {
          id: 'nourriture_restauration',
          name: 'Nourriture & Restauration',
          icon: UtensilsCrossed,
          color: 'red',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'courses', name: 'Courses alimentaires' },
            { id: 'restaurant', name: 'Restaurant' },
            { id: 'traiteur', name: 'Traiteur' },
            { id: 'boissons', name: 'Boissons' },
            { id: 'snacks', name: 'Snacks et collations' }
          ]
        },
        {
          id: 'transport',
          name: 'Transport',
          icon: Car,
          color: 'gray',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'carburant', name: 'Carburant' },
            { id: 'assurance_auto', name: 'Assurance automobile' },
            { id: 'entretien_auto', name: 'Entretien véhicule' },
            { id: 'transport_public', name: 'Transport en commun' },
            { id: 'peages', name: 'Péages' },
            { id: 'parking', name: 'Parking' }
          ]
        },
        {
          id: 'logement',
          name: 'Logement',
          icon: Home,
          color: 'emerald',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'loyer', name: 'Loyer' },
            { id: 'charges', name: 'Charges' },
            { id: 'electricite', name: 'Électricité' },
            { id: 'gaz', name: 'Gaz' },
            { id: 'eau', name: 'Eau' },
            { id: 'internet', name: 'Internet/téléphone' },
            { id: 'entretien_logement', name: 'Entretien logement' }
          ]
        },
        {
          id: 'remuneration_personnel',
          name: 'Rémunération du personnel',
          icon: Users,
          color: 'indigo',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'salaires', name: 'Salaires' },
            { id: 'charges_sociales', name: 'Charges sociales' },
            { id: 'primes', name: 'Primes et bonus' },
            { id: 'formation_personnel', name: 'Formation du personnel' },
            { id: 'frais_personnel', name: 'Frais de personnel' }
          ]
        },
        {
          id: 'sante_bien_etre',
          name: 'Santé et bien-être',
          icon: Heart,
          color: 'pink',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'medecin', name: 'Médecin' },
            { id: 'pharmacie', name: 'Pharmacie' },
            { id: 'dentiste', name: 'Dentiste' },
            { id: 'mutuelle', name: 'Mutuelle santé' },
            { id: 'bien_etre', name: 'Bien-être et relaxation' }
          ]
        },
        {
          id: 'impots',
          name: 'Impôts',
          icon: Receipt,
          color: 'yellow',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'impot_revenu', name: 'Impôt sur le revenu' },
            { id: 'taxe_habitation', name: 'Taxe habitation' },
            { id: 'taxe_fonciere', name: 'Taxe foncière' },
            { id: 'tva', name: 'TVA' },
            { id: 'cotisations', name: 'Cotisations sociales' }
          ]
        },
        {
          id: 'ameublement_equipement',
          name: 'Ameublement et équipement',
          icon: Sofa,
          color: 'amber',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'meubles', name: 'Meubles' },
            { id: 'electromenager', name: 'Électroménager' },
            { id: 'decoration', name: 'Décoration' },
            { id: 'literie', name: 'Literie' },
            { id: 'vaisselle', name: 'Vaisselle et ustensiles' }
          ]
        },
        {
          id: 'achat_marchandises',
          name: 'Achat de marchandises pour revente',
          icon: Package,
          color: 'teal',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'stock_principal', name: 'Stock principal' },
            { id: 'produits_derives', name: 'Produits dérivés' },
            { id: 'matieres_premieres', name: 'Matières premières' },
            { id: 'emballages', name: 'Emballages' },
            { id: 'transport_marchandises', name: 'Transport marchandises' }
          ]
        },
        {
          id: 'remboursement_emprunt',
          name: "Remboursement d'emprunt",
          icon: CreditCard,
          color: 'slate',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'credit_immobilier', name: 'Crédit immobilier' },
            { id: 'credit_conso', name: 'Crédit à la consommation' },
            { id: 'credit_auto', name: 'Crédit automobile' },
            { id: 'credit_pro', name: 'Crédit professionnel' },
            { id: 'decouvert', name: 'Découvert bancaire' }
          ]
        },
        {
          id: 'achats_materiel',
          name: 'Achats de matériel',
          icon: Wrench,
          color: 'stone',
          type: 'expense',
          isBase: true,
          subcategories: [
            { id: 'outils', name: 'Outils' },
            { id: 'materiel_bureau', name: 'Matériel de bureau' },
            { id: 'consommables', name: 'Consommables' },
            { id: 'fournitures', name: 'Fournitures diverses' },
            { id: 'maintenance', name: 'Maintenance et réparation' }
          ]
        }
      ],
      income: [
        {
          id: 'salaires_traitements',
          name: 'Salaires et traitements',
          icon: Briefcase,
          color: 'blue',
          type: 'income',
          isBase: true,
          subcategories: [
            { id: 'salaire_base', name: 'Salaire de base' },
            { id: 'primes_salaire', name: 'Primes et bonus' },
            { id: 'heures_sup', name: 'Heures supplémentaires' },
            { id: 'treizieme_mois', name: '13ème mois' },
            { id: 'avantages_nature', name: 'Avantages en nature' }
          ]
        },
        {
          id: 'ventes_produits_services',
          name: 'Ventes de produits/services',
          icon: ShoppingCart,
          color: 'green',
          type: 'income',
          isBase: true,
          subcategories: [
            { id: 'ca_principal', name: 'Chiffre affaires principal' },
            { id: 'ventes_annexes', name: 'Ventes annexes' },
            { id: 'prestations', name: 'Prestations de service' },
            { id: 'commissions', name: 'Commissions' },
            { id: 'royalties', name: 'Royalties et licences' }
          ]
        },
        {
          id: 'investissements_placements',
          name: 'Investissements et placements',
          icon: TrendingUp,
          color: 'purple',
          type: 'income',
          isBase: true,
          subcategories: [
            { id: 'dividendes', name: 'Dividendes' },
            { id: 'plus_values', name: 'Plus-values' },
            { id: 'interets', name: 'Intérêts' },
            { id: 'revenus_fonciers', name: 'Revenus fonciers' },
            { id: 'crypto', name: 'Crypto-monnaies' }
          ]
        },
        {
          id: 'subventions_aides',
          name: 'Subventions et aides',
          icon: HandCoins,
          color: 'orange',
          type: 'income',
          isBase: true,
          subcategories: [
            { id: 'aides_publiques', name: 'Aides publiques' },
            { id: 'subventions_ue', name: 'Subventions UE' },
            { id: 'credit_impot', name: "Crédit d'impôt" },
            { id: 'aides_region', name: 'Aides régionales' },
            { id: 'bourses', name: 'Bourses' }
          ]
        },
        {
          id: 'revenus_locatifs',
          name: 'Revenus locatifs',
          icon: Building,
          color: 'emerald',
          type: 'income',
          isBase: true,
          subcategories: [
            { id: 'loyers_habitation', name: 'Loyers habitation' },
            { id: 'loyers_commercial', name: 'Loyers commercial' },
            { id: 'charges_locataires', name: 'Charges locataires' },
            { id: 'parking_garage', name: 'Parking/garage' },
            { id: 'location_saisonniere', name: 'Location saisonnière' }
          ]
        },
        {
          id: 'prestations_sociales',
          name: 'Prestations sociales',
          icon: Heart,
          color: 'pink',
          type: 'income',
          isBase: true,
          subcategories: [
            { id: 'allocations_chomage', name: 'Allocations chômage' },
            { id: 'allocations_familiales', name: 'Allocations familiales' },
            { id: 'pension_retraite', name: 'Pension de retraite' },
            { id: 'rsa', name: 'RSA' },
            { id: 'apl', name: 'APL' }
          ]
        },
        {
          id: 'remboursements',
          name: 'Remboursements',
          icon: RefreshCw,
          color: 'cyan',
          type: 'income',
          isBase: true,
          subcategories: [
            { id: 'remb_frais', name: 'Remboursements de frais' },
            { id: 'remb_secu', name: 'Remboursements sécurité sociale' },
            { id: 'remb_mutuelle', name: 'Remboursements mutuelle' },
            { id: 'trop_percu', name: 'Trop-perçus' },
            { id: 'notes_frais', name: 'Notes de frais' }
          ]
        },
        {
          id: 'autres_revenus',
          name: 'Autres revenus',
          icon: Gift,
          color: 'indigo',
          type: 'income',
          isBase: true,
          subcategories: [
            { id: 'dons_recus', name: 'Dons reçus' },
            { id: 'gains_jeux', name: 'Gains aux jeux' },
            { id: 'ventes_personnelles', name: 'Ventes personnelles' },
            { id: 'revenus_divers', name: 'Revenus divers' },
            { id: 'cashback', name: 'Cashback et remises' }
          ]
        }
      ]
    };

    // Custom categories added by users
    this.customCategories = {
      expense: [],
      income: []
    };

    // Load custom categories from localStorage
    this.loadCustomCategories();
  }

  // Get all categories (base + custom) for a specific type
  getAllCategories(type) {
    return [
      ...this.baseCategories[type],
      ...this.customCategories[type]
    ];
  }

  // Get only base categories
  getBaseCategories(type) {
    return this.baseCategories[type];
  }

  // Get only custom categories
  getCustomCategories(type) {
    return this.customCategories[type];
  }

  // Get category by ID
  getCategoryById(categoryId, type) {
    const allCategories = this.getAllCategories(type);
    return allCategories.find(cat => cat.id === categoryId);
  }

  // Get subcategory by ID
  getSubcategoryById(categoryId, subcategoryId, type) {
    const category = this.getCategoryById(categoryId, type);
    if (!category) return null;
    return category.subcategories.find(sub => sub.id === subcategoryId);
  }

  // Add custom category
  addCustomCategory(categoryData) {
    const newCategory = {
      ...categoryData,
      id: `custom_${Date.now()}`,
      isBase: false
    };

    this.customCategories[categoryData.type].push(newCategory);
    this.saveCustomCategories();
    return newCategory;
  }

  // Update custom category
  updateCustomCategory(categoryId, type, updateData) {
    const categoryIndex = this.customCategories[type].findIndex(
      cat => cat.id === categoryId
    );
    
    if (categoryIndex === -1) return false;

    this.customCategories[type][categoryIndex] = {
      ...this.customCategories[type][categoryIndex],
      ...updateData
    };

    this.saveCustomCategories();
    return true;
  }

  // Delete custom category
  deleteCustomCategory(categoryId, type) {
    const categoryIndex = this.customCategories[type].findIndex(
      cat => cat.id === categoryId
    );
    
    if (categoryIndex === -1) return false;

    this.customCategories[type].splice(categoryIndex, 1);
    this.saveCustomCategories();
    return true;
  }

  // Add subcategory to custom category
  addSubcategory(categoryId, type, subcategoryData) {
    const category = this.customCategories[type].find(cat => cat.id === categoryId);
    if (!category) return false;

    const newSubcategory = {
      ...subcategoryData,
      id: `sub_${Date.now()}`
    };

    category.subcategories.push(newSubcategory);
    this.saveCustomCategories();
    return newSubcategory;
  }

  // Update subcategory
  updateSubcategory(categoryId, type, subcategoryId, updateData) {
    const category = this.customCategories[type].find(cat => cat.id === categoryId);
    if (!category) return false;

    const subcategoryIndex = category.subcategories.findIndex(
      sub => sub.id === subcategoryId
    );
    
    if (subcategoryIndex === -1) return false;

    category.subcategories[subcategoryIndex] = {
      ...category.subcategories[subcategoryIndex],
      ...updateData
    };

    this.saveCustomCategories();
    return true;
  }

  // Delete subcategory
  deleteSubcategory(categoryId, type, subcategoryId) {
    const category = this.customCategories[type].find(cat => cat.id === categoryId);
    if (!category) return false;

    const subcategoryIndex = category.subcategories.findIndex(
      sub => sub.id === subcategoryId
    );
    
    if (subcategoryIndex === -1) return false;

    category.subcategories.splice(subcategoryIndex, 1);
    this.saveCustomCategories();
    return true;
  }

  // Save custom categories to localStorage
  saveCustomCategories() {
    try {
      localStorage.setItem('customCategories', JSON.stringify(this.customCategories));
    } catch (error) {
      console.error('Error saving custom categories:', error);
    }
  }

  // Load custom categories from localStorage
  loadCustomCategories() {
    try {
      const saved = localStorage.getItem('customCategories');
      if (saved) {
        this.customCategories = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading custom categories:', error);
      this.customCategories = { expense: [], income: [] };
    }
  }

  // Get formatted categories for dropdown/select
  getFormattedCategories(type) {
    return this.getAllCategories(type).map(category => ({
      value: category.id,
      label: category.name,
      icon: category.icon,
      color: category.color,
      isBase: category.isBase,
      subcategories: category.subcategories.map(sub => ({
        value: sub.id,
        label: sub.name
      }))
    }));
  }

  // Export categories for backup
  exportCategories() {
    return {
      customCategories: this.customCategories,
      exportDate: new Date().toISOString()
    };
  }

  // Import categories from backup
  importCategories(data) {
    try {
      if (data.customCategories) {
        this.customCategories = data.customCategories;
        this.saveCustomCategories();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing categories:', error);
      return false;
    }
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
export default categoryService;