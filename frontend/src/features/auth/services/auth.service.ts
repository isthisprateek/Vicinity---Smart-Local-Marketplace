import type { AuthResponse, LoginPayload, RegisterPayload } from '../types/auth.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const TOKEN_KEY = 'sm_token';
const USER_KEY = 'sm_user';

// ─── API call ───
export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? 'Invalid email or password.');
    }

    return res.json() as Promise<AuthResponse>;
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? 'Registration failed.');
    }

    return res.json() as Promise<AuthResponse>;
}

// ─── Storage helpers ───
export const authStorage = {
    save(data: AuthResponse) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    },
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },
    getUser() {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as AuthResponse['user'];
        } catch {
            return null;
        }
    },
    clear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
    isAuthenticated(): boolean {
        return !!localStorage.getItem(TOKEN_KEY);
    },
};
