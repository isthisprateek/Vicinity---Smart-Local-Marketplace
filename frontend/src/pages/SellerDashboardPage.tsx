import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authStorage } from '@/features/auth/services/auth.service';
import { AddProductModal } from '@/features/seller/components/AddProductModal';
import { ShopSelector } from '@/features/seller/components/ShopSelector';
import { CreateShopModal } from '@/features/seller/components/CreateShopModal';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/styles/dashboard.css';

// Fix Leaflet icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

function OrderMapModal({ address, location, onClose }: { address: string, location: [number, number], onClose: () => void }) {
    // Leaflet uses [lat, lng], but GeoJSON stores as [lng, lat]
    const position: [number, number] = [location[1], location[0]];

    return (
        <div className="location-picker-overlay" onClick={onClose}>
            <div className="location-picker-container" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                <div className="location-picker-header">
                    <h2>🗺️ Delivery Location</h2>
                    <button className="location-picker-close" onClick={onClose}>&times;</button>
                </div>
                <div className="location-picker-map" style={{ height: '400px' }}>
                    <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={position}>
                            <Popup>{address}</Popup>
                        </Marker>
                    </MapContainer>
                </div>
                <div className="location-picker-coords" style={{ textAlign: 'left', padding: '1rem 1.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-color)', display: 'block', textTransform: 'uppercase' }}>Delivery Address</span>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.95rem', fontWeight: 500 }}>{address}</p>
                </div>
                <div className="location-picker-actions">
                    <button className="location-picker-confirm" onClick={onClose}>Close Map</button>
                </div>
            </div>
        </div>
    );
}

interface ProductItem {
    _id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
    description: string;
}

interface ShopItem {
    _id: string;
    name: string;
    address: string;
}

