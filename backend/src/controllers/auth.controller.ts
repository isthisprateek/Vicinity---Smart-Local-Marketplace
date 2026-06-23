import { Request, Response } from 'express';
import User from '../models/user.model';
import { generateToken } from '../utils/generateToken';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        res.status(400).json({ message: 'Please provide all required fields' });
        return;
    }

    if (password.length < 8) {
        res.status(400).json({ message: 'Password must be at least 8 characters long' });
        return;
    }

    if (role !== 'buyer' && role !== 'seller') {
        res.status(400).json({ message: 'Invalid role' });
        return;
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
        });

        if (user) {
            res.status(201).json({
                token: generateToken(user._id.toString(), user.role),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    savedAddresses: user.savedAddresses,
                }
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        res.status(400).json({ message: 'Please provide email, password, and role' });
        return;
    }

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (user.role !== role) {
                res.status(401).json({ message: `Invalid login role. This account is registered as a ${user.role}.` });
                return;
            }

            res.json({
                token: generateToken(user._id.toString(), user.role),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    savedAddresses: user.savedAddresses,
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
