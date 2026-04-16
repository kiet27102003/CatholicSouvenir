import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API || 'https://catholic-souvenir-api.southeastasia.cloudapp.azure.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token if available
api.interceptors.request.use(
    (config) => {
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
        // Let axios set multipart/form-data with boundary when sending FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;