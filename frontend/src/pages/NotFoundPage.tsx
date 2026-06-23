import { Link } from 'react-router-dom';

export function NotFoundPage() {
    return (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <h1>404 - Page Not Found</h1>
            <p style={{ marginBottom: '2rem' }}>The page you are looking for does not exist.</p>
            <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Go back home
            </Link>
        </div>
    );
}
