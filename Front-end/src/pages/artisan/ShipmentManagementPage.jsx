import React, { useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiExternalLink, FiPackage, FiRefreshCw, FiTruck, FiXCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import { getOrdersByArtisan } from '../../services/orderService';
import { cancelShipment, createShipment, getShipmentByOrderId, updateDemoShipmentStatus, webhookGhn } from '../../services/shipmentService';
import './ShipmentManagementPage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatDateTime = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN');
    } catch {
        return value;
    }
};

const STATUS_LABELS = {
    CREATED: 'Đã tạo',
    PICKING: 'Đang lấy hàng',
    IN_TRANSIT: 'Đang vận chuyển',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã huỷ',
};

const ShipmentManagementPage = ({ user, embedded = false }) => {
    const navigate = useNavigate();
    const artisanId = user?.id || user?.artisanId || user?.artisanUuid;

    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [shipments, setShipments] = useState({});
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [creating, setCreating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [actioningId, setActioningId] = useState('');
    const [form, setForm] = useState({
        recipientName: '',
        recipientPhone: '',
        deliveryAddress: '',
        toDistrictId: '',
        toWardCode: '',
        orderValue: '',
        weight: '1000',
        length: '20',
        width: '20',
        height: '20',
        note: '',
        serviceTypeId: '2',
        paymentTypeId: '1',
    });

    const loadShipments = async () => {
        if (!artisanId) return;
        setLoading(true);
        const ordersRes = await getOrdersByArtisan(artisanId);
        if (!ordersRes.success) {
            appToast.error('Không tải được danh sách đơn', ordersRes.error || 'Vui lòng thử lại');
            setOrders([]);
            setLoading(false);
            return;
        }

        const paidOrders = (Array.isArray(ordersRes.data) ? ordersRes.data : []).filter((order) => String(order?.status || '').toUpperCase() === 'PAID');
        setOrders(paidOrders);

        const pairs = await Promise.all(paidOrders.map(async (order) => {
            const orderId = order?.orderId || order?.id;
            if (!orderId) return [null, null];
            const res = await getShipmentByOrderId(orderId);
            return [orderId, res.success ? res.data : null];
        }));

        const nextMap = Object.fromEntries(pairs.filter(([key]) => Boolean(key)));
        setShipments(nextMap);
        setSelectedOrderId((current) => current || paidOrders[0]?.orderId || paidOrders[0]?.id || '');
        setLoading(false);
    };

    useEffect(() => {
        loadShipments();
    }, [artisanId]);

    const selectedOrder = useMemo(() => orders.find((order) => String(order?.orderId || order?.id) === String(selectedOrderId)) || null, [orders, selectedOrderId]);
    const selectedShipment = selectedOrder ? shipments[selectedOrder.orderId || selectedOrder.id] : null;

    useEffect(() => {
        if (!selectedOrder) return;
        setForm((prev) => ({
            ...prev,
            recipientName: prev.recipientName || selectedOrder.fullName || selectedOrder.customerName || '',
            recipientPhone: prev.recipientPhone || selectedOrder.phoneNumber || selectedOrder.customerPhone || '',
            deliveryAddress: prev.deliveryAddress || selectedOrder.shippingAddress || '',
            orderValue: prev.orderValue || selectedOrder.total || selectedOrder.totalPrice || 0,
        }));
    }, [selectedOrder]);

    const handleCreateShipment = async () => {
        if (!selectedOrder || creating) return;
        setCreating(true);
        const res = await createShipment({
            orderId: selectedOrder.orderId || selectedOrder.id,
            recipientName: form.recipientName,
            recipientPhone: form.recipientPhone,
            deliveryAddress: form.deliveryAddress,
            toDistrictId: form.toDistrictId,
            toWardCode: form.toWardCode,
            orderValue: form.orderValue,
            weight: form.weight,
            length: form.length,
            width: form.width,
            height: form.height,
            note: form.note,
            serviceTypeId: form.serviceTypeId,
            paymentTypeId: form.paymentTypeId,
        });
        setCreating(false);

        if (!res.success) {
            appToast.error('Tạo vận đơn thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Đã tạo vận đơn');
        await loadShipments();
    };

    const handleRefreshGhn = async () => {
        setRefreshing(true);
        const res = await webhookGhn({ source: 'artisan-dashboard' });
        setRefreshing(false);
        if (!res.success) {
            appToast.error('Gọi webhook GHN thất bại', res.error || 'Vui lòng thử lại');
            return;
        }
        appToast.success('Đã gửi webhook GHN');
    };

    const handleDemoUpdate = async () => {
        if (!selectedShipment?.shipmentId && !selectedShipment?.id) {
            appToast.info('Chưa có vận đơn', 'Hãy tạo vận đơn trước.');
            return;
        }
        setActioningId(String(selectedShipment.shipmentId || selectedShipment.id));
        const res = await updateDemoShipmentStatus({
            additionalProp1: 'demo',
            additionalProp2: String(selectedShipment.shipmentId || selectedShipment.id),
            additionalProp3: 'IN_TRANSIT',
        });
        setActioningId('');
        if (!res.success) {
            appToast.error('Cập nhật demo thất bại', res.error || 'Vui lòng thử lại');
            return;
        }
        appToast.success('Đã cập nhật trạng thái demo');
        await loadShipments();
    };

    const handleCancel = async () => {
        if (!selectedShipment?.shipmentId && !selectedShipment?.id) return;
        setActioningId(String(selectedShipment.shipmentId || selectedShipment.id));
        const res = await cancelShipment(selectedShipment.shipmentId || selectedShipment.id);
        setActioningId('');
        if (!res.success) {
            appToast.error('Huỷ vận đơn thất bại', res.error || 'Vui lòng thử lại');
            return;
        }
        appToast.success('Đã huỷ vận đơn');
        await loadShipments();
    };

    const content = (
        <div className="artisan-shipment-page">
            <header className="shipment-page-header">
                <div>
                    <p className="page-kicker">Quản lý vận đơn</p>
                    <h1>Vận đơn của artisan</h1>
                    <p className="page-subtitle">Theo dõi các đơn đã sẵn sàng giao, tạo vận đơn và thao tác nhanh với GHN.</p>
                </div>
                <div className="shipment-header-actions">
                    <button type="button" className="btn btn-outline" onClick={handleRefreshGhn} disabled={refreshing}>
                        <FiRefreshCw /> {refreshing ? 'Đang gửi...' : 'Webhook GHN'}
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/artisan/orders')}>
                        <FiPackage /> Xem đơn custom
                    </button>
                </div>
            </header>

            <section className="shipment-summary-grid">
                <article className="shipment-summary-card"><FiTruck /><div><span>Đơn chờ tạo</span><strong>{orders.filter((order) => !shipments[order.orderId || order.id]).length}</strong></div></article>
                <article className="shipment-summary-card"><FiCheckCircle /><div><span>Đã có vận đơn</span><strong>{Object.values(shipments).filter(Boolean).length}</strong></div></article>
                <article className="shipment-summary-card"><FiAlertCircle /><div><span>Cần kiểm tra</span><strong>{orders.length}</strong></div></article>
            </section>

            <section className="shipment-layout">
                <div className="shipment-list-panel">
                    <div className="shipment-panel-head">
                        <h3>Danh sách đơn có thể tạo vận đơn</h3>
                    </div>
                    {loading ? (
                        <p className="shipment-empty">Đang tải...</p>
                    ) : orders.length === 0 ? (
                        <p className="shipment-empty">Hiện chưa có đơn PAID nào.</p>
                    ) : (
                        <div className="shipment-list">
                            {orders.map((order) => {
                                const orderId = order?.orderId || order?.id;
                                const shipment = shipments[orderId];
                                return (
                                    <button
                                        key={orderId}
                                        type="button"
                                        className={`shipment-list-item ${String(selectedOrderId) === String(orderId) ? 'active' : ''}`}
                                        onClick={() => setSelectedOrderId(String(orderId))}
                                    >
                                        <div className="shipment-item-top">
                                            <strong>#{String(orderId).slice(0, 8)}</strong>
                                            <span>{shipment ? 'Đã tạo' : 'Chưa tạo'}</span>
                                        </div>
                                        <p>{order?.fullName || order?.customerName || 'Khách hàng'} · {formatCurrency(order?.total || order?.totalPrice)}</p>
                                        <small>{formatDateTime(order?.createdAt || order?.createAt)}</small>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="shipment-detail-panel">
                    {!selectedOrder ? (
                        <div className="shipment-empty shipment-detail-empty">Chọn một đơn để xem chi tiết vận đơn.</div>
                    ) : (
                        <>
                            <div className="shipment-detail-head">
                                <div>
                                    <p className="page-kicker">Đơn hàng đã chọn</p>
                                    <h3>#{String(selectedOrder.orderId || selectedOrder.id).slice(0, 8)}</h3>
                                </div>
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate(`/artisan/orders/${selectedOrder.orderId || selectedOrder.id}`)}>
                                    <FiExternalLink /> Chi tiết đơn
                                </button>
                            </div>

                            <div className="shipment-info-card">
                                <p><span>Khách hàng</span><strong>{selectedOrder.fullName || selectedOrder.customerName || '—'}</strong></p>
                                <p><span>Điện thoại</span><strong>{selectedOrder.phoneNumber || selectedOrder.customerPhone || '—'}</strong></p>
                                <p><span>Địa chỉ</span><strong>{selectedOrder.shippingAddress || '—'}</strong></p>
                                <p><span>Vận đơn</span><strong>{selectedShipment?.trackingNumber || selectedShipment?.code || 'Chưa có'}</strong></p>
                                <p><span>Trạng thái</span><strong>{STATUS_LABELS[String(selectedShipment?.status || selectedShipment?.shipmentStatus || '').toUpperCase()] || String(selectedShipment?.status || selectedShipment?.shipmentStatus || '—')}</strong></p>
                            </div>

                            <div className="shipment-form-card">
                                <h3>Tạo vận đơn</h3>
                                <div className="shipment-form-grid">
                                    <input className="form-input" placeholder="Tên người nhận" value={form.recipientName} onChange={(e) => setForm((prev) => ({ ...prev, recipientName: e.target.value }))} />
                                    <input className="form-input" placeholder="Số điện thoại" value={form.recipientPhone} onChange={(e) => setForm((prev) => ({ ...prev, recipientPhone: e.target.value }))} />
                                    <input className="form-input shipment-span-2" placeholder="Địa chỉ giao hàng" value={form.deliveryAddress} onChange={(e) => setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))} />
                                    <input className="form-input" placeholder="Mã quận" value={form.toDistrictId} onChange={(e) => setForm((prev) => ({ ...prev, toDistrictId: e.target.value }))} />
                                    <input className="form-input" placeholder="Mã phường" value={form.toWardCode} onChange={(e) => setForm((prev) => ({ ...prev, toWardCode: e.target.value }))} />
                                    <input className="form-input" placeholder="Giá trị đơn" value={form.orderValue} onChange={(e) => setForm((prev) => ({ ...prev, orderValue: e.target.value }))} />
                                    <input className="form-input" placeholder="Cân nặng (gram)" value={form.weight} onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))} />
                                    <input className="form-input" placeholder="Dài" value={form.length} onChange={(e) => setForm((prev) => ({ ...prev, length: e.target.value }))} />
                                    <input className="form-input" placeholder="Rộng" value={form.width} onChange={(e) => setForm((prev) => ({ ...prev, width: e.target.value }))} />
                                    <input className="form-input" placeholder="Cao" value={form.height} onChange={(e) => setForm((prev) => ({ ...prev, height: e.target.value }))} />
                                    <input className="form-input" placeholder="Service Type ID" value={form.serviceTypeId} onChange={(e) => setForm((prev) => ({ ...prev, serviceTypeId: e.target.value }))} />
                                    <input className="form-input" placeholder="Payment Type ID" value={form.paymentTypeId} onChange={(e) => setForm((prev) => ({ ...prev, paymentTypeId: e.target.value }))} />
                                    <textarea className="form-input shipment-span-2" rows="3" placeholder="Ghi chú" value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} />
                                </div>
                                <div className="shipment-actions">
                                    <button type="button" className="btn btn-primary" onClick={handleCreateShipment} disabled={creating}>
                                        {creating ? 'Đang tạo...' : 'Tạo vận đơn'}
                                    </button>
                                    <button type="button" className="btn btn-outline" onClick={handleDemoUpdate} disabled={actioningId !== '' || !selectedShipment}>
                                        Cập nhật demo
                                    </button>
                                    <button type="button" className="btn btn-danger" onClick={handleCancel} disabled={actioningId !== '' || !selectedShipment}>
                                        {actioningId ? 'Đang xử lý...' : 'Huỷ vận đơn'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );

    if (embedded) return content;

    return content;
};

export default ShipmentManagementPage;
