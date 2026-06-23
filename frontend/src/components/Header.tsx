import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import './Header.css';

export function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();


    const closeMenu = () => {
        setMenuOpen(false);
        setDropdownOpen(false);
    };

    const handleLogout = () => {
        logout();
        closeMenu();
        navigate('/');
    };

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : 'U';

    return (
        <>
            <header className="header">
                <div className="container header-content">
                    <Link to="/" className="logo" onClick={closeMenu}>Smart Marketplace</Link>

                    {/* Desktop nav */}
                    <nav className="nav">
                        {isAuthenticated ? (
                            <NavLink to={`/${user?.role}`} end className={({ isActive }) => 'nav-link' + (isActive ? ' nav-active' : '')}>
                                Dashboard
                            </NavLink>
                        ) : (
                            <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' nav-active' : '')}>
                                Home
                            </NavLink>
                        )}


                        {isAuthenticated ? (
                            <div className={`user-menu-container ${dropdownOpen ? 'open' : ''}`} ref={dropdownRef}>
                                <button
                                    className="user-avatar-btn"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    aria-label="User menu"
                                >
                                    {initials}
                                </button>

                                <div className="user-dropdown-menu">
                                    <div className="dropdown-user-info">
                                        <div className="dropdown-user-name">{user?.name}</div>
                                        <div className="dropdown-user-email">{user?.email}</div>
                                    </div>
                                    <Link to="/profile" className="dropdown-item" onClick={closeMenu}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        My Profile
                                    </Link>
                                    {user?.role === 'buyer' && (
                                        <Link to="/orders" className="dropdown-item" onClick={closeMenu}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                                            My Orders
                                        </Link>
                                    )}
                                    {user?.email === 'abc@gmail.com' && (
                                        <Link to="/admin" className="dropdown-item" onClick={closeMenu}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <div style={{ margin: '0.4rem 0', borderTop: '1px solid #e2e8f0' }}></div>
                                    <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="nav-link nav-login">Login</Link>
                                <Link to="/signup" className="nav-link nav-signup">Get Started</Link>
                            </>
                        )}
                    </nav>

                    {/* Hamburger (mobile only) */}
                    <button
                        className={`hamburger${menuOpen ? ' open' : ''}`}
                        aria-label="Toggle navigation"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((prev) => !prev)}
                    >
                        <span className="hamburger-bar" />
                        <span className="hamburger-bar" />
                        <span className="hamburger-bar" />
                    </button>
                </div>
            </header>

            {/* Mobile slide-down drawer */}
            <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
                <nav className="mobile-nav">

                    {isAuthenticated ? (
                        <NavLink to={`/${user?.role}`} end className={({ isActive }) => 'mobile-nav-link' + (isActive ? ' mobile-nav-active' : '')} onClick={closeMenu}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            Dashboard
                        </NavLink>
                    ) : (
                        <NavLink to="/" end className={({ isActive }) => 'mobile-nav-link' + (isActive ? ' mobile-nav-active' : '')} onClick={closeMenu}>
                            Home
                        </NavLink>
                    )}
                    {isAuthenticated ? (
                        <>
                            {/* Mobile User Profile Section */}
                            <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
                            </div>

                            <NavLink to="/profile" className={({ isActive }) => 'mobile-nav-link' + (isActive ? ' mobile-nav-active' : '')} onClick={closeMenu}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                My Profile
                            </NavLink>
                            {user?.role === 'buyer' && (
                                <NavLink to="/orders" className={({ isActive }) => 'mobile-nav-link' + (isActive ? ' mobile-nav-active' : '')} onClick={closeMenu}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                                    My Orders
                                </NavLink>
                            )}
                            <div className="mobile-nav-actions">
                                <button onClick={handleLogout} className="mobile-btn-login" style={{ width: '100%', border: 'none', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', color: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="mobile-nav-actions">
                            <Link to="/login" className="mobile-btn-login" onClick={closeMenu}>Login</Link>
                            <Link to="/signup" className="mobile-btn-signup" onClick={closeMenu}>Get Started</Link>
                        </div>
                    )}
                </nav>
            </div>
        </>
    );
}
