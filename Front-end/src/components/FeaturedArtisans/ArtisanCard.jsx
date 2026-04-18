import React from 'react';
import { Link } from 'react-router-dom';
import './ArtisanCard.css';

const ArtisanCard = ({ id, name, location, description, profileImage, productImage }) => {
    const summary = String(description || '').trim();
    const shortSummary = summary.length > 110 ? `${summary.slice(0, 110).trim()}...` : summary;
    const displayLocation = String(location || '').trim();

    return (
        <article className="artisan-card">
            <div className="artisan-card-cover">
                <img src={productImage} alt={`${name} portfolio`} className="artisan-cover-image" />
                <div className="artisan-card-overlay">
                    <span className="artisan-pill">Nghệ nhân</span>
                    <span className="artisan-pill artisan-pill--soft">{displayLocation || 'Chuyên môn'}</span>
                </div>
            </div>

            <div className="artisan-card-body">
                <div className="artisan-header">
                    <img src={profileImage} alt={name} className="artisan-avatar" />
                    <div className="artisan-info">
                        <h3 className="artisan-name" title={name}>{name}</h3>
                        <p className="artisan-location" title={displayLocation || 'Chưa cập nhật'}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" />
                                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span className="artisan-ellipsis">{displayLocation || 'Chưa cập nhật'}</span>
                        </p>
                    </div>
                </div>

                <div className="artisan-detail-grid">
                    <div className="artisan-detail-block">
                        <span className="artisan-detail-label">Mô tả</span>
                        <p className="artisan-description" title={summary || 'Chưa có mô tả.'}>{shortSummary || 'Chưa có mô tả.'}</p>
                    </div>

                    <div className="artisan-detail-block artisan-detail-block--meta">
                        <span className="artisan-detail-label">Trạng thái</span>
                        <div className="artisan-meta-row">
                            <span className="artisan-meta-chip">Đang nhận đơn</span>
                            <span className="artisan-meta-chip artisan-meta-chip--ghost">Portfolio</span>
                        </div>
                    </div>
                </div>

                <Link to={`/artisans/${id}`} className="btn btn-secondary artisan-cta" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                    Xem nghệ nhân
                </Link>
            </div>
        </article>
    );
};

export default ArtisanCard;
