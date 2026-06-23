import { Router } from 'express';
import { addProduct, getMyProducts, deleteProduct, getCategories, updateProduct, getExploreProducts } from '../controllers/product.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Public: get categories for the form dropdown
router.get('/categories', getCategories);

// Public: get top/trending products for dashboard
router.get('/explore', getExploreProducts);

// Protected: seller-only routes
router.post('/', requireAuth, requireRole('seller'), addProduct);
router.get('/my', requireAuth, requireRole('seller'), getMyProducts);
router.put('/:id', requireAuth, requireRole('seller'), updateProduct);
router.delete('/:id', requireAuth, requireRole('seller'), deleteProduct);

export default router;
