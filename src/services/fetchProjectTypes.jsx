import { apiService } from '../utils/ApiService';

export const fetchProjectTypes = async () => {
    try {
        const response = await apiService.get('/project-types');
        if (response && Array.isArray(response)) {
            console.log('✅ Types de projet chargés avec succès:', response.length);
            return response;
        }
        if (response && response.data && Array.isArray(response.data)) {
            return response.data;
        }
        if (response && Array.isArray(response) && response.length === 0) {
            return [];
        }
        return [];

    } catch (error) {

        return [];
    }
};