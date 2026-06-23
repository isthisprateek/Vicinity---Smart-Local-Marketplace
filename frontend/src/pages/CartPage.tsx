import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authStorage } from '@/features/auth/services/auth.service';
import { openRazorpayCheckout } from '@/features/payment/razorpayService';
import { LocationPicker } from '@/features/location/LocationPicker';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import './CartPage.css';

// Fix Leaflet default icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// Custom coloured shop icon
function makeShopIcon(color: string) {
    return L.divIcon({
        html: `<div style="width:18px;height:18px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });
}

const buyerIcon = L.divIcon({
    html: `<div style="width:22px;height:22px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(16,185,129,0.6)"></div>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

const SHOP_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

// Demo coupons
const VALID_COUPONS: Record<string, { label: string; discount: number }> = {
    FIRST10: { label: '10% off your first order', discount: 0.10 },
    SAVE20: { label: '₹20 off', discount: 20 },
    SMART15: { label: '15% off via Smart Marketplace', discount: 0.15 },
};

interface ShopLocation {
    _id: string;
    name: string;
    address: string;
    location: { type: string; coordinates: [number, number] }; // [lng, lat]
}

// Auto-fit bounds helper
function FitBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 1) {
            map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
        } else if (positions.length === 1) {
            map.setView(positions[0], 14);
        }
    }, [positions, map]);
    return null;
}

