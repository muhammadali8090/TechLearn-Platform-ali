import { v4 as uuidv4 } from 'uuid';
import Exam from '../models/Exam.js';
import ExamAttempt from '../models/ExamAttempt.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

export const submitExam = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { answers } = req.body;

    const course = await Course.findById(courseId).populate('finalExam');
    if (!course || !course.finalExam) {
      return res.status(404).json({ success: false, error: 'Exam not found', statusCode: 404 });
    }

    const exam = course.finalExam;
    const questions = exam.questions;
    let correct = 0;
    questions.forEach((q, idx) => {
      const ans = answers.find((a) => a.questionIndex === idx);
      if (ans && ans.selectedIndex === q.correctIndex) correct++;
    });

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = score >= exam.passingScore;

    const attempt = await ExamAttempt.create({
      user: req.user._id,
      course: courseId,
      exam: exam._id,
      answers,
      score,
      passed,
      attemptedAt: new Date(),
    });

    let certificate = null;
    if (passed) {
      const user = await User.findById(req.user._id);
      const alreadyHasCert = user.certificates.some((c) => c.courseId.toString() === courseId);
      if (!alreadyHasCert) {
        const certificateId = uuidv4();
        user.certificates.push({ courseId, issuedAt: new Date(), certificateId });
        await user.save();
        certificate = { certificateId, issuedAt: new Date() };

        // Emit certificate_earned notification
        await createNotification({
          userId: req.user._id,
          type: 'certificate_earned',
          title: 'Certificate earned!',
          message: `Congratulations! You earned a certificate for completing "${course.title}".`,
          link: `/certificate/${certificateId}`,
        });
      } else {
        const existing = user.certificates.find((c) => c.courseId.toString() === courseId);
        certificate = { certificateId: existing.certificateId, issuedAt: existing.issuedAt };
      }

      // Emit exam_passed notification
      await createNotification({
        userId: req.user._id,
        type: 'exam_passed',
        title: 'Final exam passed!',
        message: `You passed the final exam for "${course.title}" with a score of ${score}%.`,
        link: `/courses/${course.slug}`,
      });
    }

    const questionsWithAnswers = questions.map((q, idx) => {
      const ans = answers.find((a) => a.questionIndex === idx);
      return {
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        userAnswer: ans ? ans.selectedIndex : null,
        correct: ans ? ans.selectedIndex === q.correctIndex : false,
      };
    });

    res.json({
      success: true,
      data: { passed, score, passingScore: exam.passingScore, certificate, questions: questionsWithAnswers },
    });
  } catch (err) {
    next(err);
  }
};

export const getExamAttempts = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const attempts = await ExamAttempt.find({ user: req.user._id, course: courseId })
      .sort({ attemptedAt: -1 });
    res.json({ success: true, data: attempts });
  } catch (err) {
    next(err);
  }
};

export const createExam = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { questions, passingScore, timeLimit } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found', statusCode: 404 });

    let exam;
    if (course.finalExam) {
      exam = await Exam.findByIdAndUpdate(
        course.finalExam,
        { questions, passingScore: passingScore || 70, timeLimit: timeLimit || 30 },
        { new: true }
      );
    } else {
      exam = await Exam.create({ course: courseId, questions, passingScore: passingScore || 70, timeLimit: timeLimit || 30 });
      course.finalExam = exam._id;
      await course.save();
    }

    res.json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
};

export const getExam = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate('finalExam');
    if (!course || !course.finalExam) {
      return res.status(404).json({ success: false, error: 'Exam not found', statusCode: 404 });
    }
    // Strip correctIndex from questions for students
    const exam = course.finalExam.toObject();
    if (req.user.role !== 'admin') {
      exam.questions = exam.questions.map(({ correctIndex, explanation, ...q }) => q);
    }
    res.json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
};
