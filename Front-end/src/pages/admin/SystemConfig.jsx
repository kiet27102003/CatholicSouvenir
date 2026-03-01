import React, { useState } from 'react';
import './admin-common.css';
import './SystemConfig.css';

const SystemConfig = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [config, setConfig] = useState({
        siteName: 'Sanctus Admin',
        supportEmail: 'support@sanctus.com',
        maintenanceMode: false,
        require2FA: true,
        sessionTimeout: '30',
        smtpHost: 'smtp.sendgrid.net',
        smtpPort: '587',
        enableWeeklyBackup: true,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig({
            ...config,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            // Optional: show a toast notification here
        }, 1000);
    };

    const tabs = [
        { id: 'general', label: 'Tổng quan' },
        { id: 'security', label: 'Bảo mật' },
        { id: 'email', label: 'Email' },
        { id: 'backup', label: 'Sao lưu' },
    ];

    return (
        <div className="admin-page system-config-page">
            <div className="admin-page-header">
                <h2>Cấu hình hệ thống</h2>
                <p className="admin-page-subtitle">Quản lý cài đặt và tùy chọn toàn cục của ứng dụng.</p>
            </div>

            <div className="admin-card config-card">
                {/* Tabs */}
                <div className="tabs-container">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'general' && (
                        <div className="form-section animate-fade-in">
                            <h3 className="form-section-title">Thông tin chung</h3>

                            <div className="form-group">
                                <label>Tên trang web</label>
                                <input
                                    type="text"
                                    name="siteName"
                                    value={config.siteName}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Nhập tên trang web"
                                />
                            </div>

                            <div className="form-group">
                                <label>Email hỗ trợ</label>
                                <input
                                    type="email"
                                    name="supportEmail"
                                    value={config.supportEmail}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Email liên hệ hỗ trợ"
                                />
                            </div>

                            <div className="form-group toggle-group">
                                <div className="toggle-info">
                                    <label>Chế độ bảo trì</label>
                                    <p>Khi bật, chỉ quản trị viên mới truy cập được trang web.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        name="maintenanceMode"
                                        checked={config.maintenanceMode}
                                        onChange={handleChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="form-section animate-fade-in">
                            <h3 className="form-section-title">Bảo mật</h3>

                            <div className="form-group">
                                <label>Thời gian hết phiên (phút)</label>
                                <select
                                    name="sessionTimeout"
                                    value={config.sessionTimeout}
                                    onChange={handleChange}
                                    className="form-input"
                                >
                                    <option value="15">15 phút</option>
                                    <option value="30">30 phút</option>
                                    <option value="60">1 giờ</option>
                                    <option value="120">2 giờ</option>
                                </select>
                            </div>

                            <div className="form-group toggle-group">
                                <div className="toggle-info">
                                    <label>Bắt buộc 2FA cho quản trị viên</label>
                                    <p>Yêu cầu xác thực hai yếu tố cho tất cả tài khoản admin.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        name="require2FA"
                                        checked={config.require2FA}
                                        onChange={handleChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'email' && (
                        <div className="form-section animate-fade-in">
                            <h3 className="form-section-title">Cấu hình SMTP</h3>

                            <div className="form-group">
                                <label>SMTP Host</label>
                                <input
                                    type="text"
                                    name="smtpHost"
                                    value={config.smtpHost}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>SMTP Port</label>
                                <input
                                    type="text"
                                    name="smtpPort"
                                    value={config.smtpPort}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="form-section animate-fade-in">
                            <h3 className="form-section-title">Sao lưu dữ liệu</h3>

                            <div className="form-group toggle-group">
                                <div className="toggle-info">
                                    <label>Bật sao lưu hàng tuần</label>
                                    <p>Sao lưu tự động mỗi Chủ nhật lúc 02:00.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        name="enableWeeklyBackup"
                                        checked={config.enableWeeklyBackup}
                                        onChange={handleChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="current-status-box">
                                <h4>Lần sao lưu gần nhất</h4>
                                <p className="status-text success">Hôm qua 02:00 (Thành công)</p>
                                <button type="button" className="btn btn-outline btn-sm mt-3">Chạy sao lưu ngay</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="config-actions">
                <button
                    type="button"
                    className="btn btn-primary btn-save"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
            </div>
        </div>
    );
};

export default SystemConfig;
