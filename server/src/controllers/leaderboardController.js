import mongoose from 'mongoose';
import User from '../models/User.js';
import XPEvent from '../models/XPEvent.js';

export const getLeaderboard = async (req, res, next) => {
  try {
    const { scope = 'global', courseId } = req.query;

    if (scope === 'course' && courseId) {
      // Per-course leaderboard: users who earned XP in this course
      const events = await XPEvent.aggregate([
        { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
        { $group: { _id: '$userId', xp: { $sum: '$points' } } },
        { $sort: { xp: -1 } },
        { $limit: 50 },
      ]);

      const userIds = events.map((e) => e._id);
      const users = await User.find({ _id: { $in: userIds } }).select('name avatar xp');
      const userMap = {};
      users.forEach((u) => { userMap[u._id.toString()] = u; });

      const ranked = events.map((e, idx) => {
        const u = userMap[e._id.toString()];
        return {
          rank: idx + 1,
          userId: e._id,
          name: u?.name || 'Unknown',
          avatar: u?.avatar || '',
          xp: e.xp,
        };
      });

      return res.json({ success: true, data: ranked });
    }

    // Global leaderboard
    const users = await User.find({})
      .select('name avatar xp streakDays')
      .sort({ xp: -1 })
      .limit(50);

    const ranked = users.map((u, idx) => ({
      rank: idx + 1,
      userId: u._id,
      name: u.name,
      avatar: u.avatar,
      xp: u.xp || 0,
      streakDays: u.streakDays || 0,
      tier: getTier(u.xp || 0),
    }));

    let myRank = null;
    if (req.user) {
      const myPosition = await User.countDocuments({ xp: { $gt: req.user.xp || 0 } });
      myRank = myPosition + 1;
    }

    res.json({ success: true, data: { leaderboard: ranked, myRank } });
  } catch (err) {
    next(err);
  }
};

function getTier(xp) {
  if (xp >= 1000) return 'Platinum';
  if (xp >= 500) return 'Gold';
  if (xp >= 200) return 'Silver';
  return 'Bronze';
}
