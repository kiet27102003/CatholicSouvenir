import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiSearch,
    FiFilter,
    FiEye,
    FiMail,
    FiUserX,
    FiUserCheck,
    FiUsers,
    FiUserPlus,
    FiRefreshCw,
    FiTrendingUp,
    FiActivity,
} from 'react-icons/fi';
import api from '../../cofig/api';
import { appToast } from '../../lib/appToast';
import AdminTopbar from './AdminTopbar';
import './admin-common.css';
import './UserManager.css';
import './AdminCustomerArtisan.css';

const API_ACCOUNTS = '/admin/accounts';
const PAGE_SIZE = 10;
const FETCH_SIZE = 100;
const MAX_PAGES = 50;

const displayVal = (v) => (v == null || v === '' ? '—' : v);

const getInitials = (name) => {
    const s = (name || '').trim();
    if (!s) return '?';
    const parts = s.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return s.slice(0, 2).toUpperCase();
};

const formatDateOnly = (val) => {
    if (val == null || val === '') return '—';
    try {
        return new Date(val).toLocaleDateString('vi-VN');
    } catch {
        return String(val);
    }
};

const formatMoneyVnd = (val) => {
    if (val == null || val === '') return '—';
    const n = typeof val === 'number' ? val : Number(val);
    if (Number.isNaN(n)) return '—';
    return `${n.toLocaleString('vi-VN')} VND`;
};

const isCustomerBlocked = (acc) =>
    acc.blocked === true ||
    acc.isBlocked === true ||
    String(acc.status || '').toUpperCase() === 'BLOCKED';

