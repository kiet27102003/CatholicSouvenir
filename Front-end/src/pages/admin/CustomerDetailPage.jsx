import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    FiMail,
    FiPhone,
    FiMapPin,
    FiCalendar,
    FiSend,
    FiGift,
    FiSlash,
    FiList,
    FiUser,
    FiClock,
    FiImage,
    FiRefreshCw,
} from 'react-icons/fi';
import api from '../../cofig/api';
import { appToast } from '../../lib/appToast';
import { getOrders } from '../../services/orderService';
import AdminTopbar from './AdminTopbar';
import './admin-common.css';
import './UserManager.css';
import './SystemConfig.css';
import './CustomerDetailPage.css';

const API_ACCOUNTS = '/admin/accounts';

const displayVal = (v) => (v == null || v === '' ? '—' : v);

const getInitials = (name) => {
    const s = (name || '').trim();
    if (!s) return '?';
    const parts = s.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return s.slice(0, 2).toUpperCase();
};

const formatDdMmYyyy = (val) => {
    if (val == null || val === '') return '—';
    try {
        const d = new Date(val);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '—';
    }
};

const formatDdMmYyyyHhMm = (val) => {
    if (val == null || val === '') return '—';
    try {
        const d = new Date(val);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
};

const formatMoneyCommaVnd = (val) => {
    if (val == null || val === '') return '—';
    const n = typeof val === 'number' ? val : Number(val);
    if (Number.isNaN(n)) return '—';
    return n.toLocaleString('vi-VN');
};

const isCustomerBlocked = (acc) =>
    acc &&
    (acc.blocked === true ||
        acc.isBlocked === true ||
        String(acc.status || '').toUpperCase() === 'BLOCKED');

const formatOrdCode = (orderId) => {
    if (orderId == null || orderId === '') return '—';
    const short = String(orderId).replace(/-/g, '').slice(0, 6).toUpperCase();
    return short ? `#ORD-${short}` : '—';
};

const formatReqCode = (reqId) => {
    if (reqId == null || reqId === '') return '—';
    const short = String(reqId).replace(/-/g, '').slice(0, 6).toUpperCase();
    return short ? `#REQ-${short}` : '—';
};

const orderMatchesAccount = (order, accountId) => {
    const id = String(accountId ?? '');
    return (
        String(order.accountId ?? '') === id ||
        String(order.customerId ?? '') === id ||
        String(order.userId ?? '') === id
    );
};

const mapOrderStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'DELIVERED' || s === 'COMPLETED') return { label: 'Hoàn tất', className: 'badge-success' };
    if (s === 'SHIPPED' || s === 'IN_PROGRESS' || s === 'PROCESSING' || s === 'PENDING')
        return { label: 'Đang giao', className: 'badge-warning' };
    if (s === 'CANCELLED' || s === 'CANCELED') return { label: 'Hủy', className: 'badge-danger' };
    return { label: displayVal(status), className: 'badge-secondary' };
};

const mapRequestStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PENDING' || s === 'NEW' || s === 'SUBMITTED') return { label: 'Chờ xử lý', className: 'badge-warning' };
    if (s === 'IN_PROGRESS' || s === 'PROCESSING' || s === 'ACCEPTED' || s === 'ASSIGNED')
        return { label: 'Đang thực hiện', className: 'badge-secondary' };
    if (s === 'COMPLETED' || s === 'DONE' || s === 'DELIVERED' || s === 'FINISHED')
        return { label: 'Hoàn tất', className: 'badge-success' };
    return { label: displayVal(status), className: 'badge-secondary' };
};

