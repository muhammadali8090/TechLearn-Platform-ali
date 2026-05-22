import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart2, ArrowLeft, Star, AlertCircle, TrendingUp, TrendingDown, Minus, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAISkills } from '../services/aiService';
import Navbar from '../components/Navbar';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

const levelConfig = {
  Beginner: { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700', bar: 'from-slate-400 to-slate-500' },
  Intermediate: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40', bar: 'from-blue-400 to-blue-500' },
  Advanced: { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/40', bar: 'from-violet-400 to-violet-500' },
  Expert: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40', bar: 'from-amber-400 to-orange-500' },
};

function TrendIcon({ trend }) {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

function TrendLabel({ trend }) {
  if (trend === 'improving') return <span className="text-xs text-emerald-500 font-medium">↑ Improving</span>;
  if (trend === 'declining') return <span className="text-xs text-red-400 font-medium">↓ Declining</span>;
  return <span className="text-xs text-slate-400 font-medium">→ Stable</span>;
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-5 skeleton-shimmer rounded w-32" />
        <div className="h-5 skeleton-shimmer rounded-full w-20" />
      </div>
      <div className="h-2 skeleton-shimmer rounded-full" />
      <div className="flex justify-between">
        <div className="h-4 skeleton-shimmer rounded w-24" />
        <div className="h-4 skeleton-shimmer rounded w-16" />
      </div>
    </div>
  );
}

function SkillCard({ skill, index }) {
  const cfg = levelConfig[skill.level] || levelConfig.Beginner;

  return (
    <motion.div
      variants={itemVariants}
      custom={index}
      className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 hover:shadow-md hover:shadow-indigo-500/5 transition-shadow duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[var(--text-primary)] text-base">{skill.name}</h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color} ${cfg.bg}`}>
          {skill.level}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-3">
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${cfg.bar}`}
          initial={{ width: '0%' }}
          animate={{ width: `${skill.score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold text-[var(--text-primary)]">{skill.score}%</span>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">{skill.lessonsCompleted} lessons</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendIcon trend={skill.trend} />
          <TrendLabel trend={skill.trend} />
        </div>
      </div>
    </motion.div>
  );
}

function WeeklyChart({ data }) {
  const maxLessons = Math.max(...data.map((d) => d.lessonsCompleted), 1);

  return (
    <motion.div
      variants={itemVariants}
      className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6"
    >
      <h3 className="font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-indigo-500" />
        Weekly Activity
      </h3>
      <div className="flex items-end gap-3 h-32">
        {data.map((day, i) => {
          const height = maxLessons > 0 ? `${Math.max(8, (day.lessonsCompleted / maxLessons) * 100)}%` : '8%';
          const hasActivity = day.lessonsCompleted > 0;
          return (
            <div key={day.week} className="flex-1 flex flex-col items-center gap-2">
              {hasActivity && (
                <span className="text-xs font-bold text-[var(--text-primary)]">{day.lessonsCompleted}</span>
              )}
              <div className="w-full flex items-end" style={{ height: '80px' }}>
                <motion.div
                  className={`w-full rounded-t-xl ${
                    hasActivity
                      ? 'bg-gradient-to-t from-indigo-500 to-violet-400'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  initial={{ height: '0%' }}
                  animate={{ height }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)]">{day.week}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-indigo-500 to-violet-400" />
          Lessons completed
        </div>
      </div>
    </motion.div>
  );
}

export default function AISkillTracker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAISkills()
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Failed to load skills'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-600 to-rose-600">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
          backgroundSize: '35px 35px'
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/ai" className="inline-flex items-center gap-2 text-pink-200 hover:text-white transition-colors mb-4 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to AI Hub
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">Skill Tracker</h1>
              <p className="text-pink-200 mt-1">Visualize your skill growth and learning progress</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {loading ? (
          <div className="space-y-6">
            {/* Hero skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-24 skeleton-shimmer rounded-2xl border border-[var(--border)]" />
              <div className="h-24 skeleton-shimmer rounded-2xl border border-[var(--border)]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : !data || data.skills.length === 0 ? (
          <div className="text-center py-20">
            <BarChart2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No skills tracked yet</h3>
            <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
              Complete lessons and quizzes to start building your skill profile.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

            {/* Hero insights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.strongestSkill && (
                <motion.div
                  variants={itemVariants}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-2xl border border-amber-200 dark:border-amber-700/50 p-5 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Strongest Skill</p>
                    <p className="text-xl font-extrabold text-amber-800 dark:text-amber-300">{data.strongestSkill}</p>
                  </div>
                </motion.div>
              )}
              {data.improvementArea && data.improvementArea !== data.strongestSkill && (
                <motion.div
                  variants={itemVariants}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-2xl border border-blue-200 dark:border-blue-700/50 p-5 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Focus Area</p>
                    <p className="text-xl font-extrabold text-blue-800 dark:text-blue-300">{data.improvementArea}</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Skills grid */}
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Your Skills
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.skills.map((skill, i) => (
                  <SkillCard key={skill.name} skill={skill} index={i} />
                ))}
              </div>
            </div>

            {/* Level Legend */}
            <motion.div variants={itemVariants} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
              <h3 className="font-bold text-[var(--text-primary)] mb-4 text-sm">Level Guide</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(levelConfig).map(([level, cfg]) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color} ${cfg.bg}`}>{level}</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {level === 'Beginner' ? '0–39%' : level === 'Intermediate' ? '40–69%' : level === 'Advanced' ? '70–89%' : '90–100%'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Weekly chart */}
            {data.weeklyProgress && <WeeklyChart data={data.weeklyProgress} />}

          </motion.div>
        )}
      </div>
    </div>
  );
}
