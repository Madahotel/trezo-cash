import axios from '../components/config/Axios';

export const archiveService = {
    async archiveProject(projectId, reason) {
        const token = localStorage.getItem('token');
        return axios.patch(`/projects/${projectId}/archive`, { reason }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
    },
    async restoreProject(projectId) {
        const token = localStorage.getItem('token');
        return axios.patch(`/projects/${projectId}/restore`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
    },
};

