import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/context/AuthContext';
import './CartBar.css';

export function CartBar() {
    const { items, getItemCount, getCartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Hide on cart page or when user is not a buyer or cart is empty
    if (location.pathname === '/cart' || user?.role !== 'buyer' || items.length === 0) return null;

    const itemCount = getItemCount();
    const cartTotal = getCartTotal();

    return (
        <div className="cart-bar" role="complementary" aria-label="Cart summary">
            <div className="cart-bar-inner">
                <div className="cart-bar-info">
                    <span className="cart-bar-count-badge">{itemCount}</span>
                    <span className="cart-bar-label">
                        {itemCount === 1 ? '1 item' : `${itemCount} items`}
                        {cartTotal > 0 && <> · <strong>₹{cartTotal}</strong></>}
                    </span>
                </div>
                <button
                    className="cart-bar-btn"
                    onClick={() => navigate('/cart')}
                    aria-label="View cart"
                >
                    View Cart →
                </button>
            </div>
        </div>
    );
}
