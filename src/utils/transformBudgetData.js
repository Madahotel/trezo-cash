// Dans transformBudgetData.js - CORRECTION
export const transformBudgetData = (apiData) => {
    console.log('=== TRANSFORM BUDGET DATA DEBUG ===');

    if (!apiData || !apiData.entries || !apiData.exits) {
        console.log('Données API incomplètes');
        return { entries: [], actualTransactions: [], cashAccounts: [], totals: {} };
    }

    // Fonction pour créer une description significative
    const createMeaningfulDescription = (item) => {
        // Si description existe et n'est pas null, on l'utilise
        if (item.description && item.description !== null && item.description !== 'null') {
            return item.description;
        }
        
        // Sinon, on crée une description basée sur d'autres champs
        const frequency = item.frequency_name || 'ponctuel';
        const amount = parseFloat(item.amount) || 0;
        const category = item.sub_category_name || item.category_name;
        
        return `${category} - ${frequency} - ${formatCurrency(amount, { currency: item.currency_code || 'EUR' })}`;
    };

    // Transformation des entrées (revenues)
    const entries = apiData.entries.entry_items.sub_categories.map(item => {
        const actualType = (item.budget_type_id === 2 && item.budget_type_name === "Sortie") 
            ? 'revenu' 
            : (item.budget_type_id === 1 && item.budget_type_name === "Entrée") 
                ? 'depense' 
                : item.category_type_name?.toLowerCase() === 'revenue' ? 'revenu' : 'depense';

        return {
            id: item.id,
            supplier: item.user_third_party_name,
            category: item.sub_category_name,
            categoryId: item.sub_category_id,
            mainCategory: item.category_name,
            mainCategoryId: item.category_id,
            amount: parseFloat(item.amount) || 0,
            type: actualType,
            // CORRECTION: Utiliser la fonction pour créer une description
            description: createMeaningfulDescription(item),
            startDate: item.start_date,
            endDate: item.end_date,
            is_duration_indefinite: item.is_duration_indefinite,
            projectId: item.project_id,
            projectName: item.project_name,
            frequency: item.frequency_name?.toLowerCase() || 'ponctuel',
            currency: item.currency_code,
            criticality: item.criticity_name?.toLowerCase(),
            _original: {
                budget_type_id: item.budget_type_id,
                budget_type_name: item.budget_type_name,
                category_type_name: item.category_type_name,
                original_description: item.description // Garder la valeur originale pour debug
            }
        };
    });

    // Même correction pour les exits
    const exits = apiData.exits.exit_items.sub_categories.map(item => {
        const actualType = (item.budget_type_id === 2 && item.budget_type_name === "Sortie") 
            ? 'revenu' 
            : (item.budget_type_id === 1 && item.budget_type_name === "Entrée") 
                ? 'depense' 
                : item.category_type_name?.toLowerCase() === 'revenue' ? 'revenu' : 'depense';

        return {
            id: item.id,
            supplier: item.user_third_party_name,
            category: item.sub_category_name,
            categoryId: item.sub_category_id,
            mainCategory: item.category_name,
            mainCategoryId: item.category_id,
            amount: parseFloat(item.amount) || 0,
            type: actualType,
            // CORRECTION: Utiliser la fonction pour créer une description
            description: createMeaningfulDescription(item),
            startDate: item.start_date,
            endDate: item.end_date,
            is_duration_indefinite: item.is_duration_indefinite,
            projectId: item.project_id,
            projectName: item.project_name,
            frequency: item.frequency_name?.toLowerCase() || 'ponctuel',
            currency: item.currency_code,
            criticality: item.criticity_name?.toLowerCase(),
            _original: {
                budget_type_id: item.budget_type_id,
                budget_type_name: item.budget_type_name,
                category_type_name: item.category_type_name,
                original_description: item.description
            }
        };
    });

    // Fusionner toutes les entrées
    const allEntries = [...entries, ...exits];
    
    console.log('Entrées transformées avec descriptions:', allEntries.map(e => ({
        supplier: e.supplier,
        description: e.description,
        originalDesc: e._original.original_description
    })));

    return {
        entries: allEntries,
        actualTransactions: [],
        cashAccounts: [],
        totals: {
            expenses: parseFloat(apiData.sumExpenses) || 0,
            forecast: parseFloat(apiData.sumForecast) || 0,
            entries: parseFloat(apiData.sumEntries) || 0
        }
    };
};

// Fonction helper pour formatter la currency (à ajouter)
const formatCurrency = (amount, settings) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: settings.currency || 'EUR',
        minimumFractionDigits: 2
    }).format(amount);
};