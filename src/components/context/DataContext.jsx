import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
const DataContext = createContext();

export const mainCashAccountCategories = [
  { id: 'bank', name: 'Comptes Bancaires' },
  { id: 'cash', name: 'Cash / Espèce' },
  { id: 'mobileMoney', name: 'Mobile Money' },
  { id: 'savings', name: 'Épargne' },
  { id: 'provisions', name: 'Provisions' },
];


const initialCategories = {
  revenue: [
    { id: 'rev-main-1', name: 'RÉMUNÉRATION DU TRAVAIL', isDefault: true, subCategories: [
      { id: 'rev-sub-1-1', name: 'Salaires & traitements nets' },
      { id: 'rev-sub-1-2', name: 'Rémunération des dirigeants' },
      { id: 'rev-sub-1-3', name: 'Honoraires & chiffre d\'affaires (BIC/BNC)' },
      { id: 'rev-sub-1-4', name: 'Primes, bonus & commissions' },
      { id: 'rev-sub-1-5', name: 'Indemnités' },
      { id: 'rev-sub-1-6', name: 'Remboursements de frais professionnels' },
    ]},
    { id: 'rev-main-2', name: 'VENTES DE BIENS & PRODUITS', isDefault: true, subCategories: [
      { id: 'rev-sub-2-1', name: 'Vente de marchandises' },
      { id: 'rev-sub-2-2', name: 'Vente de produits fabriqués' },
      { id: 'rev-sub-2-3', name: 'Vente d\'actifs immobilisés' },
      { id: 'rev-sub-2-4', name: 'Revente de biens personnels' },
    ]},
    { id: 'rev-main-3', name: 'PRESTATIONS DE SERVICES & ACTIVITÉS', isDefault: true, subCategories: [
        { id: 'rev-sub-3-1', name: 'Conseil & expertise' },
        { id: 'rev-sub-3-2', name: 'Prestations artistiques ou culturelles' },
        { id: 'rev-sub-3-3', name: 'Prestations sportives' },
        { id: 'rev-sub-3-4', name: 'Recettes d\'événements' },
        { id: 'rev-sub-3-5', name: 'Locations diverses' },
    ]},
    { id: 'rev-main-4', name: 'REVENUS FINANCIERS & DE PLACEMENTS', isDefault: true, subCategories: [
        { id: 'rev-sub-4-1', name: 'Dividendes' },
        { id: 'rev-sub-4-2', name: 'Intérêts perçus' },
        { id: 'rev-sub-4-3', name: 'Plus-values de cession' },
        { id: 'rev-sub-4-4', name: 'Revenus locatifs nets' },
    ]},
    { id: 'rev-main-5', name: 'AIDES, SUBVENTIONS & DOTATIONS', isDefault: true, subCategories: [
        { id: 'rev-sub-5-1', name: 'Aides publiques aux entreprises' },
        { id: 'rev-sub-5-2', name: 'Subventions associatives' },
        { id: 'rev-sub-5-3', name: 'Allocations & prestations sociales' },
        { id: 'rev-sub-5-4', name: 'Indemnités journalières' },
        { id: 'rev-sub-5-5', name: 'Pensions de retraite' },
        { id: 'rev-sub-5-6', name: 'Bourses & bourses d\'études' },
        { id: 'rev-sub-5-7', name: 'Crédit de TVA', isFixed: true },
    ]},
    { id: 'rev-main-6', name: 'APPORTS & FINANCEMENTS', isDefault: true, subCategories: [
        { id: 'rev-sub-6-1', name: 'Apports en capital' },
        { id: 'rev-sub-6-2', name: 'Emprunts & prêts reçus' },
        { id: 'rev-sub-6-3', name: 'Collecte de fonds (crowdfunding)' },
        { id: 'rev-sub-6-4', name: 'Apports personnels pour projet' },
    ]},
    { id: 'rev-main-7', name: 'REVENUS DIVERS & OCCASIONNELS', isDefault: true, subCategories: [
        { id: 'rev-sub-7-1', name: 'Dons & cadeaux en argent' },
        { id: 'rev-sub-7-2', name: 'Gains divers' },
        { id: 'rev-sub-7-3', name: 'Remboursements personnels' },
        { id: 'rev-sub-7-4', name: 'Compensations' },
    ]},
    { id: 'rev-main-8', name: 'FINANCEMENTS & CRÉDITS (Encaissements)', isDefault: true, subCategories: [
        { id: 'rev-sub-8-1', name: 'Remboursement prêt familial' },
        { id: 'rev-sub-8-2', name: 'Remboursement prêt entre associés' },
        { id: 'rev-sub-8-3', name: 'Remboursement prêt entreprise' },
    ]},
  ],
  expense: [
    { id: 'exp-main-1', name: 'RÉMUNÉRATIONS & HONORAIRES', isDefault: true, subCategories: [
        { id: 'exp-sub-1-1', name: 'Salaires, traitements et charges', criticality: 'critical' },
        { id: 'exp-sub-1-2', name: 'Honoraires (freelances, experts-comptables)', criticality: 'essential' },
        { id: 'exp-sub-1-3', name: 'Primes, bonus et participations', criticality: 'discretionary' },
        { id: 'exp-sub-1-4', name: 'Indemnités (déplacement, repas, km)', criticality: 'essential' },
        { id: 'exp-sub-1-5', name: 'Cotisations sociales personnelles', criticality: 'critical' },
    ]},
    { id: 'exp-main-2', name: 'HEBERGEMENT & LOGEMENT', isDefault: true, subCategories: [
        { id: 'exp-sub-2-1', name: 'Loyer & Charges locatives', criticality: 'critical' },
        { id: 'exp-sub-2-2', name: 'Prêt immobilier (remboursement capital)', criticality: 'critical' },
        { id: 'exp-sub-2-3', name: 'Charges de copropriété', criticality: 'critical' },
        { id: 'exp-sub-2-4', name: 'Entretien, réparations et amélioration', criticality: 'essential' },
        { id: 'exp-sub-2-5', name: 'Énergie (Électricité, Gaz, Chauffage)', criticality: 'critical' },
        { id: 'exp-sub-2-6', name: 'Eau et assainissement', criticality: 'critical' },
        { id: 'exp-sub-2-7', name: 'Assurance habitation/locaux', criticality: 'critical' },
        { id: 'exp-sub-2-8', name: 'Taxe foncière', criticality: 'critical' },
    ]},
    { id: 'exp-main-3', name: 'TRANSPORT & VÉHICULES', isDefault: true, subCategories: [
        { id: 'exp-sub-3-1', name: 'Carburant & Recharge', criticality: 'essential' },
        { id: 'exp-sub-3-2', name: 'Entretien, réparations et pièces', criticality: 'essential' },
        { id: 'exp-sub-3-3', name: 'Assurance auto/moto', criticality: 'critical' },
        { id: 'exp-sub-3-4', name: 'Péage, stationnement et amendes', criticality: 'discretionary' },
        { id: 'exp-sub-3-5', name: 'Transport en commun', criticality: 'essential' },
        { id: 'exp-sub-3-6', name: 'Taxi, VTC, location de véhicule', criticality: 'discretionary' },
        { id: 'exp-sub-3-7', name: 'Voyages longue distance (billets de train, d\'avion)', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-4', name: 'NOURRITURE & RESTAURATION', isDefault: true, subCategories: [
        { id: 'exp-sub-4-1', name: 'Courses alimentaires', criticality: 'essential' },
        { id: 'exp-sub-4-2', name: 'Restaurant, café, bar', criticality: 'discretionary' },
        { id: 'exp-sub-4-3', name: 'Livraison de repas à domicile', criticality: 'discretionary' },
        { id: 'exp-sub-4-4', name: 'Repas en déplacement professionnel', criticality: 'essential' },
    ]},
    { id: 'exp-main-5', name: 'COMMUNICATION, INTERNET & ABONNEMENTS', isDefault: true, subCategories: [
        { id: 'exp-sub-5-1', name: 'Téléphonie mobile et fixe', criticality: 'essential' },
        { id: 'exp-sub-5-2', name: 'Internet (Box) et Abonnements TV', criticality: 'essential' },
        { id: 'exp-sub-5-3', name: 'Logiciels et applications (SaaS)', criticality: 'essential' },
        { id: 'exp-sub-5-4', name: 'Hébergement web, nom de domaine', criticality: 'essential' },
        { id: 'exp-sub-5-5', name: 'Équipements tech (ordinateur, smartphone)', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-6', name: 'LOISIRS, CULTURE & SPORT', isDefault: true, subCategories: [
        { id: 'exp-sub-6-1', name: 'Abonnements culturels (Streaming, presse, jeux vidéo)', criticality: 'discretionary' },
        { id: 'exp-sub-6-2', name: 'Sports (Club, équipement, licence)', criticality: 'discretionary' },
        { id: 'exp-sub-6-3', name: 'Sorties (Cinéma, concert, musée, événement)', criticality: 'discretionary' },
        { id: 'exp-sub-6-4', name: 'Hobbies et passions', criticality: 'discretionary' },
        { id: 'exp-sub-6-5', name: 'Vacances et week-ends', criticality: 'discretionary' },
        { id: 'exp-sub-6-6', name: 'Cotisations associatives', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-7', name: 'SANTÉ & BIEN-ÊTRE', isDefault: true, subCategories: [
        { id: 'exp-sub-7-1', name: 'Mutuelle santé', criticality: 'critical' },
        { id: 'exp-sub-7-2', name: 'Frais médicaux (consultations, pharmacie)', criticality: 'essential' },
        { id: 'exp-sub-7-3', name: 'Soins (dentiste, opticien, kiné)', criticality: 'essential' },
        { id: 'exp-sub-7-4', name: 'Bien-être (Coaching, yoga, cosmétiques)', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-8', name: 'PROJET IMMOBILIER & INVESTISSEMENTS', isDefault: true, subCategories: [
        { id: 'exp-sub-8-1', name: 'Apport personnel', criticality: 'discretionary' },
        { id: 'exp-sub-8-2', name: 'Frais de notaire', criticality: 'critical' },
        { id: 'exp-sub-8-3', name: 'Travaux d\'aménagement importants', criticality: 'discretionary' },
        { id: 'exp-sub-8-4', name: 'Achat de mobilier durable', criticality: 'discretionary' },
        { id: 'exp-sub-8-5', name: 'Investissements financiers', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-9', name: 'ACTIVITÉ PROFESSIONNELLE & ENTREPRISE', isDefault: true, subCategories: [
        { id: 'exp-sub-9-1', name: 'Marketing et publicité', criticality: 'discretionary' },
        { id: 'exp-sub-9-2', name: 'Achat de marchandises / matières premières', criticality: 'essential' },
        { id: 'exp-sub-9-3', name: 'Sous-traitance', criticality: 'essential' },
        { id: 'exp-sub-9-4', name: 'Frais de déplacement professionnel (hors repas)', criticality: 'essential' },
        { id: 'exp-sub-9-5', name: 'Cotisations et frais professionnels', criticality: 'essential' },
        { id: 'exp-sub-9-6', name: 'Assurance responsabilité civile pro (RC Pro)', criticality: 'critical' },
        { id: 'exp-sub-9-7', name: 'Fournitures de bureau', criticality: 'essential' },
        { id: 'exp-sub-9-8', name: 'Petit équipement', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-10', name: 'FINANCES & ASSURANCES', isDefault: true, subCategories: [
        { id: 'exp-sub-10-1', name: 'Intérêts d\'emprunts', criticality: 'critical' },
        { id: 'exp-sub-10-2', name: 'Frais bancaires', criticality: 'essential' },
        { id: 'exp-sub-10-3', name: 'Assurance emprunteur', criticality: 'critical' },
        { id: 'exp-sub-10-4', name: 'Autres assurances', criticality: 'essential' },
    ]},
    { id: 'exp-main-11', name: 'IMPÔTS & CONTRIBUTIONS', isDefault: true, subCategories: [
        { id: 'exp-sub-11-1', name: 'Impôt sur le revenu / sur les sociétés', criticality: 'critical' },
        { id: 'exp-sub-11-2', name: 'Taxe d\'habitation', criticality: 'critical' },
        { id: 'exp-sub-11-3', name: 'Cotisation Foncière des Entreprises (CFE)', criticality: 'critical' },
        { id: 'exp-sub-11-4', name: 'TVA à payer', isFixed: true, criticality: 'critical' },
        { id: 'exp-sub-11-5', name: 'Dons et mécénat', criticality: 'discretionary' },
        { id: 'exp-sub-11-6', name: 'TVA déductible', isFixed: true, criticality: 'critical' },
        { id: 'exp-sub-11-7', name: 'TVA collectée', isFixed: true, criticality: 'critical' },
    ]},
    { id: 'exp-main-12', name: 'FAMILLE & ENFANTS', isDefault: true, subCategories: [
        { id: 'exp-sub-12-1', name: 'Frais de scolarité et garde', criticality: 'critical' },
        { id: 'exp-sub-12-2', name: 'Activités extrascolaires', criticality: 'discretionary' },
        { id: 'exp-sub-12-3', name: 'Vêtements et fournitures pour enfants', criticality: 'essential' },
    ]},
    { id: 'exp-main-13', name: 'ÉPARGNE & DOSSIERS', isDefault: true, subCategories: [
        { id: 'exp-sub-13-1', name: 'Versement épargne', criticality: 'discretionary' },
        { id: 'exp-sub-13-2', name: 'Épargne retraite (PER)', criticality: 'discretionary' },
        { id: 'exp-sub-13-3', name: 'Frais divers et imprévus', criticality: 'essential' },
    ]},
    { id: 'exp-main-14', name: 'AMEUBLEMENT, ÉQUIPEMENT & DÉCORATION', isDefault: true, subCategories: [
        { id: 'exp-sub-14-1', name: 'Mobilier & Agencement', criticality: 'discretionary' },
        { id: 'exp-sub-14-2', name: 'Électroménager', criticality: 'essential' },
        { id: 'exp-sub-14-3', name: 'Décoration & Ambiance', criticality: 'discretionary' },
        { id: 'exp-sub-14-4', name: 'Linge de maison', criticality: 'discretionary' },
        { id: 'exp-sub-14-5', name: 'Jardin & Extérieur', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-15', name: 'FINANCEMENTS & CRÉDITS (Remboursements)', isDefault: true, subCategories: [
        { id: 'exp-sub-15-1', name: 'Prêt résidence principale', criticality: 'critical' },
        { id: 'exp-sub-15-2', name: 'Prêt investissement locatif', criticality: 'critical' },
        { id: 'exp-sub-15-3', name: 'Prêt travaux', criticality: 'critical' },
        { id: 'exp-sub-15-4', name: 'Prêt automobile', criticality: 'critical' },
        { id: 'exp-sub-15-5', name: 'Crédit renouvelable', criticality: 'critical' },
        { id: 'exp-sub-15-6', name: 'Prêt personnel', criticality: 'critical' },
        { id: 'exp-sub-15-7', name: 'Prêt équipement pro', criticality: 'critical' },
        { id: 'exp-sub-15-8', name: 'Crédit bail (leasing)', criticality: 'critical' },
        { id: 'exp-sub-15-9', name: 'Prêt trésorerie', criticality: 'critical' },
        { id: 'exp-sub-15-10', name: 'Dette familiale', criticality: 'essential' },
        { id: 'exp-sub-15-11', name: 'Dette associatives', criticality: 'essential' },
        { id: 'exp-sub-15-12', name: 'Découvert bancaire', criticality: 'critical' },
    ]},
    
  ]
};

const initialSettings = { 
  displayUnit: 'standard', decimalPlaces: 2, currency: 'EUR', exchangeRates: {}, timezoneOffset: 0,
};

// Fonction utilitaire pour générer des UUID
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Fonction pour simuler des données d'utilisateur
// Dans votre DataContext.js, modifiez getMockUserData :
const getMockUserData = () => ({
  id: 3, // Changer de 'mock-user-id' à 2 pour correspondre à vos templates
  email: 'demo@example.com',
  user_metadata: { name: 'Utilisateur Démo' }
});
// Fonction pour simuler des données de session
const getMockSession = () => ({
  user: getMockUserData(),
  access_token: 'mock-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600
});

const getInitialDataState = () => ({
    session: null, 
    profile: null, 
    allProfiles: [], 
    projects: [], 
    categories: initialCategories, 
    allEntries: {},
    allActuals: {}, 
    allCashAccounts: {}, 
    tiers: [], 
    settings: initialSettings, 
    scenarios: [], 
    scenarioEntries: {},
    loans: [], 
    allComments: {}, 
    consolidatedViews: [], 
    collaborators: [], 
    templates: [], 
    vatRates: {}, 
    vatRegimes: {},
    taxConfigs: [], 
    exchangeRates: null,
});

const dataReducer = (state, action) => {
    switch (action.type) {
        case 'SET_TEMPLATES':
            console.log('🔄 SET_TEMPLATES action:', action.payload);
            return { ...state, templates: action.payload };
        case 'SET_SESSION':
            return { ...state, session: action.payload };
        case 'SET_PROFILE':
            return { ...state, profile: action.payload };
        case 'SET_EXCHANGE_RATES':
            return { ...state, exchangeRates: action.payload };
        case 'SET_INITIAL_DATA': {
            const { customCategoriesRes, ...restPayload } = action.payload;
            const fetchedCategories = customCategoriesRes || [];
            const customMain = fetchedCategories.filter(c => !c.parent_id);
            const customSubs = fetchedCategories.filter(c => c.parent_id);
            const finalCategories = JSON.parse(JSON.stringify(initialCategories));

            // Merge default and custom main categories
            customMain.forEach(main => {
                if (!finalCategories[main.type].some(m => m.id === main.id)) {
                    finalCategories[main.type].push({ id: main.id, name: main.name, isFixed: main.is_fixed, subCategories: [] });
                }
            });

            // Merge default and custom sub-categories
            customSubs.forEach(sub => {
                let parent = finalCategories.revenue.find(m => m.id === sub.parent_id) || finalCategories.expense.find(m => m.id === sub.parent_id);
                if (parent && !parent.subCategories.some(s => s.id === sub.id)) {
                    parent.subCategories.push({ id: sub.id, name: sub.name, isFixed: sub.is_fixed, criticality: sub.criticality || 'essential' });
                }
            });

            return {
                ...state,
                ...restPayload,
                categories: finalCategories,
                allProfiles: action.payload.allProfiles || [],
                taxConfigs: action.payload.taxConfigs || [],
            };
        }
        case 'RESET_DATA_STATE':
            return getInitialDataState();
        case 'FORCE_DATA_RELOAD':
            return { ...state, profile: null };
// Dans votre dataReducer
case 'INITIALIZE_PROJECT_SUCCESS': {
  const { newProject, finalCashAccounts, newAllEntries, newAllActuals, newTiers, newLoans, newCategories } = action.payload;
  return {
    ...state,
    projects: [...state.projects, newProject],
    allEntries: { ...state.allEntries, [newProject.id]: newAllEntries },
    allActuals: { ...state.allActuals, [newProject.id]: newAllActuals },
    allCashAccounts: { ...state.allCashAccounts, [newProject.id]: finalCashAccounts },
    tiers: newTiers,
    loans: [...state.loans, ...newLoans],
    categories: newCategories || state.categories,
  };
}
        case 'UPDATE_PROJECT_SETTINGS_SUCCESS': {
            return {
                ...state,
                projects: state.projects.map(p => p.id === action.payload.projectId ? { ...p, ...action.payload.newSettings } : p),
            };
        }
        case 'SAVE_ENTRY_SUCCESS': {
            const { savedEntry, newActuals, targetProjectId, newTier } = action.payload;
            const projectEntries = state.allEntries[targetProjectId] || [];
            const projectActuals = state.allActuals[targetProjectId] || [];
            const entryIndex = projectEntries.findIndex(e => e.id === savedEntry.id);
            const updatedEntries = entryIndex > -1 ? projectEntries.map((e, i) => i === entryIndex ? savedEntry : e) : [...projectEntries, savedEntry];
            const updatedActuals = projectActuals.filter(a => a.budgetId !== savedEntry.id || !['pending', 'partially_paid', 'partially_received'].includes(a.status)).concat(newActuals);
            return {
                ...state,
                allEntries: { ...state.allEntries, [targetProjectId]: updatedEntries },
                allActuals: { ...state.allActuals, [targetProjectId]: updatedActuals },
                tiers: newTier ? [...state.tiers, newTier] : state.tiers,
            };
        }
        case 'DELETE_ENTRY_SUCCESS': {
            const { entryId, entryProjectId } = action.payload;
            const projectEntries = (state.allEntries[entryProjectId] || []).filter(e => e.id !== entryId);
            const projectActuals = (state.allActuals[entryProjectId] || []).filter(a => a.budgetId !== entryId);
            return {
                ...state,
                allEntries: { ...state.allEntries, [entryProjectId]: projectEntries },
                allActuals: { ...state.allActuals, [entryProjectId]: projectActuals },
            };
        }
        case 'DELETE_PROJECT_SUCCESS': {
            const projectId = action.payload;
            const { [projectId]: _, ...remainingEntries } = state.allEntries;
            const { [projectId]: __, ...remainingActuals } = state.allActuals;
            const { [projectId]: ___, ...remainingCashAccounts } = state.allCashAccounts;
            return {
                ...state,
                projects: state.projects.filter(p => p.id !== projectId),
                allEntries: remainingEntries,
                allActuals: remainingActuals,
                allCashAccounts: remainingCashAccounts,
            };
        }
        case 'UPDATE_SETTINGS_SUCCESS':
            return { ...state, settings: action.payload };
        case 'UPDATE_USER_CASH_ACCOUNT_SUCCESS': {
            const { projectId, accountId, accountData } = action.payload;
            const projectAccounts = state.allCashAccounts[projectId] || [];
            const updatedAccounts = projectAccounts.map(acc => acc.id === accountId ? { ...acc, ...accountData } : acc);
            return {
                ...state,
                allCashAccounts: { ...state.allCashAccounts, [projectId]: updatedAccounts },
            };
        }
        case 'ADD_USER_CASH_ACCOUNT_SUCCESS': {
            const { projectId, newAccount } = action.payload;
            const projectAccounts = state.allCashAccounts[projectId] || [];
            return {
                ...state,
                allCashAccounts: { ...state.allCashAccounts, [projectId]: [...projectAccounts, newAccount] },
            };
        }
        case 'DELETE_USER_CASH_ACCOUNT': {
            const { projectId, accountId } = action.payload;
            const projectAccounts = (state.allCashAccounts[projectId] || []).filter(acc => acc.id !== accountId);
            return {
                ...state,
                allCashAccounts: { ...state.allCashAccounts, [projectId]: projectAccounts },
            };
        }
        case 'SAVE_ACTUAL_SUCCESS': {
            const { finalActualData, newTier } = action.payload;
            const { projectId } = finalActualData;
            const projectActuals = state.allActuals[projectId] || [];
            const actualIndex = projectActuals.findIndex(a => a.id === finalActualData.id);
            const updatedActuals = actualIndex > -1 ? projectActuals.map((a, i) => i === actualIndex ? finalActualData : a) : [...projectActuals, finalActualData];
            return {
                ...state,
                allActuals: { ...state.allActuals, [projectId]: updatedActuals },
                tiers: newTier ? [...state.tiers, newTier] : state.tiers,
            };
        }
        case 'DELETE_ACTUAL_SUCCESS': {
            const actualId = action.payload;
            const newAllActuals = { ...state.allActuals };
            for (const projectId in newAllActuals) {
                newAllActuals[projectId] = newAllActuals[projectId].filter(a => a.id !== actualId);
            }
            return { ...state, allActuals: newAllActuals };
        }
        case 'RECORD_PAYMENT_SUCCESS': {
            const { updatedActual } = action.payload;
            const { projectId } = updatedActual;
            const projectActuals = state.allActuals[projectId] || [];
            const updatedProjectActuals = projectActuals.map(a => a.id === updatedActual.id ? { ...a, status: updatedActual.status, payments: updatedActual.payments } : a);
            return {
                ...state,
                allActuals: { ...state.allActuals, [projectId]: updatedProjectActuals },
            };
        }
        case 'WRITE_OFF_ACTUAL_SUCCESS': {
            const updatedActual = action.payload;
            const { projectId } = updatedActual;
            const projectActuals = state.allActuals[projectId] || [];
            const updatedProjectActuals = projectActuals.map(a => a.id === updatedActual.id ? { ...a, ...updatedActual } : a);
            return {
                ...state,
                allActuals: { ...state.allActuals, [projectId]: updatedProjectActuals },
            };
        }
        case 'ADD_CONSOLIDATED_VIEW_SUCCESS':
            return { ...state, consolidatedViews: [...state.consolidatedViews, action.payload] };
        case 'UPDATE_CONSOLIDATED_VIEW_SUCCESS':
            return { ...state, consolidatedViews: state.consolidatedViews.map(v => v.id === action.payload.id ? action.payload : v) };
        case 'DELETE_CONSOLIDATED_VIEW_SUCCESS':
            return { ...state, consolidatedViews: state.consolidatedViews.filter(v => v.id !== action.payload) };
        case 'INVITE_COLLABORATOR_SUCCESS':
            return { ...state, collaborators: [...state.collaborators, action.payload] };
        case 'REVOKE_COLLABORATOR_SUCCESS':
            return { ...state, collaborators: state.collaborators.filter(c => c.id !== action.payload) };
        case 'ACCEPT_INVITE_SUCCESS': {
            const { acceptedInvite, newProjects } = action.payload;
            const updatedProjects = [...state.projects];
            (newProjects || []).forEach(np => {
                if (!updatedProjects.some(p => p.id === np.id)) {
                    updatedProjects.push(np);
                }
            });
            return {
                ...state,
                collaborators: state.collaborators.map(c => c.id === acceptedInvite.id ? acceptedInvite : c),
                projects: updatedProjects,
            };
        }
        case 'UPDATE_PROFILE_NOTIFICATIONS':
            return { ...state, profile: { ...state.profile, notifications: action.payload } };
        case 'ADD_SCENARIO_SUCCESS':
            return { ...state, scenarios: [...state.scenarios, action.payload] };
        case 'UPDATE_SCENARIO_SUCCESS':
            return { ...state, scenarios: state.scenarios.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'TOGGLE_SCENARIO_VISIBILITY':
            return { ...state, scenarios: state.scenarios.map(s => s.id === action.payload ? { ...s, isVisible: !s.isVisible } : s) };
        case 'DELETE_SCENARIO':
            return { ...state, scenarios: state.scenarios.filter(s => s.id !== action.payload) };
        case 'ARCHIVE_SCENARIO':
            return { ...state, scenarios: state.scenarios.map(s => s.id === action.payload ? { ...s, isArchived: true } : s) };
        case 'RESTORE_SCENARIO':
            return { ...state, scenarios: state.scenarios.map(s => s.id === action.payload ? { ...s, isArchived: false } : s) };
        case 'SAVE_SCENARIO_ENTRY_SUCCESS': {
            const { scenarioId, savedEntry } = action.payload;
            const scenarioDeltas = state.scenarioEntries[scenarioId] || [];
            const entryIndex = scenarioDeltas.findIndex(e => e.id === savedEntry.id);
            const updatedDeltas = entryIndex > -1 ? scenarioDeltas.map((e, i) => i === entryIndex ? savedEntry : e) : [...scenarioDeltas, savedEntry];
            return {
                ...state,
                scenarioEntries: { ...state.scenarioEntries, [scenarioId]: updatedDeltas },
            };
        }
        case 'DELETE_SCENARIO_ENTRY_SUCCESS': {
            const { scenarioId, entryId } = action.payload;
            const scenarioDeltas = state.scenarioEntries[scenarioId] || [];
            const updatedDeltas = scenarioDeltas.map(e => e.id === entryId ? { ...e, isDeleted: true } : e);
            return {
                ...state,
                scenarioEntries: { ...state.scenarioEntries, [scenarioId]: updatedDeltas },
            };
        }
        case 'ADD_TEMPLATE_SUCCESS':
            return { ...state, templates: [...state.templates, action.payload] };
        case 'UPDATE_TEMPLATE_SUCCESS':
            return { ...state, templates: state.templates.map(t => t.id === action.payload.id ? action.payload : t) };
        case 'DELETE_TEMPLATE_SUCCESS':
            return { ...state, templates: state.templates.filter(t => t.id !== action.payload) };
        case 'ADD_MAIN_CATEGORY_SUCCESS': {
            const { type, newCategory } = action.payload;
            return {
                ...state,
                categories: {
                    ...state.categories,
                    [type]: [...state.categories[type], newCategory]
                }
            };
        }
        case 'ADD_SUB_CATEGORY_SUCCESS': {
            const { type, mainCategoryId, newSubCategory } = action.payload;
            const newCategories = { ...state.categories };
            const mainCatIndex = newCategories[type].findIndex(mc => mc.id === mainCategoryId);
            if (mainCatIndex > -1) {
                newCategories[type][mainCatIndex].subCategories.push(newSubCategory);
            }
            return { ...state, categories: newCategories };
        }
        case 'UPDATE_SUB_CATEGORY_CRITICALITY': {
            const { subCategoryId, newCriticality, type, parentId } = action.payload;
            const newCategories = { ...state.categories };
            const mainCat = newCategories[type].find(mc => mc.id === parentId);
            if (mainCat) {
                const subCat = mainCat.subCategories.find(sc => sc.id === subCategoryId);
                if (subCat) {
                    subCat.criticality = newCriticality;
                }
            }
            return { ...state, categories: newCategories };
        }
        case 'SAVE_TAX_CONFIG_SUCCESS': {
            const newConfig = action.payload;
            const existingIndex = state.taxConfigs.findIndex(tc => tc.id === newConfig.id);
            let newTaxConfigs;
            if (existingIndex > -1) {
                newTaxConfigs = state.taxConfigs.map((tc, i) => i === existingIndex ? newConfig : tc);
            } else {
                newTaxConfigs = [...state.taxConfigs, newConfig];
            }
            return { ...state, taxConfigs: newTaxConfigs };
        }
        case 'DELETE_TAX_CONFIG_SUCCESS': {
            return { ...state, taxConfigs: state.taxConfigs.filter(tc => tc.id !== action.payload) };
        }
        case 'ADD_TIER': {
            const { name, type } = action.payload;
            const newTier = { id: uuidv4(), name, type };
            return { ...state, tiers: [...state.tiers, newTier] };
        }
        case 'UPDATE_TIER_SUCCESS': {
            const updatedTier = action.payload;
            return { ...state, tiers: state.tiers.map(t => t.id === updatedTier.id ? updatedTier : t) };
        }
        case 'DELETE_TIER': {
            return { ...state, tiers: state.tiers.filter(t => t.id !== action.payload) };
        }
        case 'ADD_COMMENT_SUCCESS': {
            const { projectId, ...comment } = action.payload;
            const targetProjectId = projectId || 'global';
            const projectComments = state.allComments[targetProjectId] || [];
            return {
                ...state,
                allComments: {
                    ...state.allComments,
                    [targetProjectId]: [...projectComments, comment],
                },
            };
        }
        default:
            return state;
    }
};

export const DataProvider = ({ children }) => {
    // SUPPRIMER cette ligne: const { user } = useAuth();
    const [state, dispatch] = useReducer(dataReducer, getInitialDataState());

    // Simulation de l'authentification et chargement des données initiales
    useEffect(() => {
        // Simuler une session utilisateur après un délai
        const timer = setTimeout(() => {
            const mockSession = getMockSession();
            dispatch({ type: 'SET_SESSION', payload: mockSession });
            dispatch({ type: 'SET_PROFILE', payload: mockSession.user });
            
            // Simuler des données d'échange
            dispatch({ 
                type: 'SET_EXCHANGE_RATES', 
                payload: {
                    EUR: 1,
                    USD: 1.08,
                    GBP: 0.85
                }
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <DataContext.Provider value={{ dataState: state, dataDispatch: dispatch }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};