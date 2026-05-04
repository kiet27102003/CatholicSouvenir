import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import api from '../cofig/api';
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

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { selectedItems, subtotal } = useCart();

    const items = useMemo(() => selectedItems || [], [selectedItems]);

    const [submitting, setSubmitting] = useState(false);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingFee, setShippingFee] = useState(0);
    const [shippingBreakdown, setShippingBreakdown] = useState([]);
    const [checkoutSummary, setCheckoutSummary] = useState(null);

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [profileShipping, setProfileShipping] = useState(null);

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
        let cancelled = false;

        const loadProfile = async () => {
            try {
                const response = await api.get('/profile');
                if (cancelled) return;

                const profile = response?.data?.data || response?.data || null;
                if (!profile) return;

                setProfileShipping(profile);
                setShipping((prev) => ({
                    ...prev,
                    fullName: prev.fullName || profile.fullName || '',
                    phone: prev.phone || profile.phone || '',
                    addressDetail: prev.addressDetail || profile.address || '',
                    provinceName: prev.provinceName || profile.city || '',
                    districtName: prev.districtName || profile.district || '',
                    wardName: prev.wardName || profile.ward || '',
                }));
            } catch (error) {
                if (!cancelled) {
                    // Không chặn flow checkout nếu profile chưa load được
                }
            }
        };

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, []);

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
        if (!profileShipping || !provinces.length) return;

        const matchedProvince = provinces.find((province) => province.name === String(profileShipping.city || '').trim());
        if (!matchedProvince || shipping.provinceId) return;

        setShipping((prev) => ({
            ...prev,
            provinceId: matchedProvince.id,
            provinceName: matchedProvince.name,
        }));
    }, [profileShipping, provinces, shipping.provinceId]);

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
        if (!profileShipping || !districts.length || !shipping.provinceId) return;

        const matchedDistrict = districts.find((district) => district.name === String(profileShipping.district || '').trim());
        if (!matchedDistrict || shipping.districtId) return;

        setShipping((prev) => ({
            ...prev,
            districtId: matchedDistrict.id,
            districtName: matchedDistrict.name,
        }));
    }, [profileShipping, districts, shipping.provinceId, shipping.districtId]);

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

    useEffect(() => {
        if (!profileShipping || !wards.length || !shipping.districtId) return;

        const matchedWard = wards.find((ward) => ward.name === String(profileShipping.ward || '').trim());
        if (!matchedWard || shipping.wardCode) return;

        setShipping((prev) => ({
            ...prev,
            wardCode: matchedWard.id,
            wardName: matchedWard.name,
        }));
    }, [profileShipping, wards, shipping.districtId, shipping.wardCode]);

    const totalWeight = useMemo(() => {
        const estimated = (items || []).reduce((sum, item) => {
            const qty = Math.max(1, Number(item?.quantity || 1));
            const itemWeight = Number(item?.weight || 500);
            return sum + (Number.isNaN(itemWeight) ? 500 * qty : itemWeight * qty);
        }, 0);

        return Math.max(500, estimated || 500);
    }, [items]);

    const packageDimensions = useMemo(() => ({
        length: 20,
        width: 20,
        height: 10,
    }), []);

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

    useEffect(() => {
        let cancelled = false;

        const loadShippingFee = async () => {
            if (!shipping.districtId || !shipping.wardCode || !items.length) {
                setShippingFee(0);
                setShippingBreakdown([]);
                return;
            }

            setShippingLoading(true);
            const res = await checkoutService.calculateShippingFee({
                toDistrictId: shipping.districtId,
                toWardCode: shipping.wardCode,
                weight: totalWeight,
                ...packageDimensions,
            });

            if (cancelled) return;

            if (!res.success) {
                setShippingFee(0);
                setShippingBreakdown([]);
                setShippingLoading(false);
                return;
            }

            const fee = Number(res.data?.totalShippingFee ?? res.data?.shippingFee ?? 0);
            setShippingFee(Number.isNaN(fee) ? 0 : fee);
            setShippingBreakdown(Array.isArray(res.data?.breakdown) ? res.data.breakdown : []);
            setShippingLoading(false);
        };

        loadShippingFee();

        return () => {
            cancelled = true;
        };
    }, [shipping.districtId, shipping.wardCode, items.length, totalWeight, packageDimensions]);

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

    const total = useMemo(() => Number(subtotal || 0), [subtotal]);

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
            const shippingAddress = `${shipping.addressDetail.trim()}, ${shipping.wardName || profileShipping?.ward || ''}, ${shipping.districtName || profileShipping?.district || ''}, ${shipping.provinceName || profileShipping?.city || ''}`.replace(/^,\s*|\s*,\s*,/g, '').trim();

            const checkoutResult = await checkoutService.checkoutWithShipping({
                shippingAddress,
                phoneNumber: shipping.phone.trim(),
                recipientName: shipping.fullName.trim(),
                toDistrictId: shipping.districtId,
                toWardCode: shipping.wardCode,
                paymentMethod: 'VNPAY',
                weight: totalWeight,
                ...packageDimensions,
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

            setCheckoutSummary(checkoutResult.data || null);

            const paymentResult = await paymentService.initiateOrderGroupPayment({
                orderGroupId,
                method: 'VNPAY',
                returnUrl: `${window.location.origin}/payment/result`,
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
                            <div className="summary-header">
                                <div>
                                    <p className="summary-eyebrow">ĐƠN HÀNG CỦA BẠN</p>
                                    <h3>Tóm tắt đơn hàng</h3>
                                </div>
                                <div className="summary-badge">{items.length} sản phẩm</div>
                            </div>

                            <div className="summary-items">
                                {items.map((item) => (
                                    <div key={`${item.productId}-${item.productName}`} className="summary-item">
                                        <div className="summary-item-left">
                                            <div className="thumb">
                                                {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} /> : null}
                                            </div>
                                            <div className="summary-item-meta">
                                                <strong className="summary-item-name">{item.productName}</strong>
                                                {item.zoneInputs?.length > 0 ? (
                                                    <p className="summary-item-variant">{item.zoneInputs.map((z) => `${z.zoneName}: ${z.value || '—'}`).join(' · ')}</p>
                                                ) : null}
                                                <div className="summary-item-qty-row">
                                                    <span>Số lượng: {item.quantity}</span>
                                                    <span className="summary-item-unit-price">{formatVnd(item.totalPrice)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-pricing">
                                <div>
                                    <span>Tạm tính</span>
                                    <strong>{formatVnd(subtotal)}</strong>
                                </div>
                                <div>
                                    <span>Phí vận chuyển</span>
                                    <strong>{shippingLoading ? 'Đang tính...' : formatVnd(shippingFee)}</strong>
                                </div>
                            </div>

                            <div className="summary-total grand">
                                <span>Tổng cộng</span>
                                <strong>{formatVnd(Number(subtotal || 0) + Number(shippingFee || 0))}</strong>
                            </div>

                            {/* {shippingBreakdown.length > 0 && (
                                <div className="shipping-breakdown">
                                    <h4>Chi tiết phí vận chuyển</h4>
                                    {shippingBreakdown.map((artisan) => (
                                        <div key={artisan.artisanId || artisan.artisanName} className="shipping-breakdown-item">
                                            <div>
                                                <strong>{artisan.artisanName || 'Nghệ nhân'}</strong>
                                                <p>{Number(artisan.itemCount || 0)} sản phẩm · {Number(artisan.weight || 0)}g</p>
                                            </div>
                                            <strong>{formatVnd(artisan.shippingFee)}</strong>
                                        </div>
                                    ))}
                                </div>
                            )} */}

                            {checkoutSummary?.orderCount ? (
                                <div className="order-note">
                                    <h4>Đơn hàng sẽ được tạo</h4>
                                    <p>{checkoutSummary.orderCount} đơn hàng · Tổng tiền {formatVnd(checkoutSummary.totalAmount)}</p>
                                </div>
                            ) : null}

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