const shortDescription = (text, max = 96) => {
    if (text == null || text === '') return '—';
    const t = String(text).trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max)}…`;
};

const formatCustomerStatus = (acc) => (isCustomerBlocked(acc) ? 'Bị chặn' : 'Hoạt động');

const CustomerDetailPage = () => {
    const { id } = useParams();
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [customRequests, setCustomRequests] = useState([]);
    const [customLoading, setCustomLoading] = useState(false);
    const [activityLog, setActivityLog] = useState([]);
    const [activeTab, setActiveTab] = useState('orders');
    const [showLockConfirm, setShowLockConfirm] = useState(false);

    const loadAccount = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await api.get(`${API_ACCOUNTS}/${id}`);
            const data = res.data?.data ?? res.data;
            setAccount(data && typeof data === 'object' ? data : null);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Kiểm tra kết nối mạng';
            appToast.error('Không tải được', typeof msg === 'string' ? msg : 'Kiểm tra kết nối mạng');
            setAccount(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadOrders = useCallback(async () => {
        if (!id) return;
        setOrdersLoading(true);
        const result = await getOrders();
        if (result.success && Array.isArray(result.data)) {
            setOrders(result.data.filter((o) => orderMatchesAccount(o, id)));
        } else {
            setOrders([]);
        }
        setOrdersLoading(false);
    }, [id]);

    const loadCustomRequests = useCallback(async () => {
        if (!id) return;
        setCustomLoading(true);
        try {
            const res = await api.get(`/admin/accounts/${id}/custom-requests`);
            const raw = res.data?.data ?? res.data;
            const list = Array.isArray(raw) ? raw : raw?.content ?? [];
            setCustomRequests(Array.isArray(list) ? list : []);
        } catch {
            setCustomRequests([]);
        } finally {
            setCustomLoading(false);
        }
    }, [id]);

    const loadActivity = useCallback(async () => {
        if (!id) return;
        try {
            const res = await api.get(`/admin/accounts/${id}/activity-log`);
            const raw = res.data?.data ?? res.data;
            const list = Array.isArray(raw) ? raw : [];
            setActivityLog(list);
        } catch {
            setActivityLog([]);
        }
    }, [id]);

    useEffect(() => {
        loadAccount();
    }, [loadAccount]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    useEffect(() => {
        loadCustomRequests();
    }, [loadCustomRequests]);

    useEffect(() => {
        loadActivity();
    }, [loadActivity]);

    const customerOrders = useMemo(() => orders, [orders]);

    const totalSpend = account?.totalSpent ?? account?.totalSpend ?? account?.totalSpending;
    const orderCount = account?.orderCount ?? account?.totalOrders ?? customerOrders.length;
    const requestCount =
        account?.customRequestCount ??
        account?.requestCount ??
        (customRequests.length ? customRequests.length : null);

    const tierBadge = useMemo(() => {
        if (!account) return '—';
        const tier = account.customerTier ?? account.vipTier ?? account.membershipTier ?? account.tier;
        if (tier != null && tier !== '') {
            const t = String(tier).toUpperCase();
            if (t === 'VIP' || t === 'KHACH_HANG_VIP') return 'Khách hàng VIP';
            return String(tier);
        }
        if (account.isVip === true) return 'Khách hàng VIP';
        if (account.isVip === false) return 'Thường';
        return '—';
    }, [account]);

    const firstLineProduct = (order) => {
        const details = order.orderDetails || [];
        const d0 = details[0];
        return d0?.productName ?? d0?.name ?? d0?.product?.productName ?? '—';
    };

    const confirmLock = () => {
        setShowLockConfirm(false);
    };

    const topbarTitle =
        loading ? 'Đang tải…' : account ? displayVal(account.fullName) : 'Chi tiết khách hàng';

    if (!id) {
        return (
            <div className="admin-page customer-detail-page">
                <p className="admin-page-subtitle">Thiếu mã khách hàng.</p>
                <Link to="/admin/customers" className="portfolio-link">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="admin-page customer-detail-page">
            {loading ? (
                <div className="admin-empty-state">
                    <FiRefreshCw className="spin" style={{ fontSize: '2rem' }} />
                    <p>Đang tải...</p>
                </div>
            ) : !account ? (
                <div className="admin-empty-state">
                    <p>Không tìm thấy khách hàng.</p>
                    <Link to="/admin/customers" className="portfolio-link">
                        Quay lại danh sách
                    </Link>
                </div>
            ) : (
                <div className="customer-detail-grid">
                    <div className="customer-detail-left-col">
                        <div className="admin-card customer-profile-card">
                            <div className="customer-profile-banner" aria-hidden />
                            <div className="customer-profile-head">
                                <div className="customer-profile-avatar-lg">
                                    {getInitials(account.fullName || account.email)}
                                </div>
                                <h2 className="customer-profile-name">{displayVal(account.fullName)}</h2>
                                <p className="customer-profile-subtitle">
                                    {displayVal(account.email)}
                                </p>
                                <div className="customer-profile-badges">
                                    <span
                                        className={`status-badge ${
                                            isCustomerBlocked(account) ? 'badge-danger' : 'badge-success'
                                        }`}
                                    >
                                        {formatCustomerStatus(account)}
                                    </span>
                                    <span className="role-tag">{tierBadge === '—' ? '—' : tierBadge}</span>
                                </div>
                            </div>
                            <div className="customer-profile-body">
                                <div className="customer-info-row">
                                    <FiMail size={18} />
                                    <span className="label">Email</span>
                                    <span className="value">{displayVal(account.email)}</span>
                                </div>
                                <div className="customer-info-row">
                                    <FiPhone size={18} />
                                    <span className="label">Số điện thoại</span>
                                    <span className="value">{displayVal(account.phone)}</span>
                                </div>
                                <div className="customer-info-row">
                                    <FiMapPin size={18} />
                                    <span className="label">Địa chỉ</span>
                                    <span className="value">
                                        {displayVal(account.address ?? account.fullAddress ?? account.shippingAddress)}
                                    </span>
                                </div>
                                <div className="customer-info-row">
                                    <FiCalendar size={18} />
                                    <span className="label">Ngày đăng ký</span>
                                    <span className="value">
                                        {formatDdMmYyyy(account.createdDate ?? account.createdAt)}
                                    </span>
                                </div>
                                <div className="customer-stats-row">
                                    <div className="customer-stats-cell">
                                        <span className="stat-label">Chi tiêu</span>
                                        <span className="stat-value">
                                            {totalSpend != null && totalSpend !== ''
                                                ? `${formatMoneyCommaVnd(totalSpend)} VND`
                                                : '—'}
                                        </span>
                                    </div>
                                    <div className="customer-stats-cell">
                                        <span className="stat-label">Đơn hàng</span>
                                        <span className="stat-value">{displayVal(orderCount)}</span>
                                    </div>
                                    <div className="customer-stats-cell">
                                        <span className="stat-label">Yêu cầu</span>
                                        <span className="stat-value">{displayVal(requestCount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="admin-card quick-actions-card" style={{ marginTop: 20 }}>
                            <div className="admin-card-header">⚡ Thao tác nhanh</div>
                            <div className="quick-actions-stack">
                                <a
                                    className="btn btn-primary btn-icon"
                                    href={account.email ? `mailto:${encodeURIComponent(account.email)}` : undefined}
                                    onClick={(e) => {
                                        if (!account.email) e.preventDefault();
                                    }}
                                    style={{
                                        textDecoration: 'none',
                                        opacity: account.email ? 1 : 0.55,
                                        pointerEvents: account.email ? 'auto' : 'none',
                                    }}
                                >
                                    <FiSend style={{ marginRight: 8 }} />
                                    Nhắn tin
                                </a>
                                <button type="button" className="btn btn-outline btn-icon">
                                    <FiGift style={{ marginRight: 8 }} />
                                    Gửi ưu đãi
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger-outline btn-icon"
                                    onClick={() => setShowLockConfirm(true)}
                                >
                                    <FiSlash style={{ marginRight: 8 }} />
                                    Khóa tài khoản
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="customer-detail-right-col">
                        <div className="customer-detail-tabs-wrap">
                            <div className="tabs-container">
                                <button
                                    type="button"
                                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('orders')}
                                >
                                    <FiList />
                                    Lịch sử Đơn hàng
                                </button>
                                <button
                                    type="button"
                                    className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('requests')}
                                >
                                    <FiUser />
                                    Yêu cầu Tùy chỉnh
                                </button>
                                <button
                                    type="button"
                                    className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('activity')}
                                >
                                    <FiClock />
                                    Hoạt động hệ thống
                                </button>
                            </div>

                            <div className="tab-content">
                                {activeTab === 'orders' && (
                                    <>
                                        <div className="table-responsive">
                                            <table className="admin-table">
                                                <thead>
                                                    <tr>
                                                        <th>Mã đơn</th>
                                                        <th>Ngày đặt</th>
                                                        <th>Sản phẩm</th>
                                                        <th>Tổng tiền (VNĐ)</th>
                                                        <th>Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {ordersLoading ? (
                                                        <tr>
                                                            <td colSpan="5" className="empty-state">
                                                                <div className="admin-empty-state">
                                                                    <FiRefreshCw className="spin" />
                                                                    <p>Đang tải đơn hàng...</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : customerOrders.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5" className="empty-state">
                                                                <div className="admin-empty-state">
                                                                    <p>Chưa có đơn hàng.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        customerOrders.map((order, oidx) => {
                                                            const oid = order.orderId || order.id;
                                                            const st = mapOrderStatusBadge(order.status);
                                                            return (
                                                                <tr key={oid || `ord-${oidx}`}>
                                                                    <td>{formatOrdCode(oid)}</td>
                                                                    <td>{formatDdMmYyyy(order.orderDate)}</td>
                                                                    <td>
                                                                        <div className="customer-table-product-cell">
                                                                            <div className="order-product-thumb">
                                                                                <FiImage size={18} />
                                                                            </div>
                                                                            <span>{firstLineProduct(order)}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td>{formatMoneyCommaVnd(order.total)}</td>
                                                                    <td>
                                                                        <span className={`status-badge ${st.className}`}>
                                                                            {st.label}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <Link
                                            to="/admin/customers"
                                            className="customer-detail-link-all"
                                        >
                                            Xem tất cả đơn hàng (
                                            {customerOrders.length != null ? customerOrders.length : '—'})
                                        </Link>
                                    </>
                                )}

                                {activeTab === 'requests' && (
                                    <div className="table-responsive">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Mã yêu cầu</th>
                                                    <th>Ngày tạo</th>
                                                    <th>Mô tả</th>
                                                    <th>Nghệ nhân</th>
                                                    <th>Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customLoading ? (
                                                    <tr>
                                                        <td colSpan="5" className="empty-state">
                                                            <div className="admin-empty-state">
                                                                <FiRefreshCw className="spin" />
                                                                <p>Đang tải...</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : customRequests.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="empty-state">
                                                            <div className="admin-empty-state">
                                                                <p>Chưa có yêu cầu tùy chỉnh.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    customRequests.map((req, idx) => {
                                                        const rid = req.id ?? req.customRequestId ?? req.requestId;
                                                        const st = mapRequestStatusBadge(req.status);
                                                        return (
                                                            <tr key={rid || idx}>
                                                                <td>{formatReqCode(rid)}</td>
                                                                <td>
                                                                    {formatDdMmYyyy(req.createdAt ?? req.createAt)}
                                                                </td>
                                                                <td>
                                                                    {shortDescription(
                                                                        req.description ?? req.title ?? req.summary
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {displayVal(
                                                                        req.artisanName ??
                                                                            req.assignedArtisanName ??
                                                                            req.artisan?.artisanName
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <span className={`status-badge ${st.className}`}>
                                                                        {st.label}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="timeline-list">
                                        {activityLog.length === 0 ? (
                                            <div className="admin-empty-state" style={{ padding: '32px 16px' }}>
                                                <p>Chưa có hoạt động nào</p>
                                            </div>
                                        ) : (
                                            activityLog.map((item, idx) => (
                                                <div key={item.id || idx} className="timeline-row">
                                                    <div className="timeline-icon">
                                                        <FiClock size={16} />
                                                    </div>
                                                    <div className="timeline-body">
                                                        <p className="timeline-desc">
                                                            {displayVal(item.message ?? item.description ?? item.action)}
                                                        </p>
                                                        <p className="timeline-time">
                                                            {formatDdMmYyyyHhMm(
                                                                item.timestamp ?? item.createdAt ?? item.at
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showLockConfirm && (
                <div className="detail-overlay" role="presentation" onClick={() => setShowLockConfirm(false)}>
                    <div
                        className="detail-modal"
                        style={{ maxWidth: 420 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="lock-confirm-title"
                    >
                        <div className="detail-modal-header">
                            <h3 id="lock-confirm-title">Xác nhận khóa tài khoản</h3>
                            <button
                                type="button"
                                className="detail-close"
                                onClick={() => setShowLockConfirm(false)}
                                aria-label="Đóng"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="detail-modal-body">
                            <p style={{ margin: 0, lineHeight: 1.6 }}>
                                Bạn có chắc muốn khóa tài khoản{' '}
                                <strong>{account?.fullName || account?.email || 'khách hàng này'}</strong>? Chức năng sẽ
                                kết nối API khi backend sẵn sàng.
                            </p>
                        </div>
                        <div className="detail-modal-footer">
                            <button type="button" className="btn btn-outline" onClick={() => setShowLockConfirm(false)}>
                                Hủy
                            </button>
                            <button type="button" className="btn btn-danger" onClick={confirmLock}>
                                Xác nhận khóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
};

export default CustomerDetailPage;
