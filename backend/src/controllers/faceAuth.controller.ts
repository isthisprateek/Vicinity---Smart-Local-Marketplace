import { Request, Response } from 'express';
import User from '../models/user.model';
import { generateToken } from '../utils/generateToken';

interface AuthRequest extends Request {
    user?: any; // Assuming you have an auth middleware setting req.user
}

// Ensure two arrays are of length 128
const THRESHOLD = 0.45; // Euclidean distance threshold (lower is stricter)

// Helper: Calculate Euclidean distance between two 128D descriptors
function euclideanDistance(desc1: number[], desc2: number[]): number {
    if (desc1.length !== 128 || desc2.length !== 128) {
        throw new Error('Descriptors must be 128 dimensions');
    }
    let sum = 0;
    for (let i = 0; i < 128; i++) {
        sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sum);
}

/**
 * @desc    Register a face descriptor for the logged-in user
 * @route   POST /api/face/register
 * @access  Private
 */
export const registerFace = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { descriptor } = req.body;

        if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
            res.status(400).json({ message: 'Invalid face descriptor. Must be a 128-element array.' });
            return;
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.faceDescriptor = descriptor;
        await user.save();

        res.status(200).json({ message: 'Face registered successfully' });
    } catch (error) {
        console.error('Face registration error:', error);
        res.status(500).json({ message: 'Failed to register face data' });
    }
};

/**
 * @desc    Remove face descriptor from the logged-in user
 * @route   DELETE /api/face/remove
 * @access  Private
 */
export const removeFace = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.faceDescriptor = undefined;
        await user.save();

        res.status(200).json({ message: 'Face data removed successfully' });
    } catch (error) {
        console.error('Face removal error:', error);
        res.status(500).json({ message: 'Failed to remove face data' });
    }
};

/**
 * @desc    Login using a face descriptor
 * @route   POST /api/face/login
 * @access  Public
 */
export const loginWithFace = async (req: Request, res: Response): Promise<void> => {
    try {
        const { descriptor } = req.body; // Remove email requirement

        if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
            res.status(400).json({ message: 'Invalid face descriptor' });
            return;
        }

        // Find all users who have a faceDescriptor set
        const users = await User.find({ faceDescriptor: { $exists: true, $ne: [] } }).select('+faceDescriptor');

        if (!users || users.length === 0) {
            res.status(404).json({ message: 'No registered faces found in the system' });
            return;
        }

        let bestMatch: any = null;
        let minDistance: number = Infinity;

        // Compare vector with all users
        for (const user of users) {
            if (user.faceDescriptor && user.faceDescriptor.length === 128) {
                const distance = euclideanDistance(descriptor, user.faceDescriptor);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = user;
                }
            }
        }

        console.log(`Global Face match attempt. Best distance: ${minDistance} for user ${bestMatch?.email}`);

        if (bestMatch && minDistance <= THRESHOLD) {
            // Success
            res.json({
                token: generateToken(bestMatch._id.toString(), bestMatch.role),
                user: {
                    id: bestMatch._id,
                    name: bestMatch.name,
                    email: bestMatch.email,
                    role: bestMatch.role,
                }
            });
        } else {
            res.status(401).json({ message: 'Face not recognized' });
        }

    } catch (error) {
        console.error('Face login error:', error);
        res.status(500).json({ message: 'Internal server error during face authentication' });
    }
};
