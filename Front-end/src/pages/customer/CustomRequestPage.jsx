import React, { useState } from 'react';
import { FiClock, FiImage, FiMessageSquare, FiPackage, FiShield, FiStar, FiUsers, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import { createCustomRequestV2 as createCustomRequest } from '../../services/customRequestService';
import { appToast } from '../../lib/appToast';
import './CustomRequestPage.css';

const CustomRequestPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        referenceImageUrl: '',
        generateAiImage: true,
        minBudget: '',
        maxBudget: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            appToast.warning('Vui lòng đăng nhập', 'Bạn cần đăng nhập để gửi yêu cầu đặt riêng');
            navigate('/login');
            return;
        }

        setSubmitting(true);
        const result = await createCustomRequest({
            title: formData.title.trim(),
            description: formData.description.trim(),
            minBudget: Number(formData.minBudget || 0),
            maxBudget: Number(formData.maxBudget || 0),
            referenceImageUrl: formData.referenceImageUrl.trim() || undefined,
            generateAiImage: formData.generateAiImage,
        });
        setSubmitting(false);

        if (result.success) {
            setModalOpen(false);
            setFormData({
                title: '',
                description: '',
                referenceImageUrl: '',
                generateAiImage: true,
                minBudget: '',
                maxBudget: '',
            });
            appToast.success('Gửi yêu cầu thành công', 'Nghệ nhân sẽ xem và phản hồi sớm nhất');
            return;
        }

        appToast.error('Có lỗi xảy ra', result.error != null ? String(result.error) : 'Vui lòng thử lại');
    };

    return (
        <div className="custom-request-page">
            <Header />
            <main className="custom-request-page-main">
                <section className="custom-request-hero">
                    <div className="custom-request-hero-content">
                        <div className="custom-request-badge">Đặt hàng riêng cho khách hàng</div>
                        <h1 className="custom-request-title">Thiết kế món quà Công giáo theo ý bạn</h1>
                        <p className="custom-request-subtitle">
                            Gửi ý tưởng, chọn nghệ nhân yêu thích và nhận báo giá riêng — hoàn toàn không bị ràng buộc mua ngay.
                        </p>

                        <div className="custom-request-actions">
                            <button type="button" className="btn btn-primary btn-large" onClick={() => setModalOpen(true)}>
                                Bắt đầu đặt riêng
                            </button>
                            <button type="button" className="btn btn-outline btn-large" onClick={() => navigate('/templates')}>
                                Cá nhân hóa
                            </button>
                        </div>

                        <div className="custom-request-stats">
                            <div className="stat-card"><FiShield /><span>Riêng tư & an toàn</span></div>
                            <div className="stat-card"><FiClock /><span>Phản hồi nhanh</span></div>
                            <div className="stat-card"><FiImage /><span>Gợi ý AI trực quan</span></div>
                        </div>
                    </div>

                    <div className="custom-request-hero-card">
                        <div className="hero-card-top">
                            <FiStar />
                            <span>Quy trình 4 bước</span>
                        </div>
                        <ol className="hero-steps">
                            <li><FiMessageSquare />Tạo custom request</li>
                            <li><FiUsers />Artisan báo giá</li>
                            <li><FiImage />Chọn artisan & thanh toán theo từng stage</li>
                            <li><FiPackage />Artisan thực hiện, customer duyệt & tạo shipment</li>
                        </ol>
                    </div>
                </section>

                <section className="custom-request-content-grid">
                    <div className="custom-request-form-card">
                        <div className="section-heading">
                            <h2>Thông tin yêu cầu</h2>
                            <p>Hãy mô tả càng rõ càng tốt để nghệ nhân hiểu đúng mong muốn của bạn.</p>
                        </div>
                        <button type="button" className="btn btn-primary btn-large" onClick={() => setModalOpen(true)}>
                            Mở form đặt riêng
                        </button>
                    </div>
                </section>
            </main>

            {modalOpen && (
                <div className="custom-request-modal-overlay" onClick={() => setModalOpen(false)} role="button" tabIndex={0}>
                    <div className="custom-request-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Form đặt riêng">
                        <div className="custom-request-modal-header">
                            <div>
                                <h2>Thông tin yêu cầu</h2>
                                <p>Điền nội dung để gửi yêu cầu đặt riêng cho nghệ nhân.</p>
                            </div>
                            <button type="button" className="custom-request-modal-close" onClick={() => setModalOpen(false)} aria-label="Đóng modal">
                                <FiX />
                            </button>
                        </div>

                        <form className="custom-request-modal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="title">Tiêu đề dự án <span className="required">*</span></label>
                                <input id="title" name="title" className="form-input" value={formData.title} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="description">Mô tả chi tiết <span className="required">*</span></label>
                                <textarea id="description" name="description" className="form-input form-textarea" rows="6" value={formData.description} onChange={handleChange} required />
                            </div>

                            <div className="custom-request-budget-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="minBudget">Ngân sách tối thiểu</label>
                                    <input id="minBudget" name="minBudget" type="number" className="form-input" value={formData.minBudget} onChange={handleChange} min="0" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="maxBudget">Ngân sách tối đa</label>
                                    <input id="maxBudget" name="maxBudget" type="number" className="form-input" value={formData.maxBudget} onChange={handleChange} min="0" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="referenceImageUrl">URL ảnh tham khảo (tùy chọn)</label>
                                <input id="referenceImageUrl" name="referenceImageUrl" type="url" className="form-input" value={formData.referenceImageUrl} onChange={handleChange} placeholder="https://..." />
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input type="checkbox" name="generateAiImage" checked={formData.generateAiImage} onChange={handleChange} />
                                    <span>Sinh ảnh gợi ý bằng AI từ mô tả</span>
                                </label>
                            </div>

                            <div className="request-form-footer">
                                <p className="notice-text">Gửi form này không ràng buộc bạn mua hàng. Nghệ nhân sẽ gửi báo giá chính thức để bạn duyệt.</p>
                                <button type="submit" className="btn btn-primary btn-large" disabled={submitting}>
                                    {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu báo giá'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomRequestPage;
