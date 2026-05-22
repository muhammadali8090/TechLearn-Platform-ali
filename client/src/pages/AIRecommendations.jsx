import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Sparkles, ArrowLeft, BookOpen, Users, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAIRecommendations } from '../services/aiService';
import Navbar from '../components/Navbar';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
      <div className="h-44 skeleton-shimmer" />
      <div className="p-5 space-y-3">
        <div className="h-4 skeleton-shimmer rounded-lg w-3/4" />
        <div className="h-3 skeleton-shimmer rounded-lg w-1/2" />
        <div className="h-3 skeleton-shimmer rounded-lg w-full" />
        <div className="h-3 skeleton-shimmer rounded-lg w-5/6" />
        <div className="h-8 skeleton-shimmer rounded-xl mt-4" />
      </div>
    </div>
  );
}

const levelColors = {
  beginner: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  intermediate: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  advanced: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400',
};

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'from-emerald-500 to-teal-500' : score >= 60 ? 'from-blue-500 to-indigo-500' : 'from-indigo-500 to-violet-500';
  return (
    <div className={`absolute top-3 right-3 bg-gradient-to-r ${color} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1`}>
      <Sparkles className="w-3 h-3" /> {score}% match
    </div>
  );
}

export default function AIRecommendations() {
  const [courses, setCourses] = useState([]);
  const [reasoning, setReasoning] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAIRecommendations()
      .then((r) => {
        setCourses(r.data.data.courses);
        setReasoning(r.data.data.reasoning);
      })
      .catch(() => toast.error('Failed to load recommendations'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/ai" className="inline-flex items-center gap-2 text-indigo-200 hover:text-white transition-colors mb-4 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to AI Hub
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">Smart Recommendations</h1>
              <p className="text-indigo-200 mt-1">AI-curated courses matched to your learning profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Reasoning pill */}
        {!loading && reasoning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-700/50 rounded-2xl px-5 py-4 mb-8"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-0.5">Why these courses?</p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">{reasoning}</p>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No recommendations yet</h3>
            <p className="text-[var(--text-muted)] mb-6">Enroll in a few courses first so our AI can learn your preferences.</p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Browse Courses <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {courses.map((course) => (
              <motion.div
                key={course._id}
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                {/* Thumbnail */}
                <div className="relative h-44 overflow-hidden bg-slate-200 dark:bg-slate-700">
                  <img
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=70'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <ScoreBadge score={course.aiScore} />
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
                      {course.category}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${levelColors[course.level] || levelColors.beginner}`}>
                      {course.level}
                    </span>
                  </div>

                  <h3 className="font-bold text-[var(--text-primary)] text-base leading-snug mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Tags */}
                  {course.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {course.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs text-[var(--text-muted)] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Users className="w-3.5 h-3.5" />
                      {(course.enrolledCount || 0).toLocaleString()} enrolled
                    </div>
                  </div>

                  <Link
                    to={`/courses/${course.slug}`}
                    className="mt-4 flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
                  >
                    View Course <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
