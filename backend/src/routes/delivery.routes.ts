import { Router } from 'express';
import { getDeliveryRoute } from '../controllers/delivery.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Get delivery route for a product
router.get('/:productId', requireAuth, getDeliveryRoute);

export default router;