const CustomerManager = () => {
    const navigate = useNavigate();
    const [allCustomers, setAllCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [freqFilter, setFreqFilter] = useState('All');
    const [page, setPage] = useState(0);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const collected = [];
            let pageIndex = 0;
            let totalPages = 1;
            while (pageIndex < totalPages && pageIndex < MAX_PAGES) {
                const res = await api.get(API_ACCOUNTS, {
                    params: {
                        page: pageIndex,
                        size: FETCH_SIZE,
                        sortBy: 'createdDate',
                        sortDirection: 'DESC',
                    },
                });
                const pageData = res.data?.data ?? res.data;
                const list = pageData?.content ?? [];
                totalPages = pageData?.totalPages ?? 1;
                const customers = list.filter(
                    (a) => (a.roleName || '').toLowerCase() === 'customer'
                );
                collected.push(...customers);
                pageIndex += 1;
            }
            setAllCustomers(collected);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Kiểm tra kết nối mạng';
            appToast.error('Không tải được', typeof msg === 'string' ? msg : 'Kiểm tra kết nối mạng');
            setAllCustomers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const filtered = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return allCustomers.filter((acc) => {
            const name = (acc.fullName || '').toLowerCase();
            const email = (acc.email || '').toLowerCase();
            const matchSearch = !term || name.includes(term) || email.includes(term);
            const blocked = isCustomerBlocked(acc);
            const matchStatus =
                statusFilter === 'All' ||
                (statusFilter === 'active' && !blocked) ||
                (statusFilter === 'blocked' && blocked);
            const matchFreq = freqFilter === 'All';
            return matchSearch && matchStatus && matchFreq;
        });
    }, [allCustomers, searchTerm, statusFilter, freqFilter]);

    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
    const safePage = Math.min(page, totalPages - 1);
    const pageSlice = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
    const fromItem = totalFiltered === 0 ? 0 : safePage * PAGE_SIZE + 1;
    const toItem = Math.min((safePage + 1) * PAGE_SIZE, totalFiltered);

    useEffect(() => {
        setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
    }, [totalPages, searchTerm, statusFilter, freqFilter]);

    const goToPage = (p) => {
        const next = Math.max(0, Math.min(p, totalPages - 1));
        setPage(next);
    };

    const pageNumbers = useMemo(() => {
        const n = totalPages;
        if (n <= 5) return Array.from({ length: n }, (_, i) => i);
        if (safePage <= 1) return [0, 1, 2];
        if (safePage >= n - 2) return [n - 3, n - 2, n - 1];
        return [safePage - 1, safePage, safePage + 1];
    }, [totalPages, safePage]);

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setFreqFilter('All');
        setPage(0);
    };

    const orderCount = (acc) => acc.orderCount ?? acc.totalOrders ?? acc.ordersCount;
    const totalSpend = (acc) => acc.totalSpent ?? acc.totalSpend ?? acc.totalSpending;

    return (
        <>
            <AdminTopbar title="Quản lý khách hàng" />
            <div className="admin-page user-manager-page">
            <div className="admin-page-header user-manager-header">
                <div>
                    <p className="admin-page-subtitle">
                        Theo dõi và quản lý thông tin khách hàng trên hệ thống
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn btn-primary btn-icon"
                        onClick={() => navigate('/admin/users')}
                    >
                        <FiUserPlus style={{ marginRight: 6 }} />
                        Thêm khách hàng
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline btn-icon"
                        onClick={() => fetchCustomers()}
                        disabled={loading}
                    >
                        <FiRefreshCw className={loading ? 'spin' : ''} />
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>
            </div>

            <div className="admin-stats-row">
                <div className="admin-stat-card">
                    <span className="stat-growth-placeholder" aria-hidden />
                    <div className="admin-stat-icon-wrap">
                        <FiUsers />
                    </div>
                    <div className="admin-stat-body">
                        <span className="admin-stat-label">Tổng khách hàng</span>
                        <div className="admin-stat-value" />
                    </div>
                </div>
                <div className="admin-stat-card">
                    <span className="stat-growth-placeholder" aria-hidden />
                    <div className="admin-stat-icon-wrap">
                        <FiTrendingUp />
                    </div>
                    <div className="admin-stat-body">
                        <span className="admin-stat-label">Khách hàng mới (Tháng này)</span>
                        <div className="admin-stat-value" />
                    </div>
                </div>
                <div className="admin-stat-card">
                    <span className="stat-growth-placeholder" aria-hidden />
                    <div className="admin-stat-icon-wrap">
                        <FiActivity />
                    </div>
                    <div className="admin-stat-body">
                        <span className="admin-stat-label">Người dùng hoạt động</span>
                        <div className="admin-stat-value" />
                    </div>
                </div>
            </div>

            <div className="controls-bar">
                <div className="search-box">
                    <FiSearch className="control-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(0);
                        }}
                    />
                </div>
                <div className="filter-box">
                    <FiFilter className="control-icon" />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                        }}
                    >
                        <option value="All">Tất cả</option>
                        <option value="active">Hoạt động</option>
                        <option value="blocked">Bị chặn</option>
                    </select>
                </div>
                <div className="filter-box">
                    <FiFilter className="control-icon" />
                    <select
                        value={freqFilter}
                        onChange={(e) => {
                            setFreqFilter(e.target.value);
                            setPage(0);
                        }}
                    >
                        <option value="All">Tần suất: Tất cả</option>
                    </select>
                </div>
                <button type="button" className="filter-icon-btn" title="Đặt lại bộ lọc" onClick={resetFilters}>
                    <FiFilter />
                </button>
            </div>

            <div className="admin-card table-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Khách hàng</th>
                                <th>Ngày đăng ký</th>
                                <th>Đơn hàng</th>
                                <th>Tổng chi tiêu</th>
                                <th>Trạng thái</th>
                                <th className="text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="empty-state">
                                        <div className="admin-empty-state">
                                            <FiRefreshCw className="spin" style={{ fontSize: '2rem' }} />
                                            <p>Đang tải...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : pageSlice.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-state">
                                        <div className="admin-empty-state">
                                            <FiUsers
                                                style={{ fontSize: '2.5rem', color: 'var(--admin-border)' }}
                                            />
                                            <h4>Không có khách hàng</h4>
                                            <p>Thử thay đổi từ khóa hoặc bộ lọc.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                pageSlice.map((acc, index) => {
                                    const blocked = isCustomerBlocked(acc);
                                    return (
                                        <tr
                                            key={acc.accountId || `${acc.email}-${index}`}
                                            className="animate-fade-in row-delay"
                                        >
                                            <td>
                                                <div className="table-user-cell">
                                                    <div className="table-avatar-initials" aria-hidden>
                                                        {getInitials(acc.fullName || acc.email)}
                                                    </div>
                                                    <div className="table-user-info">
                                                        <span className="user-name">
                                                            {displayVal(acc.fullName)}
                                                        </span>
                                                        <span className="user-email">
                                                            {displayVal(acc.email)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{formatDateOnly(acc.createdDate ?? acc.createdAt)}</td>
                                            <td>{displayVal(orderCount(acc))}</td>
                                            <td>{formatMoneyVnd(totalSpend(acc))}</td>
                                            <td>
                                                <span
                                                    className={`status-badge ${
                                                        blocked ? 'badge-danger' : 'badge-success'
                                                    }`}
                                                >
                                                    {blocked ? 'Bị chặn' : 'Hoạt động'}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <div className="action-icons-row">
                                                    <button
                                                        type="button"
                                                        className="btn-action"
                                                        title="Xem chi tiết"
                                                        onClick={() =>
                                                            acc.accountId &&
                                                            navigate(`/admin/customers/${acc.accountId}`)
                                                        }
                                                        disabled={!acc.accountId}
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <a
                                                        className="btn-action"
                                                        title="Gửi email"
                                                        href={
                                                            acc.email
                                                                ? `mailto:${encodeURIComponent(acc.email)}`
                                                                : undefined
                                                        }
                                                        onClick={(e) => {
                                                            if (!acc.email) e.preventDefault();
                                                        }}
                                                        style={{
                                                            textDecoration: 'none',
                                                            opacity: acc.email ? 1 : 0.45,
                                                            pointerEvents: acc.email ? 'auto' : 'none',
                                                        }}
                                                    >
                                                        <FiMail />
                                                    </a>
                                                    <button type="button" className="btn-action" title="Chặn / mở chặn">
                                                        {blocked ? <FiUserCheck /> : <FiUserX />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && totalFiltered > 0 && (
                    <div className="table-footer">
                        <span className="showing-text">
                            Đang hiển thị {fromItem} - {toItem} trên tổng số {totalFiltered} khách hàng
                        </span>
                        <div className="pagination pagination-pages">
                            <button
                                type="button"
                                className="btn-page"
                                disabled={safePage <= 0}
                                onClick={() => goToPage(safePage - 1)}
                            >
                                Trước
                            </button>
                            {pageNumbers.map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    className={`btn-page page-num${num === safePage ? ' active' : ''}`}
                                    onClick={() => goToPage(num)}
                                >
                                    {num + 1}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="btn-page"
                                disabled={safePage >= totalPages - 1}
                                onClick={() => goToPage(safePage + 1)}
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
        </>
    );
};

export default CustomerManager;
