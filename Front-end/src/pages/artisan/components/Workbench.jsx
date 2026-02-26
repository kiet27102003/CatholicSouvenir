import React from 'react';
import './Workbench.css';

const Workbench = ({ user }) => {
    const activeCommissions = [
        {
            id: 'CM-459',
            title: 'Custom Rosary - Lapis Lazuli',
            client: {
                name: 'Sarah Jenkins',
                avatar: 'https://i.pravatar.cc/150?img=47'
            },
            daysLeft: 3,
            currentPhase: 'Assembling',
            progress: 75,
            status: 'Feast of the Assumption'
        },
        {
            id: 'CM-458',
            title: 'Hand-painted Icon of St. Francis',
            client: {
                name: "Michael O'Connor",
                avatar: 'https://i.pravatar.cc/150?img=12'
            },
            dueDate: 'Oct 4th',
            daysLeft: 12,
            currentPhase: 'Gilding',
            progress: 46
        }
    ];

    const newInquiries = [
        {
            id: 1,
            client: {
                name: 'Elena R.',
                avatar: 'https://i.pravatar.cc/150?img=32',
                initials: 'ER'
            },
            title: 'First Communion Veil Embroidery',
            description: 'Looking for a custom design featuring lilies of the valley. Needed by May.',
            budget: 150,
            timeAgo: '2h ago'
        },
        {
            id: 2,
            client: {
                name: 'John Doe',
                avatar: 'https://i.pravatar.cc/150?img=60',
                initials: 'JD'
            },
            title: 'Olive Wood Carving - Holy Family',
            description: "I saw your St. Joseph carving and would love a similar style for a Holy Family set approx...",
            budget: 500,
            timeAgo: '5h ago'
        }
    ];

    return (
        <div className="workbench">
            <header className="workbench-header">
                <div className="header-left">
                    <h1 className="workbench-title">Workbench</h1>
                    <p className="workbench-subtitle">Manage your active commissions and new requests.</p>
                </div>
                <div className="header-right">
                    <button className="btn-status">
                        <span className="status-indicator"></span>
                        Accepting Orders
                    </button>
                    <button className="btn-primary">+ Log Offline Sale</button>
                </div>
            </header>

            <div className="workbench-stats">
                <div className="stat-card">
                    <div className="stat-icon stat-icon-blue">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Active Commissions</p>
                        <p className="stat-value">3</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-green">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2V6M12 18V22M6 12H2M22 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Earnings (This Month)</p>
                        <p className="stat-value">$1,250</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-purple">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Avg. Completion Time</p>
                        <p className="stat-value">14 Days</p>
                    </div>
                </div>
            </div>

            <div className="workbench-content">
                <div className="commissions-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            <span className="section-icon">🎨</span>
                            In The Workshop
                        </h2>
                        <a href="#all" className="view-all-link">View All</a>
                    </div>

                    <div className="commissions-grid">
                        {activeCommissions.map(commission => (
                            <CommissionCard key={commission.id} commission={commission} />
                        ))}
                    </div>
                </div>

                <div className="inquiries-section">
                    <div className="inquiry-header">
                        <div className="inquiry-title-wrapper">
                            <h2 className="section-title">
                                <span className="section-icon">✉️</span>
                                New Inquiries
                            </h2>
                            <span className="badge-new">2 New</span>
                        </div>
                    </div>

                    <div className="inquiries-list">
                        {newInquiries.map(inquiry => (
                            <InquiryCard key={inquiry.id} inquiry={inquiry} />
                        ))}
                    </div>

                    <div className="liturgical-calendar">
                        <div className="calendar-header">
                            <h3>Liturgical Calendar</h3>
                        </div>
                        <div className="calendar-content">
                            <p>Check upcoming feast days to plan your crafting schedule accordingly.</p>
                            <button className="btn-calendar">View Calendar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CommissionCard = ({ commission }) => {
    return (
        <div className="commission-card">
            <div className="commission-image">
                <img
                    src={commission.id === 'CM-459'
                        ? 'https://images.unsplash.com/photo-1611163968425-b6c0e18d7958?w=400&h=400&fit=crop'
                        : 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop'
                    }
                    alt={commission.title}
                />
                <div className="commission-id">#{commission.id}</div>
            </div>

            <div className="commission-content">
                <h3 className="commission-title">{commission.title}</h3>
                <div className="commission-client">
                    <img src={commission.client.avatar} alt={commission.client.name} />
                    <span>for {commission.client.name}</span>
                </div>

                {commission.status && (
                    <div className="commission-status">
                        <div className="status-badge">
                            Feast of the<br />Assumption
                        </div>
                        <span className="days-left">{commission.daysLeft} days left</span>
                    </div>
                )}

                {commission.dueDate && (
                    <div className="commission-due">
                        <span className="due-label">Due: {commission.dueDate}</span>
                        <span className="days-left">{commission.daysLeft} days left</span>
                    </div>
                )}

                <div className="commission-phase">
                    <span className="phase-label">Current Phase: {commission.currentPhase}</span>
                    <span className="phase-progress">{commission.progress}%</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${commission.progress}%` }}></div>
                </div>

                <div className="commission-actions">
                    <button className="btn-update">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Update Progress
                    </button>
                    <button className="btn-message">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 8L10.89 13.26C11.5417 13.6761 12.4583 13.6761 13.11 13.26L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        Message
                    </button>
                </div>
            </div>
        </div>
    );
};

const InquiryCard = ({ inquiry }) => {
    return (
        <div className="inquiry-card">
            <div className="inquiry-header-row">
                <div className="inquiry-client">
                    <div className="client-avatar">{inquiry.client.initials}</div>
                    <div className="client-info">
                        <h4>{inquiry.client.name}</h4>
                        <span className="time-ago">{inquiry.timeAgo}</span>
                    </div>
                </div>
            </div>
            <h3 className="inquiry-title">{inquiry.title}</h3>
            <p className="inquiry-description">{inquiry.description}</p>
            <div className="inquiry-footer">
                <div className="inquiry-budget">
                    <span className="budget-label">Budget:</span>
                    <span className="budget-value">${inquiry.budget}</span>
                </div>
                <a href="#details" className="review-link">Review Details</a>
            </div>
            <div className="inquiry-actions">
                <button className="btn-accept">Accept</button>
                <button className="btn-decline">Decline</button>
            </div>
        </div>
    );
};

export default Workbench;
