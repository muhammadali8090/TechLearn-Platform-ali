import express from 'express';
import { protect } from '../middleware/auth.js';
import { getCourseReviews, createReview, deleteReview } from '../controllers/reviewController.js';

const router = express.Router();

router.get('/courses/:id/reviews', getCourseReviews);
router.post('/courses/:id/reviews', protect, createReview);
router.delete('/courses/:id/reviews/:reviewId', protect, deleteReview);

export default router;
