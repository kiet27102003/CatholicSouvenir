import api from '../cofig/api';

/**
 * Tạo sản phẩm (POST /api/product) - multipart/form-data.
 * @param {Object} payload
 * @param {string} payload.productName - Bắt buộc
 * @param {string} [payload.productDescription]
 * @param {number} payload.productPrice - Bắt buộc, >= 0
 * @param {number} payload.quantity - Bắt buộc, >= 0 (integer)
 * @param {string} [payload.material]
 * @param {string} [payload.size]
 * @param {File} [payload.image] - Một file ảnh (upload Cloudinary)
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const createProduct = async (payload) => {
    try {
        const formData = new FormData();
        formData.append('productName', (payload.productName ?? '').trim());
        if (payload.productDescription != null && String(payload.productDescription).trim() !== '') {
            formData.append('productDescription', String(payload.productDescription).trim());
        }
        formData.append('productPrice', Number(payload.productPrice));
        formData.append('quantity', Math.max(0, Math.floor(Number(payload.quantity))));
        if (payload.material != null && String(payload.material).trim() !== '') {
            formData.append('material', String(payload.material).trim());
        }
        if (payload.size != null && String(payload.size).trim() !== '') {
            formData.append('size', String(payload.size).trim());
        }
        if (payload.image instanceof File) {
            formData.append('image', payload.image);
        }

        const response = await api.post('/product', formData);
        const res = response.data;

        if (res?.code !== 200) {
            return {
                success: false,
                error: res?.message || 'Tạo sản phẩm thất bại.',
            };
        }
        return {
            success: true,
            data: res?.data ?? {},
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Tạo sản phẩm thất bại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lỗi không xác định.',
        };
    }
};

/**
 * Lấy chi tiết sản phẩm theo ID (GET /api/product/{productId}).
 * Response: { code: 200, message, data: { productId, productName, productPrice, productDescription, ... } }
 * @param {string|number} productId - ID sản phẩm
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const getProductById = async (productId) => {
    try {
        const response = await api.get(`/product/${productId}`);
        const res = response.data;

        if (res?.code !== 200) {
            return {
                success: false,
                error: res?.message || 'Không tìm thấy sản phẩm.',
            };
        }

        return {
            success: true,
            data: res?.data ?? {},
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Không tải được thông tin sản phẩm.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lỗi không xác định.',
        };
    }
};

/**
 * Lấy danh sách tất cả sản phẩm (GET /api/product).
 * Response: { code: 200, message, data: [{ productId, productName, productPrice, ... }] }
 * @returns {Promise<{ success: boolean, data?: Array, error?: string }>}
 */
export const getProducts = async () => {
    try {
        const response = await api.get('/product');
        const res = response.data;

        if (res?.code !== 200) {
            return {
                success: false,
                error: res?.message || 'Lấy danh sách sản phẩm thất bại.',
            };
        }

        // API có thể trả data là mảng trực tiếp hoặc object phân trang { content: [...] }
        const raw = res?.data;
        const data = Array.isArray(raw)
            ? raw
            : (Array.isArray(raw?.content) ? raw.content : []);
        return {
            success: true,
            data,
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Lấy danh sách sản phẩm thất bại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lỗi không xác định.',
        };
    }
};

