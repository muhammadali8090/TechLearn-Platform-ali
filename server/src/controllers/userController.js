import User from '../models/User.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import ExamAttempt from '../models/ExamAttempt.js';

function computeStreakDays(completedLessons) {
  if (!completedLessons || completedLessons.length === 0) return 0;

  const daySet = new Set(
    completedLessons.map((l) => {
      const d = new Date(l.completedAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const days = Array.from(daySet).map((s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m, d).getTime();
  }).sort((a, b) => b - a);

  const msPerDay = 86400000;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] === msPerDay) {
      streak++;
    } else {
      break;
    }
  }

  // If most recent day is not today or yesterday, streak is broken
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mostRecent = days[0];
  const diff = today.getTime() - mostRecent;
  if (diff > msPerDay) return 0;

  return streak;
}

function computeWeeklyGoal(completedLessons) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const count = (completedLessons || []).filter((l) => new Date(l.completedAt) >= weekStart).length;
  return { completed: count, target: 5 };
}

export const getDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('enrolledCourses.courseId', 'title slug thumbnail category level');

    const enrolledCourseIds = user.enrolledCourses.map((e) => e.courseId?._id).filter(Boolean);
    const progresses = await Progress.find({ user: req.user._id, course: { $in: enrolledCourseIds } });

    const enrolledWithProgress = user.enrolledCourses
      .filter((e) => e.courseId)
      .map((e) => {
        const prog = progresses.find((p) => p.course.toString() === e.courseId._id.toString());
        return {
          course: e.courseId,
          enrolledAt: e.enrolledAt,
          lastAccessedAt: e.lastAccessedAt,
          overallPercent: prog?.overallPercent || 0,
          completedLessons: prog?.completedLessons?.length || 0,
        };
      });

    const completedCourses = enrolledWithProgress.filter((e) => e.overallPercent === 100);

    // Recent activity
    const recentActivity = [];
    for (const prog of progresses) {
      const course = user.enrolledCourses.find((e) => e.courseId?._id?.toString() === prog.course.toString());
      if (!course?.courseId) continue;
      const recent = prog.completedLessons.slice(-3).map((l) => ({
        type: 'lesson',
        courseTitle: course.courseId.title,
        courseSlug: course.courseId.slug,
        lessonId: l.lessonId,
        completedAt: l.completedAt,
      }));
      const quizRecent = prog.quizResults.slice(-2).map((q) => ({
        type: 'quiz',
        courseTitle: course.courseId.title,
        courseSlug: course.courseId.slug,
        lessonId: q.lessonId,
        score: q.score,
        completedAt: q.attemptedAt,
      }));
      const challengeRecent = prog.codingResults.filter((c) => c.passed).slice(-2).map((c) => ({
        type: 'challenge',
        courseTitle: course.courseId.title,
        courseSlug: course.courseId.slug,
        lessonId: c.lessonId,
        completedAt: c.submittedAt,
      }));
      recentActivity.push(...recent, ...quizRecent, ...challengeRecent);
    }
    user.certificates.forEach((cert) => {
      recentActivity.push({
        type: 'certificate',
        courseId: cert.courseId,
        completedAt: cert.issuedAt,
      });
    });
    recentActivity.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    // Compute streak
    const allCompleted = progresses.flatMap((p) => p.completedLessons);
    const streakDays = computeStreakDays(allCompleted);

    // Weekly goal
    const weeklyGoal = computeWeeklyGoal(allCompleted);

    // Total quiz score average
    const allQuizScores = progresses.flatMap((p) => p.quizResults.map((q) => q.score));
    const totalQuizScore = allQuizScores.length > 0
      ? Math.round(allQuizScores.reduce((a, b) => a + b, 0) / allQuizScores.length)
      : 0;

    // Last 5 quiz results for chart
    const allQuizResults = [];
    for (const prog of progresses) {
      const course = user.enrolledCourses.find((e) => e.courseId?._id?.toString() === prog.course.toString());
      if (!course?.courseId) continue;
      prog.quizResults.forEach((q) => {
        allQuizResults.push({
          score: q.score,
          lessonId: q.lessonId,
          attemptedAt: q.attemptedAt,
          courseTitle: course.courseId.title,
        });
      });
    }
    allQuizResults.sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));
    const recentQuizResults = allQuizResults.slice(0, 5).reverse();

    // Top category
    const categoryCounts = {};
    user.enrolledCourses.forEach((e) => {
      if (e.courseId?.category) {
        categoryCounts[e.courseId.category] = (categoryCounts[e.courseId.category] || 0) + 1;
      }
    });
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Recommended courses (3 published, not enrolled, prefer same category)
    const enrolledIds = enrolledCourseIds.map((id) => id.toString());
    let recommendedQuery = { status: 'published', _id: { $nin: enrolledCourseIds } };
    if (topCategory) recommendedQuery.category = topCategory;

    let recommended = await Course.find(recommendedQuery)
      .select('title slug thumbnail category level estimatedDuration enrolledCount')
      .limit(3);

    if (recommended.length < 3) {
      const more = await Course.find({ status: 'published', _id: { $nin: enrolledCourseIds } })
        .select('title slug thumbnail category level estimatedDuration enrolledCount')
        .limit(3 - recommended.length);
      recommended = [...recommended, ...more];
    }

    // Recent bookmarks (top 3)
    const userWithBookmarks = await User.findById(req.user._id)
      .populate('bookmarks.courseId', 'title slug thumbnail')
      .populate('bookmarks.lessonId', 'title');
    const recentBookmarks = userWithBookmarks.bookmarks
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
      .slice(0, 3)
      .map((b) => ({
        _id: b._id,
        course: b.courseId,
        lesson: b.lessonId,
        note: b.note,
        savedAt: b.savedAt,
      }));

    res.json({
      success: true,
      data: {
        enrolledCourses: enrolledWithProgress,
        completedCoursesCount: completedCourses.length,
        certificatesCount: user.certificates.length,
        certificates: user.certificates,
        recentActivity: recentActivity.slice(0, 10),
        streakDays,
        weeklyGoal,
        totalQuizScore,
        recentQuizResults,
        topCategory,
        recommendedCourses: recommended,
        recentBookmarks,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getLearningStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('enrolledCourses.courseId', 'title slug category');
    const enrolledCourseIds = user.enrolledCourses.map((e) => e.courseId?._id).filter(Boolean);
    const progresses = await Progress.find({ user: req.user._id, course: { $in: enrolledCourseIds } });

    const allCompleted = progresses.flatMap((p) => p.completedLessons);
    const allQuizScores = progresses.flatMap((p) => p.quizResults.map((q) => q.score));

    const streakDays = computeStreakDays(allCompleted);
    const weeklyGoal = computeWeeklyGoal(allCompleted);
    const totalQuizScore = allQuizScores.length > 0
      ? Math.round(allQuizScores.reduce((a, b) => a + b, 0) / allQuizScores.length)
      : 0;

    const categoryCounts = {};
    user.enrolledCourses.forEach((e) => {
      if (e.courseId?.category) {
        categoryCounts[e.courseId.category] = (categoryCounts[e.courseId.category] || 0) + 1;
      }
    });
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({
      success: true,
      data: { streakDays, weeklyGoal, totalQuizScore, topCategory },
    });
  } catch (err) {
    next(err);
  }
};

export const getCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    const user = await User.findOne({ 'certificates.certificateId': certificateId });
    if (!user) return res.status(404).json({ success: false, error: 'Certificate not found', statusCode: 404 });

    const cert = user.certificates.find((c) => c.certificateId === certificateId);
    const course = await Course.findById(cert.courseId).select('title category level');

    res.json({
      success: true,
      data: {
        certificateId: cert.certificateId,
        issuedAt: cert.issuedAt,
        studentName: user.name,
        course,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getInstructors = async (req, res, next) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('name bio avatar createdAt');
    const result = await Promise.all(
      admins.map(async (admin) => {
        const courseCount = await Course.countDocuments({ instructor: admin._id, status: 'published' });
        return { ...admin.toObject(), courseCount };
      })
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getInstructor = async (req, res, next) => {
  try {
    const instructor = await User.findOne({ _id: req.params.id, role: 'admin' }).select('name bio avatar createdAt');
    if (!instructor) return res.status(404).json({ success: false, error: 'Instructor not found', statusCode: 404 });

    const courses = await Course.find({ instructor: instructor._id, status: 'published' })
      .select('title slug thumbnail category level estimatedDuration enrolledCount');

    res.json({ success: true, data: { instructor, courses } });
  } catch (err) {
    next(err);
  }
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const getAdminCourses = async (req, res, next) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name')
      .populate('finalExam', '_id')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
};
