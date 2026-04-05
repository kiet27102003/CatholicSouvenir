import React from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';
import './AppToast.css';

const DURATION = {
    success: 4000,
    error: 6000,
    warning: 4000,
    info: 4000,
};

const iconColor = {
    success: '#16a34a',
    error: '#dc2626',
    warning: '#ca8a04',
    info: '#2563eb',
};

function ToastBody({ variant, title, message }) {
    const Icon = {
        success: FiCheckCircle,
        error: FiAlertCircle,
        warning: FiAlertTriangle,
        info: FiInfo,
    }[variant];

    return (
        <div className="app-toast-body">
            <span className="app-toast-body-icon" style={{ color: iconColor[variant] }} aria-hidden>
                <Icon size={22} strokeWidth={2} />
            </span>
            <div className="app-toast-body-text">
                <div className="app-toast-body-title">{title}</div>
                {message ? <div className="app-toast-body-message">{message}</div> : null}
            </div>
        </div>
    );
}

const baseOptions = {
    closeButton: true,
    pauseOnHover: true,
    draggable: true,
};

function show(variant, title, message, duration) {
    const node = <ToastBody variant={variant} title={title} message={message} />;
    const opts = { ...baseOptions, autoClose: duration, className: `app-toast app-toast--${variant}` };

    switch (variant) {
        case 'success':
            toast.success(node, { ...opts, icon: false });
            break;
        case 'error':
            toast.error(node, { ...opts, icon: false });
            break;
        case 'warning':
            toast.warning(node, { ...opts, icon: false });
            break;
        case 'info':
            toast.info(node, { ...opts, icon: false });
            break;
        default:
            toast(node, { ...opts, type: 'default' });
    }
}

/**
 * Thông báo toàn app — dùng thay alert / inline error / console success.
 * @param {string} title
 * @param {string} [message]
 */
export const appToast = {
    success: (title, message) => show('success', title, message, DURATION.success),
    error: (title, message) => show('error', title, message, DURATION.error),
    warning: (title, message) => show('warning', title, message, DURATION.warning),
    info: (title, message) => show('info', title, message, DURATION.info),
    /** Gỡ một toast theo id (react-toastify) */
    dismiss: (id) => toast.dismiss(id),
};

/** Mount đúng 1 lần trong App (bên trong AuthProvider). */
export function AppToastContainer() {
    return (
        <ToastContainer
            position="top-right"
            autoClose={4000}
            newestOnTop
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            limit={6}
            theme="light"
            toastClassName="app-toast-item"
            bodyClassName="app-toast-item-body"
        />
    );
}

export default appToast;
