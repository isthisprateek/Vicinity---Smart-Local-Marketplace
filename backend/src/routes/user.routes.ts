import { Router } from 'express';
import {
    getUserProfile,
    updateUserProfile,
    addAddress,
    removeAddress
} from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.route('/profile')
    .get(requireAuth, getUserProfile)
    .put(requireAuth, updateUserProfile);

router.route('/addresses')
    .post(requireAuth, addAddress);

router.route('/addresses/:addressId')
    .delete(requireAuth, removeAddress);

export default router;
