import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, Star, StarHalf } from 'lucide-react';
import ProgressBar from './ProgressBar';

const levelColors = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

const categoryGradients = {
  'Web Dev': 'from-indigo-500 to-blue-500',
  'Data Science': 'from-purple-500 to-pink-500',
  'AI': 'from-emerald-500 to-teal-500',
  'Cybersecurity': 'from-red-500 to-orange-500',
  'Mobile': 'from-amber-500 to-yellow-500',
  'Python': 'from-blue-500 to-cyan-500',
};

const categoryTextColors = {
  'Web Dev': 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50',
  'Data Science': 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50',
  'AI': 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
  'Cybersecurity': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50',
  'Mobile': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
  'Python': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
};

function StarRating({ rating = 4.5 }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(full)].map((_, i) => (
        <Star key={`f-${i}`} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      ))}
      {half && <StarHalf className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
      {[...Array(empty)].map((_, i) => (
        <Star key={`e-${i}`} className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
      ))}
      <span className="text-xs font-semibold text-[var(--text-muted)] ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function CourseCard({ course, progress, onEnroll, isEnrolled, delay = 0 }) {
  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
  const hours = course.estimatedDuration ? Math.floor(course.estimatedDuration / 60) : 0;
  const mins = course.estimatedDuration ? course.estimatedDuration % 60 : 0;
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  const rating = course.rating || 4.5;
  const instructorInitial = course.instructor?.name?.[0]?.toUpperCase() || '?';
  const catGradient = categoryGradients[course.category] || 'from-slate-400 to-slate-600';
  const catTextColor = categoryTextColors[course.category] || 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';
  const isFree = course.price === 0 || course.isFree || !course.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4 }}
      className="group bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-shadow duration-300 overflow-hidden flex flex-col"
    >
      {/* Thumbnail */}
      <Link to={`/courses/${course.slug}`} className="block overflow-hidden">
        <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-700">
          <img
            src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80`}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Glassmorphism hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 backdrop-blur-[1px] bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* FREE badge */}
          {isFree && (
            <div className="absolute top-3 left-3">
              <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                FREE
              </span>
            </div>
          )}

          {/* Level badge */}
          <div className={`absolute ${isFree ? 'top-3 left-[3.5rem] ml-2' : 'top-3 left-3'}`}>
            <span className={`text-xs font-semibold px-2 py-1 rounded-lg backdrop-blur-sm ${levelColors[course.level] || 'bg-slate-100 text-slate-700'}`}>
              {course.level?.charAt(0).toUpperCase() + course.level?.slice(1)}
            </span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Category pill */}
        {course.category && (
          <div className="mb-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${catTextColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${catGradient}`} />
              {course.category}
            </span>
          </div>
        )}

        {/* Title */}
        <Link to={`/courses/${course.slug}`}>
          <h3 className="font-bold text-[var(--text-primary)] text-base leading-snug mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2">
            {course.title}
          </h3>
        </Link>

        {/* Instructor */}
        {course.instructor && (
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${catGradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {instructorInitial}
            </div>
            <p className="text-xs text-[var(--text-muted)]">by {course.instructor.name}</p>
          </div>
        )}

        {/* Star Rating */}
        <div className="mb-3">
          <StarRating rating={rating} />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-4 flex-wrap">
          {course.estimatedDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {durationStr}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {course.enrolledCount || 0}
          </span>
          {totalLessons > 0 && (
            <span className="text-[var(--text-muted)]">{totalLessons} lessons</span>
          )}
        </div>

        {/* Progress bar (enrolled) */}
        {isEnrolled && progress !== undefined && (
          <div className="mb-4">
            <ProgressBar value={progress} showLabel />
          </div>
        )}

        {/* CTA Button */}
        <div className="mt-auto">
          {isEnrolled ? (
            <Link
              to={`/learn/${course.slug}`}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm shadow-md shadow-indigo-500/20"
            >
              Continue Learning
            </Link>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onEnroll && onEnroll(course)}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity text-sm shadow-md shadow-indigo-500/20"
            >
              Enroll Free
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
