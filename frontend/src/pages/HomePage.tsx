import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import './HomePage.css';

// ── AI Simulator Data ──
const SCENARIOS = [
    {
        query: 'I want to cook a lasagna tonight 🍝',
        aiText: "Got it! Here's your lasagna kit from nearby sellers:",
        products: [
            { name: '🍝 Fresh Pasta Sheets', price: 79 },
            { name: '🧀 Mozzarella Block', price: 129 },
            { name: '🍅 Tomato Basil Sauce', price: 89 },
            { name: '🥩 Minced Beef 500g', price: 199 },
        ],
    },
    {
        query: 'I have a cold and sore throat 🤒',
        aiText: "Feel better soon! I found these from local pharmacies:",
        products: [
            { name: '🍯 Honey Ginger Tea', price: 120 },
            { name: '💊 Paracetamol 500mg', price: 45 },
            { name: '🌬️ Vicks VapoRub', price: 85 },
            { name: '🍋 Vitamin C Tablets', price: 95 },
        ],
    },
    {
        query: 'Plan a birthday party for 10 people 🎂',
        aiText: "Party time! I've curated everything you need:",
        products: [
            { name: '🎂 Birthday Cake (1kg)', price: 549 },
            { name: '🎉 Party Decorations Kit', price: 249 },
            { name: '🍕 Frozen Party Pizzas x4', price: 379 },
            { name: '🥤 Soft Drinks Pack x12', price: 199 },
        ],
    },
];

// Phase: 'typing-query' | 'showing-typing' | 'typing-ai' | 'showing-products' | 'done'
type Phase = 'typing-query' | 'showing-typing' | 'typing-ai' | 'showing-products';

