import api from '../cofig/api';

/**
 * Payload for creating a product (POST /api/product).
 * Server may return full schema including productUuid, createdAt, orderDetails, version.
 */
export const createProduct = async (payload) => {
    const response = await api.post('/product', payload);
    return response.data;
};

export default {
    createProduct,
};
