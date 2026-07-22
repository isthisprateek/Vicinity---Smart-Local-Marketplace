/**
 * useRazorpay — dynamically loads the Razorpay checkout.js script
 * and exposes an `openCheckout` function that opens the payment modal.
 *
 * Flow:
 *   1. Call backend POST /api/payment/create-order → get { orderId, amount }
 *   2. Load checkout.js script if not already loaded
 *   3. Open Razorpay modal with the order details
 *   4. On success → call backend POST /api/payment/verify with the three IDs
 *   5. Return { verified: true, paymentId, orderId } to caller
 */

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

interface CheckoutOptions {
    amount: number;      // in rupees
    items: any[];        // cart items to finalize order
    name?: string;
    description?: string;
    token: string;       // JWT auth token
    prefillEmail?: string;
    prefillName?: string;
    deliveryAddress?: string;
    deliveryLocation?: { lat: number; lng: number };
}

interface PaymentResult {
    success: boolean;
    paymentId?: string;
    orderId?: string;
    message?: string;
}

function loadScript(src: string): Promise<boolean> {
    return new Promise(resolve => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(true); return; }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export async function openRazorpayCheckout(opts: CheckoutOptions): Promise<PaymentResult> {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

    // 1. Create order on backend
    const orderRes = await fetch(`${baseUrl}/api/payment/create-order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opts.token}`,
        },
        body: JSON.stringify({ amount: opts.amount }),
    });

    if (!orderRes.ok) {
        const err = await orderRes.json();
        return { success: false, message: err.message || 'Failed to create order' };
    }

    const { orderId, amount, currency } = await orderRes.json();

    // 2. Load Razorpay checkout script
    const scriptLoaded = await loadScript(RAZORPAY_SCRIPT_URL);
    if (!scriptLoaded || !(window as any).Razorpay) {
        return { success: false, message: 'Failed to load Razorpay. Check your internet connection.' };
    }

    // 3. Open payment modal and wait for user action
    return new Promise<PaymentResult>(resolve => {
        const rzp = new (window as any).Razorpay({
            key: keyId,
            amount,
            currency,
            order_id: orderId,
            name: opts.name || 'Vicinity',
            description: opts.description || 'Order Payment',
            theme: { color: '#2563eb' },
            prefill: {
                email: opts.prefillEmail || '',
                name: opts.prefillName || '',
            },
            handler: async (response: {
                razorpay_order_id: string;
                razorpay_payment_id: string;
                razorpay_signature: string;
            }) => {
                // 4. Verify payment signature on backend
                try {
                    const verifyRes = await fetch(`${baseUrl}/api/payment/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${opts.token}`,
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            items: opts.items, // Pass items for order creation
                            deliveryAddress: opts.deliveryAddress,
                            deliveryLocation: opts.deliveryLocation
                        }),
                    });

                    if (verifyRes.ok) {
                        const data = await verifyRes.json();
                        resolve({
                            success: true,
                            paymentId: data.paymentId,
                            orderId: data.orderId,
                            message: data.message,
                        });
                    } else {
                        resolve({ success: false, message: 'Payment verification failed' });
                    }
                } catch {
                    resolve({ success: false, message: 'Network error during verification' });
                }
            },
            modal: {
                ondismiss: () => resolve({ success: false, message: 'Payment cancelled' }),
            },
        });

        rzp.open();
    });
}
