import React from 'react';
import { FiUsers, FiShoppingBag, FiTool, FiSettings } from 'react-icons/fi';
import './PlatformEcosystem.css';

const roles = [
    { Icon: FiUsers, title: 'KHÁCH QUẢNG LỄ', description: 'Đặt mua sản phẩm phụng vụ, đồ thánh cho lễ nghi và cộng đoàn.' },
    { Icon: FiShoppingBag, title: 'KHÁCH HÀNG', description: 'Mua sắm và đặt làm riêng sản phẩm thủ công từ nghệ nhân uy tín.' },
    { Icon: FiTool, title: 'NGHỆ NHÂN', description: 'Đăng bán tác phẩm và nhận yêu cầu đặt làm riêng từ khách hàng.' },
    { Icon: FiSettings, title: 'QUẢN TRỊ VIÊN', description: 'Quản lý nền tảng, duyệt sản phẩm và hỗ trợ giao dịch ký quỹ.' },
];

const PlatformEcosystem = () => {
    return (
        <section id="about" className="platform-ecosystem section">
            <div className="container">
                <div className="ecosystem-header">
                    <div className="ecosystem-title-wrap">
                        <span className="ecosystem-title-bar"></span>
                        <h2 className="ecosystem-title">HỆ SINH THÁI NỀN TẢNG</h2>
                    </div>
                    <p className="ecosystem-desc">
                        Vatican Artisans là một chợ điện tử chuyên biệt kết nối cộng đồng tín hữu với các nghệ nhân thủ công Công giáo. Nền tảng hỗ trợ đặt hàng tùy biến, thanh toán theo giai đoạn và công cụ AI gợi ý thiết kế.
                    </p>
                </div>
                <div className="ecosystem-cards">
                    {roles.map(({ Icon, title, description }, idx) => (
                        <div key={idx} className="ecosystem-card">
                            <div className="ecosystem-card-icon"><Icon size={32} strokeWidth={1.5} /></div>
                            <h3 className="ecosystem-card-title">{title}</h3>
                            <p className="ecosystem-card-desc">{description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PlatformEcosystem;
