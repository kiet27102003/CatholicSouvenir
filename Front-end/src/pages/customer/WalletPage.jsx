import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '../../lib/appToast';
import walletService from '../../services/walletService';
import './WalletPage.css';

const PAGE_SIZE = 10;

const TYPE_META = {
    DEPOSIT: { label: '+ Nhận tiền', badgeClass: 'wallet-type-deposit', amountClass: 'wallet-amount-plus', sign: '+' },
    PLATFORM_FEE: { label: 'Phí sàn', badgeClass: 'wallet-type-fee', amountClass: 'wallet-amount-minus', sign: '-' },
    REFUND: { label: 'Hoàn tiền', badgeClass: 'wallet-type-refund', amountClass: 'wallet-amount-minus', sign: '-' },
    WITHDRAWAL: { label: 'Rút tiền', badgeClass: 'wallet-type-withdrawal', amountClass: 'wallet-amount-minus', sign: '-' },
};

const quickTabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'DEPOSIT', label: 'Nhận tiền' },
    { id: 'PLATFORM_FEE', label: 'Phí sàn' },
    { id: 'REFUND', label: 'Hoàn tiền' },
];

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatDateTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');
const formatShortDateTime = (value) => (value ? dayjs(value).format('DD/MM HH:mm') : '—');

const WalletPage = () => {
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();

    const role = String(user?.role || '').toLowerCase();
    const canView = role === 'customer' || role === 'artisan';

    const [loading, setLoading] = useState(true);
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);

    const [searchKeyword, setSearchKeyword] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [quickType, setQuickType] = useState('ALL');
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (!isAuthenticated || !canView) return;

        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);

            const [walletRes, transactionsRes] = await Promise.all([
                walletService.getMyWallet(),
                walletService.getWalletTransactions(),
            ]);

            if (cancelled) return;

            if (!walletRes.success) {
                appToast.error('Không tải được ví', walletRes.error || 'Vui lòng thử lại sau');
            }

            if (!transactionsRes.success) {
                appToast.error('Không tải được giao dịch ví', transactionsRes.error || 'Vui lòng thử lại sau');
            }

            setWallet(walletRes.success ? walletRes.data : null);
            setTransactions(transactionsRes.success ? (transactionsRes.data || []) : []);

            setLoading(false);
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [location.key, isAuthenticated, canView]);

    const stats = useMemo(() => {
        return transactions.reduce(
            (acc, transaction) => {
                const amount = Number(transaction.amount || 0);
                const type = String(transaction.type || '').toUpperCase();
                if (type === 'DEPOSIT') {
                    acc.totalIn += amount;
                }
                if (['PLATFORM_FEE', 'REFUND', 'WITHDRAWAL'].includes(type)) {
                    acc.totalOut += amount;
                }
                return acc;
            },
            { totalIn: 0, totalOut: 0 },
        );
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        const keyword = searchKeyword.trim().toLowerCase();
        const effectiveTypeFilter = quickType !== 'ALL' ? quickType : typeFilter;
        return transactions.filter((transaction) => {
            const type = String(transaction.type || '').toUpperCase();
            const description = String(transaction.description || '').toLowerCase();
            const matchesKeyword = !keyword || description.includes(keyword);
            const matchesType = effectiveTypeFilter === 'ALL' || type === effectiveTypeFilter;
            return matchesKeyword && matchesType;
        });
    }, [transactions, searchKeyword, typeFilter, quickType]);

    useEffect(() => {
        setPage(1);
    }, [searchKeyword, typeFilter, quickType]);

    const pagedTransactions = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return filteredTransactions.slice(start, end);
    }, [filteredTransactions, page]);

    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));

    const walletIdShort = useMemo(() => {
        const id = String(wallet?.walletId || '');
        if (id.length <= 12) return id || '—';
        return `${id.slice(0, 6)}...${id.slice(-4)}`;
    }, [wallet?.walletId]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!canView) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="wallet-page">
            <header className="wallet-header">
                <h1>Ví của tôi</h1>
                <p>Quản lý số dư và lịch sử giao dịch</p>
            </header>

            {loading ? (
                <>
                    <div className="wallet-skeleton hero" />
                    <div className="wallet-skeleton row" />
                    <div className="wallet-skeleton table" />
                </>
            ) : (
                <>
                    <section className="wallet-top-grid">
                        <article className="wallet-hero-card">
                            <p className="wallet-hero-label">Số dư hiện tại</p>
                            <h2>{formatCurrency(wallet?.balance || 0)}</h2>
                            <p className="wallet-hero-meta">
                                <code>{walletIdShort}</code>
                            </p>
                            <p className="wallet-hero-meta">Cập nhật: {wallet?.updatedAt ? dayjs(wallet.updatedAt).format('DD/MM/YYYY') : '—'}</p>
                        </article>

                        <div className="wallet-stats-grid">
                            <article className="wallet-stat-card">
                                <p>Tổng đã nhận</p>
                                <h3 className="wallet-amount-plus">+ {formatCurrency(stats.totalIn)}</h3>
                            </article>
                            <article className="wallet-stat-card">
                                <p>Đã trừ</p>
                                <h3 className="wallet-amount-minus">- {formatCurrency(stats.totalOut)}</h3>
                            </article>
                        </div>
                    </section>

                    <section className="wallet-table-section">
                        <div className="wallet-filter-bar">
                            <input
                                type="text"
                                placeholder="Tìm theo mô tả giao dịch"
                                value={searchKeyword}
                                onChange={(event) => setSearchKeyword(event.target.value)}
                            />
                            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                                <option value="ALL">Tất cả loại</option>
                                <option value="DEPOSIT">Nhận tiền</option>
                                <option value="PLATFORM_FEE">Phí sàn</option>
                                <option value="REFUND">Hoàn tiền</option>
                                <option value="WITHDRAWAL">Rút tiền</option>
                            </select>
                        </div>

                        <div className="wallet-quick-tabs">
                            {quickTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`wallet-quick-tab ${quickType === tab.id ? 'active' : ''}`}
                                    onClick={() => setQuickType(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {pagedTransactions.length === 0 ? (
                            <div className="wallet-empty">Chưa có giao dịch nào</div>
                        ) : (
                            <>
                                <div className="wallet-table-wrapper">
                                    <table className="wallet-table">
                                        <thead>
                                            <tr>
                                                <th>GIAO DỊCH</th>
                                                <th>LOẠI</th>
                                                <th>SỐ TIỀN</th>
                                                <th>SỐ DƯ SAU</th>
                                                <th>THỜI GIAN</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedTransactions.map((transaction) => {
                                                const type = String(transaction.type || '').toUpperCase();
                                                const meta = TYPE_META[type] || TYPE_META.PLATFORM_FEE;

                                                return (
                                                    <tr key={transaction.transactionId}>
                                                        <td>
                                                            <p className="wallet-main-cell">{transaction.description || 'Giao dịch ví'}</p>
                                                            <span className="wallet-sub-cell">#{String(transaction.transactionId || '').slice(0, 8)}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`wallet-type-badge ${meta.badgeClass}`}>{meta.label}</span>
                                                        </td>
                                                        <td>
                                                            <strong className={meta.amountClass}>
                                                                {meta.sign} {formatCurrency(transaction.amount)}
                                                            </strong>
                                                        </td>
                                                        <td>
                                                            <span className="wallet-balance-after">{formatCurrency(transaction.balanceAfter)}</span>
                                                        </td>
                                                        <td>{formatShortDateTime(transaction.createdAt)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="wallet-pagination">
                                    <span>
                                        Trang {page}/{totalPages}
                                    </span>
                                    <div>
                                        <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
                                            Trước
                                        </button>
                                        <button type="button" className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
                                            Sau
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>

                    <section className="wallet-meta-foot">
                        <span>Tạo ví: {formatDateTime(wallet?.createdAt)}</span>
                        <span>Cập nhật gần nhất: {formatDateTime(wallet?.updatedAt)}</span>
                    </section>
                </>
            )}
        </div>
    );
};

export default WalletPage;
