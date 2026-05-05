import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiSearch,
    FiFilter,
    FiEye,
    FiSlash,
    FiRefreshCw,
    FiUserPlus,
    FiAward,
    FiMoreVertical,
    FiCheck,
    FiX,
} from 'react-icons/fi';
import { getArtisans, getArtisanById } from '../../services/artisanService';
import { appToast } from '../../lib/appToast';
import './admin-common.css';
import './UserManager.css';
import './AdminCustomerArtisan.css';

const PAGE_SIZE = 10;
const ACTION_MENU_WIDTH = 190;
const ACTION_MENU_HEIGHT = 184;
const ACTION_MENU_GAP = 8;

const displayVal = (v) => (v == null || v === '' ? '—' : v);

const getInitials = (name) => {
    const s = (name || '').trim();
    if (!s) return '?';
    const parts = s.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return s.slice(0, 2).toUpperCase();
};

const formatArtisanCode = (artisanId) => {
    if (artisanId == null || artisanId === '') return '—';
    const raw = String(artisanId).replace(/-/g, '');
    const short = raw.slice(0, 6).toUpperCase();
    return short ? `ART-${short}` : '—';
};

const mapArtisanStatus = (a) => {
    const s = String(a.status || a.artisanStatus || a.verificationStatus || a.accountStatus || '').toUpperCase();
    if (a.verified === true || s === 'VERIFIED' || s === 'APPROVED') {
        return { label: 'Đã xác minh', className: 'badge-success' };
    }
    if (s === 'PENDING' || s === 'WAITING' || s === 'PENDING_APPROVAL') {
        return { label: 'Chờ duyệt', className: 'badge-warning' };
    }
    if (s === 'SUSPENDED' || s === 'BANNED' || s === 'REJECTED' || s === 'REVOKED') {
        return { label: 'Đình chỉ', className: 'badge-danger' };
    }
    if (!s && a.verified !== true && a.verified !== false) {
        return { label: '—', className: 'badge-secondary' };
    }
    if (a.verified === false) {
        return { label: 'Chờ duyệt', className: 'badge-warning' };
    }
    return { label: '—', className: 'badge-secondary' };
};

