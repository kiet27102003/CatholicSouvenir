import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Navigate } from 'react-router-dom';
import { FiSearch, FiCreditCard, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../cofig/api';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import walletService from '../../services/walletService';
import './admin-common.css';
import './AdminWallets.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatDateTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

const getInitials = (name) => {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 'U';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const normalizeArtisanAccounts = (payload) => {
    const raw = payload?.data?.data ?? payload?.data ?? {};
    const content = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
    return content.filter((account) => String(account?.roleName || '').toUpperCase() === 'ARTISAN');
};

const extractWalletTransactions = (walletData) => {
    if (Array.isArray(walletData?.transactions)) return walletData.transactions;
    if (Array.isArray(walletData?.transactionHistory)) return walletData.transactionHistory;
    if (Array.isArray(walletData?.walletTransactions)) return walletData.walletTransactions;
    return [];
};

const AdminWallets = () => {
    const { user, isAuthenticated } = useAuth();
    const role = String(user?.role || user?.roleName || '').toUpperCase();
    const isAdmin = role === 'ADMIN';

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [adminWallet, setAdminWallet] = useState(null);
    const [adminTransactions, setAdminTransactions] = useState([]);
    const [artisanWalletRows, setArtisanWalletRows] = useState([]);

    const [selectedDetail, setSelectedDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [adminTxPage, setAdminTxPage] = useState(1);
    const ADMIN_TX_PAGE_SIZE = 10;

    useEffect(() => {
        if (!isAuthenticated || !isAdmin) return;

        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);

            const [adminWalletRes, adminTransactionsRes, accountsRes] = await Promise.all([
                walletService.getMyWallet(),
                walletService.getWalletTransactions(),
                api.get('/admin/accounts', { params: { page: 0, size: 200, sortBy: 'createdDate', sortDirection: 'DESC' } }),
            ]);

            if (cancelled) return;

            if (!adminWalletRes.success) {
                appToast.error('Không tải được ví nền tảng', adminWalletRes.error || 'Vui lòng thử lại.');
            }

            if (!adminTransactionsRes.success) {
                appToast.error('Không tải được giao dịch ví nền tảng', adminTransactionsRes.error || 'Vui lòng thử lại.');
            }

            setAdminWallet(adminWalletRes.success ? adminWalletRes.data : null);
            setAdminTransactions(adminTransactionsRes.success ? (adminTransactionsRes.data || []) : []);

            const artisans = normalizeArtisanAccounts(accountsRes);

            const walletResults = await Promise.all(
                artisans.map(async (artisan) => {
                    const walletRes = await walletService.getWalletByAccountId(artisan.accountId);
                    if (!walletRes.success) {
                        return {
                            artisan,
                            wallet: null,
                            transactions: [],
                            error: walletRes.error,
                        };
                    }

                    const transactions = extractWalletTransactions(walletRes.data);

                    return {
                        artisan,
                        wallet: walletRes.data,
                        transactions,
                        error: null,
                    };
                }),
            );

            if (cancelled) return;

            setArtisanWalletRows(walletResults);
            setLoading(false);
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, isAdmin]);

    const artisanFiltered = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return artisanWalletRows.filter((row) => {
            const name = String(row?.artisan?.fullName || '').toLowerCase();
            const email = String(row?.artisan?.email || '').toLowerCase();
            return !keyword || name.includes(keyword) || email.includes(keyword);
        });
    }, [artisanWalletRows, search]);

    const stats = useMemo(() => {
        const platformRevenue = adminTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
        const adminBalance = Number(adminWallet?.balance || 0);

        const artisanBalanceTotal = artisanWalletRows.reduce((sum, row) => {
            return sum + Number(row?.wallet?.balance || 0);
        }, 0);

        const allTransactions = [
            ...adminTransactions,
            ...artisanWalletRows.flatMap((row) => row.transactions || []),
        ];

        const todayCount = allTransactions.filter((transaction) => {
            if (!transaction?.createdAt) return false;
            return dayjs(transaction.createdAt).isSame(dayjs(), 'day');
        }).length;

        return {
            platformRevenue,
            adminBalance,
            artisanBalanceTotal,
            todayCount,
        };
    }, [adminWallet, adminTransactions, artisanWalletRows]);

    const adminTransactionPagination = useMemo(() => {
        const totalItems = adminTransactions.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / ADMIN_TX_PAGE_SIZE));
        const currentPage = Math.min(adminTxPage, totalPages);
        const startIndex = (currentPage - 1) * ADMIN_TX_PAGE_SIZE;
        const paginatedItems = adminTransactions.slice(startIndex, startIndex + ADMIN_TX_PAGE_SIZE);

        return {
            currentPage,
            totalPages,
            totalItems,
            paginatedItems,
        };
    }, [adminTransactions, adminTxPage]);

    const getTransactionTone = (type) => {
        const normalized = String(type || '').toUpperCase();
        if (['DEPOSIT', 'PLATFORM_FEE', 'REFUND_RECEIVE'].includes(normalized)) return 'positive';
        if (['WITHDRAW', 'REFUND', 'COMMISSION', 'PAYOUT'].includes(normalized)) return 'negative';
        return 'neutral';
    };

    const getTransactionSign = (type) => {
        const normalized = String(type || '').toUpperCase();
        if (['DEPOSIT', 'PLATFORM_FEE', 'REFUND_RECEIVE'].includes(normalized)) return '+';
        if (['WITHDRAW', 'REFUND', 'COMMISSION', 'PAYOUT'].includes(normalized)) return '-';
        return '';
    };

    const openDetail = async (accountId) => {
        if (!accountId) return;
        setDetailLoading(true);
        const response = await walletService.getWalletByAccountId(accountId);
        setDetailLoading(false);

        if (!response.success) {
            appToast.error('Không tải được chi tiết ví', response.error || 'Vui lòng thử lại');
            return;
        }

        setSelectedDetail({
            wallet: response.data,
            transactions: extractWalletTransactions(response.data),
        });
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="admin-page admin-wallets-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Quản lý ví</h1>
                    <p className="admin-page-subtitle">Theo dõi ví nền tảng và ví nghệ nhân</p>
                </div>
            </div>

            {loading ? (
                <div className="wallet-admin-skeleton-grid">
                    <div className="wallet-admin-skeleton" />
                    <div className="wallet-admin-skeleton" />
                    <div className="wallet-admin-skeleton" />
                    <div className="wallet-admin-skeleton" />
                </div>
            ) : (
                <>
                    <section className="wallet-admin-stats-grid">
                        <article className="wallet-admin-stat">
                            <p>Tổng doanh thu nền tảng</p>
                            <h3>{formatCurrency(stats.platformRevenue)}</h3>
                        </article>
                        <article className="wallet-admin-stat">
                            <p>Ví nền tảng</p>
                            <h3>{formatCurrency(stats.adminBalance)}</h3>
                        </article>
                        <article className="wallet-admin-stat">
                            <p>Tổng ví nghệ nhân</p>
                            <h3>{formatCurrency(stats.artisanBalanceTotal)}</h3>
                        </article>
                        <article className="wallet-admin-stat">
                            <p>Giao dịch hôm nay</p>
                            <h3>{stats.todayCount}</h3>
                        </article>
                    </section>

                    <section className="admin-card table-card wallet-admin-table-card">
                        <div className="wallet-admin-filter">
                            <FiSearch className="control-icon" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên hoặc email nghệ nhân"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>

                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>NGHỆ NHÂN</th>
                                        <th>SỐ DƯ</th>
                                        <th>TỔNG NHẬN</th>
                                        <th>CẬP NHẬT</th>
                                        <th>THAO TÁC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {artisanFiltered.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="empty-state">
                                                <div className="admin-empty-state">
                                                    <FiCreditCard style={{ fontSize: '2rem' }} />
                                                    <p>Chưa có dữ liệu ví nghệ nhân</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        artisanFiltered.map((row) => {
                                            const depositTotal = (row.transactions || []).reduce((sum, transaction) => {
                                                return String(transaction?.type || '').toUpperCase() === 'DEPOSIT'
                                                    ? sum + Number(transaction.amount || 0)
                                                    : sum;
                                            }, 0);

                                            return (
                                                <tr key={row?.artisan?.accountId}>
                                                    <td>
                                                        <div className="wallet-admin-artisan-cell">
                                                            <span className="wallet-admin-avatar">{getInitials(row?.artisan?.fullName)}</span>
                                                            <div>
                                                                <p className="wallet-admin-name">{row?.artisan?.fullName || '—'}</p>
                                                                <span className="wallet-admin-email">{row?.artisan?.email || '—'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <strong className="wallet-admin-balance">{formatCurrency(row?.wallet?.balance || 0)}</strong>
                                                    </td>
                                                    <td>{formatCurrency(depositTotal)}</td>
                                                    <td>{formatDateTime(row?.wallet?.updatedAt)}</td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn-action btn-detail"
                                                            disabled={detailLoading}
                                                            onClick={() => openDetail(row?.artisan?.accountId)}
                                                        >
                                                            Xem chi tiết
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="admin-card table-card wallet-admin-table-card">
                        <div className="wallet-admin-section-header">
                            <div>
                                <h2 className="admin-section-title">Lịch sử biến động ví nền tảng</h2>
                                <p className="admin-section-subtitle"></p>
                            </div>
                        </div>

                        <div className="wallet-admin-transaction-list">
                            {adminTransactionPagination.paginatedItems.length === 0 ? (
                                <div className="admin-empty-state">
                                    <FiCreditCard style={{ fontSize: '2rem' }} />
                                    <p>Chưa có lịch sử giao dịch ví nền tảng</p>
                                </div>
                            ) : (
                                adminTransactionPagination.paginatedItems.map((transaction) => {
                                    const tone = getTransactionTone(transaction?.type);
                                    const sign = getTransactionSign(transaction?.type);
                                    const amountClass = tone === 'positive' ? 'transaction-amount--positive' : tone === 'negative' ? 'transaction-amount--negative' : 'transaction-amount--neutral';

                                    return (
                                        <article key={transaction.transactionId} className="wallet-admin-transaction-card">
                                            <div className="wallet-admin-transaction-main">
                                                <div className={`wallet-admin-transaction-badge wallet-admin-transaction-badge--${tone}`}>
                                                    {String(transaction?.type || '—')}
                                                </div>
                                                <div className="wallet-admin-transaction-info">
                                                    <h4>{transaction.description || 'Giao dịch ví'}</h4>
                                                    <p>{formatDateTime(transaction.createdAt)}</p>
                                                </div>
                                            </div>

                                            <div className="wallet-admin-transaction-meta">
                                                <div>
                                                    <span className="wallet-admin-transaction-label">Biến động</span>
                                                    <strong className={`wallet-admin-transaction-amount ${amountClass}`}>
                                                        {sign} {formatCurrency(transaction?.amount || 0)}
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span className="wallet-admin-transaction-label">Số dư</span>
                                                    <strong className="wallet-admin-transaction-balance">
                                                        {formatCurrency(transaction.balanceBefore || 0)} → {formatCurrency(transaction.balanceAfter || 0)}
                                                    </strong>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })
                            )}
                        </div>

                        <div className="wallet-admin-pagination">
                            <button
                                type="button"
                                className="wallet-admin-page-btn"
                                onClick={() => setAdminTxPage((page) => Math.max(1, page - 1))}
                                disabled={adminTransactionPagination.currentPage <= 1}
                            >
                                <FiChevronLeft />
                                Trước
                            </button>
                            <span className="wallet-admin-page-indicator">
                                Trang {adminTransactionPagination.currentPage} / {adminTransactionPagination.totalPages}
                            </span>
                            <button
                                type="button"
                                className="wallet-admin-page-btn"
                                onClick={() => setAdminTxPage((page) => Math.min(adminTransactionPagination.totalPages, page + 1))}
                                disabled={adminTransactionPagination.currentPage >= adminTransactionPagination.totalPages}
                            >
                                Sau
                                <FiChevronRight />
                            </button>
                        </div>
                    </section>
                </>
            )}

            {selectedDetail && (
                <div className="detail-overlay" onClick={() => setSelectedDetail(null)} role="presentation">
                    <div className="detail-modal wallet-admin-detail-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="detail-modal-header">
                            <h3>Chi tiết ví nghệ nhân</h3>
                            <button type="button" className="detail-close" onClick={() => setSelectedDetail(null)}>&times;</button>
                        </div>

                        <div className="detail-modal-body">
                            <div className="detail-row">
                                <span className="detail-label">Ví ID</span>
                                <span className="detail-value mono">{selectedDetail.wallet?.walletId || '—'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Chủ ví</span>
                                <span className="detail-value">{selectedDetail.wallet?.accountName || '—'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Số dư</span>
                                <span className="detail-value wallet-admin-balance">{formatCurrency(selectedDetail.wallet?.balance || 0)}</span>
                            </div>

                            <div className="wallet-admin-transactions">
                                <h4>Lịch sử giao dịch</h4>
                                {selectedDetail.transactions.length === 0 ? (
                                    <p className="wallet-admin-empty-text">Chưa có giao dịch</p>
                                ) : (
                                    <div className="wallet-admin-trans-list">
                                        {selectedDetail.transactions.map((transaction) => (
                                            <div key={transaction.transactionId} className="wallet-admin-trans-item">
                                                <div>
                                                    <p>{transaction.description || 'Giao dịch ví'}</p>
                                                    <span>{formatDateTime(transaction.createdAt)}</span>
                                                </div>
                                                <strong>
                                                    {String(transaction.type || '').toUpperCase() === 'DEPOSIT' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWallets;
