import api from '../cofig/api';

/** Decode JWT payload (base64url) without verification - only to read user info from token */
function decodeJwtPayload(token) {
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

export const authService = {
    async login(email, password) {
        try {
            const response = await api.post('/authen/login', { email, password });

            if (response.data?.code !== 200) {
                return {
                    success: false,
                    error: response.data?.message || 'Đăng nhập thất bại.',
                };
            }

            // API trả về data là chuỗi JWT token
            const token = typeof response.data?.data === 'string' ? response.data.data : response.data?.data?.token;

            if (!token) {
                return {
                    success: false,
                    error: 'Invalid response from server. Missing token.',
                };
            }

            const payload = decodeJwtPayload(token);
            const user = {
                id: payload?.accountId ?? payload?.sub,
                email: payload?.sub ?? email,
                name: payload?.name ?? email?.split('@')[0] ?? 'User',
                role: (payload?.role ?? 'ADMIN').toLowerCase(),
                token,
            };

            return {
                success: true,
                user,
            };
        } catch (error) {
            const message =
                error.response?.data?.message ??
                error.message ??
                'Invalid email or password';
            return {
                success: false,
                error: typeof message === 'string' ? message : 'Đăng nhập thất bại. Vui lòng thử lại.',
            };
        }
    },

    async getUserByEmail(email) {
        try {
            const response = await api.get('/users', { params: { email } });
            const data = response.data?.data ?? response.data;
            const list = Array.isArray(data) ? data : data?.content ?? data?.list ?? [];
            return list[0] || null;
        } catch (err) {
            console.error('Error fetching user:', err);
            return null;
        }
    },

    async register(payload) {
        try {
            const response = await api.post('/authen/register', payload);
            const code = response.data?.code;
            if (code !== undefined && code !== 200) {
                return {
                    success: false,
                    error: response.data?.message || 'Đăng ký thất bại.',
                };
            }
            return {
                success: true,
                message: response.data?.message || 'Đăng ký thành công.',
            };
        } catch (error) {
            const message =
                error.response?.data?.message ??
                error.message ??
                'Đăng ký thất bại. Vui lòng thử lại.';
            return {
                success: false,
                error: typeof message === 'string' ? message : 'Đăng ký thất bại. Vui lòng thử lại.',
            };
        }
    },

    async registerArtisan(payload) {
        try {
            const response = await api.post('/artisan-applications/register', payload);
            const code = response.data?.code;
            if (code !== undefined && code !== 200) {
                return {
                    success: false,
                    error: response.data?.message || 'Đăng ký artisan thất bại.',
                };
            }
            return {
                success: true,
                message: response.data?.message || 'Đăng ký thành công. Vui lòng chờ duyệt.',
            };
        } catch (error) {
            const message =
                error.response?.data?.message ??
                error.message ??
                'Đăng ký artisan thất bại. Vui lòng thử lại.';
            return {
                success: false,
                error: typeof message === 'string' ? message : 'Đăng ký artisan thất bại. Vui lòng thử lại.',
            };
        }
    },
};

export default authService;
