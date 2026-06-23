import { Router } from 'express';
import { getDashboardStats } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Restricted to superadmin abc@gmail.com
router.get('/stats', requireAuth, requireAdmin, getDashboardStats);

export default router;
