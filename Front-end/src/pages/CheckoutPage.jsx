import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { useCart } from '../context/CartContext';
import paymentService from '../services/paymentService';
import checkoutService from '../services/checkoutService';
import { appToast } from '../lib/appToast';
import './CheckoutPage.css';

const formatVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} đ`;

const normalizeAddressItem = (item, idKeys, nameKeys) => {
    const id = idKeys.map((key) => item?.[key]).find((value) => value !== undefined && value !== null);
    const name = nameKeys.map((key) => item?.[key]).find((value) => value !== undefined && value !== null);
    return {
        id: id != null ? String(id) : '',
        name: String(name || '').trim(),
        raw: item,
    };
};

const resolveShippingFee = (feeData) => {
    if (typeof feeData === 'number') return feeData;
    if (!feeData || typeof feeData !== 'object') return 0;

    const candidates = [
        feeData.total,
        feeData.totalFee,
        feeData.shippingFee,
        feeData.fee,
        feeData.service_fee,
        feeData.serviceFee,
    ];

    for (const value of candidates) {
        if (!Number.isNaN(Number(value))) return Number(value || 0);
    }

    return 0;
};

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { selectedItems, subtotal } = useCart();

    const items = useMemo(() => selectedItems || [], [selectedItems]);

    const [submitting, setSubmitting] = useState(false);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingError, setShippingError] = useState('');
    const [shippingFee, setShippingFee] = useState(0);

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);


    const [shipping, setShipping] = useState({
        fullName: '',
        phone: '',
        provinceId: '',
        provinceName: '',
        districtId: '',
        districtName: '',
        wardCode: '',
        wardName: '',
        addressDetail: '',
        note: '',
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!items.length) {
            appToast.warning('Giỏ hàng đang trống. Vui lòng thêm sản phẩm trước khi thanh toán.');
            navigate('/cart', { replace: true });
        }
    }, [items.length, navigate]);

    useEffect(() => {
        let cancelled = false;

        const loadProvinces = async () => {
            const result = await checkoutService.getProvinces();
            if (cancelled) return;

            if (!result.success) {
                appToast.error('Không tải được danh sách tỉnh/thành', result.error || 'Vui lòng thử lại');
                return;
            }

            const normalized = (result.data || [])
                .map((item) => normalizeAddressItem(item, ['provinceId', 'ProvinceID', 'id'], ['provinceName', 'ProvinceName', 'name']))
                .filter((item) => item.id && item.name);

            setProvinces(normalized);
        };

        loadProvinces();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadDistricts = async () => {
            if (!shipping.provinceId) {
                setDistricts([]);
                return;
            }

            const result = await checkoutService.getDistricts(shipping.provinceId);
            if (cancelled) return;

            if (!result.success) {
                appToast.error('Không tải được quận/huyện', result.error || 'Vui lòng thử lại');
                setDistricts([]);
                return;
            }

            const normalized = (result.data || [])
                .map((item) => normalizeAddressItem(item, ['districtId', 'DistrictID', 'id'], ['districtName', 'DistrictName', 'name']))
                .filter((item) => item.id && item.name);

            setDistricts(normalized);
        };

        loadDistricts();

        return () => {
            cancelled = true;
        };
    }, [shipping.provinceId]);

    useEffect(() => {
        let cancelled = false;

        const loadWards = async () => {
            if (!shipping.districtId) {
                setWards([]);
                return;
            }

            const result = await checkoutService.getWards(shipping.districtId);
            if (cancelled) return;

            if (!result.success) {
                appToast.error('Không tải được phường/xã', result.error || 'Vui lòng thử lại');
                setWards([]);
                return;
            }

            const normalized = (result.data || [])
                .map((item) => normalizeAddressItem(item, ['wardCode', 'WardCode', 'code'], ['wardName', 'WardName', 'name']))
                .filter((item) => item.id && item.name);

            setWards(normalized);
        };

        loadWards();

        return () => {
            cancelled = true;
        };
    }, [shipping.districtId]);

    const totalWeight = useMemo(() => {
        const estimated = (items || []).reduce((sum, item) => {
            const qty = Math.max(1, Number(item?.quantity || 1));
            const itemWeight = Number(item?.weight || 500);
            return sum + (Number.isNaN(itemWeight) ? 500 * qty : itemWeight * qty);
        }, 0);

        return Math.max(500, estimated || 500);
    }, [items]);

    useEffect(() => {
        let cancelled = false;

        const calcFee = async () => {
            if (!shipping.districtId || !shipping.wardCode) {
                setShippingError('');
                setShippingFee(0);
                return;
            }

            setShippingLoading(true);
            setShippingError('');

            const result = await checkoutService.calculateShippingFee({
                toDistrictId: Number(shipping.districtId),
                toWardCode: shipping.wardCode,
                weight: totalWeight,
                length: 20,
                width: 15,
                height: 10,
                serviceTypeId: 2,
                paymentTypeId: 1,
                orderValue: Number(subtotal || 0),
            });

            if (cancelled) return;

            if (!result.success) {
                setShippingFee(0);
                setShippingError('Không tính được phí, sẽ tính khi giao');
                setShippingLoading(false);
                return;
            }

            setShippingFee(resolveShippingFee(result.data));
            setShippingError('');
            setShippingLoading(false);
        };

        calcFee();

        return () => {
            cancelled = true;
        };
    }, [shipping.districtId, shipping.wardCode, subtotal, totalWeight]);

    const validateForm = () => {
        const nextErrors = {};

        if (!shipping.fullName.trim()) {
            nextErrors.fullName = 'Vui lòng nhập họ và tên';
        }

        const phone = shipping.phone.trim();
        if (!phone) {
            nextErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^\d{10}$/.test(phone)) {
            nextErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số';
        }

        if (!shipping.provinceId) nextErrors.provinceId = 'Vui lòng chọn tỉnh/thành phố';
        if (!shipping.districtId) nextErrors.districtId = 'Vui lòng chọn quận/huyện';
        if (!shipping.wardCode) nextErrors.wardCode = 'Vui lòng chọn phường/xã';

        if (!shipping.addressDetail.trim()) {
            nextErrors.addressDetail = 'Vui lòng nhập địa chỉ cụ thể';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const setField = (field, value) => {
        setShipping((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSelectProvince = (e) => {
        const provinceId = e.target.value;
        const selected = provinces.find((p) => p.id === provinceId);

        setShipping((prev) => ({
            ...prev,
            provinceId,
            provinceName: selected?.name || '',
            districtId: '',
            districtName: '',
            wardCode: '',
            wardName: '',
        }));

        setWards([]);
        setErrors((prev) => ({ ...prev, provinceId: '', districtId: '', wardCode: '' }));
    };

    const handleSelectDistrict = (e) => {
        const districtId = e.target.value;
        const selected = districts.find((d) => d.id === districtId);

        setShipping((prev) => ({
            ...prev,
            districtId,
            districtName: selected?.name || '',
            wardCode: '',
            wardName: '',
        }));

        setErrors((prev) => ({ ...prev, districtId: '', wardCode: '' }));
    };

    const handleSelectWard = (e) => {
        const wardCode = e.target.value;
        const selected = wards.find((w) => w.id === wardCode);

        setShipping((prev) => ({
            ...prev,
            wardCode,
            wardName: selected?.name || '',
        }));

        setErrors((prev) => ({ ...prev, wardCode: '' }));
    };

    const total = useMemo(() => Number(subtotal || 0) + Number(shippingFee || 0), [subtotal, shippingFee]);

    const handlePlaceOrder = async () => {
        if (submitting) return;
        if (!validateForm()) return;

        const validateResult = await checkoutService.validateCheckout();
        if (!validateResult.success) {
            appToast.error('Không thể thanh toán', validateResult.error || 'Giỏ hàng không hợp lệ');
            return;
        }

        setSubmitting(true);
        try {
            const shippingAddress = `${shipping.addressDetail.trim()}, ${shipping.wardName}, ${shipping.districtName}, ${shipping.provinceName}`;

            const checkoutResult = await checkoutService.createCheckout({
                shippingAddress,
                phoneNumber: shipping.phone.trim(),
                note: shipping.note?.trim() || '',
            });

            if (!checkoutResult.success) {
                appToast.error('Tạo nhóm đơn hàng thất bại', checkoutResult.error || 'Vui lòng thử lại');
                return;
            }

            const orderGroupId = checkoutResult.data?.orderGroupId || checkoutResult.data?.groupId;
            if (!orderGroupId) {
                appToast.error('Không nhận được mã nhóm đơn hàng để thanh toán');
                return;
            }

            const paymentResult = await paymentService.initiateOrderGroupPayment({
                orderGroupId,
                method: 'VNPAY',
                returnUrl: `${window.location.origin}/payment/success`,
            });

            if (!paymentResult.success) {
                appToast.error('Khởi tạo thanh toán thất bại', paymentResult.error || 'Vui lòng thử lại');
                return;
            }

            const paymentUrl = paymentResult.data?.paymentUrl;
            if (!paymentUrl) {
                appToast.error('Không nhận được link thanh toán VNPay');
                return;
            }

            window.location.href = paymentUrl;
        } catch (error) {
            appToast.error('Thanh toán thất bại', error?.message || 'Vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="checkout-page">
            <Header />
            <main className="checkout-main container">
                <div className="checkout-steps">
                    <span className="done">Giỏ hàng</span>
                    <span className="active">Giao hàng & TT</span>
                    <span>Xác nhận</span>
                </div>

                <div className="checkout-layout">
                    <section className="checkout-left">
                        <article className="checkout-card">
                            <h3>Phương thức thanh toán</h3>
                            <div className="method-list">
                                <button type="button" className="method-card selected">
                                    <span className="dot" />
                                    <div>
                                        <strong>VNPay</strong>
                                        <p>Thẻ ATM nội địa, Visa/Mastercard, QR</p>
                                    </div>
                                </button>
                            </div>
                            <div className="method-info">
                                Đơn hàng sẽ được tạo trước, sau đó bạn được chuyển đến cổng VNPay để thanh toán an toàn.
                            </div>
                        </article>

                        <article className="checkout-card">
                            <h3>Thông tin giao hàng</h3>
                            <div className="form-grid">
                                <label>
                                    Họ và tên *
                                    <input
                                        value={shipping.fullName}
                                        onChange={(e) => setField('fullName', e.target.value)}
                                    />
                                    {errors.fullName ? <small className="field-error">{errors.fullName}</small> : null}
                                </label>

                                <label>
                                    Số điện thoại *
                                    <input
                                        value={shipping.phone}
                                        onChange={(e) => setField('phone', e.target.value)}
                                        inputMode="numeric"
                                    />
                                    {errors.phone ? <small className="field-error">{errors.phone}</small> : null}
                                </label>

                                <label className="wide">
                                    Tỉnh/Thành phố *
                                    <select value={shipping.provinceId} onChange={handleSelectProvince}>
                                        <option value="">Chọn tỉnh/thành phố</option>
                                        {provinces.map((province) => (
                                            <option key={province.id} value={province.id}>{province.name}</option>
                                        ))}
                                    </select>
                                    {errors.provinceId ? <small className="field-error">{errors.provinceId}</small> : null}
                                </label>

                                <label>
                                    Quận/Huyện *
                                    <select value={shipping.districtId} onChange={handleSelectDistrict} disabled={!shipping.provinceId}>
                                        <option value="">Chọn quận/huyện</option>
                                        {districts.map((district) => (
                                            <option key={district.id} value={district.id}>{district.name}</option>
                                        ))}
                                    </select>
                                    {errors.districtId ? <small className="field-error">{errors.districtId}</small> : null}
                                </label>

                                <label>
                                    Phường/Xã *
                                    <select value={shipping.wardCode} onChange={handleSelectWard} disabled={!shipping.districtId}>
                                        <option value="">Chọn phường/xã</option>
                                        {wards.map((ward) => (
                                            <option key={ward.id} value={ward.id}>{ward.name}</option>
                                        ))}
                                    </select>
                                    {errors.wardCode ? <small className="field-error">{errors.wardCode}</small> : null}
                                </label>

                                <label className="wide">
                                    Địa chỉ cụ thể *
                                    <input
                                        value={shipping.addressDetail}
                                        onChange={(e) => setField('addressDetail', e.target.value)}
                                        placeholder="Số nhà, tên đường..."
                                    />
                                    {errors.addressDetail ? <small className="field-error">{errors.addressDetail}</small> : null}
                                </label>

                                <label className="wide">
                                    Ghi chú
                                    <textarea
                                        rows={3}
                                        value={shipping.note}
                                        onChange={(e) => setField('note', e.target.value)}
                                    />
                                </label>
                            </div>
                        </article>
                    </section>

                    <aside className="checkout-right">
                        <article className="checkout-card summary-card">
                            <h3>Tóm tắt đơn hàng</h3>
                            <div className="summary-items">
                                {items.map((item) => (
                                    <div key={`${item.productId}-${item.productName}`} className="summary-item">
                                        <div className="summary-item-left">
                                            <div className="thumb">
                                                {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} /> : null}
                                            </div>
                                            <div>
                                                <strong>{item.productName}</strong>
                                                {item.zoneInputs?.length > 0 ? (
                                                    <p>{item.zoneInputs.map((z) => `${z.zoneName}: ${z.value || '—'}`).join(' · ')}</p>
                                                ) : null}
                                                <span>SL: {item.quantity}</span>
                                            </div>
                                        </div>
                                        <strong>{formatVnd(item.totalPrice)}</strong>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-total">
                                <div>
                                    <span>Tạm tính</span>
                                    <strong>{formatVnd(subtotal)}</strong>
                                </div>
                                <div>
                                    <span>Phí vận chuyển</span>
                                    <strong>
                                        {shippingLoading
                                            ? 'Đang tính...'
                                            : shippingError
                                                ? 'Không tính được phí, sẽ tính khi giao'
                                                : formatVnd(shippingFee)}
                                    </strong>
                                </div>
                                <div>
                                    <span>Giảm giá</span>
                                    <strong>—</strong>
                                </div>
                                <div className="grand">
                                    <span>Tổng cộng</span>
                                    <strong>{formatVnd(total)}</strong>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary checkout-submit"
                                onClick={handlePlaceOrder}
                                disabled={submitting || !items.length}
                            >
                                {submitting ? 'Đang xử lý...' : 'Đặt hàng & Thanh toán'}
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline checkout-back"
                                onClick={() => navigate('/cart')}
                                disabled={submitting}
                            >
                                Quay lại giỏ hàng
                            </button>
                        </article>
                    </aside>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
