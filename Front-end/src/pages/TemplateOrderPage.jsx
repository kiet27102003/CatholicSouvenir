import React, { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiCheck, FiCopy, FiLoader, FiShoppingBag, FiStar, FiX } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import templateService from '../services/templateService';
import { recommendScripture } from '../services/aiService';
import { useCart } from '../context/CartContext';
import { appToast } from '../lib/appToast';
import './TemplateOrderPage.css';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

const buildZoneState = (zones = []) =>
    zones.reduce((acc, zone) => {
        const zoneId = String(zone.zoneId || zone.id || zone.uuid || zone.zoneName || '').trim();
        if (!zoneId) return acc;
        acc[zoneId] = '';
        return acc;
    }, {});

const TemplateOrderPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const templateId = searchParams.get('templateId') || searchParams.get('id') || '';
    const { addToCart } = useCart();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [template, setTemplate] = useState(null);
    const [zoneValues, setZoneValues] = useState({});
    const [selectedImage, setSelectedImage] = useState('');
    const [aiOpen, setAiOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiForm, setAiForm] = useState({ purpose: '', theme: '', language: 'vi', maxResults: 5 });
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [aiMessage, setAiMessage] = useState('');

    const textZones = useMemo(() => (template?.zones || []).filter((zone) => String(zone.inputType || 'TEXT').toUpperCase() === 'TEXT'), [template]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [templateId]);

    useEffect(() => {
        let cancelled = false;

        const loadTemplate = async () => {
            if (!templateId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            const result = await templateService.getTemplateById(templateId);
            if (cancelled) return;

            if (!result.success) {
                appToast.error('Không tải được template', result.error || 'Vui lòng thử lại');
                setTemplate(null);
                setLoading(false);
                return;
            }

            const data = result.data || {};
            const zones = Array.isArray(data.customZones)
                ? data.customZones
                : Array.isArray(data.zones)
                    ? data.zones
                    : [];
            const normalizedZones = zones
                .map((zone) => ({
                    zoneId: zone?.zoneId || zone?.id || zone?.uuid || zone?.zoneName || '',
                    zoneName: zone?.zoneName || zone?.name || '',
                    zoneDescription: zone?.zoneDescription || zone?.description || '',
                    inputType: zone?.inputType || 'TEXT',
                    extraPrice: Number(zone?.extraPrice ?? 0),
                    isRequired: Boolean(zone?.isRequired),
                    sortOrder: Number(zone?.sortOrder ?? 0),
                    inputConstraints: zone?.inputConstraints || {},
                }))
                .sort((a, b) => a.sortOrder - b.sortOrder);

            const next = {
                templateId: data.templateId || data.id || templateId,
                name: data.name || 'Template',
                description: data.description || '',
                basePrice: Number(data.basePrice ?? 0),
                artisanName: data.artisanName || '',
                categoryName: data.categoryName || data.category?.name || '',
                material: data.material || '',
                style: data.style || '',
                basePromptHint: data.basePromptHint || '',
                baseImages: Array.isArray(data.baseImages) ? data.baseImages.filter(Boolean) : [],
                zones: normalizedZones,
            };

            setTemplate(next);
            setZoneValues(buildZoneState(normalizedZones));
            setSelectedImage(next.baseImages[0] || '');
            setLoading(false);
        };

        loadTemplate();
        return () => { cancelled = true; };
    }, [templateId]);

    const openAiModal = (zone = null) => {
        setAiForm((prev) => ({
            ...prev,
            purpose: prev.purpose || (zone?.zoneName || template?.name || ''),
            theme: prev.theme || (zone?.zoneDescription || template?.style || template?.categoryName || ''),
        }));
        setAiMessage('');
        setAiOpen(true);
    };

    const handleOpenZoneAi = (zone) => {
        openAiModal(zone);
    };

    const handleAiRecommend = async () => {
        if (!template) return;
        setAiLoading(true);
        setAiMessage('');
        try {
            const result = await recommendScripture({
                purpose: aiForm.purpose || textZones[0]?.zoneName || template.name,
                productName: template.name,
                theme: aiForm.theme || template.style || template.categoryName || '',
                language: aiForm.language || 'vi',
                maxResults: Number(aiForm.maxResults || 5),
            });

            if (!result.success) {
                setAiRecommendations([]);
                setAiMessage(result.error || 'Không lấy được gợi ý AI.');
                return;
            }

            const payload = result.data || {};
            const recommendations = Array.isArray(payload.recommendations) ? payload.recommendations : [];
            setAiRecommendations(recommendations);
            setAiMessage(payload.message || (recommendations.length ? 'Đã tạo gợi ý AI.' : 'Chưa có gợi ý phù hợp.'));
        } finally {
            setAiLoading(false);
        }
    };

    const handleCopyRecommendation = async (rec) => {
        const text = [
            rec?.verse ? `${rec.verse}` : '',
            rec?.text ? `${rec.text}` : '',
            rec?.translation ? `(${rec.translation})` : '',
            rec?.reason ? `Lý do: ${rec.reason}` : '',
            rec?.occasion ? `Hoàn cảnh: ${rec.occasion}` : '',
        ].filter(Boolean).join('\n');

        try {
            await navigator.clipboard.writeText(text);
            appToast.success('Đã copy gợi ý');
        } catch {
            appToast.error('Không thể copy', 'Trình duyệt đã chặn thao tác sao chép.');
        }
    };

    const extraPriceTotal = useMemo(() => {
        return (template?.zones || []).reduce((sum, zone) => {
            const value = String(zoneValues[zone.zoneId] || '').trim();
            if (!value) return sum;
            return sum + Number(zone.extraPrice || 0);
        }, 0);
    }, [template?.zones, zoneValues]);

    const totalPrice = Number(template?.basePrice || 0) + extraPriceTotal;

    const handleAddToCart = async () => {
        if (!template) return;

        const missingRequired = (template.zones || []).find((zone) => zone.isRequired && !String(zoneValues[zone.zoneId] || '').trim());
        if (missingRequired) {
            appToast.warning('Thiếu thông tin', `Vui lòng nhập ${missingRequired.zoneName}`);
            return;
        }

        setSubmitting(true);
        try {
            const zoneInputs = (template.zones || []).map((zone) => ({
                label: zone.zoneName,
                key: zone.zoneId,
                zoneName: zone.zoneName,
                value: String(zoneValues[zone.zoneId] || '').trim(),
                amount: Number(zone.extraPrice || 0),
            }));

            addToCart({
                id: template.templateId,
                title: template.name,
                price: totalPrice,
                basePrice: template.basePrice,
                finalUnitPrice: totalPrice,
                image: selectedImage || template.baseImages[0] || '',
                artisan: template.artisanName,
                templateId: template.templateId,
                customRequests: zoneValues,
                zonePriceBreakdown: zoneInputs,
            }, 1);

            appToast.success('Đã thêm template vào giỏ hàng');
            navigate('/cart');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="template-order-page">
                <Header />
                <main className="template-order-main container">
                    <div className="template-order-loading">Đang tải template...</div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!template) {
        return (
            <div className="template-order-page">
                <Header />
                <main className="template-order-main container">
                    <div className="template-order-empty">
                        <h2>Không tìm thấy template</h2>
                        <button className="btn btn-primary" onClick={() => navigate('/shop')}>Quay lại cửa hàng</button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="template-order-page">
            <Header />
            <main className="template-order-main container">
                <button className="template-order-back" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Quay lại
                </button>

                <div className="template-order-hero">
                    <div className="template-order-preview-card">
                        <div className="template-order-preview-main">
                            {selectedImage ? (
                                <img src={selectedImage} alt={template.name} className="template-order-preview-image" />
                            ) : (
                                <div className="template-order-preview-placeholder">No preview</div>
                            )}
                        </div>

                        <div className="template-order-thumb-row">
                            {(template.baseImages || []).length > 0 ? template.baseImages.map((img, idx) => (
                                <button
                                    key={`${img}-${idx}`}
                                    type="button"
                                    className={`template-order-thumb ${selectedImage === img ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <img src={img} alt={`${template.name}-${idx + 1}`} />
                                </button>
                            )) : null}
                        </div>
                    </div>

                    <aside className="template-order-summary-card">
                        <div className="template-order-badge"><FiStar /> Template order</div>
                        <h1>{template.name}</h1>
                        <p className="template-order-subtitle">Điền thông tin vào các zone được định sẵn rồi checkout như đơn hàng bình thường.</p>

                        <div className="template-order-meta">
                            <div><span>Danh mục</span><strong>{template.categoryName || '—'}</strong></div>
                            <div><span>Nghệ nhân</span><strong>{template.artisanName || '—'}</strong></div>
                            <div><span>Chất liệu</span><strong>{template.material || '—'}</strong></div>
                            <div><span>Phong cách</span><strong>{template.style || '—'}</strong></div>
                        </div>

                        <div className="template-order-pricing">
                            <div><span>Giá gốc</span><strong>{formatCurrency(template.basePrice)}</strong></div>
                            <div><span>Phụ phí customization</span><strong>{formatCurrency(extraPriceTotal)}</strong></div>
                            <div className="total"><span>Tạm tính</span><strong>{formatCurrency(totalPrice)}</strong></div>
                        </div>

                        <div className="template-order-actions">
                            <button type="button" className="btn btn-secondary btn-large template-order-ai-btn" onClick={openAiModal} disabled={!textZones.length}>
                                <FiStar /> Gợi ý bằng AI
                            </button>
                            <button type="button" className="btn btn-primary btn-large" onClick={handleAddToCart} disabled={submitting}>
                                <FiShoppingBag /> {submitting ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
                            </button>
                        </div>
                    </aside>
                </div>

                <section className="template-order-content-grid">
                    <div className="template-order-form-card">
                        <div className="section-heading">
                            <h2>Customization data</h2>
                            <p>Nhập các thông tin cho từng zone được template cho phép.</p>
                        </div>

                        <div className="template-order-zones">
                            {(template.zones || []).map((zone) => {
                                const isTextZone = String(zone.inputType || 'TEXT').toUpperCase() === 'TEXT';
                                return (
                                    <label key={zone.zoneId} className="template-order-zone-field">
                                        <div className="zone-head">
                                            <span className="zone-name">{zone.zoneName}{zone.isRequired ? ' *' : ''}</span>
                                            <span className="zone-extra">+ {formatCurrency(zone.extraPrice)}</span>
                                        </div>
                                        <span className="zone-description">{zone.zoneDescription || 'Nhập thông tin theo yêu cầu của template.'}</span>
                                        {zone.inputType === 'COLOR' ? (
                                            <input
                                                type="color"
                                                value={zoneValues[zone.zoneId] || '#1B4332'}
                                                onChange={(e) => setZoneValues((prev) => ({ ...prev, [zone.zoneId]: e.target.value }))}
                                            />
                                        ) : zone.inputType === 'NUMBER' ? (
                                            <div className="template-order-zone-input-row">
                                                <input
                                                    type="number"
                                                    className="template-order-zone-input"
                                                    value={zoneValues[zone.zoneId]}
                                                    onChange={(e) => setZoneValues((prev) => ({ ...prev, [zone.zoneId]: e.target.value }))}
                                                />
                                            </div>
                                        ) : zone.inputType === 'IMAGE' ? (
                                            <div className="template-order-zone-input-row">
                                                <input
                                                    type="url"
                                                    className="template-order-zone-input"
                                                    placeholder="Dán URL ảnh..."
                                                    value={zoneValues[zone.zoneId]}
                                                    onChange={(e) => setZoneValues((prev) => ({ ...prev, [zone.zoneId]: e.target.value }))}
                                                />
                                            </div>
                                        ) : (
                                            <div className="template-order-zone-input-row">
                                                <input
                                                    type="text"
                                                    className="template-order-zone-input"
                                                    placeholder="Nhập dữ liệu..."
                                                    value={zoneValues[zone.zoneId]}
                                                    onChange={(e) => setZoneValues((prev) => ({ ...prev, [zone.zoneId]: e.target.value }))}
                                                />
                                                {isTextZone ? (
                                                    <button type="button" className="template-order-zone-ai-btn" onClick={() => handleOpenZoneAi(zone)}>
                                                        <FiStar /> AI
                                                    </button>
                                                ) : null}
                                            </div>
                                        )}
                                    </label>
                                );
                            })}
                        </div>

                        <div className="template-order-note">
                            <FiCheck /> Dữ liệu này sẽ được lưu cùng đơn hàng khi bạn checkout.
                        </div>
                    </div>
                </section>
            </main>

            {aiOpen ? (
                <div className="template-order-ai-modal-overlay" onClick={() => setAiOpen(false)}>
                    <div className="template-order-ai-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="template-order-ai-modal-header">
                            <div>
                                <div className="template-order-ai-modal-badge"><FiStar /> Gợi ý bằng AI</div>
                                <h3>Nhận các câu Kinh Thánh phù hợp</h3>
                                <p>Nhập mục đích, chủ đề và ngôn ngữ để AI gợi ý nội dung cho zone TEXT.</p>
                            </div>
                            <button type="button" className="template-order-ai-close" onClick={() => setAiOpen(false)}><FiX /></button>
                        </div>

                        <div className="template-order-ai-form">
                            <label>
                                <span>Mục đích</span>
                                <input value={aiForm.purpose} onChange={(e) => setAiForm((prev) => ({ ...prev, purpose: e.target.value }))} placeholder="Ví dụ: lời chúc phúc, trang trí bàn thờ..." />
                            </label>
                            <label>
                                <span>Chủ đề</span>
                                <input value={aiForm.theme} onChange={(e) => setAiForm((prev) => ({ ...prev, theme: e.target.value }))} placeholder="Ví dụ: tình yêu, hy vọng, bình an..." />
                            </label>
                            <div className="template-order-ai-grid">
                                <label>
                                    <span>Ngôn ngữ</span>
                                    <select value={aiForm.language} onChange={(e) => setAiForm((prev) => ({ ...prev, language: e.target.value }))}>
                                        <option value="vi">Tiếng Việt</option>
                                        <option value="en">English</option>
                                        <option value="la">Latin</option>
                                    </select>
                                </label>
                                <label>
                                    <span>Số kết quả</span>
                                    <input type="number" min="1" max="10" value={aiForm.maxResults} onChange={(e) => setAiForm((prev) => ({ ...prev, maxResults: e.target.value }))} />
                                </label>
                            </div>
                            <button type="button" className="btn btn-primary template-order-ai-submit" onClick={handleAiRecommend} disabled={aiLoading}>
                                {aiLoading ? <FiLoader className="spin" /> : <FiStar />} {aiLoading ? 'Đang gợi ý...' : 'Tạo gợi ý'}
                            </button>
                            {aiMessage ? <div className="template-order-ai-message">{aiMessage}</div> : null}
                        </div>

                        <div className="template-order-ai-results">
                            {aiRecommendations.length > 0 ? aiRecommendations.map((rec, idx) => (
                                <article key={`${rec?.verse || 'rec'}-${idx}`} className="template-order-ai-result">
                                    <div className="template-order-ai-result-head">
                                        <strong>{rec?.verse || '—'}</strong>
                                        <button type="button" className="template-order-ai-copy" onClick={() => handleCopyRecommendation(rec)}><FiCopy /> Copy</button>
                                    </div>
                                    <p className="template-order-ai-verse">{rec?.text || '—'}</p>
                                    {rec?.translation ? <p className="template-order-ai-translation">{rec.translation}</p> : null}
                                    <div className="template-order-ai-meta">
                                        {rec?.reason ? <span><strong>Lý do:</strong> {rec.reason}</span> : null}
                                        {rec?.occasion ? <span><strong>Hoàn cảnh:</strong> {rec.occasion}</span> : null}
                                    </div>
                                </article>
                            )) : <div className="template-order-ai-empty">Chưa có gợi ý nào. Hãy bấm “Tạo gợi ý”.</div>}
                        </div>
                    </div>
                </div>
            ) : null}

            <Footer />
        </div>
    );
};

export default TemplateOrderPage;
