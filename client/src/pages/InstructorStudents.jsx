import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, ChevronDown, ChevronUp, Award, BookOpen } from 'lucide-react';
import { getAllStudents } from '../services/instructorPanelService';
import InstructorLayout from '../components/InstructorLayout';

function timeAgo(date) {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ProgressBar({ value, colorClass = 'bg-indigo-500' }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${value || 0}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[var(--text-primary)] w-9 text-right">{value || 0}%</span>
    </div>
  );
}

function StudentRow({ student, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="border-b border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {student.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[var(--text-primary)] text-sm">{student.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{student.email}</p>
            </div>
          </div>
        </td>
        <td className="px-5 py-3.5 text-center">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--text-primary)]">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            {student.enrolledCoursesCount}
          </span>
        </td>
        <td className="px-5 py-3.5 text-sm text-[var(--text-muted)] whitespace-nowrap">
          {timeAgo(student.lastActive)}
        </td>
        <td className="px-5 py-3.5 min-w-[140px]">
          <ProgressBar value={student.overallProgress} />
        </td>
        <td className="px-5 py-3.5 text-center">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
            <Award className="w-3.5 h-3.5" />
            {student.certificatesEarned}
          </span>
        </td>
        <td className="px-5 py-3.5 text-center">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
          )}
        </td>
      </motion.tr>

      {/* Expanded per-course breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <td colSpan={6} className="px-5 pb-4 pt-0 bg-slate-50 dark:bg-slate-800/30">
              <div className="pt-3 space-y-2">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                  Per-Course Breakdown
                </p>
                {(student.perCourse || []).length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No data</p>
                ) : (
                  student.perCourse.map((c) => (
                    <div key={c.courseId} className="flex items-center gap-4 bg-[var(--bg-card)] rounded-xl px-4 py-2.5 border border-[var(--border)]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{c.courseTitle}</p>
                        <p className="text-xs text-[var(--text-muted)]">Last accessed: {timeAgo(c.lastAccessedAt)}</p>
                      </div>
                      <div className="w-36">
                        <ProgressBar value={c.progress} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default function InstructorStudents() {
  const [data, setData] = useState({ students: [], courses: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  const fetchStudents = (params = {}) => {
    setLoading(true);
    getAllStudents(params)
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchStudents({ search: val, courseId: courseFilter });
  };

  const handleCourseFilter = (e) => {
    const val = e.target.value;
    setCourseFilter(val);
    fetchStudents({ search, courseId: val });
  };

  const { students, courses } = data;

  return (
    <InstructorLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Students</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {students.length} students across your courses
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>
          <select
            value={courseFilter}
            onChange={handleCourseFilter}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-indigo-400 transition-colors"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Student</th>
                  <th className="text-center px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Courses</th>
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Last Active</th>
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide min-w-[160px]">Overall Progress</th>
                  <th className="text-center px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Certs</th>
                  <th className="text-center px-5 py-3 text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border)]">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-[var(--text-muted)]">No students found</p>
                    </td>
                  </tr>
                ) : (
                  students.map((student, i) => (
                    <StudentRow key={student._id} student={student} index={i} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </InstructorLayout>
  );
}