export function CartPage() {
    const { items, addItem, removeItem, removeAllOfItem, clearCart, getCartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<null | { code: string; label: string; discount: number }>(null);
    const [couponError, setCouponError] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
    const [paymentId, setPaymentId] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [ratedShops, setRatedShops] = useState<string[]>([]);
    const [shopRatings, setShopRatings] = useState<Record<string, number>>({});

    // Delivery Address State
    const [deliveryAddress, setDeliveryAddress] = useState<string>('');
    const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isMapOpen, setIsMapOpen] = useState(false);

    // Shop locations for routing map
    const [shopLocations, setShopLocations] = useState<ShopLocation[]>([]);

    // Shop routes for road paths
    const [shopRoutes, setShopRoutes] = useState<Record<string, [number, number][]>>({});

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleLocationConfirm = (lat: number, lng: number, addr: string) => {
        setDeliveryLocation({ lat, lng });
        setDeliveryAddress(addr);
        setIsMapOpen(false);
        setPaymentError('');
    };

    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = getCartTotal();

    // Compute discount amount
    const discountAmount = appliedCoupon
        ? appliedCoupon.discount < 1
            ? Math.round(subtotal * appliedCoupon.discount)
            : appliedCoupon.discount
        : 0;
    const total = Math.max(0, subtotal - discountAmount);

    // Group items by Shop for Smart Splitting
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.shopName]) acc[item.shopName] = { id: item.shopId, items: [] };
        acc[item.shopName].items.push(item);
        return acc;
    }, {} as Record<string, { id: string, items: typeof items }>);

    const uniqueShops = Object.values(groupedItems).map(g => ({ shopId: g.id, shopName: g.items[0].shopName }));

    // Fetch shop coordinates whenever cart changes
    useEffect(() => {
        const shopIds = uniqueShops.map(s => s.shopId).filter(Boolean);
        if (shopIds.length === 0) { setShopLocations([]); return; }
        fetch(`${baseUrl}/api/shops/batch?ids=${shopIds.join(',')}`)
            .then(r => r.json())
            .then(d => setShopLocations(d.shops || []))
            .catch(() => setShopLocations([]));
    }, [items.length, baseUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch road routes for each shop to delivery location
    useEffect(() => {
        if (!deliveryLocation || shopLocations.length === 0) {
            setShopRoutes({});
            return;
        }

        let cancelled = false;

        const fetchAllRoutes = async () => {
            const routes: Record<string, [number, number][]> = {};
            const blat = deliveryLocation.lat;
            const blng = deliveryLocation.lng;

            for (const shop of shopLocations) {
                if (!shop.location?.coordinates) continue;
                const shopLat = shop.location.coordinates[1];
                const shopLng = shop.location.coordinates[0];

                try {
                    const url = `https://router.project-osrm.org/route/v1/driving/${shopLng},${shopLat};${blng},${blat}?overview=full&geometries=geojson`;
                    const res = await fetch(url);
                    const json = await res.json();
                    if (json.code === 'Ok' && json.routes?.[0]?.geometry?.coordinates) {
                        const coords: [number, number][] = json.routes[0].geometry.coordinates.map(
                            (c: number[]) => [c[1], c[0]] as [number, number]
                        );
                        if (coords.length >= 2) {
                            routes[shop._id] = coords;
                            continue;
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to fetch road route for shop ${shop._id}:`, e);
                }

                // Fallback to straight line
                routes[shop._id] = [[shopLat, shopLng], [blat, blng]];
            }

            if (!cancelled) {
                setShopRoutes(routes);
            }
        };

        fetchAllRoutes();

        return () => {
            cancelled = true;
        };
    }, [deliveryLocation, shopLocations]);

    // Build all marker positions and route coordinates for fitBounds
    const allPositions: [number, number][] = [
        ...(deliveryLocation ? [[deliveryLocation.lat, deliveryLocation.lng] as [number, number]] : []),
        ...shopLocations
            .filter(s => s.location?.coordinates)
            .map(s => [s.location.coordinates[1], s.location.coordinates[0]] as [number, number]),
        ...Object.values(shopRoutes).flat(),
    ];

    const handleApplyCoupon = () => {
        const code = couponCode.trim().toUpperCase();
        setCouponError('');
        if (!code) { setCouponError('Please enter a coupon code.'); return; }
        if (VALID_COUPONS[code]) {
            setAppliedCoupon({ code, ...VALID_COUPONS[code] });
        } else {
            setCouponError('Invalid or expired coupon code.');
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const handlePayment = async () => {
        const token = authStorage.getToken();
        if (!token) { setPaymentError('Please log in to continue.'); return; }
        if (total <= 0) { setPaymentError('Your cart total is ₹0. Add items with prices to proceed.'); return; }
        if (!deliveryLocation) { setPaymentError('Please select a delivery address on the map.'); return; }

        setPaymentStatus('loading');
        setPaymentError('');

        const result = await openRazorpayCheckout({
            amount: total,
            items,
            token,
            name: 'Smart Marketplace',
            description: `Order of ${itemCount} item${itemCount !== 1 ? 's' : ''}`,
            prefillName: user?.name || '',
            prefillEmail: user?.email || '',
            deliveryAddress,
            deliveryLocation,
        });

        if (result.success) {
            setPaymentStatus('success');
            setPaymentId(result.paymentId || '');
        } else {
            setPaymentStatus('failed');
            setPaymentError(result.message || 'Payment failed. Please try again.');
        }
    };

    const handleRateShop = async (shopId: string, rating: number) => {
        try {
            const token = authStorage.getToken() || '';
            await fetch(`${baseUrl}/api/shops/${shopId}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ rating })
            });
            setRatedShops([...ratedShops, shopId]);
        } catch (err) {
            console.error(err);
        }
    };

    if (items.length === 0 && paymentStatus !== 'success') {
        return (
            <div className="cart-page">
                <div className="cart-page-inner">
                    <div className="cart-empty-state">
                        <div className="cart-empty-icon">🛒</div>
                        <h2>Your cart is empty</h2>
                        <p>Search for products and add them to your cart.</p>
                        <button className="cart-checkout-btn" onClick={() => navigate('/buyer')}>
                            ← Back to Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="cart-page-inner">
                {/* Header */}
                <div className="cart-page-header">
                    <button className="cart-back-btn" onClick={() => navigate(-1)}>← Back</button>
                    <h1>Your Cart</h1>
                    <button className="cart-clear-btn" onClick={clearCart}>Clear All</button>
                </div>

                <div className="cart-page-grid">
                    {/* Left: Items */}
                    <div className="cart-items-section">
                        <div className="cart-items-card">
                            <h2 className="cart-section-title">🛍️ Items ({itemCount})</h2>
                            {Object.entries(groupedItems).map(([shopName, shopData]) => (
                                <div key={shopName} className="cart-shop-group" style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-color)', background: 'rgba(37, 99, 235, 0.08)', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        🏪 Delivery from {shopName}
                                    </h3>
                                    {shopData.items.map(item => <div key={item.name} className="cart-page-item">
                                        <div className="cart-page-item-info">
                                            <span className="cart-page-item-name">{item.name}</span>
                                            {item.price > 0 ? (
                                                <span className="cart-page-item-unit">₹{item.price} each</span>
                                            ) : (
                                                <span className="cart-page-item-note">Price shown at checkout</span>
                                            )}
                                        </div>
                                        <div className="cart-page-item-right">
                                            {item.price > 0 && (
                                                <span className="cart-page-item-subtotal">₹{item.price * item.quantity}</span>
                                            )}
                                            {paymentStatus !== 'success' && (
                                                <div className="cart-page-item-controls">
                                                    <button className="cart-ctrl-btn" onClick={() => removeItem(item.productId)} aria-label="Decrease quantity">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                    </button>
                                                    <span className="cart-ctrl-qty">{item.quantity}</span>
                                                    <button
                                                        className="cart-ctrl-btn"
                                                        onClick={() => addItem(item.productId, item.name, item.price, item.shopId, item.shopName, item.stock)}
                                                        disabled={item.quantity >= item.stock}
                                                        aria-label="Increase quantity"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                    </button>
                                                    <button className="cart-remove-btn" onClick={() => removeAllOfItem(item.productId)} aria-label="Remove item">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>)}
                                </div>
                            ))}
                        </div>

                        {/* ─── Delivery Route Map ─── */}
                        <div className="cart-route-map-card">
                            <h2 className="cart-section-title">🗺️ Delivery Route Map</h2>
                            {!deliveryLocation ? (
                                <div className="route-map-placeholder">
                                    <div className="route-map-placeholder-icon">📍</div>
                                    <p>Pick a delivery address above to see the route from each seller to your door.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="route-map-legend">
                                        <span className="legend-item buyer-legend">● Your Location</span>
                                        {shopLocations.map((shop, idx) => (
                                            <span key={shop._id} className="legend-item" style={{ color: SHOP_COLORS[idx % SHOP_COLORS.length] }}>
                                                ● {shop.name}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="route-map-container">
                                        <MapContainer
                                            center={[deliveryLocation.lat, deliveryLocation.lng]}
                                            zoom={13}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />

                                            {/* Buyer pin */}
                                            <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={buyerIcon}>
                                                <Popup>
                                                    <strong>📍 Your Delivery Location</strong><br />
                                                    <span style={{ fontSize: '0.8rem', color: '#475569' }}>{deliveryAddress}</span>
                                                </Popup>
                                            </Marker>

                                            {/* Shop pins + route lines */}
                                            {shopLocations.map((shop, idx) => {
                                                if (!shop.location?.coordinates) return null;
                                                const shopLat = shop.location.coordinates[1];
                                                const shopLng = shop.location.coordinates[0];
                                                const color = SHOP_COLORS[idx % SHOP_COLORS.length];
                                                const route = shopRoutes[shop._id] || [[shopLat, shopLng], [deliveryLocation.lat, deliveryLocation.lng]];
                                                return (
                                                    <div key={shop._id}>
                                                        <Marker
                                                            position={[shopLat, shopLng]}
                                                            icon={makeShopIcon(color)}
                                                        >
                                                            <Popup>
                                                                <strong>🏪 {shop.name}</strong><br />
                                                                <span style={{ fontSize: '0.8rem', color: '#475569' }}>{shop.address}</span>
                                                            </Popup>
                                                        </Marker>
                        <Polyline
                            positions={route}
                            pathOptions={{
                                color,
                                weight: 4,
                                opacity: 0.85,
                            }}
                        />
                    </div>
                );
            })}

            <FitBounds positions={allPositions} />
        </MapContainer>
    </div>
    <p className="route-map-note">
        Solid lines show estimated delivery routes from each seller to your address.
        {shopLocations.length > 0 && ` ${shopLocations.length} seller${shopLocations.length > 1 ? 's' : ''} will fulfil your order.`}
    </p>
                                </>
                            )}
                        </div>

                        {/* Delivery Address */}
                        <div className="cart-address-card">
                            <h2 className="cart-section-title">📍 Delivery Address</h2>

                            {user?.savedAddresses && user.savedAddresses.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Select from Saved Addresses</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {user.savedAddresses.map((addr: any) => (
                                            <button
                                                key={addr._id}
                                                style={{
                                                    padding: '0.75rem',
                                                    border: deliveryLocation?.lat === addr.lat && deliveryLocation?.lng === addr.lng ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    background: deliveryLocation?.lat === addr.lat && deliveryLocation?.lng === addr.lng ? '#f0fdf4' : 'white',
                                                    textAlign: 'left',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => {
                                                    setDeliveryLocation({ lat: addr.lat, lng: addr.lng });
                                                    setDeliveryAddress(addr.address);
                                                    setPaymentError('');
                                                }}
                                            >
                                                <strong>{addr.label}</strong>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>{addr.address}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ textAlign: 'center', margin: '0.75rem 0', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>OR</div>
                                </div>
                            )}

                            {deliveryLocation ? (
                                <div className="address-selected-box">
                                    <div className="address-selected-info">
                                        <p className="address-selected-text">{deliveryAddress}</p>
                                        <span className="address-coords">
                                            {deliveryLocation.lat.toFixed(4)}, {deliveryLocation.lng.toFixed(4)}
                                        </span>
                                    </div>
                                    <button className="address-change-btn" onClick={() => setIsMapOpen(true)}>
                                        Pick New Location
                                    </button>
                                </div>
                            ) : (
                                <button className="address-select-trigger" onClick={() => setIsMapOpen(true)}>
                                    <span className="trigger-icon">📍</span>
                                    <div className="trigger-text">
                                        <strong>Select Delivery Location</strong>
                                        <span>Click to pick your address on map</span>
                                    </div>
                                    <span className="trigger-arrow">›</span>
                                </button>
                            )}
                        </div>

                        {/* Coupon */}
                        <div className="cart-coupon-card">
                            <h2 className="cart-section-title">🏷️ Discount Coupon</h2>
                            {appliedCoupon ? (
                                <div className="coupon-applied">
                                    <div className="coupon-applied-info">
                                        <span className="coupon-tag">{appliedCoupon.code}</span>
                                        <span className="coupon-label">{appliedCoupon.label}</span>
                                    </div>
                                    <button className="coupon-remove-btn" onClick={handleRemoveCoupon}>
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="coupon-input-row">
                                        <input
                                            className="coupon-input"
                                            type="text"
                                            value={couponCode}
                                            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                                            placeholder="Enter coupon code"
                                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                        />
                                        <button className="coupon-apply-btn" onClick={handleApplyCoupon}>Apply</button>
                                    </div>
                                    {couponError && <p className="coupon-error">{couponError}</p>}
                                    <div className="coupon-hints">
                                        Try: <span onClick={() => setCouponCode('FIRST10')}>FIRST10</span>,{' '}
                                        <span onClick={() => setCouponCode('SAVE20')}>SAVE20</span>,{' '}
                                        <span onClick={() => setCouponCode('SMART15')}>SMART15</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="cart-summary-section">
                        <div className="cart-summary-card">
                            <h2 className="cart-section-title">📋 Order Summary</h2>

                            <div className="summary-row">
                                <span>Subtotal ({itemCount} items)</span>
                                <span>{subtotal > 0 ? `₹${subtotal}` : 'At checkout'}</span>
                            </div>
                            <div className="summary-row">
                                <span>Delivery fee</span>
                                <span className="summary-free">FREE</span>
                            </div>
                            {appliedCoupon && discountAmount > 0 && (
                                <div className="summary-row discount">
                                    <span>Discount ({appliedCoupon.code})</span>
                                    <span>−₹{discountAmount}</span>
                                </div>
                            )}

                            <div className="summary-divider" />

                            <div className="summary-row total">
                                <span>Total</span>
                                <span>{total > 0 ? `₹${total}` : 'Calculated at checkout'}</span>
                            </div>

                            {appliedCoupon && (
                                <div className="coupon-active-badge">
                                    🎉 Coupon <strong>{appliedCoupon.code}</strong> applied!
                                </div>
                            )}

                            {paymentStatus === 'success' ? (
                                <div className="payment-success">
                                    <div className="payment-success-icon">✅</div>
                                    <h3>Payment Successful!</h3>
                                    <p>Your order has been placed.</p>
                                    {paymentId && (
                                        <p className="payment-id">
                                            Ref: <code>{paymentId}</code>
                                        </p>
                                    )}
                                    <div style={{ marginTop: '1.5rem', textAlign: 'left', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                        <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: '#1e293b' }}>Rate Your Sellers</h4>
                                        {uniqueShops.map(shop => {
                                            const pendingRating = shopRatings[shop.shopId] || 0;
                                            return (
                                                <div key={shop.shopId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{shop.shopName}</span>
                                                    {ratedShops.includes(shop.shopId) ? (
                                                        <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Thanks for rating!</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                    <button
                                                                        key={star}
                                                                        onClick={() => setShopRatings((prev: Record<string, number>) => ({ ...prev, [shop.shopId]: star }))}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: star <= pendingRating ? '#fbbf24' : '#cbd5e1', padding: '0 2px' }}
                                                                    >★</button>
                                                                ))}
                                                            </div>
                                                            {pendingRating > 0 && (
                                                                <button
                                                                    onClick={() => handleRateShop(shop.shopId, pendingRating)}
                                                                    style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                                                                >Done</button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button
                                        className="cart-checkout-btn"
                                        onClick={() => { clearCart(); navigate('/buyer'); }}
                                        style={{ marginTop: '1rem' }}
                                    >Done</button>
                                </div>
                            ) : (
                                <>
                                    {paymentError && (
                                        <p className="payment-error">{paymentError}</p>
                                    )}
                                    <button
                                        className="cart-checkout-btn"
                                        onClick={handlePayment}
                                        disabled={paymentStatus === 'loading'}
                                    >
                                        {paymentStatus === 'loading'
                                            ? '⏳ Processing…'
                                            : total > 0
                                                ? `Pay ₹${total} →`
                                                : 'Proceed to Payment →'}
                                    </button>
                                </>
                            )}

                            <p className="cart-secure-note">🔒 Powered by Razorpay · Free delivery</p>
                        </div>
                    </div>
                </div>
            </div>

            {isMapOpen && (
                <LocationPicker
                    initialLat={deliveryLocation?.lat}
                    initialLng={deliveryLocation?.lng}
                    onConfirm={handleLocationConfirm}
                    onCancel={() => setIsMapOpen(false)}
                />
            )}
        </div>
    );
}
