import { SUPABASE_STORAGE_BUCKET, getSupabaseStoragePublicUrl, isSupabaseConfigured } from './supabase';

const fileToArrayBuffer = async (file) => {
    if (typeof file.arrayBuffer === 'function') {
        return file.arrayBuffer();
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Không đọc được file.'));
        reader.readAsArrayBuffer(file);
    });
};

const buildStoragePath = (file, folder = 'references') => {
    const safeName = String(file?.name || 'upload')
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
};

export const uploadImageToSupabase = async (file, options = {}) => {
    if (!(file instanceof File)) {
        return { success: false, error: 'File không hợp lệ.' };
    }

    if (!isSupabaseConfigured()) {
        return {
            success: false,
            error: 'Chưa cấu hình Supabase. Hãy kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.',
        };
    }

    const folder = options.folder || 'references';
    const path = options.path || buildStoragePath(file, folder);
    const token = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${path}`;

    try {
        const arrayBuffer = await fileToArrayBuffer(file);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                apikey: token,
                'Content-Type': file.type || 'application/octet-stream',
                'x-upsert': 'true',
            },
            body: arrayBuffer,
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            const message = payload?.message || payload?.error || 'Upload ảnh thất bại.';
            return { success: false, error: message };
        }

        return {
            success: true,
            data: {
                path,
                publicUrl: getSupabaseStoragePublicUrl(path),
                raw: payload,
            },
        };
    } catch (error) {
        return { success: false, error: error?.message || 'Upload ảnh thất bại.' };
    }
};

export default {
    uploadImageToSupabase,
};
