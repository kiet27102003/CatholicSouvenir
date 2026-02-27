import React, { useState } from 'react';
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
        { id: 'general', label: 'General' },
        { id: 'security', label: 'Security' },
        { id: 'email', label: 'Email' },
        { id: 'backup', label: 'Backup' },
    ];

    return (
        <div className="system-config-page">
            <div className="page-header">
                <h2>System Configuration</h2>
                <p className="subtitle">Manage global application settings and preferences.</p>
            </div>

            <div className="config-card">
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
                            <h3>General Information</h3>

                            <div className="form-group">
                                <label>Site Name</label>
                                <input
                                    type="text"
                                    name="siteName"
                                    value={config.siteName}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter site name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Support Email</label>
                                <input
                                    type="email"
                                    name="supportEmail"
                                    value={config.supportEmail}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter support contact email"
                                />
                            </div>

                            <div className="form-group toggle-group">
                                <div className="toggle-info">
                                    <label>Maintenance Mode</label>
                                    <p>When enabled, only administrators can access the website.</p>
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
                            <h3>Security Settings</h3>

                            <div className="form-group">
                                <label>Admin Session Timeout (Minutes)</label>
                                <select
                                    name="sessionTimeout"
                                    value={config.sessionTimeout}
                                    onChange={handleChange}
                                    className="form-input"
                                >
                                    <option value="15">15 Minutes</option>
                                    <option value="30">30 Minutes</option>
                                    <option value="60">1 Hour</option>
                                    <option value="120">2 Hours</option>
                                </select>
                            </div>

                            <div className="form-group toggle-group">
                                <div className="toggle-info">
                                    <label>Require 2FA for Administrators</label>
                                    <p>Enforce Two-Factor Authentication for all admin accounts.</p>
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
                            <h3>SMTP Configuration</h3>

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
                            <h3>Database Backup</h3>

                            <div className="form-group toggle-group">
                                <div className="toggle-info">
                                    <label>Enable Weekly Database Backups</label>
                                    <p>Automatically backup database every Sunday at 02:00 AM.</p>
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
                                <h4>Last Backup</h4>
                                <p className="status-text success">Yesterday at 02:00 AM (Status: Success)</p>
                                <button className="btn btn-outline btn-sm mt-3">Run Backup Now</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Save Button */}
            <div className="floating-action-bar">
                <button
                    className="btn btn-primary btn-save"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );
};

export default SystemConfig;
