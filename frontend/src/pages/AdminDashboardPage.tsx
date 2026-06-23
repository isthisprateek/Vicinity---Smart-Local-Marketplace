import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authStorage } from '@/features/auth/services/auth.service';
import './AdminDashboardPage.css';

export function AdminDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = authStorage.getToken() || '';
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await fetch(`${baseUrl}/api/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setStats(data);
                } else {
                    setError(data.message || 'Failed to fetch dashboard data');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load dashboard.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    if (!user) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Please log in to view the dashboard.</div>;
    }

    if (user.email !== 'abc@gmail.com') {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Unauthorized access. Admins only.</div>;
    }

    if (loading) {
        return <div style={{ padding: '4rem', textAlign: 'center' }}><div className="loader">Loading...</div></div>;
    }

    if (error) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>Owner Analytics Dashboard</h1>
                <p>Real-time insights on your marketplace's performance</p>
            </div>

            <div className="admin-grid">
                {/* Fastest Selling Items */}
                <div className="admin-card">
                    <h2>🚀 Fastest Selling Items</h2>
                    <p className="admin-card-sub">Top 10 products flying off the shelves</p>
                    <div className="admin-list">
                        {stats?.fastestSellingItems?.length > 0 ? (
                            stats.fastestSellingItems.map((item: any, idx: number) => (
                                <div key={item._id} className="admin-list-item">
                                    <div className="admin-item-rank">#{idx + 1}</div>
                                    <div className="admin-item-details">
                                        <div className="admin-item-name">{item.name}</div>
                                        <div className="admin-item-meta">
                                            {item.totalSold} sold · Revenue: ₹{item.revenue}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="admin-empty">No sales data available yet.</div>
                        )}
                    </div>
                </div>

                {/* Top Rated Shops */}
                <div className="admin-card">
                    <h2>⭐ Top Rated Shops</h2>
                    <p className="admin-card-sub">Highest customer rated stores in the city</p>
                    <div className="admin-list">
                        {stats?.topRatedShops?.length > 0 ? (
                            stats.topRatedShops.map((shop: any, idx: number) => (
                                <div key={shop._id} className="admin-list-item">
                                    <div className="admin-item-rank">#{idx + 1}</div>
                                    <div className="admin-item-details">
                                        <div className="admin-item-name">{shop.name}</div>
                                        <div className="admin-item-meta">
                                            ⭐ {shop.rating.toFixed(1)}/5.0 ({shop.ratingCount} reviews) · {shop.address}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="admin-empty">No ratings available yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
