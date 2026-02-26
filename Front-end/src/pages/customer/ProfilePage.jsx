import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            // Mocking API call to update user profile
            const response = await fetch(`http://localhost:3001/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address
                })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                updateUser(updatedUser);
                setSuccessMsg('Profile updated successfully!');
            } else {
                setErrorMsg('Failed to update profile.');
            }
        } catch (error) {
            setErrorMsg('An error occurred. Please try again.');
        } finally {
            setLoading(false);

            // Clear success message after 3 seconds
            if (!errorMsg) {
                setTimeout(() => {
                    setSuccessMsg('');
                }, 3000);
            }
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1 className="profile-title">My Profile</h1>
                <p className="profile-subtitle">Update your personal information and contact details.</p>
            </div>

            <div className="profile-content">
                <form className="profile-form" onSubmit={handleSubmit}>

                    {successMsg && (
                        <div className="alert alert-success">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {successMsg}
                        </div>
                    )}

                    {errorMsg && (
                        <div className="alert alert-error">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            {errorMsg}
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name" className="form-label">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="form-input"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input input-disabled"
                                value={formData.email}
                                disabled
                                readOnly
                            />
                            <span className="input-hint">Email address cannot be changed</span>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phone" className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                className="form-input"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="address" className="form-label">Shipping Address</label>
                        <textarea
                            id="address"
                            name="address"
                            className="form-input form-textarea"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter your full shipping address"
                            rows="3"
                        ></textarea>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => {
                            setFormData({
                                name: user?.name || '',
                                email: user?.email || '',
                                phone: user?.phone || '',
                                address: user?.address || ''
                            });
                            setErrorMsg('');
                            setSuccessMsg('');
                        }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                <div className="profile-side-panel">
                    <div className="avatar-section">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Profile" className="large-avatar" />
                        ) : (
                            <div className="large-avatar-placeholder">
                                {user?.name ? user.name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <button className="btn btn-outline btn-sm change-avatar-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            Upload Photo
                        </button>
                        <p className="avatar-hint">At least 256x256px PNG or JPG file.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
