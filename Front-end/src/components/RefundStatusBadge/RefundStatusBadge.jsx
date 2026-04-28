import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock, FiInfo, FiXCircle } from 'react-icons/fi';
import './RefundStatusBadge.css';

const META = {
  PENDING: { label: 'Chờ xử lý', className: 'pending', icon: FiClock, description: 'Hồ sơ đang chờ hệ thống tiếp nhận.' },
  PROCESSING: { label: 'Đang xử lý (3-7 ngày)', className: 'processing', icon: FiInfo, description: 'VNPay đang xử lý và sẽ hoàn về phương thức gốc.' },
  COMPLETED: { label: 'Hoàn thành', className: 'completed', icon: FiCheckCircle, description: 'Khoản hoàn đã được ghi nhận thành công.' },
  FAILED: { label: 'Thất bại', className: 'failed', icon: FiXCircle, description: 'Giao dịch hoàn tiền không thực hiện được.' },
  PARTIALLY_REFUNDED: { label: 'Hoàn tiền một phần', className: 'partial', icon: FiAlertCircle, description: 'Chỉ một phần khoản hoàn đã được xử lý.' },
};

const RefundStatusBadge = ({ status }) => {
  const current = String(status || '').toUpperCase();
  const meta = META[current] || { label: current || 'Không xác định', className: 'default', icon: FiInfo, description: '' };
  const Icon = meta.icon;

  return (
    <div className={`refund-status-badge ${meta.className}`}>
      <div className="refund-status-badge__head">
        <Icon />
        <strong>{meta.label}</strong>
      </div>
      {meta.description ? <p>{meta.description}</p> : null}
    </div>
  );
};

export default RefundStatusBadge;
