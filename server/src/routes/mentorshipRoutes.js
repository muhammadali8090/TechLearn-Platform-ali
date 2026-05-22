import express from 'express';
import { protect } from '../middleware/auth.js';
import { getMentors, requestMentor, getMyMentorships, sendMessage, updateStatus } from '../controllers/mentorshipController.js';

const router = express.Router();

router.get('/mentors', protect, getMentors);
router.post('/request', protect, requestMentor);
router.get('/my', protect, getMyMentorships);
router.post('/:id/message', protect, sendMessage);
router.put('/:id/status', protect, updateStatus);

export default router;
