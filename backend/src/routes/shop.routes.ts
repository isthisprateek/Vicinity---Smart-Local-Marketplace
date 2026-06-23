import { Router } from 'express';
import { createShop, getMyShops, deleteShop, getNearbyShops, rateShop, getShopsBatch } from '../controllers/shop.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Public: nearby shops for buyers
router.get('/nearby', getNearbyShops);

// Public: batch fetch shop details by IDs (for cart route map)
router.get('/batch', getShopsBatch);

// Protected: seller-only shop management
router.post('/', requireAuth, requireRole('seller'), createShop);
router.get('/my', requireAuth, requireRole('seller'), getMyShops);
router.delete('/:id', requireAuth, requireRole('seller'), deleteShop);

// Auth required: rating a shop
router.post('/:id/rate', requireAuth, rateShop);

export default router;

