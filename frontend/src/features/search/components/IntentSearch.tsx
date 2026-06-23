import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useCart } from '@/features/cart/CartContext';
import './IntentSearch.css';

interface ProductResult {
    productId: string;
    name: string;
    price: number;
    shopName: string;
    shopId: string;
    distance?: number;
    stock?: number;
}

interface GraphSearchResponse {
    intent: string;
    products: ProductResult[];
}

interface IntentSearchProps {
    onAdd?: (product: ProductResult) => void;
    customAddText?: string;
    customAddAllText?: string;
}

export function IntentSearch({ onAdd, customAddText, customAddAllText }: IntentSearchProps = {}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GraphSearchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

    const debouncedQuery = useDebounce(query, 500);
    const containerRef = useRef<HTMLDivElement>(null);
    const { addItem, isInCart } = useCart();

    // Get buyer location from localStorage
    const getLocation = () => {
        try {
            const raw = localStorage.getItem('smart_marketplace_location');
            if (raw) return JSON.parse(raw);
        } catch { /* ignore */ }
        return null;
    };

    // Call graph search API when debounced query changes
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults(null);
            setIsLoading(false);
            setIsOpen(false);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            setIsOpen(true);
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const loc = getLocation();
                let url = `${baseUrl}/api/graph-search?q=${encodeURIComponent(debouncedQuery)}`;
                if (loc) url += `&lat=${loc.lat}&lng=${loc.lng}`;

                const res = await fetch(url);
                if (!res.ok) throw new Error('Search failed');

                const data: GraphSearchResponse = await res.json();
                setResults(data);
                setAddedItems(new Set());
                setIsOpen(true);
            } catch (err) {
                console.error('Failed to fetch search results:', err);
                setResults(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = () => {
        setQuery('');
        setResults(null);
        setIsOpen(false);
    };

    const handleAddToCart = (product: ProductResult) => {
        if (onAdd) {
            onAdd(product);
        } else {
            addItem(product.productId, product.name, product.price, product.shopId, product.shopName, product.stock || 100);
        }
        setAddedItems(prev => new Set(prev).add(product.productId));
        setTimeout(() => {
            setAddedItems(prev => {
                const next = new Set(prev);
                next.delete(product.productId);
                return next;
            });
        }, 1500);
    };

    const hasProducts = results && results.products.length > 0;

    return (
        <div className="intent-search-container" ref={containerRef}>
            {/* Dark overlay backdrop when search is active */}

            <div className="search-bar-wrapper">
                <span className="search-bar-icon">🤖</span>
                <input
                    className="search-input"
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!e.target.value) {
                            setResults(null);
                            setIsOpen(false);
                        }
                    }}
                    onFocus={() => { if (results) setIsOpen(true); }}
                    placeholder='Search Items here'
                />
                {query && (
                    <button className="search-clear" onClick={handleClear} aria-label="Clear search">
                        &times;
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (isLoading || results) && (
                <div className="search-dropdown">
                    {isLoading ? (
                        <div className="dropdown-loading">
                            <div className="spinner"></div>
                            <span>Searching …</span>
                        </div>
                    ) : results ? (
                        <>
                            <div className="results-list">
                                {!hasProducts ? (
                                    <div className="no-results">
                                        No products found
                                    </div>
                                ) : (
                                    results.products.map((product, index) => (
                                        <div key={index} className="result-item">
                                            <div className="result-info">
                                                <span className="result-name">{product.name}</span>
                                                <span className="result-price">₹{product.price}</span>
                                                {product.shopName && (
                                                    <span className="result-shop">{product.shopName}{product.distance != null ? ` · ${product.distance.toFixed(1)} km` : ''}</span>
                                                )}
                                            </div>
                                            <button
                                                className={`add-to-cart-btn ${addedItems.has(product.productId) ? 'added' : ''} ${(!onAdd && isInCart(product.productId) && !addedItems.has(product.productId)) ? 'in-cart' : ''}`}
                                                onClick={() => handleAddToCart(product)}
                                            >
                                                {addedItems.has(product.productId) ? '✓ Added!' : (onAdd ? (customAddText || '+ Add') : (isInCart(product.productId) ? '+ Add More' : '+ Add to Cart'))}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {hasProducts && (
                                <div className="dropdown-footer">
                                    <button
                                        className="add-all-btn"
                                        onClick={() => {
                                            results.products.forEach(p => handleAddToCart(p));
                                        }}
                                    >
                                        {customAddAllText || '🛒 Add All to Cart'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
}
