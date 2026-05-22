import User from '../models/User.js';
import Course from '../models/Course.js';

export const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -email')
      .populate('enrolledCourses.courseId', 'title slug thumbnail category');

    if (!user) return res.status(404).json({ success: false, error: 'User not found', statusCode: 404 });
    if (!user.isPublic && (!req.user || req.user._id.toString() !== user._id.toString())) {
      return res.status(403).json({ success: false, error: 'Profile is private', statusCode: 403 });
    }

    const completedCourseIds = user.certificates.map((c) => c.courseId?.toString()).filter(Boolean);
    const completedCourses = await Course.find({ _id: { $in: completedCourseIds } })
      .select('title slug thumbnail category');

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        completedCourses,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'bio', 'website', 'github', 'skills', 'isPublic', 'avatar'];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
