import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, Award, BarChart2, Plus, TrendingUp,
  Clock, CheckCircle, ArrowRight, Star,
} from 'lucide-react';
import { getDashboard } from '../services/instructorPanelService';
import { useAuth } from '../hooks/useAuth';
import InstructorLayout from '../components/InstructorLayout';

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
      else setCount(target);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  const count = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <TrendingUp className="w-4 h-4 text-emerald-500" />
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">
        {typeof value === 'number' ? count : value}
      </p>
      <p className="text-sm text-[var(--text-muted)] mt-0.5">{label}</p>
    </motion.div>
  );
}

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

const statusColors = {
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const recentActivity = data?.recentActivity || [];
  const topCourses = data?.topCourses || [];

  return (
    <InstructorLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl shadow-indigo-500/25"
        >
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.3))]" />
          <div className="relative z-10">
            <p className="text-indigo-200 text-sm font-medium mb-1">Instructor Panel</p>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              Welcome back, {user?.name?.split(' ')[0] || 'Instructor'} 👋
            </h1>
            <p className="text-indigo-200 text-sm">
              You have <span className="text-white font-semibold">{stats.totalCourses || 0} courses</span> with{' '}
              <span className="text-white font-semibold">{stats.totalStudents || 0} students</span> enrolled.
            </p>
          </div>
          <div className="absolute right-6 bottom-0 opacity-10 pointer-events-none">
            <BookOpen className="w-32 h-32" />
          </div>
        </motion.div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={BookOpen} label="Total Courses" value={stats.totalCourses || 0} color="bg-indigo-500" delay={0.05} />
            <StatCard icon={Users} label="Total Students" value={stats.totalStudents || 0} color="bg-violet-500" delay={0.1} />
            <StatCard icon={Award} label="Certificates Issued" value={stats.totalCertificates || 0} color="bg-amber-500" delay={0.15} />
            <StatCard
              icon={Star}
              label="Avg Quiz Score"
              value={`${stats.avgQuizScore || 0}%`}
              color="bg-emerald-500"
              delay={0.2}
            />
          </div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-wrap gap-3"
        >
          <Link
            to="/admin/courses/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-md shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            New Course
          </Link>
          <Link
            to="/instructor/students"
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl font-semibold text-sm hover:border-indigo-400 transition-colors"
          >
            <Users className="w-4 h-4" />
            View Students
          </Link>
          <Link
            to="/instructor/courses"
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl font-semibold text-sm hover:border-indigo-400 transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            My Courses
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="font-bold text-[var(--text-primary)]">Recent Activity</h2>
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
            <div className="divide-y divide-[var(--border)]">
              {recentActivity.length === 0 ? (
                <div className="py-10 text-center text-[var(--text-muted)] text-sm">
                  No recent activity
                </div>
              ) : (
                recentActivity.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        Enrolled in {item.courseTitle}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                      {timeAgo(item.enrolledAt)}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Top Courses */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="font-bold text-[var(--text-primary)]">Top Courses</h2>
              <Link to="/instructor/courses" className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : topCourses.length === 0 ? (
              <div className="py-10 text-center text-[var(--text-muted)] text-sm">
                No courses yet.{' '}
                <Link to="/admin/courses/new" className="text-indigo-500 font-semibold">
                  Create one
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {topCourses.map((course, i) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-slate-400 m-2.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {course.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--text-muted)]">{course.enrolled} students</span>
                        <span className="text-xs text-[var(--text-muted)]">·</span>
                        <span className="text-xs text-emerald-500">{course.completionRate}% done</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[course.status] || statusColors.draft}`}>
                        {course.status}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{course.avgQuizScore}% avg</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </InstructorLayout>
  );
}
