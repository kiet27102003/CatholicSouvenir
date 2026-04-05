import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getArtisans } from '../../services/artisanService';
import { createCustomRequest } from '../../services/orderService';
import { appToast } from '../../lib/appToast';
import './CustomRequestPage.css';

const CustomRequestPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    useAuth();

    const prefilledArtisanId = location.state?.artisanId || '';
    const prefilledArtisanName = location.state?.artisanName || '';

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        referenceImageUrl: '',
        generateAiImage: true,
        selectedArtisanIds: prefilledArtisanId ? [prefilledArtisanId] : []
    });
    const [artisans, setArtisans] = useState([]);
    const [artisansLoading, setArtisansLoading] = useState(true);
    const [artisanListOpen, setArtisanListOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getArtisans(0, 100).then((result) => {
            if (cancelled) return;
            setArtisansLoading(false);
            if (result.success && result.data?.content) {
                setArtisans(result.data.content);
            } else {
                setArtisans([]);
                if (result.error) {
                    const msg = typeof result.error === 'string' ? result.error : 'Kiểm tra kết nối mạng';
                    appToast.error('Không tải được', msg);
                }
            }
        });
        return () => { cancelled = true; };
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const toggleArtisan = (artisanId) => {
        setFormData(prev => {
            const ids = prev.selectedArtisanIds.includes(artisanId)
                ? prev.selectedArtisanIds.filter(id => id !== artisanId)
                : [...prev.selectedArtisanIds, artisanId];
            return { ...prev, selectedArtisanIds: ids };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const result = await createCustomRequest({
            title: formData.title.trim(),
            description: formData.description.trim(),
            referenceImageUrl: formData.referenceImageUrl.trim() || undefined,
            generateAiImage: formData.generateAiImage,
            selectedArtisanIds: formData.selectedArtisanIds
        });
        setSubmitting(false);
        if (result.success) {
            appToast.success('Tạo thành công', 'Đã gửi yêu cầu đến nghệ nhân');
            navigate('/messages');
        } else {
            const msg = result.error != null ? String(result.error) : 'Vui lòng thử lại';
            appToast.error('Có lỗi xảy ra', msg);
        }
    };

    return (
        <div className="custom-request-page">
            <div className="request-header">
                <h1 className="request-title">Yêu cầu sản phẩm theo ý</h1>
                <p className="request-subtitle">Mô tả ý tưởng của bạn, nghệ nhân của chúng tôi sẽ hiện thực hóa sản phẩm theo đức tin của bạn.</p>
            </div>

            <div className="request-form-container">
                <form className="request-form" onSubmit={handleSubmit}>

                    <div className="form-group artisan-select-group">
                        <label className="form-label">Chọn nghệ nhân</label>
                        <button
                            type="button"
                            className="artisan-list-trigger"
                            onClick={() => setArtisanListOpen(prev => !prev)}
                            disabled={artisansLoading}
                        >
                            <span className="artisan-list-trigger-text">
                                {artisansLoading
                                    ? 'Đang tải danh sách...'
                                    : artisanListOpen
                                        ? 'Thu gọn danh sách nghệ nhân'
                                        : formData.selectedArtisanIds.length > 0
                                            ? `Đã chọn ${formData.selectedArtisanIds.length} nghệ nhân — Nhấn để mở/chỉnh sửa`
                                            : 'Mở danh sách nghệ nhân để chọn'}
                            </span>
                            <span className={`artisan-list-chevron ${artisanListOpen ? 'open' : ''}`} aria-hidden>▼</span>
                        </button>
                        {artisanListOpen && !artisansLoading && artisans.length > 0 && (
                            <div className="artisan-checkbox-list">
                                {artisans.map((a) => (
                                    <label key={a.artisanId} className="artisan-checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.selectedArtisanIds.includes(a.artisanId)}
                                            onChange={() => toggleArtisan(a.artisanId)}
                                        />
                                        <span>{a.artisanName || 'Nghệ nhân'}{a.specialization ? ` — ${a.specialization}` : ''}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {artisanListOpen && !artisansLoading && artisans.length === 0 && (
                            <span className="input-hint">Chưa có nghệ nhân nào. Bạn vẫn có thể gửi yêu cầu.</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="title">Tiêu đề dự án <span className="required">*</span></label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            className="form-input"
                            placeholder="VD: Tràng hạt gỗ ô liu có khảm bạc theo yêu cầu"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="description">Mô tả chi tiết <span className="required">*</span></label>
                        <textarea
                            id="description"
                            name="description"
                            className="form-input form-textarea"
                            placeholder="Mô tả ý tưởng của bạn. Bao gồm chất liệu, kích thước, chữ khắc, hoặc ý nghĩa tôn giáo bạn muốn thể hiện."
                            rows="6"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="referenceImageUrl">URL ảnh tham khảo (tùy chọn)</label>
                        <input
                            type="url"
                            id="referenceImageUrl"
                            name="referenceImageUrl"
                            className="form-input"
                            placeholder="https://..."
                            value={formData.referenceImageUrl}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label checkbox-label">
                            <input
                                type="checkbox"
                                name="generateAiImage"
                                checked={formData.generateAiImage}
                                onChange={handleChange}
                            />
                            <span>Sinh ảnh gợi ý bằng AI từ mô tả</span>
                        </label>
                    </div>

                    <div className="form-actions">
                        <p className="notice-text">
                            Gửi form này không ràng buộc bạn mua hàng. Nghệ nhân sẽ xem xét và gửi báo giá chính thức để bạn duyệt.
                        </p>
                        <button type="submit" className="btn btn-primary btn-large" disabled={submitting}>
                            {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu báo giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomRequestPage;
