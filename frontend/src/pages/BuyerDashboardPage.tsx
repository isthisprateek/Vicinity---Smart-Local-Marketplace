import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { useLocation } from '@/features/location/LocationContext';
import { LocationPicker } from '@/features/location/LocationPicker';
import { RecipeBot } from '@/features/agent/components/RecipeBot';
import { IntentSearch } from '@/features/search/components/IntentSearch';
import type { NearbyShop } from '@/features/location/types';
import '@/styles/dashboard.css';
import { authStorage } from '@/features/auth/services/auth.service';

const QUICK_LINKS = [
    { icon: '🤖', label: 'AI Shopping', sub: 'Describe what you need', action: 'OPEN_AI' },
    { icon: '📦', label: 'My Orders', sub: 'Track active orders', to: '/orders' },
];

export function BuyerDashboardPage() {
    const { user } = useAuth();
    const { items: cartItems, addItem, getItemCount } = useCart();
    const { location, setLocation, isPickerOpen, openPicker, closePicker } = useLocation();
    const [nearbyShops, setNearbyShops] = useState<NearbyShop[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [exploreProducts, setExploreProducts] = useState<any[]>([]);
    const [feedItems, setFeedItems] = useState<any[]>([]);
    const [shopsLoading, setShopsLoading] = useState(false);
    const firstName = user?.name?.split(' ')[0] ?? 'Buyer';
    const cartCount = getItemCount();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchOrders = useCallback(async () => {
        try {
            const token = authStorage.getToken();
            const res = await fetch(`${baseUrl}/api/orders/buyer`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        }
    }, [baseUrl]);



    const fetchExploreProducts = useCallback(async () => {
        try {
            const res = await fetch(`${baseUrl}/api/products/explore`);
            if (res.ok) {
                const data = await res.json();
                setExploreProducts(data.products || []);
            }
        } catch (err) {
            console.error('Failed to fetch explore products:', err);
        }
    }, [baseUrl]);

    const fetchNearbyShops = useCallback(async () => {
        if (!location) return;
        setShopsLoading(true);
        try {
            const res = await fetch(`${baseUrl}/api/shops/nearby?lat=${location.lat}&lng=${location.lng}`);
            const data = await res.json();
            setNearbyShops(data.shops || []);
        } catch (err) {
            console.error('Failed to fetch nearby shops:', err);
        } finally {
            setShopsLoading(false);
        }
    }, [baseUrl, location]);

    useEffect(() => {
        fetchNearbyShops();
        fetchOrders();
        fetchExploreProducts();
    }, [fetchNearbyShops, fetchOrders, fetchExploreProducts]);

    useEffect(() => {
        const recentIds = new Set();
        orders.forEach(o => {
            o.items?.forEach((i: any) => {
                if (i.productId) recentIds.add(i.productId.toString());
            });
        });

        const feed = exploreProducts.map(p => ({
            ...p,
            displayCategory: recentIds.has(p._id.toString()) ? 'Recently Bought' : (p.category || 'Trending')
        }));

        setFeedItems(feed.slice(0, 10));
    }, [orders, exploreProducts]);

    const handleLocationConfirm = (lat: number, lng: number) => {
        setLocation({ lat, lng });
        closePicker();
    };

    const currentMonthExpense = orders.reduce((sum, order) => {
        if (!order.createdAt) return sum;
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
            return sum + (order.totalAmount || 0);
        }
        return sum;
    }, 0);

    return (
        <div className="dashboard-page">
            <div className="container">
                {/* ─── Header ─── */}
                <div className="dashboard-header">
                    <h1>Good day, {firstName} 👋</h1>
                    <p>Here's your personalised Smart Marketplace hub.</p>
                </div>

                {/* ─── Delivery Location ─── */}
                <div className="location-bar">
                    <div className="location-bar-info">
                        <span className="location-bar-icon">📍</span>
                        {location ? (
                            <span className="location-bar-text">
                                Delivering to: <strong>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</strong>
                            </span>
                        ) : (
                            <span className="location-bar-text">No delivery location set</span>
                        )}
                    </div>
                    <button className="location-bar-btn" onClick={openPicker}>
                        {location ? 'Change' : 'Set Location'}
                    </button>
                </div>

                {/* ─── Stats ─── */}
                <div className="stat-row">
                    <div className="stat-card">
                        <span className="stat-icon">📦</span>
                        <span className="stat-label">Total Orders</span>
                        <span className="stat-value">{orders.length}</span>
                        <span className="stat-sub">{orders.length === 0 ? 'No orders yet' : `${orders.length} orders placed`}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">🛒</span>
                        <span className="stat-label">Cart Items</span>
                        <span className="stat-value">{cartCount}</span>
                        <span className="stat-sub">{cartCount === 0 ? 'Cart is empty' : `${cartItems.length} unique item${cartItems.length !== 1 ? 's' : ''}`}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">💸</span>
                        <span className="stat-label">This Month</span>
                        <span className="stat-value">₹{currentMonthExpense.toFixed(0)}</span>
                        <span className="stat-sub">Total expenses this month</span>
                    </div>
                </div>

                {/* ─── Main Grid ─── */}
                <div className="dashboard-grid sidebar">
                    {/* Left column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* AI Search Bar */}
                        <div className="dash-panel" style={{ overflow: 'visible', zIndex: 10 }}>
                            <div className="dash-panel-header">
                                <h2 className="dash-panel-title">🔍 Quick Search</h2>
                            </div>
                            <IntentSearch />
                        </div>

                        {/* Smart Product Feed */}
                        <div className="dash-panel">
                            <div className="dash-panel-header">
                                <h2 className="dash-panel-title">✨ Recommended for You</h2>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                                    {feedItems.length > 0 ? `Showing ${feedItems.length} items` : ''}
                                </span>
                            </div>
                            {feedItems.length === 0 ? (
                                <div className="empty-state">
                                    <span className="empty-state-icon">🛍️</span>
                                    <p className="empty-state-text">No recommendations available right now.</p>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                    gap: '1rem',
                                    padding: '1rem'
                                }}>
                                    {feedItems.map(item => (
                                        <div key={item._id} style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            background: '#fff',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', lineHeight: '1.2' }}>{item.name}</span>
                                                <span style={{
                                                    background: item.displayCategory === 'Recently Bought' ? '#dcfce7' : '#dbeafe',
                                                    color: item.displayCategory === 'Recently Bought' ? '#166534' : '#1e3a8a',
                                                    fontSize: '0.65rem',
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    whiteSpace: 'nowrap',
                                                    marginLeft: '0.5rem'
                                                }}>
                                                    {item.displayCategory}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.shop?.name || 'Local Shop'}</span>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem' }}>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}>₹{item.price}</span>
                                                <button
                                                    onClick={() => addItem(item._id, item.name, item.price, item.shop?._id || 'unknown', item.shop?.name || 'Local Shop', item.stock || 100)}
                                                    style={{
                                                        background: 'var(--primary-color)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.5rem 0.8rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'transform 0.1s'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>


                    </div>

                    {/* Right sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Quick Actions */}
                        <div className="dash-panel">
                            <div className="dash-panel-header">
                                <h2 className="dash-panel-title">⚡ Quick Actions</h2>
                            </div>
                            <div className="quick-actions">
                                {QUICK_LINKS.map((item) => {
                                    const content = (
                                        <button
                                            className="quick-action-item"
                                            onClick={item.action === 'OPEN_AI' ? () => window.dispatchEvent(new Event('open-recipe-bot')) : undefined}
                                        >
                                            <div className="quick-action-icon">{item.icon}</div>
                                            <div className="quick-action-text">
                                                <strong>{item.label}</strong>
                                                <span>{item.sub}</span>
                                            </div>
                                            <span className="quick-action-arrow">›</span>
                                        </button>
                                    );

                                    return item.to ? (
                                        <Link to={item.to} key={item.label} style={{ textDecoration: 'none' }}>
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={item.label}>{content}</div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Nearby Sellers — LIVE */}
                        <div className="dash-panel">
                            <div className="dash-panel-header">
                                <h2 className="dash-panel-title">📍 Nearby Sellers</h2>
                            </div>
                            {!location ? (
                                <div className="empty-state">
                                    <span className="empty-state-icon">📍</span>
                                    <p className="empty-state-text">Set your location to discover sellers near you.</p>
                                    <button className="dash-btn dash-btn-outline" onClick={openPicker}>Set Location</button>
                                </div>
                            ) : shopsLoading ? (
                                <div className="empty-state">
                                    <span className="empty-state-icon">⏳</span>
                                    <p className="empty-state-text">Loading nearby shops…</p>
                                </div>
                            ) : nearbyShops.length === 0 ? (
                                <div className="empty-state">
                                    <span className="empty-state-icon">🏪</span>
                                    <p className="empty-state-text">No shops found near your location.</p>
                                </div>
                            ) : (
                                <div className="nearby-shops-list">
                                    {nearbyShops.map(shop => (
                                        <div key={shop._id} className="nearby-shop-item">
                                            <div className="nearby-shop-info">
                                                <span className="nearby-shop-name">{shop.name}</span>
                                                <span className="nearby-shop-address">{shop.address}</span>
                                            </div>
                                            <span className="nearby-shop-distance">{shop.distance} km</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Location Picker Modal */}
            {isPickerOpen && (
                <LocationPicker
                    initialLat={location?.lat}
                    initialLng={location?.lng}
                    onConfirm={handleLocationConfirm}
                    onCancel={closePicker}
                />
            )}

            {/* Floating Recipe Bot */}
            <RecipeBot />
        </div>
    );
}
