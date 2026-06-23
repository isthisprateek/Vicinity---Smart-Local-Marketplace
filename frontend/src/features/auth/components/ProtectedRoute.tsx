import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/auth.types';

interface ProtectedRouteProps {
    children: ReactNode;
    /** If provided, user must also have this role */
    requiredRole?: Role;
}

/**
 * Guards a route. Redirects to /login if not authenticated.
 * If requiredRole is set and the user has a different role, redirects to their correct dashboard.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        // Redirect to the user's actual dashboard
        const redirect = user?.role === 'seller' ? '/seller' : '/buyer';
        return <Navigate to={redirect} replace />;
    }

    return <>{children}</>;
}
