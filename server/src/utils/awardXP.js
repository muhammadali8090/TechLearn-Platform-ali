import User from '../models/User.js';
import XPEvent from '../models/XPEvent.js';

const XP_VALUES = {
  lesson_complete: 10,
  quiz_passed: 20,
  course_complete: 100,
  streak_day: 5,
  forum_post: 5,
};

export const awardXP = async (userId, type, courseId = null) => {
  try {
    const points = XP_VALUES[type] || 0;
    if (!points) return;

    await XPEvent.create({ userId, type, points, courseId });
    await User.findByIdAndUpdate(userId, { $inc: { xp: points } });
  } catch (err) {
    console.error('awardXP error:', err.message);
  }
};
