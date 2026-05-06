import React from 'react';
import { createPortal } from 'react-dom';
import { useLoading } from '../../context/LoadingContext';

const GlobalLoading = () => {
  const { loading } = useLoading();

  if (!loading || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-5 shadow-2xl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#0f766e]" />
        <p className="text-sm font-medium text-gray-700">Đang tải dữ liệu...</p>
      </div>
    </div>,
    document.body,
  );
};

export default GlobalLoading;
