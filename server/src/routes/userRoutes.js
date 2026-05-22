import express from 'express';
import { getDashboard, getCertificate, getLearningStats } from '../controllers/userController.js';
import { addBookmark, removeBookmark, getBookmarks } from '../controllers/bookmarkController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/me/dashboard', protect, getDashboard);
router.get('/me/learning-stats', protect, getLearningStats);
router.get('/me/certificates/:certificateId', getCertificate);

router.post('/bookmarks', protect, addBookmark);
router.delete('/bookmarks/:bookmarkId', protect, removeBookmark);
router.get('/bookmarks', protect, getBookmarks);

export default router;
