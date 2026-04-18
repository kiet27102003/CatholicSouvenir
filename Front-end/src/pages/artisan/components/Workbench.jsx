import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrdersByArtisan } from '../../../services/orderService';
import { getMyWallet, getWalletTransactions } from '../../../services/walletService';
import { getOpenCustomRequests, getArtisanCustomOrders, getCustomOrderStages } from '../../../services/customRequestService';
import { getMyConversations } from '../../../services/chatService';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead } from '../../../services/notificationService';
import { appToast } from '../../../lib/appToast';
import api from '../../../cofig/api';
import './Workbench.css';

const formatCurrencyVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN');
};

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('vi-VN');
};

const normalizeStatus = (status) => String(status || '').toUpperCase();

const getOrderStatusLabel = (status) => {
    const key = normalizeStatus(status);
    const map = {
        PENDING: 'Chờ xử lý',
        PAID: 'Đã thanh toán',
        SHIPPING: 'Đang giao',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã hủy',
        CONFIRMED: 'Đã xác nhận',
    };
    return map[key] || status || '—';
};

const getStatusClass = (status) => {
    const key = normalizeStatus(status);
    if (['PENDING', 'PAID'].includes(key)) return 'wb-badge--amber';
    if (['SHIPPING', 'IN_PROGRESS', 'CONFIRMED'].includes(key)) return 'wb-badge--blue';
    if (['COMPLETED'].includes(key)) return 'wb-badge--green';
    if (['CANCELLED'].includes(key)) return 'wb-badge--gray';
    return 'wb-badge--gray';
};

const getPaymentMethodLabel = (method) => {
    const key = String(method || '').toUpperCase();
    const map = {
        COD: 'COD',
        CARD: 'Thẻ',
        PAYPAL: 'PayPal',
        BANK: 'Chuyển khoản',
    };
    return map[key] || method || '—';
};

const shortId = (id) => {
    const text = String(id || '');
    if (!text) return '—';
    return text.length > 14 ? `${text.slice(0, 14)}...` : text;
};

const getConversationName = (conv) => conv?.otherUserName || conv?.customerName || conv?.name || 'Khách hàng';

const getInitials = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'KH';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const getRelative = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const diff = Date.now() - date.getTime();
    const minute = Math.max(1, Math.floor(diff / 60000));
    if (minute < 60) return `${minute} phút trước`;
    const hour = Math.floor(minute / 60);
    if (hour < 24) return `${hour} giờ trước`;
    const day = Math.floor(hour / 24);
    if (day < 7) return `${day} ngày trước`;
    return formatDate(date);
};

const getTransactionAmount = (tx) => Number(tx?.amount ?? tx?.value ?? tx?.money ?? 0);
const isDepositTransaction = (tx) => String(tx?.type || tx?.transactionType || '').toUpperCase().includes('DEPOSIT');
const isCurrentMonth = (value) => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const getDueDate = (stage) => stage?.dueDate || stage?.estimatedDueDate || stage?.deadline || stage?.expectedAt || null;

const resolveNotificationTarget = (notification) => {
    const candidate = notification?.targetUrl || notification?.url || notification?.link || notification?.actionUrl || notification?.data?.url || notification?.data?.targetUrl || '';
    if (typeof candidate !== 'string' || !candidate.trim()) return null;
    return candidate.startsWith('/') ? candidate : `/${candidate.replace(/^\/+/, '')}`;
};

