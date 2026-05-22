import express from 'express';
import { protect } from '../middleware/auth.js';
import { createSubmission, getSubmissions, addReview } from '../controllers/codeSubmissionController.js';

const router = express.Router();

router.post('/', protect, createSubmission);
router.get('/', protect, getSubmissions);
router.post('/:id/review', protect, addReview);

export default router;
