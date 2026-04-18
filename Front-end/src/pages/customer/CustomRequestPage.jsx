import React, { useState } from 'react';
import { FiClock, FiImage, FiMessageSquare, FiPackage, FiShield, FiStar, FiUsers, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import ImageUpload from '../../components/ui/ImageUpload';
import { generateConceptImage } from '../../services/aiService';
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
        aiConceptImageUrl: '',
        aiImagePrompt: '',
        minBudget: '',
        maxBudget: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const validateForm = () => {
        const title = formData.title.trim();
        const description = formData.description.trim();
        const minBudget = Number(formData.minBudget || 0);
        const maxBudget = Number(formData.maxBudget || 0);

        if (title.length < 15) {
            return 'Tiêu đề phải có ít nhất 15 ký tự.';
        }

        if (description.length < 50) {
            return 'Mô tả phải có ít nhất 50 ký tự.';
        }

        if (Number.isFinite(minBudget) && Number.isFinite(maxBudget) && minBudget > maxBudget) {
            return 'Ngân sách tối thiểu phải nhỏ hơn hoặc bằng ngân sách tối đa.';
        }

        if (!formData.aiConceptImageUrl.trim()) {
            return 'Vui lòng tạo hoặc thêm ảnh AI concept trước khi gửi.';
        }

        return '';
    };

    const handleGenerateAiImage = async () => {
        const description = formData.description.trim();
        if (description.length < 50) {
            appToast.warning('Thiếu mô tả', 'Mô tả phải có ít nhất 50 ký tự trước khi tạo ảnh AI');
            return;
        }

        setGeneratingImage(true);
        const result = await generateConceptImage({ description });
        setGeneratingImage(false);

        if (result.success) {
            const data = result.data || {};
            setFormData((prev) => ({
                ...prev,
                aiConceptImageUrl: String(data.imageUrl || '').trim(),
                aiImagePrompt: String(data.prompt || '').trim(),
            }));
            appToast.success('Tạo ảnh AI thành công', 'Ảnh concept đã được cập nhật');
            return;
        }

        appToast.error('Không tạo được ảnh AI', result.error != null ? String(result.error) : 'Vui lòng thử lại');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            appToast.warning('Vui lòng đăng nhập', 'Bạn cần đăng nhập để gửi yêu cầu đặt riêng');
            navigate('/login');
            return;
        }

        const validationError = validateForm();
        if (validationError) {
            appToast.warning('Dữ liệu chưa hợp lệ', validationError);
            return;
        }

        setSubmitting(true);
        const result = await createCustomRequest({
            title: formData.title.trim(),
            description: formData.description.trim(),
            minBudget: Number(formData.minBudget || 0),
            maxBudget: Number(formData.maxBudget || 0),
            referenceImages: formData.referenceImageUrl.trim() ? [formData.referenceImageUrl.trim()] : [],
            aiConceptImageUrl: formData.aiConceptImageUrl.trim(),
            aiImagePrompt: formData.aiImagePrompt.trim(),
        });
        setSubmitting(false);

        if (result.success) {
            setModalOpen(false);
            setFormData({
                title: '',
                description: '',
                referenceImageUrl: '',
                aiConceptImageUrl: '',
                aiImagePrompt: '',
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
                            <button type="button" className="btn btn-outline btn-large" onClick={() => navigate('/custom-requests')}>
                                Xem yêu cầu của tôi
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

                            <ImageUpload
                                value={formData.referenceImageUrl}
                                onChange={(nextValue) => setFormData((prev) => ({ ...prev, referenceImageUrl: nextValue }))}
                                label="Ảnh tham khảo"
                                helperText="Tải ảnh lên Supabase Storage hoặc dán URL ảnh sẵn có."
                                folder="custom-requests"
                            />

                            <div className="form-group">
                                <label className="form-label">Ảnh concept AI</label>
                                <div className="ai-concept-preview">
                                    {formData.aiConceptImageUrl.trim() ? (
                                        <img src={formData.aiConceptImageUrl.trim()} alt="AI concept preview" className="ai-concept-preview-img" />
                                    ) : (
                                        <div className="ai-concept-preview-empty">
                                            <FiImage />
                                            <span>Chưa có ảnh concept</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <button type="button" className="btn btn-outline btn-large" onClick={handleGenerateAiImage} disabled={generatingImage || submitting}>
                                    {generatingImage ? 'Đang tạo ảnh AI...' : 'Generate AI Image'}
                                </button>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="aiImagePrompt">Prompt AI</label>
                                <textarea
                                    id="aiImagePrompt"
                                    name="aiImagePrompt"
                                    className="form-input form-textarea"
                                    rows="4"
                                    value={formData.aiImagePrompt}
                                    onChange={handleChange}
                                    placeholder="Mô tả ảnh concept bạn muốn AI tạo..."
                                />
                            </div>

                            <div className="request-form-footer">
                                <p className="notice-text">Gửi form này không ràng buộc bạn mua hàng. Nghệ nhân sẽ gửi báo giá chính thức để bạn duyệt.</p>
                                <button type="submit" className="btn btn-primary btn-large" disabled={submitting || generatingImage}>
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
