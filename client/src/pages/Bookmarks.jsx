import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, BookOpen, Trash2, ExternalLink, StickyNote, ChevronRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBookmarks, removeBookmark } from '../services/userService';
import Navbar from '../components/Navbar';

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function Bookmarks() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    getBookmarks()
      .then((r) => setBookmarks(r.data.data))
      .catch(() => toast.error('Failed to load bookmarks'))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (bookmarkId) => {
    setRemovingId(bookmarkId);
    // Optimistic
    setBookmarks((prev) => prev.filter((b) => b._id !== bookmarkId));
    try {
      await removeBookmark(bookmarkId);
      toast.success('Bookmark removed');
    } catch {
      toast.error('Failed to remove bookmark');
      // Re-fetch on error
      getBookmarks().then((r) => setBookmarks(r.data.data)).catch(() => {});
    } finally {
      setRemovingId(null);
    }
  };

  // Group by course
  const grouped = bookmarks.reduce((acc, b) => {
    const courseId = b.course?._id || 'unknown';
    if (!acc[courseId]) {
      acc[courseId] = { course: b.course, bookmarks: [] };
    }
    acc[courseId].bookmarks.push(b);
    return acc;
  }, {});

  const groupedArray = Object.values(grouped);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">My Bookmarks</h1>
              <p className="text-indigo-200 text-sm mt-0.5">
                {bookmarks.length} saved lesson{bookmarks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[var(--bg-card)] rounded-2xl h-36 skeleton-shimmer border border-[var(--border)]" />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-9 h-9 text-slate-300 dark:text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">No bookmarks yet</h2>
            <p className="text-[var(--text-muted)] mb-6">
              While learning a lesson, click the bookmark icon to save it here.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              <BookOpen className="w-4 h-4" />
              Browse Courses
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {groupedArray.map(({ course, bookmarks: courseBookmarks }) => (
              <motion.div key={course?._id || 'unknown'} variants={itemVariants}>
                {/* Course header */}
                <div className="flex items-center gap-3 mb-3">
                  {course?.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-[var(--text-primary)] text-base truncate">
                      {course?.title || 'Unknown Course'}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {courseBookmarks.length} bookmark{courseBookmarks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {courseBookmarks.map((bookmark) => (
                    <AnimatePresence key={bookmark._id}>
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 hover:shadow-md hover:shadow-indigo-500/5 transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bookmark className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[var(--text-primary)] text-sm">
                              {bookmark.lesson?.title || 'Unknown Lesson'}
                            </h3>
                            {bookmark.note && (
                              <div className="flex items-start gap-1.5 mt-2">
                                <StickyNote className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-[var(--text-muted)] italic line-clamp-2">
                                  {bookmark.note}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                <Clock className="w-3 h-3" />
                                {timeAgo(bookmark.savedAt)}
                              </span>
                              {course?.slug && bookmark.lesson?._id && (
                                <Link
                                  to={`/learn/${course.slug}?lesson=${bookmark.lesson._id}`}
                                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  Go to lesson
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemove(bookmark._id)}
                            disabled={removingId === bookmark._id}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 flex-shrink-0 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
