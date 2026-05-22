import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getChallenges, createChallenge, getChallengeById, submitChallenge } from '../controllers/challengeController.js';

const router = express.Router();

router.get('/', protect, getChallenges);
router.post('/', protect, adminOnly, createChallenge);
router.get('/:id', protect, getChallengeById);
router.post('/:id/submit', protect, submitChallenge);

export default router;
