import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, LayoutGrid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCourses, enrollCourse } from '../services/courseService';
import { useAuth } from '../hooks/useAuth';
import CourseCard from '../components/CourseCard';
import SkeletonCard from '../components/SkeletonCard';
import Navbar from '../components/Navbar';

const categories = ['All', 'Web Dev', 'Data Science', 'Python', 'AI', 'Mobile', 'Cybersecurity'];
const levels = ['All', 'beginner', 'intermediate', 'advanced'];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function Courses() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (level !== 'All') params.level = level;
      const res = await getCourses(params);
      setCourses(res.data.data || []);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [category, level]);

  useEffect(() => {
    const timeout = setTimeout(fetchCourses, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleEnroll = async (course) => {
    if (!user) {
      toast.error('Please sign in to enroll');
      navigate('/auth');
      return;
    }
    try {
      await enrollCourse(course._id);
      await refreshUser();
      toast.success(`Enrolled in ${course.title}!`);
      navigate(`/learn/${course.slug}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to enroll';
      if (msg === 'Already enrolled') {
        navigate(`/learn/${course.slug}`);
      } else {
        toast.error(msg);
      }
    }
  };

  const enrolledIds = user?.enrolledCourses?.map((e) => e.courseId?.toString() || e.courseId) || [];
  const isEnrolled = (course) => enrolledIds.includes(course._id);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 animate-gradient-shift text-white py-16">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 25% 50%, white 1.5px, transparent 1.5px)',
          backgroundSize: '48px 48px'
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            className="text-4xl font-extrabold mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            All Courses
          </motion.h1>
          <motion.p
            className="text-indigo-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Explore our library of free programming courses
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <motion.div
          className="flex flex-col gap-4 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <motion.input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search courses..."
              animate={searchFocused ? {
                boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.25), 0 4px 20px rgba(99, 102, 241, 0.15)'
              } : {
                boxShadow: '0 0 0 0px rgba(99, 102, 241, 0)'
              }}
              transition={{ duration: 0.2 }}
              className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors"
            />
          </div>

          {/* Filter + View Toggle row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category pills */}
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Category:</span>
                {categories.map((c) => (
                  <motion.button
                    key={c}
                    onClick={() => setCategory(c)}
                    layout
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-3 py-1.5 rounded-full font-medium text-xs transition-colors ${
                      category === c
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    {c}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Level pills */}
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Level:</span>
                {levels.map((l) => (
                  <motion.button
                    key={l}
                    onClick={() => setLevel(l)}
                    layout
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1.5 rounded-full font-medium text-xs capitalize transition-colors ${
                      level === l
                        ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30'
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-600 dark:hover:text-violet-400'
                    }`}
                  >
                    {l}
                  </motion.button>
                ))}
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1 ml-auto sm:ml-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Count */}
        <motion.p
          className="text-sm text-[var(--text-muted)] mb-6"
          key={loading ? 'loading' : courses.length}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {loading ? 'Searching...' : `${courses.length} course${courses.length !== 1 ? 's' : ''} found`}
        </motion.p>

        {/* Grid / List */}
        {loading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'flex flex-col gap-4'
          }>
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-6xl mb-6"
            >
              📚
            </motion.div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No courses found</h3>
            <p className="text-[var(--text-muted)]">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'flex flex-col gap-4'
              }
            >
              {courses.map((course, i) => (
                <motion.div key={course._id} variants={itemVariants}>
                  {viewMode === 'list' ? (
                    /* List view: horizontal card */
                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-shadow duration-300 overflow-hidden flex gap-0">
                      <div className="w-40 sm:w-52 flex-shrink-0 overflow-hidden">
                        <img
                          src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=70'}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                          {course.category && (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full mb-2 inline-block">
                              {course.category}
                            </span>
                          )}
                          <h3 className="font-bold text-[var(--text-primary)] text-sm leading-snug mb-1 line-clamp-2">
                            {course.title}
                          </h3>
                          {course.instructor && (
                            <p className="text-xs text-[var(--text-muted)] mb-2">by {course.instructor.name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {isEnrolled(course) ? (
                            <button
                              onClick={() => navigate(`/learn/${course.slug}`)}
                              className="text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1.5 rounded-xl hover:opacity-90 transition-opacity"
                            >
                              Continue
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnroll(course)}
                              className="text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1.5 rounded-xl hover:opacity-90 transition-opacity"
                            >
                              Enroll Free
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <CourseCard
                      course={course}
                      isEnrolled={isEnrolled(course)}
                      onEnroll={handleEnroll}
                      delay={0}
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
