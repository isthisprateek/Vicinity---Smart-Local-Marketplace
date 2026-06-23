import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Create Razorpay order (requires auth)
router.post('/create-order', requireAuth, createOrder);

// Verify payment signature (requires auth)
router.post('/verify', requireAuth, verifyPayment);

export default router;
