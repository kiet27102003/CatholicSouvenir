import React, { useEffect, useMemo, useState } from 'react';
import { FiGrid, FiLayers, FiImage, FiStar, FiArrowRight } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import templateService from '../services/templateService';
import categoryService from '../services/categoryService';
import { appToast } from '../lib/appToast';
import './TemplateCatalogPage.css';

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/640x420?text=Template+Preview';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

const TemplateCatalogPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryCategoryId = searchParams.get('categoryId') || 'all';

    const [categories, setCategories] = useState([{ id: 'all', label: 'Tất cả', Icon: FiGrid }]);
    const [selectedCategory, setSelectedCategory] = useState(queryCategoryId);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        setSelectedCategory(queryCategoryId || 'all');
    }, [queryCategoryId]);

    useEffect(() => {
        let cancelled = false;

        const loadCategories = async () => {
            setLoadingCategories(true);
            const result = await categoryService.getCategories();
            if (cancelled) return;

            if (!result.success) {
                appToast.error('Không tải được danh mục', result.error || 'Vui lòng thử lại');
                setCategories([{ id: 'all', label: 'Tất cả', Icon: FiGrid }]);
                setLoadingCategories(false);
                return;
            }

            const normalized = (result.data || [])
                .map((item) => ({
                    id: item?.categoryId || item?.id || item?.uuid || '',
                    label: item?.categoryName || item?.name || item?.title || '',
                    isActive: item?.isActive !== false,
                    sortOrder: Number(item?.sortOrder ?? 0),
                }))
                .filter((item) => item.id && item.label && item.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((item) => ({ ...item, Icon: FiLayers }));

            setCategories([{ id: 'all', label: 'Tất cả', Icon: FiGrid }, ...normalized]);
            setLoadingCategories(false);
        };

        loadCategories();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadTemplates = async () => {
            setLoading(true);
            const params = { page: 0, size: 50 };
            if (selectedCategory && selectedCategory !== 'all') params.categoryId = selectedCategory;

            const result = await templateService.getTemplates(params);
            if (cancelled) return;

            if (!result.success) {
                setTemplates([]);
                appToast.error('Không tải được template', result.error || 'Vui lòng thử lại');
                setLoading(false);
                return;
            }

            const content = Array.isArray(result.data?.content) ? result.data.content : [];
            const normalized = content.map((item) => ({
                templateId: item?.templateId || item?.id || item?.uuid || '',
                name: item?.name || 'Template',
                description: item?.description || '',
                artisanName: item?.artisanName || '',
                categoryId: item?.categoryId || '',
                basePrice: Number(item?.basePrice ?? 0),
                baseImages: Array.isArray(item?.baseImages) ? item.baseImages.filter(Boolean) : [],
                zoneCount: Number(item?.zoneCount ?? 0),
                isActive: item?.isActive !== false,
            })).filter((item) => item.templateId && item.isActive);

            setTemplates(normalized);
            setLoading(false);
        };

        loadTemplates();
        return () => { cancelled = true; };
    }, [selectedCategory]);

    const categoryMap = useMemo(() => {
        const map = {};
        categories.forEach((category) => {
            map[category.id] = category.label;
        });
        return map;
    }, [categories]);

    const handleSelectCategory = (categoryId) => {
        setSelectedCategory(categoryId);
        const next = new URLSearchParams(searchParams);
        if (!categoryId || categoryId === 'all') next.delete('categoryId');
        else next.set('categoryId', categoryId);
        setSearchParams(next, { replace: true });
    };

    return (
        <div className="template-catalog-page">
            <Header />
            <main className="template-catalog-main">
                <section className="template-catalog-hero container">
                    <div>
                        <div className="template-catalog-badge"><FiStar /> Thiết kế theo mẫu</div>
                        <h1>Chọn mẫu thiết kế có sẵn và tùy biến theo vùng</h1>
                        <p>
                            Chọn một mẫu thiết kế, nhập dữ liệu theo các vùng định sẵn rồi thanh toán như đơn hàng bình thường.
                        </p>
                    </div>
                    <div className="template-catalog-hero-card">
                        <div><strong>{templates.length}</strong><span>mẫu thiết kế đang hiển thị</span></div>
                        <div><strong>{categories.length - 1}</strong><span>danh mục</span></div>
                    </div>
                </section>

                <section className="template-catalog-layout container">
                    <aside className="template-catalog-sidebar">
                        <h3>Danh mục</h3>
                        <div className="template-catalog-category-list">
                            {loadingCategories ? (
                                <div className="template-catalog-skeleton">Đang tải danh mục...</div>
                            ) : categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    className={`template-catalog-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                                    onClick={() => handleSelectCategory(category.id)}
                                >
                                    <span><category.Icon /></span>
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    </aside>

                    <div className="template-catalog-content">
                        {loading ? (
                            <div className="template-catalog-grid">
                                {Array.from({ length: 6 }).map((_, idx) => <div key={idx} className="template-catalog-card skeleton" />)}
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="template-catalog-empty">
                                <FiImage size={48} />
                                <p>Chưa có template nào trong danh mục này.</p>
                            </div>
                        ) : (
                            <div className="template-catalog-grid">
                                {templates.map((template) => (
                                    <article key={template.templateId} className="template-catalog-card">
                                        <div className="template-catalog-thumb">
                                            <img src={template.baseImages?.[0] || PLACEHOLDER_IMAGE} alt={template.name} />
                                        </div>
                                        <div className="template-catalog-body">
                                            <div className="template-catalog-topline">
                                                <span>{categoryMap[template.categoryId] || 'Danh mục'}</span>
                                                <span>{template.zoneCount} vùng</span>
                                            </div>
                                            <h3>{template.name}</h3>
                                            <p>{template.description || 'Chưa có mô tả.'}</p>
                                            <div className="template-catalog-meta">
                                                <div>
                                                    <span>Nghệ nhân</span>
                                                    <strong>{template.artisanName || '—'}</strong>
                                                </div>
                                                <div>
                                                    <span>Giá từ</span>
                                                    <strong>{formatCurrency(template.basePrice)}</strong>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-primary template-catalog-action"
                                                onClick={() => navigate(`/template-order?templateId=${template.templateId}`)}
                                            >
                                                Chọn mẫu thiết kế <FiArrowRight />
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default TemplateCatalogPage;
