import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiCamera, FiUser, FiShield, FiBell, FiMail, FiMessageCircle, FiShoppingBag } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../cofig/api';
import { getSupabaseConfig, isSupabaseConfigured, SUPABASE_STORAGE_BUCKET } from '../../lib/supabase';
import './ProfilePage.css';

const formatDate = (value) => {
    if (!value) return 'Chưa cập nhật';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatValue = (value) => value || 'Chưa cập nhật';

const genderLabel = (gender) => {
    if (!gender) return 'Chưa cập nhật';
    const normalized = String(gender).toUpperCase();
    const map = {
        MALE: 'Nam',
        FEMALE: 'Nữ',
        OTHER: 'Khác',
        NAM: 'Nam',
        NU: 'Nữ',
        NỮ: 'Nữ',
        KHAC: 'Khác',
        KHÁC: 'Khác',
    };
    return map[normalized] || gender;
};

const ProfilePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab = useMemo(() => new URLSearchParams(location.search).get('tab') || 'profile', [location.search]);

    const emptyFormState = {
        fullName: '',
        email: '',
        phone: '',
        avatarUrl: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        postalCode: '',
        bio: '',
        saintName: '',
        language: '',
        timezone: '',
        gender: '',
        dateOfBirth: '',
    };

    const [formData, setFormData] = useState(emptyFormState);
    const [initialFormData, setInitialFormData] = useState(emptyFormState);
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [twoFA, setTwoFA] = useState(true);
    const [notifEmail, setNotifEmail] = useState(true);
    const [notifSMS, setNotifSMS] = useState(false);
    const [notifPromo, setNotifPromo] = useState(true);
    const avatarInputRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        const loadProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await api.get('/profile');
                const data = response?.data?.data || null;
                if (!mounted) return;
                setProfile(data);
                const nextFormState = {
                    fullName: data?.fullName || '',
                    email: data?.email || '',
                    phone: data?.phone || '',
                    avatarUrl: data?.avatarUrl || '',
                    address: data?.address || '',
                    city: data?.city || '',
                    district: data?.district || '',
                    ward: data?.ward || '',
                    postalCode: data?.postalCode || '',
                    bio: data?.bio || '',
                    saintName: data?.saintName || '',
                    language: data?.language || '',
                    timezone: data?.timezone || '',
                    gender: data?.gender || '',
                    dateOfBirth: data?.dateOfBirth || '',
                };
                setFormData(nextFormState);
                setInitialFormData(nextFormState);
            } catch (err) {
                if (!mounted) return;
                setError(err?.response?.data?.message || 'Không thể tải thông tin hồ sơ.');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadProfile();
        return () => {
            mounted = false;
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAvatarSelect = () => {
        if (avatarInputRef.current) {
            avatarInputRef.current.click();
        }
    };

    const uploadAvatarToSupabase = async (file) => {
        const config = getSupabaseConfig();
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase chưa được cấu hình.');
        }

        const extension = file.name?.includes('.') ? file.name.split('.').pop() : 'png';
        const fileName = `profiles/${crypto.randomUUID()}-${Date.now()}.${extension}`;
        const uploadUrl = `${config.url}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${fileName}`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.anonKey}`,
                apikey: config.anonKey,
                'x-upsert': 'true',
            },
            body: file,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Tải ảnh lên Supabase thất bại.');
        }

        return `${config.url}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${fileName}`;
    };

    const handleAvatarFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSaving(true);
        setError('');

        try {
            const avatarUrl = await uploadAvatarToSupabase(file);
            setFormData((prev) => ({ ...prev, avatarUrl }));
        } catch (uploadError) {
            setError(uploadError?.message || 'Không thể tải ảnh lên Supabase.');
        } finally {
            setSaving(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const payload = {
            fullName: formData.fullName?.trim() || undefined,
            phone: formData.phone?.trim() || undefined,
            gender: formData.gender || undefined,
            dateOfBirth: formData.dateOfBirth || undefined,
            avatarUrl: formData.avatarUrl?.trim() || undefined,
            bio: formData.bio?.trim() || undefined,
            address: formData.address?.trim() || undefined,
            city: formData.city?.trim() || undefined,
            district: formData.district?.trim() || undefined,
            ward: formData.ward?.trim() || undefined,
            postalCode: formData.postalCode?.trim() || undefined,
            saintName: formData.saintName?.trim() || undefined,
            language: formData.language?.trim() || undefined,
            timezone: formData.timezone?.trim() || undefined,
        };

        Object.keys(payload).forEach((key) => {
            if (payload[key] === undefined) delete payload[key];
        });

        try {
            const response = await api.patch('/profile', payload);
            const data = response?.data?.data || null;
            if (data) {
                const nextFormState = {
                    fullName: data?.fullName || '',
                    email: data?.email || '',
                    phone: data?.phone || '',
                    address: data?.address || '',
                    city: data?.city || '',
                    district: data?.district || '',
                    ward: data?.ward || '',
                    postalCode: data?.postalCode || '',
                    bio: data?.bio || '',
                    saintName: data?.saintName || '',
                    language: data?.language || '',
                    timezone: data?.timezone || '',
                    gender: data?.gender || '',
                    dateOfBirth: data?.dateOfBirth || '',
                };
                setProfile(data);
                setFormData(nextFormState);
                setInitialFormData(nextFormState);
            } else {
                setProfile((prev) => (prev ? { ...prev, ...payload } : prev));
                setInitialFormData((prev) => ({ ...prev, ...payload }));
            }
            setEditMode(false);
            window.alert('Cập nhật thành công');
        } catch (err) {
            setError(err?.response?.data?.message || 'Không thể cập nhật hồ sơ.');
        } finally {
            setSaving(false);
        }
    };

    const setTab = (tab) => {
        if (tab === 'payment') {
            navigate('/payments');
            return;
        }
        navigate(`/profile?tab=${tab}`);
    };

    return (
        <div className="profile-page">
            <div className="profile-block profile-block-header profile-hero">
                <div className="profile-hero-avatar-wrap">
                    <div className="profile-hero-avatar">
                        {profile?.avatarUrl || formData.avatarUrl ? <img src={formData.avatarUrl || profile.avatarUrl} alt={profile?.fullName || 'Avatar'} /> : <span>{(profile?.fullName || 'U').charAt(0)}</span>}
                    </div>
                    {editMode && (
                        <button type="button" className="profile-avatar-edit-btn" onClick={handleAvatarSelect} aria-label="Chọn ảnh đại diện">
                            <FiCamera size={16} />
                        </button>
                    )}
                    <input ref={avatarInputRef} type="file" accept="image/*" className="profile-avatar-input" onChange={handleAvatarFileChange} />
                </div>
                <div className="profile-hero-content">
                    <h1 className="profile-title">Cài đặt tài khoản</h1>
                    <p className="profile-subtitle">Nơi gìn giữ và quản lý thông tin tâm linh của bạn.</p>
                    <div className="profile-hero-meta">
                        <span className="profile-badge">{formatValue(profile?.roleName)}</span>
                        <span className={`profile-badge ${profile?.isVerified ? 'profile-badge-success' : 'profile-badge-warning'}`}>
                            {profile?.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                        </span>
                    </div>
                </div>
            </div>

            {activeTab === 'profile' && (
                <section className="profile-block profile-section">
                    <div className="profile-section-header">
                        <div className="profile-section-title-wrap">
                            <FiUser size={22} strokeWidth={2} className="profile-section-icon" />
                            <h2 className="profile-section-title">Hồ sơ cá nhân</h2>
                        </div>
                        <button type="button" className="profile-edit-link" onClick={() => setEditMode(!editMode)} disabled={loading || !!error || !profile}>
                            Chỉnh sửa tất cả
                        </button>
                    </div>
                    <div className="profile-section-divider" aria-hidden="true" />
                    {loading ? (
                        <p>Đang tải hồ sơ...</p>
                    ) : error ? (
                        <div className="profile-error">
                            <p>{error}</p>
                            <button type="button" className="btn btn-outline" onClick={() => window.location.reload()}>Thử lại</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="profile-form">
                            <div className="profile-form-grid">
                                <div className="profile-field"><label>HỌ VÀ TÊN</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} /></div>
                                <div className="profile-field"><label>AVATAR URL</label><input type="url" name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} placeholder="https://..." /></div>
                                <div className="profile-field">
                                    <label>GIỚI TÍNH</label>
                                    {editMode ? (
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="profile-select">
                                            <option value="">Chưa cập nhật</option>
                                            <option value="MALE">Nam</option>
                                            <option value="FEMALE">Nữ</option>
                                            <option value="OTHER">Khác</option>
                                        </select>
                                    ) : (
                                        <input type="text" value={genderLabel(formData.gender)} readOnly className="readonly" />
                                    )}
                                </div>
                                <div className="profile-field"><label>NGÀY SINH</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} /></div>
                                <div className="profile-field"><label>SỐ ĐIỆN THOẠI</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} /></div>
                                <div className="profile-field"><label>EMAIL</label><input type="email" name="email" value={formData.email} readOnly disabled className="readonly" /></div>
                                <div className="profile-field"><label>TÊN THÁNH</label><input type="text" name="saintName" value={formData.saintName} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} /></div>
                                <div className="profile-field profile-field-full"><label>TIỂU SỬ</label><textarea name="bio" value={formData.bio} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} rows="4" placeholder="Giới thiệu ngắn về bản thân" /></div>
                                <div className="profile-field"><label>ĐỊA CHỈ GIAO HÀNG MẶC ĐỊNH</label><input type="text" name="address" value={formData.address} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} /></div>
                                <div className="profile-field"><label>THÀNH PHỐ/TỈNH</label><input type="text" name="city" value={formData.city} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} /></div>
                                <div className="profile-field"><label>QUẬN/HUYỆN</label><input type="text" name="district" value={formData.district} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} /></div>
                                <div className="profile-field"><label>PHƯỜNG/XÃ</label><input type="text" name="ward" value={formData.ward} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} /></div>
                                <div className="profile-field"><label>MÃ BƯU CHÍNH</label><input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} /></div>
                                <div className="profile-field"><label>NGÔN NGỮ</label><input type="text" name="language" value={formData.language} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} /></div>
                                <div className="profile-field"><label>MÚI GIỜ</label><input type="text" name="timezone" value={formData.timezone} onChange={handleChange} readOnly={!editMode} className={!editMode ? 'readonly' : ''} /></div>
                            </div>
                            {editMode && (
                                <div className="profile-form-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => { setFormData(initialFormData); setEditMode(false); }}>Hủy</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                                </div>
                            )}
                        </form>
                    )}
                </section>
            )}

            {activeTab === 'security' && (
                <section className="profile-block profile-section">
                    <div className="profile-section-header"><div className="profile-section-title-wrap"><FiShield size={22} strokeWidth={2} className="profile-section-icon" /><h2 className="profile-section-title">Bảo mật</h2></div></div>
                    <div className="profile-section-divider" aria-hidden="true" />
                    <div className="profile-security">
                        <div className="profile-security-item"><div><h3 className="profile-security-item-title">Đổi mật khẩu</h3><p className="profile-security-label">Cập nhật mật khẩu để bảo vệ tài khoản</p></div><button type="button" className="btn btn-primary btn-sm">Thay đổi</button></div>
                        <div className="profile-section-divider" aria-hidden="true" />
                        <div className="profile-security-item"><div><h3 className="profile-security-item-title">Xác thực 2 lớp (2FA)</h3><p className="profile-security-label">Thêm một lớp bảo mật qua SMS/App</p><span className="profile-2fa-status">Đang bật</span></div><button type="button" className={`profile-toggle ${twoFA ? 'on' : ''}`} onClick={() => setTwoFA(!twoFA)} role="switch" aria-checked={twoFA}><span className="profile-toggle-thumb" /></button></div>
                    </div>
                </section>
            )}

            {activeTab === 'notifications' && (
                <section className="profile-block profile-section">
                    <div className="profile-section-header"><div className="profile-section-title-wrap"><FiBell size={22} strokeWidth={2} className="profile-section-icon" /><h2 className="profile-section-title">Thông báo</h2></div></div>
                    <div className="profile-section-divider" aria-hidden="true" />
                    <div className="profile-notifications">
                        <div className="profile-notif-card"><FiMail size={20} strokeWidth={2} className="profile-notif-icon" /><span className="profile-notif-label">Thông báo qua Email</span><button type="button" className={`profile-toggle profile-toggle-notif ${notifEmail ? 'on' : ''}`} onClick={() => setNotifEmail(!notifEmail)} role="switch" aria-checked={notifEmail}><span className="profile-toggle-thumb" /></button></div>
                        <div className="profile-notif-card"><FiMessageCircle size={20} strokeWidth={2} className="profile-notif-icon" /><span className="profile-notif-label">Thông báo qua SMS</span><button type="button" className={`profile-toggle profile-toggle-notif ${notifSMS ? 'on' : ''}`} onClick={() => setNotifSMS(!notifSMS)} role="switch" aria-checked={notifSMS}><span className="profile-toggle-thumb" /></button></div>
                        <div className="profile-notif-card"><FiShoppingBag size={20} strokeWidth={2} className="profile-notif-icon" /><span className="profile-notif-label">Khuyến mãi & Sản phẩm mới</span><button type="button" className={`profile-toggle profile-toggle-notif ${notifPromo ? 'on' : ''}`} onClick={() => setNotifPromo(!notifPromo)} role="switch" aria-checked={notifPromo}><span className="profile-toggle-thumb" /></button></div>
                    </div>
                </section>
            )}

            <section className="profile-block profile-section profile-delete">
                <div className="profile-delete-content">
                    <div className="profile-delete-text">
                        <h2 className="profile-delete-title">Xóa tài khoản</h2>
                        <p className="profile-delete-desc">Sau khi xóa, mọi dữ liệu đơn hàng và thông tin cá nhân sẽ không thể khôi phục.</p>
                    </div>
                    <button type="button" className="btn profile-delete-btn">Yêu cầu xóa tài khoản</button>
                </div>
            </section>

            {activeTab !== 'profile' && activeTab !== 'security' && activeTab !== 'notifications' && activeTab !== 'payment' && (
                <section className="profile-block profile-section">
                    <p>Tab không hợp lệ.</p>
                    <button type="button" className="btn btn-outline" onClick={() => setTab('profile')}>Về hồ sơ</button>
                </section>
            )}
        </div>
    );
};

export default ProfilePage;
