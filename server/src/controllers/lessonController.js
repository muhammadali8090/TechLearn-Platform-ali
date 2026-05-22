import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';

export const createLesson = async (req, res, next) => {
  try {
    const { courseId, sectionIndex } = req.params;
    const { title, description, order, videoUrl, resources, quiz, codingChallenge, duration } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found', statusCode: 404 });

    const lesson = await Lesson.create({
      title, description, order: order || 0, videoUrl: videoUrl || '',
      resources: resources || [], quiz: quiz || { questions: [] },
      codingChallenge: codingChallenge || {},
      course: courseId, duration: duration || 10,
    });

    const sIdx = parseInt(sectionIndex);
    if (course.sections[sIdx]) {
      course.sections[sIdx].lessons.push(lesson._id);
      await course.save();
    }

    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
};

export const updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.lessonId, req.body, { new: true });
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found', statusCode: 404 });
    res.json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
};

export const getLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found', statusCode: 404 });

    // For students, strip quiz correct answers
    const lessonObj = lesson.toObject();
    if (req.user.role !== 'admin') {
      if (lessonObj.quiz?.questions) {
        lessonObj.quiz.questions = lessonObj.quiz.questions.map(({ correctIndex, explanation, ...q }) => ({
          ...q,
          _correctIndex: correctIndex,
          _explanation: explanation,
        }));
      }
    }
    res.json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
};

export const deleteLesson = async (req, res, next) => {
  try {
    await Lesson.findByIdAndDelete(req.params.lessonId);
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
