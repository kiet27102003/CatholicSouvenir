import React, { useEffect, useMemo, useState } from 'react';
import { appToast } from '../../lib/appToast';
import { getCommissionConfig, getCommissionRate, getCommissionReport, updateCommissionRate } from '../../services/commissionService';
import './admin-common.css';
import './CommissionManagement.css';

const GROUP_BY_OPTIONS = [
    { id: 'DAY', label: 'Theo ngày' },
    { id: 'WEEK', label: 'Theo tuần' },
    { id: 'MONTH', label: 'Theo tháng' },
];

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
}).format(Number(value ?? 0));

const formatDateTime = (value) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
};

const CommissionManagement = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [currentRate, setCurrentRate] = useState(null);
    const [config, setConfig] = useState(null);
    const [report, setReport] = useState(null);
    const [commissionRateInput, setCommissionRateInput] = useState('');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        groupBy: 'DAY',
    });

    const summary = useMemo(() => {
        if (!report) return null;
        return {
            totalCommission: report.totalCommission ?? 0,
            totalTransactions: report.totalTransactions ?? 0,
            averageCommissionPerTransaction: report.averageCommissionPerTransaction ?? 0,
        };
    }, [report]);

    useEffect(() => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - 29);

        setFilters((prev) => ({
            ...prev,
            startDate: start.toISOString().slice(0, 10),
            endDate: today.toISOString().slice(0, 10),
        }));
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            const [rateResult, configResult] = await Promise.all([
                getCommissionRate(),
                getCommissionConfig(),
            ]);

            if (rateResult.success) {
                const rate = rateResult.data?.commissionRate ?? rateResult.data?.data?.commissionRate ?? rateResult.data?.rate;
                setCurrentRate(rate ?? null);
                setCommissionRateInput(rate != null ? String(rate) : '');
            } else {
                appToast.error('Không thể tải commission rate', rateResult.error);
            }

            if (configResult.success) {
                setConfig(configResult.data ?? null);
                const rate = configResult.data?.commissionRate;
                if (rate != null) {
                    setCurrentRate(rate);
                    setCommissionRateInput(String(rate));
                }
            } else {
                appToast.error('Không thể tải cấu hình commission', configResult.error);
            }

            setLoading(false);
        };

        loadInitialData();
    }, []);

    const handleSave = async () => {
        const value = Number(commissionRateInput);
        if (Number.isNaN(value)) {
            appToast.error('Dữ liệu không hợp lệ', 'Commission rate phải là một con số.');
            return;
        }

        if (value < 0 || value > 100) {
            appToast.error('Dữ liệu không hợp lệ', 'Commission rate phải từ 0 đến 100.');
            return;
        }

        setSaving(true);
        const result = await updateCommissionRate(value);
        setSaving(false);

        if (!result.success) {
            appToast.error('Cập nhật thất bại', result.error);
            return;
        }

        const nextRate = result.data?.commissionRate ?? value;
        setCurrentRate(nextRate);
        setCommissionRateInput(String(nextRate));
        setConfig((prev) => ({ ...(prev || {}), ...result.data }));
        appToast.success('Đã cập nhật', 'Commission rate đã được cập nhật thành công.');
    };

    const handleLoadReport = async () => {
        if (!filters.startDate || !filters.endDate) {
            appToast.error('Thiếu thời gian báo cáo', 'Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.');
            return;
        }

        setReportLoading(true);
        const result = await getCommissionReport(filters);
        setReportLoading(false);

        if (!result.success) {
            appToast.error('Không thể tải báo cáo', result.error);
            return;
        }

        setReport(result.data ?? null);
    };

    return (
        <div className="admin-page commission-management-page">
            <div className="admin-page-header">
                <h1 className="admin-page-title">Quản lý phí hoa hồng</h1>
                <p className="admin-page-subtitle">Cập nhật phí hoa hồng, theo dõi cấu hình hiện tại và xem báo cáo doanh thu hoa hồng.</p>
            </div>

            <div className="commission-grid">
                <section className="admin-card commission-card highlight-card">
                    <div className="admin-card-header">Cấu hình hiện tại</div>
                    <div className="admin-card-body">
                        {loading ? (
                            <div className="commission-loading">Đang tải dữ liệu...</div>
                        ) : (
                            <>
                                <div className="commission-current-rate">
                                    <span>Phí hoa hồng hiện tại</span>
                                    <strong>{currentRate != null ? `${Number(currentRate).toFixed(2)}%` : '—'}</strong>
                                </div>

                                <div className="admin-form-group commission-input-group">
                                    <label htmlFor="commissionRate">Cập nhật phí hoa hồng (%)</label>
                                    <input
                                        id="commissionRate"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="admin-form-input"
                                        value={commissionRateInput}
                                        onChange={(e) => setCommissionRateInput(e.target.value)}
                                        placeholder="Ví dụ: 7.5"
                                    />
                                </div>

                                <div className="commission-meta">
                                    <div>
                                        <span>Cập nhật gần nhất</span>
                                        <strong>{formatDateTime(config?.updatedAt)}</strong>
                                    </div>
                                    <div>
                                        <span>Người cập nhật</span>
                                        <strong>{config?.updatedBy || '—'}</strong>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-primary commission-save-btn"
                                    onClick={handleSave}
                                    disabled={saving || loading}
                                >
                                    {saving ? 'Đang lưu...' : 'Lưu phí hoa hồng'}
                                </button>
                            </>
                        )}
                    </div>
                </section>

                <section className="admin-card commission-card">
                    <div className="admin-card-header">Báo cáo phí hoa hồng</div>
                    <div className="admin-card-body">
                        <div className="commission-report-filters">
                            <div className="admin-form-group">
                                <label htmlFor="startDate">Từ ngày</label>
                                <input
                                    id="startDate"
                                    type="date"
                                    className="admin-form-input"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="endDate">Đến ngày</label>
                                <input
                                    id="endDate"
                                    type="date"
                                    className="admin-form-input"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="groupBy">Nhóm theo</label>
                                <select
                                    id="groupBy"
                                    className="admin-form-input"
                                    value={filters.groupBy}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, groupBy: e.target.value }))}
                                >
                                    {GROUP_BY_OPTIONS.map((option) => (
                                        <option key={option.id} value={option.id}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn btn-outline commission-report-btn"
                            onClick={handleLoadReport}
                            disabled={reportLoading}
                        >
                            {reportLoading ? 'Đang tải báo cáo...' : 'Tạo báo cáo phí hoa hồng'}
                        </button>

                        {summary && (
                            <div className="commission-summary-grid">
                                <div className="summary-item">
                                    <span>Tổng phí hoa hồng</span>
                                    <strong>{formatCurrency(summary.totalCommission)}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Tổng giao dịch</span>
                                    <strong>{summary.totalTransactions}</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Phí hoa hồng trung bình / giao dịch</span>
                                    <strong>{formatCurrency(summary.averageCommissionPerTransaction)}</strong>
                                </div>
                            </div>
                        )}

                        {report?.items?.length ? (
                            <div className="commission-table-wrap">
                                <table className="commission-table">
                                    <thead>
                                        <tr>
                                            <th>Ngày</th>
                                            <th>Tổng commission</th>
                                            <th>Số giao dịch</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.items.map((item) => (
                                            <tr key={item.date}>
                                                <td>{item.date}</td>
                                                <td>{formatCurrency(item.totalCommission)}</td>
                                                <td>{item.transactionCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="commission-loading empty-report">
                                Chưa có dữ liệu báo cáo. Hãy chọn khoảng thời gian và tạo báo cáo.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <section className="admin-card commission-card commission-note-card">
                <div className="admin-card-header">Lưu ý về phí hoa hồng</div>
                <div className="admin-card-body">
                    <ul className="commission-note-list">
                        <li>Phí hoa hồng mới chỉ áp dụng cho transaction mới.</li>
                        <li>Transaction đang PENDING giữ nguyên commission_fee đã tính.</li>
                        <li>Khi admin cập nhật phí hoa hồng, hệ thống sẽ tự động gửi notification cho artisans.</li>
                        <li>Dữ liệu được cache và refresh tự động khi cập nhật cấu hình.</li>
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default CommissionManagement;
