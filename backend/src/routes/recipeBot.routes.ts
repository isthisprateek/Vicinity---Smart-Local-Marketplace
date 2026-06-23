import { Router } from 'express';
import { handleRecipeChat, getChatHistory } from '../controllers/recipeBot.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Route: POST /api/recipe-bot/chat
// Protection: Buyer only
router.post('/chat', requireAuth, requireRole('buyer'), handleRecipeChat);

// Route: GET /api/recipe-bot/history
// Protection: Buyer only
router.get('/history', requireAuth, requireRole('buyer'), getChatHistory);

export default router;
