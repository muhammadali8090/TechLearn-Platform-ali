import express from 'express';
import { getAdminUsers, getAdminCourses } from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/users', protect, adminOnly, getAdminUsers);
router.get('/courses', protect, adminOnly, getAdminCourses);

export default router;
