import express from 'express';
import {
  getCourses, getCourseBySlug, createCourse, updateCourse, deleteCourse, publishCourse,
  enrollCourse, getCourseProgress, completeLesson, submitQuiz, submitCodingChallenge,
  downloadResource,
} from '../controllers/courseController.js';
import { submitExam, getExamAttempts, createExam, getExam } from '../controllers/examController.js';
import { createLesson, updateLesson, getLesson, deleteLesson } from '../controllers/lessonController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCourses);
router.get('/:slug', getCourseBySlug);

router.post('/', protect, adminOnly, createCourse);
router.put('/:id', protect, adminOnly, updateCourse);
router.delete('/:id', protect, adminOnly, deleteCourse);
router.post('/:id/publish', protect, adminOnly, publishCourse);

router.post('/:id/enroll', protect, enrollCourse);
router.get('/:id/progress', protect, getCourseProgress);
router.post('/:id/lessons/:lessonId/complete', protect, completeLesson);
router.post('/:id/lessons/:lessonId/quiz', protect, submitQuiz);
router.post('/:id/lessons/:lessonId/challenge', protect, submitCodingChallenge);
router.post('/:courseId/lessons/:lessonId/resources/:resourceIndex/download', protect, downloadResource);

// Lesson CRUD (admin)
router.post('/:courseId/sections/:sectionIndex/lessons', protect, adminOnly, createLesson);
router.put('/:courseId/lessons/:lessonId', protect, adminOnly, updateLesson);
router.get('/:courseId/lessons/:lessonId', protect, getLesson);
router.delete('/:courseId/lessons/:lessonId', protect, adminOnly, deleteLesson);

router.get('/:courseId/exam', protect, getExam);
router.post('/:courseId/exam', protect, adminOnly, createExam);
router.post('/:courseId/exam/attempt', protect, submitExam);
router.get('/:courseId/exam/attempts', protect, getExamAttempts);

export default router;
