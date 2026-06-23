// ─── Auth Types ───

export type Role = 'buyer' | 'seller';

export interface LoginPayload {
    email: string;
    password: string;
    role: Role;
}

export interface RegisterPayload extends LoginPayload {
    name: string;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: Role;
    savedAddresses?: any[];
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}
