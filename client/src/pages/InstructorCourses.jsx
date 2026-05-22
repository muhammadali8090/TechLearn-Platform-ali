import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, BookOpen, Users, BarChart2, Edit3, Trash2,
  AlertCircle, X, Search, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCourses } from '../services/instructorPanelService';
import InstructorLayout from '../components/InstructorLayout';
import api from '../utils/api';

const statusColors = {
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const levelColors = {
  beginner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  intermediate: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function ConfirmModal({ course, onConfirm, onCancel, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-sm border border-[var(--border)] shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <button onClick={onCancel} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Course</h3>
        <p className="text-sm text-[var(--text-muted)] mb-5">
          Are you sure you want to delete <span className="font-semibold text-[var(--text-primary)]">{course?.title}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CourseCard({ course, onDelete, index }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-slate-400" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {/* Status badge */}
        <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[course.status] || statusColors.draft}`}>
          {course.status}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-[var(--text-primary)] text-sm leading-snug line-clamp-2 flex-1">
            {course.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-medium">
            {course.category}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[course.level] || levelColors.beginner}`}>
            {course.level}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-4">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {course.enrolledCount} students
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {course.lessonCount} lessons
          </span>
          {course.completionRate > 0 && (
            <span className="flex items-center gap-1 text-emerald-500">
              {course.completionRate}% done
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/courses/${course._id}/edit`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </Link>
          <Link
            to={`/instructor/courses/${course._id}/analytics`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-xl text-xs font-semibold transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Analytics
          </Link>
          <button
            onClick={() => onDelete(course)}
            className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getCourses()
      .then((res) => setCourses(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/courses/${deleteTarget._id}`);
      setCourses((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      toast.success('Course deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = courses.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Courses</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{courses.length} courses total</p>
          </div>
          <Link
            to="/admin/courses/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-md shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </Link>
        </motion.div>

        {/* Filters + Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 gap-1">
            {['all', 'published', 'draft'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  filter === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] animate-pulse h-72" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-[var(--text-muted)] font-medium">
              {search || filter !== 'all' ? 'No courses match your filters' : 'No courses yet'}
            </p>
            {!search && filter === 'all' && (
              <Link to="/admin/courses/new" className="mt-3 inline-flex items-center gap-1.5 text-indigo-500 font-semibold text-sm hover:text-indigo-600">
                <Plus className="w-4 h-4" /> Create your first course
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((course, i) => (
              <CourseCard
                key={course._id}
                course={course}
                index={i}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmModal
            course={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </InstructorLayout>
  );
}