const Workbench = ({ user }) => {
    const navigate = useNavigate();
    const artisanId = user?.id || user?.artisanId || user?.artisanUuid;

    const [orders, setOrders] = useState([]);
    const [latestOrders, setLatestOrders] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [customOrdersWithStage, setCustomOrdersWithStage] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [openRequests, setOpenRequests] = useState([]);
    const [openRequestTotal, setOpenRequestTotal] = useState(0);
    const [actionableCount, setActionableCount] = useState(0);
    const [shipmentCandidates, setShipmentCandidates] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingWallet, setLoadingWallet] = useState(true);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [loadingCustomOrders, setLoadingCustomOrders] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [loadingShipments, setLoadingShipments] = useState(true);

    useEffect(() => {
        if (!artisanId) return;

        let active = true;

        const ordersTask = getOrdersByArtisan(artisanId)
            .then((res) => {
                if (!active) return;
                if (res.success) {
                    const list = Array.isArray(res.data) ? res.data : [];
                    setOrders(list);
                } else {
                    setOrders([]);
                    appToast.error('Không tải được đơn hàng', res.error || 'Vui lòng thử lại.');
                }
            })
            .catch(() => {
                if (!active) return;
                appToast.error('Không tải được đơn hàng', 'Vui lòng thử lại.');
                setOrders([]);
            })
            .finally(() => {
                if (active) setLoadingOrders(false);
            });

        const latestOrdersTask = api.get(`/order/artisan/${artisanId}`, {
            params: { page: 0, size: 3, sortBy: 'createAt', sortDirection: 'DESC' },
        })
            .then((res) => {
                if (!active) return;
                const payload = res?.data?.data ?? res?.data ?? {};
                const list = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.content)
                        ? payload.content
                        : [];
                setLatestOrders(list);
            })
            .catch(() => {
                if (!active) return;
                setLatestOrders([]);
            });

        const walletTask = Promise.all([getMyWallet(), getWalletTransactions()])
            .then(([walletRes, txRes]) => {
                if (!active) return;
                if (walletRes.success) setWallet(walletRes.data);
                else {
                    setWallet(null);
                    appToast.error('Không tải được ví', walletRes.error || 'Vui lòng thử lại.');
                }

                if (txRes.success) setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
                else {
                    setTransactions([]);
                    appToast.error('Không tải được lịch sử ví', txRes.error || 'Vui lòng thử lại.');
                }
            })
            .catch(() => {
                if (!active) return;
                setWallet(null);
                setTransactions([]);
                appToast.error('Không tải được dữ liệu ví', 'Vui lòng thử lại.');
            })
            .finally(() => {
                if (active) setLoadingWallet(false);
            });

        const requestsTask = getOpenCustomRequests({ page: 0, size: 3 })
            .then((res) => {
                if (!active) return;
                if (res.success) {
                    const content = Array.isArray(res.data?.content) ? res.data.content : [];
                    setOpenRequests(content);
                    setOpenRequestTotal(Number(res.data?.totalElements ?? content.length ?? 0));
                } else {
                    setOpenRequests([]);
                    setOpenRequestTotal(0);
                    appToast.error('Không tải được yêu cầu mở', res.error || 'Vui lòng thử lại.');
                }
            })
            .catch(() => {
                if (!active) return;
                setOpenRequests([]);
                setOpenRequestTotal(0);
                appToast.error('Không tải được yêu cầu mở', 'Vui lòng thử lại.');
            })
            .finally(() => {
                if (active) setLoadingRequests(false);
            });

        const customOrdersTask = getArtisanCustomOrders()
            .then(async (res) => {
                if (!active) return;
                if (!res.success) {
                    setCustomOrdersWithStage([]);
                    appToast.error('Không tải được đơn tùy chỉnh', res.error || 'Vui lòng thử lại.');
                    return;
                }

                const list = Array.isArray(res.data) ? res.data : [];

                const inProgress = list.filter((item) => normalizeStatus(item?.status) === 'IN_PROGRESS');
                const stages = await Promise.all(inProgress.map(async (order) => {
                    const id = order?.id || order?.orderId || order?.customOrderId;
                    if (!id) return { order, stage: null };
                    const stageRes = await getCustomOrderStages(id);
                    if (!stageRes.success) return { order, stage: null };

                    const arr = Array.isArray(stageRes.data) ? stageRes.data : [];
                    const target = arr.find((s) => s?.canComplete === true)
                        || arr.find((s) => normalizeStatus(s?.status) === 'PAID')
                        || arr[0]
                        || null;
                    return { order, stage: target };
                }));

                if (active) setCustomOrdersWithStage(stages);
            })
            .catch(() => {
                if (!active) return;
                setCustomOrdersWithStage([]);
                appToast.error('Không tải được đơn tùy chỉnh', 'Vui lòng thử lại.');
            })
            .finally(() => {
                if (active) setLoadingCustomOrders(false);
            });

        const messagesTask = getMyConversations()
            .then((res) => {
                if (!active) return;
                if (res.success) {
                    setConversations(Array.isArray(res.data) ? res.data : []);
                } else {
                    setConversations([]);
                    appToast.error('Không tải được tin nhắn', res.error || 'Vui lòng thử lại.');
                }
            })
            .catch(() => {
                if (!active) return;
                setConversations([]);
                appToast.error('Không tải được tin nhắn', 'Vui lòng thử lại.');
            })
            .finally(() => {
                if (active) setLoadingMessages(false);
            });

        const notificationTask = Promise.all([
            getUnreadNotificationCount(),
            getNotifications({ page: 0, size: 5 }),
        ])
            .then(([countRes, listRes]) => {
                if (!active) return;
                if (countRes.success) setNotificationCount(countRes.data || 0);
                else setNotificationCount(0);

                if (listRes.success) {
                    const list = Array.isArray(listRes.data?.content) ? listRes.data.content : [];
                    setNotifications(list);
                } else {
                    setNotifications([]);
                }
            })
            .catch(() => {
                if (!active) return;
                setNotificationCount(0);
                setNotifications([]);
            });

        void Promise.all([
            ordersTask,
            latestOrdersTask,
            walletTask,
            requestsTask,
            customOrdersTask,
            messagesTask,
            notificationTask,
        ]);

        return () => {
            active = false;
        };
    }, [artisanId]);

    useEffect(() => {
        let active = true;

        const loadShipments = async () => {
            if (!orders.length) {
                setShipmentCandidates([]);
                setLoadingShipments(false);
                return;
            }

            setLoadingShipments(true);
            const paidOrders = orders.filter((item) => normalizeStatus(item?.status) === 'PAID');
            const checks = await Promise.all(paidOrders.map(async (order) => {
                const id = order?.orderId || order?.id;
                if (!id) return null;
                try {
                    const res = await api.get(`/shipments/order/${id}`);
                    const payload = res?.data?.data ?? res?.data;
                    const hasShipment = Array.isArray(payload) ? payload.length > 0 : Boolean(payload);
                    return hasShipment ? null : order;
                } catch {
                    return order;
                }
            }));

            if (!active) return;
            setShipmentCandidates(checks.filter(Boolean));
            setLoadingShipments(false);
        };

        loadShipments();
        return () => {
            active = false;
        };
    }, [orders]);

    const processingOrdersCount = useMemo(
        () => orders.filter((item) => ['PENDING', 'PAID', 'SHIPPING'].includes(normalizeStatus(item?.status))).length,
        [orders],
    );

    const monthlyRevenue = useMemo(() => {
        return transactions
            .filter((tx) => isDepositTransaction(tx) && isCurrentMonth(tx?.createdAt || tx?.createAt || tx?.transactionDate))
            .reduce((sum, tx) => sum + getTransactionAmount(tx), 0);
    }, [transactions]);

    const totalReceived = useMemo(
        () => transactions.filter(isDepositTransaction).reduce((sum, tx) => sum + getTransactionAmount(tx), 0),
        [transactions],
    );

    const monthReceived = useMemo(
        () => transactions
            .filter((tx) => isDepositTransaction(tx) && isCurrentMonth(tx?.createdAt || tx?.createAt || tx?.transactionDate))
            .reduce((sum, tx) => sum + getTransactionAmount(tx), 0),
        [transactions],
    );

    const sortedConversations = useMemo(() => {
        const list = [...conversations];
        list.sort((a, b) => {
            const ta = new Date(a?.lastMessageTime || a?.updatedAt || 0).getTime();
            const tb = new Date(b?.lastMessageTime || b?.updatedAt || 0).getTime();
            return tb - ta;
        });
        return list.slice(0, 3);
    }, [conversations]);

    const showShipmentWidget = !loadingShipments && shipmentCandidates.length > 0;
    const displayName = user?.fullName || user?.name || user?.username || 'bạn';

    const handleNotificationClick = async (notification) => {
        if (!notification) return;

        if (!notification?.read && notification?.id) {
            const res = await markNotificationAsRead(notification.id);
            if (!res.success) {
                appToast.error('Không thể đánh dấu đã đọc', res.error || 'Vui lòng thử lại.');
                return;
            }

            setNotifications((prev) => prev.map((item) => (item?.id === notification.id ? { ...item, read: true } : item)));
            setNotificationCount((prev) => Math.max(0, prev - 1));
        }

        const targetUrl = resolveNotificationTarget(notification);
        setShowNotifications(false);

        if (targetUrl) {
            navigate(targetUrl);
        }
    };

    return (
        <div className="wb">
            <header className="wb-header">
                <div>
                    <h1 className="wb-title">Workbench</h1>
                    <p className="wb-subtitle">Xin chào {displayName}! Hôm nay bạn có {actionableCount} việc cần xử lý.</p>
                </div>

                <div className="wb-header-actions">
                    <div className="wb-notification-wrap">
                        <button type="button" className="wb-notification-btn" onClick={() => setShowNotifications((value) => !value)} aria-label="Thông báo">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 17H5l1.4-1.4A2 2 0 0 0 7 14.2V10a5 5 0 1 1 10 0v4.2a2 2 0 0 0 .6 1.4L19 17h-4m-5 0a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="wb-notification-badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
                        </button>

                        {showNotifications && (
                            <div className="wb-notification-dropdown" role="dialog" aria-label="Danh sách thông báo">
                                <div className="wb-notification-dropdown-header">
                                    <h4>Thông báo mới</h4>
                                    <button
                                        type="button"
                                        className="wb-notification-mark-all"
                                        onClick={async () => {
                                            const res = await markAllNotificationsAsRead();
                                            if (res.success) {
                                                setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
                                                setNotificationCount(0);
                                            } else {
                                                appToast.error('Không thể đánh dấu đã đọc', res.error || 'Vui lòng thử lại.');
                                            }
                                        }}
                                    >
                                        Đánh dấu tất cả đã đọc
                                    </button>
                                </div>
                                <div className="wb-notification-list">
                                    {notifications.length === 0 ? (
                                        <div className="wb-notification-empty">Chưa có thông báo mới.</div>
                                    ) : (
                                        notifications.map((notification, index) => (
                                            <button
                                                key={notification?.id || index}
                                                type="button"
                                                className={`wb-notification-item ${notification?.read ? '' : 'unread'}`}
                                                onClick={() => {
                                                    void handleNotificationClick(notification);
                                                }}
                                            >
                                                <div className="wb-notification-item-top">
                                                    <span className="wb-notification-title">{notification?.title || notification?.type || 'Thông báo'}</span>
                                                    <span className={`wb-notification-priority ${String(notification?.priority || 'low').toLowerCase()}`}>{notification?.priority || 'LOW'}</span>
                                                </div>
                                                <p className="wb-notification-message">{notification?.message || notification?.content || 'Bạn có một thông báo mới.'}</p>
                                                <span className="wb-notification-time">{notification?.createdAt || notification?.time || ''}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <button type="button" className="wb-btn wb-btn--primary" onClick={() => navigate('/artisan/templates')}>+ Thêm sản phẩm</button>
                </div>
            </header>

            <section className="wb-stats">
                <StatCard label="Đơn đang xử lý" value={loadingOrders ? '...' : processingOrdersCount} />
                <StatCard label="Doanh thu tháng này" value={loadingWallet ? '...' : formatCurrencyVnd(monthlyRevenue)} />
                <StatCard label="Yêu cầu mới" value={loadingRequests ? '...' : openRequestTotal} />
                <StatCard label="Đánh giá TB" value="—" />
            </section>

            <section className="wb-grid">
                <div className="wb-col">
                    <Widget title="Đơn hàng đang xử lý" actionText="Xem tất cả →" onAction={() => navigate('/artisan/orders')}>
                        {loadingOrders ? (
                            <WidgetSkeleton rows={3} />
                        ) : latestOrders.length === 0 ? (
                            <EmptyState text="Chưa có đơn hàng nào." />
                        ) : (
                            <div className="wb-list">
                                {latestOrders.map((order) => {
                                    const id = order?.orderId || order?.id;
                                    const quantity = (order?.orderDetails || []).reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
                                    return (
                                        <div key={id} className="wb-item">
                                            <div className="wb-item-head">
                                                <span className="wb-mono">#{shortId(id)}</span>
                                                <span className={`wb-badge ${getStatusClass(order?.status)}`}>{getOrderStatusLabel(order?.status)}</span>
                                            </div>
                                            <p className="wb-item-meta">
                                                {formatDate(order?.orderDate || order?.createAt)} · {formatCurrencyVnd(order?.total)} · {getPaymentMethodLabel(order?.paymentMethod)} · {quantity} SP
                                            </p>
                                            <button type="button" className="wb-link-btn" onClick={() => navigate(`/artisan/orders/${id}`)}>Chi tiết</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Widget>

                    <Widget title="Đơn tùy chỉnh đang làm" actionText="Quản lý →" onAction={() => navigate('/artisan/orders')}>
                        {loadingCustomOrders ? (
                            <WidgetSkeleton rows={3} />
                        ) : customOrdersWithStage.length === 0 ? (
                            <EmptyState text="Không có đơn tùy chỉnh đang làm." />
                        ) : (
                            <div className="wb-list">
                                {customOrdersWithStage.slice(0, 3).map(({ order, stage }) => {
                                    const stageStatus = normalizeStatus(stage?.status);
                                    const dotClass = stageStatus === 'PAID' ? 'wb-dot--warning' : stageStatus === 'COMPLETED' ? 'wb-dot--gray' : 'wb-dot--success';
                                    const orderId = order?.id || order?.customOrderId || order?.orderId;
                                    return (
                                        <div key={orderId} className="wb-item">
                                            <div className="wb-item-head">
                                                <div className="wb-dot-title">
                                                    <span className={`wb-dot ${dotClass}`} />
                                                    <span>{order?.title || order?.requestTitle || `Custom #${shortId(orderId)}`}</span>
                                                </div>
                                                <span className={`wb-badge ${getStatusClass(order?.status)}`}>{getOrderStatusLabel(order?.status)}</span>
                                            </div>
                                            <p className="wb-item-meta">
                                                Stage {stage?.stageOrder ?? stage?.order ?? '—'}: {stage?.name || '—'} · Hạn {formatDate(getDueDate(stage))}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Widget>

                    <Widget title="Ví">
                        {loadingWallet ? (
                            <WidgetSkeleton rows={2} />
                        ) : (
                            <div className="wb-wallet">
                                <p className="wb-wallet-label">Số dư ví</p>
                                <h3 className="wb-wallet-balance">{formatCurrencyVnd(wallet?.balance || wallet?.currentBalance || 0)}</h3>
                                <div className="wb-wallet-meta">
                                    <div className="wb-wallet-box">
                                        <span>Tổng nhận</span>
                                        <strong>{formatCurrencyVnd(totalReceived)}</strong>
                                    </div>
                                    <div className="wb-wallet-box">
                                        <span>Tháng này</span>
                                        <strong>{formatCurrencyVnd(monthReceived)}</strong>
                                    </div>
                                    <button type="button" className="wb-wallet-link" onClick={() => navigate('/artisan/wallet')}>Xem lịch sử →</button>
                                </div>
                            </div>
                        )}
                    </Widget>
                </div>

                <div className="wb-col">
                    <Widget
                        title="Yêu cầu từ khách"
                        titleAddon={!loadingRequests && openRequestTotal > 0 ? <span className="wb-new-badge">{openRequestTotal} mới</span> : null}
                    >
                        {loadingRequests ? (
                            <WidgetSkeleton rows={3} />
                        ) : openRequests.length === 0 ? (
                            <EmptyState text="Hiện chưa có yêu cầu mở." />
                        ) : (
                            <>
                                <div className="wb-list">
                                    {openRequests.map((req, index) => (
                                        <div key={req?.id || req?.customRequestId || index} className="wb-item">
                                            <div className="wb-item-head">
                                                <strong>{req?.title || req?.name || 'Yêu cầu tùy chỉnh'}</strong>
                                            </div>
                                            <p className="wb-item-meta">
                                                {formatCurrencyVnd(req?.maxBudget || req?.budget || 0)} · {getRelative(req?.createdAt || req?.createAt)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" className="wb-full-btn" onClick={() => navigate('/artisan/requests')}>Xem tất cả yêu cầu →</button>
                            </>
                        )}
                    </Widget>

                    <Widget title="Tin nhắn" actionText="Xem tất cả →" onAction={() => navigate('/artisan/messages')}>
                        {loadingMessages ? (
                            <WidgetSkeleton rows={3} />
                        ) : sortedConversations.length === 0 ? (
                            <EmptyState text="Chưa có hội thoại nào." />
                        ) : (
                            <div className="wb-list">
                                {sortedConversations.map((conv, index) => {
                                    const name = getConversationName(conv);
                                    return (
                                        <div key={conv?.conversationId || conv?.id || index} className="wb-item wb-chat-item">
                                            <div className="wb-avatar">{getInitials(name)}</div>
                                            <div className="wb-chat-content">
                                                <div className="wb-item-head">
                                                    <strong>{name}</strong>
                                                    {Number(conv?.unreadCount || 0) > 0 && <span className="wb-unread-dot" />}
                                                </div>
                                                <p className="wb-item-meta wb-truncate">{conv?.lastMessage || 'Chưa có tin nhắn'}</p>
                                            </div>
                                            <span className="wb-chat-time">{formatDateTime(conv?.lastMessageTime || conv?.updatedAt)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Widget>

                    {showShipmentWidget && (
                        <Widget title="Cần tạo vận đơn">
                            <div className="wb-list">
                                {shipmentCandidates.slice(0, 3).map((order) => {
                                    const id = order?.orderId || order?.id;
                                    return (
                                        <div key={id} className="wb-item">
                                            <div className="wb-item-head">
                                                <strong>Đơn #{shortId(id)}</strong>
                                                <span className={`wb-badge ${getStatusClass(order?.status)}`}>{getOrderStatusLabel(order?.status)}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="wb-link-btn"
                                                onClick={() => navigate(`/artisan/orders/${id}`, { state: { focusShipment: true } })}
                                            >
                                                Tạo vận đơn
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </Widget>
                    )}
                </div>
            </section>
        </div>
    );
};

const StatCard = ({ label, value }) => (
    <article className="wb-stat-card">
        <p className="wb-stat-label">{label}</p>
        <p className="wb-stat-value">{value}</p>
    </article>
);

const Widget = ({ title, titleAddon, actionText, onAction, children }) => (
    <article className="wb-widget">
        <div className="wb-widget-head">
            <div className="wb-widget-title-wrap">
                <h3>{title}</h3>
                {titleAddon}
            </div>
            {actionText && (
                <button type="button" className="wb-header-link" onClick={onAction}>{actionText}</button>
            )}
        </div>
        {children}
    </article>
);

const WidgetSkeleton = ({ rows = 3 }) => (
    <div className="wb-skeleton-wrap">
        {Array.from({ length: rows }).map((_, index) => (
            <div className="wb-skeleton" key={index} />
        ))}
    </div>
);

const EmptyState = ({ text }) => <p className="wb-empty">{text}</p>;

export default Workbench;
