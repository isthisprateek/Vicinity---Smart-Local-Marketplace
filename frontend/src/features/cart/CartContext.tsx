import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    shopId: string;
    shopName: string;
    quantity: number;
    stock: number;
}

interface CartContextValue {
    items: CartItem[];
    addItem: (productId: string, name: string, price: number, shopId: string, shopName: string, maxStock: number) => void;
    removeItem: (productId: string) => void;
    removeAllOfItem: (productId: string) => void;
    clearCart: () => void;
    getItemCount: () => number;
    getCartTotal: () => number;
    isInCart: (productId: string) => boolean;
}

const CART_KEY = 'sm_cart';

function loadCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCart(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(loadCart);

    const addItem = useCallback((productId: string, name: string, price: number, shopId: string, shopName: string, maxStock: number) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === productId);
            let next: CartItem[];
            if (existing) {
                if (existing.quantity >= maxStock) {
                    alert('Cannot add more of this item, stock limit reached.');
                    return prev;
                }
                next = prev.map(i =>
                    i.productId === productId
                        ? { ...i, quantity: i.quantity + 1, price, stock: maxStock }
                        : i
                );
            } else {
                if (maxStock <= 0) {
                    alert('Item is out of stock.');
                    return prev;
                }
                next = [...prev, { productId, name, price, shopId, shopName, quantity: 1, stock: maxStock }];
            }
            saveCart(next);
            return next;
        });
    }, []);

    const removeItem = useCallback((productId: string) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === productId);
            let next: CartItem[];
            if (existing && existing.quantity > 1) {
                next = prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i);
            } else {
                next = prev.filter(i => i.productId !== productId);
            }
            saveCart(next);
            return next;
        });
    }, []);

    const removeAllOfItem = useCallback((productId: string) => {
        setItems(prev => {
            const next = prev.filter(i => i.productId !== productId);
            saveCart(next);
            return next;
        });
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
        localStorage.removeItem(CART_KEY);
    }, []);

    const getItemCount = useCallback(() => {
        return items.reduce((sum, i) => sum + i.quantity, 0);
    }, [items]);

    const getCartTotal = useCallback(() => {
        return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    }, [items]);

    const isInCart = useCallback((productId: string) => {
        return items.some(i => i.productId === productId);
    }, [items]);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, removeAllOfItem, clearCart, getItemCount, getCartTotal, isInCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextValue {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
