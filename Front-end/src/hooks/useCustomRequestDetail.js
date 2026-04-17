import { useCallback, useEffect, useMemo, useState } from 'react';
import { appToast } from '../lib/appToast';
import { getConversationsByRequest } from '../services/chatService';
import { getCustomRequestDetail, selectCustomRequestArtisan } from '../services/customRequestService';

const normalizeConversations = (payload) => {
    const list = Array.isArray(payload) ? payload : [];
    return list.map((item) => ({
        ...item,
        artisanId: item?.artisanId ?? item?.artisan?.id ?? '',
        artisanName: item?.artisanName ?? item?.artisan?.name ?? 'Nghệ nhân',
        artisanBio: item?.artisanBio ?? item?.artisan?.bio ?? item?.bio ?? '—',
        conversationId: item?.conversationId ?? item?.id ?? '',
        requestId: item?.requestId ?? item?.customRequestId ?? '',
    }));
};

export function useCustomRequestDetail(id) {
    const [request, setRequest] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectingArtisanId, setSelectingArtisanId] = useState('');

    const refetch = useCallback(async () => {
        if (!id) {
            setRequest(null);
            setConversations([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        const [requestRes, convRes] = await Promise.all([
            getCustomRequestDetail(id),
            getConversationsByRequest(id),
        ]);

        if (!requestRes.success) {
            const message = requestRes.error || 'Không thể tải thông tin yêu cầu';
            setError(message);
            setRequest(null);
            setConversations([]);
            setLoading(false);
            appToast.error(message);
            return;
        }

        if (!convRes.success) {
            const message = convRes.error || 'Không thể tải danh sách nghệ nhân quan tâm';
            setError(message);
            setRequest(requestRes.data || null);
            setConversations([]);
            setLoading(false);
            appToast.error(message);
            return;
        }

        setRequest(requestRes.data || null);
        setConversations(normalizeConversations(convRes.data));
        setLoading(false);
    }, [id]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const selectArtisan = useCallback(async (artisanId) => {
        if (!id || !artisanId || selectingArtisanId) return { success: false };

        setSelectingArtisanId(String(artisanId));

        const res = await selectCustomRequestArtisan(id, artisanId);
        if (!res.success) {
            setSelectingArtisanId('');
            appToast.error(res.error || 'Chọn nghệ nhân thất bại');
            return res;
        }

        await refetch();
        setSelectingArtisanId('');
        appToast.success('Đã chọn nghệ nhân thành công');
        return res;
    }, [id, refetch, selectingArtisanId]);

    const selectedArtisanId = useMemo(() => String(request?.selectedArtisanId || request?.artisan?.artisanId || request?.artisan?.id || ''), [request]);

    return {
        request,
        conversations,
        loading,
        error,
        selectedArtisanId,
        selectingArtisanId,
        selectArtisan,
        refetch,
    };
}

export default useCustomRequestDetail;
