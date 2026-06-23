import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/features/cart/CartContext';
import { useLocation } from '@/features/location/LocationContext';
import { IntentSearch } from '@/features/search/components/IntentSearch';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './RecipeBot.css';

interface ProductResult {
    productId: string;
    name: string;
    price: number;
    shopName: string;
    shopId: string;
    distance?: number;
    amountNeeded: number;
    unitNeeded: string;
    stock?: number;
}

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    products?: ProductResult[];
    missingIngredients?: string[];
}

export function RecipeBot() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'bot', text: 'Hi! Tell me what you want to cook or bake, and I will find the ingredients for you.' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // Floating widget state

    // Inline Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeMsgIdForSearch, setActiveMsgIdForSearch] = useState<string | null>(null);
    const [swapTarget, setSwapTarget] = useState<{ msgId: string, oldProductId: string } | null>(null);

    // Maintain a local mutable state for products shown in the chat
    const [editableProducts, setEditableProducts] = useState<Record<string, ProductResult[]>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { addItem, isInCart } = useCart();
    const { location } = useLocation();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, editableProducts, isOpen]);

    // Listen for custom open event
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-recipe-bot', handleOpen);
        return () => window.removeEventListener('open-recipe-bot', handleOpen);
    }, []);

    // Fetch chat history on mount
    useEffect(() => {
        const fetchHistory = async () => {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('sm_token');
            if (!token) return;

            try {
                const res = await fetch(`${baseUrl}/api/recipe-bot/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.messages && data.messages.length > 0) {
                        // Prepend the welcome message
                        setMessages([
                            { id: '1', role: 'bot', text: 'Hi! Tell me what you want to cook or bake, and I will find the ingredients for you.' },
                            ...data.messages
                        ]);

                        // Restore editable products state
                        const initialEditable: Record<string, ProductResult[]> = {};
                        data.messages.forEach((msg: Message) => {
                            if (msg.products && msg.products.length > 0) {
                                initialEditable[msg.id] = msg.products;
                            }
                        });
                        setEditableProducts(initialEditable);
                    }
                }
            } catch (error) {
                console.error('Failed to load chat history:', error);
            }
        };
        fetchHistory();
    }, []);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: inputValue.trim(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('sm_token') || '';

            const res = await fetch(`${baseUrl}/api/recipe-bot/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userMsg.text,
                    history: messages.map(m => ({ role: m.role, text: m.text })),
                    lat: location?.lat,
                    lng: location?.lng
                })
            });

            if (!res.ok) {
                let errMsg = `Server returned ${res.status}`;
                try {
                    const errData = await res.json();
                    errMsg = errData.message || errData.reply || errMsg;
                } catch (e) { }
                throw new Error(errMsg);
            }

            const data = await res.json();
            const botMsgId = (Date.now() + 1).toString();

            const botMsg: Message = {
                id: botMsgId,
                role: 'bot',
                text: data.reply || 'Sorry, I did not understand that.',
                products: data.products?.length > 0 ? data.products : undefined,
                missingIngredients: data.missingIngredients?.length > 0 ? data.missingIngredients : undefined
            };

            if (botMsg.products) {
                // Initialize the editable state for this message
                setEditableProducts(prev => ({
                    ...prev,
                    [botMsgId]: botMsg.products!
                }));
            }

            setMessages(prev => [...prev, botMsg]);

        } catch (error: any) {
            console.error('Error talking to recipe bot:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                text: error.message && error.message.includes('Not authorized')
                    ? 'Please log in as a buyer to use the Recipe Agent.'
                    : (error.message || 'Sorry, I hit a snag trying to find that for you.')
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const updateQuantity = (msgId: string, productId: string, delta: number) => {
        setEditableProducts(prev => {
            const currentList = prev[msgId] || [];
            const newList = currentList.map(p => {
                if (p.productId === productId) {
                    const newAmount = Math.max(1, p.amountNeeded + delta);
                    return { ...p, amountNeeded: newAmount };
                }
                return p;
            });
            return { ...prev, [msgId]: newList };
        });
    };

    const removeItem = (msgId: string, productId: string) => {
        setEditableProducts(prev => {
            const currentList = prev[msgId] || [];
            const newList = currentList.filter(p => p.productId !== productId);
            return { ...prev, [msgId]: newList };
        });
    };

    const handleAddAllToCart = (msgId: string) => {
        const productsToAdd = editableProducts[msgId];
        if (!productsToAdd || productsToAdd.length === 0) return;

        productsToAdd.forEach(p => {
            // Need to add it 'amountNeeded' times if it's treating amount as cart quantity.
            // Since our cart context addItem function adds 1 each time, we call it in a loop.
            for (let i = 0; i < p.amountNeeded; i++) {
                addItem(p.productId, p.name, p.price, p.shopId, p.shopName, p.stock || 100);
            }
        });

        // Optional: show some feedback toast or visual change
        alert("Items added to cart!");
    };

    const openInlineSearch = (msgId: string, initialQuery: string = '') => {
        setActiveMsgIdForSearch(msgId);
        setSwapTarget(null);
        setIsSearchOpen(true);
        // We defer to the internal state of IntentSearch for query management
        if (initialQuery) {
            setTimeout(() => {
                const searchInput = document.querySelector('.inline-search-overlay .search-input') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                    searchInput.value = initialQuery;
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }, 100);
        }
    };

    const openSwapSearch = (msgId: string, oldProduct: ProductResult) => {
        setActiveMsgIdForSearch(msgId);
        setSwapTarget({ msgId, oldProductId: oldProduct.productId });
        setIsSearchOpen(true);
        // Pre-fill with the generic name (heuristic: first word or two)
        const simplifiedQuery = oldProduct.name.split(' ').slice(0, 2).join(' ');
        setTimeout(() => {
            const searchInput = document.querySelector('.inline-search-overlay .search-input') as HTMLInputElement;
            if (searchInput) {
                searchInput.focus();
                searchInput.value = simplifiedQuery;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, 100);
    };

    const addProductFromSearch = (product: Omit<ProductResult, 'amountNeeded' | 'unitNeeded'>) => {
        if (!activeMsgIdForSearch) return;

        setEditableProducts(prev => {
            const currentList = prev[activeMsgIdForSearch] || [];

            if (swapTarget && swapTarget.msgId === activeMsgIdForSearch) {
                if (currentList.some(p => p.productId === product.productId && p.productId !== swapTarget.oldProductId)) {
                    return { ...prev, [activeMsgIdForSearch]: currentList.filter(p => p.productId !== swapTarget.oldProductId) };
                }

                return {
                    ...prev,
                    [activeMsgIdForSearch]: currentList.map(p =>
                        p.productId === swapTarget.oldProductId
                            ? { ...product, amountNeeded: p.amountNeeded, unitNeeded: p.unitNeeded }
                            : p
                    )
                };
            } else {
                if (currentList.some(p => p.productId === product.productId)) {
                    return prev;
                }
                const newList = [...currentList, { ...product, amountNeeded: 1, unitNeeded: 'pc' }];
                return { ...prev, [activeMsgIdForSearch]: newList };
            }
        });

        if (!swapTarget) {
            // Remove ingredient from missing list using fuzzy matching with product name
            setMessages(prev => prev.map(msg => {
                if (msg.id === activeMsgIdForSearch && msg.missingIngredients) {
                    return {
                        ...msg,
                        missingIngredients: msg.missingIngredients.filter(ing =>
                            !product.name.toLowerCase().includes(ing.toLowerCase()) &&
                            !ing.toLowerCase().includes(product.name.toLowerCase())
                        )
                    };
                }
                return msg;
            }));
        }

        setSwapTarget(null);
        setIsSearchOpen(false);
    };



    return (
        <>
            {/* Floating Widget Toggle Button */}
            {!isOpen && (
                <button className="recipe-bot-toggle" onClick={() => setIsOpen(true)}>
                    👨‍🍳
                </button>
            )}

            {/* Widget Container */}
            <div className={`recipe-bot-wrapper ${isOpen ? 'open' : 'closed'}`}>
                <div className="recipe-bot-container">
                    <div className="recipe-bot-header">
                        <span className="recipe-bot-icon">👨‍🍳</span>
                        <div className="recipe-bot-title">
                            <h3>Recipe Agent</h3>
                            <p>AI Shopping Assistant</p>
                        </div>
                        <button className="recipe-bot-close" onClick={() => setIsOpen(false)} aria-label="Close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="recipe-bot-messages">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`recipe-message-wrapper ${msg.role}`}>
                                <div className="recipe-message-bubble">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>

                                {msg.role === 'bot' && (
                                    <>
                                        {editableProducts[msg.id] && editableProducts[msg.id].length > 0 && (
                                            <div className="recipe-product-list">
                                                {editableProducts[msg.id].map(p => (
                                                    <div key={p.productId} className="recipe-product-item">
                                                        <div className="recipe-product-info">
                                                            <span className="r-p-name">{p.name} {isInCart(p.productId) && <span className="r-p-badge">In Cart</span>}</span>
                                                            <span className="r-p-shop">{p.shopName} {p.distance != null ? `(${p.distance.toFixed(1)}km)` : ''}</span>
                                                            <span className="r-p-price">₹{p.price}</span>
                                                        </div>
                                                        <div className="recipe-product-controls">
                                                            <div className="qty-control">
                                                                <button onClick={() => updateQuantity(msg.id, p.productId, -1)} aria-label="Decrease">
                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                                </button>
                                                                <span>{p.amountNeeded} {p.unitNeeded}</span>
                                                                <button onClick={() => updateQuantity(msg.id, p.productId, 1)} aria-label="Increase">
                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                                </button>
                                                            </div>
                                                            <button className="swap-btn" onClick={() => openSwapSearch(msg.id, p)} title="Swap with another product">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                                                            </button>
                                                            <button className="remove-btn" onClick={() => removeItem(msg.id, p.productId)} title="Remove item">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button className="add-all-btn" onClick={() => handleAddAllToCart(msg.id)}>
                                                    🛒 Add All to Cart
                                                </button>
                                                <button style={{ marginTop: '0.5rem', background: '#e2e8f0', color: '#0f172a' }} className="add-all-btn" onClick={() => openInlineSearch(msg.id)}>
                                                    + Add any item manually
                                                </button>
                                            </div>
                                        )}

                                        {msg.missingIngredients && msg.missingIngredients.length > 0 && (
                                            <div className="recipe-missing-list">
                                                <div className="recipe-missing-title">Unavailable Components:</div>
                                                {msg.missingIngredients.map(ing => (
                                                    <div key={ing} className="recipe-missing-item">
                                                        <span>{ing}</span>
                                                        {/* Open Inline Search UI for missing component explicitly */}
                                                        <button className="recipe-missing-add" title="Search manually" onClick={() => openInlineSearch(msg.id, ing)}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="recipe-message-wrapper bot">
                                <div className="recipe-message-bubble loading">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="recipe-bot-input-area">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g., Make Pizza for 4 people..."
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isLoading}
                        >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Inline Native Intent Search Modal Overlay */}
                {isSearchOpen && (
                    <div className="inline-search-overlay" style={{ left: 'auto', right: '2rem', bottom: '5.5rem', width: '380px', height: '600px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: 0 }}>
                        <div className="inline-search-header" style={{ padding: '1rem', borderBottom: '1px solid #cbd5e1', background: '#f8fafc', margin: 0, borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>Search Market</h4>
                            <button className="inline-search-close" onClick={() => setIsSearchOpen(false)} aria-label="Close">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div style={{ flex: 1, background: '#f1f5f9', padding: '1rem', overflowY: 'auto' }}>
                            {/* We inject the real, robust Intent Search component directly here! */}
                            <div style={{ position: 'relative', zIndex: 9999 }}>
                                <IntentSearch
                                    onAdd={(p) => addProductFromSearch(p)}
                                    customAddText="+ Add to Recipe"
                                    customAddAllText="🛒 Add All to Recipe"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
