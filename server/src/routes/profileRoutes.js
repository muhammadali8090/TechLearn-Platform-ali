import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { getPublicProfile, updateMyProfile } from '../controllers/profileController.js';

const router = express.Router();

// Optional auth middleware
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch {}
  next();
};

// PUT /me must come before GET /:userId
router.put('/me', protect, updateMyProfile);
router.get('/:userId', optionalAuth, getPublicProfile);

export default router;
