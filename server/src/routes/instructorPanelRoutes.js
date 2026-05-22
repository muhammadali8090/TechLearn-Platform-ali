import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getDashboard,
  getCourses,
  getCourseAnalytics,
  getCourseStudents,
  issueCertificate,
  getCertificates,
  getQuizzes,
  getAllStudents,
} from '../controllers/instructorPanelController.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/courses', getCourses);
router.get('/courses/:id/analytics', getCourseAnalytics);
router.get('/courses/:id/students', getCourseStudents);
router.post('/courses/:id/certificates/issue', issueCertificate);
router.get('/certificates', getCertificates);
router.get('/quizzes', getQuizzes);
router.get('/students', getAllStudents);

export default router;
