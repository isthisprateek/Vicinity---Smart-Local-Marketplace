import { useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { FaceCaptureModal } from '@/features/auth/components/FaceCaptureModal';
import { authStorage } from '@/features/auth/services/auth.service';
import { LocationPicker } from '@/features/location/LocationPicker';
import './UserDashboardPage.css';

export function UserDashboardPage() {
    const { user } = useAuth();

    // Safety check just in case it renders before auth state catches up
    if (!user) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <p>Loading user profile...</p>
            </div>
        );
    }

    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(user.name);
    const [editPassword, setEditPassword] = useState('');

    // Addresses State
    const [savedAddresses, setSavedAddresses] = useState<any[]>(user.savedAddresses || []);
    const [isMapOpen, setIsMapOpen] = useState(false);

    // Auth Context to update global user
    const { login } = useAuth();

    // Assume user is registered if the backend doesn't explicitly return face status yet
    // For a real production app, we'd add 'hasFaceData: boolean' to the User context object

    const handleRegisterFace = async (descriptor: number[]) => {
        setActionLoading(true);
        setMessage(null);
        try {
            const token = authStorage.getToken();
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${baseUrl}/api/auth/face/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ descriptor })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Face authentication registered securely!' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.message || 'Failed to register face.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred.' });
        } finally {
            setActionLoading(false);
            setIsFaceModalOpen(false);
        }
    };

    const handleRemoveFace = async () => {
        if (!confirm('Are you sure you want to remove your face authentication data?')) return;

        setActionLoading(true);
        setMessage(null);
        try {
            const token = authStorage.getToken();
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${baseUrl}/api/auth/face/remove`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Face authentication removed.' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.message || 'Failed to remove face data.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setActionLoading(true);
        setMessage(null);
        try {
            const token = authStorage.getToken() || '';
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${baseUrl}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: editName, password: editPassword || undefined })
            });

            const data = await res.json();
            if (res.ok) {
                setToastMessage({ type: 'success', text: 'Profile Updated Successfully!' });
                setIsEditingProfile(false);
                setEditPassword('');
                login({ ...user, name: data.name }, token); // update Context
                setTimeout(() => setToastMessage(null), 3000);
            } else {
                setToastMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
                setTimeout(() => setToastMessage(null), 3000);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error occurred.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddAddress = async (lat: number, lng: number, addressStr: string) => {
        setIsMapOpen(false);
        const userLabel = window.prompt("Enter a label for this address (e.g. Home, Work, Gym):", "Home");
        if (userLabel === null) return;

        const finalLabel = userLabel.trim() || `Address ${savedAddresses.length + 1}`;

        setActionLoading(true);
        try {
            const token = authStorage.getToken() || '';
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            const res = await fetch(`${baseUrl}/api/users/addresses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ label: finalLabel, address: addressStr, lat, lng })
            });

            if (res.ok) {
                const newAddresses = await res.json();
                setSavedAddresses(newAddresses);
                login({ ...user, savedAddresses: newAddresses }, token);
                setMessage({ type: 'success', text: 'Address added!' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to add address.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveAddress = async (id: string) => {
        if (!confirm('Remove this address?')) return;
        setActionLoading(true);
        try {
            const token = authStorage.getToken() || '';
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${baseUrl}/api/users/addresses/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const newAddresses = await res.json();
                setSavedAddresses(newAddresses);
                login({ ...user, savedAddresses: newAddresses }, token);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to remove address.' });
        } finally {
            setActionLoading(false);
        }
    };

    const { name, email, role } = user;
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <div className="user-profile-page">
            <div className="container">
                <div className="profile-header-card">
                    <div className="profile-avatar-large">
                        {initials}
                    </div>
                    <div className="profile-header-info">
                        <h1 className="profile-name">{name}</h1>
                        <p className="profile-email">{email}</p>
                        <span className="profile-role-badge">{role}</span>
                    </div>
                </div>

                <div className="profile-grid">
                    <div className="profile-section">
                        <h2 className="profile-section-title">Account Details</h2>
                        {isEditingProfile ? (
                            <div className="profile-edit-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Full Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>New Password (leave blank to keep current)</label>
                                    <input
                                        type="password"
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div className="profile-actions" style={{ marginTop: '0.5rem' }}>
                                    <button className="profile-btn profile-btn-primary" onClick={handleSaveProfile} disabled={actionLoading} style={{ background: 'var(--primary-color)', color: 'white' }}>Save Changes</button>
                                    <button className="profile-btn profile-btn-outline" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="profile-details-list">
                                    <div className="profile-detail-item">
                                        <span className="detail-label">Full Name</span>
                                        <span className="detail-value">{name}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <span className="detail-label">Email Address</span>
                                        <span className="detail-value">{email}</span>
                                    </div>
                                    <div className="profile-detail-item">
                                        <span className="detail-label">Account Type</span>
                                        <span className="detail-value" style={{ textTransform: 'capitalize' }}>{role}</span>
                                    </div>
                                </div>
                                <div className="profile-actions">
                                    <button className="profile-btn profile-btn-outline" onClick={() => setIsEditingProfile(true)}>Edit Profile</button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Security & Biometrics Section */}
                    <div className="profile-section">
                        <h2 className="profile-section-title">Security & Biometrics</h2>
                        <div className="profile-details-list">
                            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                                Use face recognition to log in quickly and securely. Your face data is processed locally on your device ensuring maximum privacy.
                                We only store a secure mathematical representation, never the actual image.
                            </p>

                            {message && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                                    color: message.type === 'success' ? '#166534' : '#991b1b',
                                    fontSize: '0.9rem',
                                    marginBottom: '1rem',
                                    fontWeight: 500
                                }}>
                                    {message.text}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <button
                                    className="profile-btn profile-btn-primary"
                                    onClick={() => setIsFaceModalOpen(true)}
                                    disabled={actionLoading}
                                    style={{ background: 'var(--primary-color)', color: 'white' }}
                                >
                                    {actionLoading && !isFaceModalOpen ? 'Processing...' : '📷 Register Face Setup'}
                                </button>

                                <button
                                    className="profile-btn profile-btn-outline"
                                    onClick={handleRemoveFace}
                                    disabled={actionLoading}
                                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                >
                                    🗑️ Remove Face Data
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className="profile-section-title" style={{ margin: 0 }}>Saved Addresses</h2>
                            <button
                                className="profile-btn profile-btn-outline"
                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => setIsMapOpen(true)}
                            >
                                + Add New
                            </button>
                        </div>
                        {savedAddresses.length === 0 ? (
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
                                No saved addresses yet. Add one to checkout faster!
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {savedAddresses.map(addr => (
                                    <div key={addr._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{addr.label}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>{addr.address}</div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAddress(addr._id)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                                            title="Remove address"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FaceCaptureModal
                isOpen={isFaceModalOpen}
                onClose={() => setIsFaceModalOpen(false)}
                onCapture={handleRegisterFace}
                title="Register Face Authentication"
                description="Please look directly at the camera to setup face login. Your face data is processed securely on your device."
                buttonText="Scan & Save Face"
            />

            {isMapOpen && (
                <LocationPicker
                    onConfirm={handleAddAddress}
                    onCancel={() => setIsMapOpen(false)}
                />
            )}

            {toastMessage && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '1rem 1.5rem',
                    background: toastMessage.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 9999,
                    fontWeight: 600,
                    animation: 'slideIn 0.3s ease-out',
                }}>
                    {toastMessage.text}
                </div>
            )}
        </div>
    );
}
