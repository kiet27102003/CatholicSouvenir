import React from 'react';
import { FiClock } from 'react-icons/fi';
import './admin-common.css';

const AdminComingSoon = ({ title }) => {
    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{title}</h1>
                    <p className="admin-page-subtitle">Tính năng này hiện đang phát triển.</p>
                </div>
            </div>

            <div className="admin-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <FiClock style={{ fontSize: 20, color: '#ea580c' }} />
                <strong>Đang phát triển</strong>
            </div>
        </div>
    );
};

export default AdminComingSoon;
