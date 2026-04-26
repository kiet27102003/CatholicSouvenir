import React, { useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiExternalLink, FiPackage, FiRefreshCw, FiTruck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import { getOrderById, getOrdersByArtisan } from '../../services/orderService';
import {
    cancelShipment,
    createShipment,
    getShipmentDistricts,
    getShipmentProvinces,
    getShipmentWardOptions,
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

const PAYMENT_LABELS = {
    VNPAY: 'VNPAY',
    COD: 'Thanh toán khi nhận hàng',
    BANK_TRANSFER: 'Chuyển khoản',
};

const mapProvinceItem = (item) => ({
    code: String(item?.provinceId ?? item?.ProvinceID ?? item?.id ?? ''),
    name: item?.provinceName || item?.ProvinceName || item?.Name || item?.name || '',
});

const mapDistrictItem = (item) => ({
    code: String(item?.districtId ?? item?.DistrictID ?? item?.id ?? ''),
    name: item?.districtName || item?.DistrictName || item?.Name || item?.name || '',
});

const mapWardItem = (item) => ({
    code: String(item?.wardCode ?? item?.WardCode ?? item?.id ?? ''),
    name: item?.wardName || item?.WardName || item?.Name || item?.name || '',
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
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailOrder, setDetailOrder] = useState(null);
    const [detailError, setDetailError] = useState('');
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

        const ordersList = Array.isArray(ordersRes.data?.content)
            ? ordersRes.data.content
            : Array.isArray(ordersRes.data)
                ? ordersRes.data
                : [];

        const paidOrders = ordersList.filter((order) => String(order?.status || '').toUpperCase() === 'PAID');
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
            const res = await getShipmentProvinces();
            if (res.success) {
                setProvinces((Array.isArray(res.data) ? res.data : []).map(mapProvinceItem));
            } else {
                setProvinces([]);
                appToast.error('Không tải được danh sách tỉnh/thành', res.error || 'Vui lòng thử lại');
            }
            setLocationLoading((prev) => ({ ...prev, provinces: false }));
        };

        loadProvinces();
    }, []);

    useEffect(() => {
        const loadDistricts = async () => {
            if (!shipmentForm.provinceCode) {
                setDistricts([]);
                setWards([]);
                setShipmentForm((prev) => ({ ...prev, districtCode: '', wardCode: '' }));
                return;
            }
            setLocationLoading((prev) => ({ ...prev, districts: true }));
            const res = await getShipmentDistricts(shipmentForm.provinceCode);
            if (res.success) {
                setDistricts((Array.isArray(res.data) ? res.data : []).map(mapDistrictItem));
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
            const res = await getShipmentWardOptions(shipmentForm.districtCode);
            if (res.success) {
                setWards((Array.isArray(res.data) ? res.data : []).map(mapWardItem));
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
            toDistrictId: Number(shipmentForm.districtCode || 0),
            toWardCode: shipmentForm.wardCode,
            orderValue: parseInputMoney(shipmentForm.orderValue) || selectedOrder?.totalPrice || 0,
            weight: shipmentForm.weight,
            length: shipmentForm.length,
            width: shipmentForm.width,
            height: shipmentForm.height,
            note: shipmentForm.note.trim(),
            serviceTypeId: Number(shipmentForm.serviceTypeId || 0),
            paymentTypeId: Number(shipmentForm.paymentTypeId || 0),
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

    const handleOpenOrderDetail = async (order) => {
        const orderId = order?.orderId || order?.id;
        if (!orderId) return;

        setDetailModalOpen(true);
        setDetailLoading(true);
        setDetailError('');
        setDetailOrder(null);

        const res = await getOrderById(orderId);
        if (!res.success) {
            setDetailError(res.error || 'Không tải được thông tin đơn hàng.');
            setDetailLoading(false);
            return;
        }

        setDetailOrder(res.data);
        setDetailLoading(false);
    };

    const handleCloseOrderDetail = () => {
        setDetailModalOpen(false);
        setDetailLoading(false);
        setDetailOrder(null);
        setDetailError('');
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

    const orderDetail = detailOrder;
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
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => handleOpenOrderDetail(selectedOrder)}>
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
                                    {!locationLoading.provinces && provinces.length === 0 && (
                                        <div className="shipment-hint shipment-span-2">Chưa tải được danh sách tỉnh/thành. Kiểm tra lại API `GET /api/shipments/address/provinces`.</div>
                                    )}
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

    const orderDetailsTotal = Array.isArray(orderDetail?.orderDetails) ? orderDetail.orderDetails.reduce((sum, item) => sum + Number(item?.subTotal || 0), 0) : 0;

    return (
        <>
            {content}

            <div className={`order-detail-side-panel ${detailModalOpen ? 'open' : ''}`} aria-hidden={!detailModalOpen}>
                <div className="order-detail-side-panel-header">
                    <div>
                        <p className="page-kicker">Chi tiết đơn hàng</p>
                        <h3 id="order-detail-title">{orderDetail?.orderId ? `#${String(orderDetail.orderId).slice(0, 8)}` : 'Đang tải...'}</h3>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleCloseOrderDetail}>Đóng</button>
                </div>

                {detailLoading ? (
                    <div className="order-detail-side-panel-body"><p className="shipment-empty">Đang tải thông tin đơn hàng...</p></div>
                ) : detailError ? (
                    <div className="order-detail-side-panel-body"><p className="shipment-empty">{detailError}</p></div>
                ) : orderDetail ? (
                    <div className="order-detail-side-panel-body">
                        <section className="order-detail-section">
                            <h4>Thông tin chung</h4>
                            <div className="order-detail-grid order-detail-grid-2">
                                <div className="order-detail-item"><span>Mã đơn</span><strong>{orderDetail.orderId || '—'}</strong></div>
                                <div className="order-detail-item"><span>Khách hàng</span><strong>{orderDetail.fullName || '—'}</strong></div>
                                <div className="order-detail-item"><span>Trạng thái</span><strong>{STATUS_LABELS[String(orderDetail.status || '').toUpperCase()] || orderDetail.status || '—'}</strong></div>
                                <div className="order-detail-item"><span>Thanh toán</span><strong>{PAYMENT_LABELS[String(orderDetail.paymentMethod || '').toUpperCase()] || orderDetail.paymentMethod || '—'}</strong></div>
                                <div className="order-detail-item"><span>Ngày tạo</span><strong>{formatDateTime(orderDetail.orderDate || orderDetail.createAt)}</strong></div>
                                <div className="order-detail-item"><span>Cập nhật</span><strong>{formatDateTime(orderDetail.updateAt)}</strong></div>
                            </div>
                        </section>

                        <section className="order-detail-section">
                            <h4>Thanh toán</h4>
                            <div className="order-detail-grid order-detail-grid-3">
                                <div className="order-detail-item"><span>Tổng tiền</span><strong>{formatCurrency(orderDetail.total)}</strong></div>
                                <div className="order-detail-item"><span>Tổng tính lại</span><strong>{formatCurrency(orderDetailsTotal)}</strong></div>
                                <div className="order-detail-item"><span>Khách hàng ID</span><strong>{orderDetail.customerId || '—'}</strong></div>
                            </div>
                        </section>

                        <section className="order-detail-section">
                            <h4>Sản phẩm trong đơn</h4>
                            {Array.isArray(orderDetail.orderDetails) && orderDetail.orderDetails.length > 0 ? (
                                <div className="order-detail-items-list">
                                    {orderDetail.orderDetails.map((item) => (
                                        <article key={item.id} className="order-detail-product-card">
                                            <img src={item.image || '/logo.png'} alt={item.productName || 'Sản phẩm'} />
                                            <div>
                                                <strong>{item.productName || '—'}</strong>
                                                <p>Số lượng: {item.quantity || 0}</p>
                                                <p>Đơn giá: {formatCurrency(item.unitPrice)}</p>
                                                <p>Giảm giá: {formatCurrency(item.discount)}</p>
                                                <p>Tạm tính: {formatCurrency(item.subTotal)}</p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="shipment-empty">Không có sản phẩm chi tiết.</p>
                            )}
                        </section>

                        <section className="order-detail-section">
                            <h4>Template details</h4>
                            {Array.isArray(orderDetail.templateDetails) && orderDetail.templateDetails.length > 0 ? (
                                <pre className="order-detail-json">{JSON.stringify(orderDetail.templateDetails, null, 2)}</pre>
                            ) : (
                                <p className="shipment-empty">Không có template details.</p>
                            )}
                        </section>
                    </div>
                ) : null}
            </div>
        </>
    );
};

export default ShipmentManagementPage;
