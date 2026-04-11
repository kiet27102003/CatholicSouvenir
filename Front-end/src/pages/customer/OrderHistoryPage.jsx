import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByAccount } from '../../services/orderService';
import { appToast } from '../../lib/appToast';
import './OrderHistoryPage.css';

const PAGE_SIZE = 10;

const ORDER_TABS = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ thanh toán' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'DELIVERED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã huỷ' },
];

const STATUS_META = {
    PENDING: { label: 'Chờ thanh toán', className: 'badge-pending' },
    PAID: { label: 'Chờ lấy hàng', className: 'badge-paid' },
    SHIPPING: { label: 'Đang giao hàng', className: 'badge-shipping' },
    DELIVERED: { label: 'Hoàn thành', className: 'badge-delivered' },
    CANCELLED: { label: 'Đã huỷ', className: 'badge-cancelled' },
};

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatDateTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY · HH:mm') : '—');
const shortenOrderCode = (orderId) => {
    if (!orderId) return '#ORD-----';
    const tail = String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    return `#ORD-${tail || '----'}`;
};

const statusForTab = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PAID') return 'SHIPPING';
    return s;
};

const getItemImage = (item) => item?.images?.[0]?.image_url || item?.thumbnail || 'https://via.placeholder.com/72x72?text=SP';

const OrderHistoryPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const accountId = user?.accountId || user?.id || user?.userId || '';

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0, pageSize: PAGE_SIZE, pageNumber: 0 });
    const [activeTab, setActiveTab] = useState('ALL');
    const [search, setSearch] = useState('');
    const [sortDirection, setSortDirection] = useState('DESC');

    useEffect(() => {
        if (!accountId) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        const fetchOrders = async () => {
            setLoading(true);
            const res = await getOrdersByAccount(accountId, {
                page,
                size: PAGE_SIZE,
                sortBy: 'createAt',
                sortDirection,
            });

            if (cancelled) return;

            if (!res.success) {
                setOrders([]);
                appToast.error('Không tải được đơn hàng', res.error || 'Vui lòng thử lại sau');
                setLoading(false);
                return;
            }

            setOrders(Array.isArray(res.data?.content) ? res.data.content : []);
            setPageInfo({
                totalElements: Number(res.data?.totalElements || 0),
                totalPages: Number(res.data?.totalPages || 0),
                pageSize: Number(res.data?.pageSize || PAGE_SIZE),
                pageNumber: Number(res.data?.pageNumber || 0),
            });
            setLoading(false);
        };

        fetchOrders();
        return () => {
            cancelled = true;
        };
    }, [accountId, page, sortDirection]);

    const filteredOrders = useMemo(() => {
        const query = search.trim().toLowerCase();

        return orders.filter((order) => {
            const matchedTab = activeTab === 'ALL' || statusForTab(order.status) === activeTab;
            const matchedSearch = !query || String(order.orderId || '').toLowerCase().includes(query);
            return matchedTab && matchedSearch;
        });
    }, [orders, activeTab, search]);

    const paginationText = useMemo(() => {
        if (pageInfo.totalElements <= 0) return 'Hiển thị 0–0 trong tổng 0 đơn hàng';
        const from = pageInfo.pageNumber * pageInfo.pageSize + 1;
        const to = Math.min((pageInfo.pageNumber + 1) * pageInfo.pageSize, pageInfo.totalElements);
        return `Hiển thị ${from}–${to} trong tổng ${pageInfo.totalElements} đơn hàng`;
    }, [pageInfo]);

    const handleChangeSort = (event) => {
        const direction = event.target.value;
        setSortDirection(direction);
        setPage(0);
    };

    const handleReview = () => {
        appToast.info('Tính năng sắp ra mắt', 'Chức năng đánh giá sẽ được cập nhật sớm.');
    };

    return (
        <div className="orders-v2-page">
            <header className="orders-v2-header">
                <h1>Đơn hàng của tôi</h1>
                <p>Theo dõi và quản lý đơn hàng</p>
            </header>

            <div className="orders-v2-toolbar">
                <div className="orders-v2-tabs" role="tablist" aria-label="Bộ lọc trạng thái">
                    {ORDER_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            className={`orders-v2-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="orders-v2-filters">
                    <input
                        type="text"
                        className="orders-v2-search"
                        placeholder="Tìm theo mã đơn hàng"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <select className="orders-v2-sort" value={sortDirection} onChange={handleChangeSort}>
                        <option value="DESC">Mới nhất</option>
                        <option value="ASC">Cũ nhất</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="orders-v2-list">
                    {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={`skeleton-${idx}`} className="orders-v2-card skeleton" />
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="orders-v2-empty">
                    <div className="orders-v2-empty-icon">🧾</div>
                    <h3>Chưa có đơn hàng nào</h3>
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/products')}>
                        Khám phá sản phẩm
                    </button>
                </div>
            ) : (
                <>
                    <div className="orders-v2-list">
                        {filteredOrders.map((order) => {
                            const status = String(order.status || '').toUpperCase();
                            const statusMeta = STATUS_META[status] || { label: status || 'Không xác định', className: '' };
                            const orderDetails = Array.isArray(order.orderDetails) ? order.orderDetails : [];
                            const templateDetails = Array.isArray(order.templateDetails) ? order.templateDetails : [];
                            const allItems = [...orderDetails, ...templateDetails];

                            return (
                                <article key={order.orderId} className="orders-v2-card">
                                    <div className="orders-v2-card-head">
                                        <div>
                                            <h2>{shortenOrderCode(order.orderId)}</h2>
                                            <p>{formatDateTime(order.orderDate || order.createAt || order.createdAt)}</p>
                                        </div>
                                        <span className={`orders-v2-status ${statusMeta.className}`}>{statusMeta.label}</span>
                                    </div>

                                    <div className="orders-v2-items">
                                        {allItems.map((item, idx) => (
                                            <div key={`${order.orderId}-${idx}`} className="orders-v2-item">
                                                <img src={getItemImage(item)} alt={item.productName || item.templateName || 'Sản phẩm'} />
                                                <div className="orders-v2-item-info">
                                                    <h4>{item.productName || item.templateName || 'Sản phẩm tuỳ chỉnh'}</h4>
                                                    {item.customizations && typeof item.customizations === 'object' && (
                                                        <div className="orders-v2-customize">
                                                            {Object.entries(item.customizations).map(([key, value]) => (
                                                                <span key={key}>{key}: {String(value)}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p>x{item.quantity || item.qty || 1} · {formatCurrency(item.unitPrice)}</p>
                                                </div>
                                                <strong>{formatCurrency(item.subTotal)}</strong>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="orders-v2-card-foot">
                                        <div>
                                            <p>Tổng tiền: <strong>{formatCurrency(order.total)}</strong></p>
                                            <p>Thanh toán: {order.paymentMethod || '—'}</p>
                                        </div>

                                        <div className="orders-v2-actions">
                                            {status === 'SHIPPING' && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => navigate(`/orders/${order.orderId}#tracking`)}
                                                >
                                                    Theo dõi đơn
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-sm"
                                                onClick={() => navigate(`/orders/${order.orderId}`)}
                                            >
                                                Xem chi tiết
                                            </button>
                                            {status === 'DELIVERED' && (
                                                <button type="button" className="btn btn-sm" onClick={handleReview}>
                                                    Đánh giá
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <div className="orders-v2-pagination">
                        <span>{paginationText}</span>
                        <div>
                            <button type="button" className="btn btn-outline btn-sm" disabled={page <= 0} onClick={() => setPage((prev) => prev - 1)}>
                                Trước
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                disabled={page + 1 >= pageInfo.totalPages}
                                onClick={() => setPage((prev) => prev + 1)}
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OrderHistoryPage;
