import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Award, TrendingUp, Clock, ChevronRight,
  CheckCircle, HelpCircle, Flame, Zap, Download, Code,
  Bookmark, StickyNote, Star, Target, Sparkles, BarChart2, MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getDashboard } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import { useCountUp } from '../hooks/useCountUp';
import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

const activityTypeConfig = {
  lesson: {
    icon: CheckCircle,
    color: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-500',
    border: 'border-l-emerald-400',
    label: 'Completed a lesson in',
  },
  quiz: {
    icon: HelpCircle,
    color: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-500',
    border: 'border-l-blue-400',
    label: 'Passed a quiz in',
  },
  challenge: {
    icon: Code,
    color: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-500',
    border: 'border-l-violet-400',
    label: 'Passed a challenge in',
  },
  certificate: {
    icon: Award,
    color: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-500',
    border: 'border-l-amber-400',
    label: 'Earned certificate',
  },
};

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatCard({ icon: Icon, label, value, gradient, delay = 0 }) {
  const numericVal = typeof value === 'number' ? value : parseInt(value) || 0;
  const animatedVal = useCountUp(numericVal, 1000);
  const displayVal = typeof value === 'number' ? animatedVal : value;

  return (
    <motion.div
      variants={itemVariants}
      className="relative bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm overflow-hidden group hover:shadow-lg hover:shadow-indigo-500/10 transition-shadow duration-300"
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <motion.p
            className="text-2xl font-extrabold text-[var(--text-primary)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + delay }}
          >
            {displayVal}
          </motion.p>
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function CourseProgressCard({ item }) {
  const thumbnailUrl = item.course?.thumbnail ||
    `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=70`;

  return (
    <motion.div
      variants={itemVariants}
      className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border)] shadow-sm hover:shadow-md hover:shadow-indigo-500/5 transition-shadow duration-200"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
          <img src={thumbnailUrl} alt={item.course?.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-[var(--text-primary)] text-sm leading-snug line-clamp-1">
              {item.course?.title}
            </h3>
          </div>
          {item.course?.category && (
            <span className="inline-block text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full mb-2">
              {item.course.category}
            </span>
          )}
          <ProgressBar value={item.overallPercent} height="h-1.5" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.lastAccessedAt
                ? `Last: ${new Date(item.lastAccessedAt).toLocaleDateString()}`
                : 'Not started'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {item.overallPercent}%
              </span>
              <Link
                to={`/learn/${item.course?.slug}`}
                className="flex items-center gap-1 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 rounded-lg hover:opacity-90 transition-opacity"
              >
                Continue <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Weekly Goal progress ring
function WeeklyGoalRing({ completed, target }) {
  const percent = Math.min((completed / target) * 100, 100);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;

  return (
    <motion.div
      variants={itemVariants}
      className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-[var(--text-primary)]">Weekly Goal</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90">
            <circle cx="45" cy="45" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-700" />
            <motion.circle
              cx="45" cy="45" r={radius}
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - dash }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center rotate-0">
            <span className="text-lg font-extrabold text-[var(--text-primary)]">{completed}</span>
          </div>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] text-sm">{completed}/{target} lessons</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">this week</p>
          {completed >= target && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Goal reached!
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Learning Streak widget
function StreakWidget({ streakDays }) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Flame className="w-5 h-5 text-orange-500" />
        </motion.div>
        <h3 className="font-bold text-[var(--text-primary)]">Learning Streak</h3>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-extrabold text-[var(--text-primary)]">{streakDays}</span>
        <span className="text-[var(--text-muted)] text-sm mb-1">days in a row</span>
      </div>
      {streakDays > 0 ? (
        <p className="text-xs text-orange-500 dark:text-orange-400 mt-1 font-medium">Keep it up! 🔥</p>
      ) : (
        <p className="text-xs text-[var(--text-muted)] mt-1">Complete a lesson to start your streak</p>
      )}
    </motion.div>
  );
}

// Quiz Performance mini bar chart
function QuizChart({ quizResults }) {
  if (!quizResults || quizResults.length === 0) return null;

  return (
    <motion.div
      variants={itemVariants}
      className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-[var(--text-primary)]">Recent Quiz Scores</h3>
      </div>
      <div className="flex items-end gap-2 h-24">
        {quizResults.map((q, i) => {
          const height = `${Math.max(10, q.score)}%`;
          const color = q.score >= 70
            ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
            : q.score >= 50
            ? 'bg-gradient-to-t from-amber-500 to-amber-400'
            : 'bg-gradient-to-t from-red-400 to-red-300';
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-[var(--text-primary)]">{q.score}%</span>
              <motion.div
                className={`w-full rounded-t-lg ${color}`}
                style={{ maxWidth: '40px' }}
                initial={{ height: '0%' }}
                animate={{ height }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
              />
              <span className="text-[9px] text-[var(--text-muted)] text-center truncate w-full" style={{ maxWidth: '48px' }}>
                {q.courseTitle?.split(' ')[0] || 'Quiz'}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Recommended course card
function RecommendedCard({ course }) {
  const thumbnailUrl = course.thumbnail ||
    `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=70`;
  return (
    <div className="flex-shrink-0 w-52 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 transition-shadow">
      <div className="h-28 overflow-hidden">
        <img src={thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <p className="font-semibold text-[var(--text-primary)] text-sm line-clamp-2 mb-1 leading-snug">{course.title}</p>
        <p className="text-xs text-[var(--text-muted)] mb-2">{course.category}</p>
        <Link
          to={`/courses/${course.slug}`}
          className="block text-center bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-semibold py-1.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Enroll Now
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
  const firstName = user?.name?.split(' ')[0] || 'Learner';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 animate-gradient-shift">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div
            className="flex items-center gap-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-extrabold text-white">
                  Welcome back, {firstName}!
                </h1>
                <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">
                  {user?.role || 'Student'}
                </span>
              </div>
              <p className="text-indigo-100 text-sm">Keep up your learning streak!</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="w-5 h-5 text-orange-300" />
              </motion.div>
              <div>
                <p className="text-white font-extrabold text-lg leading-none">
                  {data?.streakDays || 0}
                </p>
                <p className="text-indigo-200 text-xs">day streak</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[var(--bg-card)] rounded-2xl h-24 skeleton-shimmer border border-[var(--border)]" />
              ))}
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[var(--bg-card)] rounded-2xl h-24 skeleton-shimmer border border-[var(--border)]" />
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-[var(--bg-card)] rounded-2xl h-32 skeleton-shimmer border border-[var(--border)]" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatCard icon={BookOpen} label="Enrolled Courses" value={data?.enrolledCourses?.length || 0} gradient="from-indigo-500 to-blue-500" delay={0} />
              <StatCard icon={TrendingUp} label="Completed" value={data?.completedCoursesCount || 0} gradient="from-emerald-500 to-teal-500" delay={0.05} />
              <StatCard icon={Award} label="Certificates" value={data?.certificatesCount || 0} gradient="from-amber-500 to-orange-500" delay={0.1} />
              <StatCard icon={Star} label="Avg Quiz Score" value={`${data?.totalQuizScore || 0}%`} gradient="from-blue-500 to-cyan-500" delay={0.15} />
            </div>

            {/* Streak + Weekly Goal row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              <StreakWidget streakDays={data?.streakDays || 0} />
              <WeeklyGoalRing
                completed={data?.weeklyGoal?.completed || 0}
                target={data?.weeklyGoal?.target || 5}
              />
              {data?.recentQuizResults?.length > 0 && (
                <QuizChart quizResults={data.recentQuizResults} />
              )}
            </div>

            {/* Recommended Courses */}
            {data?.recommendedCourses?.length > 0 && (
              <motion.div variants={itemVariants} className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Recommended for You</h2>
                  <Link to="/courses" className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
                    See all <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {data.recommendedCourses.map((course) => (
                    <RecommendedCard key={course._id} course={course} />
                  ))}
                </div>
              </motion.div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left: Courses + Activity */}
              <div className="lg:col-span-2 space-y-8">

                {/* My Courses */}
                <motion.div variants={itemVariants}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">My Courses</h2>
                    <Link to="/courses" className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
                      Browse more <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {data?.enrolledCourses?.length === 0 ? (
                    <div className="bg-[var(--bg-card)] rounded-2xl p-10 text-center border border-[var(--border)]">
                      <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-[var(--text-muted)] mb-4">No courses enrolled yet</p>
                      <Link
                        to="/courses"
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
                      >
                        Browse Courses
                      </Link>
                    </div>
                  ) : (
                    <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                      {data.enrolledCourses.map((item) => (
                        <CourseProgressCard key={item.course._id} item={item} />
                      ))}
                    </motion.div>
                  )}
                </motion.div>

                {/* Recent Activity */}
                {data?.recentActivity?.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Recent Activity</h2>
                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                      <div className="relative">
                        <div className="absolute left-[2.35rem] top-4 bottom-4 w-px bg-[var(--border)]" />

                        {data.recentActivity.slice(0, 6).map((activity, i) => {
                          const type = activity.type || 'lesson';
                          const cfg = activityTypeConfig[type] || activityTypeConfig.lesson;
                          const Icon = cfg.icon;
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.07 }}
                              className={`flex items-start gap-4 px-5 py-4 border-b border-[var(--border)] last:border-0 border-l-2 ${cfg.border} relative`}
                            >
                              <div className={`w-8 h-8 rounded-full ${cfg.color} flex items-center justify-center flex-shrink-0 z-10 ring-4 ring-[var(--bg-card)]`}>
                                <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                  {cfg.label}
                                </p>
                                <p className="text-xs text-[var(--text-muted)] truncate">{activity.courseTitle}</p>
                                {activity.score !== undefined && (
                                  <span className={`text-xs font-semibold ${activity.score >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    Score: {activity.score}%
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap pt-0.5">
                                {timeAgo(activity.completedAt)}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">

                {/* AI Insights Widget */}
                <motion.div
                  variants={itemVariants}
                  className="relative bg-[var(--bg-card)] rounded-2xl border-2 border-indigo-200 dark:border-indigo-700/60 p-5 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card) 100%)' }}
                >
                  {/* Gradient shimmer border effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 pointer-events-none" />

                  {/* AI Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                    <motion.span
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Sparkles className="w-3 h-3" />
                    </motion.span>
                    AI-Powered
                  </div>

                  <div className="relative z-10">
                    <h3 className="font-bold text-[var(--text-primary)] text-base mb-1">AI Insights</h3>
                    <p className="text-xs text-[var(--text-muted)] mb-4">Personalized tools to accelerate your learning</p>

                    <div className="space-y-2">
                      <Link
                        to="/ai/recommendations"
                        className="flex items-center gap-3 w-full bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-400 font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
                      >
                        <Target className="w-4 h-4 flex-shrink-0" />
                        Get Recommendations
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </Link>
                      <Link
                        to="/ai/skills"
                        className="flex items-center gap-3 w-full bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-950/60 border border-violet-200 dark:border-violet-700/50 text-violet-700 dark:text-violet-400 font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
                      >
                        <BarChart2 className="w-4 h-4 flex-shrink-0" />
                        My Skills
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </Link>
                      <Link
                        to="/ai/chat"
                        className="flex items-center gap-3 w-full bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 flex-shrink-0" />
                        Open Chat
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </Link>
                    </div>
                  </div>
                </motion.div>

                {/* Bookmarks shortcut */}
                {data?.recentBookmarks?.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-indigo-500" />
                        Recent Bookmarks
                      </h2>
                      <Link to="/bookmarks" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        View all
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {data.recentBookmarks.map((b, i) => (
                        <motion.div
                          key={b._id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border)] hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                        >
                          <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                            {b.lesson?.title || 'Unknown Lesson'}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                            {b.course?.title}
                          </p>
                          {b.course?.slug && b.lesson?._id && (
                            <Link
                              to={`/learn/${b.course.slug}?lesson=${b.lesson._id}`}
                              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline mt-1 inline-flex items-center gap-0.5"
                            >
                              Go to lesson <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Certificates */}
                <motion.div variants={itemVariants}>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Certificates</h2>
                  {data?.certificates?.length === 0 ? (
                    <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] text-center">
                      <Award className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-muted)]">Complete a course to earn certificates</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.certificates.map((cert, i) => (
                        <motion.div
                          key={cert.certificateId}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-2xl p-4 border-2 border-amber-200 dark:border-amber-700/50 overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
                              <Award className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <span className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Certificate Earned</span>
                              <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                                ID: {cert.certificateId?.slice(-8).toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mb-3">
                            Issued {new Date(cert.issuedAt).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            <Link
                              to={`/certificate/${cert.certificateId}`}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold text-xs py-2 rounded-xl hover:opacity-90 transition-opacity"
                            >
                              View
                            </Link>
                            <button className="flex items-center gap-1.5 bg-white/60 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 font-semibold text-xs py-2 px-3 rounded-xl hover:bg-white/80 dark:hover:bg-amber-900/50 transition-colors">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Keep Learning CTA */}
                <motion.div
                  variants={itemVariants}
                  className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-6 text-white overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 70% 30%, white 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} />
                  <div className="relative z-10">
                    <Zap className="w-7 h-7 text-yellow-300 mb-3" />
                    <h3 className="font-bold text-lg mb-1">Keep Learning</h3>
                    <p className="text-indigo-200 text-sm mb-4">Explore new courses and grow your skills.</p>
                    <Link
                      to="/courses"
                      className="flex items-center justify-between bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl px-4 py-3 transition-colors"
                    >
                      <span className="font-semibold text-sm">Browse All Courses</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
