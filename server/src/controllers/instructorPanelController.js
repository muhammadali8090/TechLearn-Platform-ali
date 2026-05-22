import { v4 as uuidv4 } from 'uuid';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Exam from '../models/Exam.js';
import ExamAttempt from '../models/ExamAttempt.js';

// GET /api/instructor-panel/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const instructorId = req.user._id;

    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);

    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);

    // Count lessons across all courses
    let totalLessons = 0;
    for (const course of courses) {
      for (const section of course.sections || []) {
        totalLessons += (section.lessons || []).length;
      }
    }

    // Avg quiz scores across all progress records for instructor's courses
    const progressRecords = await Progress.find({ course: { $in: courseIds } });
    let totalQuizScore = 0;
    let quizScoreCount = 0;
    for (const p of progressRecords) {
      for (const qr of p.quizResults || []) {
        if (typeof qr.score === 'number') {
          totalQuizScore += qr.score;
          quizScoreCount++;
        }
      }
    }
    const avgQuizScore = quizScoreCount > 0 ? Math.round(totalQuizScore / quizScoreCount) : 0;

    // Total certificates issued for instructor's courses
    const allUsers = await User.find({
      'certificates.courseId': { $in: courseIds },
    });
    let totalCertificates = 0;
    for (const u of allUsers) {
      for (const cert of u.certificates || []) {
        if (courseIds.some((id) => id.equals(cert.courseId))) {
          totalCertificates++;
        }
      }
    }

    // Recent activity: last 10 enrollments
    const recentEnrollments = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      { $match: { 'enrolledCourses.courseId': { $in: courseIds } } },
      { $sort: { 'enrolledCourses.enrolledAt': -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'courses',
          localField: 'enrolledCourses.courseId',
          foreignField: '_id',
          as: 'courseInfo',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          enrolledAt: '$enrolledCourses.enrolledAt',
          courseTitle: { $arrayElemAt: ['$courseInfo.title', 0] },
        },
      },
    ]);

    // Top courses by enrollment
    const topCourses = await Promise.all(
      courses.slice(0, 5).map(async (course) => {
        const progs = await Progress.find({ course: course._id });
        const completion =
          progs.length > 0
            ? Math.round(progs.reduce((s, p) => s + (p.overallPercent || 0), 0) / progs.length)
            : 0;

        let qScoreSum = 0;
        let qCount = 0;
        for (const p of progs) {
          for (const qr of p.quizResults || []) {
            if (typeof qr.score === 'number') {
              qScoreSum += qr.score;
              qCount++;
            }
          }
        }
        const avgScore = qCount > 0 ? Math.round(qScoreSum / qCount) : 0;

        return {
          _id: course._id,
          title: course.title,
          enrolled: course.enrolledCount || 0,
          completionRate: completion,
          avgQuizScore: avgScore,
          status: course.status,
          thumbnail: course.thumbnail,
        };
      })
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalCourses,
          totalStudents,
          totalLessons,
          avgQuizScore,
          totalCertificates,
          totalRevenue: 0,
        },
        recentActivity: recentEnrollments,
        topCourses,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/instructor-panel/courses
