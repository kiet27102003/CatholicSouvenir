import React from 'react';
import {
    FiSearch,
    FiBell,
    FiSettings,
    FiGrid,
    FiUsers,
    FiClipboard,
    FiCheckCircle,
    FiTruck,
    FiAlertTriangle,
    FiMail,
    FiEdit3,
    FiTrendingUp,
} from 'react-icons/fi';
import './admin-common.css';
import './AdminDashboard.css';

const KPI_ITEMS = [
    {
        id: 'revenue',
        title: 'Tổng doanh thu',
        value: '1.062.520.000 VNĐ',
        trend: '↑ 12.5%',
        trendClass: 'up',
        icon: <FiTrendingUp />,
        iconClass: 'orange',
    },
    {
        id: 'artisan-requests',
        title: 'Đơn đăng ký đang chờ',
        value: '14',
        trend: '+ 3 mới',
        trendClass: 'up',
        icon: <FiUsers />,
        iconClass: 'amber',
    },
    {
        id: 'orders',
        title: 'Đơn hàng đặt riêng',
        value: '28',
        trend: '↓ 2%',
        trendClass: 'down',
        icon: <FiTruck />,
        iconClass: 'blue',
    },
    {
        id: 'incidents',
        title: 'Sự cố được báo cáo',
        value: '5',
        trend: 'Ổn định',
        trendClass: 'flat',
        icon: <FiAlertTriangle />,
        iconClass: 'red',
    },
];

const RECENT_ACTIVITIES = [
    {
        id: 1,
        icon: <FiUsers />,
        iconClass: 'green',
        title: 'Đăng ký Nghệ nhân mới',
        description: 'St. Joseph Woodworks (Maria Rossi) đã gửi một đơn đăng ký mới từ Ý.',
        time: '24 phút trước',
    },
    {
        id: 2,
        icon: <FiClipboard />,
        iconClass: 'blue',
        title: 'Niêm yết sản phẩm mới',
        description: 'Tràng hạt gỗ Olive chạm tay được niêm yết bởi Bethlehem Crafts. Cần duyệt.',
        time: '1 giờ trước',
    },
    {
        id: 3,
        icon: <FiCheckCircle />,
        iconClass: 'orange',
        title: 'Đơn hàng đã hoàn tất',
        description: 'Đơn hàng #ORD-9022 gồm 10x Quà tặng Rửa tội đã được đánh dấu là đã gửi.',
        time: '3 giờ trước',
    },
    {
        id: 4,
        icon: <FiUsers />,
        iconClass: 'green',
        title: 'Người dùng mới đăng ký',
        description: 'Thomas Miller đã tạo một tài khoản khách hàng mới.',
        time: '5 giờ trước',
    },
];

const QUICK_ACTIONS = [
    { id: 1, label: 'Duyệt 14 đơn đăng ký', icon: <FiCheckCircle /> },
    { id: 2, label: 'Phê duyệt sản phẩm', icon: <FiEdit3 /> },
    { id: 3, label: 'Email cho tất cả nghệ nhân', icon: <FiMail /> },
];

const AdminDashboard = () => {
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
                    <p>Trạng thái và hiệu suất của Thị trường Quà tặng Công giáo hôm nay.</p>
                </section>

                <section className="dashboard-kpis">
                    {KPI_ITEMS.map((item) => (
                        <article className="dashboard-kpi-card" key={item.id}>
                            <div className="dashboard-kpi-top">
                                <div className={`kpi-icon ${item.iconClass}`}>{item.icon}</div>
                                <span className={`kpi-trend ${item.trendClass}`}>{item.trend}</span>
                            </div>
                            <p className="kpi-title">{item.title}</p>
                            <h3 className="kpi-value">{item.value}</h3>
                        </article>
                    ))}
                </section>

                <section className="dashboard-grid">
                    <article className="admin-card activity-card">
                        <header className="activity-header">
                            <h3>Hoạt động gần đây</h3>
                            <button type="button" className="activity-link">Xem tất cả</button>
                        </header>

                        <div className="activity-list">
                            {RECENT_ACTIVITIES.map((item) => (
                                <div className="activity-item" key={item.id}>
                                    <div className={`activity-icon ${item.iconClass}`}>{item.icon}</div>
                                    <div className="activity-content">
                                        <div className="activity-title-row">
                                            <h4>{item.title}</h4>
                                            <span>{item.time}</span>
                                        </div>
                                        <p>{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>

                    <aside className="dashboard-side-column">
                        <article className="admin-card quick-actions-card">
                            <h3>THAO TÁC NHANH</h3>
                            <div className="quick-actions-list">
                                {QUICK_ACTIONS.map((action) => (
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
                                <span>Tải máy chủ</span>
                                <strong>24%</strong>
                            </div>
                            <div className="status-row">
                                <span>Cổng thanh toán</span>
                                <strong className="status-ok">Đang hoạt động</strong>
                            </div>
                            <div className="status-progress">
                                <span style={{ width: '76%' }} />
                            </div>
                            <p>Sao lưu lần cuối: 12 phút trước</p>
                        </article>
                    </aside>
                </section>
            </div>
        </div>
    );
};

export default AdminDashboard;
