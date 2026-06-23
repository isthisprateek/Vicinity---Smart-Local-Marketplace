import { useState } from 'react';
import { authStorage } from '@/features/auth/services/auth.service';
import { LocationPicker } from '@/features/location/LocationPicker';

interface CreateShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShopCreated: () => void;
}

export function CreateShopModal({ isOpen, onClose, onShopCreated }: CreateShopModalProps) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const resetForm = () => {
        setName('');
        setAddress('');
        setLat(null);
        setLng(null);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name.trim() || !address.trim()) {
            setError('Shop name and address are required');
            return;
        }

        if (lat == null || lng == null) {
            setError('Please select your shop location on the map');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = authStorage.getToken();
            const res = await fetch(`${baseUrl}/api/shops`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: name.trim(), address: address.trim(), lat, lng }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Failed to create shop');
                return;
            }

            setSuccess(`"${name}" created successfully!`);
            onShopCreated();
            setTimeout(() => { resetForm(); onClose(); }, 1200);
        } catch (err) {
            console.error(err);
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-container" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>🏪 Create New Shop</h2>
                        <button className="modal-close" onClick={onClose}>&times;</button>
                    </div>

                    <form className="modal-form" onSubmit={handleSubmit}>
                        {error && <div className="form-error">{error}</div>}
                        {success && <div className="form-success">{success}</div>}

                        <div className="form-group">
                            <label htmlFor="shop-name">Shop Name *</label>
                            <input
                                id="shop-name"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Fresh Mart, Health Store"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="shop-address">Address *</label>
                            <input
                                id="shop-address"
                                type="text"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="e.g. 23 MG Road, Sector 5"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Shop Location *</label>
                            {lat != null && lng != null ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                                        📌 {lat.toFixed(4)}, {lng.toFixed(4)}
                                    </span>
                                    <button
                                        type="button"
                                        className="dash-btn dash-btn-outline"
                                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
                                        onClick={() => setShowMap(true)}
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="dash-btn dash-btn-outline"
                                    onClick={() => setShowMap(true)}
                                    style={{ width: '100%' }}
                                >
                                    📍 Pick Location on Map
                                </button>
                            )}
                        </div>

                        <button className="modal-submit" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating…' : '🏪 Create Shop'}
                        </button>
                    </form>
                </div>
            </div>

            {showMap && (
                <LocationPicker
                    initialLat={lat ?? undefined}
                    initialLng={lng ?? undefined}
                    onConfirm={(newLat, newLng) => {
                        setLat(newLat);
                        setLng(newLng);
                        setShowMap(false);
                    }}
                    onCancel={() => setShowMap(false)}
                />
            )}
        </>
    );
}
