import { Router } from 'express';
import { searchIntent } from '../controllers/search.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Route: GET /api/search/intent?q=...
// Protection: Buyer only
router.get('/intent', requireAuth, requireRole('buyer'), searchIntent);

export default router;
