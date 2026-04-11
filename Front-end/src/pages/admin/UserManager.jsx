import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEye, FiUsers, FiRefreshCw, FiEdit2, FiSave, FiX, FiTrash2, FiAlertTriangle, FiUserPlus } from 'react-icons/fi';
import api from '../../cofig/api';
import { appToast } from '../../lib/appToast';
import './admin-common.css';
import './UserManager.css';

const API_ACCOUNTS = '/admin/accounts';
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT = { sortBy: 'createdDate', sortDirection: 'DESC' };

const ROLE_OPTIONS = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Customer' },
    { id: 3, name: 'Artisan' },
];

const UserManager = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [detailAccount, setDetailAccount] = useState(null);
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sortBy, setSortBy] = useState(DEFAULT_SORT.sortBy);
    const [sortDirection, setSortDirection] = useState(DEFAULT_SORT.sortDirection);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saveLoading, setSaveLoading] = useState(false);

    // Delete state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Create account state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        gender: '',
        dateOfBirth: '',
        avtUrl: '',
        roleId: '',
        saintId: '',
        isVerified: false,
    });
    const [createLoading, setCreateLoading] = useState(false);

    const fetchAccounts = async (pageIndex = page) => {
        setLoading(true);
        try {
            const params = {
                page: pageIndex,
                size: DEFAULT_PAGE_SIZE,
                sortBy,
                sortDirection,
            };
            const res = await api.get(API_ACCOUNTS, { params });
            const payload = res.data;
            const pageData = payload?.data ?? payload;
            const list = pageData?.content ?? (Array.isArray(pageData) ? pageData : []);
            setAccounts(Array.isArray(list) ? list : []);
            setTotalElements(pageData?.totalElements ?? (Array.isArray(list) ? list.length : 0));
            setTotalPages(pageData?.totalPages ?? 1);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Kiểm tra kết nối mạng';
            appToast.error('Không tải được', typeof msg === 'string' ? msg : 'Kiểm tra kết nối mạng');
            setAccounts([]);
            setTotalElements(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(0);
        fetchAccounts(0);
    }, [sortBy, sortDirection]);

    const goToPage = (newPage) => {
        const p = Math.max(0, Math.min(newPage, totalPages - 1));
        setPage(p);
        fetchAccounts(p);
    };

    const onRefresh = () => {
        setPage(0);
        fetchAccounts(0);
    };

    const filteredAccounts = accounts.filter((acc) => {
        const nameMatch = (acc.fullName || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const emailMatch = (acc.email || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesSearch = nameMatch || emailMatch;
        const matchesRole =
            roleFilter === 'All' || (acc.roleName || '') === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getStatusBadgeClass = (verified) => {
        return verified ? 'badge-success' : 'badge-warning';
    };

    const formatDate = (val) => {
        if (val == null || val === '') return '—';
        try {
            return new Date(val).toLocaleString('vi-VN');
        } catch {
            return String(val);
        }
    };

    const formatDateOnly = (val) => {
        if (val == null || val === '') return '—';
        try {
            return new Date(val).toLocaleDateString('vi-VN');
        } catch {
            return String(val);
        }
    };

    // Convert date to yyyy-MM-dd for input[type=date]
    const toInputDate = (val) => {
        if (val == null || val === '') return '';
        try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    const avatarUrl = (acc) => {
        if (acc.avtUrl && acc.avtUrl.trim()) return acc.avtUrl;
        const name = (acc.fullName || acc.email || 'U').trim();
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
    };

    const roleOptions = ['All', ...new Set(accounts.map((a) => a.roleName).filter(Boolean))];

    const fromItem = totalElements === 0 ? 0 : page * DEFAULT_PAGE_SIZE + 1;
    const toItem = Math.min((page + 1) * DEFAULT_PAGE_SIZE, totalElements);

    // Open detail modal
    const openDetail = (acc) => {
        setDetailAccount(acc);
        setIsEditing(false);
        setEditForm({});
    };

    // Close detail modal
    const closeDetail = () => {
        setDetailAccount(null);
        setIsEditing(false);
        setEditForm({});
        setShowDeleteConfirm(false);
    };

    // Enter edit mode
    const startEditing = () => {
        setEditForm({
            fullName: detailAccount.fullName || '',
            email: detailAccount.email || '',
            phone: detailAccount.phone || '',
            gender: detailAccount.gender || '',
            dateOfBirth: toInputDate(detailAccount.dateOfBirth),
            avtUrl: detailAccount.avtUrl || '',
            roleId: detailAccount.roleId ?? '',
            saintId: detailAccount.saintId || '',
            isVerified: detailAccount.verified ?? false,
        });
        setIsEditing(true);
    };

    // Cancel edit
    const cancelEditing = () => {
        setIsEditing(false);
        setEditForm({});
    };

    // Handle form field change
    const handleEditChange = (field, value) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    // Save changes via PUT
    const handleSave = async () => {
        if (!detailAccount?.accountId) return;
        setSaveLoading(true);
        try {
            const body = {
                fullName: editForm.fullName,
                email: editForm.email,
                phone: editForm.phone,
                gender: editForm.gender,
                dateOfBirth: editForm.dateOfBirth,
                avtUrl: editForm.avtUrl,
                roleId: editForm.roleId !== '' ? Number(editForm.roleId) : null,
                saintId: editForm.saintId || null,
                isVerified: editForm.isVerified,
            };
            const res = await api.put(`${API_ACCOUNTS}/${detailAccount.accountId}`, body);
            const updated = res.data?.data ?? res.data ?? {};

            // Merge updated data back
            const mergedAccount = { ...detailAccount, ...updated };
            setDetailAccount(mergedAccount);

            // Update in list
            setAccounts((prev) =>
                prev.map((a) =>
                    a.accountId === detailAccount.accountId ? mergedAccount : a
                )
            );

            appToast.success('Đã cập nhật', 'Thông tin đã được lưu');
            setIsEditing(false);
            setEditForm({});
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Vui lòng thử lại';
            appToast.error('Có lỗi xảy ra', typeof msg === 'string' ? msg : 'Vui lòng thử lại');
        } finally {
            setSaveLoading(false);
        }
    };

    // Create account: reset form
    const openCreateModal = () => {
        setCreateForm({
            fullName: '',
            email: '',
            password: '',
            phone: '',
            gender: '',
            dateOfBirth: '',
            avtUrl: '',
            roleId: '',
            saintId: '',
            isVerified: false,
        });
        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
    };

    const handleCreateChange = (field, value) => {
        setCreateForm((prev) => ({ ...prev, [field]: value }));
    };

    // Create account via POST
    const handleCreateSubmit = async () => {
        setCreateLoading(true);
        try {
            const body = {
                fullName: createForm.fullName,
                email: createForm.email,
                password: createForm.password,
                phone: createForm.phone,
                gender: createForm.gender || undefined,
                dateOfBirth: createForm.dateOfBirth || undefined,
                avtUrl: createForm.avtUrl || undefined,
                roleId: createForm.roleId !== '' ? Number(createForm.roleId) : 0,
                saintId: createForm.saintId || undefined,
                isVerified: createForm.isVerified,
            };
            await api.post(API_ACCOUNTS, body);
            appToast.success('Tạo thành công', 'Đã thêm tài khoản vào hệ thống');
            setPage(0);
            fetchAccounts(0);
            closeCreateModal();
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Vui lòng thử lại';
            appToast.error('Có lỗi xảy ra', typeof msg === 'string' ? msg : 'Vui lòng thử lại');
        } finally {
            setCreateLoading(false);
        }
    };

    // Delete account via DELETE
    const handleDelete = async () => {
        if (!detailAccount?.accountId) return;
        setDeleteLoading(true);
        try {
            const removedName = detailAccount.fullName || detailAccount.email || 'Tài khoản';
            await api.delete(`${API_ACCOUNTS}/${detailAccount.accountId}`);
            appToast.success('Đã xóa', `${removedName} đã được xóa`);
            setAccounts((prev) => prev.filter((a) => a.accountId !== detailAccount.accountId));
            setTotalElements((prev) => Math.max(0, prev - 1));
            closeDetail();
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Vui lòng thử lại';
            appToast.error('Có lỗi xảy ra', typeof msg === 'string' ? msg : 'Vui lòng thử lại');
            setShowDeleteConfirm(false);
        } finally {
            setDeleteLoading(false);
        }
    };
    return (
        <div className="admin-page user-manager-page">
            <div className="admin-page-header user-manager-header">
                <div>
                    <h1 className="admin-page-title">Quản lý người dùng</h1>
                    <p className="admin-page-subtitle">
                        Quản lý tài khoản, vai trò và quyền hạn.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn btn-primary btn-icon"
                        onClick={openCreateModal}
                    >
                        <FiUserPlus style={{ marginRight: 6 }} />
                        Thêm tài khoản
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline btn-icon"
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        <FiRefreshCw className={loading ? 'spin' : ''} />
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>
            </div>

            <div className="controls-bar">
                <div className="search-box">
                    <FiSearch className="control-icon" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoặc email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <FiFilter className="control-icon" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="All">Tất cả vai trò</option>
                        {roleOptions
                            .filter((r) => r !== 'All')
                            .map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            <div className="admin-card table-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th width="50">#</th>
                                <th width="300">Người dùng</th>
                                <th width="150">Vai trò</th>
                                <th width="150">Trạng thái</th>
                                <th width="140" className="text-right">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="empty-state">
                                        <div className="admin-empty-state">
                                            <FiRefreshCw
                                                className="spin"
                                                style={{ fontSize: '2rem' }}
                                            />
                                            <p>Đang tải...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="empty-state">
                                        <div className="admin-empty-state">
                                            <FiUsers
                                                style={{
                                                    fontSize: '2.5rem',
                                                    color: 'var(--admin-border)',
                                                }}
                                            />
                                            <h4>Không tìm thấy người dùng</h4>
                                            <p>
                                                Thử thay đổi từ khóa hoặc bộ lọc.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((acc, index) => (
                                    <tr
                                        key={acc.accountId || index}
                                        className="animate-fade-in row-delay"
                                    >
                                        <td className="text-muted">
                                            {page * DEFAULT_PAGE_SIZE + index + 1}
                                        </td>
                                        <td>
                                            <div className="table-user-cell">
                                                <img
                                                    src={avatarUrl(acc)}
                                                    alt={acc.fullName || ''}
                                                    className="table-avatar"
                                                />
                                                <div className="table-user-info">
                                                    <span className="user-name">
                                                        {acc.fullName || '—'}
                                                    </span>
                                                    <span className="user-email">
                                                        {acc.email || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="role-tag">
                                                {acc.roleName || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`status-badge ${getStatusBadgeClass(
                                                    acc.verified
                                                )}`}
                                            >
                                                {acc.verified
                                                    ? 'Đã xác thực'
                                                    : 'Chưa xác thực'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons">
                                                <button
                                                    type="button"
                                                    className="btn-action btn-detail"
                                                    title="Xem chi tiết"
                                                    onClick={() => openDetail(acc)}
                                                >
                                                    <FiEye />
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredAccounts.length > 0 && (
                    <div className="table-footer">
                        <span className="showing-text">
                            Hiển thị {fromItem}–{toItem} trong tổng {totalElements} người dùng
                        </span>
                        <div className="pagination">
                            <button
                                type="button"
                                className="btn-page"
                                disabled={page <= 0}
                                onClick={() => goToPage(page - 1)}
                            >
                                Trước
                            </button>
                            <span className="page-info">
                                Trang {page + 1} / {totalPages || 1}
                            </span>
                            <button
                                type="button"
                                className="btn-page"
                                disabled={page >= totalPages - 1}
                                onClick={() => goToPage(page + 1)}
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal chi tiết tài khoản */}
            {detailAccount && (
                <div
                    className="detail-overlay"
                    onClick={closeDetail}
                    role="presentation"
                >
                    <div
                        className="detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="detail-modal-header">
                            <h3>{isEditing ? 'Chỉnh sửa tài khoản' : 'Chi tiết tài khoản'}</h3>
                            <button
                                type="button"
                                className="detail-close"
                                onClick={closeDetail}
                                aria-label="Đóng"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="detail-modal-body">
                            {isEditing ? (
                                /* ── EDIT MODE ── */
                                <>
                                    <div className="detail-row">
                                        <span className="detail-label">Họ tên</span>
                                        <input
                                            className="detail-edit-input"
                                            type="text"
                                            value={editForm.fullName}
                                            onChange={(e) => handleEditChange('fullName', e.target.value)}
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Email</span>
                                        <input
                                            className="detail-edit-input"
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => handleEditChange('email', e.target.value)}
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Số điện thoại</span>
                                        <input
                                            className="detail-edit-input"
                                            type="text"
                                            value={editForm.phone}
                                            onChange={(e) => handleEditChange('phone', e.target.value)}
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Ngày sinh</span>
                                        <input
                                            className="detail-edit-input"
                                            type="date"
                                            value={editForm.dateOfBirth}
                                            onChange={(e) => handleEditChange('dateOfBirth', e.target.value)}
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Giới tính</span>
                                        <select
                                            className="detail-edit-input"
                                            value={editForm.gender}
                                            onChange={(e) => handleEditChange('gender', e.target.value)}
                                        >
                                            <option value="">-- Chọn --</option>
                                            <option value="MALE">Nam</option>
                                            <option value="FEMALE">Nữ</option>
                                            <option value="OTHER">Khác</option>
                                        </select>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Avatar URL</span>
                                        <input
                                            className="detail-edit-input"
                                            type="text"
                                            value={editForm.avtUrl}
                                            onChange={(e) => handleEditChange('avtUrl', e.target.value)}
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Vai trò</span>
                                        <select
                                            className="detail-edit-input"
                                            value={editForm.roleId === undefined || editForm.roleId === null ? '' : String(editForm.roleId)}
                                            onChange={(e) => handleEditChange('roleId', e.target.value)}
                                        >
                                            <option value="">-- Chọn vai trò --</option>
                                            {ROLE_OPTIONS.map((r) => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Saint ID</span>
                                        <input
                                            className="detail-edit-input"
                                            type="text"
                                            value={editForm.saintId}
                                            onChange={(e) => handleEditChange('saintId', e.target.value)}
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Đã xác thực</span>
                                        <label className="detail-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={editForm.isVerified}
                                                onChange={(e) => handleEditChange('isVerified', e.target.checked)}
                                            />
                                            <span style={{ marginLeft: 8 }}>
                                                {editForm.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                                            </span>
                                        </label>
                                    </div>
                                </>
                            ) : (
                                /* ── VIEW MODE ── */
                                <>
                                    <div className="detail-row">
                                        <span className="detail-label">Họ tên</span>
                                        <span className="detail-value">
                                            {detailAccount.fullName ?? '—'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Email</span>
                                        <span className="detail-value">
                                            {detailAccount.email ?? '—'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Số điện thoại</span>
                                        <span className="detail-value">
                                            {detailAccount.phone ?? '—'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Ngày sinh</span>
                                        <span className="detail-value">
                                            {formatDateOnly(detailAccount.dateOfBirth)}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Giới tính</span>
                                        <span className="detail-value">
                                            {(() => {
                                                const g = (detailAccount.gender || '').toUpperCase();
                                                return g === 'MALE' ? 'Nam' : g === 'FEMALE' ? 'Nữ' : detailAccount.gender || '—';
                                            })()}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Vai trò</span>
                                        <span className="detail-value">
                                            {detailAccount.roleName ?? '—'} (ID:{' '}
                                            {detailAccount.roleId ?? '—'})
                                        </span>
                                    </div>
                                    {detailAccount.saintName != null && (
                                        <div className="detail-row">
                                            <span className="detail-label">
                                                Thánh bảo trợ
                                            </span>
                                            <span className="detail-value">
                                                {detailAccount.saintName} (ID:{' '}
                                                {detailAccount.saintId ?? '—'})
                                            </span>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span className="detail-label">Trạng thái xác thực</span>
                                        <span
                                            className={`status-badge ${getStatusBadgeClass(
                                                detailAccount.verified
                                            )}`}
                                        >
                                            {detailAccount.verified
                                                ? 'Đã xác thực'
                                                : 'Chưa xác thực'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Ngày tạo</span>
                                        <span className="detail-value">
                                            {formatDate(detailAccount.createdDate)}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Cập nhật lúc</span>
                                        <span className="detail-value">
                                            {formatDate(detailAccount.updatedDate)}
                                        </span>
                                    </div>
                                    {detailAccount.avtUrl && (
                                        <div className="detail-row">
                                            <span className="detail-label">Avatar URL</span>
                                            <span className="detail-value">
                                                <a
                                                    href={detailAccount.avtUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="portfolio-link"
                                                >
                                                    Xem ảnh
                                                </a>
                                            </span>
                                        </div>
                                    )}
                                    <div className="detail-row detail-ids">
                                        <span className="detail-label">Account ID</span>
                                        <span className="detail-value mono">
                                            {detailAccount.accountId ?? '—'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="detail-modal-footer">
                            {isEditing ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={cancelEditing}
                                        disabled={saveLoading}
                                    >
                                        <FiX style={{ marginRight: 4 }} />
                                        Huỷ
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSave}
                                        disabled={saveLoading}
                                    >
                                        <FiSave style={{ marginRight: 4 }} />
                                        {saveLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={closeDetail}
                                    >
                                        Đóng
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        <FiTrash2 style={{ marginRight: 4 }} />
                                        Xoá
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={startEditing}
                                    >
                                        <FiEdit2 style={{ marginRight: 4 }} />
                                        Chỉnh sửa
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Create account modal */}
            {showCreateModal && (
                <div
                    className="detail-overlay"
                    onClick={closeCreateModal}
                    role="presentation"
                >
                    <div
                        className="detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="detail-modal-header">
                            <h3>Thêm tài khoản mới</h3>
                            <button
                                type="button"
                                className="detail-close"
                                onClick={closeCreateModal}
                                aria-label="Đóng"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="detail-modal-body">
                            <div className="detail-row">
                                <span className="detail-label">Họ tên *</span>
                                <input
                                    className="detail-edit-input"
                                    type="text"
                                    value={createForm.fullName}
                                    onChange={(e) => handleCreateChange('fullName', e.target.value)}
                                    placeholder="Nhập họ tên"
                                />
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Email *</span>
                                <input
                                    className="detail-edit-input"
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) => handleCreateChange('email', e.target.value)}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Mật khẩu *</span>
                                <input
                                    className="detail-edit-input"
                                    type="password"
                                    value={createForm.password}
                                    onChange={(e) => handleCreateChange('password', e.target.value)}
                                    placeholder="Nhập mật khẩu"
                                />
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Số điện thoại</span>
                                <input
                                    className="detail-edit-input"
                                    type="text"
                                    value={createForm.phone}
                                    onChange={(e) => handleCreateChange('phone', e.target.value)}
                                    placeholder="Số điện thoại"
                                />
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Ngày sinh</span>
                                <input
                                    className="detail-edit-input"
                                    type="date"
                                    value={createForm.dateOfBirth}
                                    onChange={(e) => handleCreateChange('dateOfBirth', e.target.value)}
                                />
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Giới tính</span>
                                <select
                                    className="detail-edit-input"
                                    value={createForm.gender}
                                    onChange={(e) => handleCreateChange('gender', e.target.value)}
                                >
                                    <option value="">-- Chọn --</option>
                                    <option value="MALE">Nam</option>
                                    <option value="FEMALE">Nữ</option>
                                    <option value="OTHER">Khác</option>
                                </select>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Avatar URL</span>
                                <input
                                    className="detail-edit-input"
                                    type="text"
                                    value={createForm.avtUrl}
                                    onChange={(e) => handleCreateChange('avtUrl', e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Vai trò *</span>
                                <select
                                    className="detail-edit-input"
                                    value={createForm.roleId}
                                    onChange={(e) => handleCreateChange('roleId', e.target.value)}
                                >
                                    <option value="">-- Chọn vai trò --</option>
                                    {ROLE_OPTIONS.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Saint ID</span>
                                <input
                                    className="detail-edit-input"
                                    type="text"
                                    value={createForm.saintId}
                                    onChange={(e) => handleCreateChange('saintId', e.target.value)}
                                    placeholder="Saint ID"
                                />
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Đã xác thực</span>
                                <label className="detail-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={createForm.isVerified}
                                        onChange={(e) => handleCreateChange('isVerified', e.target.checked)}
                                    />
                                    <span style={{ marginLeft: 8 }}>
                                        {createForm.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div className="detail-modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={closeCreateModal}
                                disabled={createLoading}
                            >
                                Huỷ
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleCreateSubmit}
                                disabled={createLoading || !createForm.fullName?.trim() || !createForm.email?.trim() || !createForm.password || !createForm.roleId}
                            >
                                <FiSave style={{ marginRight: 4 }} />
                                {createLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation dialog */}
            {showDeleteConfirm && detailAccount && (
                <div className="detail-overlay" style={{ zIndex: 1100 }} role="presentation">
                    <div className="detail-modal delete-confirm-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
                        <div className="detail-modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-danger, #dc2626)' }}>
                                <FiAlertTriangle />
                                Xác nhận xoá
                            </h3>
                            <button
                                type="button"
                                className="detail-close"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleteLoading}
                                aria-label="Đóng"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="detail-modal-body">
                            <p style={{ margin: 0, lineHeight: 1.6 }}>
                                Bạn có chắc chắn muốn xoá tài khoản{' '}
                                <strong>{detailAccount.fullName || detailAccount.email}</strong>?
                                <br />
                                Hành động này <strong>không thể hoàn tác</strong>.
                            </p>
                        </div>
                        <div className="detail-modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleteLoading}
                            >
                                Huỷ
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={deleteLoading}
                            >
                                <FiTrash2 style={{ marginRight: 4 }} />
                                {deleteLoading ? 'Đang xoá...' : 'Xoá tài khoản'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;