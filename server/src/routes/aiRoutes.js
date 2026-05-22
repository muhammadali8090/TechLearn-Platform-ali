import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getRecommendations,
  getRoadmap,
  chat,
  generateQuiz,
  getSkills,
} from '../controllers/aiController.js';

const router = express.Router();

router.get('/recommendations', protect, getRecommendations);
router.get('/roadmap', protect, getRoadmap);
router.post('/chat', protect, chat);
router.post('/generate-quiz', protect, adminOnly, generateQuiz);
router.get('/skills', protect, getSkills);

export default router;
