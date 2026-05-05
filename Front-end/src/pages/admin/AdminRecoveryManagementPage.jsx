import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Navigate } from 'react-router-dom';
import { FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiSearch, FiShield, FiSlash, FiPhone, FiMail } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import {
    blacklistArtisanApi,
    getRecoveryTasksApi,
    markRecoveryTaskRecoveredApi,
    removeArtisanBlacklistApi,
} from '../../services/recoveryService';
import './admin-common.css';
import './AdminRecoveryManagementPage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatDateTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

const getInitials = (name) => {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 'U';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const AdminRecoveryManagementPage = () => {
    const { user, isAuthenticated } = useAuth();
    const role = String(user?.role || user?.roleName || '').toUpperCase();
    const isAdmin = role === 'ADMIN';

    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState('');
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const loadTasks = async () => {
        setLoading(true);
        const res = await getRecoveryTasksApi();
        if (!res.success) {
            appToast.error('Không tải được recovery tasks', res.error || 'Vui lòng thử lại');
            setTasks([]);
        } else {
            setTasks(Array.isArray(res.data) ? res.data : []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!isAuthenticated || !isAdmin) return;

        void (async () => {
            await loadTasks();
        })();
    }, [isAuthenticated, isAdmin]);

    const filteredTasks = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return [...tasks]
            .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
            .filter((task) => {
                const matchesStatus = statusFilter === 'ALL' || String(task?.status || '').toUpperCase() === statusFilter;
                const text = [task?.artisanName, task?.artisanId, task?.email, task?.phone, task?.orderId, task?.reason]
                    .map((item) => String(item || '').toLowerCase())
                    .join(' ');
                const matchesKeyword = !keyword || text.includes(keyword);
                return matchesStatus && matchesKeyword;
            });
    }, [tasks, search, statusFilter]);

    const stats = useMemo(() => ({
        totalTasks: tasks.length,
        pendingTasks: tasks.filter((task) => String(task?.status || '').toUpperCase() === 'PENDING').length,
        recoveredTasks: tasks.filter((task) => String(task?.status || '').toUpperCase() === 'RECOVERED').length,
        totalAmount: tasks.reduce((sum, task) => sum + Number(task?.refundAmount || 0), 0),
        pendingAmount: tasks.filter((task) => String(task?.status || '').toUpperCase() === 'PENDING')
            .reduce((sum, task) => sum + Number(task?.refundAmount || 0), 0),
    }), [tasks]);

    const handleMarkRecovered = async (task) => {
        if (!task?.taskId) return;
        if (!window.confirm('Xác nhận bạn đã thu hồi được tiền từ nghệ nhân?')) return;

        setSubmittingId(String(task.taskId));
        const res = await markRecoveryTaskRecoveredApi(task.taskId);
        setSubmittingId('');

        if (!res.success) {
            appToast.error('Không thể đánh dấu đã xử lý', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Đã đánh dấu recovery task là hoàn thành');
        await loadTasks();
    };

    const handleBlacklist = async (task) => {
        if (!task?.artisanId) return;
        const reason = window.prompt('Lý do blacklist nghệ nhân này:');
        if (reason === null) return;
        if (!reason.trim()) {
            appToast.warning('Vui lòng nhập lý do blacklist');
            return;
        }
        if (!window.confirm('Xác nhận blacklist nghệ nhân? Họ sẽ không thể nhận đơn mới.')) return;

        setSubmittingId(String(task.artisanId));
        const res = await blacklistArtisanApi(task.artisanId);
        setSubmittingId('');

        if (!res.success) {
            appToast.error('Không thể blacklist artisan', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Đã blacklist nghệ nhân');
        await loadTasks();
    };

    const handleRemoveBlacklist = async (task) => {
        if (!task?.artisanId) return;
        if (!window.confirm('Xác nhận gỡ blacklist cho nghệ nhân này?')) return;

        setSubmittingId(String(task.artisanId));
        const res = await removeArtisanBlacklistApi(task.artisanId);
        setSubmittingId('');

        if (!res.success) {
            appToast.error('Không thể gỡ blacklist', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Đã gỡ blacklist nghệ nhân');
        await loadTasks();
    };

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/" replace />;

    return (
        <div className="admin-page admin-recovery-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Quản lý thu hồi tiền</h1>
                    <p className="admin-page-subtitle">Theo dõi và xử lý các khoản tiền cần thu hồi từ nghệ nhân để đảm bảo dòng tiền hệ thống.</p>
                </div>
                <button type="button" className="btn btn-outline" onClick={loadTasks} disabled={loading}>
                    <FiRefreshCw /> Làm mới
                </button>
            </div>

            {loading ? (
                <div className="admin-recovery-skeleton-grid">
                    <div className="admin-recovery-skeleton" />
                    <div className="admin-recovery-skeleton" />
                    <div className="admin-recovery-skeleton" />
                    <div className="admin-recovery-skeleton" />
                </div>
            ) : (
                <>
                    <section className="admin-recovery-stats-grid">
                        <article className="admin-recovery-stat">
                            <p>Tổng tasks</p>
                            <h3>{stats.totalTasks}</h3>
                        </article>
                        <article className="admin-recovery-stat warning">
                            <p>Đang chờ xử lý</p>
                            <h3>{stats.pendingTasks}</h3>
                            <span>{formatCurrency(stats.pendingAmount)}</span>
                        </article>
                        <article className="admin-recovery-stat success">
                            <p>Đã thu hồi</p>
                            <h3>{stats.recoveredTasks}</h3>
                        </article>
                        <article className="admin-recovery-stat">
                            <p>Tổng số tiền</p>
                            <h3>{formatCurrency(stats.totalAmount)}</h3>
                        </article>
                    </section>

                    <section className="admin-card table-card admin-recovery-table-card">
                        <div className="admin-recovery-toolbar">
                            <div className="admin-recovery-search">
                                <FiSearch className="control-icon" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên, email, phone, order ID..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </div>

                            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="PENDING">Chưa xử lý</option>
                                <option value="RECOVERED">Đã thu hồi</option>
                            </select>
                        </div>

                        <div className="table-responsive">
                            <table className="admin-table admin-recovery-table">
                                <thead>
                                    <tr>
                                        <th>NGHỆ NHÂN</th>
                                        <th>LIÊN HỆ</th>
                                        <th>SỐ TIỀN</th>
                                        <th>ĐƠN HÀNG</th>
                                        <th>NGÀY TẠO</th>
                                        <th>TRẠNG THÁI</th>
                                        <th>HÀNH ĐỘNG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="empty-state">
                                                <div className="admin-empty-state">
                                                    <FiAlertTriangle style={{ fontSize: '2rem' }} />
                                                    <p>Không có recovery task nào</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTasks.map((task) => {
                                            const status = String(task?.status || 'PENDING').toUpperCase();
                                            const isPending = status === 'PENDING';
                                            const disabled = submittingId && submittingId !== String(task?.taskId) && submittingId !== String(task?.artisanId);

                                            return (
                                                <tr key={task?.taskId} className={status === 'RECOVERED' ? 'recovered-row' : 'pending-row'}>
                                                    <td>
                                                        <div className="admin-recovery-artisan-cell">
                                                            <span className="admin-recovery-avatar">{getInitials(task?.artisanName)}</span>
                                                            <div>
                                                                <p className="admin-recovery-name">{task?.artisanName || '—'}</p>
                                                                <span className="admin-recovery-sub">ID: {task?.artisanId || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="admin-recovery-contact">
                                                            <span><FiMail /> {task?.email || '—'}</span>
                                                            <span><FiPhone /> {task?.phone || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <strong className="admin-recovery-amount">{formatCurrency(task?.refundAmount || 0)}</strong>
                                                    </td>
                                                    <td>
                                                        <div className="admin-recovery-order">
                                                            <span className="mono">{task?.orderId || '—'}</span>
                                                            <small>{task?.reason || '—'}</small>
                                                        </div>
                                                    </td>
                                                    <td>{formatDateTime(task?.createdAt)}</td>
                                                    <td>
                                                        <span className={`admin-recovery-badge ${isPending ? 'pending' : 'recovered'}`}>
                                                            {isPending ? 'Chưa xử lý' : 'Đã thu hồi'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="admin-recovery-actions">
                                                            {isPending ? (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-action btn-success"
                                                                        disabled={Boolean(submittingId) || disabled}
                                                                        onClick={() => handleMarkRecovered(task)}
                                                                    >
                                                                        <FiCheckCircle /> Đánh dấu
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-action btn-danger"
                                                                        disabled={Boolean(submittingId) || disabled}
                                                                        onClick={() => handleBlacklist(task)}
                                                                    >
                                                                        <FiSlash /> Blacklist
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="btn-action btn-outline"
                                                                    disabled={Boolean(submittingId) || disabled}
                                                                    onClick={() => handleRemoveBlacklist(task)}
                                                                >
                                                                    <FiShield /> Gỡ blacklist
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

export default AdminRecoveryManagementPage;
