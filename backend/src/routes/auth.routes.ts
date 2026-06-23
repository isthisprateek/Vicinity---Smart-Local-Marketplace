import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller';
import { registerFace, removeFace, loginWithFace } from '../controllers/faceAuth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Face Auth Routes
router.post('/face/register', requireAuth, registerFace);
router.delete('/face/remove', requireAuth, removeFace);
router.post('/face/login', loginWithFace);

export default router;
