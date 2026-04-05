import React, { useState } from 'react';
import { FiUser, FiShield, FiBell, FiCreditCard, FiHome, FiMail, FiMessageCircle, FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
    });

    React.useEffect(() => {
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || '',
        });
    }, [user]);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [twoFA, setTwoFA] = useState(true);
    const [notifEmail, setNotifEmail] = useState(true);
    const [notifSMS, setNotifSMS] = useState(false);
    const [notifPromo, setNotifPromo] = useState(true);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            updateUser({
                ...user,
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
            });
            setEditMode(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-block profile-block-header">
                    <h1 className="profile-title">Cài đặt tài khoản</h1>
                    <p className="profile-subtitle">
                        Nơi gìn giữ và quản lý thông tin tâm linh của bạn.
                    </p>
            </div>

            {/* Hồ sơ cá nhân */}
            <section className="profile-block profile-section">
                    <div className="profile-section-header">
                        <div className="profile-section-title-wrap">
                            <FiUser size={22} strokeWidth={2} className="profile-section-icon" />
                            <h2 className="profile-section-title">Hồ sơ cá nhân</h2>
                        </div>
                        <button
                            type="button"
                            className="profile-edit-link"
                            onClick={() => setEditMode(!editMode)}
                        >
                            Chỉnh sửa tất cả
                        </button>
                    </div>
                    <div className="profile-section-divider" aria-hidden="true" />
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="profile-form-grid">
                            <div className="profile-field">
                                <label>HỌ VÀ TÊN</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    readOnly={!editMode}
                                    className={!editMode ? 'readonly' : ''}
                                />
                            </div>
                            <div className="profile-field">
                                <label>SỐ ĐIỆN THOẠI</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    readOnly={!editMode}
                                    className={!editMode ? 'readonly' : ''}
                                />
                            </div>
                            <div className="profile-field">
                                <label>EMAIL</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    readOnly
                                    disabled
                                    className="readonly"
                                />
                            </div>
                            <div className="profile-field">
                                <label>ĐỊA CHỈ GIAO HÀNG MẶC ĐỊNH</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    readOnly={!editMode}
                                    className={!editMode ? 'readonly' : ''}
                                />
                            </div>
                        </div>
                        {editMode && (
                            <div className="profile-form-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setEditMode(false)}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        )}
                    </form>
            </section>

            <div className="profile-blocks-row">
                <section id="security" className="profile-block profile-section">
                        <div className="profile-section-header">
                            <div className="profile-section-title-wrap">
                                <FiShield size={22} strokeWidth={2} className="profile-section-icon" />
                                <h2 className="profile-section-title">Bảo mật</h2>
                            </div>
                        </div>
                        <div className="profile-section-divider" aria-hidden="true" />
                        <div className="profile-security">
                            <div className="profile-security-item">
                                <div>
                                    <h3 className="profile-security-item-title">Đổi mật khẩu</h3>
                                    <p className="profile-security-label">Cập nhật mật khẩu để bảo vệ tài khoản</p>
                                </div>
                                <button type="button" className="btn btn-primary btn-sm">Thay đổi</button>
                            </div>
                            <div className="profile-section-divider" aria-hidden="true" />
                            <div className="profile-security-item">
                                <div>
                                    <h3 className="profile-security-item-title">Xác thực 2 lớp (2FA)</h3>
                                    <p className="profile-security-label">Thêm một lớp bảo mật qua SMS/App</p>
                                    <span className="profile-2fa-status">Đang bật</span>
                                </div>
                                <button
                                    type="button"
                                    className={`profile-toggle ${twoFA ? 'on' : ''}`}
                                    onClick={() => setTwoFA(!twoFA)}
                                    role="switch"
                                    aria-checked={twoFA}
                                >
                                    <span className="profile-toggle-thumb" />
                                </button>
                            </div>
                        </div>
                </section>

                <section id="notifications" className="profile-block profile-section">
                        <div className="profile-section-header">
                            <div className="profile-section-title-wrap">
                                <FiBell size={22} strokeWidth={2} className="profile-section-icon" />
                                <h2 className="profile-section-title">Thông báo</h2>
                            </div>
                        </div>
                        <div className="profile-section-divider" aria-hidden="true" />
                        <div className="profile-notifications">
                            <div className="profile-notif-card">
                                <FiMail size={20} strokeWidth={2} className="profile-notif-icon" />
                                <span className="profile-notif-label">Thông báo qua Email</span>
                                <button
                                    type="button"
                                    className={`profile-toggle profile-toggle-notif ${notifEmail ? 'on' : ''}`}
                                    onClick={() => setNotifEmail(!notifEmail)}
                                    role="switch"
                                    aria-checked={notifEmail}
                                >
                                    <span className="profile-toggle-thumb" />
                                </button>
                            </div>
                            <div className="profile-notif-card">
                                <FiMessageCircle size={20} strokeWidth={2} className="profile-notif-icon" />
                                <span className="profile-notif-label">Thông báo qua SMS</span>
                                <button
                                    type="button"
                                    className={`profile-toggle profile-toggle-notif ${notifSMS ? 'on' : ''}`}
                                    onClick={() => setNotifSMS(!notifSMS)}
                                    role="switch"
                                    aria-checked={notifSMS}
                                >
                                    <span className="profile-toggle-thumb" />
                                </button>
                            </div>
                            <div className="profile-notif-card">
                                <FiShoppingBag size={20} strokeWidth={2} className="profile-notif-icon" />
                                <span className="profile-notif-label">Khuyến mãi & Sản phẩm mới</span>
                                <button
                                    type="button"
                                    className={`profile-toggle profile-toggle-notif ${notifPromo ? 'on' : ''}`}
                                    onClick={() => setNotifPromo(!notifPromo)}
                                    role="switch"
                                    aria-checked={notifPromo}
                                >
                                    <span className="profile-toggle-thumb" />
                                </button>
                            </div>
                        </div>
                </section>
            </div>

            <section id="payment" className="profile-block profile-section profile-section-payment">
                    <div className="profile-section-header">
                        <div className="profile-section-title-wrap">
                            <FiCreditCard size={22} strokeWidth={2} className="profile-section-icon" />
                            <h2 className="profile-section-title">Phương thức thanh toán</h2>
                        </div>
                        <button type="button" className="btn profile-payment-add-btn">+ Thêm mới</button>
                    </div>
                    <div className="profile-section-divider profile-payment-divider" aria-hidden="true" />
                    <div className="profile-payment-cards">
                        <div className="profile-payment-card profile-payment-card-visa">
                            <span className="payment-card-number">**** **** **** 4521</span>
                            <span className="payment-card-holder">CHỦ THẺ: NGUYEN VAN AN</span>
                            <span className="payment-card-expiry">HẠN DÙNG: 12/28</span>
                            <span className="payment-card-brand">VISA PREMIUM</span>
                        </div>
                        <div className="profile-payment-card profile-payment-card-bank">
                            <FiHome size={28} strokeWidth={2} className="payment-bank-icon" />
                            <div className="payment-bank-info">
                                <span className="payment-bank-name">Vietcombank</span>
                                <span className="payment-bank-number">**** **** 9081</span>
                                <span className="payment-bank-status">ĐÃ LIÊN KẾT</span>
                            </div>
                        </div>
                    </div>
            </section>

            <section className="profile-block profile-section profile-delete">
                    <div className="profile-delete-content">
                        <div className="profile-delete-text">
                            <h2 className="profile-delete-title">Xóa tài khoản</h2>
                            <p className="profile-delete-desc">
                                Sau khi xóa, mọi dữ liệu đơn hàng và thông tin cá nhân sẽ không thể khôi phục.
                            </p>
                        </div>
                        <button type="button" className="btn profile-delete-btn">
                            Yêu cầu xóa tài khoản
                        </button>
                    </div>
            </section>
        </div>
    );
};

export default ProfilePage;
