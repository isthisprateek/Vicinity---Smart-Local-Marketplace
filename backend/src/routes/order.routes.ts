import { Router } from 'express';
import { getBuyerOrders, getSellerOrders, markOrderDelivered } from '../controllers/order.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Buyer: Get my order history
router.get('/buyer', requireAuth, getBuyerOrders);

// Seller: Get orders for my shops
router.get('/seller', requireAuth, getSellerOrders);
router.put('/seller/:id/deliver', requireAuth, markOrderDelivered);

export default router;