interface OrderItemInfo {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

interface Order {
    _id: string;
    shopName: string;
    items: OrderItemInfo[];
    totalAmount: number;
    status: string;
    deliveryAddress?: string;
    deliveryLocation?: {
        type: string;
        coordinates: [number, number];
    };
    createdAt: string;
}

export function SellerDashboardPage() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] ?? 'Seller';
    const [shops, setShops] = useState<ShopItem[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isShopModalOpen, setIsShopModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ price: 0, stock: 0 });
    const [mapOrderDetail, setMapOrderDetail] = useState<{ address: string, location: [number, number] } | null>(null);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchShops = useCallback(async () => {
        try {
            const token = authStorage.getToken();
            const res = await fetch(`${baseUrl}/api/shops/my`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            const shopList = data.shops || [];
            setShops(shopList);
            // Auto-select first shop if none selected
            if (shopList.length > 0 && !selectedShopId) {
                setSelectedShopId(shopList[0]._id);
            }
        } catch (err) {
            console.error('Failed to fetch shops:', err);
        }
    }, [baseUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchProducts = useCallback(async () => {
        if (!selectedShopId) {
            setProducts([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const token = authStorage.getToken();
            const res = await fetch(`${baseUrl}/api/products/my?shopId=${selectedShopId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            setProducts(data.products || []);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setIsLoading(false);
        }
    }, [baseUrl, selectedShopId]);

    const fetchOrders = useCallback(async () => {
        if (!selectedShopId) {
            setOrders([]);
            return;
        }
        try {
            const token = authStorage.getToken();
            const res = await fetch(`${baseUrl}/api/orders/seller?shopId=${selectedShopId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            setOrders(data || []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        }
    }, [baseUrl, selectedShopId]);

    useEffect(() => { fetchShops(); }, [fetchShops]);
    useEffect(() => { fetchProducts(); }, [fetchProducts]);
    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        setDeletingId(id);
        try {
            const token = authStorage.getToken();
            await fetch(`${baseUrl}/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            fetchProducts();
        } catch (err) {
            console.error('Failed to delete product:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditStart = (item: ProductItem) => {
        setEditingId(item._id);
        setEditForm({ price: item.price, stock: item.stock });
    };

    const handleEditSave = async (id: string) => {
        try {
            const token = authStorage.getToken();
            await fetch(`${baseUrl}/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            setEditingId(null);
            fetchProducts();
        } catch (err) {
            console.error('Failed to update product:', err);
        }
    };

    const handleEditCancel = () => {
        setEditingId(null);
    };

    const handleMarkDelivered = async (orderId: string) => {
        try {
            const token = authStorage.getToken();
            await fetch(`${baseUrl}/api/orders/seller/${orderId}/deliver`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchOrders();
            fetchProducts();
        } catch (err) {
            console.error('Failed to mark delivered:', err);
        }
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0) return { label: 'Out of Stock', className: 'stock-out' };
        if (stock <= 3) return { label: 'Low Stock', className: 'stock-low' };
        return { label: 'In Stock', className: 'stock-ok' };
    };

    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 3).length;

    return (
        <div className="dashboard-page">
            <div className="container">
                {/* ─── Header ─── */}
                <div className="dashboard-header">
                    <h1>Welcome back, {firstName} 🏪</h1>
                    <p>Manage your stores, track inventory, and grow your local business.</p>
                </div>

                {/* ─── Shop Selector ─── */}
                <ShopSelector
                    shops={shops}
                    selectedShopId={selectedShopId}
                    onSelect={(id) => setSelectedShopId(id)}
                    onCreateNew={() => setIsShopModalOpen(true)}
                />

                {selectedShopId && (
                    <>
                        {/* ─── Stats ─── */}
                        <div className="stat-row">
                            <div className="stat-card">
                                <span className="stat-icon">📦</span>
                                <span className="stat-label">Total Products</span>
                                <span className="stat-value">{totalProducts}</span>
                                <span className="stat-sub">{totalProducts === 0 ? 'No products yet' : `${totalProducts} listed`}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">🛒</span>
                                <span className="stat-label">Total Orders</span>
                                <span className="stat-value">{orders.length}</span>
                                <span className="stat-sub">{orders.length === 0 ? 'No orders yet' : 'Total sales'}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">💰</span>
                                <span className="stat-label">Total Revenue</span>
                                <span className="stat-value">₹{orders.reduce((sum, o) => sum + o.totalAmount, 0)}</span>
                                <span className="stat-sub">Lifetime earnings</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">⚠️</span>
                                <span className="stat-label">Low Stock</span>
                                <span className="stat-value" style={{ color: lowStockCount > 0 ? '#d97706' : undefined }}>{lowStockCount}</span>
                                <span className="stat-sub">{lowStockCount === 0 ? 'All good' : 'Needs attention'}</span>
                            </div>
                        </div>

                        {/* ─── Main Grid ─── */}
                        <div className="dashboard-grid sidebar">
                            {/* Left column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* Inventory Summary */}
                                <div className="dash-panel">
                                    <div className="dash-panel-header">
                                        <h2 className="dash-panel-title">📦 Inventory</h2>
                                        <button
                                            className="dash-btn dash-btn-primary"
                                            onClick={() => setIsProductModalOpen(true)}
                                        >
                                            ➕ Add Product
                                        </button>
                                    </div>

                                    {isLoading ? (
                                        <div className="empty-state">
                                            <span className="empty-state-icon">⏳</span>
                                            <p className="empty-state-text">Loading products…</p>
                                        </div>
                                    ) : products.length === 0 ? (
                                        <div className="empty-state">
                                            <span className="empty-state-icon">📦</span>
                                            <p className="empty-state-text">No products in this shop yet. Add your first product!</p>
                                            <button className="dash-btn dash-btn-primary" onClick={() => setIsProductModalOpen(true)}>
                                                Add Your First Product
                                            </button>
                                        </div>
                                    ) : (
                                        <table className="inventory-table">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Category</th>
                                                    <th>Price</th>
                                                    <th>Stock</th>
                                                    <th>Status</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.map(item => {
                                                    const status = getStockStatus(item.stock);
                                                    const isEditing = editingId === item._id;
                                                    return (
                                                        <tr key={item._id}>
                                                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                                                            <td><span className="category-badge">{item.category}</span></td>
                                                            <td>
                                                                {isEditing ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                        ₹<input type="number" min="0" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} style={{ width: '60px', marginLeft: '0.2rem', padding: '0.2rem' }} />
                                                                    </div>
                                                                ) : (
                                                                    `₹${item.price}`
                                                                )}
                                                            </td>
                                                            <td>
                                                                {isEditing ? (
                                                                    <input type="number" min="0" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })} style={{ width: '60px', padding: '0.2rem' }} />
                                                                ) : (
                                                                    item.stock
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className={`stock-badge ${status.className}`}>
                                                                    {status.label}
                                                                </span>
                                                            </td>
                                                            <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                {isEditing ? (
                                                                    <>
                                                                        <button onClick={() => handleEditSave(item._id)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.5rem' }}>Save</button>
                                                                        <button onClick={handleEditCancel} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.5rem' }}>Cancel</button>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleEditStart(item)}
                                                                        title="Edit Inventory"
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                                                                    >
                                                                        ✏️
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="delete-btn"
                                                                    onClick={() => handleDelete(item._id)}
                                                                    disabled={deletingId === item._id}
                                                                    title="Delete product"
                                                                >
                                                                    {deletingId === item._id ? '…' : '🗑️'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Recent Orders */}
                                <div className="dash-panel">
                                    <div className="dash-panel-header">
                                        <h2 className="dash-panel-title">🧾 Recent Orders</h2>
                                    </div>
                                    {orders.length === 0 ? (
                                        <div className="empty-state">
                                            <span className="empty-state-icon">🧾</span>
                                            <p className="empty-state-text">No orders received yet. Orders from buyers will appear here.</p>
                                        </div>
                                    ) : (
                                        <div className="mini-orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
                                            {orders.slice(0, 5).map(order => (
                                                <div key={order._id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{order.shopName}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {order.status !== 'delivered' && (
                                                                <button
                                                                    onClick={() => handleMarkDelivered(order._id)}
                                                                    style={{ border: 'none', background: '#3b82f6', color: 'white', borderRadius: '4px', padding: '0.15rem 0.4rem', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                                                                >
                                                                    Mark Delivered
                                                                </button>
                                                            )}
                                                            <span className="order-status-badge" data-status={order.status} style={{ fontSize: '0.65rem' }}>{order.status.toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                        {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                                                    </div>

                                                    {order.deliveryAddress && (
                                                        <div style={{ marginTop: '0.6rem', padding: '0.5rem', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                                                <span style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>📍 Delivery Address</span>
                                                                {order.deliveryLocation && (
                                                                    <button
                                                                        onClick={() => setMapOrderDetail({ address: order.deliveryAddress!, location: order.deliveryLocation!.coordinates })}
                                                                        style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', fontSize: '0.7rem', padding: '0' }}
                                                                    >
                                                                        View Map
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p style={{ margin: 0, color: '#1e293b', fontWeight: 500, lineHeight: 1.3 }}>{order.deliveryAddress}</p>
                                                        </div>
                                                    )}

                                                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                        <strong style={{ color: '#059669' }}>₹{order.totalAmount}</strong>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right sidebar */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* QR Barcode Feature */}
                                <div className="dash-panel">
                                    <div className="dash-panel-header">
                                        <h2 className="dash-panel-title">📷 QR Inventory</h2>
                                        <span style={{ fontSize: '0.72rem', background: 'rgba(37,99,235,0.1)', color: 'var(--primary-color)', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px' }}>
                                            Coming Soon
                                        </span>
                                    </div>
                                    <div className="barcode-placeholder">
                                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.35 }}>
                                            <rect x="4" y="4" width="28" height="28" rx="3" stroke="#2563eb" strokeWidth="3" fill="none" />
                                            <rect x="11" y="11" width="14" height="14" rx="1" fill="#2563eb" />
                                            <rect x="48" y="4" width="28" height="28" rx="3" stroke="#2563eb" strokeWidth="3" fill="none" />
                                            <rect x="55" y="11" width="14" height="14" rx="1" fill="#2563eb" />
                                            <rect x="4" y="48" width="28" height="28" rx="3" stroke="#2563eb" strokeWidth="3" fill="none" />
                                            <rect x="11" y="55" width="14" height="14" rx="1" fill="#2563eb" />
                                        </svg>
                                        <p>Scan a product's QR code to instantly update stock levels — no manual entry needed.</p>
                                        <button className="dash-btn dash-btn-outline" disabled style={{ opacity: 0.6, cursor: 'default' }}>
                                            Open Scanner
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="dash-panel">
                                    <div className="dash-panel-header">
                                        <h2 className="dash-panel-title">⚡ Quick Actions</h2>
                                    </div>
                                    <div className="quick-actions">
                                        <button className="quick-action-item" onClick={() => setIsProductModalOpen(true)}>
                                            <div className="quick-action-icon">➕</div>
                                            <div className="quick-action-text">
                                                <strong>Add Product</strong>
                                                <span>List a new item for sale</span>
                                            </div>
                                            <span className="quick-action-arrow">›</span>
                                        </button>
                                        <button className="quick-action-item" onClick={() => setIsShopModalOpen(true)}>
                                            <div className="quick-action-icon">🏪</div>
                                            <div className="quick-action-text">
                                                <strong>Create Shop</strong>
                                                <span>Add another shop location</span>
                                            </div>
                                            <span className="quick-action-arrow">›</span>
                                        </button>
                                        <button className="quick-action-item" disabled style={{ opacity: 0.55 }}>
                                            <div className="quick-action-icon">📊</div>
                                            <div className="quick-action-text">
                                                <strong>View Analytics</strong>
                                                <span>⏳ Coming soon</span>
                                            </div>
                                            <span className="quick-action-arrow">›</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Add Product Modal */}
            <AddProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onProductAdded={fetchProducts}
                shopId={selectedShopId}
            />

            {/* Create Shop Modal */}
            <CreateShopModal
                isOpen={isShopModalOpen}
                onClose={() => setIsShopModalOpen(false)}
                onShopCreated={() => { fetchShops(); }}
            />

            {/* Order Map Modal */}
            {mapOrderDetail && (
                <OrderMapModal
                    address={mapOrderDetail.address}
                    location={mapOrderDetail.location}
                    onClose={() => setMapOrderDetail(null)}
                />
            )}
        </div>
    );
}
