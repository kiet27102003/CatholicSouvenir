import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
    const navigate = useNavigate();
    return (
        <section className="hero">
            <div className="hero-overlay"></div>
            <div className="container hero-container">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Vẻ Đẹp <span className="hero-highlight">THÁNH THIÊNG</span> Qua Bàn Tay <span className="hero-highlight">NGHỆ NHÂN</span>
                    </h1>
                    <p className="hero-description">
                        Kết nối tín hữu với những nghệ nhân thủ công tâm huyết trên khắp thế giới.
                    </p>
                    <div className="hero-ctas">
                        <button className="btn hero-cta hero-cta-gold" onClick={() => navigate('/shop')}>
                            MUA NGAY
                        </button>
                        <button className="btn hero-cta hero-cta-outline" onClick={() => navigate('/custom-requests')}>
                            YÊU CẦU THIẾT KẾ RIÊNG
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
