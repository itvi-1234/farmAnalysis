import express from 'express';
import { getProfile, updateProfile } from '../controllers/user.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// User routes (protected)
router.get('/profile', authenticate, getProfile);
router.put('/update', authenticate, updateProfile);

export default router;

