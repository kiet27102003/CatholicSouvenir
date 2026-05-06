import axios from 'axios';
import { startLoading, stopLoading } from '../context/loadingStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API || 'https://catholic-souvenir-api.southeastasia.cloudapp.azure.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        startLoading();
        const storedUser = localStorage.getItem('sanctus_user') || sessionStorage.getItem('sanctus_user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user && user.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            } catch {
                // Ignore parse errors
            }
        }
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        stopLoading();
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        stopLoading();
        return response;
    },
    (error) => {
        stopLoading();
        return Promise.reject(error);
    }
);

export default api;
