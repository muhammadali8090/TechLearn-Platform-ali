import Review from '../models/Review.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';

export const getCourseReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ courseId: req.params.id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

    const histogram = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { histogram[r.rating] = (histogram[r.rating] || 0) + 1; });

    res.json({ success: true, data: { reviews, avg: Math.round(avg * 10) / 10, total, histogram } });
  } catch (err) {
    next(err);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating 1-5 is required', statusCode: 400 });
    }

    // Check if enrolled and has completed at least one lesson
    const progress = await Progress.findOne({ user: req.user._id, course: req.params.id });
    if (!progress || progress.completedLessons.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Complete at least one lesson before reviewing',
        statusCode: 403,
      });
    }

    const review = await Review.findOneAndUpdate(
      { userId: req.user._id, courseId: req.params.id },
      { $set: { rating, comment: comment || '' } },
      { new: true, upsert: true }
    ).populate('userId', 'name avatar');

    // Update course avgRating
    const allReviews = await Review.find({ courseId: req.params.id });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Course.findByIdAndUpdate(req.params.id, { avgRating: Math.round(avg * 10) / 10 });

    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found', statusCode: 404 });

    const isOwner = review.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden', statusCode: 403 });
    }

    await review.deleteOne();
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
