import { Request, Response } from 'express';
import crypto from 'crypto';
import https from 'https';
import { finalizeOrder } from './order.controller';

/**
 * Makes a raw HTTPS request to Razorpay API.
 * Bypasses the razorpay npm SDK which crashes on Node.js v26
 * with "Cannot read properties of undefined (reading 'status')".
 */
function razorpayRequest(method: string, path: string, body?: object): Promise<any> {
    const keyId = process.env.RAZORPAY_KEY_ID!;
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;

    if (!keyId || keyId.includes('your_') || !keySecret || keySecret.includes('your_')) {
        return Promise.reject(new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env'));
    }

    const payload = body ? JSON.stringify(body) : '';
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.razorpay.com',
            port: 443,
            path: `/v1${path}`,
            method,
            family: 4,          // force IPv4 — Node.js v26 prefers IPv6 which times out
            timeout: 10000,     // 10s hard timeout
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode && res.statusCode >= 400) {
                        reject(new Error(parsed.error?.description || parsed.description || `Razorpay error ${res.statusCode}`));
                    } else {
                        resolve(parsed);
                    }
                } catch {
                    reject(new Error(`Invalid JSON from Razorpay: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request to Razorpay timed out (ETIMEDOUT). Check your network.'));
        });
        if (payload) req.write(payload);
        req.end();
    });
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
        const order = await razorpayRequest('POST', '/orders', {
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
