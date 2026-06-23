import { Router } from 'express';
import { graphSearch } from '../controllers/graphSearchController';

const router = Router();

// Route: GET /api/graph-search?q=...
router.get('/', graphSearch);

export default router;
