import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authStorage } from '@/features/auth/services/auth.service';
import './OrderHistory.css';

interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

interface Order {
    _id: string;
    shopName: string;
    items: OrderItem[];
    totalAmount: number;
    status: string;
    deliveryAddress: string;
    deliveryLocation: {
        type: string;
        coordinates: [number, number]; // [lng, lat]
    };
    razorpayPaymentId?: string;
    createdAt: string;
}

export function OrderHistoryPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = authStorage.getToken();
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await fetch(`${baseUrl}/api/orders/buyer`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch orders');
                const data = await res.json();
                setOrders(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    if (isLoading) return <div className="orders-loading">Loading your orders...</div>;
    if (error) return <div className="orders-error">Error: {error}</div>;

    return (
        <div className="order-history-page">
            <div className="order-history-inner">
                <header className="orders-header">
                    <button className="back-btn" onClick={() => navigate('/buyer')}>← Back</button>
                    <h1>My Order History</h1>
                </header>

                {orders.length === 0 ? (
                    <div className="no-orders">
                        <span className="no-orders-icon">📦</span>
                        <h2>No orders yet</h2>
                        <p>Items you buy will appear here.</p>
                        <button className="shop-now-btn" onClick={() => navigate('/buyer')}>Shop Now</button>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div key={order._id} className="order-card">
                                <div className="order-card-header">
                                    <div className="order-shop">
                                        <span className="shop-icon">🏪</span>
                                        <strong>{order.shopName}</strong>
                                    </div>
                                    <div className="order-status-badge" data-status={order.status}>
                                        {order.status.toUpperCase()}
                                    </div>
                                </div>

                                <div className="order-items">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="order-item-row">
                                            <span>{item.name} x {item.quantity}</span>
                                            <span>₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                {order.deliveryAddress && (
                                    <div className="order-delivery-address">
                                        <span className="delivery-icon">📍 Delivery to:</span>
                                        <p className="delivery-text">{order.deliveryAddress}</p>
                                    </div>
                                )}

                                <div className="order-footer">
                                    <div className="order-meta">
                                        <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                                        {order.razorpayPaymentId && (
                                            <span className="payment-id">Ref: {order.razorpayPaymentId}</span>
                                        )}
                                    </div>
                                    <div className="order-total">
                                        <span>Total Amount</span>
                                        <strong>₹{order.totalAmount}</strong>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
