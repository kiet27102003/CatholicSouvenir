import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    {/* Vatican Artisans - Left */}
                    <div className="footer-column footer-brand">
                        <div className="footer-logo">
                            <svg className="footer-logo-icon-svg" width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2L26 14L14 26L2 14L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M16 4L26 14L16 24L6 14L16 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18 6L26 14L18 22L10 14L18 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="footer-logo-text">Sanctus</span>
                        </div>
                        <p className="footer-description">
                            Kết nối cộng đồng tín hữu với nghệ nhân thủ công Công giáo. Mỗi giao dịch đều ủng hộ nghệ nhân quy mô nhỏ và công việc thánh của họ.
                        </p>
                        <div className="footer-social">
                            <a href="#fb" className="social-link" aria-label="Facebook">FB</a>
                            <a href="#g" className="social-link" aria-label="Google">G</a>
                            <a href="#yt" className="social-link" aria-label="YouTube">YT</a>
                        </div>
                    </div>

                    {/* KHÁM PHÁ */}
                    <div className="footer-column">
                        <h4 className="footer-title">KHÁM PHÁ</h4>
                        <ul className="footer-links">
                            <li><Link to="/custom-requests">Yêu Cầu Đồ Thủ Công</Link></li>
                            <li><Link to="/artisans">Tìm Kiếm Nghệ Nhân</Link></li>
                            <li><a href="#send-gift">Gửi Tặng Phụng Vụ</a></li>
                            <li><Link to="/shop">Sản Phẩm Mới</Link></li>
                        </ul>
                    </div>

                    {/* THÔNG TIN */}
                    <div className="footer-column">
                        <h4 className="footer-title">THÔNG TIN</h4>
                        <ul className="footer-links">
                            <li><a href="#privacy">Chính Sách Bảo Mật</a></li>
                            <li><a href="#escrow">Dịch Vụ Ký Quỹ</a></li>
                            <li><a href="#artisan-fees">Bảng Phí Nghệ Nhân</a></li>
                            <li><a href="#contact">Liên Hệ Hỗ Trợ</a></li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="footer-bottom">
                    <p className="footer-copyright">
                        © 2024 Sanctus. BẢO LƯU MỌI QUYỀN · CHÍNH SÁCH BẢO MẬT · ĐIỀU KHOẢN DỊCH VỤ
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
