import React, { useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiExternalLink, FiPackage, FiRefreshCw, FiTruck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import { getOrdersByArtisan } from '../../services/orderService';
import {
    cancelShipment,
    createShipment,
    getGhnDistricts,
    getGhnProvinces,
    getGhnWards,
    getShipmentByOrderId,
    webhookGhn,
} from '../../services/shipmentService';
import './ShipmentManagementPage.css';

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;
const formatInputMoney = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits ? new Intl.NumberFormat('vi-VN').format(Number(digits)) : '';
};
const parseInputMoney = (value) => String(value ?? '').replace(/\D/g, '');
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

const mapLocationItem = (item) => ({
    code: String(item?.ProvinceID ?? item?.DistrictID ?? item?.WardCode ?? item?.code ?? item?.id ?? ''),
    name: item?.ProvinceName || item?.DistrictName || item?.WardName || item?.Name || item?.name || '',
});

const defaultShipmentForm = {
    recipientName: '',
    recipientPhone: '',
    deliveryAddress: '',
    provinceCode: '',
    districtCode: '',
    wardCode: '',
    orderValue: '',
    weight: '1000',
    length: '20',
    width: '20',
    height: '20',
    note: '',
    serviceTypeId: '2',
    paymentTypeId: '1',
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
    const [shipmentFormOpen, setShipmentFormOpen] = useState(false);
    const [shippingSubmitting, setShippingSubmitting] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [locationLoading, setLocationLoading] = useState({ provinces: false, districts: false, wards: false });
    const [shipmentForm, setShipmentForm] = useState(defaultShipmentForm);
    const [form, setForm] = useState(defaultShipmentForm);
    const cityOptions = provinces;
    const availableDistricts = districts;
    const availableWards = wards;

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

    useEffect(() => { loadShipments(); }, [artisanId]);

    const selectedOrder = useMemo(() => orders.find((order) => String(order?.orderId || order?.id) === String(selectedOrderId)) || null, [orders, selectedOrderId]);
    const selectedShipment = selectedOrder ? shipments[selectedOrder.orderId || selectedOrder.id] : null;

    useEffect(() => {
        if (!selectedOrder) return;
        setShipmentForm((prev) => ({
            ...prev,
            recipientName: prev.recipientName || selectedOrder.fullName || selectedOrder.customerName || '',
            recipientPhone: prev.recipientPhone || selectedOrder.phoneNumber || selectedOrder.customerPhone || '',
            deliveryAddress: prev.deliveryAddress || selectedOrder.shippingAddress || '',
            orderValue: prev.orderValue || selectedOrder.total || selectedOrder.totalPrice || 0,
        }));
    }, [selectedOrder]);

    useEffect(() => {
        const loadProvinces = async () => {
            setLocationLoading((prev) => ({ ...prev, provinces: true }));
            const res = await getGhnProvinces();
            if (res.success) {
                setProvinces((Array.isArray(res.data) ? res.data : []).map(mapLocationItem));
            } else {
                setProvinces([]);
                appToast.error('Không tải được danh sách tỉnh/thành', res.error || 'Vui lòng thử lại');
            }
            setLocationLoading((prev) => ({ ...prev, provinces: false }));
        };

        if (shipmentFormOpen) loadProvinces();
    }, [shipmentFormOpen]);

    useEffect(() => {
        const loadDistricts = async () => {
            if (!shipmentForm.provinceCode) {
                setDistricts([]);
                setWards([]);
                setShipmentForm((prev) => ({ ...prev, districtCode: '', wardCode: '' }));
                return;
            }
            setLocationLoading((prev) => ({ ...prev, districts: true }));
            const res = await getGhnDistricts(shipmentForm.provinceCode);
            if (res.success) {
                setDistricts((Array.isArray(res.data) ? res.data : []).map(mapLocationItem));
                setWards([]);
                setShipmentForm((prev) => ({ ...prev, districtCode: '', wardCode: '' }));
            } else {
                setDistricts([]);
                setWards([]);
                appToast.error('Không tải được danh sách quận/huyện', res.error || 'Vui lòng thử lại');
            }
            setLocationLoading((prev) => ({ ...prev, districts: false }));
        };
        loadDistricts();
    }, [shipmentForm.provinceCode]);

    useEffect(() => {
        const loadWards = async () => {
            if (!shipmentForm.districtCode) {
                setWards([]);
                setShipmentForm((prev) => ({ ...prev, wardCode: '' }));
                return;
            }
            setLocationLoading((prev) => ({ ...prev, wards: true }));
            const res = await getGhnWards(shipmentForm.districtCode);
            if (res.success) {
                setWards((Array.isArray(res.data) ? res.data : []).map(mapLocationItem));
                setShipmentForm((prev) => ({ ...prev, wardCode: '' }));
            } else {
                setWards([]);
                appToast.error('Không tải được danh sách phường/xã', res.error || 'Vui lòng thử lại');
            }
            setLocationLoading((prev) => ({ ...prev, wards: false }));
        };
        loadWards();
    }, [shipmentForm.districtCode]);

    const openShipmentForm = () => {
        setShipmentFormOpen(true);
        setShipmentForm((prev) => ({
            ...prev,
            recipientName: prev.recipientName || selectedOrder?.fullName || selectedOrder?.customerName || '',
            recipientPhone: prev.recipientPhone || selectedOrder?.phoneNumber || selectedOrder?.customerPhone || '',
            deliveryAddress: prev.deliveryAddress || selectedOrder?.shippingAddress || '',
            orderValue: prev.orderValue || selectedOrder?.total || selectedOrder?.totalPrice || 0,
        }));
    };

    const resetShipmentForm = () => {
        setShipmentForm(defaultShipmentForm);
    };

    const handleCreateShipment = async () => {
        if (!selectedOrder?.orderId || shippingSubmitting) return;
        if (!shipmentForm.recipientName.trim() || !shipmentForm.recipientPhone.trim() || !shipmentForm.deliveryAddress.trim()) {
            appToast.error('Thiếu thông tin giao hàng', 'Vui lòng nhập đầy đủ người nhận, số điện thoại và địa chỉ.');
            return;
        }

        setShippingSubmitting(true);
        const res = await createShipment({
            orderId: selectedOrder.orderId,
            customOrderId: selectedOrder?.customOrderId || selectedOrder?.id || undefined,
            recipientName: shipmentForm.recipientName.trim(),
            recipientPhone: shipmentForm.recipientPhone.trim(),
            deliveryAddress: shipmentForm.deliveryAddress.trim(),
            toProvinceId: shipmentForm.provinceCode,
            toDistrictId: shipmentForm.districtCode,
            toWardCode: shipmentForm.wardCode,
            orderValue: parseInputMoney(shipmentForm.orderValue) || selectedOrder?.totalPrice || 0,
            weight: shipmentForm.weight,
            length: shipmentForm.length,
            width: shipmentForm.width,
            height: shipmentForm.height,
            note: shipmentForm.note.trim(),
            serviceTypeId: shipmentForm.serviceTypeId,
            paymentTypeId: shipmentForm.paymentTypeId,
        });
        setShippingSubmitting(false);

        if (!res.success) {
            appToast.error('Tạo vận đơn thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        setShipmentFormOpen(false);
        resetShipmentForm();
        appToast.success('Đã tạo vận đơn thành công');
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
                                <p className="muted">Điền thông tin người nhận và thông số kiện hàng để gửi sang hệ thống vận chuyển.</p>
                                <div className="shipment-form-grid">
                                    <label className="shipment-field">
                                        <span>Tên người nhận</span>
                                        <input className="form-input" placeholder="Nhập tên người nhận" value={shipmentForm.recipientName} onChange={(e) => setShipmentForm((prev) => ({ ...prev, recipientName: e.target.value }))} />
                                    </label>
                                    <label className="shipment-field">
                                        <span>Số điện thoại</span>
                                        <input className="form-input" placeholder="Nhập số điện thoại" value={shipmentForm.recipientPhone} onChange={(e) => setShipmentForm((prev) => ({ ...prev, recipientPhone: e.target.value }))} />
                                    </label>
                                    <label className="shipment-field shipment-span-2">
                                        <span>Địa chỉ giao hàng</span>
                                        <input className="form-input" placeholder="Nhập địa chỉ giao hàng" value={shipmentForm.deliveryAddress} onChange={(e) => setShipmentForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))} />
                                    </label>
                                    <label className="shipment-field">
                                        <span>Tỉnh / thành phố</span>
                                        <select className="form-input" value={shipmentForm.provinceCode} onChange={(e) => setShipmentForm((prev) => ({ ...prev, provinceCode: e.target.value }))} disabled={locationLoading.provinces}>
                                            <option value="">Chọn tỉnh/thành</option>
                                            {cityOptions.map((item) => (
                                                <option key={item.code} value={item.code}>{item.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="shipment-field">
                                        <span>Quận / huyện</span>
                                        <select className="form-input" value={shipmentForm.districtCode} onChange={(e) => setShipmentForm((prev) => ({ ...prev, districtCode: e.target.value }))} disabled={!shipmentForm.provinceCode || locationLoading.districts}>
                                            <option value="">Chọn quận/huyện</option>
                                            {availableDistricts.map((item) => (
                                                <option key={item.code} value={item.code}>{item.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="shipment-field">
                                        <span>Phường / xã</span>
                                        <select className="form-input" value={shipmentForm.wardCode} onChange={(e) => setShipmentForm((prev) => ({ ...prev, wardCode: e.target.value }))} disabled={!shipmentForm.districtCode || locationLoading.wards}>
                                            <option value="">Chọn phường/xã</option>
                                            {availableWards.map((item) => (
                                                <option key={item.code} value={item.code}>{item.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="shipment-field">
                                        <span>Giá trị đơn hàng</span>
                                        <input
                                            className="form-input"
                                            placeholder="Nhập giá trị đơn hàng"
                                            value={shipmentForm.orderValue ? `${formatInputMoney(shipmentForm.orderValue)} đ` : ''}
                                            onChange={(e) => setShipmentForm((prev) => ({ ...prev, orderValue: parseInputMoney(e.target.value) }))}
                                        />
                                    </label>
                                    <label className="shipment-field">
                                        <span>Cân nặng (gram)</span>
                                        <input className="form-input" placeholder="Nhập cân nặng" value={shipmentForm.weight} onChange={(e) => setShipmentForm((prev) => ({ ...prev, weight: e.target.value }))} />
                                    </label>
                                    <label className="shipment-field">
                                        <span>Dài (cm)</span>
                                        <input className="form-input" placeholder="Nhập chiều dài" value={shipmentForm.length} onChange={(e) => setShipmentForm((prev) => ({ ...prev, length: e.target.value }))} />
                                    </label>
                                    <label className="shipment-field">
                                        <span>Rộng (cm)</span>
                                        <input className="form-input" placeholder="Nhập chiều rộng" value={shipmentForm.width} onChange={(e) => setShipmentForm((prev) => ({ ...prev, width: e.target.value }))} />
                                    </label>
                                    <label className="shipment-field">
                                        <span>Cao (cm)</span>
                                        <input className="form-input" placeholder="Nhập chiều cao" value={shipmentForm.height} onChange={(e) => setShipmentForm((prev) => ({ ...prev, height: e.target.value }))} />
                                    </label>
                                    <label className="shipment-field shipment-span-2">
                                        <span>Ghi chú</span>
                                        <textarea className="form-input" rows="3" placeholder="Nhập ghi chú" value={shipmentForm.note} onChange={(e) => setShipmentForm((prev) => ({ ...prev, note: e.target.value }))} />
                                    </label>
                                </div>
                                <div className="shipment-actions">
                                    <button type="button" className="btn btn-primary" onClick={handleCreateShipment} disabled={shippingSubmitting}>
                                        {shippingSubmitting ? 'Đang tạo...' : 'Tạo vận đơn'}
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
