import jwt from 'jsonwebtoken';

export const generateToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'smartmarket_jwt_secret_key_2024', {
        expiresIn: '30d',
    });
};
