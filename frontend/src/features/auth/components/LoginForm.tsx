import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginRequest, authStorage } from '../services/auth.service';
import type { Role } from '../types/auth.types';
import { FaceCaptureModal } from './FaceCaptureModal';
import '@/pages/AuthPage.css';
import './LoginForm.css';

export function LoginForm() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [role, setRole] = useState<Role>('buyer');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);

    const handleFaceLogin = async (descriptor: number[]) => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${baseUrl}/api/auth/face/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descriptor })
            });

            const data = await res.json();

            if (res.ok && data.user && data.token) {
                authStorage.save({ token: data.token, user: data.user });
                login(data.user, data.token);
                navigate(data.user.role === 'seller' ? '/seller' : '/buyer', { replace: true });
            } else {
                setError(data.message || 'Face not recognized.');
            }
        } catch (err) {
            setError('Failed to process face login. Please try again.');
        } finally {
            setLoading(false);
            setIsFaceModalOpen(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await loginRequest({ email, password, role });
            login(data.user, data.token);
            navigate(role === 'seller' ? '/seller' : '/buyer', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">SM</div>
                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to your Smart Marketplace account</p>

                {/* Role selector */}
                <div className="role-toggle role-toggle-full" role="group" aria-label="Choose your role">
                    <button
                        type="button"
                        className={`role-btn${role === 'buyer' ? ' role-active' : ''}`}
                        onClick={() => { setRole('buyer'); setError(null); }}
                        aria-pressed={role === 'buyer'}
                    >
                        🛒 Buyer
                    </button>
                    <button
                        type="button"
                        className={`role-btn${role === 'seller' ? ' role-active' : ''}`}
                        onClick={() => { setRole('seller'); setError(null); }}
                        aria-pressed={role === 'seller'}
                    >
                        🏪 Seller
                    </button>
                </div>
                <p className="role-hint">
                    {role === 'buyer'
                        ? 'Browse local products with AI assistance.'
                        : 'Manage your store, inventory, and orders.'}
                </p>

                {/* Error banner */}
                {error && (
                    <div className="auth-error" role="alert">
                        <span className="auth-error-icon">⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                            disabled={loading}
                            aria-describedby={error ? 'login-error' : undefined}
                        />
                    </div>

                    <div className="form-group">
                        <div className="form-group-header">
                            <label htmlFor="login-password">Password</label>
                        </div>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading || !email || !password}>
                        <span className="auth-btn-inner">
                            {loading && <span className="auth-spinner" aria-hidden="true" />}
                            {loading ? 'Signing in…' : 'Sign In'}
                        </span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                        <span style={{ margin: '0 1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>OR</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                    </div>

                    <button
                        type="button"
                        className="auth-btn face-auth-btn"
                        onClick={() => setIsFaceModalOpen(true)}
                        disabled={loading}
                        title="Login with your registered Face ID"
                        style={{
                            background: 'white',
                            color: 'var(--primary-color)',
                            border: '2px solid var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>📷</span>
                        <span>Login with Face ID</span>
                    </button>

                </form>

                <p className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/signup" className="form-link">Create one free</Link>
                </p>
            </div>

            <FaceCaptureModal
                isOpen={isFaceModalOpen}
                onClose={() => setIsFaceModalOpen(false)}
                onCapture={handleFaceLogin}
                title="Login with Face ID"
                description="Looking for a registered face to authenticate..."
                buttonText="Verify Face"
            />
        </div>
    );
}
