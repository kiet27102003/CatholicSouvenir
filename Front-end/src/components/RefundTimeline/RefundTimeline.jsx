import React from 'react';
import { FiCheckCircle, FiClock, FiPackage } from 'react-icons/fi';
import './RefundTimeline.css';

const STEPS = [
  { key: 'APPROVED', label: 'Khiếu nại được duyệt', icon: FiCheckCircle },
  { key: 'PROCESSING', label: 'VNPay đang xử lý (3–7 ngày)', icon: FiClock },
  { key: 'COMPLETED', label: 'Tiền đã được hoàn về phương thức gốc', icon: FiPackage },
];

const getActiveStepIndex = (status) => {
  const current = String(status || '').toUpperCase();
  if (current === 'COMPLETED') return 2;
  if (current === 'PROCESSING' || current === 'PENDING') return 1;
  if (current === 'FAILED') return 0;
  return 0;
};

const RefundTimeline = ({ status, estimatedCompletionDays = '3-7' }) => {
  const activeStepIndex = getActiveStepIndex(status);
  const current = String(status || '').toUpperCase();

  return (
    <div className="refund-timeline">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = current === 'COMPLETED' ? true : index < activeStepIndex;
        const isActive = index === activeStepIndex && current !== 'FAILED';

        return (
          <div key={step.key} className={`refund-timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
            <div className="refund-timeline-marker">
              <Icon />
            </div>
            <div className="refund-timeline-content">
              <strong>{step.label}</strong>
              {index === 1 && current === 'PROCESSING' && (
                <p>Ước tính hoàn tất trong {estimatedCompletionDays} ngày làm việc.</p>
              )}
              {index === 2 && current === 'COMPLETED' && <p>Tiền đã quay về tài khoản/thẻ VNPay ban đầu.</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RefundTimeline;
