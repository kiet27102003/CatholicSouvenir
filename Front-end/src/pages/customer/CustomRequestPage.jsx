import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './CustomRequestPage.css';

const CustomRequestPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Check if we came from an artisan's profile page
    const prefilledArtisanId = location.state?.artisanId || '';
    const prefilledArtisanName = location.state?.artisanName || '';

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        timeline: '',
        referenceImage: null
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        // Just mock file selection for now
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, referenceImage: e.target.files[0] }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Simulate API send message/quote request
        setTimeout(() => {
            setSubmitting(false);
            setSuccess(true);

            // Redirect to messages after 2 seconds
            setTimeout(() => {
                navigate('/messages');
            }, 2000);
        }, 1200);
    };

    if (success) {
        return (
            <div className="custom-request-success">
                <div className="success-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h2>Request Sent Successfully!</h2>
                <p>Your custom order request has been sent to the artisan. You will be redirected to your messages shortly to discuss further details.</p>
                <button className="btn btn-primary" onClick={() => navigate('/messages')}>Go to Messages Now</button>
            </div>
        );
    }

    return (
        <div className="custom-request-page">
            <div className="request-header">
                <h1 className="request-title">Request a Custom Creation</h1>
                <p className="request-subtitle">Describe what you have in mind, and our artisans will bring your vision of faith to life.</p>
            </div>

            <div className="request-form-container">
                <form className="request-form" onSubmit={handleSubmit}>

                    {prefilledArtisanName ? (
                        <div className="artisan-selection info-box">
                            <p><strong>Artisan Selected:</strong> {prefilledArtisanName}</p>
                            <p className="text-small">Your request will be sent directly to this artisan.</p>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label className="form-label" htmlFor="artisanSelect">Select Artisan (Optional)</label>
                            <select id="artisanSelect" className="form-input" defaultValue="">
                                <option value="" disabled>Choose an artisan...</option>
                                <option value="1">Marco V. - Woodworking</option>
                                <option value="3">Clara M. - Jewelry</option>
                                <option value="6">John Paul Metalworks - Metalworking</option>
                            </select>
                            <span className="input-hint">Leave blank if you want us to match you with the best artisan for your request.</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="title">Project Title <span className="required">*</span></label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            className="form-input"
                            placeholder="e.g. Custom Olive Wood Rosary with Silver Inlay"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="description">Detailed Description <span className="required">*</span></label>
                        <textarea
                            id="description"
                            name="description"
                            className="form-input form-textarea"
                            placeholder="Describe your vision in detail. Include materials, size, inscriptions, or any specific religious significance you want incorporated."
                            rows="6"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="budget">Estimated Budget ($)</label>
                            <input
                                type="number"
                                id="budget"
                                name="budget"
                                className="form-input"
                                placeholder="e.g. 150"
                                min="10"
                                value={formData.budget}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="timeline">Desired Timeline</label>
                            <input
                                type="text"
                                id="timeline"
                                name="timeline"
                                className="form-input"
                                placeholder="e.g. By November 1st"
                                value={formData.timeline}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Reference Images (Optional)</label>
                        <div className="file-upload-box">
                            <input
                                type="file"
                                id="referenceImage"
                                accept="image/*"
                                className="file-input-hidden"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="referenceImage" className="file-upload-label">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                                <span>{formData.referenceImage ? formData.referenceImage.name : 'Click to upload a reference image or sketch'}</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <p className="notice-text">
                            Submitting this form does not commit you to purchase. The artisan will review your request and provide a formal quotation for your approval.
                        </p>
                        <button type="submit" className="btn btn-primary btn-large" disabled={submitting}>
                            {submitting ? 'Submitting Request...' : 'Submit Request for Quote'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomRequestPage;