export const getCourses = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({ instructor: instructorId }).sort({ createdAt: -1 });

    const result = await Promise.all(
      courses.map(async (course) => {
        let lessonCount = 0;
        for (const section of course.sections || []) {
          lessonCount += (section.lessons || []).length;
        }

        const progs = await Progress.find({ course: course._id });
        const completion =
          progs.length > 0
            ? Math.round(progs.reduce((s, p) => s + (p.overallPercent || 0), 0) / progs.length)
            : 0;

        let qScoreSum = 0;
        let qCount = 0;
        for (const p of progs) {
          for (const qr of p.quizResults || []) {
            if (typeof qr.score === 'number') {
              qScoreSum += qr.score;
              qCount++;
            }
          }
        }
        const avgRating = qCount > 0 ? Math.round(qScoreSum / qCount) : 0;

        return {
          _id: course._id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail: course.thumbnail,
          category: course.category,
          level: course.level,
          status: course.status,
          enrolledCount: course.enrolledCount || 0,
          lessonCount,
          completionRate: completion,
          avgRating,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        };
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/instructor-panel/courses/:id/analytics
export const getCourseAnalytics = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const course = await Course.findOne({ _id: req.params.id, instructor: instructorId });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found', statusCode: 404 });
    }

    // Enrollment trend: last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const enrollmentTrend = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      {
        $match: {
          'enrolledCourses.courseId': course._id,
          'enrolledCourses.enrolledAt': { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$enrolledCourses.enrolledAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build all lesson IDs for this course
    const lessonIds = [];
    for (const section of course.sections || []) {
      for (const lessonId of section.lessons || []) {
        lessonIds.push(lessonId);
      }
    }

    // Fetch lessons
    const lessons = await Lesson.find({ _id: { $in: lessonIds } });
    const progressRecords = await Progress.find({ course: course._id });

    const totalStudents = progressRecords.length;

    // Lesson completion rates
    const lessonStats = lessons.map((lesson) => {
      let completions = 0;
      let quizAttempts = 0;
      let quizPasses = 0;

      for (const p of progressRecords) {
        const completed = (p.completedLessons || []).some((cl) =>
          cl.lessonId.equals(lesson._id)
        );
        if (completed) completions++;

        const qr = (p.quizResults || []).find((q) => q.lessonId.equals(lesson._id));
        if (qr) {
          quizAttempts++;
          if ((qr.score || 0) >= 70) quizPasses++;
        }
      }

      return {
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        views: completions,
        completionRate: totalStudents > 0 ? Math.round((completions / totalStudents) * 100) : 0,
        quizPassRate:
          quizAttempts > 0 ? Math.round((quizPasses / quizAttempts) * 100) : 0,
        questionCount: (lesson.quiz?.questions || []).length,
      };
    });

    // Exam stats
    const exam = course.finalExam
      ? await Exam.findById(course.finalExam)
      : null;
    const examAttempts = await ExamAttempt.find({ course: course._id });
    const examPasses = examAttempts.filter((a) => a.passed).length;
    const examAvgScore =
      examAttempts.length > 0
        ? Math.round(examAttempts.reduce((s, a) => s + (a.score || 0), 0) / examAttempts.length)
        : 0;

    // Overall course stats
    const completionRate =
      totalStudents > 0
        ? Math.round(
            progressRecords.reduce((s, p) => s + (p.overallPercent || 0), 0) / totalStudents
          )
        : 0;

    let qScoreSum = 0;
    let qCount = 0;
    for (const p of progressRecords) {
      for (const qr of p.quizResults || []) {
        if (typeof qr.score === 'number') {
          qScoreSum += qr.score;
          qCount++;
        }
      }
    }
    const avgQuizScore = qCount > 0 ? Math.round(qScoreSum / qCount) : 0;

    res.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          status: course.status,
        },
        stats: {
          enrolledStudents: course.enrolledCount || 0,
          completionRate,
          avgQuizScore,
          examAttempts: examAttempts.length,
          examPassRate:
            examAttempts.length > 0
              ? Math.round((examPasses / examAttempts.length) * 100)
              : 0,
          examAvgScore,
        },
        enrollmentTrend,
        lessonStats,
        exam: exam
          ? {
              _id: exam._id,
              passingScore: exam.passingScore,
              questionCount: (exam.questions || []).length,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/instructor-panel/courses/:id/students
export const getCourseStudents = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const course = await Course.findOne({ _id: req.params.id, instructor: instructorId });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found', statusCode: 404 });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const enrolledUsers = await User.find({
      'enrolledCourses.courseId': course._id,
    })
      .select('name email avatar enrolledCourses certificates')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({
      'enrolledCourses.courseId': course._id,
    });

    const students = await Promise.all(
      enrolledUsers.map(async (user) => {
        const enrollment = user.enrolledCourses.find((e) => e.courseId.equals(course._id));
        const progress = await Progress.findOne({ user: user._id, course: course._id });
        const examAttempt = await ExamAttempt.findOne({
          user: user._id,
          course: course._id,
        }).sort({ attemptedAt: -1 });

        const hasCertificate = user.certificates.some((c) => c.courseId.equals(course._id));

        let avgQuizScore = 0;
        if (progress && progress.quizResults.length > 0) {
          avgQuizScore = Math.round(
            progress.quizResults.reduce((s, q) => s + (q.score || 0), 0) /
              progress.quizResults.length
          );
        }

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          enrolledAt: enrollment?.enrolledAt,
          lastAccessedAt: enrollment?.lastAccessedAt,
          progress: progress?.overallPercent || 0,
          avgQuizScore,
          examStatus: examAttempt
            ? examAttempt.passed
              ? 'passed'
              : 'failed'
            : 'not_taken',
          examScore: examAttempt?.score || null,
          hasCertificate,
        };
      })
    );

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/instructor-panel/courses/:id/certificates/issue
export const issueCertificate = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required', statusCode: 400 });
    }

    const course = await Course.findOne({ _id: req.params.id, instructor: instructorId });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found', statusCode: 404 });
    }

    const student = await User.findById(userId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found', statusCode: 404 });
    }

    // Check if already issued
    const alreadyIssued = student.certificates.some((c) => c.courseId.equals(course._id));
    if (alreadyIssued) {
      return res.status(400).json({
        success: false,
        error: 'Certificate already issued for this course',
        statusCode: 400,
      });
    }

    const certificateId = uuidv4();
    student.certificates.push({ courseId: course._id, certificateId });
    await student.save();

    res.json({
      success: true,
      data: { certificateId, issuedTo: student.name, course: course.title },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/instructor-panel/certificates
export const getCertificates = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);
    const courseMap = {};
    for (const c of courses) {
      courseMap[c._id.toString()] = c.title;
    }

    const usersWithCerts = await User.find({
      'certificates.courseId': { $in: courseIds },
    }).select('name email certificates');

    const certificates = [];
    for (const user of usersWithCerts) {
      for (const cert of user.certificates || []) {
        const courseIdStr = cert.courseId?.toString();
        if (courseIdStr && courseMap[courseIdStr]) {
          certificates.push({
            _id: cert._id,
            certificateId: cert.certificateId,
            studentName: user.name,
            studentEmail: user.email,
            studentId: user._id,
            courseId: cert.courseId,
            courseTitle: courseMap[courseIdStr],
            issuedAt: cert.issuedAt,
          });
        }
      }
    }

    certificates.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

    // Stats by course
    const byCourse = {};
    for (const cert of certificates) {
      const key = cert.courseId.toString();
      if (!byCourse[key]) {
        byCourse[key] = { courseTitle: cert.courseTitle, count: 0 };
      }
      byCourse[key].count++;
    }

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = certificates.filter((c) => new Date(c.issuedAt) >= thisMonthStart).length;

    res.json({
      success: true,
      data: {
        certificates,
        stats: {
          total: certificates.length,
          thisMonth,
          byCourse: Object.values(byCourse),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/instructor-panel/quizzes
export const getQuizzes = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);
    const courseMap = {};
    for (const c of courses) {
      courseMap[c._id.toString()] = c.title;
    }

    // Get all lessons for instructor's courses that have quiz questions
    const lessons = await Lesson.find({
      course: { $in: courseIds },
      'quiz.questions.0': { $exists: true },
    });

    const progressRecords = await Progress.find({ course: { $in: courseIds } });

    const quizzes = lessons.map((lesson) => {
      const courseTitle = courseMap[lesson.course?.toString()] || 'Unknown Course';
      const questionCount = (lesson.quiz?.questions || []).length;

      let totalAttempts = 0;
      let totalScore = 0;
      const optionSelections = lesson.quiz.questions.map(() =>
        Array(4).fill(0)
      );

      for (const prog of progressRecords) {
        if (!prog.course.equals(lesson.course)) continue;
        const qr = (prog.quizResults || []).find((q) => q.lessonId.equals(lesson._id));
        if (qr) {
          totalAttempts++;
          totalScore += qr.score || 0;
        }
      }

      const avgScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

      return {
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        courseId: lesson.course,
        courseTitle,
        questionCount,
        avgScore,
        attempts: totalAttempts,
        questions: lesson.quiz.questions.map((q, idx) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          optionSelections: optionSelections[idx],
        })),
      };
    });

    res.json({ success: true, data: quizzes });
  } catch (err) {
    next(err);
  }
};