const ArtisanManager = () => {
    const navigate = useNavigate();
    const [artisans, setArtisans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAll, setFilterAll] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [specialtyFilter, setSpecialtyFilter] = useState('All');
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selected, setSelected] = useState(() => new Set());
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedArtisan, setSelectedArtisan] = useState(null);
    const [selectedArtisanError, setSelectedArtisanError] = useState('');
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [openActionMenuStyle, setOpenActionMenuStyle] = useState(null);

    const loadPage = useCallback(async (pageIndex) => {
        setLoading(true);
        const result = await getArtisans(pageIndex, PAGE_SIZE);
        if (result.success && result.data) {
            setArtisans(result.data.content ?? []);
            setTotalElements(result.data.totalElements ?? 0);
            setTotalPages(Math.max(1, result.data.totalPages ?? 1));
        } else {
            setArtisans([]);
            setTotalElements(0);
            setTotalPages(1);
            if (result.error) {
                const msg = typeof result.error === 'string' ? result.error : 'Kiểm tra kết nối mạng';
                appToast.error('Không tải được', msg);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadPage(page);
    }, [page, loadPage]);

    useEffect(() => {
        setSelected(new Set());
    }, [page, artisans]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown')) {
                setOpenActionMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!openActionMenuId) return;

        const updatePlacement = () => {
            const trigger = document.querySelector(`[data-action-menu-trigger="${openActionMenuId}"]`);
            if (!trigger) return;

            const rect = trigger.getBoundingClientRect();
            const margin = 8;
            const menuWidth = ACTION_MENU_WIDTH;
            const menuHeight = ACTION_MENU_HEIGHT;
            const canOpenRight = rect.left + menuWidth + margin <= window.innerWidth;
            const canOpenLeft = rect.right - menuWidth - margin >= 0;
            const canOpenDown = rect.bottom + menuHeight + margin <= window.innerHeight;
            const canOpenUp = rect.top - menuHeight - margin >= 0;

            let top = rect.bottom + margin;
            let left = rect.left;

            if (!canOpenRight && canOpenLeft) {
                left = rect.right - menuWidth;
            }
            if (!canOpenDown && canOpenUp) {
                top = rect.top - menuHeight - margin;
            }
            if (!canOpenRight && !canOpenLeft) {
                left = Math.max(margin, window.innerWidth - menuWidth - margin);
            }
            if (!canOpenDown && !canOpenUp) {
                top = Math.max(margin, window.innerHeight - menuHeight - margin);
            }

            setOpenActionMenuStyle({ top, left });
        };

        updatePlacement();
        window.addEventListener('resize', updatePlacement);
        window.addEventListener('scroll', updatePlacement, true);

        return () => {
            window.removeEventListener('resize', updatePlacement);
            window.removeEventListener('scroll', updatePlacement, true);
        };
    }, [openActionMenuId]);

    const specialtyOptions = useMemo(() => {
        const set = new Set();
        artisans.forEach((a) => {
            if (a.specialization) set.add(a.specialization);
        });
        return ['All', ...Array.from(set).sort()];
    }, [artisans]);

    const filteredRows = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return artisans.filter((a) => {
            const name = (a.artisanName || '').toLowerCase();
            const spec = (a.specialization || '').toLowerCase();
            const idStr = String(a.artisanId || '').toLowerCase();
            const code = formatArtisanCode(a.artisanId).toLowerCase();
            const matchSearch =
                !term ||
                name.includes(term) ||
                spec.includes(term) ||
                idStr.includes(term) ||
                code.includes(term);
            const matchSpec = specialtyFilter === 'All' || (a.specialization || '') === specialtyFilter;
            const matchAll = filterAll === 'All';
            let matchStatus = true;
            if (statusFilter !== 'All') {
                const { label } = mapArtisanStatus(a);
                if (statusFilter === 'verified') matchStatus = label === 'Đã xác minh';
                else if (statusFilter === 'pending') matchStatus = label === 'Chờ duyệt';
                else if (statusFilter === 'suspended') matchStatus = label === 'Đình chỉ';
            }
            return matchSearch && matchSpec && matchAll && matchStatus;
        });
    }, [artisans, searchTerm, specialtyFilter, filterAll, statusFilter]);

    const fromItem = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
    const toItem = Math.min((page + 1) * PAGE_SIZE, totalElements);

    const toggleRow = (id) => {
        if (!id) return;
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllVisible = () => {
        const ids = filteredRows.map((a) => a.artisanId).filter(Boolean);
        if (!ids.length) return;
        const allOn = ids.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            if (allOn) ids.forEach((id) => next.delete(id));
            else ids.forEach((id) => next.add(id));
            return next;
        });
    };

    const pageNumbers = useMemo(() => {
        const n = totalPages;
        if (n <= 5) return Array.from({ length: n }, (_, i) => i);
        if (page <= 1) return [0, 1, 2];
        if (page >= n - 2) return [n - 3, n - 2, n - 1];
        return [page - 1, page, page + 1];
    }, [totalPages, page]);

    const formatExperience = (years) => {
        if (years == null || years === '') return '—';
        const n = Number(years);
        if (Number.isNaN(n)) return displayVal(years);
        return `${n} năm`;
    };

    const trimBio = (bio) => {
        const text = String(bio || '').trim();
        if (!text) return 'Chưa cập nhật giới thiệu';
        return text.length > 92 ? `${text.slice(0, 92).trim()}…` : text;
    };

    const artisanNameTitle = (a) => [a.artisanName, a.specialization, formatArtisanCode(a.artisanId)].filter(Boolean).join(' • ');

    // Removed unused helper to keep the file lint-clean.

    const openDetail = async (artisanId) => {
        if (!artisanId) return;
        setDetailOpen(true);
        setDetailLoading(true);
        setSelectedArtisanError('');

        const response = await getArtisanById(artisanId);
        if (!response.success) {
            setSelectedArtisan(null);
            setSelectedArtisanError(response.error || 'Không tải được thông tin nghệ nhân.');
        } else {
            setSelectedArtisan(response.data || null);
        }

        setDetailLoading(false);
    };

    const closeDetail = () => {
        setDetailOpen(false);
        setSelectedArtisan(null);
        setSelectedArtisanError('');
    };

    const closeActionMenu = () => {
        setOpenActionMenuId(null);
        setOpenActionMenuStyle(null);
    };

    const allVisibleIds = filteredRows.map((a) => a.artisanId).filter(Boolean);
    const allSelected =
        allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));

    return (
        <div className="admin-page user-manager-page artisan-manager-page">
            <div className="admin-page-header user-manager-header">
                <div>
                    <h1 className="admin-page-title">Quản lý nghệ nhân</h1>
                    <p className="admin-page-subtitle">Danh sách các nghệ nhân tham gia nền tảng</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn btn-primary btn-icon"
                        onClick={() => navigate('/admin/artisan-applications')}
                    >
                        <FiUserPlus style={{ marginRight: 6 }} />
                        Thêm nghệ nhân
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline btn-icon"
                        onClick={() => loadPage(page)}
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
                        placeholder="Tìm kiếm theo tên, chuyên môn hoặc ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <FiFilter className="control-icon" />
                    <select value={filterAll} onChange={(e) => setFilterAll(e.target.value)}>
                        <option value="All">Tất cả</option>
                    </select>
                </div>
                <div className="filter-box">
                    <FiFilter className="control-icon" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="All">Trạng thái: Tất cả</option>
                        <option value="verified">Đã xác minh</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="suspended">Đình chỉ</option>
                    </select>
                </div>
                <div className="filter-box">
                    <FiFilter className="control-icon" />
                    <select
                        value={specialtyFilter}
                        onChange={(e) => setSpecialtyFilter(e.target.value)}
                    >
                        <option value="All">Chuyên môn: Tất cả</option>
                        {specialtyOptions
                            .filter((x) => x !== 'All')
                            .map((s) => (
                                <option key={s} value={s}>
                                    {s}
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
                                <th className="admin-table-wrap-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAllVisible}
                                        disabled={!filteredRows.length}
                                        title="Chọn tất cả trên trang"
                                    />
                                </th>
                                <th>Nghệ nhân</th>
                                <th>Chuyên môn</th>
                                <th>Kinh nghiệm</th>
                                <th className="text-right action-col">Hành động</th>
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
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-state">
                                        <div className="admin-empty-state">
                                            <FiAward
                                                style={{ fontSize: '2.5rem', color: 'var(--admin-border)' }}
                                            />
                                            <h4>Không có nghệ nhân</h4>
                                            <p>Thử thay đổi từ khóa hoặc bộ lọc.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((a, index) => {
                                    const id = a.artisanId;
                                    const artisanStatus = mapArtisanStatus(a);
                                    return (
                                        <tr
                                            key={id || index}
                                            className="animate-fade-in row-delay"
                                        >
                                            <td className="admin-table-wrap-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={id ? selected.has(id) : false}
                                                    onChange={() => toggleRow(id)}
                                                    disabled={!id}
                                                />
                                            </td>
                                            <td>
                                                <div className="table-user-cell artisan-name-cell" title={artisanNameTitle(a)}>
                                                    <div className="table-avatar-initials" aria-hidden>
                                                        {getInitials(a.artisanName)}
                                                    </div>
                                                    <div className="table-user-info">
                                                        <span className="user-name">
                                                            {displayVal(a.artisanName)}
                                                        </span>
                                                        <span className="user-email artisan-subid">
                                                            {formatArtisanCode(a.artisanId)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{displayVal(a.specialization)}</td>
                                            <td>{formatExperience(a.experienceYears)}</td>
                                            <td className="text-right artisan-actions-cell">
                                                <div className="action-dropdown">
                                                    <button
                                                        type="button"
                                                        className="btn-action action-trigger"
                                                        title="Mở menu hành động"
                                                        aria-expanded={openActionMenuId === id}
                                                        aria-haspopup="menu"
                                                        data-action-menu-trigger={id}
                                                        onClick={() => setOpenActionMenuId((current) => (current === id ? null : id))}
                                                    >
                                                        <FiMoreVertical />
                                                    </button>
                                                    {openActionMenuId === id && (
                                                        <div className="action-menu" role="menu" style={openActionMenuStyle || undefined}>
                                                            <button
                                                                type="button"
                                                                className="action-menu-item"
                                                                onClick={() => { openDetail(id); closeActionMenu(); }}
                                                            >
                                                                <FiEye />
                                                                <span>Xem chi tiết</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="action-menu-item"
                                                                onClick={() => { closeActionMenu(); navigate(`/admin/artisan-applications?artisanId=${id}`); }}
                                                            >
                                                                <FiCheck />
                                                                <span>Duyệt</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="action-menu-item"
                                                                onClick={() => { closeActionMenu(); navigate(`/admin/artisan-applications?artisanId=${id}&action=reject`); }}
                                                            >
                                                                <FiX />
                                                                <span>Từ chối</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="action-menu-item danger"
                                                                onClick={() => { closeActionMenu(); navigate(`/admin/artisans/${id}/suspend`); }}
                                                            >
                                                                <FiSlash />
                                                                <span>Đình chỉ</span>
                                                            </button>
                                                        </div>
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

                {!loading && totalElements > 0 && (
                    <div className="table-footer">
                        <span className="showing-text">
                            Hiển thị {fromItem} đến {toItem} trong số {totalElements} kết quả
                        </span>
                        <div className="pagination pagination-pages">
                            <button
                                type="button"
                                className="btn-page"
                                disabled={page <= 0}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                            >
                                ‹
                            </button>
                            {pageNumbers.map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    className={`btn-page page-num${num === page ? ' active' : ''}`}
                                    onClick={() => setPage(num)}
                                >
                                    {num + 1}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="btn-page"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {detailOpen && (
                <div className="detail-overlay" onClick={() => { closeDetail(); closeActionMenu(); }} role="presentation">
                    <div className="detail-modal artisan-detail-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="detail-modal-header">
                            <h3>Chi tiết nghệ nhân</h3>
                            <button type="button" className="detail-close" onClick={closeDetail}>&times;</button>
                        </div>

                        <div className="detail-modal-body">
                            {detailLoading ? (
                                <div className="admin-empty-state" style={{ padding: '24px 0' }}>
                                    <FiRefreshCw className="spin" style={{ fontSize: '2rem' }} />
                                    <p>Đang tải thông tin nghệ nhân...</p>
                                </div>
                            ) : selectedArtisanError ? (
                                <div className="admin-empty-state" style={{ padding: '24px 0' }}>
                                    <FiAward style={{ fontSize: '2rem', color: 'var(--admin-border)' }} />
                                    <p>{selectedArtisanError}</p>
                                </div>
                            ) : selectedArtisan ? (
                                <>
                                    <div className="detail-row">
                                        <span className="detail-label">Mã nghệ nhân</span>
                                        <span className="detail-value mono">{selectedArtisan.artisanId || '—'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Tên nghệ nhân</span>
                                        <span className="detail-value">{selectedArtisan.artisanName || '—'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Số điện thoại</span>
                                        <span className="detail-value">{selectedArtisan.phoneNumber || '—'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Chuyên môn</span>
                                        <span className="detail-value">{selectedArtisan.specialization || '—'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Kinh nghiệm</span>
                                        <span className="detail-value">{formatExperience(selectedArtisan.experienceYears)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Portfolio</span>
                                        <span className="detail-value">
                                            {selectedArtisan.portfolioUrl ? (
                                                <a className="portfolio-link" href={selectedArtisan.portfolioUrl} target="_blank" rel="noreferrer">
                                                    Mở portfolio
                                                </a>
                                            ) : '—'}
                                        </span>
                                    </div>
                                    <div className="detail-row" style={{ gridColumn: '1 / -1' }}>
                                        <span className="detail-label">Giới thiệu</span>
                                        <span className="detail-value">{trimBio(selectedArtisan.bio)}</span>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArtisanManager;
