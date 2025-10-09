import axios from 'axios';

const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

// Configuration Vite - utilisation des import.meta.env
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const MOCK_DELAY = parseInt(import.meta.env.VITE_MOCK_DELAY) || 500;
const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (isLocalhost ? 'http://localhost:8000/api' : 'https://trezo.cash/api');

console.log('🔧 Configuration Vite:', {
    USE_MOCK_DATA,
    MOCK_DELAY,
    API_BASE_URL,
    env: import.meta.env.MODE
});
// Données mock complètes

// Simulateur de délai réseau
const simulateNetworkDelay = () =>
    new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

// Gestionnaire mock pour les requêtes
const mockHandler = {
    async get(url, config = {}) {
        await simulateNetworkDelay();

        const endpoint = url.split('?')[0].replace('/api/', '');
        const params = new URLSearchParams(url.split('?')[1]);

        let data = mockData[endpoint]?.data || [];

        // Filtrage basique par query params
        if (params.has('project_id')) {
            const projectId = parseInt(params.get('project_id'));
            data = data.filter(item => item.project_id === projectId);
        }

        if (params.has('budget_entry_id')) {
            const budgetId = parseInt(params.get('budget_entry_id'));
            data = data.filter(item => item.budget_id === budgetId);
        }

        if (params.has('name') && params.has('type')) {
            const name = params.get('name');
            const type = params.get('type');
            data = data.filter(item =>
                item.name?.toLowerCase().includes(name.toLowerCase()) &&
                item.type === type
            );
        }

        return {
            data: { data },
            status: 200,
            statusText: 'OK'
        };
    },

    async post(url, data, config = {}) {
        await simulateNetworkDelay();

        const endpoint = url.replace('/api/', '');
        const mockCollection = mockData[endpoint]?.data || [];

        // Génération d'ID simulé
        const newId = Math.max(...mockCollection.map(item => item.id), 0) + 1;
        const newItem = {
            id: newId,
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Simulation d'ajout en mémoire (ne persiste pas)
        mockCollection.push(newItem);

        return {
            data: { data: newItem },
            status: 201,
            statusText: 'Created'
        };
    },

    async put(url, data, config = {}) {
        await simulateNetworkDelay();

        const endpoint = url.split('/').slice(0, -1).join('/').replace('/api/', '');
        const id = parseInt(url.split('/').pop());
        const mockCollection = mockData[endpoint]?.data || [];

        const itemIndex = mockCollection.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            throw {
                response: {
                    status: 404,
                    statusText: 'Not Found',
                    data: { message: 'Resource not found' }
                }
            };
        }

        const updatedItem = {
            ...mockCollection[itemIndex],
            ...data,
            updated_at: new Date().toISOString()
        };

        // Simulation de mise à jour en mémoire
        mockCollection[itemIndex] = updatedItem;

        return {
            data: { data: updatedItem },
            status: 200,
            statusText: 'OK'
        };
    },

    async delete(url, config = {}) {
        await simulateNetworkDelay();

        const endpoint = url.split('/').slice(0, -1).join('/').replace('/api/', '');
        const id = parseInt(url.split('/').pop());
        const mockCollection = mockData[endpoint]?.data || [];

        const itemIndex = mockCollection.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            throw {
                response: {
                    status: 404,
                    statusText: 'Not Found',
                    data: { message: 'Resource not found' }
                }
            };
        }

        // Simulation de suppression en mémoire
        mockCollection.splice(itemIndex, 1);

        return {
            data: { message: 'Resource deleted successfully' },
            status: 200,
            statusText: 'OK'
        };
    }
};

// Configuration Axios
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour utiliser les mocks si activé
api.interceptors.request.use(
    async (config) => {
        // Si les mocks sont activés, intercepter la requête
        if (USE_MOCK_DATA) {
            console.log(`🔄 Mock API: ${config.method?.toUpperCase()} ${config.url}`);

            try {
                const handler = mockHandler[config.method];
                if (handler) {
                    const response = await handler(config.url, config.data, config);
                    throw { isMock: true, response }; // Throw special pour l'intercepteur response
                }
            } catch (error) {
                if (error.isMock) {
                    throw error; // Propager l'erreur mock vers l'intercepteur response
                }
                throw error;
            }
        }

        // Sinon, continuer avec l'authentification normale
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Intercepteur de réponse
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Gérer les réponses mock
        if (error.isMock) {
            console.log(`✅ Mock Response:`, error.response);
            return Promise.resolve(error.response);
        }

        // Gérer les erreurs d'authentification
        if (error.response?.status === 401) {
            console.warn('❌ Token invalide ou expiré, déconnexion automatique.');
            localStorage.removeItem('auth_token');
            if (window.location.pathname !== '/login') {
                window.location.replace('/login');
            }
        }

        return Promise.reject(error);
    }
);

// Export des utilitaires mock
export const mockUtils = {
    enableMocks: () => {
        if (USE_MOCK_DATA) {
            console.log('🎭 Mock API activé - Utilisation des données de test');
        }
    },

    getMockData: (endpoint) => {
        return mockData[endpoint]?.data || [];
    },

    setMockData: (endpoint, data) => {
        if (mockData[endpoint]) {
            mockData[endpoint].data = data;
        }
    },

    resetMockData: () => {
        // Recharger les données mock originales
        Object.keys(mockData).forEach(key => {
            // Dans une vraie implémentation, on rechargerait depuis un fichier
            console.log(`Mock data reset for: ${key}`);
        });
    }
};

// Activer les mocks au chargement
mockUtils.enableMocks();

export default api;