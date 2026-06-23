import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthUser, Role } from '../types/auth.types';
import { authStorage } from '../services/auth.service';

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    login: (user: AuthUser, token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => authStorage.getUser());

    const login = useCallback((user: AuthUser, token: string) => {
        authStorage.save({ token, user });
        setUser(user);
    }, []);

    const logout = useCallback(() => {
        authStorage.clear();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

// Role-specific helpers
export function useUserRole(): Role | null {
    const { user } = useAuth();
    return user?.role ?? null;
}
