import React, { useEffect, useMemo, useState } from 'react';
import { FiRefreshCw, FiSave } from 'react-icons/fi';
import { appToast } from '../../lib/appToast';
import shipmentService from '../../services/shipmentService';
import './admin-common.css';
import './ShipmentDemoStatusPage.css';

const normalizeStatuses = (items) =>
    (Array.isArray(items) ? items : []).map((item) => ({
        value: String(item?.value ?? item?.status ?? item?.code ?? item ?? '').trim(),
        label: String(item?.label ?? item?.name ?? item?.title ?? item?.status ?? item ?? '').trim(),
        description: String(item?.description ?? '').trim(),
    })).filter((item) => item.value);

const ShipmentDemoStatusPage = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [statuses, setStatuses] = useState([]);
    const [orderCode, setOrderCode] = useState('GHN123456');
    const [status, setStatus] = useState('');
    const [responseData, setResponseData] = useState(null);

    const selectedStatus = useMemo(() => statuses.find((item) => item.value === status) || null, [statuses, status]);

    const loadStatuses = async () => {
        setLoading(true);
        const res = await shipmentService.getDemoShipmentStatuses();
        setLoading(false);

        if (!res.success) {
            appToast.error('Không tải được trạng thái', res.error || 'Vui lòng thử lại');
            setStatuses([]);
            return;
        }

        const normalized = normalizeStatuses(res.data);
        setStatuses(normalized);
        setStatus((prev) => prev || normalized[0]?.value || '');
    };

    useEffect(() => {
        loadStatuses();
    }, []);

    const handleSubmit = async () => {
        if (!orderCode.trim() || !status) {
            appToast.error('Thiếu dữ liệu', 'Vui lòng nhập mã đơn hàng và chọn trạng thái');
            return;
        }

        setSubmitting(true);
        const res = await shipmentService.updateDemoShipmentStatus({
            orderCode: orderCode.trim(),
            status,
        });
        setSubmitting(false);

        if (!res.success) {
            appToast.error('Cập nhật thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        setResponseData(res.data);
        appToast.success('Đã cập nhật trạng thái demo');
    };

    return (
        <div className="admin-page shipment-demo-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Cập nhật trạng thái đơn hàng demo</h1>
                    <p className="admin-page-subtitle">Dùng endpoint demo để đổi trạng thái vận chuyển và xem phản hồi ngay trong admin.</p>
                </div>
                <button type="button" className="btn btn-outline btn-icon" onClick={loadStatuses} disabled={loading}>
                    <FiRefreshCw />
                    {loading ? 'Đang tải...' : 'Làm mới trạng thái'}
                </button>
            </div>

            <div className="shipment-demo-grid">
                <section className="admin-card">
                    <div className="admin-card-header">Cập nhật trạng thái</div>
                    <div className="admin-card-body">
                        <div className="admin-form-group">
                            <label htmlFor="orderCode">Mã đơn hàng</label>
                            <input
                                id="orderCode"
                                className="admin-form-input"
                                value={orderCode}
                                onChange={(e) => setOrderCode(e.target.value)}
                                placeholder="VD: GHN123456"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="status">Trạng thái demo</label>
                            <select
                                id="status"
                                className="admin-form-input"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                disabled={loading || !statuses.length}
                            >
                                <option value="">{loading ? 'Đang tải danh sách...' : 'Chọn trạng thái'}</option>
                                {statuses.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label || item.value}
                                    </option>
                                ))}
                            </select>
                            {selectedStatus?.description ? <p className="field-hint">{selectedStatus.description}</p> : null}
                        </div>

                        <button type="button" className="btn btn-primary btn-icon" onClick={handleSubmit} disabled={submitting || loading}>
                            <FiSave />
                            {submitting ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                        </button>
                    </div>
                </section>

                <section className="admin-card admin-response-card">
                    <div className="admin-card-header">Kết quả demo</div>
                    <div className="admin-card-body">
                        <div className="demo-response-box">
                            <p><strong>Order code:</strong> {orderCode || '—'}</p>
                            <p><strong>Status:</strong> {status || '—'}</p>
                            <p><strong>Endpoint:</strong> POST /api/shipments/demo/update-status</p>
                        </div>
                        {responseData ? (
                            <pre className="demo-json">{JSON.stringify(responseData, null, 2)}</pre>
                        ) : (
                            <div className="admin-empty-state">
                                <h4>Chưa có dữ liệu</h4>
                                <p>Chọn trạng thái và bấm cập nhật để xem phản hồi API.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ShipmentDemoStatusPage;
