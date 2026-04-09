import React from 'react';
import './PaymentStatusBadge.css';

const STATUS_MAP = {
    PENDING: { label: 'Đang xử lý', className: 'pending' },
    SUCCESS: { label: 'Thành công', className: 'success' },
    FAILED: { label: 'Thất bại', className: 'failed' },
    REFUNDED: { label: 'Đã hoàn tiền', className: 'refunded' },
};

const PaymentStatusBadge = ({ status }) => {
    const key = String(status || '').toUpperCase();
    const meta = STATUS_MAP[key] || { label: key || '—', className: 'pending' };
    return <span className={`payment-status-badge ${meta.className}`}>{meta.label}</span>;
};

export default PaymentStatusBadge;
