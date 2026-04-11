import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Workbench from './components/Workbench';
import PortfolioView from './components/PortfolioView';
import TemplatesView from './components/TemplatesView';
import './ArtisanDashboard.css';

const getViewFromPath = (pathname) => {
    if (pathname === '/artisan/templates') return 'templates';
    return 'dashboard';
};

const viewToPath = (view) => {
    if (view === 'templates') return '/artisan/templates';
    if (view === 'wallet') return '/wallet';
    return '/artisan';
};

const ArtisanDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeView, setActiveView] = useState(getViewFromPath(location.pathname));
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setActiveView(getViewFromPath(location.pathname));
    }, [location.pathname]);

    if (!user || user.role !== 'artisan') {
        navigate('/login');
        return null;
    }

    const handleChangeView = (view) => {
        setActiveView(view);
        setSidebarOpen(false);
        const nextPath = viewToPath(view);
        if (location.pathname !== nextPath) navigate(nextPath);
    };

    return (
        <div className="artisan-dashboard">
            <button type="button" className="artisan-mobile-menu-btn" aria-label="Menu" onClick={() => setSidebarOpen(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>
            {sidebarOpen && <div className="artisan-sidebar-overlay" onClick={() => setSidebarOpen(false)} role="presentation" />}
            <Sidebar
                user={user}
                activeView={activeView}
                setActiveView={handleChangeView}
                onLogout={logout}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <main className="artisan-main">
                {activeView === 'dashboard' && <Workbench user={user} />}
                {activeView === 'commissions' && <div className="view-placeholder">Commissions View</div>}
                {activeView === 'messages' && <div className="view-placeholder">Messages View</div>}
                {activeView === 'portfolio' && <PortfolioView user={user} />}
                {activeView === 'templates' && <TemplatesView user={user} />}
                {activeView === 'earnings' && <div className="view-placeholder">Earnings View</div>}
            </main>
        </div>
    );
};

export default ArtisanDashboard;
