import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import { cancelCustomOrder, getArtisanCustomOrders } from '../../services/customRequestService';
import './ArtisanOrdersPage.css';

const tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'IN_PROGRESS', label: 'Đang thực hiện' },
    { key: 'COMPLETED', label: 'Hoàn thành' },
    { key: 'CANCELLED', label: 'Đã huỷ' },
];

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatDate = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString('vi-VN');
    } catch {
        return value;
    }
};

const getStatusText = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'IN_PROGRESS') return 'Đang thực hiện';
    if (s === 'COMPLETED') return 'Hoàn thành';
    if (s === 'CANCELLED') return 'Đã huỷ';
    return status || 'Không xác định';
};

const getProgress = (order) => {
    const stages = Array.isArray(order?.stages) ? order.stages : [];
    if (!stages.length) return 0;
    const done = stages.filter((s) => String(s?.status || '').toUpperCase() === 'COMPLETED').length;
    return Math.round((done / stages.length) * 100);
};

const ArtisanOrdersPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('ALL');
    const [cancellingId, setCancellingId] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        const res = await getArtisanCustomOrders();
        setLoading(false);

        if (!res.success) {
            setOrders([]);
            appToast.error('Không tải được đơn tùy chỉnh', res.error || 'Vui lòng thử lại');
            return;
        }

        setOrders(Array.isArray(res.data) ? res.data : []);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filtered = useMemo(() => {
        if (activeTab === 'ALL') return orders;
        return orders.filter((order) => String(order?.status || '').toUpperCase() === activeTab);
    }, [activeTab, orders]);

    const handleCancel = async (orderId) => {
        if (!orderId || cancellingId) return;
        if (!window.confirm('Bạn có chắc muốn huỷ đơn này?')) return;

        setCancellingId(String(orderId));
        const res = await cancelCustomOrder(orderId);
        setCancellingId('');

        if (!res.success) {
            appToast.error('Huỷ đơn thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Huỷ đơn thành công');
        fetchOrders();
    };

    return (
        <div className="artisan-orders-page">
            <header className="artisan-page-header">
                <h1>Đơn hàng tùy chỉnh</h1>
            </header>

            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="list-grid">{[1, 2, 3].map((item) => <div key={item} className="artisan-skeleton-card" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="artisan-empty">Chưa có đơn hàng tùy chỉnh</div>
            ) : (
                <div className="list-grid">
                    {filtered.map((order) => {
                        const id = order?.orderId ?? order?.id;
                        const stages = Array.isArray(order?.stages) ? order.stages : [];
                        const progress = getProgress(order);
                        const currentStage = stages.find((stage) => String(stage?.status || '').toUpperCase() === 'PAID' && stage?.canComplete);

                        return (
                            <article key={String(id)} className="order-card">
                                <header>
                                    <h3>{order?.requestDescription || order?.requestTitle || 'Yêu cầu custom'}</h3>
                                    <p>{order?.customerName || order?.customer?.fullName || 'Khách hàng'} · {formatDate(order?.createdAt)} · {formatCurrency(order?.totalPrice)}</p>
                                    <span className="status-badge">{getStatusText(order?.status)}</span>
                                </header>

                                <div className="order-stage-badges">
                                    {stages.map((stage, idx) => {
                                        const s = String(stage?.status || '').toUpperCase();
                                        const klass = s === 'COMPLETED' ? 'done' : stage?.canComplete ? 'active' : 'idle';
                                        return <span key={`${stage?.id || idx}`} className={`mini-badge ${klass}`}>{idx + 1}</span>;
                                    })}
                                </div>

                                <div className="progress-wrap">
                                    <div className="progress-track"><div className="progress-value" style={{ width: `${progress}%` }} /></div>
                                    <small>{progress}% hoàn thành</small>
                                </div>

                                <footer>
                                    <span>Đang làm: {currentStage?.stageName || 'Chưa có'}</span>
                                    <div className="actions">
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            disabled={String(order?.status || '').toUpperCase() === 'COMPLETED' || cancellingId === String(id)}
                                            onClick={() => handleCancel(id)}
                                        >
                                            {cancellingId === String(id) ? 'Đang huỷ...' : 'Huỷ đơn'}
                                        </button>
                                        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/artisan/orders/${id}`)}>Quản lý</button>
                                    </div>
                                </footer>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ArtisanOrdersPage;
