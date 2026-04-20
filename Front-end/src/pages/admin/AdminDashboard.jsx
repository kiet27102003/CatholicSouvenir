import React, { useEffect, useMemo, useState } from 'react';
import {
    FiBell,
    FiCheckCircle,
    FiClipboard,
    FiEdit3,
    FiMail,
    FiSearch,
    FiSettings,
    FiTrendingUp,
    FiTruck,
    FiUsers,
} from 'react-icons/fi';
import api from '../../cofig/api';
import './admin-common.css';
import './AdminDashboard.css';

const DASHBOARD_DAYS = 30;

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VNĐ`;
const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const emptyDashboard = {
    summary: { totalOrders: 0, totalRevenue: 0 },
    customerStats: { activeCustomers: 0, newCustomers: 0, totalCustomers: 0 },
    artisanStats: { activeArtisans: 0, pendingArtisans: 0, totalArtisans: 0 },
    customOrderStats: { averageOrderValue: 0, conversionRate: 0, totalOrders: 0, totalRequests: 0 },
    complaintStats: { approvedComplaints: 0, pendingComplaints: 0, rejectedComplaints: 0, totalComplaints: 0, totalRefundAmount: 0 },
    revenueBreakdown: { productRevenue: 0, templateRevenue: 0, customRevenue: 0, totalCommission: 0 },
    productAnalytics: { approvedProducts: 0, averagePrice: 0, pendingProducts: 0, totalProducts: 0 },
    orderStatus: {},
    topArtisans: [],
    topCustomers: [],
    topProducts: [],
    revenueChart: [],
};

const toPercent = (value) => `${Math.max(0, Math.min(100, Number(value) || 0)).toFixed(0)}%`;

const toRate = (part, total) => `${Number(total) > 0 ? ((Number(part) / Number(total)) * 100).toFixed(1) : '0.0'}%`;

const buildRevenueBars = (items) => {
    const list = Array.isArray(items) ? items : [];
    const peak = Math.max(...list.map((item) => Number(item?.revenue || 0)), 1);
    return list.map((item) => ({
        ...item,
        height: Math.max(12, Math.round((Number(item?.revenue || 0) / peak) * 100)),
    }));
};

const buildCategoryBars = (items, valueKey = 'revenue') => {
    const list = Array.isArray(items) ? items : [];
    const peak = Math.max(...list.map((item) => Number(item?.[valueKey] || 0)), 1);
    return list.map((item, index) => ({
        ...item,
        id: item?.id || item?.productId || item?.customerId || item?.artisanId || item?.templateId || `${valueKey}-${index}`,
        height: Math.max(12, Math.round((Number(item?.[valueKey] || 0) / peak) * 100)),
    }));
};

const AdminDashboard = () => {
    const [dashboard, setDashboard] = useState(emptyDashboard);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadDashboard = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await api.get('/admin/dashboard', { params: { days: DASHBOARD_DAYS } });
                const payload = response?.data?.data ?? response?.data ?? {};

                if (!isMounted) return;

                const merged = {
                    ...emptyDashboard,
                    ...payload,
                    summary: { ...emptyDashboard.summary, ...(payload.summary || {}) },
                    customerStats: { ...emptyDashboard.customerStats, ...(payload.customerStats || {}) },
                    artisanStats: { ...emptyDashboard.artisanStats, ...(payload.artisanStats || {}) },
                    customOrderStats: { ...emptyDashboard.customOrderStats, ...(payload.customOrderStats || {}) },
                    complaintStats: { ...emptyDashboard.complaintStats, ...(payload.complaintStats || {}) },
                    revenueBreakdown: { ...emptyDashboard.revenueBreakdown, ...(payload.revenueBreakdown || {}) },
                    productAnalytics: { ...emptyDashboard.productAnalytics, ...(payload.productAnalytics || {}) },
                    orderStatus: payload.orderStatus || {},
                    topArtisans: Array.isArray(payload.topArtisans) ? payload.topArtisans : [],
                    topCustomers: Array.isArray(payload.topCustomers) ? payload.topCustomers : [],
                    topProducts: Array.isArray(payload.topProducts) ? payload.topProducts : [],
                    topTemplates: Array.isArray(payload.topTemplates) ? payload.topTemplates : [],
                    revenueChart: Array.isArray(payload.revenueChart) ? payload.revenueChart : [],
                };

                setDashboard(merged);
                console.info('[AdminDashboard] Loaded dashboard data', {
                    days: DASHBOARD_DAYS,
                    summary: merged.summary,
                    artisanStats: merged.artisanStats,
                    customerStats: merged.customerStats,
                    productAnalytics: merged.productAnalytics,
                    topArtisans: merged.topArtisans.length,
                    topCustomers: merged.topCustomers.length,
                    topProducts: merged.topProducts.length,
                    topTemplates: merged.topTemplates.length,
                    revenueChartPoints: merged.revenueChart.length,
                });
            } catch (err) {
                if (!isMounted) return;
                const message = err?.response?.data?.message || err?.message || 'Không tải được dashboard.';
                setError(message);
                console.error('[AdminDashboard] Failed to load dashboard data', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();
        return () => {
            isMounted = false;
        };
    }, []);

    const kpis = useMemo(() => ([
        {
            id: 'revenue',
            title: 'Tổng doanh thu',
            value: formatCurrency(dashboard.summary.totalRevenue),
            trend: `Trong ${DASHBOARD_DAYS} ngày gần nhất`,
            trendClass: 'up',
            icon: <FiTrendingUp />,
            iconClass: 'orange',
        },
        {
            id: 'customers',
            title: 'Khách hàng mới',
            value: formatNumber(dashboard.customerStats.newCustomers),
            trend: `${formatNumber(dashboard.customerStats.activeCustomers)} đang hoạt động`,
            trendClass: 'up',
            icon: <FiUsers />,
            iconClass: 'amber',
        },
        {
            id: 'orders',
            title: 'Đơn hàng',
            value: formatNumber(dashboard.summary.totalOrders),
            trend: `Custom: ${formatNumber(dashboard.customOrderStats.totalOrders)} | Requests: ${formatNumber(dashboard.customOrderStats.totalRequests)}`,
            trendClass: 'flat',
            icon: <FiTruck />,
            iconClass: 'blue',
        },
        {
            id: 'complaints',
            title: 'Khiếu nại',
            value: formatNumber(dashboard.complaintStats.totalComplaints),
            trend: `${formatNumber(dashboard.complaintStats.pendingComplaints)} chờ xử lý`,
            trendClass: 'down',
            icon: <FiCheckCircle />,
            iconClass: 'red',
        },
    ]), [dashboard]);

    const revenueTrend = useMemo(() => buildRevenueBars(dashboard.revenueChart), [dashboard.revenueChart]);
    const orderStatusBars = useMemo(() => buildCategoryBars(Object.entries(dashboard.orderStatus || {}).map(([status, value]) => ({ id: status, label: status, value })), 'value'), [dashboard.orderStatus]);
    const topCustomerBars = useMemo(() => buildCategoryBars(dashboard.topCustomers.slice(0, 5), 'totalSpent'), [dashboard.topCustomers]);
    const topProductBars = useMemo(() => buildCategoryBars(dashboard.topProducts.slice(0, 5), 'revenue'), [dashboard.topProducts]);

    const recentActivities = useMemo(() => {
        const topCustomers = dashboard.topCustomers.slice(0, 4).map((customer, index) => ({
            id: `customer-${customer.customerId || index}`,
            icon: <FiUsers />,
            iconClass: 'green',
            title: `Khách hàng ${customer.customerName}`,
            description: `${customer.email} • ${formatNumber(customer.totalOrders)} đơn • ${formatCurrency(customer.totalSpent)}`,
            time: `Top #${index + 1}`,
        }));

        const topProducts = dashboard.topProducts.slice(0, 4).map((product, index) => ({
            id: `product-${product.productId || index}`,
            icon: <FiClipboard />,
            iconClass: 'blue',
            title: `Sản phẩm ${product.productName}`,
            description: `${formatNumber(product.sold)} đã bán • ${formatCurrency(product.revenue)}`,
            time: `Top #${index + 1}`,
        }));

        return [...topCustomers, ...topProducts].slice(0, 4);
    }, [dashboard.topCustomers, dashboard.topProducts]);

    const quickActions = useMemo(() => [
        { id: 1, label: `Duyệt ${formatNumber(dashboard.artisanStats.pendingArtisans)} đơn đăng ký`, icon: <FiCheckCircle /> },
        { id: 2, label: `Sản phẩm chờ duyệt: ${formatNumber(dashboard.productAnalytics.pendingProducts)}`, icon: <FiEdit3 /> },
        { id: 3, label: `Khiếu nại chờ xử lý: ${formatNumber(dashboard.complaintStats.pendingComplaints)}`, icon: <FiMail /> },
    ], [dashboard.artisanStats.pendingArtisans, dashboard.complaintStats.pendingComplaints, dashboard.productAnalytics.pendingProducts]);

    return (
        <div className="admin-dashboard-page">
            <header className="dashboard-topbar">
                <div className="dashboard-search">
                    <FiSearch className="dashboard-search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm đơn hàng, nghệ nhân hoặc sản phẩm..."
                        aria-label="Tìm kiếm quản trị"
                    />
                </div>

                <div className="dashboard-topbar-actions">
                    <button type="button" className="dashboard-icon-btn" aria-label="Thông báo">
                        <FiBell />
                    </button>
                    <button type="button" className="dashboard-icon-btn" aria-label="Cài đặt">
                        <FiSettings />
                    </button>
                </div>
            </header>

            <div className="dashboard-body admin-page">
                <section className="dashboard-heading">
                    <h1>Tổng quan Thị trường</h1>
                    <p>Trạng thái và hiệu suất của Thị trường Quà tặng Công giáo trong {DASHBOARD_DAYS} ngày gần nhất.</p>
                    {error && <p className="dashboard-error">{error}</p>}
                </section>

                <section className="dashboard-kpis">
                    {kpis.map((item) => (
                        <article className="dashboard-kpi-card" key={item.id}>
                            <div className="dashboard-kpi-top">
                                <div className={`kpi-icon ${item.iconClass}`}>{item.icon}</div>
                                <span className={`kpi-trend ${item.trendClass}`}>{item.trend}</span>
                            </div>
                            <p className="kpi-title">{item.title}</p>
                            <h3 className="kpi-value">{loading ? 'Đang tải...' : item.value}</h3>
                        </article>
                    ))}
                </section>

                <section className="dashboard-grid dashboard-grid--charts">
                    <article className="admin-card chart-card chart-card--wide">
                        <header className="activity-header">
                            <div>
                                <h3>Doanh thu theo ngày</h3>
                                <p>Dữ liệu từ `revenueChart`</p>
                            </div>
                            <button type="button" className="activity-link">Xem chi tiết</button>
                        </header>
                        <div className="chart-bars chart-bars--revenue">
                            {revenueTrend.length > 0 ? revenueTrend.map((item) => (
                                <div className="chart-bar-item" key={item.date}>
                                    <div className="chart-bar-track">
                                        <div className="chart-bar-fill" style={{ height: `${item.height}%` }} />
                                    </div>
                                    <strong>{formatCurrency(item.revenue)}</strong>
                                    <span>{item.orderNumber} đơn</span>
                                    <p>{item.date}</p>
                                </div>
                            )) : <p className="chart-empty">Chưa có dữ liệu doanh thu.</p>}
                        </div>
                    </article>

                    <article className="admin-card chart-card">
                        <header className="activity-header">
                            <div>
                                <h3>Trạng thái đơn hàng</h3>
                                <p>Từ `orderStatus` và hiệu suất</p>
                            </div>
                            <button type="button" className="activity-link">Xem chi tiết</button>
                        </header>
                        <div className="status-chart-list">
                            {Object.entries(dashboard.orderStatus || {}).map(([status, value]) => (
                                <div className="status-chart-row" key={status}>
                                    <span>{status}</span>
                                    <div className="status-chart-track">
                                        <div className="status-chart-fill" style={{ width: `${Math.min(100, Number(value) * 10)}%` }} />
                                    </div>
                                    <strong>{value}</strong>
                                </div>
                            ))}
                            <div className="status-chart-row status-chart-row--meta">
                                <span>Hoàn tất đơn</span>
                                <strong>{toPercent(dashboard.customOrderStats.conversionRate)}</strong>
                            </div>
                            <div className="status-chart-row status-chart-row--meta">
                                <span>Tỷ lệ khiếu nại</span>
                                <strong>{toRate(dashboard.complaintStats.pendingComplaints, dashboard.complaintStats.totalComplaints)}</strong>
                            </div>
                            <div className="status-chart-row status-chart-row--meta">
                                <span>Khách active</span>
                                <strong>{toRate(dashboard.customerStats.activeCustomers, dashboard.customerStats.totalCustomers)}</strong>
                            </div>
                        </div>
                    </article>

                    <article className="admin-card chart-card">
                        <header className="activity-header">
                            <div>
                                <h3>Top khách hàng</h3>
                                <p>Khách có tổng chi tiêu cao nhất</p>
                            </div>
                            <button type="button" className="activity-link">Xem thêm</button>
                        </header>
                        <div className="category-chart-list">
                            {topCustomerBars.length > 0 ? topCustomerBars.map((item, index) => (
                                <div className="category-chart-row" key={item.customerId || index}>
                                    <div className="category-chart-labels">
                                        <strong>{item.customerName || 'Khách hàng'}</strong>
                                        <span>{item.email || '—'}</span>
                                    </div>
                                    <div className="category-chart-track">
                                        <div className="category-chart-fill category-chart-fill--green" style={{ width: `${item.height}%` }} />
                                    </div>
                                    <strong>{formatCurrency(item.totalSpent)}</strong>
                                </div>
                            )) : <p className="chart-empty">Chưa có dữ liệu khách hàng.</p>}
                        </div>
                    </article>

                    <article className="admin-card chart-card">
                        <header className="activity-header">
                            <div>
                                <h3>Top sản phẩm</h3>
                                <p>Sản phẩm bán chạy nhất</p>
                            </div>
                            <button type="button" className="activity-link">Xem thêm</button>
                        </header>
                        <div className="category-chart-list">
                            {topProductBars.length > 0 ? topProductBars.map((item, index) => (
                                <div className="category-chart-row" key={item.productId || index}>
                                    <div className="category-chart-labels">
                                        <strong>{item.productName || 'Sản phẩm'}</strong>
                                        <span>{item.sold || 0} đã bán</span>
                                    </div>
                                    <div className="category-chart-track">
                                        <div className="category-chart-fill category-chart-fill--blue" style={{ width: `${item.height}%` }} />
                                    </div>
                                    <strong>{formatCurrency(item.revenue)}</strong>
                                </div>
                            )) : <p className="chart-empty">Chưa có dữ liệu sản phẩm.</p>}
                        </div>
                    </article>

                    <aside className="dashboard-side-column">
                        <article className="admin-card quick-actions-card">
                            <h3>THAO TÁC NHANH</h3>
                            <div className="quick-actions-list">
                                {quickActions.map((action) => (
                                    <button type="button" className="quick-action-item" key={action.id}>
                                        <span className="quick-action-icon">{action.icon}</span>
                                        <span>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </article>

                        <article className="admin-card system-status-card">
                            <h3>Trạng thái hệ thống</h3>
                            <div className="status-row">
                                <span>Nghệ nhân đang hoạt động</span>
                                <strong>{formatNumber(dashboard.artisanStats.activeArtisans)}/{formatNumber(dashboard.artisanStats.totalArtisans)}</strong>
                            </div>
                            <div className="status-row">
                                <span>Sản phẩm đang hoạt động</span>
                                <strong>{formatNumber(dashboard.productAnalytics.approvedProducts)}/{formatNumber(dashboard.productAnalytics.totalProducts)}</strong>
                            </div>
                            <div className="status-progress">
                                <span style={{ width: `${Math.min(100, dashboard.customerStats.totalCustomers ? (dashboard.customerStats.activeCustomers / dashboard.customerStats.totalCustomers) * 100 : 0)}%` }} />
                            </div>
                            <p>{loading ? 'Đang tải dữ liệu dashboard...' : `Tỷ lệ khách hàng active: ${dashboard.customerStats.totalCustomers ? ((dashboard.customerStats.activeCustomers / dashboard.customerStats.totalCustomers) * 100).toFixed(1) : '0.0'}%`}</p>
                        </article>
                    </aside>
                </section>
            </div>
        </div>
    );
};

export default AdminDashboard;