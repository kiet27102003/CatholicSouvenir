const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'catholic';

export const SUPABASE_STORAGE_BUCKET = supabaseBucket;

export const getSupabaseConfig = () => ({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    bucket: supabaseBucket,
});

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const getSupabaseStoragePublicUrl = (path) => {
    if (!supabaseUrl || !path) return '';
    return `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${path}`;
};

export default {
    getSupabaseConfig,
    isSupabaseConfigured,
    getSupabaseStoragePublicUrl,
};
