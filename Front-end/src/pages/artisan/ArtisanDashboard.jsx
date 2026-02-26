import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Workbench from './components/Workbench';
import './ArtisanDashboard.css';

const ArtisanDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState('dashboard');

    if (!user || user.role !== 'artisan') {
        navigate('/login');
        return null;
    }

    return (
        <div className="artisan-dashboard">
            <Sidebar
                user={user}
                activeView={activeView}
                setActiveView={setActiveView}
                onLogout={logout}
            />
            <main className="artisan-main">
                {activeView === 'dashboard' && <Workbench user={user} />}
                {activeView === 'commissions' && <div className="view-placeholder">Commissions View</div>}
                {activeView === 'messages' && <div className="view-placeholder">Messages View</div>}
                {activeView === 'portfolio' && <div className="view-placeholder">Portfolio View</div>}
                {activeView === 'earnings' && <div className="view-placeholder">Earnings View</div>}
            </main>
        </div>
    );
};

export default ArtisanDashboard;