/**
 * Cập nhật trạng thái sản phẩm (PUT /api/product/admin/{productId}) - Admin only.
 * @param {string} productId - ID sản phẩm
 * @param {Object} payload
 * @param {string} payload.status - APPROVED | REJECTED
 * @param {string} [payload.rejectionReason] - Bắt buộc khi status === 'REJECTED'
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const updateProductStatus = async (productId, payload) => {
    try {
        const body = {
            status: payload.status,
            ...(payload.rejectionReason != null && { rejectionReason: String(payload.rejectionReason).trim() }),
        };

        const response = await api.put(`/product/admin/${productId}`, body);
        const res = response.data;

        if (res?.code !== 200) {
            return {
                success: false,
                error: res?.message || 'Cập nhật trạng thái thất bại.',
            };
        }
        return {
            success: true,
            data: res?.data ?? {},
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Cập nhật trạng thái thất bại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lỗi không xác định.',
        };
    }
};

/**
 * Cập nhật thông tin sản phẩm (PUT /api/product/{productId}) - không bao gồm hình ảnh.
 * @param {string} productId - ID sản phẩm
 * @param {Object} payload
 * @param {string} payload.productName - Bắt buộc
 * @param {string} [payload.productDescription]
 * @param {number} payload.productPrice - Bắt buộc, >= 0
 * @param {number} payload.quantity - Bắt buộc, >= 0
 * @param {string} [payload.material]
 * @param {string} [payload.size]
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const updateProduct = async (productId, payload) => {
    try {
        const body = {
            productName: (payload.productName ?? '').trim(),
            productDescription:
                payload.productDescription != null && String(payload.productDescription).trim() !== ''
                    ? String(payload.productDescription).trim()
                    : '',
            productPrice: Number(payload.productPrice),
            quantity: Math.max(0, Math.floor(Number(payload.quantity))),
            material:
                payload.material != null && String(payload.material).trim() !== ''
                    ? String(payload.material).trim()
                    : '',
            size:
                payload.size != null && String(payload.size).trim() !== ''
                    ? String(payload.size).trim()
                    : '',
        };

        const response = await api.put(`/product/${productId}`, body);
        const res = response.data;

        if (res?.code !== 200) {
            return {
                success: false,
                error: res?.message || 'Cập nhật sản phẩm thất bại.',
            };
        }
        return {
            success: true,
            data: res?.data ?? {},
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Cập nhật sản phẩm thất bại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lỗi không xác định.',
        };
    }
};

/**
 * Cập nhật hình ảnh sản phẩm (PUT /api/product-image/{productId}).
 * @param {string} productId - ID sản phẩm
 * @param {Object} payload
 * @param {string[]} [payload.deleteImageIds] - Danh sách ID ảnh cần xóa
 * @param {string[]} [payload.newImages] - Danh sách ảnh mới (URL hoặc base64 data URL)
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const updateProductImages = async (productId, payload) => {
    try {
        const body = {
            deleteImageIds: Array.isArray(payload.deleteImageIds)
                ? payload.deleteImageIds.filter((id) => id != null && String(id).trim() !== '')
                : [],
            newImages: Array.isArray(payload.newImages)
                ? payload.newImages.filter((s) => s != null && String(s).trim() !== '')
                : [],
        };

        const response = await api.put(`/product-image/${productId}`, body);
        const res = response.data;

        if (res?.code !== 200) {
            return {
                success: false,
                error: res?.message || 'Cập nhật ảnh sản phẩm thất bại.',
            };
        }
        return {
            success: true,
            data: res?.data ?? {},
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Cập nhật ảnh sản phẩm thất bại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lỗi không xác định.',
        };
    }
};

/**
 * Xóa sản phẩm (DELETE /api/product/{productId}).
 * @param {string} productId - ID sản phẩm
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const deleteProduct = async (productId) => {
    try {
        const response = await api.delete(`/product/${productId}`);
        const res = response?.data;
        // API có thể trả 200 { code: 200 } hoặc 204 No Content
        if (response?.status >= 200 && response?.status < 300) {
            if (res?.code != null && res.code !== 200) {
                return {
                    success: false,
                    error: res?.message || 'Xóa sản phẩm thất bại.',
                };
            }
            return { success: true };
        }
        return {
            success: false,
            error: res?.message || 'Xóa sản phẩm thất bại.',
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Xóa sản phẩm thất bại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lỗi không xác định.',
        };
    }
};

/**
 * Lấy danh sách sản phẩm do artisan đăng.
 * API: GET {baseURL}/product/artisan/{artisanId}?status=APPROVED&page=0&size=10&sort=createdAt,DESC
 * Response: { code: 200, data: { content: [...], totalElements, totalPages, number, size, first, last, empty } }
 * @param {string|number} artisanId - ID artisan
 * @param {Object} [options] - Query params
 * @param {string} [options.status] - PENDING | APPROVED | REJECTED (optional)
 * @param {number} [options.page=0] - Trang (0-based)
 * @param {number} [options.size=10] - Số phần tử mỗi trang
 * @param {string} [options.sort='createdAt,DESC'] - Sort (axios encode thành createdAt%2CDESC)
 * @returns {Promise<{ success: boolean, data?: { content, totalElements, totalPages, number, size }, error?: string }>}
 */
export const getProductsByArtisan = async (artisanId, options = {}) => {
    try {
        const { status, page = 0, size = 10, sort = 'createdAt,DESC' } = options;
        const params = { page, size, sort };
        if (status != null && status !== '') params.status = status;

        const response = await api.get(`/product/artisan/${artisanId}`, { params });
        const res = response.data;

        if (res?.code !== 200) {
            return {
                success: false,
                error: res?.message || 'Lấy danh sách sản phẩm thất bại.',
            };
        }

        const data = res?.data ?? {};
        const content = data.content;
        return {
            success: true,
            data: {
                content: Array.isArray(content) ? content : [],
                totalElements: data.totalElements ?? 0,
                totalPages: data.totalPages ?? 0,
                number: data.number ?? 0,
                size: data.size ?? size,
                first: data.first ?? true,
                last: data.last ?? true,
                empty: data.empty ?? true,
            },
        };
    } catch (error) {
        const message =
            error.response?.data?.message ??
            error.message ??
            'Lấy danh sách sản phẩm thất bại.';
        return {
            success: false,
            error: typeof message === 'string' ? message : 'Lỗi không xác định.',
        };
    }
};

export default {
    createProduct,
    getProducts,
    getProductById,
    getProductsByArtisan,
    updateProduct,
    updateProductImages,
    updateProductStatus,
    deleteProduct,
};
