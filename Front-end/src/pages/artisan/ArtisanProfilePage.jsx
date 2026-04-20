import React, { useEffect, useMemo, useState } from 'react';
import { FiAward, FiBookOpen, FiEdit2, FiMail, FiMapPin, FiPhone, FiSave, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import { getMyArtisanProfile, updateMyArtisanProfile } from '../../services/artisanService';
import './ArtisanProfilePage.css';

const formatValue = (value, fallback = '—') => {
    const text = String(value ?? '').trim();
    return text || fallback;
};

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'AR';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const emptyForm = {
    artisanName: '',
    bio: '',
    experienceYears: '',
    portfolioUrl: '',
    specialization: '',
};

const ArtisanProfilePage = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadProfile = async () => {
        setLoading(true);
        setError('');
        const res = await getMyArtisanProfile();
        if (!res.success) {
            setError(res.error || 'Không thể tải hồ sơ nghệ nhân.');
            setProfile(null);
            setForm(emptyForm);
        } else {
            const data = res.data || {};
            setProfile(data);
            setForm({
                artisanName: data?.artisanName || '',
                bio: data?.bio || '',
                experienceYears: data?.experienceYears ?? '',
                portfolioUrl: data?.portfolioUrl || '',
                specialization: data?.specialization || '',
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        loadProfile();
        window.scrollTo(0, 0);
    }, []);

    const displayName = useMemo(() => formatValue(profile?.artisanName || profile?.name || profile?.fullName, 'Nghệ nhân'), [profile]);
    const avatarUrl = profile?.avatarUrl || profile?.profileImageUrl || '';

    const highlights = useMemo(() => ([
        { label: 'Chuyên môn', value: formatValue(profile?.specialization) },
        { label: 'Kinh nghiệm', value: profile?.experienceYears !== undefined && profile?.experienceYears !== null && profile?.experienceYears !== '' ? `${profile.experienceYears} năm` : '—' },
        { label: 'Trạng thái', value: formatValue(profile?.status || profile?.accountStatus) },
    ]), [profile]);

    const infoRows = useMemo(() => ([
        { icon: <FiUser />, label: 'Tên hiển thị', value: displayName },
        { icon: <FiMail />, label: 'Email', value: formatValue(profile?.email) },
        { icon: <FiPhone />, label: 'Số điện thoại', value: formatValue(profile?.phone || profile?.phoneNumber) },
        { icon: <FiMapPin />, label: 'Địa chỉ', value: formatValue(profile?.address) },
        { icon: <FiBookOpen />, label: 'Giới thiệu', value: formatValue(profile?.bio) },
        { icon: <FiAward />, label: 'Tham gia từ', value: formatDate(profile?.createdAt || profile?.joinedAt) },
    ]), [displayName, profile]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);
        const res = await updateMyArtisanProfile(form);
        setSaving(false);
        if (!res.success) {
            appToast.error('Cập nhật thất bại', res.error || 'Vui lòng thử lại sau');
            return;
        }
        appToast.success('Đã cập nhật hồ sơ', 'Thông tin nghệ nhân đã được lưu');
        setEditing(false);
        await loadProfile();
    };

    return (
        <div className="artisan-profile-page">
            <main className="artisan-profile-main artisan-profile-main--full">
                <div className="artisan-profile-shell artisan-profile-shell--wide">
                    <section className="artisan-profile-hero">
                        <div className="artisan-profile-hero-left">
                            <div className="artisan-avatar-wrap">
                                {avatarUrl ? <img src={avatarUrl} alt={displayName} /> : <span>{getInitials(displayName)}</span>}
                            </div>
                            <div className="artisan-profile-hero-copy">
                                <p className="artisan-eyebrow">Hồ sơ cá nhân nghệ nhân</p>
                                <h1 title={displayName}>{displayName}</h1>
                                <p className="artisan-subtitle" title={profile?.specialization || ''}>
                                    {formatValue(profile?.specialization, 'Chưa có chuyên môn')}
                                </p>
                                <div className="artisan-hero-tags">
                                    {highlights.map((item) => (
                                        <span key={item.label} className="artisan-tag" title={item.value}>
                                            <strong>{item.label}:</strong> {item.value}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="artisan-profile-card">
                        <div className="artisan-section-header">
                            <div>
                                <p className="artisan-section-kicker">Thông tin hồ sơ</p>
                                <h2>Chi tiết tài khoản</h2>
                            </div>
                            <div className="artisan-section-actions">
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing((prev) => !prev)} disabled={loading || !!error}>
                                    <FiEdit2 size={14} />
                                    {editing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa'}
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="artisan-loading-state">Đang tải hồ sơ...</div>
                        ) : error ? (
                            <div className="artisan-error-state">
                                <p>{error}</p>
                                <button type="button" className="btn btn-outline" onClick={loadProfile}>Thử lại</button>
                            </div>
                        ) : editing ? (
                            <form className="artisan-edit-form" onSubmit={handleSave}>
                                <div className="artisan-edit-grid">
                                    <label>
                                        <span>Tên nghệ nhân</span>
                                        <input name="artisanName" value={form.artisanName} onChange={handleChange} placeholder="Nhập tên nghệ nhân" />
                                    </label>
                                    <label>
                                        <span>Chuyên môn</span>
                                        <input name="specialization" value={form.specialization} onChange={handleChange} placeholder="Nhập chuyên môn" />
                                    </label>
                                    <label>
                                        <span>Kinh nghiệm (năm)</span>
                                        <input name="experienceYears" type="number" min="0" value={form.experienceYears} onChange={handleChange} placeholder="0" />
                                    </label>
                                    <label>
                                        <span>Portfolio URL</span>
                                        <input name="portfolioUrl" value={form.portfolioUrl} onChange={handleChange} placeholder="https://..." />
                                    </label>
                                    <label className="artisan-edit-full">
                                        <span>Giới thiệu</span>
                                        <textarea name="bio" rows="5" value={form.bio} onChange={handleChange} placeholder="Mô tả ngắn về nghệ nhân" />
                                    </label>
                                </div>
                                <div className="artisan-edit-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => { setEditing(false); setForm({ artisanName: profile?.artisanName || '', bio: profile?.bio || '', experienceYears: profile?.experienceYears ?? '', portfolioUrl: profile?.portfolioUrl || '', specialization: profile?.specialization || '' }); }} disabled={saving}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        <FiSave size={14} />
                                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="artisan-info-grid">
                                {infoRows.map((row) => (
                                    <article key={row.label} className="artisan-info-item">
                                        <span className="artisan-info-icon">{row.icon}</span>
                                        <div>
                                            <p>{row.label}</p>
                                            <strong title={row.value}>{row.value}</strong>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="artisan-profile-card artisan-profile-card--bio">
                        <div className="artisan-section-header">
                            <div>
                                <p className="artisan-section-kicker">Giới thiệu</p>
                                <h2>Câu chuyện nghệ nhân</h2>
                            </div>
                        </div>
                        <p className="artisan-bio-text" title={profile?.bio || ''}>
                            {formatValue(profile?.bio, 'Chưa có mô tả cho hồ sơ nghệ nhân.')}
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ArtisanProfilePage;
