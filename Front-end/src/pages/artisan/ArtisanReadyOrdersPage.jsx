import React, { useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiPackage, FiUser } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import { getOrdersByArtisan } from '../../services/orderService';
import './ArtisanOrdersPage.css';

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
    if (s === 'PAID') return 'Đã thanh toán';
    if (s === 'DELIVERED') return 'Đã giao';
    if (s === 'SHIPPING') return 'Đang giao';
    if (s === 'CANCELLED') return 'Đã huỷ';
    return s || 'Chờ xử lý';
};

const getStatusClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PAID') return 'in-progress';
    if (s === 'DELIVERED') return 'completed';
    if (s === 'CANCELLED') return 'cancelled';
    return 'pending';
};

const ArtisanReadyOrdersPage = ({ embedded = false }) => {
    const { user } = useAuth();
    const artisanId = user?.accountId || user?.id || user?.userId || '';
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            if (!artisanId) {
                setLoading(false);
                setOrders([]);
                return;
            }

            setLoading(true);
            const res = await getOrdersByArtisan(artisanId, { page: 0, size: 10, sortBy: 'createAt', sortDirection: 'DESC' });
            if (ignore) return;
            setLoading(false);

            if (!res.success) {
                setOrders([]);
                appToast.error('Không tải được đơn hàng sẵn', res.error || 'Vui lòng thử lại');
                return;
            }

            setOrders(Array.isArray(res.data?.content) ? res.data.content : []);
        };

        load();
        return () => {
            ignore = true;
        };
    }, [artisanId]);

    const summary = useMemo(() => ({ total: orders.length }), [orders]);

    return (
        <div className="artisan-orders-page modern-artisan-orders">
            <header className="artisan-orders-header">
                <div>
                    <p className="page-kicker">Quản lý đơn hàng</p>
                    <h1>Đơn hàng sẵn</h1>
                </div>
            </header>

            <section className="orders-summary-grid">
                <article className="summary-card">
                    <span className="summary-icon"><FiPackage /></span>
                    <div>
                        <p>Tổng đơn</p>
                        <strong>{summary.total}</strong>
                    </div>
                </article>
            </section>

            {loading ? (
                <div className="list-grid">{[1, 2, 3].map((item) => <div key={item} className="artisan-skeleton-card" />)}</div>
            ) : orders.length === 0 ? (
                <div className="artisan-empty">Chưa có đơn hàng sẵn nào.</div>
            ) : (
                <div className="list-grid">
                    {orders.map((order) => {
                        const id = order?.orderId || order?.id;
                        const details = Array.isArray(order?.orderDetails) ? order.orderDetails : [];
                        const firstItem = details[0];

                        return (
                            <article key={String(id)} className="order-card unified-card">
                                <header className="card-header-block">
                                    <div className="card-title-row">
                                        <h3 title={firstItem?.productName || 'Đơn hàng sẵn'}>{firstItem?.productName || 'Đơn hàng sẵn'}</h3>
                                        <span className={`status-badge ${getStatusClass(order?.status)}`}>{getStatusText(order?.status)}</span>
                                    </div>
                                    <div className="card-meta-row">
                                        <span><FiCalendar /> {formatDate(order?.orderDate || order?.createAt)}</span>
                                        <span><FiUser /> {order?.fullName || 'Khách hàng'}</span>
                                        <strong>{formatCurrency(order?.total)}</strong>
                                    </div>
                                </header>

                                <div className="card-body-block">
                                    <p className="card-description">Mã đơn: {id}</p>
                                    <p className="card-description">Sản phẩm: {firstItem?.productName || '—'}</p>
                                    <div className="card-compact-stat">{details.length} sản phẩm • {order?.paymentMethod || '—'}</div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ArtisanReadyOrdersPage;
