import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import { createNotification } from './notificationController.js';
import { awardXP } from '../utils/awardXP.js';

export const getCourses = async (req, res, next) => {
  try {
    const { category, level, search } = req.query;
    const filter = { status: 'published' };
    if (category && category !== 'All') filter.category = category;
    if (level && level !== 'All') filter.level = level;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const courses = await Course.find(filter)
      .populate('instructor', 'name avatar bio')
      .populate({ path: 'sections.lessons', select: 'title order duration' })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
};

export const getCourseBySlug = async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, status: 'published' })
      .populate('instructor', 'name avatar bio')
      .populate({ path: 'sections.lessons', select: 'title order duration description videoUrl' })
      .populate('finalExam', 'passingScore timeLimit questions');

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found', statusCode: 404 });
    }

    // Strip correct answers from lessons' quizzes when returning course detail
    const courseObj = course.toObject();
    res.json({ success: true, data: courseObj });
  } catch (err) {
    next(err);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const { title, description, category, level, thumbnail, estimatedDuration, tags } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const course = await Course.create({
      title, slug, description, category, level,
      thumbnail: thumbnail || '',
      estimatedDuration: estimatedDuration || 0,
      tags: tags || [],
      instructor: req.user._id,
      status: 'draft',
    });
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found', statusCode: 404 });

    const allowed = ['title', 'description', 'category', 'level', 'thumbnail', 'estimatedDuration', 'tags', 'sections', 'status'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) course[key] = req.body[key];
    });

    if (req.body.title && req.body.title !== course.title) {
      course.slug = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    await course.save();
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found', statusCode: 404 });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

export const publishCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found', statusCode: 404 });
    course.status = 'published';
    await course.save();
    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

export const enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found', statusCode: 404 });

    const user = await User.findById(req.user._id);
    const alreadyEnrolled = user.enrolledCourses.some(
      (e) => e.courseId.toString() === course._id.toString()
    );
    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, error: 'Already enrolled', statusCode: 400 });
    }

    user.enrolledCourses.push({ courseId: course._id });
    await user.save();

    course.enrolledCount = (course.enrolledCount || 0) + 1;
    await course.save();

    // Create progress doc
    await Progress.create({ user: user._id, course: course._id });

    // Emit enrolled notification
    await createNotification({
      userId: user._id,
      type: 'enrolled',
      title: 'Enrolled in a new course!',
      message: `You've successfully enrolled in "${course.title}". Start learning today!`,
      link: `/learn/${course.slug}`,
    });

    res.json({ success: true, data: { message: 'Enrolled successfully' } });
  } catch (err) {
    next(err);
  }
};

