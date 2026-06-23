import Razorpay from 'razorpay';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { finalizeOrder } from './order.controller';

// Lazy factory — creates Razorpay instance only when actually called,
// so the server starts fine even with placeholder keys in .env.
function getRazorpay(): Razorpay {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || keyId.includes('REPLACE') || !keySecret || keySecret.includes('REPLACE')) {
        throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/**
 * POST /api/payment/create-order
 * Body: { amount: number (rupees) }
 * Returns: { orderId, amount (paise), currency }
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        res.status(400).json({ message: 'Invalid amount' });
        return;
    }

    try {
        const rz = getRazorpay();
        const order = await rz.orders.create({
            amount: Math.round(Number(amount) * 100), // convert ₹ → paise
            currency,
            receipt: receipt || `rcpt_${Date.now()}`,
        });

        res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (err: any) {
        console.error('[Payment] createOrder error:', err.message);
        const isConfig = err.message?.includes('not configured');
        res.status(isConfig ? 503 : 500).json({
            message: isConfig
                ? 'Payment not configured. Contact support.'
                : 'Failed to create payment order',
            error: err.message,
        });
    }
};

/**
 * POST /api/payment/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Verifies HMAC-SHA256 signature — proves payment was made via this merchant.
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400).json({ message: 'Missing payment verification fields' });
        return;
    }

    try {
        const keySecret = process.env.RAZORPAY_KEY_SECRET!;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            res.status(400).json({ message: 'Payment verification failed: signature mismatch' });
            return;
        }

        // Finalize order records in DB
        const { items, deliveryAddress, deliveryLocation } = req.body;
        if (items && Array.isArray(items)) {
            await finalizeOrder(
                (req as any).user.id,
                razorpay_order_id,
                razorpay_payment_id,
                items,
                deliveryAddress,
                deliveryLocation
            );
        }

        res.status(200).json({
            verified: true,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            message: 'Payment verified successfully',
        });
    } catch (err: any) {
        console.error('[Payment] verifyPayment error:', err.message);
        res.status(500).json({ message: 'Payment verification error', error: err.message });
    }
};