// GET /api/instructor-panel/students
export const getAllStudents = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);
    const courseMap = {};
    for (const c of courses) {
      courseMap[c._id.toString()] = { title: c.title, _id: c._id };
    }

    const search = req.query.search || '';
    const courseFilter = req.query.courseId || null;

    const matchCourseIds = courseFilter ? [courseFilter] : courseIds;

    const enrolledUsers = await User.find({
      'enrolledCourses.courseId': { $in: matchCourseIds },
      ...(search
        ? {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ],
          }
        : {}),
    }).select('name email avatar enrolledCourses certificates');

    const students = await Promise.all(
      enrolledUsers.map(async (user) => {
        const relevantEnrollments = user.enrolledCourses.filter((e) =>
          courseIds.some((id) => id.equals(e.courseId))
        );

        const lastActive =
          relevantEnrollments.length > 0
            ? relevantEnrollments.reduce((latest, e) =>
                new Date(e.lastAccessedAt) > new Date(latest.lastAccessedAt) ? e : latest
              ).lastAccessedAt
            : null;

        const progressRecords = await Progress.find({
          user: user._id,
          course: { $in: courseIds },
        });

        const overallProgress =
          progressRecords.length > 0
            ? Math.round(
                progressRecords.reduce((s, p) => s + (p.overallPercent || 0), 0) /
                  progressRecords.length
              )
            : 0;

        const certificatesEarned = user.certificates.filter((c) =>
          courseIds.some((id) => id.equals(c.courseId))
        ).length;

        const perCourse = await Promise.all(
          relevantEnrollments.map(async (enrollment) => {
            const courseIdStr = enrollment.courseId?.toString();
            const prog = progressRecords.find((p) => p.course.equals(enrollment.courseId));
            return {
              courseId: enrollment.courseId,
              courseTitle: courseMap[courseIdStr]?.title || 'Unknown',
              enrolledAt: enrollment.enrolledAt,
              lastAccessedAt: enrollment.lastAccessedAt,
              progress: prog?.overallPercent || 0,
            };
          })
        );

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          enrolledCoursesCount: relevantEnrollments.length,
          lastActive,
          overallProgress,
          certificatesEarned,
          perCourse,
        };
      })
    );

    res.json({
      success: true,
      data: {
        students,
        courses: courses.map((c) => ({ _id: c._id, title: c.title })),
      },
    });
  } catch (err) {
    next(err);
  }
};