export const getCourseProgress = async (req, res, next) => {
  try {
    const progress = await Progress.findOne({ user: req.user._id, course: req.params.id });
    if (!progress) return res.json({ success: true, data: null });
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
};

export const completeLesson = async (req, res, next) => {
  try {
    const { id: courseId, lessonId } = req.params;
    let progress = await Progress.findOne({ user: req.user._id, course: courseId });
    if (!progress) {
      progress = await Progress.create({ user: req.user._id, course: courseId });
    }

    const alreadyDone = progress.completedLessons.some((l) => l.lessonId.toString() === lessonId);
    if (!alreadyDone) {
      progress.completedLessons.push({ lessonId, completedAt: new Date() });
    }

    // Recalculate overall percent
    const course = await Course.findById(courseId).populate('sections.lessons');
    const allLessons = course.sections.flatMap((s) => s.lessons);
    const totalLessons = allLessons.length;
    if (totalLessons > 0) {
      progress.overallPercent = Math.round((progress.completedLessons.length / totalLessons) * 100);
    }

    // Update last accessed
    const user = await User.findById(req.user._id);
    const enrollment = user.enrolledCourses.find((e) => e.courseId.toString() === courseId);
    if (enrollment) {
      enrollment.lastAccessedAt = new Date();
      await user.save();
    }

    await progress.save();

    // Emit lesson_complete notification only for newly completed lessons
    if (!alreadyDone) {
      const lesson = await Lesson.findById(lessonId).select('title');
      const courseDoc = await Course.findById(courseId).select('title slug');
      await createNotification({
        userId: req.user._id,
        type: 'lesson_complete',
        title: 'Lesson completed!',
        message: `You completed "${lesson?.title || 'a lesson'}" in ${courseDoc?.title || 'a course'}.`,
        link: `/learn/${courseDoc?.slug || courseId}?lesson=${lessonId}`,
      });
      await awardXP(req.user._id, 'lesson_complete', courseId);
    }

    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
};

export const submitQuiz = async (req, res, next) => {
  try {
    const { id: courseId, lessonId } = req.params;
    const { answers } = req.body;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found', statusCode: 404 });

    const questions = lesson.quiz?.questions || [];
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && answers[idx] === q.correctIndex) correct++;
    });
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    let progress = await Progress.findOne({ user: req.user._id, course: courseId });
    if (!progress) progress = await Progress.create({ user: req.user._id, course: courseId });

    const existing = progress.quizResults.findIndex((r) => r.lessonId.toString() === lessonId);
    if (existing >= 0) {
      progress.quizResults[existing].score = score;
      progress.quizResults[existing].attemptedAt = new Date();
    } else {
      progress.quizResults.push({ lessonId, score, attemptedAt: new Date() });
    }
    await progress.save();

    const questionsWithAnswers = questions.map((q, idx) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      userAnswer: answers[idx],
      correct: answers[idx] === q.correctIndex,
    }));

    // Emit quiz_passed notification if score >= 70
    if (score >= 70) {
      const lesson = await Lesson.findById(lessonId).select('title');
      await createNotification({
        userId: req.user._id,
        type: 'quiz_passed',
        title: 'Quiz passed!',
        message: `Great job! You scored ${score}% on the quiz for "${lesson?.title || 'a lesson'}".`,
        link: `/learn/${(await Course.findById(courseId).select('slug'))?.slug || courseId}?lesson=${lessonId}`,
      });
      await awardXP(req.user._id, 'quiz_passed', courseId);
    }

    res.json({ success: true, data: { score, correct, total: questions.length, questions: questionsWithAnswers } });
  } catch (err) {
    next(err);
  }
};

export const submitCodingChallenge = async (req, res, next) => {
  try {
    const { id: courseId, lessonId } = req.params;
    const { passed } = req.body;

    let progress = await Progress.findOne({ user: req.user._id, course: courseId });
    if (!progress) progress = await Progress.create({ user: req.user._id, course: courseId });

    const existing = progress.codingResults.findIndex((r) => r.lessonId.toString() === lessonId);
    if (existing >= 0) {
      progress.codingResults[existing].passed = passed;
      progress.codingResults[existing].submittedAt = new Date();
    } else {
      progress.codingResults.push({ lessonId, passed, submittedAt: new Date() });
    }
    await progress.save();

    // Emit challenge_passed notification
    if (passed) {
      const lesson = await Lesson.findById(lessonId).select('title');
      const courseDoc = await Course.findById(courseId).select('title slug');
      await createNotification({
        userId: req.user._id,
        type: 'challenge_passed',
        title: 'Coding challenge passed!',
        message: `You passed the coding challenge in "${lesson?.title || 'a lesson'}" — great work!`,
        link: `/learn/${courseDoc?.slug || courseId}?lesson=${lessonId}`,
      });
    }

    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
};

export const downloadResource = async (req, res, next) => {
  try {
    const { lessonId, resourceIndex } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Lesson not found', statusCode: 404 });
    }

    const idx = parseInt(resourceIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= lesson.resources.length) {
      return res.status(404).json({ success: false, error: 'Resource not found', statusCode: 404 });
    }

    lesson.resources[idx].downloadCount = (lesson.resources[idx].downloadCount || 0) + 1;
    await lesson.save();

    res.json({ success: true, data: { url: lesson.resources[idx].url, downloadCount: lesson.resources[idx].downloadCount } });
  } catch (err) {
    next(err);
  }
};
