import { Request, Response } from 'express';
import User from '../models/user.model';
import bcrypt from 'bcrypt';

// Extend Request manually here, or import AuthRequest from auth.middleware
interface AuthRequest extends Request {
    user?: any;
}

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id).select('-password -faceDescriptor');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.name = req.body.name || user.name;
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            savedAddresses: updatedUser.savedAddresses,
        });
    } catch (error) {
        console.error('Error updating profile', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

/**
 * @desc    Add a saved address
 * @route   POST /api/users/addresses
 * @access  Private
 */
export const addAddress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { label, address, lat, lng } = req.body;
        if (!label || !address || lat === undefined || lng === undefined) {
            res.status(400).json({ message: 'Invalid address data' });
            return;
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.savedAddresses.push({ label, address, lat, lng });
        const updatedUser = await user.save();
        res.status(201).json(updatedUser.savedAddresses);
    } catch (error) {
        console.error('Error adding address', error);
        res.status(500).json({ message: 'Server error adding address' });
    }
};

/**
 * @desc    Remove a saved address
 * @route   DELETE /api/users/addresses/:addressId
 * @access  Private
 */
export const removeAddress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.savedAddresses = user.savedAddresses.filter(
            (addr) => addr._id && addr._id.toString() !== req.params.addressId
        );

        const updatedUser = await user.save();
        res.json(updatedUser.savedAddresses);
    } catch (error) {
        console.error('Error removing address', error);
        res.status(500).json({ message: 'Server error removing address' });
    }
};
