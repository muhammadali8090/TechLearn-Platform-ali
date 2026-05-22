import CodeSubmission from '../models/CodeSubmission.js';

export const createSubmission = async (req, res, next) => {
  try {
    const { lessonId, courseId, code, language } = req.body;
    if (!lessonId || !courseId || !code) {
      return res.status(400).json({ success: false, error: 'lessonId, courseId, and code are required', statusCode: 400 });
    }

    const submission = await CodeSubmission.create({
      userId: req.user._id,
      lessonId,
      courseId,
      code,
      language: language || 'javascript',
    });

    const populated = await CodeSubmission.findById(submission._id)
      .populate('userId', 'name avatar')
      .populate('lessonId', 'title')
      .populate('courseId', 'title slug');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const getSubmissions = async (req, res, next) => {
  try {
    const { lessonId } = req.query;
    const filter = {};
    if (lessonId) filter.lessonId = lessonId;

    const submissions = await CodeSubmission.find(filter)
      .populate('userId', 'name avatar')
      .populate('lessonId', 'title')
      .populate('courseId', 'title slug')
      .populate('reviews.reviewerId', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: submissions });
  } catch (err) {
    next(err);
  }
};

export const addReview = async (req, res, next) => {
  try {
    const { comment, rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating 1-5 is required', statusCode: 400 });
    }

    const submission = await CodeSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found', statusCode: 404 });

    if (submission.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot review your own submission', statusCode: 400 });
    }

    const alreadyReviewed = submission.reviews.some(
      (r) => r.reviewerId.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, error: 'Already reviewed', statusCode: 400 });
    }

    submission.reviews.push({ reviewerId: req.user._id, comment: comment || '', rating });
    await submission.save();

    const populated = await CodeSubmission.findById(submission._id)
      .populate('userId', 'name avatar')
      .populate('lessonId', 'title')
      .populate('courseId', 'title slug')
      .populate('reviews.reviewerId', 'name avatar');

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};
