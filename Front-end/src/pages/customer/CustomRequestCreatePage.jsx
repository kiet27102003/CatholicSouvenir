import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appToast } from '../../lib/appToast';
import { createCustomRequestV2, uploadReferenceImage } from '../../services/customRequestService';
import './CustomRequestCreatePage.css';

const MIN_DESCRIPTION_LENGTH = 50;

const CustomRequestCreatePage = () => {
    const navigate = useNavigate();

    const [description, setDescription] = useState('');
    const [minBudget, setMinBudget] = useState('');
    const [maxBudget, setMaxBudget] = useState('');
    const [generateAiImage, setGenerateAiImage] = useState(true);
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const descriptionCount = description.length;

    const isFormValid = useMemo(() => {
        const min = Number(minBudget);
        const max = Number(maxBudget);
        return (
            description.trim().length >= MIN_DESCRIPTION_LENGTH
            && Number.isFinite(min)
            && Number.isFinite(max)
            && min > 0
            && max > min
        );
    }, [description, minBudget, maxBudget]);

    const handleFiles = (event) => {
        const selected = Array.from(event.target.files || []);
        setFiles(selected);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isFormValid || submitting) {
            appToast.warning('Dữ liệu chưa hợp lệ', 'Vui lòng kiểm tra mô tả và khoảng ngân sách');
            return;
        }

        setSubmitting(true);

        let uploadedUrls = [];
        if (files.length > 0) {
            setUploading(true);
            const uploadResults = await Promise.all(files.map((file) => uploadReferenceImage(file)));
            setUploading(false);

            const failed = uploadResults.find((item) => !item.success);
            if (failed) {
                setSubmitting(false);
                appToast.error('Upload ảnh thất bại', failed.error || 'Vui lòng thử lại');
                return;
            }

            uploadedUrls = uploadResults.map((item) => item.data).filter(Boolean);
        }

        const payload = {
            description: description.trim(),
            minBudget: Number(minBudget),
            maxBudget: Number(maxBudget),
            referenceImages: uploadedUrls,
            generateAiImage,
        };

        const res = await createCustomRequestV2(payload);
        setSubmitting(false);

        if (!res.success) {
            appToast.error('Tạo yêu cầu thất bại', res.error || 'Vui lòng thử lại');
            return;
        }

        appToast.success('Tạo yêu cầu thành công');

        const requestId = res.data?.requestId ?? res.data?.id ?? res.data?.customRequestId;
        if (!requestId) {
            navigate('/custom-requests');
            return;
        }

        if (generateAiImage) {
            appToast.info('Đang tạo ảnh AI...', 'Bạn có thể thấy ảnh sau ít giây ở trang chi tiết');
        }

        navigate(`/custom-requests/${requestId}`);
    };

    return (
        <div className="custom-request-create-page">
            <header className="custom-request-create-header">
                <h1>Tạo yêu cầu mới</h1>
            </header>

            <form className="custom-request-create-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="description">
                        Mô tả chi tiết <span className="required">*</span>
                    </label>
                    <textarea
                        id="description"
                        className="form-input form-textarea"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={7}
                        placeholder="Mô tả càng chi tiết càng giúp nghệ nhân và AI hiểu đúng ý tưởng của bạn"
                    />
                    <div className="custom-request-create-counter">
                        {descriptionCount}/{MIN_DESCRIPTION_LENGTH} ký tự tối thiểu
                    </div>
                </div>

                <div className="custom-request-create-budget-row">
                    <div className="form-group">
                        <label className="form-label" htmlFor="minBudget">
                            Ngân sách tối thiểu <span className="required">*</span>
                        </label>
                        <input
                            id="minBudget"
                            type="number"
                            className="form-input"
                            value={minBudget}
                            min="1"
                            onChange={(event) => setMinBudget(event.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="maxBudget">
                            Ngân sách tối đa <span className="required">*</span>
                        </label>
                        <input
                            id="maxBudget"
                            type="number"
                            className="form-input"
                            value={maxBudget}
                            min="1"
                            onChange={(event) => setMaxBudget(event.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="referenceImages">Ảnh tham khảo (tuỳ chọn)</label>
                    <input
                        id="referenceImages"
                        type="file"
                        className="form-input"
                        multiple
                        accept="image/*"
                        onChange={handleFiles}
                    />
                    {!!files.length && (
                        <p className="custom-request-create-file-count">Đã chọn {files.length} ảnh</p>
                    )}
                </div>

                <div className="form-group custom-request-create-toggle-row">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={generateAiImage}
                            onChange={(event) => setGenerateAiImage(event.target.checked)}
                        />
                        <span>Tạo ảnh AI gợi ý</span>
                    </label>
                </div>

                {generateAiImage && (
                    <div className="custom-request-create-ai-info">
                        AI sẽ tạo ảnh gợi ý dựa trên mô tả.
                        Bạn có thể xem và tạo lại trước khi publish.
                    </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={submitting || uploading}>
                    {uploading ? 'Đang upload ảnh...' : submitting ? 'Đang tạo yêu cầu...' : 'Tạo yêu cầu'}
                </button>
            </form>
        </div>
    );
};

export default CustomRequestCreatePage;
