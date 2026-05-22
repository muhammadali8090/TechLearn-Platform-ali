import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, ArrowLeft, Search, Clock, BookOpen, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAIRoadmap } from '../services/aiService';
import Navbar from '../components/Navbar';

const stepVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.4, 0, 0.2, 1] },
  }),
};

const levelColors = {
  beginner: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  intermediate: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  advanced: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400',
};

const goalExamples = [
  'become a full-stack developer',
  'become a data scientist',
  'build mobile apps',
  'learn AI and machine learning',
  'get into cybersecurity',
];

export default function AIRoadmap() {
  const [goal, setGoal] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const goalText = goal.trim() || 'become a full-stack developer';
    setLoading(true);
    try {
      const res = await getAIRoadmap(goalText);
      setRoadmap(res.data.data);
    } catch {
      toast.error('Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 70% 30%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/ai" className="inline-flex items-center gap-2 text-violet-200 hover:text-white transition-colors mb-4 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to AI Hub
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0">
              <Map className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">Learning Roadmap</h1>
              <p className="text-violet-200 mt-1">Get a personalized step-by-step path to your career goal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Goal Input */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 mb-8 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-violet-500" /> What's your learning goal?
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. become a full-stack developer"
              className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </form>

          {/* Example goals */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-[var(--text-muted)]">Try:</span>
            {goalExamples.map((ex) => (
              <button
                key={ex}
                onClick={() => setGoal(ex)}
                className="text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-950/50 px-2.5 py-1 rounded-full transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Roadmap Result */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-4" />
              <p className="text-[var(--text-muted)]">Building your personalized roadmap...</p>
            </motion.div>
          )}

          {!loading && roadmap && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Roadmap Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">{roadmap.roadmapTitle}</h2>
                  <p className="text-[var(--text-muted)] text-sm mt-1">Goal: <span className="font-medium text-[var(--text-primary)]">"{roadmap.goal}"</span></p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">{roadmap.totalWeeks}</p>
                  <p className="text-xs text-[var(--text-muted)]">total weeks</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500 via-purple-500 to-slate-300 dark:to-slate-700" />

                <div className="space-y-6">
                  {roadmap.steps.map((step, i) => {
                    const isCurrent = step.step === roadmap.currentStep;
                    const isCompleted = step.step < roadmap.currentStep;
                    return (
                      <motion.div
                        key={step.step}
                        custom={i}
                        variants={stepVariants}
                        initial="hidden"
                        animate="visible"
                        className="relative pl-16"
                      >
                        {/* Step circle */}
                        <div className={`absolute left-0 top-0 w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-sm z-10 ${
                          isCompleted
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                            : isCurrent
                            ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30'
                            : 'bg-[var(--bg-card)] border-2 border-[var(--border)] text-[var(--text-muted)]'
                        } ${isCurrent ? 'ring-4 ring-violet-500/30 ring-offset-2 ring-offset-[var(--bg-primary)]' : ''}`}>
                          {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.step}
                        </div>

                        {/* Card */}
                        <div className={`bg-[var(--bg-card)] rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
                          isCurrent
                            ? 'border-violet-400 dark:border-violet-600 shadow-violet-500/20 shadow-md'
                            : isCompleted
                            ? 'border-emerald-200 dark:border-emerald-800/50'
                            : 'border-[var(--border)]'
                        }`}>
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-[var(--text-primary)] text-base">{step.title}</h3>
                                {isCurrent && (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full animate-pulse">
                                    ● Current Step
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="w-3 h-3" /> Completed
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{step.description}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-3 py-1.5 rounded-full whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5" /> {step.estimatedWeeks}w
                            </div>
                          </div>

                          {/* Skills */}
                          {step.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {step.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="text-xs font-medium text-[var(--text-primary)] bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Suggested Courses */}
                          {step.suggestedCourses?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" /> Suggested courses
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {step.suggestedCourses.map((course) => (
                                  <Link
                                    key={course._id}
                                    to={`/courses/${course.slug}`}
                                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                                      levelColors[course.level] || levelColors.beginner
                                    } hover:opacity-80`}
                                  >
                                    {course.title}
                                    <ChevronRight className="w-3 h-3" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {!loading && !roadmap && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <Map className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-[var(--text-muted)]">Enter your goal above to generate a personalized roadmap</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