function AISimulator() {
    const [scenarioIdx, setScenarioIdx] = useState(0);
    const [phase, setPhase] = useState<Phase>('typing-query');
    const [queryText, setQueryText] = useState('');
    const [aiText, setAiText] = useState('');
    const [visibleProducts, setVisibleProducts] = useState<number>(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scenario = SCENARIOS[scenarioIdx];

    const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };
    const after = (ms: number, fn: () => void) => { timerRef.current = setTimeout(fn, ms); };

    useEffect(() => {
        // Reset state for new scenario
        setQueryText('');
        setAiText('');
        setVisibleProducts(0);
        setPhase('typing-query');

        let charIdx = 0;
        const typeQuery = () => {
            if (charIdx < scenario.query.length) {
                charIdx++;
                setQueryText(scenario.query.slice(0, charIdx));
                timerRef.current = setTimeout(typeQuery, 38);
            } else {
                after(600, () => setPhase('showing-typing'));
            }
        };
        timerRef.current = setTimeout(typeQuery, 300);
        return clear;
    }, [scenarioIdx]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (phase === 'showing-typing') {
            after(1400, () => setPhase('typing-ai'));
        }
        if (phase === 'typing-ai') {
            let charIdx = 0;
            const typeAI = () => {
                if (charIdx < scenario.aiText.length) {
                    charIdx++;
                    setAiText(scenario.aiText.slice(0, charIdx));
                    timerRef.current = setTimeout(typeAI, 28);
                } else {
                    after(300, () => setPhase('showing-products'));
                }
            };
            timerRef.current = setTimeout(typeAI, 100);
        }
        return clear;
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (phase !== 'showing-products') return;
        let count = 0;
        const addProduct = () => {
            if (count < scenario.products.length) {
                count++;
                setVisibleProducts(count);
                timerRef.current = setTimeout(addProduct, 280);
            } else {
                // After showing all products, wait then move to next scenario
                after(3200, () => {
                    setScenarioIdx(i => (i + 1) % SCENARIOS.length);
                });
            }
        };
        timerRef.current = setTimeout(addProduct, 200);
        return clear;
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="simulator-window">
            <div className="sim-titlebar">
                <div className="sim-dot red" />
                <div className="sim-dot yellow" />
                <div className="sim-dot green" />
                <span className="sim-titlebar-label">Vicinity AI · Live Demo</span>
            </div>
            <div className="sim-body">
                {/* User message */}
                {queryText && (
                    <div className="sim-user-row">
                        <div className="sim-bubble-user">
                            {queryText}
                            {phase === 'typing-query' && <span className="sim-cursor" />}
                        </div>
                    </div>
                )}

                {/* AI typing indicator */}
                {phase === 'showing-typing' && (
                    <div className="sim-ai-row">
                        <div className="sim-ai-avatar">AI</div>
                        <div className="sim-bubble-ai">
                            <div className="sim-typing">
                                <span /><span /><span />
                            </div>
                        </div>
                    </div>
                )}

                {/* AI response + products */}
                {(phase === 'typing-ai' || phase === 'showing-products') && (
                    <div className="sim-ai-row">
                        <div className="sim-ai-avatar">AI</div>
                        <div className="sim-bubble-ai">
                            <span>{aiText}</span>
                            {phase === 'typing-ai' && <span className="sim-cursor" />}
                            {phase === 'showing-products' && visibleProducts > 0 && (
                                <div className="sim-products">
                                    {scenario.products.slice(0, visibleProducts).map((p, i) => (
                                        <div key={i} className="sim-product-row" style={{ animationDelay: `${i * 0.05}s` }}>
                                            <span className="sim-product-name">{p.name}</span>
                                            <span className="sim-product-price">₹{p.price}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Features Data ──
const FEATURES = [
    { icon: '🤖', title: 'AI Shopping Assistant', desc: 'Say "cook Italian dinner" — AI curates a complete cart from nearby sellers in seconds.', badge: 'Buyer', badgeClass: 'fbadge-buyer', iconClass: 'feat-icon-blue' },
    { icon: '📦', title: 'Intent-Driven Carts', desc: 'Describe your goal, not a list. The platform surfaces exactly what you need every time.', badge: 'Buyer', badgeClass: 'fbadge-buyer', iconClass: 'feat-icon-purple' },
    { icon: '📷', title: 'QR Code Inventory', desc: 'Sellers scan a QR code to update stock instantly — no spreadsheets, no manual errors.', badge: 'Seller', badgeClass: 'fbadge-seller', iconClass: 'feat-icon-green' },
    { icon: '🗺️', title: 'Live Delivery Routing', desc: 'Every checkout shows a live map of delivery routes from each seller to your door.', badge: 'Both', badgeClass: 'fbadge-both', iconClass: 'feat-icon-pink' },
];

const STEPS = [
    { n: '01', title: 'Express your goal', desc: 'Tell the AI what you want — a meal, remedy, or party plan.' },
    { n: '02', title: 'Review your cart', desc: 'AI curates products from local sellers nearest to you.' },
    { n: '03', title: 'See the route', desc: 'A live map shows exactly how your order travels to your door.' },
    { n: '04', title: 'Pay & enjoy', desc: 'Razorpay checkout — fast, secure, one-tap.' },
];

// ── Main Page ──
export function HomePage() {
    return (
        <div className="home">
            {/* Background orbs */}
            <div className="orbs-bg" aria-hidden>
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
                <div className="orb orb-4" />
            </div>

            {/* Nav */}
            <nav className="home-nav">
                <span className="nav-logo">Vi<span>cinity</span></span>
                <div className="nav-links">
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#how" className="nav-link">How It Works</a>
                    <Link to="/login" className="nav-link">Sign In</Link>
                    <Link to="/signup" className="nav-cta">Get Started</Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero-section">
                <div className="hero-badge">
                    <span className="badge-dot" />
                    AI-First · Hyperlocal · Real-Time
                </div>
                <h1 className="hero-headline">
                    <span className="line-dim">Shopping, finally</span><br />
                    <span className="line-glow">understood by AI.</span>
                </h1>
                <p className="hero-sub">
                    Stop searching item-by-item. Just say what you need and Vicinity
                    builds your cart from local sellers — in seconds.
                </p>
                <div className="hero-btns">
                    <Link to="/signup?role=buyer" className="btn-primary-dark">Start Shopping Free →</Link>
                    <Link to="/signup?role=seller" className="btn-ghost">Open Your Shop</Link>
                </div>
            </section>

            {/* Stats */}
            <div className="stats-row">
                {[
                    { num: '<10s', lbl: 'Average cart build time' },
                    { num: 'AI', lbl: 'Powered intent engine' },
                    { num: 'Live', lbl: 'Delivery route tracking' },
                    { num: '₹0', lbl: 'Delivery fees' },
                ].map(s => (
                    <div className="stat-item" key={s.lbl}>
                        <div className="stat-num">{s.num}</div>
                        <div className="stat-lbl">{s.lbl}</div>
                    </div>
                ))}
            </div>

            <div className="section-divider" />

            {/* AI Simulator */}
            <section className="simulator-section" id="demo">
                <span className="section-label">Live Demo</span>
                <h2 className="section-title">Watch the AI work its magic</h2>
                <p className="section-sub">
                    Type any goal and watch Vicinity assemble the perfect cart
                    from local sellers near you — automatically.
                </p>
                <AISimulator />
            </section>

            <div className="section-divider" />

            {/* Features */}
            <section className="features-section" id="features">
                <span className="section-label" style={{ display: 'block', textAlign: 'center' }}>What We Offer</span>
                <h2 className="section-title">Built for buyers. Built for sellers.</h2>
                <p className="section-sub">
                    Two-sided intelligence — AI handles shopping discovery for buyers
                    while giving sellers effortless inventory control.
                </p>
                <div className="features-grid-dark">
                    {FEATURES.map(f => (
                        <div className="feat-card" key={f.title}>
                            <div className={`feat-icon-wrap ${f.iconClass}`}>{f.icon}</div>
                            <span className={`feat-badge ${f.badgeClass}`}>{f.badge}</span>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="section-divider" />

            {/* How it works */}
            <section className="how-section" id="how">
                <span className="section-label">How It Works</span>
                <h2 className="section-title">From intent to doorstep in 4 steps</h2>
                <p className="section-sub">The fastest path from "I need" to "I have" — powered by AI.</p>
                <div className="steps-row-dark">
                    {STEPS.map(s => (
                        <div className="step-dark" key={s.n}>
                            <div className="step-num-dark">{s.n}</div>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div className="section-divider" />

            {/* CTA */}
            <section className="cta-section-dark">
                <div className="cta-box-dark">
                    <h2>Ready to shop smarter?</h2>
                    <p>
                        Join buyers who shop with AI — and local sellers who manage
                        inventory with a single scan.
                    </p>
                    <div className="cta-btns">
                        <Link to="/signup?role=buyer" className="btn-primary-dark">Start as Buyer →</Link>
                        <Link to="/signup?role=seller" className="btn-ghost">Join as Seller</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
