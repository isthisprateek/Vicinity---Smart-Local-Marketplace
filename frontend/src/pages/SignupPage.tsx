import { useState, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { registerRequest } from '../features/auth/services/auth.service';
import './AuthPage.css';
type Role = 'buyer' | 'seller';

export function SignupPage() {
    const [searchParams] = useSearchParams();
    const defaultRole = (searchParams.get('role') as Role) ?? 'buyer';

    const [role, setRole] = useState<Role>(defaultRole);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const data = await registerRequest({ name, email, password, role });
            login(data.user, data.token);
            navigate(role === 'seller' ? '/seller' : '/buyer', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">SM</div>
                <h1 className="auth-title">Create your account</h1>
                <p className="auth-subtitle">Join the Smart Marketplace in seconds</p>

                {/* Role toggle */}
                <div className="role-toggle">
                    <button
                        type="button"
                        className={`role-btn ${role === 'buyer' ? 'role-active' : ''}`}
                        onClick={() => setRole('buyer')}
                    >
                        🛒 Buyer
                    </button>
                    <button
                        type="button"
                        className={`role-btn ${role === 'seller' ? 'role-active' : ''}`}
                        onClick={() => setRole('seller')}
                    >
                        🏪 Seller
                    </button>
                </div>
                <p className="role-hint">
                    {role === 'buyer'
                        ? 'Shop locally using AI-powered intent search.'
                        : 'List products and manage inventory with QR codes.'}
                </p>

                {error && (
                    <div className="auth-error" role="alert">
                        <span className="auth-error-icon">⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="name">{role === 'seller' ? 'Store / Business name' : 'Full name'}</label>
                        <input
                            id="name"
                            type="text"
                            placeholder={role === 'seller' ? 'e.g. Sharma General Store' : 'e.g. Priya Sharma'}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="signup-email">Email address</label>
                        <input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="signup-password">Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading || !name || !email || !password || password.length < 8}>
                        <span className="auth-btn-inner">
                            {loading && <span className="auth-spinner" aria-hidden="true" />}
                            {loading ? 'Creating account...' : (role === 'buyer' ? 'Start Shopping' : 'Open My Store')}
                        </span>
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?{' '}
                    <Link to="/login" className="form-link">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
